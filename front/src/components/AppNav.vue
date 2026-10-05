<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useChecklistsStore } from '../stores/checklists'
import { House, Sun, CalendarRange, ClipboardList, LayoutGrid, CookingPot } from 'lucide-vue-next'

const route = useRoute()
const store = useChecklistsStore()

const items = [
  { name: 'home', label: 'Accueil', to: '/', icon: House },
  { name: 'today', label: 'Aujourd\'hui', to: '/today', icon: Sun },
  { name: 'lists', label: 'Mes listes', to: '/lists', icon: ClipboardList },
  { name: 'calendar', label: 'Calendrier', to: '/calendar', icon: CalendarRange },
  { name: 'recipes', label: 'Recettes', to: '/recipes', icon: CookingPot },
  { name: 'templates', label: 'Templates', to: '/templates', icon: LayoutGrid }
]

const todayCount = computed(() => {
  const today = new Date().toISOString().slice(0, 10)
  return store.lists.filter(
    (l) =>
      l.startDate &&
      l.startDate <= today &&
      (!l.endDate || l.endDate >= today) &&
      l.sections.some((s) => s.items.some((i) => !i.checked))
  ).length
})

const isActive = (item) => {
  if (item.name === 'lists') return route.name === 'lists' || route.name === 'list'
  if (item.name === 'recipes') return route.name === 'recipes' || route.name === 'recipe'
  if (item.name === 'templates') return route.name === 'templates' || route.name === 'template'
  return route.name === item.name
}
</script>

<template>
  <nav class="nav">
    <router-link
      v-for="item in items"
      :key="item.name"
      :to="item.to"
      class="nav-item"
      :class="{ active: isActive(item) }"
    >
      <span class="nav-icon-wrap">
        <component :is="item.icon" :size="20" :stroke-width="2" />
        <span v-if="item.name === 'today' && todayCount > 0" class="badge">{{ todayCount }}</span>
      </span>
      <span>{{ item.label }}</span>
    </router-link>
  </nav>
</template>

<style scoped>
.nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 30;
  display: flex;
  border-top: 1px solid var(--line);
  background: var(--bg-1);
  padding-bottom: env(safe-area-inset-bottom);
}
.nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
  padding: 0.55rem 0 0.5rem;
  font-size: 0.6rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--ink-faint);
  transition: color 0.15s;
}
.nav-item.active {
  color: var(--accent);
}
.nav-icon-wrap {
  position: relative;
  display: flex;
}
.badge {
  position: absolute;
  top: -0.3rem;
  right: -0.55rem;
  min-width: 1rem;
  height: 1rem;
  padding: 0 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: var(--accent);
  color: #fff;
  font-size: 0.6rem;
  font-weight: 700;
  font-family: ui-monospace, monospace;
}
</style>
