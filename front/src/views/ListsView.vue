<script setup>
import { ref, computed } from 'vue'
import { useChecklistsStore } from '../stores/checklists'
import { useUndoToast } from '../composables/useUndoToast'
import ItemCard from '../components/ItemCard.vue'
import AddCard from '../components/AddCard.vue'
import ListEditDialog from '../components/ListEditDialog.vue'
import SpacePicker from '../components/SpacePicker.vue'
import { X, LayoutGrid, FilePlus2, ArrowDownUp } from 'lucide-vue-next'

const store = useChecklistsStore()
const toast = useUndoToast()

const progressOf = (list) => {
  const items = list.sections.flatMap((s) => s.items)
  if (items.length === 0) return 0
  const done = items.filter((i) => i.checked).length
  return Math.round((done / items.length) * 100)
}
const isActive = (list) => list.sections.some((s) => s.items.some((i) => !i.checked))

const sortBy = ref('smart')
const sortOptions = [
  { id: 'smart', label: 'Smart' },
  { id: 'name', label: 'A→Z' },
  { id: 'progress', label: 'Prog.' }
]
function cycleSort() {
  const i = sortOptions.findIndex((o) => o.id === sortBy.value)
  sortBy.value = sortOptions[(i + 1) % sortOptions.length].id
}
const sortLabel = computed(() => sortOptions.find((o) => o.id === sortBy.value)?.label ?? '')

const spaceFilter = ref(null)
const filteredLists = computed(() => {
  let lists = spaceFilter.value
    ? store.lists.filter((l) => l.spaceId === spaceFilter.value)
    : store.lists
  if (sortBy.value === 'name') {
    lists = [...lists].sort((a, b) => a.name.localeCompare(b.name, 'fr'))
  } else if (sortBy.value === 'progress') {
    lists = [...lists].sort((a, b) => progressOf(b) - progressOf(a))
  } else {
    lists = [...lists].sort((a, b) => Number(isActive(b)) - Number(isActive(a)))
  }
  return lists
})


async function removeList(list) {
  const payload = await store.removeList(list.id)
  if (payload) toast.show(`« ${list.name} » supprimée`, () => store.restoreList(payload))
}

const editingList = ref(null)

const showTemplatePicker = ref(false)
const showForm = ref(false)
const pickedTemplateId = ref(null)
const newName = ref('')
const newEmoji = ref('📋')
const newSpaceId = ref('')
const newStartDate = ref('')
const newEndDate = ref('')
const hasDate = ref(false)
const hasRange = ref(false)

function toggleHasDate() {
  hasDate.value = !hasDate.value
  if (!hasDate.value) {
    hasRange.value = false
    newStartDate.value = ''
    newEndDate.value = ''
  }
}

function toggleHasRange() {
  hasRange.value = !hasRange.value
  newEndDate.value = ''
}

const listStart = () => (hasDate.value && newStartDate.value ? newStartDate.value : null)
const listEnd = () => (hasRange.value && newEndDate.value ? newEndDate.value : listStart())

const EMOJIS = ['📋', '🛒', '🧳', '🏠', '✈️', '🎒', '🎁', '📝', '🌟', '🧹', '🔧', '💊']

const pickedTemplate = () =>
  pickedTemplateId.value === 'blank'
    ? { id: 'blank', name: 'Liste vide', emoji: '📋' }
    : store.templateById(pickedTemplateId.value)

function pick(id) {
  pickedTemplateId.value = id
  showTemplatePicker.value = false
  showForm.value = true
  const tpl = id === 'blank' ? null : store.templateById(id)
  newName.value = tpl ? tpl.name : ''
  newEmoji.value = tpl ? tpl.emoji : '📋'
  newSpaceId.value = store.spaces[0]?.id ?? ''
  newStartDate.value = ''
  newEndDate.value = ''
}


function create() {
  const name = newName.value.trim()
  if (!name) return
  const created =
    pickedTemplateId.value === 'blank'
      ? store.createEmptyList(name, newEmoji.value, newSpaceId.value, [], listStart(), listEnd())
      : store.createListFromTemplate(pickedTemplateId.value, name, newEmoji.value, newSpaceId.value)
    showForm.value = false
  pickedTemplateId.value = null
  toast.show('Liste créée')
}

function closeAll() {
  showTemplatePicker.value = false
  showForm.value = false
  pickedTemplateId.value = null
  newName.value = ''
  hasDate.value = false
  hasRange.value = false
  newStartDate.value = ''
  newEndDate.value = ''
}

</script>

<template>
  <div class="view">
    <div class="view-header">
      <h1 class="view-title font-display">Mes listes</h1>
      <button class="sort-btn" @click="cycleSort">
        <ArrowDownUp :size="14" /> {{ sortLabel }}
      </button>
    </div>

    <div class="label-bar">
      <button
        class="label-chip all"
        :class="{ active: !spaceFilter }"
        @click="spaceFilter = null"
      >
        Tout
      </button>
      <button
        v-for="space in store.spaces"
        :key="space.id"
        class="label-chip"
        :class="{ active: spaceFilter === space.id }"
        @click="spaceFilter = spaceFilter === space.id ? null : space.id"
      >
        {{ space.emoji }} {{ space.name }}
      </button>
    </div>

    <ul class="lists">
      <li v-for="list in filteredLists" :key="list.id">
        <ItemCard
          :to="`/list/${list.id}`"
          :emoji="list.emoji"
          :name="list.name"
          :meta="`${progressOf(list)}%`"
          editable
          @delete="removeList(list)"
          @edit="editingList = list"
        />
      </li>
    </ul>

    <ul class="lists">
      <li><AddCard label="Ajouter une liste" @click="showTemplatePicker = true" /></li>
    </ul>

    <ListEditDialog
      v-if="editingList"
      :list="editingList"
      @close="editingList = null"
      @saved="toast.show('Liste modifiée')"
    />

    
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
          <div class="emoji-row">
            <button
              v-for="e in EMOJIS"
              :key="e"
              type="button"
              class="emoji-choice"
              :class="{ active: newEmoji === e }"
              @click="newEmoji = e"
            >
              {{ e }}
            </button>
          </div>
          <input v-model="newName" class="input" type="text" placeholder="Nom de la liste" autofocus />

          <SpacePicker v-model="newSpaceId" />

          
          <div class="dates-block">
            <button type="button" class="date-toggle" :class="{ active: hasDate }" @click="toggleHasDate">
              <span class="toggle-dot" /> Programmer une date
            </button>
            <template v-if="hasDate">
              <div class="dates-row">
                <input v-model="newStartDate" class="input date" type="date" />
                <button
                  v-if="!hasRange"
                  type="button"
                  class="range-btn"
                  aria-label="Ajouter une date de fin"
                  @click="toggleHasRange"
                >+</button>
                <template v-else>
                  <span class="date-sep">→</span>
                  <input v-model="newEndDate" class="input date" type="date" />
                  <button
                    type="button"
                    class="range-btn"
                    aria-label="Retirer la date de fin"
                    @click="toggleHasRange"
                  >−</button>
                </template>
              </div>
              <p v-if="hasRange && newStartDate && newEndDate && newEndDate < newStartDate" class="date-error">
                La date de fin doit suivre la date de début.
              </p>
            </template>
          </div>

          <button type="submit" class="submit">Créer</button>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.view-header {
  justify-content: space-between;
}
.sort-btn {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.4rem 0.7rem;
  font-size: 0.75rem;
  font-weight: 600;
  border: 1px solid var(--line);
  border-radius: 0.6rem;
  color: var(--ink-muted);
}
.sort-btn:active {
  border-color: var(--accent-dim);
  color: var(--accent);
}
.label-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-bottom: 1.25rem;
}
.label-chip {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.32rem 0.7rem;
  font-size: 0.75rem;
  font-weight: 600;
  border: 1px solid var(--line);
  border-radius: 999px;
  color: var(--ink-muted);
  transition: border-color 0.15s, color 0.15s, background 0.15s;
}
.label-chip.active {
  border-color: var(--chip-color, var(--accent));
  color: var(--chip-color, var(--accent));
  background: color-mix(in srgb, var(--chip-color, var(--accent)) 12%, transparent);
}
.label-chip.add {
  border-style: dashed;
  color: var(--ink-faint);
}
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
  max-height: calc(100dvh - 3rem);
  overflow-y: auto;
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
.color-row {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}
.color-dot {
  width: 1.9rem;
  height: 1.9rem;
  border-radius: 999px;
  border: 2px solid transparent;
  transition: border-color 0.15s, transform 0.1s;
}
.color-dot.active {
  border-color: var(--ink);
  transform: scale(1.12);
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
.emoji-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-bottom: 0.75rem;
}
.emoji-choice {
  width: 2.4rem;
  height: 2.4rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  border: 1px solid var(--line);
  border-radius: 0.6rem;
}
.emoji-choice.active {
  border-color: var(--accent);
  background: var(--accent-deep);
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
  color-scheme: dark;
}
html[data-theme='light'] .input {
  color-scheme: light;
}
.input:focus {
  border-color: var(--accent-dim);
}
.select {
  appearance: none;
}
.labels-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-bottom: 0.75rem;
}
.submit {
  width: 100%;
  padding: 0.65rem;
  border-radius: 0.7rem;
  background: var(--accent);
  color: var(--on-accent);
  font-weight: 700;
  font-size: 0.9rem;
}
.dates-block {
  margin-bottom: 0.6rem;
}
.date-toggle {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  width: 100%;
  padding: 0.55rem 0.75rem;
  font-size: 0.8rem;
  font-weight: 600;
  border: 1px dashed var(--line-bright);
  border-radius: 0.7rem;
  color: var(--ink-muted);
}
.date-toggle.active {
  border-style: solid;
  border-color: var(--accent-dim);
  color: var(--accent);
}
.toggle-dot {
  width: 1rem;
  height: 1rem;
  border: 1px solid var(--line-bright);
  border-radius: 0.35rem;
  flex-shrink: 0;
}
.date-toggle.active .toggle-dot {
  border-color: var(--accent);
  background: var(--accent);
}
.dates-row {
  display: flex;
  align-items: stretch;
  gap: 0.4rem;
  margin-top: 0.5rem;
}
.dates-row .input {
  flex: 1;
  min-width: 0;
  margin-bottom: 0;
}
.range-btn {
  width: 2.4rem;
  flex-shrink: 0;
  border: 1px dashed var(--line-bright);
  border-radius: 0.7rem;
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--accent);
}
.date-error {
  margin: 0.35rem 0 0 0.2rem;
  font-size: 0.75rem;
  color: var(--danger, #e5484d);
}
</style>
