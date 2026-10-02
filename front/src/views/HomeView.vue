<script setup>
import { computed } from 'vue'
import { useChecklistsStore } from '../stores/checklists'
import { ChevronRight, Sparkles } from 'lucide-vue-next'

const store = useChecklistsStore()

const progressOf = (list) => {
  const items = list.sections.flatMap((s) => s.items)
  if (items.length === 0) return 0
  const done = items.filter((i) => i.checked).length
  return Math.round((done / items.length) * 100)
}
</script>

<template>
  <div class="view">
    <div class="view-header">
      <h1 class="view-title font-display">Mes listes</h1>
    </div>

    <ul class="lists">
      <li v-for="list in store.lists" :key="list.id">
        <router-link class="list-card" :to="`/list/${list.id}`">
          <span class="emoji">{{ list.emoji }}</span>
          <span class="list-info">
            <span class="list-name">{{ list.name }}</span>
            <span class="list-meta font-mono">
              {{ list.sections.length }} rubriques · {{ progressOf(list) }}%
            </span>
          </span>
          <ChevronRight :size="18" class="chev" />
        </router-link>
      </li>
    </ul>

    <h2 class="section-label">Templates réutilisables</h2>
    <ul class="lists">
      <li v-for="tpl in store.templates" :key="tpl.id">
        <router-link class="list-card template" :to="`/template/${tpl.id}`">
          <span class="emoji">{{ tpl.emoji }}</span>
          <span class="list-info">
            <span class="list-name">{{ tpl.name }}</span>
            <span class="list-meta">{{ tpl.description }}</span>
          </span>
          <Sparkles :size="16" class="chev" />
        </router-link>
      </li>
    </ul>
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
.list-card {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  padding: 0.85rem 1rem;
  border: 1px solid var(--line);
  border-radius: 1rem;
  background: var(--bg-1);
  transition: border-color 0.15s, background 0.15s;
}
.list-card:active {
  background: var(--bg-2);
}
.list-card.template {
  border-style: dashed;
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
.list-meta {
  font-size: 0.75rem;
  color: var(--ink-faint);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.chev {
  color: var(--ink-faint);
  flex-shrink: 0;
}
</style>
