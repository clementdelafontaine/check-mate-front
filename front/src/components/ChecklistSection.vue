<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useChecklistsStore } from '../stores/checklists'
import { MoreVertical, Trash2 } from 'lucide-vue-next'

const props = defineProps({
  listId: { type: String, required: true },
  section: { type: Object, required: true }
})

const store = useChecklistsStore()
const openMenuId = ref(null)
const confirmItem = ref(null)
const root = ref(null)

function onDocClick(e) {
  if (openMenuId.value && root.value && !root.value.contains(e.target)) openMenuId.value = null
  if (confirmItem.value && root.value && !root.value.contains(e.target)) confirmItem.value = null
}
onMounted(() => document.addEventListener('click', onDocClick))
onBeforeUnmount(() => document.removeEventListener('click', onDocClick))

function askDelete(item) {
  openMenuId.value = null
  confirmItem.value = item
}
function doDelete() {
  if (confirmItem.value) store.removeItem(props.listId, props.section.id, confirmItem.value.id)
  confirmItem.value = null
}
</script>

<template>
  <section ref="root">
    <ul class="items">
      <li v-for="item in section.items.filter((i) => !i.checked)" :key="item.id" class="item-row">
        <button class="item" @click="store.toggleItem(listId, section.id, item.id)">
          <span class="checkbox" />
          <span class="label">{{ item.label }}</span>
          <span v-if="item.quantity" class="qty font-mono">×{{ item.quantity }}</span>
        </button>
        <div class="menu-wrap">
          <button
            class="icon-btn"
            aria-label="Options"
            @click.stop="openMenuId = openMenuId === item.id ? null : item.id"
          >
            <MoreVertical :size="16" />
          </button>
          <div v-if="openMenuId === item.id" class="menu" @click.stop>
            <button class="menu-item danger" @click="askDelete(item)">
              <Trash2 :size="14" /> Supprimer
            </button>
          </div>
        </div>
      </li>
    </ul>

    <div v-if="confirmItem" class="overlay" @click.self="confirmItem = null">
      <div class="dialog">
        <p class="dialog-text">
          Supprimer <strong>{{ confirmItem.label }}</strong> ?
          Cette action est définitive.
        </p>
        <div class="dialog-actions">
          <button class="btn ghost" @click="confirmItem = null">Annuler</button>
          <button class="btn danger" @click="doDelete">Supprimer</button>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.items {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}
.item-row {
  display: flex;
  align-items: center;
  gap: 0.15rem;
}
.item {
  flex: 1;
  min-width: 0;
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
.label {
  font-size: 0.95rem;
}
.qty {
  font-size: 0.7rem;
  color: var(--ink-faint);
  margin-left: auto;
  flex-shrink: 0;
}
.menu-wrap {
  position: relative;
  flex-shrink: 0;
}
.icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.9rem;
  height: 1.9rem;
  border-radius: 0.5rem;
  color: var(--ink-muted);
}
.icon-btn:active {
  background: var(--bg-2);
}
.menu {
  position: absolute;
  right: 0;
  top: calc(100% + 0.25rem);
  z-index: 50;
  min-width: 9rem;
  padding: 0.35rem;
  border: 1px solid var(--line);
  border-radius: 0.75rem;
  background: var(--bg-1);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.55);
}
.menu-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.5rem 0.65rem;
  border-radius: 0.55rem;
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--ink-muted);
}
.menu-item:active {
  background: var(--bg-2);
}
.menu-item.danger {
  color: #ff6b6b;
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
