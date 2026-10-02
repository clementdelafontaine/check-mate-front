<script setup>
import { computed } from 'vue'
import { useChecklistsStore } from '../stores/checklists'

const props = defineProps({
  listId: { type: String, required: true },
  section: { type: Object, required: true }
})

const store = useChecklistsStore()

const unchecked = computed(() => props.section.items.filter((i) => !i.checked))
const checked = computed(() => props.section.items.filter((i) => i.checked))
const progress = computed(() => {
  const total = props.section.items.length
  return total === 0 ? 0 : Math.round((checked.value.length / total) * 100)
})
</script>

<template>
  <section class="section">
    <div class="section-head">
      <h3 class="section-name">{{ section.name }}</h3>
      <span class="section-count font-mono">{{ unchecked.length }}/{{ section.items.length }}</span>
    </div>
    <div class="progress-track"><div class="progress-fill" :style="{ width: progress + '%' }" /></div>
    <ul class="items">
      <li v-for="item in unchecked" :key="item.id">
        <button class="item" @click="store.toggleItem(listId, section.id, item.id)">
          <span class="checkbox" />
          <span class="label">{{ item.label }}</span>
        </button>
      </li>
    </ul>
    <div v-if="checked.length" class="checked-pile">
      <div class="pile-head font-mono">Dans le panier · {{ checked.length }}</div>
      <ul class="items">
        <li v-for="item in checked" :key="item.id">
          <button class="item checked" @click="store.toggleItem(listId, section.id, item.id)">
            <span class="checkbox done"><svg viewBox="0 0 24 24" width="13" height="13"><path d="M5 12.5l4 4L19 7" stroke="currentColor" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
            <span class="label">{{ item.label }}</span>
          </button>
        </li>
      </ul>
    </div>
  </section>
</template>

<style scoped>
.section {
  margin-bottom: 1.5rem;
}
.section-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.5rem;
}
.section-name {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 700;
}
.section-count {
  font-size: 0.7rem;
  color: var(--ink-faint);
}
.progress-track {
  height: 3px;
  border-radius: 999px;
  background: var(--bg-2);
  margin: 0.4rem 0 0.6rem;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  border-radius: 999px;
  background: var(--accent);
  transition: width 0.25s;
}
.items {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}
.item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.7rem 0.85rem;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: var(--bg-1);
  text-align: left;
  transition: background 0.15s, border-color 0.15s;
  min-height: 2.75rem;
}
.item:active {
  background: var(--bg-2);
}
.checkbox {
  flex-shrink: 0;
  width: 1.25rem;
  height: 1.25rem;
  border: 1.5px solid var(--line-bright);
  border-radius: 0.45rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--accent);
}
.checkbox.done {
  border-color: var(--accent-dim);
  background: var(--accent-deep);
}
.label {
  font-size: 0.95rem;
}
.item.checked {
  opacity: 0.55;
}
.item.checked .label {
  text-decoration: line-through;
  color: var(--ink-muted);
}
.checked-pile {
  margin-top: 0.75rem;
  padding: 0.65rem 0.75rem 0.75rem;
  border: 1px dashed var(--line);
  border-radius: var(--radius);
  background: color-mix(in srgb, var(--bg-1) 60%, transparent);
}
.pile-head {
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.18em;
  color: var(--ink-faint);
  margin-bottom: 0.5rem;
}
</style>
