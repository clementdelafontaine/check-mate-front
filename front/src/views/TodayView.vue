<script setup>
import { computed } from 'vue'
import { useChecklistsStore } from '../stores/checklists'
import ItemCard from '../components/ItemCard.vue'
import { Sun, Sparkles, CalendarClock, ArrowRight } from 'lucide-vue-next'

const store = useChecklistsStore()

const today = new Date().toISOString().slice(0, 10)

const progressOf = (list) => {
  const items = list.sections.flatMap((s) => s.items)
  if (items.length === 0) return 0
  const done = items.filter((i) => i.checked).length
  return Math.round((done / items.length) * 100)
}

const isActive = (list) => list.sections.some((s) => s.items.some((i) => !i.checked))

const todayLists = computed(() =>
  store.lists.filter(
    (l) => l.startDate && l.startDate <= today && (!l.endDate || l.endDate >= today)
  )
)

const overdueLists = computed(() =>
  store.lists.filter(
    (l) =>
      l.endDate &&
      l.endDate < today &&
      isActive(l)
  )
)

const activeNoDate = computed(() => store.lists.filter((l) => !l.startDate && isActive(l)))

const upcomingLists = computed(() =>
  [...store.lists]
    .filter((l) => l.startDate && l.startDate > today)
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
    .slice(0, 4)
)

const dayLabels = computed(() => {
  const d = new Date()
  return {
    long: d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
  }
})

const fmtDate = (iso) => {
  const [y, m, day] = iso.split('-').map(Number)
  return new Date(y, m - 1, day).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}
</script>

<template>
  <div class="view">
    <div class="hero">
      <Sun :size="18" class="hero-icon" />
      <div>
        <h1 class="hero-title font-display">Aujourd'hui</h1>
        <span class="hero-date font-mono">{{ dayLabels.long }}</span>
      </div>
    </div>

    <section v-if="overdueLists.length">
      <h2 class="section-label">En retard</h2>
      <ul class="lists">
        <li v-for="list in overdueLists" :key="list.id">
          <ItemCard
            :to="`/list/${list.id}`"
            :emoji="list.emoji"
            :name="list.name"
            :meta="`à traiter avant le ${fmtDate(list.endDate)} · ${progressOf(list)}%`"
            @delete="store.removeList(list.id)"
          />
        </li>
      </ul>
    </section>

    <section v-if="todayLists.length">
      <h2 class="section-label">À traiter aujourd'hui</h2>
      <ul class="lists">
        <li v-for="list in todayLists" :key="list.id">
          <ItemCard
            :to="`/list/${list.id}`"
            :emoji="list.emoji"
            :name="list.name"
            :meta="list.endDate && list.endDate !== list.startDate ? `jusqu'au ${fmtDate(list.endDate)} · ${progressOf(list)}%` : `aujourd'hui · ${progressOf(list)}%`"
            @delete="store.removeList(list.id)"
          />
        </li>
      </ul>
    </section>

    <section v-if="activeNoDate.length">
      <h2 class="section-label">
        <Sparkles :size="13" class="label-icon" /> Listes actives sans date
      </h2>
      <ul class="lists">
        <li v-for="list in activeNoDate.slice(0, 5)" :key="list.id">
          <ItemCard
            :to="`/list/${list.id}`"
            :emoji="list.emoji"
            :name="list.name"
            :meta="`${progressOf(list)}%`"
            @delete="store.removeList(list.id)"
          />
        </li>
      </ul>
    </section>

    <section v-if="upcomingLists.length">
      <h2 class="section-label">
        <CalendarClock :size="13" class="label-icon" /> À venir
      </h2>
      <ul class="lists">
        <li v-for="list in upcomingLists" :key="list.id">
          <ItemCard
            :to="`/list/${list.id}`"
            :emoji="list.emoji"
            :name="list.name"
            :meta="`débute le ${fmtDate(list.startDate)}`"
            @delete="store.removeList(list.id)"
          />
        </li>
      </ul>
    </section>

    <div v-if="!todayLists.length && !overdueLists.length && !activeNoDate.length" class="empty">
      <Sun :size="32" class="empty-icon" />
      <p>Rien de prévu aujourd'hui.</p>
      <router-link to="/" class="empty-link">
        Créer ou consulter une liste <ArrowRight :size="14" />
      </router-link>
    </div>
  </div>
</template>

<style scoped>
.hero {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  margin-bottom: 1.5rem;
}
.hero-icon {
  color: var(--accent);
  flex-shrink: 0;
}
.hero-title {
  margin: 0;
  font-size: 1.35rem;
}
.hero-date {
  font-size: 0.7rem;
  color: var(--ink-faint);
  text-transform: uppercase;
  letter-spacing: 0.12em;
}
.section-label {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}
.label-icon {
  color: var(--ink-faint);
}
.lists {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}
.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  margin-top: 3rem;
  text-align: center;
  color: var(--ink-faint);
  font-size: 0.9rem;
}
.empty-icon {
  opacity: 0.5;
}
.empty-link {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  color: var(--accent);
  font-weight: 600;
  font-size: 0.9rem;
}
</style>
