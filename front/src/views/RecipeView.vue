<script setup>
import QuantityField from '../components/QuantityField.vue'
import AddItemCard from '../components/AddItemCard.vue'
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useRecipesStore } from '../stores/recipes'
import { useUndoToast } from '../composables/useUndoToast'
import { UNITS } from '../services/quantity'
import AddToGroceryDialog from '../components/AddToGroceryDialog.vue'
import ConfirmDialog from '../components/ConfirmDialog.vue'
import RecipeMetaDialog from '../components/RecipeMetaDialog.vue'
import { Plus, ArrowRight, Pencil, Trash2, CalendarPlus, MoreVertical, X } from 'lucide-vue-next'

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

const RECIPE_UNIT_CHOICES = ['-', ...UNITS, 'c. à s.', 'c. à c.', 'pincée', 'botte']
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

function onStepDragOver(idx, e) {
  if (dragStepIdx.value === null || dragStepIdx.value === idx) return
  const rect = e.currentTarget.getBoundingClientRect()
  const after = e.clientY > rect.top + rect.height / 2
  const steps = [...recipe.value.steps]
  const [moved] = steps.splice(dragStepIdx.value, 1)
  const target = dragStepIdx.value < idx && after ? idx : idx + (after ? 1 : 0)
  steps.splice(Math.max(0, Math.min(target, steps.length)), 0, moved)
  recipe.value.steps = steps
  dragStepIdx.value = steps.indexOf(moved)
}

function onStepsDragOver(e) {
  if (dragStepIdx.value === null) return
  const ol = e.currentTarget
  const last = ol.lastElementChild
  if (!last) return
  const lastRect = last.getBoundingClientRect()
  if (e.clientY <= lastRect.bottom) return
  if (dragStepIdx.value === recipe.value.steps.length - 1) return
  const steps = [...recipe.value.steps]
  const [moved] = steps.splice(dragStepIdx.value, 1)
  steps.push(moved)
  recipe.value.steps = steps
  dragStepIdx.value = steps.length - 1
}

async function onStepDrop() {
  dragStepIdx.value = null
  if (!recipe.value) return
  const stepIds = recipe.value.steps.map((s) => s.id).filter(Boolean)
  if (!stepIds.length || stepIds.length !== recipe.value.steps.length) {
    await store.updateRecipe(recipe.value.id, {
      steps: recipe.value.steps.map((s) => s.text)
    })
    return
  }
  try {
    await store.reorderSteps(recipe.value.id, stepIds)
  } catch {
    await store.refresh()
  }
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

async function submitItem({ label, quantity, sectionId }) {
  if (!label || !recipe.value) return
  const sections = sectionsPayload()
  const section = sections.find((s) => s.id === sectionId)
  if (!section) return
  section.items.push({
    id: null,
    label,
    quantity: quantity ?? null
  })
  await store.updateRecipe(recipe.value.id, { sections })
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

const editingSectionIdx = ref(null)
const sectionMenu = ref(null)
const sectionDraft = ref('')
function startSectionEdit(si) {
  editingSectionIdx.value = si
  sectionDraft.value = recipe.value?.sections?.[si]?.name ?? ''
}
async function saveSectionEdit(si) {
  editingSectionIdx.value = null
  const name = sectionDraft.value.trim()
  if (!name || !recipe.value) return
  if (name === recipe.value.sections[si]?.name) return
  const sections = sectionsPayload()
  if (!sections[si]) return
  sections[si].name = name
  await store.updateRecipe(recipe.value.id, { sections })
  toast.show('Rayon modifié')
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
const editSectionChoice = ref(null)

function openIngredientEdit(si, ii) {
  const item = recipe.value?.sections?.[si]?.items?.[ii]
  if (!item) return
  editingIndexes.value = { si, ii }
  editLabel.value = item.label
  editQuantity.value = item.quantity ?? ''
  editSectionChoice.value = recipe.value.sections[si]?.id ?? null
  editingIngredient.value = item
}

async function submitIngredientEdit() {
  if (!editingIndexes.value || !editLabel.value.trim()) return
  const { si, ii } = editingIndexes.value
  await saveIngredientEdit(si, ii, {
    label: editLabel.value.trim(),
    quantity: editQuantity.value.trim() || null
  })
  const targetSi = recipe.value.sections.findIndex((s) => s.id === editSectionChoice.value)
  if (targetSi !== -1 && targetSi !== si) {
    await moveIngredientById(editingIngredient?.value?.id ?? recipe.value.sections[si]?.items?.[ii]?.id, targetSi)
  }
}

async function moveIngredientById(itemId, targetSi) {
  if (!recipe.value || !itemId) return
  const sections = recipe.value.sections
  const fromSi = sections.findIndex((s) => s.items.some((i) => i.id === itemId))
  if (fromSi === -1) return
  const fromIdx = sections[fromSi].items.findIndex((i) => i.id === itemId)
  const [moved] = sections[fromSi].items.splice(fromIdx, 1)
  sections[targetSi].items.push(moved)
  await store.updateRecipe(recipe.value.id, { sections: sectionsPayload() })
  toast.show('Ingrédient déplacé')
}

const ingredientMenu = ref(null)

function toggleIngredientMenu(si, ii) {
  const key = `${si}-${ii}`
  ingredientMenu.value = ingredientMenu.value === key ? null : key
}

const view = ref(null)

function onDocClick(e) {
  if (ingredientMenu.value && view.value && !view.value.contains(e.target)) {
    ingredientMenu.value = null
  }
  if (sectionMenu.value !== null && view.value && !view.value.contains(e.target)) {
    sectionMenu.value = null
  }
}

onMounted(() => document.addEventListener('click', onDocClick))
onBeforeUnmount(() => document.removeEventListener('click', onDocClick))

const dragIngredient = ref(null)

function onIngredientDragStart(si, ii, e) {
  const item = recipe.value?.sections?.[si]?.items?.[ii]
  if (!item) return
  dragIngredient.value = { itemId: item.id }
  e.dataTransfer.effectAllowed = 'move'
  e.dataTransfer.setData('text/plain', item.id)
}

function moveIngredientTo(si, targetIdx) {
  if (!dragIngredient.value || !recipe.value) return
  const sections = recipe.value.sections
  const fromSi = sections.findIndex((s) =>
    s.items.some((i) => i.id === dragIngredient.value.itemId)
  )
  if (fromSi === -1) return
  const fromIdx = sections[fromSi].items.findIndex(
    (i) => i.id === dragIngredient.value.itemId
  )
  const [moved] = sections[fromSi].items.splice(fromIdx, 1)
  if (fromSi === si && fromIdx < targetIdx) targetIdx -= 1
  const idx = Math.max(0, Math.min(targetIdx, sections[si].items.length))
  sections[si].items.splice(idx, 0, moved)
}

function onIngredientDragOver(si, ii, e) {
  if (!dragIngredient.value || !recipe.value) return
  const item = recipe.value.sections[si]?.items[ii]
  if (!item) return
  const rect = e.currentTarget.getBoundingClientRect()
  const after = e.clientY > rect.top + rect.height / 2
  moveIngredientTo(si, ii + (after ? 1 : 0))
}

function onSectionDragOver(si, e) {
  if (!dragIngredient.value || !recipe.value) return
  const ul = e.currentTarget
  const last = ul.lastElementChild
  if (last) {
    const lastRect = last.getBoundingClientRect()
    if (e.clientY <= lastRect.bottom) return
  }
  moveIngredientTo(si, recipe.value.sections[si].items.length)
}

async function onIngredientDrop() {
  if (!dragIngredient.value || !recipe.value) return
  dragIngredient.value = null
  const sections = sectionsPayload()
  await store.updateRecipe(recipe.value.id, { sections })
}

const confirmRemoveSection = ref(null)

async function removeSection(si) {
  if (!recipe.value) return
  const sections = sectionsPayload()
  sections.splice(si, 1)
  await store.updateRecipe(recipe.value.id, { sections })
  confirmRemoveSection.value = null
  toast.show('Rayon supprimé')
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
  const step = recipe.value.steps[idx]
  if (step?.id) {
    try {
      await store.removeStepById(step.id)
      await store.refresh()
    } catch {
      toast.show('Impossible de supprimer l\u00e9tape')
      return
    }
  } else {
    await store.updateRecipe(recipe.value.id, {
      steps: recipe.value.steps.filter((_, i) => i !== idx).map((s) => s.text)
    })
  }
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
  <div v-if="recipe" ref="view" class="view">
    <div class="view-header recipe-header">
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
        <input
          v-if="editingSectionIdx === si"
          v-model="sectionDraft"
          class="section-edit-input"
          type="text"
          @keyup.enter="saveSectionEdit(si)"
          @keyup.escape="editingSectionIdx = null"
          @vue:mounted="($event) => $event.el?.focus?.()"
        />
        <h2 v-else class="section-label" @click="startSectionEdit(si)">{{ section.name }}</h2>
        <div class="menu-wrap" @click.stop>
          <button class="icon-btn" aria-label="Options du rayon" @click="sectionMenu = sectionMenu === si ? null : si">
            <MoreVertical :size="16" />
          </button>
          <div v-if="sectionMenu === si" class="menu">
            <button class="menu-item" @click="sectionMenu = null; startSectionEdit(si)">
              <Pencil :size="14" /> Éditer
            </button>
            <button class="menu-item danger" @click="sectionMenu = null; confirmRemoveSection = si">
              <Trash2 :size="14" /> Supprimer
            </button>
          </div>
        </div>
      </div>
      <ul
        class="items"
        @dragover="onSectionDragOver(si, $event)"
        @drop.prevent="onIngredientDrop"
      >
        <li
          v-for="(item, ii) in section.items"
          :key="item.id ?? ii"
          class="item"
          draggable="true"
          @dragstart="onIngredientDragStart(si, ii, $event)"
          @dragover.prevent="onIngredientDragOver(si, ii, $event)"
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
            <div v-if="ingredientMenu === `${si}-${ii}`" class="menu">
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
    </section>

    <AddItemCard
      class="add-item-card"
      :recipe="true"
      :units="RECIPE_UNIT_CHOICES"
      :sections="recipe.sections"
      @added="submitItem"
    />
    <div v-if="showSectionForm" class="form-card">
      <form @submit.prevent="submitSection">
        <input v-model="sectionName" class="input" type="text" placeholder="Nouvelle catégorie (ex : Frais, Épicerie)" autofocus />
        <button type="submit" class="submit">Ajouter la catégorie</button>
      </form>
    </div>
    <button v-else class="add-inline add-section-inline" @click="showSectionForm = true">
      <span class="plus-circle">+</span>
      <span class="add-label">Ajouter une catégorie</span>
    </button>

    <section class="block steps-block">
      <h2 class="section-label">Préparation</h2>
      <ol class="steps" @dragover="onStepsDragOver($event)" @drop.prevent="onStepDrop">
        <li
          v-for="(step, idx) in recipe.steps"
          :key="step.id ?? idx"
          class="step"
          :class="{ done: step.checked, dragging: dragStepIdx === idx }"
          draggable="true"
          @dragstart="onStepDragStart(idx, $event)"
          @dragover.prevent="onStepDragOver(idx, $event)"
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

      <ConfirmDialog
        v-if="confirmRemoveSection !== null"
        :message="`Supprimer le rayon « ${recipe.sections[confirmRemoveSection]?.name ?? ''} » et ses ${recipe.sections[confirmRemoveSection]?.items?.length ?? 0} ingrédient(s) ?`"
        @cancel="confirmRemoveSection = null"
        @confirm="removeSection(confirmRemoveSection)"
      />

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
          <div class="dialog-head">
            <span class="font-mono dialog-title">Modifier l'ingrédient</span>
            <button class="icon-btn" aria-label="Fermer" @click="editingIngredient = null"><X :size="18" /></button>
          </div>
          <form @submit.prevent="submitIngredientEdit">
            <input v-model="editLabel" class="input" type="text" placeholder="Ingrédient" autofocus />
            <QuantityField v-model="editQuantity" :units="RECIPE_UNIT_CHOICES" />
            <select v-model="editSectionChoice" class="input select">
              <option v-for="sec in recipe.sections" :key="sec.id" :value="sec.id">{{ sec.name }}</option>
            </select>
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
.recipe-header {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 0;
}
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
  flex-direction: row;
  gap: 0.5rem;
  margin-top: 0.6rem;
}
.head-actions .action {
  flex: 1;
  justify-content: center;
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
.menu-wrap {
  position: relative;
  flex-shrink: 0;
}
.menu {
  position: absolute;
  right: 0;
  top: calc(100% + 0.3rem);
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
  gap: 0.5rem;
  padding: 0.45rem 0.6rem;
  border: none;
  background: none;
  border-radius: 0.5rem;
  font-size: 0.8rem;
  color: var(--ink);
  cursor: pointer;
  text-align: left;
}
.menu-item:active {
  background: var(--bg-2);
}
.menu-item.danger {
  color: #e5484d;
}
.section-label {
  cursor: pointer;
}
.section-edit-input {
  font-size: 0.95rem;
  font-weight: 700;
  padding: 0.25rem 0.5rem;
  border: 1px solid var(--accent);
  border-radius: 0.5rem;
  background: var(--bg-1);
  color: inherit;
  min-width: 0;
  flex: 1;
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
.add-item-card {
  margin-top: 1rem;
}
.add-section-inline {
  margin-top: 0.75rem;
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
.select {
  appearance: none;
  background-image: linear-gradient(45deg, transparent 50%, var(--ink-muted) 50%),
    linear-gradient(135deg, var(--ink-muted) 50%, transparent 50%);
  background-position: calc(100% - 1.05rem) calc(50% + 0.1rem), calc(100% - 0.75rem) calc(50% + 0.1rem);
  background-size: 0.3rem 0.3rem, 0.3rem 0.3rem;
  background-repeat: no-repeat;
  padding-right: 2rem;
  font-weight: 600;
  color: var(--ink);
  cursor: pointer;
}
.select:focus {
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
