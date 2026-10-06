<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useRecipesStore } from '../stores/recipes'
import { useUndoToast } from '../composables/useUndoToast'
import AddToGroceryDialog from '../components/AddToGroceryDialog.vue'
import RecipeMetaDialog from '../components/RecipeMetaDialog.vue'
import { X, Plus, ArrowRight, Pencil, Trash2, CalendarPlus, MoreVertical } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const store = useRecipesStore()
const toast = useUndoToast()

const recipe = computed(() => store.recipeById(route.params.id))

const showGrocery = ref(false)
const showPlan = ref(false)
const showMeta = ref(false)
const planDate = ref(new Date().toISOString().slice(0, 10))
const planMeal = ref('dinner')

// meta edit
const metaName = ref('')
const metaEmoji = ref('🍝')
const metaDescription = ref('')
const metaServings = ref('')
const metaPrep = ref('')
const metaCook = ref('')
const metaSource = ref('')
const metaTags = ref(new Set())

const RECIPE_TAGS = [
  'plats', 'desserts', 'entrées', 'soupes', 'salades', 'petit-déjeuner', 'brunch',
  'vegan', 'végétarien', 'sans gluten', 'sans lactose',
  'express', 'batch-cooking', 'four', 'wok', 'cocotte-minute', 'barbecue',
  'pâtes', 'riz', 'légumes', 'fruits', 'poisson', 'viande', 'fromage', 'gourmand'
]

const newTag = ref('')

const allTags = computed(() => {
  const used = new Set(store.recipes.flatMap((r) => r.tags ?? []))
  return [...new Set([...RECIPE_TAGS, ...used])]
})

async function addCustomTag() {
  const value = newTag.value.trim().toLowerCase()
  if (!value || metaTags.value.has(value)) {
    newTag.value = ''
    return
  }
  const next = new Set(metaTags.value)
  next.add(value)
  metaTags.value = next
  newTag.value = ''
}

function toggleMetaTag(tag) {
  const next = new Set(metaTags.value)
  if (next.has(tag)) next.delete(tag)
  else next.add(tag)
  metaTags.value = next
}
const EMOJIS = ['🍳', '🥘', '🍝', '🍲', '🥗', '🍛', '🥐', '🍰', '🐟', '🍗', '🥖', '🫕']

// add-item inline forms (one open at a time, per section)
const openItemFor = ref(null)
const itemLabel = ref('')
const itemQuantity = ref('')
const showSectionForm = ref(false)
const sectionName = ref('')
const showStepForm = ref(false)
const stepText = ref('')
const dragStepIdx = ref(null)

function onStepDragStart(idx, e) {
  dragStepIdx.value = idx
  e.dataTransfer.effectAllowed = 'move'
  e.dataTransfer.setData('text/plain', String(idx))
}

function onStepDragOver(idx) {
  if (dragStepIdx.value === null || dragStepIdx.value === idx) return
  const steps = [...recipe.value.steps]
  const [moved] = steps.splice(dragStepIdx.value, 1)
  steps.splice(idx, 0, moved)
  recipe.value.steps = steps
  dragStepIdx.value = idx
}

async function onStepDrop() {
  const from = dragStepIdx.value
  dragStepIdx.value = null
  if (from === null || !recipe.value) return
  await store.updateRecipe(recipe.value.id, {
    steps: recipe.value.steps.map((s) => s.text)
  })
}

function openMeta() {
  if (!recipe.value) return
  metaName.value = recipe.value.name
  metaEmoji.value = recipe.value.emoji ?? '🍝'
  metaDescription.value = recipe.value.description ?? ''
  metaServings.value = recipe.value.servings ?? ''
  metaPrep.value = recipe.value.prepMinutes ?? ''
  metaCook.value = recipe.value.cookMinutes ?? ''
  metaSource.value = recipe.value.source ?? ''
  metaTags.value = new Set(recipe.value.tags ?? [])
  showMeta.value = true
}

async function saveMeta() {
  if (!recipe.value) return
  await store.updateRecipe(recipe.value.id, {
    name: metaName.value.trim(),
    emoji: metaEmoji.value,
    description: metaDescription.value.trim(),
    servings: metaServings.value === '' ? null : Number(metaServings.value),
    prepMinutes: metaPrep.value === '' ? null : Number(metaPrep.value),
    cookMinutes: metaCook.value === '' ? null : Number(metaCook.value),
    source: metaSource.value.trim() || null,
    tags: [...metaTags.value]
  })
  showMeta.value = false
  toast.show('Recette modifiée')
}

const sectionsPayload = () =>
  (recipe.value?.sections ?? []).map((s) => ({
    ...s,
    items: s.items.map((i) => ({ ...i }))
  }))

function openItemForm(sectionId) {
  openItemFor.value = sectionId
  itemLabel.value = ''
  itemQuantity.value = ''
}

async function submitItem() {
  const label = itemLabel.value.trim()
  if (!label || !recipe.value) return
  const sections = sectionsPayload()
  const section = sections.find((s) => s.id === openItemFor.value)
  if (!section) return
  section.items.push({
    id: null,
    label,
    quantity: itemQuantity.value.trim() || null
  })
  await store.updateRecipe(recipe.value.id, { sections })
  openItemFor.value = null
}

async function submitSection() {
  const name = sectionName.value.trim()
  if (!name || !recipe.value) return
  const sections = sectionsPayload()
  sections.push({ id: null, name, items: [] })
  await store.updateRecipe(recipe.value.id, { sections })
  sectionName.value = ''
  showSectionForm.value = false
}

async function submitStep() {
  const text = stepText.value.trim()
  if (!text || !recipe.value) return
  await store.updateRecipe(recipe.value.id, {
    steps: [...(recipe.value.steps ?? []).map((s) => s.text), text]
  })
  stepText.value = ''
  showStepForm.value = false
}

async function removeIngredient(si, ii) {
  if (!recipe.value) return
  const sections = sectionsPayload()
  sections[si].items.splice(ii, 1)
  await store.updateRecipe(recipe.value.id, { sections })
  toast.show('Ingrédient supprimé')
}

async function saveIngredientEdit(si, ii, { label, quantity }) {
  if (!recipe.value) return
  const sections = sectionsPayload()
  const item = sections[si].items[ii]
  if (!item) return
  item.label = label
  item.quantity = quantity ?? null
  await store.updateRecipe(recipe.value.id, { sections })
  editingIngredient.value = null
  toast.show('Ingrédient modifié')
}

const editingIngredient = ref(null)
const editLabel = ref('')
const editQuantity = ref('')
const editingIndexes = ref(null)

function openIngredientEdit(si, ii) {
  const item = recipe.value?.sections?.[si]?.items?.[ii]
  if (!item) return
  editingIndexes.value = { si, ii }
  editLabel.value = item.label
  editQuantity.value = item.quantity ?? ''
  editingIngredient.value = item
}

async function submitIngredientEdit() {
  if (!editingIndexes.value || !editLabel.value.trim()) return
  await saveIngredientEdit(editingIndexes.value.si, editingIndexes.value.ii, {
    label: editLabel.value.trim(),
    quantity: editQuantity.value.trim() || null
  })
}

const ingredientMenu = ref(null)

function toggleIngredientMenu(si, ii) {
  const key = `${si}-${ii}`
  ingredientMenu.value = ingredientMenu.value === key ? null : key
}

const dragIngredient = ref(null)

function onIngredientDragStart(si, ii, e) {
  dragIngredient.value = { si, ii }
  e.dataTransfer.effectAllowed = 'move'
  e.dataTransfer.setData('text/plain', `${si}-${ii}`)
}

function onIngredientDragOver(si, ii) {
  if (!dragIngredient.value || !recipe.value) return
  const from = dragIngredient.value
  if (from.si === si && from.ii === ii) return
  const sections = recipe.value.sections
  const [moved] = sections[from.si].items.splice(from.ii, 1)
  if (from.si === si) {
    const idx = sections[si].items.findIndex((i) => i.id === moved.id)
    const target = idx !== -1 && from.ii < ii ? idx + 1 : idx
    sections[si].items.splice(ii > from.ii ? target : ii, 0, moved)
    if (sections[si].items.indexOf(moved) === -1) sections[si].items.splice(ii, 0, moved)
  } else {
    sections[si].items.splice(ii, 0, moved)
  }
  dragIngredient.value = { si, ii: sections[si].items.indexOf(moved) }
}

function onSectionDragOver(si) {
  if (!dragIngredient.value || !recipe.value) return
  const from = dragIngredient.value
  if (from.si === si) return
  const sections = recipe.value.sections
  if (sections[si].items.length) return
  const [moved] = sections[from.si].items.splice(from.ii, 1)
  sections[si].items.push(moved)
  dragIngredient.value = { si, ii: sections[si].items.length - 1 }
}

async function onIngredientDrop() {
  if (!dragIngredient.value || !recipe.value) return
  dragIngredient.value = null
  const sections = sectionsPayload()
  await store.updateRecipe(recipe.value.id, { sections })
}

async function removeSection(si) {
  if (!recipe.value) return
  const sections = sectionsPayload()
  sections.splice(si, 1)
  await store.updateRecipe(recipe.value.id, { sections })
}

async function removeStep(idx) {
  if (!recipe.value) return
  confirmRemoveStep.value = idx
}

const confirmRemoveStep = ref(null)

async function doRemoveStep() {
  const idx = confirmRemoveStep.value
  confirmRemoveStep.value = null
  if (idx === null || !recipe.value) return
  await store.updateRecipe(recipe.value.id, {
    steps: recipe.value.steps.filter((_, i) => i !== idx).map((s) => s.text)
  })
  toast.show('Étape supprimée')
}

async function toggleStepChecked(step) {
  if (!recipe.value || !step.id) return
  step.checked = !step.checked
  try {
    await store.toggleStep(step.id, step.checked)
  } catch {
    step.checked = !step.checked
  }
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
        <button class="action" @click="openMeta">
          <Pencil :size="15" /> Modifier
        </button>
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
      <span v-for="tag in recipe.tags ?? []" :key="tag" class="tag-pill">{{ tag }}</span>
    </div>

    <section v-for="(section, si) in recipe.sections" :key="section.id ?? si" class="block">
      <div class="section-head">
        <h2 class="section-label">{{ section.name }}</h2>
        <button class="icon-btn" aria-label="Supprimer le rayon" @click="removeSection(si)">
          <X :size="14" />
        </button>
      </div>
      <ul
        class="items"
        @dragover="onSectionDragOver(si)"
        @drop.prevent="onIngredientDrop"
      >
        <li
          v-for="(item, ii) in section.items"
          :key="item.id ?? ii"
          class="item"
          draggable="true"
          @dragstart="onIngredientDragStart(si, ii, $event)"
          @dragover.prevent="onIngredientDragOver(si, ii)"
          @drop.prevent.stop="onIngredientDrop"
          @dragend="dragIngredient = null"
        >
          <span class="item-label">{{ item.label }}</span>
          <span v-if="item.quantity" class="item-qty font-mono">{{ item.quantity }}</span>
          <div class="menu-wrap" @click.stop>
            <button
              class="icon-btn"
              aria-label="Options"
              @click="toggleIngredientMenu(si, ii)"
            >
              <MoreVertical :size="14" />
            </button>
            <div v-if="ingredientMenu === `${si}-${ii}`" class="menu" @click.stop>
              <button class="menu-item" @click="ingredientMenu = null; openIngredientEdit(si, ii)">
                <Pencil :size="14" /> Modifier
              </button>
              <button class="menu-item danger" @click="ingredientMenu = null; removeIngredient(si, ii)">
                <Trash2 :size="14" /> Supprimer
              </button>
            </div>
          </div>
        </li>
      </ul>
      <div v-if="openItemFor === section.id" class="form-card">
        <form @submit.prevent="submitItem">
          <input v-model="itemLabel" class="input" type="text" placeholder="Ingrédient" autofocus />
          <input v-model="itemQuantity" class="input" type="text" placeholder="Quantité (ex : 200 g)" />
          <button type="submit" class="submit">Ajouter</button>
        </form>
      </div>
      <button v-else class="add-inline" @click="openItemForm(section.id)">
        <span class="plus-circle">+</span>
        <span class="add-label">Ajouter un ingrédient</span>
      </button>
    </section>

    <div v-if="showSectionForm" class="form-card">
      <form @submit.prevent="submitSection">
        <input v-model="sectionName" class="input" type="text" placeholder="Nouveau rayon (ex : Frais, Épicerie)" autofocus />
        <button type="submit" class="submit">Ajouter le rayon</button>
      </form>
    </div>
    <button v-else class="add-inline" @click="showSectionForm = true">
      <span class="plus-circle">+</span>
      <span class="add-label">Ajouter un rayon</span>
    </button>

    <section class="block steps-block">
      <h2 class="section-label">Préparation</h2>
      <ol class="steps">
        <li
          v-for="(step, idx) in recipe.steps"
          :key="step.id ?? idx"
          class="step"
          :class="{ done: step.checked, dragging: dragStepIdx === idx }"
          draggable="true"
          @dragstart="onStepDragStart(idx, $event)"
          @dragover.prevent="onStepDragOver(idx)"
          @drop.prevent="onStepDrop"
          @dragend="dragStepIdx = null"
          @click="toggleStepChecked(step)"
        >
          <span class="step-num font-mono">{{ idx + 1 }}</span>
          <span class="step-text">{{ step.text }}</span>
          <button
            class="icon-btn"
            aria-label="Retirer"
            @click.stop="removeStep(idx)"
          ><X :size="14" /></button>
        </li>
      </ol>

      <div v-if="confirmRemoveStep !== null" class="overlay" @click.self="confirmRemoveStep = null">
        <div class="dialog">
          <p class="dialog-text">
            Supprimer l'étape {{ confirmRemoveStep + 1 }} ?
          </p>
          <div class="dialog-actions">
            <button class="btn ghost" @click="confirmRemoveStep = null">Annuler</button>
            <button class="btn danger" @click="doRemoveStep">Supprimer</button>
          </div>
        </div>
      </div>

      <div v-if="editingIngredient" class="overlay" @click.self="editingIngredient = null">
        <div class="dialog">
          <p class="dialog-text font-mono dialog-title">Modifier l'ingrédient</p>
          <form @submit.prevent="submitIngredientEdit">
            <input v-model="editLabel" class="input" type="text" placeholder="Ingrédient" autofocus />
            <input v-model="editQuantity" class="input" type="text" placeholder="Quantité (ex : 200 g)" />
            <button type="submit" class="submit">Enregistrer</button>
          </form>
        </div>
      </div>
      <div v-if="showStepForm" class="form-card">
        <form @submit.prevent="submitStep">
          <input v-model="stepText" class="input" type="text" placeholder="Nouvelle étape" autofocus />
          <button type="submit" class="submit">Ajouter</button>
        </form>
      </div>
      <button v-else class="add-inline" @click="showStepForm = true">
        <span class="plus-circle">+</span>
        <span class="add-label">Ajouter une étape</span>
      </button>
    </section>

    <button class="grocery-cta" @click="showGrocery = true">
      <ArrowRight :size="16" />
      <span>Intégrer à ma liste de courses</span>
    </button>

    <AddToGroceryDialog
      v-if="showGrocery"
      title="Ingrédients de la recette vers…"
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
          <label class="field-label" for="plan-date">Date du repas</label>
          <input id="plan-date" v-model="planDate" class="input" type="date" required />
          <div class="meal-choice">
            <button type="button" class="meal" :class="{ active: planMeal === 'lunch' }" @click="planMeal = 'lunch'">Midi</button>
            <button type="button" class="meal" :class="{ active: planMeal === 'dinner' }" @click="planMeal = 'dinner'">Soir</button>
          </div>
          <button type="submit" class="submit">Planifier</button>
        </form>
      </div>
    </div>

    <RecipeMetaDialog
      v-if="showMeta"
      :recipe="recipe"
      @close="showMeta = false"
      @saved="toast.show('Recette modifiée')"
    />

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
.tag-pill {
  padding: 0.15rem 0.5rem;
  border: 1px solid var(--accent-dim);
  border-radius: 0.45rem;
  font-size: 0.65rem;
  color: var(--accent);
  background: var(--accent-deep);
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
.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
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
.step[draggable='true'] {
  cursor: grab;
}
.step.dragging {
  opacity: 0.5;
}
.step.done {
  background: var(--bg-2);
}
.step.done .step-text {
  text-decoration: line-through;
  color: var(--ink-muted);
}
.menu-wrap {
  position: relative;
  flex-shrink: 0;
}
.menu {
  position: absolute;
  right: 0;
  top: calc(100% + 0.25rem);
  z-index: 50;
  min-width: 9rem;
  padding: 0.35rem;
  border: 1px solid var(--line);
  border-radius: 0.75rem;
  background: var(--bg-1);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.55);
}
.menu-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.5rem 0.65rem;
  border-radius: 0.55rem;
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--ink-muted);
}
.menu-item:active {
  background: var(--bg-2);
}
.menu-item.danger {
  color: #ff6b6b;
}
.dialog-text {
  margin: 0 0 1rem;
  font-size: 0.95rem;
  line-height: 1.5;
}
.dialog-actions {
  display: flex;
  gap: 0.6rem;
  justify-content: flex-end;
}
.btn {
  padding: 0.55rem 1rem;
  border-radius: 0.7rem;
  font-size: 0.85rem;
  font-weight: 700;
}
.btn.ghost {
  border: 1px solid var(--line);
  color: var(--ink-muted);
}
.btn.danger {
  background: #e5484d;
  color: #fff;
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
.step-num {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.4rem;
  height: 1.4rem;
  flex-shrink: 0;
  border: 1px solid var(--accent-dim);
  border-radius: 0.45rem;
  font-size: 0.7rem;
  color: var(--accent);
  background: var(--accent-deep);
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
.grocery-cta {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  width: 100%;
  padding: 0.7rem;
  margin-top: 0.5rem;
  font-size: 0.85rem;
  font-weight: 700;
  border: 1px solid var(--accent-dim);
  border-radius: 0.9rem;
  color: var(--accent);
  background: var(--accent-deep);
}
.block .add-inline,
.block .form-card {
  margin-top: 0.6rem;
}
.add-inline {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.9rem;
  padding: 0.85rem 1rem;
  border: 1px dashed var(--line-bright);
  border-radius: 1rem;
  background: transparent;
  color: var(--ink-faint);
  transition: border-color 0.15s, color 0.15s;
}
.add-inline:active {
  border-color: var(--accent-dim);
  color: var(--accent);
}
.plus-circle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border: 1px dashed var(--line-bright);
  border-radius: 0.6rem;
  font-size: 1.1rem;
  font-weight: 700;
  flex-shrink: 0;
}
.add-label {
  font-weight: 600;
  font-size: 0.9rem;
}
.form-card {
  border: 1px solid var(--accent-dim);
  border-radius: 1rem;
  background: var(--bg-1);
  padding: 0.85rem;
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
.two-col .input {
  flex: 1;
}
.submit {
  width: 100%;
  padding: 0.65rem;
  border-radius: 0.7rem;
  background: var(--accent);
  color: #fff;
  font-weight: 700;
  font-size: 0.9rem;
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
.field-label {
  display: block;
  margin: 0.35rem 0 0.25rem 0.15rem;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--ink-muted);
}
.tags-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin: 0.25rem 0 0.6rem;
}
.tag-chip {
  padding: 0.35rem 0.7rem;
  font-size: 0.78rem;
  font-weight: 600;
  border: 1px solid var(--line);
  border-radius: 0.55rem;
  color: var(--ink-muted);
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
.tag-chip.active {
  border-color: var(--accent);
  color: var(--accent);
  background: var(--accent-deep);
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
.icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.8rem;
  height: 1.8rem;
  border-radius: 0.5rem;
  color: var(--ink-muted);
}
</style>
