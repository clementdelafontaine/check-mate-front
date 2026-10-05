<script setup>
import { ref, onMounted } from 'vue'
import { useRecipesStore } from '../stores/recipes'
import { useUndoToast } from '../composables/useUndoToast'
import ItemCard from '../components/ItemCard.vue'
import AddCard from '../components/AddCard.vue'
import AddToGroceryDialog from '../components/AddToGroceryDialog.vue'
import { X, CookingPot } from 'lucide-vue-next'

const store = useRecipesStore()
const toast = useUndoToast()
const showForm = ref(false)
const showGrocery = ref(false)
const selectedRecipes = ref([])

const newName = ref('')
const newEmoji = ref('🍳')
const newServings = ref('')
const newDescription = ref('')
const newSource = ref('')
const EMOJIS = ['🍳', '🥘', '🍝', '🍲', '🥗', '🍛', '🥐', '🍰', '🐟', '🍗', '🥖', '🫕']

function close() {
  showForm.value = false
  newName.value = ''
  newEmoji.value = '🍳'
  newServings.value = ''
  newDescription.value = ''
  newSource.value = ''
}

async function create() {
  const name = newName.value.trim()
  if (!name) return
  const recipe = await store.createRecipe({
    name,
    emoji: newEmoji.value,
    description: newDescription.value.trim(),
    servings: newServings.value ? Number(newServings.value) : null,
    source: newSource.value.trim() || null,
    sections: [{ name: 'Ingrédients', items: [] }],
    steps: []
  })
  close()
  toast.show('Recette créée')
  return recipe
}

async function removeRecipe(recipe) {
  const payload = await store.removeRecipe(recipe.id)
  if (payload) toast.show(`« ${recipe.name} » supprimée`, () => store.restoreRecipe(payload))
}

function addToGrocery(recipe) {
  selectedRecipes.value = [recipe]
  showGrocery.value = true
}

onMounted(() => store.refresh())
</script>

<template>
  <div class="view">
    <div class="view-header">
      <h1 class="view-title font-display">Mes recettes</h1>
    </div>
    <ul class="lists">
      <li v-for="recipe in store.recipes" :key="recipe.id" class="recipe-row">
        <ItemCard
          :to="`/recipe/${recipe.id}`"
          :emoji="recipe.emoji"
          :name="recipe.name"
          :meta="recipe.description"
          @delete="removeRecipe(recipe)"
        />
        <button class="grocery-btn" @click="addToGrocery(recipe)" title="Ajouter les ingrédients à une liste de courses">
          <CookingPot :size="16" />
          <span>Courses</span>
        </button>
      </li>
      <li><AddCard label="Ajouter une recette" @click="showForm = true" /></li>
    </ul>

    <div v-if="showForm" class="overlay" @click.self="close">
      <div class="dialog">
        <div class="dialog-head">
          <span class="font-mono dialog-title">Nouvelle recette</span>
          <button class="icon-btn" aria-label="Fermer" @click="close"><X :size="18" /></button>
        </div>
        <form @submit.prevent="create">
          <div class="emoji-row">
            <button
              v-for="e in EMOJIS"
              :key="e"
              type="button"
              class="emoji-choice"
              :class="{ active: newEmoji === e }"
              @click="newEmoji = e"
            >
              {{ e }}
            </button>
          </div>
          <input v-model="newName" class="input" type="text" placeholder="Nom de la recette" autofocus />
          <input v-model="newServings" class="input" type="number" min="1" placeholder="Nombre de personnes" />
          <input v-model="newDescription" class="input" type="text" placeholder="Description (optionnelle)" />
          <input v-model="newSource" class="input" type="text" placeholder="Source / lien (optionnel)" />
          <button type="submit" class="submit">Créer</button>
        </form>
      </div>
    </div>

    <AddToGroceryDialog
      v-if="showGrocery"
      title="Ajouter les ingrédients à…"
      mode="recipes"
      :recipes="selectedRecipes"
      @close="showGrocery = false"
    />
  </div>
</template>

<style scoped>
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
.recipe-row > :first-child {
  flex: 1;
  min-width: 0;
}
.grocery-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.15rem;
  padding: 0 0.7rem;
  border: 1px solid var(--line);
  border-radius: 0.9rem;
  color: var(--ink-muted);
  font-size: 0.6rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.grocery-btn:active {
  border-color: var(--accent-dim);
  color: var(--accent);
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
</style>
