<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useChecklistsStore } from '../stores/checklists'
import ChecklistSection from '../components/ChecklistSection.vue'
import AddItemFab from '../components/AddItemFab.vue'
import { ArrowLeft, Eraser } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const store = useChecklistsStore()

const list = computed(() => store.listById(route.params.id))

const total = computed(() =>
  list.value ? list.value.sections.reduce((n, s) => n + s.items.length, 0) : 0
)
const done = computed(() =>
  list.value
    ? list.value.sections.reduce((n, s) => n + s.items.filter((i) => i.checked).length, 0)
    : 0
)
const progress = computed(() => (total.value === 0 ? 0 : Math.round((done.value / total.value) * 100)))
</script>

<template>
  <div v-if="list" class="view">
    <div class="view-header">
      <button class="back" aria-label="Retour" @click="router.back()">
        <ArrowLeft :size="20" />
      </button>
      <div class="title-block">
        <h1 class="view-title font-display">{{ list.emoji }} {{ list.name }}</h1>
        <span class="font-mono meta">{{ done }}/{{ total }} · {{ progress }}%</span>
      </div>
      <button class="clear" v-if="done > 0" @click="store.clearChecked(list.id)">
        <Eraser :size="16" /> Vider
      </button>
    </div>

    <div class="global-progress">
      <div class="global-fill" :style="{ width: progress + '%' }" />
    </div>

    <ChecklistSection
      v-for="section in list.sections"
      :key="section.id"
      :list-id="list.id"
      :section="section"
    />

    <AddItemFab :list-id="list.id" />
  </div>
</template>

<style scoped>
.view-header {
  margin-bottom: 0.75rem;
}
.back {
  flex-shrink: 0;
  width: 2.25rem;
  height: 2.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.6rem;
  color: var(--ink-muted);
}
.back:active {
  background: var(--bg-2);
}
.title-block {
  flex: 1;
  min-width: 0;
}
.meta {
  font-size: 0.7rem;
  color: var(--ink-faint);
}
.clear {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  flex-shrink: 0;
  padding: 0.4rem 0.7rem;
  font-size: 0.75rem;
  font-weight: 600;
  border: 1px solid var(--line);
  border-radius: 0.6rem;
  color: var(--ink-muted);
}
.clear:active {
  background: var(--bg-2);
}
.global-progress {
  height: 4px;
  border-radius: 999px;
  background: var(--bg-2);
  margin-bottom: 1.25rem;
  overflow: hidden;
}
.global-fill {
  height: 100%;
  background: var(--accent);
  border-radius: 999px;
  transition: width 0.25s;
}
</style>
