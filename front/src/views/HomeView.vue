<script setup>
import { ref } from 'vue'
import { useChecklistsStore } from '../stores/checklists'
import ItemCard from '../components/ItemCard.vue'
import AddCard from '../components/AddCard.vue'
import { X, LayoutGrid, FilePlus2 } from 'lucide-vue-next'

const store = useChecklistsStore()
const progressOf = (list) => {
  const items = list.sections.flatMap((s) => s.items)
  if (items.length === 0) return 0
  const done = items.filter((i) => i.checked).length
  return Math.round((done / items.length) * 100)
}

const showTemplatePicker = ref(false)
const showForm = ref(false)
const pickedTemplateId = ref(null)
const newName = ref('')

const pickedTemplate = () =>
  pickedTemplateId.value === 'blank'
    ? { id: 'blank', name: 'Liste vide', emoji: '📋' }
    : store.templateById(pickedTemplateId.value)

function openPicker() {
  showTemplatePicker.value = true
}

function pick(id) {
  pickedTemplateId.value = id
  showTemplatePicker.value = false
  showForm.value = true
  const tpl = id === 'blank' ? null : store.templateById(id)
  newName.value = tpl ? tpl.name : ''
}

function create() {
  const name = newName.value.trim()
  if (!name) return
  if (pickedTemplateId.value === 'blank') {
    store.createEmptyList(name)
  } else {
    store.createListFromTemplate(pickedTemplateId.value, name)
  }
  showForm.value = false
  pickedTemplateId.value = null
  newName.value = ''
}

function closeAll() {
  showTemplatePicker.value = false
  showForm.value = false
  pickedTemplateId.value = null
  newName.value = ''
}
</script>

<template>
  <div class="view">
    <div class="view-header">
      <h1 class="view-title font-display">Mes listes</h1>
    </div>

    <ul class="lists">
      <li v-for="list in store.lists" :key="list.id">
        <ItemCard
          :to="`/list/${list.id}`"
          :emoji="list.emoji"
          :name="list.name"
          :meta="`${list.sections.length} rubriques · ${progressOf(list)}%`"
          @delete="store.removeList(list.id)"
        />
      </li>
      <li><AddCard label="Ajouter une liste" @click="openPicker" /></li>
    </ul>

    <div v-if="showTemplatePicker" class="overlay" @click.self="closeAll">
      <div class="dialog">
        <div class="dialog-head">
          <span class="font-mono dialog-title">Partir d'un template</span>
          <button class="icon-btn" aria-label="Fermer" @click="closeAll"><X :size="18" /></button>
        </div>
        <div class="picker-list">
          <button
            v-for="tpl in store.templates"
            :key="tpl.id"
            class="picker-item"
            @click="pick(tpl.id)"
          >
            <span class="emoji">{{ tpl.emoji }}</span>
            <span class="picker-info">
              <span class="picker-name">{{ tpl.name }}</span>
              <span class="picker-desc">{{ tpl.description }}</span>
            </span>
            <LayoutGrid :size="16" class="picker-icon" />
          </button>
          <button class="picker-item" @click="pick('blank')">
            <span class="emoji">📄</span>
            <span class="picker-info">
              <span class="picker-name">Créer une liste vide</span>
              <span class="picker-desc">Partir d'une page blanche</span>
            </span>
            <FilePlus2 :size="16" class="picker-icon" />
          </button>
        </div>
      </div>
    </div>

    <div v-if="showForm" class="overlay" @click.self="closeAll">
      <div class="dialog">
        <div class="dialog-head">
          <span class="font-mono dialog-title">Nouvelle liste</span>
          <button class="icon-btn" aria-label="Fermer" @click="closeAll"><X :size="18" /></button>
        </div>
        <form @submit.prevent="create">
          <div class="picked-from font-mono">
            {{ pickedTemplate()?.emoji }} {{ pickedTemplate()?.name }}
          </div>
          <input v-model="newName" class="input" type="text" placeholder="Nom de la liste" autofocus />
          <button type="submit" class="submit">Créer</button>
        </form>
      </div>
    </div>
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
.dialog-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}
.dialog-title {
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.18em;
  color: var(--ink-faint);
}
.icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 0.5rem;
  color: var(--ink-muted);
}
.picker-list {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
.picker-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.65rem 0.7rem;
  border: 1px solid var(--line);
  border-radius: 0.75rem;
  text-align: left;
  transition: border-color 0.15s;
}
.picker-item:active {
  border-color: var(--accent-dim);
}
.emoji {
  font-size: 1.25rem;
}
.picker-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.picker-name {
  font-weight: 600;
  font-size: 0.9rem;
}
.picker-desc {
  font-size: 0.72rem;
  color: var(--ink-faint);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.picker-icon {
  color: var(--ink-faint);
  flex-shrink: 0;
}
.picked-from {
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.18em;
  color: var(--ink-faint);
  margin-bottom: 0.6rem;
}
.input {
  width: 100%;
  padding: 0.6rem 0.75rem;
  border: 1px solid var(--line);
  border-radius: 0.7rem;
  background: var(--bg-2);
  color: var(--ink);
  outline: none;
  margin-bottom: 0.6rem;
}
.input:focus {
  border-color: var(--accent-dim);
}
.submit {
  width: 100%;
  padding: 0.65rem;
  border-radius: 0.7rem;
  background: var(--accent);
  color: #fff;
  font-weight: 700;
  font-size: 0.9rem;
}
</style>
