<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { ClipboardList, LayoutGrid } from 'lucide-vue-next'

const route = useRoute()
const items = [
  { name: 'home', label: 'Mes listes', to: '/', icon: ClipboardList },
  { name: 'templates', label: 'Templates', to: '/templates', icon: LayoutGrid }
]
const isActive = (item) => {
  if (item.name === 'home') return route.name === 'home' || route.name === 'list'
  return route.name === 'templates' || route.name === 'template'
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
      <component :is="item.icon" :size="20" :stroke-width="2" />
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
  font-size: 0.65rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--ink-faint);
  transition: color 0.15s;
}
.nav-item.active {
  color: var(--accent);
}
</style>
