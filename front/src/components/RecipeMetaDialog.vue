<script setup>
import { ref, computed, watch } from 'vue'
import { useRecipesStore } from '../stores/recipes'
import { X } from 'lucide-vue-next'

const props = defineProps({
  recipe: { type: Object, default: null }
})
const emit = defineEmits(['close', 'saved'])

const store = useRecipesStore()

const isNew = computed(() => !props.recipe)

const name = ref('')
const emoji = ref('🍝')
const description = ref('')
const servings = ref('')
const prepMinutes = ref('')
const cookMinutes = ref('')
const source = ref('')
const tags = ref(new Set())
const newTag = ref('')

const EMOJIS = ['🍳', '🥘', '🍝', '🍲', '🥗', '🍛', '🥐', '🍰', '🐟', '🍗', '🥖', '🫕']

const RECIPE_TAGS = [
  'plats', 'desserts', 'entrées', 'soupes', 'salades', 'petit-déjeuner', 'brunch',
  'vegan', 'végétarien', 'sans gluten', 'sans lactose',
  'express', 'batch-cooking', 'four', 'wok', 'cocotte-minute', 'barbecue',
  'pâtes', 'riz', 'légumes', 'fruits', 'poisson', 'viande', 'fromage', 'gourmand'
]

const allTags = computed(() => {
  const used = new Set(store.recipes.flatMap((r) => r.tags ?? []))
  return [...new Set([...RECIPE_TAGS, ...used])]
})

watch(
  () => props.recipe,
  (r) => {
    name.value = r?.name ?? ''
    emoji.value = r?.emoji ?? '🍝'
    description.value = r?.description ?? ''
    servings.value = r?.servings ?? ''
    prepMinutes.value = r?.prepMinutes ?? ''
    cookMinutes.value = r?.cookMinutes ?? ''
    source.value = r?.source ?? ''
    tags.value = new Set(r?.tags ?? [])
    newTag.value = ''
  },
  { immediate: true }
)

function toggleTag(tag) {
  const next = new Set(tags.value)
  if (next.has(tag)) next.delete(tag)
  else next.add(tag)
  tags.value = next
}

function addCustomTag() {
  const value = newTag.value.trim().toLowerCase()
  if (!value || tags.value.has(value)) {
    newTag.value = ''
    return
  }
  const next = new Set(tags.value)
  next.add(value)
  tags.value = next
  newTag.value = ''
}

async function submit() {
  if (!name.value.trim()) return
  const payload = {
    name: name.value.trim(),
    emoji: emoji.value,
    description: description.value.trim(),
    servings: servings.value === '' ? null : Number(servings.value),
    prepMinutes: prepMinutes.value === '' ? null : Number(prepMinutes.value),
    cookMinutes: cookMinutes.value === '' ? null : Number(cookMinutes.value),
    source: source.value.trim() || null,
    tags: [...tags.value]
  }
  const saved = isNew.value
    ? await store.createRecipe({
        ...payload,
        sections: [
          { name: 'Produits frais', items: [] },
          { name: 'Épicerie', items: [] }
        ],
        steps: []
      })
    : await store.updateRecipe(props.recipe.id, payload)
  emit('saved', saved)
  emit('close')
}
</script>

<template>
  <div class="overlay" @click.self="emit('close')">
    <div class="dialog">
      <div class="dialog-head">
        <span class="font-mono dialog-title">
          {{ isNew ? 'Nouvelle recette' : 'Modifier la recette' }}
        </span>
        <button class="icon-btn" aria-label="Fermer" @click="emit('close')"><X :size="18" /></button>
      </div>
      <form @submit.prevent="submit">
        <span class="field-label">Emoji</span>
        <div class="emoji-row">
          <button
            v-for="e in EMOJIS"
            :key="e"
            type="button"
            class="emoji-choice"
            :class="{ active: emoji === e }"
            @click="emoji = e"
          >
            {{ e }}
          </button>
        </div>
        <label class="field-label" for="recipe-name">Nom de la recette</label>
        <input id="recipe-name" v-model="name" class="input" type="text" placeholder="Ex : Pâtes carbonara" required />
        <label class="field-label" for="recipe-desc">Description</label>
        <input id="recipe-desc" v-model="description" class="input" type="text" placeholder="Quelques mots sur le plat" />
        <label class="field-label" for="recipe-servings">Nombre de personnes</label>
        <input id="recipe-servings" v-model="servings" class="input" type="number" min="1" placeholder="Ex : 4" />
        <div class="two-col">
          <div>
            <label class="field-label" for="recipe-prep">Préparation (min)</label>
            <input id="recipe-prep" v-model="prepMinutes" class="input" type="number" min="0" placeholder="Ex : 15" />
          </div>
          <div>
            <label class="field-label" for="recipe-cook">Cuisson (min)</label>
            <input id="recipe-cook" v-model="cookMinutes" class="input" type="number" min="0" placeholder="Ex : 30" />
          </div>
        </div>
        <label class="field-label" for="recipe-source">Source / lien</label>
        <input id="recipe-source" v-model="source" class="input" type="text" placeholder="Ex : Marmiton, livre, URL…" />
        <span class="field-label">Tags</span>
        <div class="tags-row">
          <button
            v-for="tag in allTags"
            :key="tag"
            type="button"
            class="tag-chip"
            :class="{ active: tags.has(tag) }"
            @click="toggleTag(tag)"
          >
            {{ tag }}
          </button>
        </div>
        <div class="new-tag-row">
          <input
            v-model="newTag"
            class="input"
            type="text"
            placeholder="Nouveau tag (ex : monde, batch-cooking…)"
            @keydown.enter.prevent="addCustomTag"
          />
          <button type="button" class="tag-add-btn" :disabled="!newTag.trim()" @click="addCustomTag">+</button>
        </div>
        <button type="submit" class="submit">
          {{ isNew ? 'Créer' : 'Enregistrer' }}
        </button>
      </form>
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
  max-height: 85vh;
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
.icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 0.5rem;
  color: var(--ink-muted);
}
.field-label {
  display: block;
  margin: 0.35rem 0 0.25rem 0.15rem;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--ink-muted);
}
.input {
  width: 100%;
  padding: 0.6rem 0.75rem;
  border: 1px solid var(--line);
  border-radius: 0.7rem;
  background: var(--bg-2);
  color: var(--ink);
  outline: none;
  margin-bottom: 0.5rem;
}
.input:focus {
  border-color: var(--accent-dim);
}
.two-col {
  display: flex;
  gap: 0.5rem;
}
.two-col > div {
  flex: 1;
  min-width: 0;
}
.emoji-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-bottom: 0.6rem;
}
.emoji-choice {
  width: 2.1rem;
  height: 2.1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  border: 1px solid var(--line);
  border-radius: 0.6rem;
}
.emoji-choice.active {
  border-color: var(--accent);
  background: var(--accent-deep);
}
.tags-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin: 0.25rem 0 0.5rem;
}
.tag-chip {
  padding: 0.35rem 0.7rem;
  font-size: 0.78rem;
  font-weight: 600;
  border: 1px solid var(--line);
  border-radius: 0.55rem;
  color: var(--ink-muted);
}
.tag-chip.active {
  border-color: var(--accent);
  color: var(--accent);
  background: var(--accent-deep);
}
.new-tag-row {
  display: flex;
  gap: 0.4rem;
  align-items: stretch;
  margin-bottom: 0.6rem;
}
.new-tag-row .input {
  flex: 1;
  margin-bottom: 0;
}
.tag-add-btn {
  width: 2.6rem;
  flex-shrink: 0;
  border: 1px dashed var(--line-bright);
  border-radius: 0.7rem;
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--accent);
}
.tag-add-btn:disabled {
  opacity: 0.4;
}
.submit {
  width: 100%;
  padding: 0.65rem;
  margin-top: 0.3rem;
  border-radius: 0.7rem;
  background: var(--accent);
  color: #fff;
  font-weight: 700;
  font-size: 0.9rem;
}
</style>
