<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRecipesStore } from '../stores/recipes'
import { useUndoToast } from '../composables/useUndoToast'
import ItemCard from '../components/ItemCard.vue'
import AddCard from '../components/AddCard.vue'
import AddToGroceryDialog from '../components/AddToGroceryDialog.vue'
import RecipeMetaDialog from '../components/RecipeMetaDialog.vue'
import { X, Plus, ArrowRight, Check } from 'lucide-vue-next'

const store = useRecipesStore()
const toast = useUndoToast()

const showForm = ref(false)
const editingRecipe = ref(null)
const showGroceryWeek = ref(false)
const showGrocerySelection = ref(false)
const selection = ref(new Set())


const weekSelection = computed(() => new Set(store.weeklyRecipeIds))

const RECIPE_TAGS = [
  'plats', 'desserts', 'entrées', 'soupes', 'salades', 'petit-déjeuner', 'brunch',
  'vegan', 'végétarien', 'sans gluten', 'sans lactose',
  'express', 'batch-cooking', 'four', 'wok', 'cocotte-minute', 'barbecue',
  'pâtes', 'riz', 'légumes', 'fruits', 'poisson', 'viande', 'fromage', 'gourmand'
]
const activeTags = ref(new Set())

const tagOptions = computed(() => {
  const used = new Set(store.recipes.flatMap((r) => r.tags ?? []))
  return RECIPE_TAGS.filter((t) => used.has(t))
})

const filteredRecipes = computed(() => {
  if (!activeTags.value.size) return store.recipes
  return store.recipes.filter((r) =>
    [...activeTags.value].every((t) => (r.tags ?? []).includes(t))
  )
})

function toggleTag(tag) {
  const next = new Set(activeTags.value)
  if (next.has(tag)) next.delete(tag)
  else next.add(tag)
  activeTags.value = next
}

const groceryRecipes = computed(() =>
  store.recipes.filter((r) => weekSelection.value.has(r.id))
)

function toggleWeek(recipeId) {
  const next = new Set(weekSelection.value)
  if (next.has(recipeId)) next.delete(recipeId)
  else next.add(recipeId)
  store.saveWeeklyRecipeIds([...next])
}

function toggleSelect(recipeId) {
  const next = new Set(selection.value)
  if (next.has(recipeId)) next.delete(recipeId)
  else next.add(recipeId)
  selection.value = next
}

function closeForm() {
  showForm.value = false
  editingRecipe.value = null
}

function editRecipe(recipe) {
  editingRecipe.value = recipe
  showForm.value = true
}

async function removeRecipe(recipe) {
  const payload = await store.removeRecipe(recipe.id)
  if (payload) toast.show(`« ${recipe.name} » supprimée`, () => store.restoreRecipe(payload))
}

onMounted(() => store.refresh())
</script>

<template>
  <div class="view">
    <div class="view-header">
      <h1 class="view-title font-display">Mes recettes</h1>
    </div>

    <!-- Semaine -->
    <section class="week-block">
      <div class="week-head">
        <h2 class="section-label">Mes recettes de la semaine</h2>
        <span class="font-mono week-count">{{ weekSelection.size }}</span>
      </div>
      <p v-if="!weekSelection.size" class="week-empty">
        Cochez des recettes ci-dessous pour les organiser dans votre semaine.
      </p>
      <ul v-else class="week-list">
        <li v-for="recipe in groceryRecipes" :key="recipe.id" class="week-row">
          <span class="emoji">{{ recipe.emoji }}</span>
          <router-link class="week-name" :to="`/recipe/${recipe.id}`">{{ recipe.name }}</router-link>
          <button class="icon-btn" aria-label="Retirer de la semaine" @click="toggleWeek(recipe.id)">
            <X :size="14" />
          </button>
        </li>
      </ul>
      <button
        v-if="weekSelection.size"
        class="week-grocery"
        @click="showGroceryWeek = true"
      >
        <ArrowRight :size="15" />
        <span>Intégrer à ma liste de courses</span>
      </button>
    </section>

    <!-- Bibliothèque -->
    <h2 class="section-label library-label">Toutes mes recettes</h2>
    <div v-if="tagOptions.length" class="tag-filter">
      <button
        v-for="tag in tagOptions"
        :key="tag"
        class="tag-chip"
        :class="{ active: activeTags.has(tag) }"
        @click="toggleTag(tag)"
      >
        {{ tag }}
      </button>
    </div>
    <ul class="lists">
      <li v-for="recipe in filteredRecipes" :key="recipe.id" class="recipe-row">
        <button
          class="select-btn"
          :class="{ active: weekSelection.has(recipe.id) }"
          :aria-label="weekSelection.has(recipe.id) ? 'Retirer de la semaine' : 'Ajouter à la semaine'"
          @click="toggleWeek(recipe.id)"
        >
          <Check v-if="weekSelection.has(recipe.id)" :size="14" />
        </button>
        <ItemCard
          :to="`/recipe/${recipe.id}`"
          :emoji="recipe.emoji"
          :name="recipe.name"
          :meta="recipe.description"
          editable
          @delete="removeRecipe(recipe)"
          @edit="editRecipe(recipe)"
        />
      </li>
      <li><AddCard label="Ajouter une recette" @click="showForm = true" /></li>
    </ul>

    <RecipeMetaDialog
      v-if="showForm"
      :recipe="editingRecipe"
      @close="closeForm"
      @saved="(r) => { toast.show(editingRecipe ? 'Recette mise à jour' : `« ${r?.name ?? ''} » créée`); closeForm() }"
    />


    <AddToGroceryDialog
      v-if="showGroceryWeek"
      title="Ingrédients de la semaine vers…"
      mode="recipes"
      :recipes="groceryRecipes"
      @close="showGroceryWeek = false"
    />
  </div>
</template>

<style scoped>
.week-block {
  border: 1px solid var(--line);
  border-radius: 1rem;
  background: var(--bg-1);
  padding: 1rem;
  margin-bottom: 1.5rem;
}
.week-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.4rem;
}
.week-count {
  font-size: 0.75rem;
  color: var(--ink-faint);
}
.week-empty {
  color: var(--ink-faint);
  font-size: 0.85rem;
  margin: 0.2rem 0 0;
}
.week-list {
  list-style: none;
  margin: 0.4rem 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
.week-row {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  padding: 0.45rem 0.6rem;
  border: 1px solid var(--line);
  border-radius: 0.7rem;
  background: var(--bg-2);
}
.week-name {
  flex: 1;
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--ink);
  text-decoration: none;
  min-width: 0;
}
.emoji {
  font-size: 1.1rem;
}
.week-grocery {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  width: 100%;
  margin-top: 0.7rem;
  padding: 0.55rem;
  font-size: 0.8rem;
  font-weight: 700;
  border: 1px solid var(--accent-dim);
  border-radius: 0.75rem;
  color: var(--accent);
  background: var(--accent-deep);
}
.tag-filter {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-bottom: 0.8rem;
}
.tag-chip {
  padding: 0.35rem 0.75rem;
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
.library-label {
  margin-bottom: 0.6rem;
}
.lists {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}
.recipe-row {
  display: flex;
  align-items: stretch;
  gap: 0.5rem;
}
.recipe-row :deep(.item-card),
.recipe-row > :last-child {
  flex: 1;
  min-width: 0;
}
.select-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.4rem;
  flex-shrink: 0;
  border: 1px dashed var(--line-bright);
  border-radius: 0.9rem;
  color: var(--ink-faint);
}
.select-btn.active {
  border-style: solid;
  border-color: var(--accent);
  color: var(--accent);
  background: var(--accent-deep);
}

</style>
