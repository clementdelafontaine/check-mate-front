<script setup>
import { ref, computed, onMounted } from 'vue'
import { useChecklistsStore } from '../stores/checklists'
import { useRecipesStore } from '../stores/recipes'
import { useUndoToast } from '../composables/useUndoToast'
import AddListForDayDialog from '../components/AddListForDayDialog.vue'
import AddToGroceryDialog from '../components/AddToGroceryDialog.vue'
import ConfirmDialog from '../components/ConfirmDialog.vue'
import { ChevronLeft, ChevronRight, CalendarX2, Plus, ShoppingBasket, X } from 'lucide-vue-next'

const toast = useUndoToast()

const store = useChecklistsStore()
const recipesStore = useRecipesStore()

const now = new Date()
const year = ref(now.getFullYear())
const month = ref(now.getMonth())

const MONTHS = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
]
const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

const monthLabel = computed(() => `${MONTHS[month.value]} ${year.value}`)

const pad = (n) => String(n).padStart(2, '0')
const iso = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`

const days = computed(() => {
  const first = new Date(year.value, month.value, 1)
  const startOffset = (first.getDay() + 6) % 7
  const daysInMonth = new Date(year.value, month.value + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < startOffset; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({
      num: d,
      iso: iso(year.value, month.value, d),
      lists: store.lists.filter((l) => l.startDate && l.startDate <= iso(year.value, month.value, d) && (!l.endDate || l.endDate >= iso(year.value, month.value, d))),
      meals: recipesStore.mealPlansByDate(iso(year.value, month.value, d))
    })
  }
  return cells
})

const todayIso = new Date().toISOString().slice(0, 10)

function prevMonth() {
  month.value--
  if (month.value < 0) {
    month.value = 11
    year.value--
  }
}
function nextMonth() {
  month.value++
  if (month.value > 11) {
    month.value = 0
    year.value++
  }
}

const selected = ref(null)
const selectedLists = computed(() => {
  if (!selected.value) return []
  return store.lists.filter(
    (l) => l.startDate && l.startDate <= selected.value && (!l.endDate || l.endDate >= selected.value)
  )
})
const selectedMeals = computed(() =>
  selected.value ? recipesStore.mealPlansByDate(selected.value) : []
)
const showGroceryWeek = ref(false)
const groceryRange = computed(() => {
  const d = selected.value ? new Date(selected.value + 'T00:00:00') : new Date()
  const day = (d.getDay() + 6) % 7
  const monday = new Date(d)
  monday.setDate(d.getDate() - day)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  const fmt = (x) => x.toISOString().slice(0, 10)
  return { from: fmt(monday), to: fmt(sunday) }
})
const mealToRemove = ref(null)

async function removeMeal(plan) {
  await recipesStore.removeMealPlan(plan.id)
  mealToRemove.value = null
}
onMounted(() => recipesStore.refresh())

const showAdd = ref(false)

const fmtDate = (isoStr) => {
  const [y, m, d] = isoStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
}
</script>

<template>
  <div class="view">
    <div class="view-header">
      <h1 class="view-title font-display">Calendrier</h1>
      <div class="month-nav">
        <button class="month-btn" aria-label="Mois précédent" @click="prevMonth"><ChevronLeft :size="18" /></button>
        <span class="month-label font-mono">{{ monthLabel }}</span>
        <button class="month-btn" aria-label="Mois suivant" @click="nextMonth"><ChevronRight :size="18" /></button>
      </div>
    </div>

    <div class="grid-head">
      <span v-for="d in WEEKDAYS" :key="d" class="weekday font-mono">{{ d }}</span>
    </div>
    <div class="grid">
      <div v-for="(cell, i) in days" :key="i" class="cell" :class="{ empty: !cell }">
        <button
          v-if="cell"
          class="day"
          :class="{ today: cell.iso === todayIso, selected: selected === cell.iso, has: cell.lists.length }"
          @click="selected = selected === cell.iso ? null : cell.iso"
        >
          <span class="day-num">{{ cell.num }}</span>
          <span v-if="cell.lists.length || cell.meals.length" class="dots">
            <span
              v-for="list in cell.lists.slice(0, 2)"
              :key="list.id"
              class="dot"
            >{{ list.emoji }}</span>
            <span
              v-for="meal in cell.meals.slice(0, 1)"
              :key="meal.id"
              class="dot meal"
            >{{ meal.recipeEmoji }}</span>
          </span>
        </button>
      </div>
    </div>

    <div v-if="selected" class="day-detail">
      <h2 class="section-label">{{ fmtDate(selected) }}</h2>
      <ul v-if="selectedLists.length" class="lists">
        <li v-for="list in selectedLists" :key="list.id">
          <router-link class="day-list" :to="`/list/${list.id}`">
            <span class="emoji">{{ list.emoji }}</span>
            <span class="list-info">
              <span class="list-name">{{ list.name }}</span>
              <span v-if="list.endDate && list.endDate !== list.startDate" class="list-dates font-mono">
                du {{ fmtDate(list.startDate).split(' ').slice(-2).join(' ') }} au {{ fmtDate(list.endDate).split(' ').slice(-2).join(' ') }}
              </span>
              <span v-else class="list-dates font-mono">toute la journée</span>
            </span>
          </router-link>
        </li>
      </ul>
      <div v-if="selectedMeals.length" class="meals-block">
        <h3 class="section-label">Repas prévus</h3>
        <ul class="meals">
          <li v-for="meal in selectedMeals" :key="meal.id" class="meal-row">
            <router-link class="day-list" :to="`/recipe/${meal.recipeId}`">
              <span class="emoji">{{ meal.recipeEmoji }}</span>
              <span class="list-info">
                <span class="list-name">{{ meal.recipeName }}</span>
                <span class="list-dates font-mono">{{ meal.meal === 'lunch' ? 'midi' : 'soir' }}</span>
              </span>
            </router-link>
            <button class="icon-btn" aria-label="Retirer le repas" @click="mealToRemove = meal">
              <X :size="14" />
            </button>
          </li>
        </ul>
      </div>
      <div v-if="!selectedLists.length && !selectedMeals.length" class="day-empty">
        <CalendarX2 :size="22" class="day-empty-icon" />
        Aucune liste prévue ce jour-là
      </div>
      <button class="add-day-btn" @click="showAdd = true">
        <Plus :size="15" /> Ajouter une liste ce jour
      </button>
      <button class="add-day-btn" @click="showGroceryWeek = true">
        <ShoppingBasket :size="15" /> Ajouter les repas de la semaine aux listes de courses
      </button>
    </div>

    <AddToGroceryDialog
      v-if="showGroceryWeek"
      title="Repas de la semaine vers…"
      mode="meals"
      :range="groceryRange"
      @close="showGroceryWeek = false"
    />
    <AddListForDayDialog
      v-if="showAdd && selected"
      :date="selected"
      @close="showAdd = false"
      @created="(l) => toast.show(`« ${l.name} » créée le ${selected.split('-').reverse().join('/')}`)"
    />

    <ConfirmDialog
      v-if="mealToRemove"
      :message="`Retirer « ${mealToRemove.recipeName} » du planning ?`"
      confirm-label="Retirer"
      @cancel="mealToRemove = null"
      @confirm="removeMeal(mealToRemove)"
    />
  </div>
</template>

<style scoped>
.view-header {
  justify-content: space-between;
  margin-bottom: 1rem;
}
.month-nav {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.month-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 0.55rem;
  color: var(--ink-muted);
  border: 1px solid var(--line);
}
.month-btn:active {
  background: var(--bg-2);
}
.month-label {
  font-size: 0.75rem;
  text-transform: capitalize;
  color: var(--ink-muted);
  min-width: 7rem;
  text-align: center;
}
.grid-head {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.25rem;
  margin-bottom: 0.4rem;
}
.weekday {
  text-align: center;
  font-size: 0.65rem;
  color: var(--ink-faint);
  text-transform: uppercase;
}
.grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.25rem;
}
.cell {
  aspect-ratio: 1;
}
.day {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.15rem;
  border: 1px solid transparent;
  border-radius: 0.65rem;
  transition: border-color 0.15s, background 0.15s;
}
.day.has {
  border-color: var(--line);
  background: var(--bg-1);
}
.day.selected {
  border-color: var(--accent-dim);
  background: var(--accent-deep);
}
.day-num {
  font-size: 0.85rem;
  font-weight: 600;
}
.day.today .day-num {
  color: var(--accent);
  font-weight: 800;
}
.dots {
  display: flex;
  gap: 0.1rem;
  font-size: 0.55rem;
  line-height: 1;
}
.day-detail {
  margin-top: 1.5rem;
}
.lists {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}
.day-list {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  padding: 0.85rem 1rem;
  border: 1px solid var(--line);
  border-radius: 1rem;
  background: var(--bg-1);
}
.emoji {
  font-size: 1.5rem;
}
.list-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.list-name {
  font-weight: 700;
}
.list-dates {
  font-size: 0.7rem;
  color: var(--ink-faint);
}
.add-day-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  width: 100%;
  padding: 0.55rem;
  margin-top: 0.6rem;
  font-size: 0.8rem;
  font-weight: 600;
  border: 1px dashed var(--line);
  border-radius: 0.75rem;
  color: var(--ink-muted);
}
.add-day-btn:active {
  border-color: var(--accent-dim);
  color: var(--accent);
}
.day-empty {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  color: var(--ink-faint);
  font-size: 0.9rem;
}
.day-empty-icon {
  opacity: 0.6;
}
</style>
