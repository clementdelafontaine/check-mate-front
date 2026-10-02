<script setup>
import { computed } from 'vue'
import { useChecklistsStore } from '../stores/checklists'
import { useUndoToast } from '../composables/useUndoToast'
import ItemRow from './ItemRow.vue'

const props = defineProps({
  listId: { type: String, required: true },
  section: { type: Object, required: true },
  allSections: { type: Array, default: () => [] }
})

const store = useChecklistsStore()
const toast = useUndoToast()

const unchecked = computed(() => props.section.items.filter((i) => !i.checked))

function deleteItem(item) {
  const payload = store.removeItem(props.listId, props.section.id, item.id)
  toast.show(`« ${item.label} » supprimé`, () => store.restoreItem(props.listId, props.section.id, payload))
}

function moveItem(itemId, toSectionId) {
  store.moveItem(props.listId, props.section.id, itemId, toSectionId)
}

function increment(item) {
  const n = Number(item.quantity)
  store.setQuantity(props.listId, props.section.id, item.id, (Number.isFinite(n) && n > 0 ? n : 1) + 1)
}

function decrement(item) {
  const n = Number(item.quantity)
  if (Number.isFinite(n) && n > 1) {
    store.setQuantity(props.listId, props.section.id, item.id, n - 1)
  }
}
</script>

<template>
  <ul class="items">
    <ItemRow
      v-for="item in unchecked"
      :key="item.id"
      :label="item.label"
      :quantity="item.quantity"
      :sections="allSections.filter((s) => s.id !== section.id)"
      show-move
      :stepper="item.kind === 'product'"
      @toggle="store.toggleItem(listId, section.id, item.id)"
      @delete="deleteItem(item)"
      @move="(to) => moveItem(item.id, to)"
      @increment="increment(item)"
      @decrement="decrement(item)"
    />
  </ul>
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
</style>
