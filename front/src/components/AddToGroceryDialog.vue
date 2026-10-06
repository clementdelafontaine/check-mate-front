<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRecipesStore } from '../stores/recipes'
import { useChecklistsStore } from '../stores/checklists'
import { useUndoToast } from '../composables/useUndoToast'
import AddCard from './AddCard.vue'
import { X } from 'lucide-vue-next'

const props = defineProps({
  title: { type: String, default: 'Ajouter à une liste de courses' },
  recipes: { type: Array, default: () => [] },
  mode: { type: String, default: 'recipes' },
  range: { type: Object, default: null }
})
const emit = defineEmits(['close', 'added'])

const recipesStore = useRecipesStore()
const checklists = useChecklistsStore()
const toast = useUndoToast()

const groceryLists = computed(() =>
  checklists.lists.filter((l) => l.type === 'grocery')
)
const selected = ref(new Set())
const busy = ref(false)
const error = ref('')

const ingredientRows = computed(() => {
  const rows = []
  const seen = new Set()
  const push = (section, item) => {
    if (!item?.id || seen.has(item.id)) return
    seen.add(item.id)
    rows.push({
      key: item.id,
      label: item.label,
      quantity: item.quantity ?? null
    })
  }
  if (props.mode === 'recipes') {
    for (const recipe of props.recipes) {
      for (const section of recipe.sections ?? []) {
        for (const item of section.items ?? []) push(section, item)
      }
    }
  } else {
    const plans = recipesStore.mealPlans.filter(
      (p) =>
        (!props.range?.from || p.date >= props.range.from) &&
        (!props.range?.to || p.date <= props.range.to) &&
        (!props.range?.planIds || props.range.planIds.includes(p.id))
    )
    for (const plan of plans) {
      const recipe = recipesStore.recipeById(plan.recipeId)
      if (!recipe) continue
      for (const section of recipe.sections ?? []) {
        for (const item of section.items ?? []) push(section, item)
      }
    }
  }
  return rows
})

const checkedIngredients = ref(new Set())

function toggleIngredient(key) {
  const next = new Set(checkedIngredients.value)
  if (next.has(key)) next.delete(key)
  else next.add(key)
  checkedIngredients.value = next
}

function toggle(id) {
  const next = new Set(selected.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  selected.value = next
}

async function push() {
  if (!selected.value.size) return
  busy.value = true
  error.value = ''
  try {
    const itemIds =
      checkedIngredients.value.size === ingredientRows.value.length
        ? null
        : [...checkedIngredients.value]
    for (const listId of selected.value) {
      if (props.mode === 'recipes') {
        for (const recipe of props.recipes) {
          await recipesStore.addRecipeToList(recipe.id, listId, itemIds)
        }
      } else {
        await recipesStore.addMealPlansToList(listId, { ...(props.range ?? {}), itemIds })
      }
    }
    const n = selected.value.size
    toast.show(`Ingrédients ajoutés à ${n} liste${n > 1 ? 's' : ''} de courses`)
    emit('added')
    emit('close')
  } catch (e) {
    error.value = e.message ?? 'Erreur'
  } finally {
    busy.value = false
  }
}

onMounted(() => {
  checklists.init?.()
  checkedIngredients.value = new Set(ingredientRows.value.map((r) => r.key))
})
</script>

<template>
  <div class="overlay" @click.self="emit('close')">
    <div class="dialog">
      <div class="dialog-head">
        <span class="font-mono dialog-title">{{ title }}</span>
        <button class="icon-btn" aria-label="Fermer" @click="emit('close')">
          <X :size="18" />
        </button>
      </div>
      <p v-if="!groceryLists.length" class="empty">
        Aucune liste de courses. Créez-en une dans « Mes listes » (type Courses).
      </p>
      <div v-if="ingredientRows.length" class="ingredients-block">
        <span class="font-mono block-label">Ingrédients</span>
        <ul class="ingredients">
          <li v-for="row in ingredientRows" :key="row.key">
            <button
              class="ingredient-row"
              :class="{ active: checkedIngredients.has(row.key) }"
              @click="toggleIngredient(row.key)"
            >
              <span class="checkbox" :class="{ checked: checkedIngredients.has(row.key) }">
                <span v-if="checkedIngredients.has(row.key)">✓</span>
              </span>
              <span class="ingredient-label">{{ row.label }}</span>
              <span v-if="row.quantity" class="ingredient-qty font-mono">{{ row.quantity }}</span>
            </button>
          </li>
        </ul>
      </div>
      <ul v-if="groceryLists.length" class="options">
        <li v-for="list in groceryLists" :key="list.id">
          <button class="option" :class="{ active: selected.has(list.id) }" @click="toggle(list.id)">
            <span class="emoji">{{ list.emoji }}</span>
            <span class="name">{{ list.name }}</span>
            <span v-if="list.isShared" class="shared-tag">partagée</span>
            <span class="check">{{ selected.has(list.id) ? '✓' : '' }}</span>
          </button>
        </li>
      </ul>
      <p v-if="error" class="error">{{ error }}</p>
      <button class="submit" :disabled="!selected.size || busy" @click="push">
        {{ busy ? 'Ajout en cours…' : `Ajouter à ${selected.size} liste${selected.size > 1 ? 's' : ''}` }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(2px);
}
.dialog {
  width: min(22rem, 100%);
  max-height: calc(100dvh - 3rem);
  overflow-y: auto;
  border: 1px solid var(--line);
  border-radius: 1rem;
  background: var(--bg-1);
  padding: 1.1rem;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.6);
}
.dialog-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}
.dialog-title {
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--ink-muted);
}
.ingredients-block {
  margin-bottom: 0.9rem;
}
.block-label {
  display: block;
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--ink-faint);
  margin-bottom: 0.4rem;
}
.ingredients {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  max-height: 12rem;
  overflow-y: auto;
}
.ingredient-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  width: 100%;
  padding: 0.45rem 0.55rem;
  border: 1px solid var(--line);
  border-radius: 0.6rem;
  background: var(--bg-2);
  text-align: left;
}
.ingredient-row.active {
  border-color: var(--accent-dim);
}
.checkbox {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.2rem;
  height: 1.2rem;
  flex-shrink: 0;
  border: 1px solid var(--line-bright);
  border-radius: 0.35rem;
  color: #fff;
  font-size: 0.75rem;
  font-weight: 800;
}
.checkbox.checked {
  border-color: var(--accent);
  background: var(--accent);
}
.ingredient-label {
  flex: 1;
  font-size: 0.85rem;
}
.ingredient-qty {
  font-size: 0.72rem;
  color: var(--ink-muted);
}
.options {
  list-style: none;
  margin: 0 0 0.9rem;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  max-height: 15rem;
  overflow-y: auto;
}
.option {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  width: 100%;
  padding: 0.6rem 0.7rem;
  border: 1px solid var(--line);
  border-radius: 0.7rem;
  background: var(--bg-2);
  text-align: left;
}
.option.active {
  border-color: var(--accent-dim);
  background: var(--accent-deep);
}
.emoji {
  font-size: 1.1rem;
}
.name {
  flex: 1;
  font-weight: 600;
  font-size: 0.9rem;
}
.check {
  color: var(--accent);
  font-weight: 800;
}
.shared-tag {
  padding: 0.15rem 0.5rem;
  border: 1px solid var(--accent-dim);
  border-radius: 999px;
  color: var(--accent);
  font-size: 0.6rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.empty {
  color: var(--ink-faint);
  font-size: 0.85rem;
  margin-bottom: 0.8rem;
}
.error {
  color: var(--danger, #e5484d);
  font-size: 0.8rem;
  margin-bottom: 0.5rem;
}
.submit {
  width: 100%;
  padding: 0.65rem;
  margin-top: 0.4rem;
  border-radius: 0.7rem;
  background: var(--accent);
  color: #fff;
  font-weight: 700;
  font-size: 0.9rem;
}
.submit:disabled {
  opacity: 0.45;
}
</style>
