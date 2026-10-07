<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useChecklistsStore } from '../stores/checklists'
import { useFriendsStore } from '../stores/friends'
import { useAuthStore } from '../stores/auth'
import {
  Sun,
  ClipboardList,
  CalendarRange,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Clock,
  Settings,
  Shield,
  Users
} from 'lucide-vue-next'

const store = useChecklistsStore()
const auth = useAuthStore()
const friends = useFriendsStore()
const router = useRouter()

const today = new Date().toISOString().slice(0, 10)
const todayLong = new Date().toLocaleDateString('fr-FR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long'
})

const isActive = (list) => list.sections.some((s) => s.items.some((i) => !i.checked))

const progressOf = (list) => {
  const items = list.sections.flatMap((s) => s.items)
  if (items.length === 0) return 0
  const done = items.filter((i) => i.checked).length
  return Math.round((done / items.length) * 100)
}

const dueToday = computed(() =>
  store.lists.filter(
    (l) => l.startDate && l.startDate <= today && (!l.endDate || l.endDate >= today) && isActive(l)
  )
)
const overdue = computed(() =>
  store.lists.filter((l) => l.endDate && l.endDate < today && isActive(l))
)
const activeCount = computed(() => store.lists.filter(isActive).length)
const doneCount = computed(() => store.lists.filter((l) => !isActive(l) && l.sections.some((s) => s.items.length)).length)
const upcomingCount = computed(
  () => store.lists.filter((l) => l.startDate && l.startDate > today).length
)
const upcomingFirst = computed(() => {
  const items = store.lists
    .filter((l) => l.startDate && l.startDate > today)
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
  return items[0] ?? null
})
const totalOpenItems = computed(() =>
  store.lists.reduce(
    (n, l) => n + l.sections.reduce((m, s) => m + s.items.filter((i) => !i.checked).length, 0),
    0
  )
)
const spacesWithActive = computed(() => {
  const groups = []
  for (const space of store.spaces) {
    const active = store.lists.filter((l) => l.spaceId === space.id && isActive(l)).length
    if (active > 0) groups.push({ space, active })
  }
  return groups
})

const fmtDate = (isoStr, placeholder = 'date à définir') => {
  if (!isoStr || typeof isoStr !== 'string') return placeholder
  const [y, m, d] = isoStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  if (Number.isNaN(date.getTime())) return placeholder
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 6) return 'Bonne nuit'
  if (h < 12) return 'Bonjour'
  if (h < 18) return 'Bon après-midi'
  return 'Bonsoir'
})

function goToday() { router.push('/today') }

onMounted(() => {
  if (auth.isAuthenticated) store.refresh().catch(() => {})
})
function goLists() { router.push('/lists') }
function goCalendar() { router.push('/calendar') }
function goTemplates() { router.push('/templates') }
function goSettings() { router.push('/settings') }
function goFriends() { router.push('/friends') }
function goAdmin() { router.push('/admin') }
</script>

<template>
  <div class="view">
    <div class="hero">
      <div>
        <h1 class="hero-title font-display">{{ greeting }}</h1>
        <span class="hero-date font-mono">{{ todayLong }}</span>
      </div>
      <router-link to="/lists" class="hero-add" aria-label="Mes listes">
        <ClipboardList :size="20" />
      </router-link>
    </div>

    <div class="grid">
      <button
        class="tile tile-primary"
        :class="{ urgent: overdue.length > 0 }"
        @click="goToday"
      >
        <span class="tile-icon-wrap"><Sun :size="22" class="tile-icon" /></span>
        <span class="tile-label">Aujourd'hui</span>
        <span class="tile-value">{{ dueToday.length + overdue.length }}</span>
        <span class="tile-hint">
          {{ overdue.length > 0 ? `${overdue.length} en retard` : dueToday.length > 0 ? 'liste(s) à traiter' : 'rien de prévu' }}
        </span>
      </button>

      <button class="tile" @click="goLists">
        <span class="tile-icon-wrap"><ClipboardList :size="20" class="tile-icon" /></span>
        <span class="tile-label">Mes listes</span>
        <span class="tile-value">{{ activeCount }}</span>
        <span class="tile-hint">{{ totalOpenItems }} items à cocher</span>
      </button>

      <button class="tile" @click="goCalendar">
        <span class="tile-icon-wrap"><CalendarRange :size="20" class="tile-icon" /></span>
        <span class="tile-label">Calendrier</span>
        <span v-if="upcomingFirst" class="tile-value">{{ fmtDate(upcomingFirst.startDate, '-') }}</span>
        <span v-else class="tile-value">-</span>
        <span class="tile-hint">{{ upcomingCount }} à venir</span>
      </button>

      <button class="tile tile-done" @click="goLists">
        <span class="tile-icon-wrap"><CheckCircle2 :size="20" class="tile-icon" /></span>
        <span class="tile-label">Terminées</span>
        <span class="tile-value">{{ doneCount }}</span>
        <span class="tile-hint">bel avancement</span>
      </button>
      <button class="tile" @click="goFriends">
        <span class="tile-icon-wrap"><Users :size="20" class="tile-icon" /></span>
        <span class="tile-label">Amis</span>
        <span class="tile-value">{{ friends.accepted.length }}</span>
        <span class="tile-hint">listes partagées</span>
      </button>
      <button class="tile" @click="goSettings">
        <span class="tile-icon-wrap"><Settings :size="20" class="tile-icon" /></span>
        <span class="tile-label">Paramètres</span>
        <span class="tile-value">{{ auth.user?.username ?? '—' }}</span>
        <span class="tile-hint">compte et mot de passe</span>
      </button>
      <button v-if="auth.isAdmin" class="tile" @click="goAdmin">
        <span class="tile-icon-wrap"><Shield :size="20" class="tile-icon" /></span>
        <span class="tile-label">Admin</span>
        <span class="tile-value">—</span>
        <span class="tile-hint">gestion des utilisateurs</span>
      </button>
    </div>

    <section v-if="overdue.length" class="section">
      <h2 class="section-label">
        <AlertTriangle :size="13" class="warn" /> En retard
      </h2>
      <ul class="mini-lists">
        <li v-for="list in overdue.slice(0, 3)" :key="list.id">
          <router-link class="mini-row" :to="`/list/${list.id}`">
            <span class="mini-emoji">{{ list.emoji }}</span>
            <span class="mini-name">{{ list.name }}</span>
            <span class="mini-meta font-mono">prévu avant le {{ fmtDate(list.endDate) }}</span>
            <ArrowRight :size="14" class="mini-chevron" />
          </router-link>
        </li>
        <li v-if="overdue.length > 3">
          <button class="mini-more" @click="goToday">+ {{ overdue.length - 3 }} autre(s)</button>
        </li>
      </ul>
    </section>

    <section v-if="dueToday.length" class="section">
      <h2 class="section-label">
        <Sun :size="13" /> À traiter aujourd'hui
      </h2>
      <ul class="mini-lists">
        <li v-for="list in dueToday.slice(0, 4)" :key="list.id">
          <router-link class="mini-row" :to="`/list/${list.id}`">
            <span class="mini-emoji">{{ list.emoji }}</span>
            <span class="mini-name">{{ list.name }}</span>
            <span class="mini-meta font-mono">{{ progressOf(list) }}%</span>
            <ArrowRight :size="14" class="mini-chevron" />
          </router-link>
        </li>
        <li v-if="dueToday.length > 4">
          <button class="mini-more" @click="goToday">+ {{ dueToday.length - 4 }} autre(s)</button>
        </li>
      </ul>
    </section>

    <section class="section">
      <h2 class="section-label">
        <Clock :size="13" /> Prochainement
      </h2>
      <p v-if="!upcomingFirst" class="section-empty">Rien de planifié pour l'instant.</p>
      <ul v-else class="mini-lists">
        <li>
          <router-link class="mini-row" :to="`/list/${upcomingFirst.id}`">
            <span class="mini-emoji">{{ upcomingFirst.emoji }}</span>
            <span class="mini-name">{{ upcomingFirst.name }}</span>
            <span class="mini-meta font-mono">{{ fmtDate(upcomingFirst.startDate) }}</span>
            <ArrowRight :size="14" class="mini-chevron" />
          </router-link>
        </li>
      </ul>
    </section>

    <section class="section">
      <h2 class="section-label">
        <Sparkles :size="13" /> Vue d'ensemble
      </h2>
      <p v-if="!spacesWithActive.length" class="section-empty">Aucune liste active pour le moment.</p>
      <div v-else class="space-chips">
        <router-link
          v-for="g in spacesWithActive"
          :key="g.space.id"
          :to="`/lists?space=${g.space.id}`"
          class="space-chip"
        >
          <span class="space-chip-emoji">{{ g.space.emoji }}</span>
          <span class="space-chip-name">{{ g.space.name }}</span>
          <span class="space-chip-count font-mono">{{ g.active }}</span>
        </router-link>
      </div>
    </section>
  </div>
</template>

<style scoped>
.hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}
.hero-title {
  margin: 0;
  font-size: 1.45rem;
}
.hero-date {
  font-size: 0.7rem;
  color: var(--ink-faint);
  text-transform: uppercase;
  letter-spacing: 0.12em;
}
.hero-add {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border: 1px solid var(--line);
  border-radius: 0.85rem;
  color: var(--ink-muted);
}
.hero-add:active {
  background: var(--bg-2);
}
.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.7rem;
  margin-bottom: 1.75rem;
}
.tile {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.35rem;
  padding: 1rem;
  border: 1px solid var(--line);
  border-radius: 1.1rem;
  background: var(--bg-1);
  text-align: left;
  transition: border-color 0.15s, background 0.15s;
}
.tile:active {
  background: var(--bg-2);
}
.tile-primary {
  grid-column: 1 / -1;
  flex-direction: row;
  align-items: center;
  gap: 0.9rem;
  flex-wrap: wrap;
}
.tile-primary .tile-icon-wrap {
  width: 2.8rem;
  height: 2.8rem;
  border-radius: 0.9rem;
}
.tile-primary .tile-icon {
  width: 22px;
  height: 22px;
}
.tile-primary .tile-label {
  font-size: 1.05rem;
}
.tile-primary .tile-value {
  margin-left: auto;
  font-size: 1.6rem;
}
.tile-primary .tile-hint {
  flex-basis: 100%;
  margin-left: 3.7rem;
  margin-top: -0.4rem;
}
.tile.urgent {
  border-color: color-mix(in srgb, #e5484d 55%, var(--line));
}
.tile.urgent .tile-icon {
  color: #ff6b6b;
}
.tile.urgent .tile-value {
  color: #ff6b6b;
}
.tile-icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.3rem;
  height: 2.3rem;
  border: 1px solid var(--line);
  border-radius: 0.7rem;
  background: var(--bg-2);
}
.tile-icon {
  color: var(--accent);
}
.tile-label {
  font-weight: 700;
  font-size: 0.88rem;
}
.tile-value {
  font-size: 1.35rem;
  font-weight: 800;
  margin-top: 0.15rem;
}
.tile-hint {
  font-size: 0.7rem;
  color: var(--ink-faint);
}
.tile-done .tile-icon {
  color: #3fb950;
}
.section {
  margin-bottom: 1.5rem;
}
.section-label {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}
.section-empty {
  color: var(--ink-faint);
  font-size: 0.85rem;
  margin: 0.3rem 0 0;
}
.warn {
  color: #ff6b6b;
}
.mini-lists {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}
.mini-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.65rem 0.85rem;
  border: 1px solid var(--line);
  border-radius: 0.85rem;
  background: var(--bg-1);
}
.mini-row:active {
  background: var(--bg-2);
}
.mini-emoji {
  font-size: 1.15rem;
}
.mini-name {
  font-weight: 600;
  font-size: 0.9rem;
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.mini-meta {
  font-size: 0.68rem;
  color: var(--ink-faint);
  flex-shrink: 0;
}
.mini-chevron {
  color: var(--ink-faint);
  flex-shrink: 0;
}
.mini-more {
  width: 100%;
  padding: 0.5rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--accent);
}
.space-chips {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(9rem, 1fr));
  gap: 0.6rem;
}
.space-chip {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.75rem 0.85rem;
  border: 1px solid var(--line);
  border-radius: 0.9rem;
  background: var(--bg-1);
}
.space-chip:active {
  background: var(--bg-2);
}
.space-chip-emoji {
  font-size: 1.1rem;
}
.space-chip-name {
  flex: 1;
  min-width: 0;
  font-weight: 600;
  font-size: 0.82rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.space-chip-count {
  font-size: 0.72rem;
  color: var(--accent);
  background: var(--accent-deep);
  padding: 0.1rem 0.45rem;
  border-radius: 999px;
}
</style>
