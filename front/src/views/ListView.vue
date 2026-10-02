<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useChecklistsStore } from '../stores/checklists'
import ChecklistSection from '../components/ChecklistSection.vue'
import CheckedPile from '../components/CheckedPile.vue'
import AddItemCard from '../components/AddItemCard.vue'
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

const checkedItems = computed(() =>
  list.value ? list.value.sections.flatMap((s) => s.items.filter((i) => i.checked)) : []
)

const confirmClear = ref(false)
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
      <button v-if="done > 0" class="clear" @click="confirmClear = true">
        <Eraser :size="16" /> Vider
      </button>
    </div>

    <div class="global-progress">
      <div class="global-fill" :style="{ width: progress + '%' }" />
    </div>

    <section v-for="section in list.sections" :key="section.id" class="section-block">
      <div class="section-head">
        <h3 class="section-name">{{ section.name }}</h3>
        <span class="section-count font-mono">
          {{ section.items.filter((i) => !i.checked).length }}/{{ section.items.length }}
        </span>
      </div>
      <ChecklistSection :list-id="list.id" :section="section" />
    </section>

    <AddItemCard :list-id="list.id" />

    <CheckedPile v-if="checkedItems.length" :list-id="list.id" :items="checkedItems" />

    <div v-if="confirmClear" class="overlay" @click.self="confirmClear = false">
      <div class="dialog">
        <p class="dialog-text">
          Vider la liste <strong>{{ list.name }}</strong> ?
          Les {{ done }} item(s) cochés seront retirés définitivement.
        </p>
        <div class="dialog-actions">
          <button class="btn ghost" @click="confirmClear = false">Annuler</button>
          <button class="btn danger" @click="store.clearChecked(list.id); confirmClear = false">
            Vider
          </button>
        </div>
      </div>
    </div>
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
.section-block {
  margin-bottom: 1.5rem;
}
.section-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
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
.dialog-text {
  margin: 0 0 1rem;
  font-size: 0.95rem;
  line-height: 1.5;
}
.dialog-actions {
  display: flex;
  gap: 0.6rem;
  justify-content: flex-end;
}
.btn {
  padding: 0.55rem 1rem;
  border-radius: 0.7rem;
  font-size: 0.85rem;
  font-weight: 700;
}
.btn.ghost {
  border: 1px solid var(--line);
  color: var(--ink-muted);
}
.btn.danger {
  background: #e5484d;
  color: #fff;
}
</style>
