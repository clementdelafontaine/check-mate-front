<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useRecipesStore } from '../stores/recipes'
import { useUndoToast } from '../composables/useUndoToast'
import AddToGroceryDialog from '../components/AddToGroceryDialog.vue'
import { Plus, X, Trash2, CalendarPlus } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const store = useRecipesStore()
const toast = useUndoToast()

const recipe = computed(() => store.recipeById(route.params.id))
const editing = ref(false)
const showGrocery = ref(false)
const showPlan = ref(false)
const planDate = ref(new Date().toISOString().slice(0, 10))
const planMeal = ref('dinner')

const newSectionName = ref('')
const newItemLabel = ref('')
const newItemQuantity = ref('')
const activeSection = ref(null)
const newStep = ref('')

async function addIngredient() {
  const label = newItemLabel.value.trim()
  if (!label || !recipe.value) return
  const sections = recipe.value.sections.map((s) => ({
    ...s,
    items: s.items.map((i) => ({ ...i }))
  }))
  const section =
    activeSection.value != null && sections[activeSection.value]
      ? sections[activeSection.value]
      : sections[0]
  section.items.push({
    id: null,
    label,
    quantity: newItemQuantity.value.trim() || null
  })
  await store.updateRecipe(recipe.value.id, { sections })
  newItemLabel.value = ''
  newItemQuantity.value = ''
}

async function removeIngredient(si, ii) {
  if (!recipe.value) return
  const sections = recipe.value.sections.map((s) => ({
    ...s,
    items: s.items.map((i) => ({ ...i }))
  }))
  sections[si].items.splice(ii, 1)
  await store.updateRecipe(recipe.value.id, { sections })
}

async function addSection() {
  const name = newSectionName.value.trim()
  if (!name || !recipe.value) return
  const sections = recipe.value.sections.map((s) => ({
    ...s,
    items: s.items.map((i) => ({ ...i }))
  }))
  sections.push({ id: null, name, items: [] })
  await store.updateRecipe(recipe.value.id, { sections })
  newSectionName.value = ''
}

async function addStep() {
  const text = newStep.value.trim()
  if (!text || !recipe.value) return
  await store.updateRecipe(recipe.value.id, {
    steps: [...recipe.value.steps.map((s) => s.text), text]
  })
  newStep.value = ''
}

async function removeStep(idx) {
  if (!recipe.value) return
  await store.updateRecipe(recipe.value.id, {
    steps: recipe.value.steps.filter((_, i) => i !== idx).map((s) => s.text)
  })
}

async function plan() {
  if (!recipe.value) return
  try {
    await store.planMeal({
      date: planDate.value,
      meal: planMeal.value,
      recipeId: recipe.value.id
    })
    toast.show('Repas planifié')
    showPlan.value = false
  } catch (e) {
    toast.show(e.message ?? 'Impossible de planifier')
  }
}

async function removeRecipe() {
  const payload = await store.removeRecipe(route.params.id)
  if (payload) router.push('/recipes')
}

onMounted(() => store.refresh())
</script>

<template>
  <div v-if="recipe" class="view">
    <div class="view-header">
      <div class="head-row">
        <span class="emoji">{{ recipe.emoji }}</span>
        <h1 class="view-title font-display">{{ recipe.name }}</h1>
      </div>
      <div class="head-actions">
        <button class="action" @click="showPlan = true">
          <CalendarPlus :size="15" /> Planifier
        </button>
        <button class="action" @click="showGrocery = true">🛒 Courses</button>
        <button class="action danger" @click="removeRecipe">
          <Trash2 :size="15" /> Supprimer
        </button>
      </div>
    </div>
    <p v-if="recipe.description" class="description">{{ recipe.description }}</p>
    <div class="meta font-mono">
      <span v-if="recipe.servings">👥 {{ recipe.servings }} pers.</span>
      <span v-if="recipe.prepMinutes">🔪 {{ recipe.prepMinutes }} min prépa</span>
      <span v-if="recipe.cookMinutes">🔥 {{ recipe.cookMinutes }} min cuisson</span>
      <span v-if="recipe.source">🔗 {{ recipe.source }}</span>
    </div>

    <section v-for="(section, si) in recipe.sections" :key="section.id ?? si" class="block">
      <h2 class="section-label">{{ section.name }}</h2>
      <ul class="items">
        <li v-for="(item, ii) in section.items" :key="item.id ?? ii" class="item">
          <span class="item-label">{{ item.label }}</span>
          <span v-if="item.quantity" class="item-qty font-mono">{{ item.quantity }}</span>
          <button class="icon-btn" aria-label="Retirer" @click="removeIngredient(si, ii)">
            <X :size="14" />
          </button>
        </li>
      </ul>
      <form v-if="si === (activeSection ?? 0) || activeSection === null" class="add-row" @submit.prevent="addIngredient">
        <input v-model="newItemLabel" class="input" type="text" placeholder="Ingrédient" />
        <input v-model="newItemQuantity" class="input qty" type="text" placeholder="Qté" />
        <button type="submit" class="icon-btn add" aria-label="Ajouter"><Plus :size="16" /></button>
      </form>
    </section>

    <form class="add-row" @submit.prevent="addSection">
      <input v-model="newSectionName" class="input" type="text" placeholder="Nouveau rayon (ex : Frais, Épicerie)" />
      <button type="submit" class="icon-btn add" aria-label="Ajouter rayon"><Plus :size="16" /></button>
    </form>

    <section class="block">
      <h2 class="section-label">Préparation</h2>
      <ol class="steps">
        <li v-for="(step, idx) in recipe.steps" :key="step.id ?? idx" class="step">
          <span class="step-text">{{ step.text }}</span>
          <button class="icon-btn" aria-label="Retirer" @click="removeStep(idx)"><X :size="14" /></button>
        </li>
      </ol>
      <form class="add-row" @submit.prevent="addStep">
        <input v-model="newStep" class="input" type="text" placeholder="Nouvelle étape" />
        <button type="submit" class="icon-btn add" aria-label="Ajouter"><Plus :size="16" /></button>
      </form>
    </section>

    <AddToGroceryDialog
      v-if="showGrocery"
      title="Ajouter les ingrédients à…"
      mode="recipes"
      :recipes="[recipe]"
      @close="showGrocery = false"
    />

    <div v-if="showPlan" class="overlay" @click.self="showPlan = false">
      <div class="dialog">
        <div class="dialog-head">
          <span class="font-mono dialog-title">Planifier le repas</span>
          <button class="icon-btn" aria-label="Fermer" @click="showPlan = false"><X :size="18" /></button>
        </div>
        <form @submit.prevent="plan">
          <input v-model="planDate" class="input" type="date" required />
          <div class="meal-choice">
            <button type="button" class="meal" :class="{ active: planMeal === 'lunch' }" @click="planMeal = 'lunch'">Midi</button>
            <button type="button" class="meal" :class="{ active: planMeal === 'dinner' }" @click="planMeal = 'dinner'">Soir</button>
          </div>
          <button type="submit" class="submit">Planifier</button>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.head-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}
.emoji {
  font-size: 1.8rem;
}
.head-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-top: 0.6rem;
}
.action {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.45rem 0.7rem;
  font-size: 0.75rem;
  font-weight: 600;
  border: 1px solid var(--line);
  border-radius: 0.7rem;
  color: var(--ink-muted);
}
.action:active {
  border-color: var(--accent-dim);
  color: var(--accent);
}
.action.danger {
  color: var(--danger, #e5484d);
}
.description {
  color: var(--ink-muted);
  font-size: 0.9rem;
  margin: 0.5rem 0 0;
}
.meta {
  display: flex;
  gap: 0.8rem;
  flex-wrap: wrap;
  font-size: 0.7rem;
  color: var(--ink-faint);
  margin: 0.5rem 0 1rem;
}
.block {
  margin-bottom: 1.4rem;
}
.items,
.steps {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
.item,
.step {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.5rem 0.7rem;
  border: 1px solid var(--line);
  border-radius: 0.7rem;
  background: var(--bg-1);
}
.steps {
  counter-reset: step;
}
.step-text {
  flex: 1;
  font-size: 0.88rem;
}
.item-label {
  flex: 1;
  font-size: 0.88rem;
}
.item-qty {
  font-size: 0.75rem;
  color: var(--ink-muted);
}
.add-row {
  display: flex;
  gap: 0.4rem;
  margin-top: 0.5rem;
}
.add-row .input {
  flex: 1;
}
.add-row .qty {
  max-width: 5rem;
}
.icon-btn.add {
  border: 1px dashed var(--line);
  border-radius: 0.6rem;
  color: var(--ink-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.2rem;
}
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
.meal-choice {
  display: flex;
  gap: 0.5rem;
  margin: 0.5rem 0;
}
.meal {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid var(--line);
  border-radius: 0.7rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--ink-muted);
}
.meal.active {
  border-color: var(--accent-dim);
  color: var(--accent);
  background: var(--accent-deep);
}
</style>
