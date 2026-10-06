<script setup>
import { computed, ref } from 'vue'
import { useChecklistsStore } from '../stores/checklists'
import { api } from '../services/api'
import { stepQuantity } from '../services/quantity'
import { useUndoToast } from '../composables/useUndoToast'
import ItemRow from './ItemRow.vue'
import ItemEditDialog from './ItemEditDialog.vue'

const props = defineProps({
  listId: { type: String, required: true },
  section: { type: Object, required: true },
  allSections: { type: Array, default: () => [] }
})

const store = useChecklistsStore()
const toast = useUndoToast()

const unchecked = computed(() => props.section.items.filter((i) => !i.checked))

async function deleteItem(item) {
  const payload = await store.removeItem(props.listId, props.section.id, item.id)
  toast.show(`« ${item.label} » supprimé`, () => store.restoreItem(props.listId, props.section.id, payload))
}

function moveItem(itemId, toSectionId) {
  store.moveItem(props.listId, props.section.id, itemId, toSectionId)
}

const drag = ref(null)

function onDragStart(item, e) {
  drag.value = { itemId: item.id, fromSectionId: props.section.id }
  e.dataTransfer.effectAllowed = 'move'
  e.dataTransfer.setData('text/plain', item.id)
}

function onDragOver(item, e) {
  if (!drag.value) return
  const list = store.listById(props.listId)
  if (!list) return
  const from = list.sections.find((s) => s.id === drag.value.fromSectionId)
  const to = list.sections.find((s) => s.id === props.section.id)
  if (!from || !to) return
  let targetIdx
  if (!item) {
    targetIdx = to.items.length
  } else {
    const itemIdx = to.items.findIndex((i) => i.id === item.id)
    if (itemIdx === -1) return
    const rect = e.currentTarget.getBoundingClientRect()
    const after = e.clientY > rect.top + rect.height / 2
    targetIdx = itemIdx + (after ? 1 : 0)
  }
  const fromIdx = from.items.findIndex((i) => i.id === drag.value.itemId)
  if (fromIdx === -1) return
  const [moved] = from.items.splice(fromIdx, 1)
  if (from === to && fromIdx < targetIdx) {
    to.items.splice(targetIdx - 1, 0, moved)
  } else {
    to.items.splice(targetIdx, 0, moved)
  }
  drag.value.fromSectionId = to.id
}

async function onDrop() {
  if (!drag.value) return
  const { itemId, fromSectionId } = drag.value
  drag.value = null
  const list = store.listById(props.listId)
  if (!list) return
  const to = list.sections.find((s) => s.id === props.section.id)
  if (!to) return
  const position = to.items.findIndex((i) => i.id === itemId)
  if (position === -1) return
  try {
    await api.moveItem(itemId, to.id, position)
  } catch {
    await store.refresh()
  }
}

function onSectionDragOver(e) {
  if (!drag.value) return
  const ul = e.currentTarget
  const rect = ul.getBoundingClientRect()
  const last = ul.lastElementChild
  if (last) {
    const lastRect = last.getBoundingClientRect()
    if (e.clientY > lastRect.bottom) onDragOver(null, e)
  } else {
    onDragOver(null, e)
  }
}

function increment(item) {
  store.setQuantity(props.listId, props.section.id, item.id, stepQuantity(item.quantity || '1', 1))
}

function decrement(item) {
  store.setQuantity(props.listId, props.section.id, item.id, stepQuantity(item.quantity || '1', -1))
}

const editingItem = ref(null)

function saveEdit(payload) {
  if (!editingItem.value) return
  store.updateItem(props.listId, props.section.id, editingItem.value.id, payload)
  toast.show('Item modifié')
}
</script>

<template>
  <ul class="items" @dragover="onSectionDragOver($event)" @drop.prevent="onDrop">
    <ItemRow
      v-for="item in unchecked"
      :key="item.id"
      draggable="true"
      @dragstart="onDragStart(item, $event)"
      @dragover.prevent="onDragOver(item, $event)"
      @drop.prevent.stop="onDrop"
      @dragend="drag = null"
      :label="item.label"
      :quantity="item.quantity"
      :kind="item.kind ?? 'task'"
      :sections="allSections.filter((s) => s.id !== section.id)"
      show-move
      @toggle="store.toggleItem(listId, section.id, item.id)"
      @delete="deleteItem(item)"
      @move="(to) => moveItem(item.id, to)"
      @increment="increment(item)"
      @decrement="decrement(item)"
      @edit="editingItem = item"
    />
  </ul>

  <ItemEditDialog
    v-if="editingItem"
    :item="editingItem"
    @close="editingItem = null"
    @saved="saveEdit"
  />
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
