<script setup>
import { useChecklistsStore } from '../stores/checklists'
import { useUndoToast } from '../composables/useUndoToast'
import ItemRow from './ItemRow.vue'

const props = defineProps({
  listId: { type: String, required: true },
  items: { type: Array, required: true }
})

const store = useChecklistsStore()
const toast = useUndoToast()

function sectionIdOf(itemId) {
  const list = store.listById(props.listId)
  for (const s of list.sections) {
    if (s.items.some((i) => i.id === itemId)) return s.id
  }
  return null
}

function increment(item) {
  const sectionId = sectionIdOf(item.id)
  if (!sectionId) return
  const n = Number(item.quantity)
  store.setQuantity(props.listId, sectionId, item.id, (Number.isFinite(n) && n > 0 ? n : 1) + 1)
}

function decrement(item) {
  const sectionId = sectionIdOf(item.id)
  if (!sectionId) return
  const n = Number(item.quantity)
  if (Number.isFinite(n) && n > 1) {
    store.setQuantity(props.listId, sectionId, item.id, n - 1)
  }
}

function deleteItem(item) {
  const sectionId = sectionIdOf(item.id)
  if (!sectionId) return
  const payload = store.removeItem(props.listId, sectionId, item.id)
  toast.show(`« ${item.label} » supprimé`, () => store.restoreItem(props.listId, sectionId, payload))
}
</script>

<template>
  <section class="pile">
    <div class="pile-head font-mono">Fait · {{ items.length }}</div>
    <ul class="items">
      <ItemRow
        v-for="item in items"
        :key="item.id"
        :label="item.label"
        :quantity="item.quantity"
        :kind="item.kind ?? 'task'"
        checked
        :swipeable="false"
        @toggle="store.toggleItem(listId, sectionIdOf(item.id), item.id)"
        @delete="deleteItem(item)"
        @increment="increment(item)"
        @decrement="decrement(item)"
      />
    </ul>
  </section>
</template>

<style scoped>
.pile {
  margin-top: 1.75rem;
  padding: 0.85rem 0.9rem;
  border: 1px dashed var(--line);
  border-radius: 1rem;
  background: color-mix(in srgb, var(--bg-1) 60%, transparent);
}
.pile-head {
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.18em;
  color: var(--ink-faint);
  margin-bottom: 0.6rem;
}
.items {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}
</style>
