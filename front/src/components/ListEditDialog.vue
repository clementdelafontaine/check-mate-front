<script setup>
import { ref, watch } from 'vue'
import { useChecklistsStore } from '../stores/checklists'
import { X } from 'lucide-vue-next'
import SpacePicker from './SpacePicker.vue'
import FriendPicker from './FriendPicker.vue'
import { api } from '../services/api'

const props = defineProps({
  list: { type: Object, required: true }
})
const emit = defineEmits(['close', 'saved'])

const store = useChecklistsStore()

const name = ref('')
const emoji = ref('')
const spaceId = ref('')
const labelIds = ref([])
const startDate = ref('')
const endDate = ref('')
const hasDate = ref(false)
const hasRange = ref(false)
const sharedWith = ref([])
const initialSharedWith = ref([])

const EMOJIS = ['📋', '🛒', '🧳', '🏠', '✈️', '🎒', '🎁', '📝', '🌟', '🧹', '🔧', '💊']

watch(
  () => props.list,
  (l) => {
    if (!l) return
    name.value = l.name
    emoji.value = l.emoji
    spaceId.value = l.spaceId ?? ''
    labelIds.value = [...(l.labelIds ?? [])]
    startDate.value = l.startDate ?? ''
    endDate.value = l.endDate && l.endDate !== l.startDate ? l.endDate : ''
    hasDate.value = Boolean(l.startDate)
    hasRange.value = Boolean(l.startDate && l.endDate && l.endDate !== l.startDate)
    sharedWith.value = []
    initialSharedWith.value = []
    if (api.useApi) {
      api.fetchCollaborators(l.id).then((rows) => {
        sharedWith.value = rows.map((c) => c.userId)
        initialSharedWith.value = [...sharedWith.value]
      }).catch(() => {})
    }
  },
  { immediate: true }
)

function toggleLabel(id) {
  const i = labelIds.value.indexOf(id)
  if (i === -1) labelIds.value.push(id)
  else labelIds.value.splice(i, 1)
}

function toggleHasDate() {
  hasDate.value = !hasDate.value
  if (!hasDate.value) {
    hasRange.value = false
    startDate.value = ''
    endDate.value = ''
  }
}

function toggleHasRange() {
  hasRange.value = !hasRange.value
  endDate.value = ''
}

async function save() {
  const trimmed = name.value.trim()
  if (!trimmed) return
  store.updateList(props.list.id, {
    name: trimmed,
    emoji: emoji.value,
    spaceId: spaceId.value || null,
    labelIds: labelIds.value,
    startDate: hasDate.value && startDate.value ? startDate.value : null,
    endDate: hasRange.value && endDate.value ? endDate.value : hasDate.value && startDate.value ? startDate.value : null
  })
  if (api.useApi) {
    const added = sharedWith.value.filter((id) => !initialSharedWith.value.includes(id))
    const removed = initialSharedWith.value.filter((id) => !sharedWith.value.includes(id))
    for (const userId of added) {
      await api.shareList(props.list.id, userId).catch(() => {})
    }
    for (const userId of removed) {
      await api.unshareList(props.list.id, userId).catch(() => {})
    }
    if (added.length || removed.length) await store.refresh()
  }
  emit('saved')
  emit('close')
}
</script>

<template>
  <div class="overlay" @click.self="emit('close')">
    <div class="dialog">
      <div class="dialog-head">
        <span class="font-mono dialog-title">Modifier la liste</span>
        <button class="icon-btn" aria-label="Fermer" @click="emit('close')"><X :size="18" /></button>
      </div>
      <form @submit.prevent="save">
        <div class="emoji-row">
          <button
            v-for="e in EMOJIS"
            :key="e"
            type="button"
            class="emoji-choice"
            :class="{ active: emoji === e }"
            @click="emoji = e"
          >
            {{ e }}
          </button>
        </div>
        <input v-model="name" class="input" type="text" placeholder="Nom de la liste" autofocus />

        
        <SpacePicker v-model="spaceId" />
        <FriendPicker v-model="sharedWith" />

        <div class="labels-row">
          <button
            v-for="label in store.labels"
            :key="label.id"
            type="button"
            class="label-chip"
            :class="{ active: labelIds.includes(label.id) }"
            :style="{ '--chip-color': label.color }"
            @click="toggleLabel(label.id)"
          >
            {{ label.name }}
          </button>
        </div>

        <div class="dates-block">
          <button type="button" class="date-toggle" :class="{ active: hasDate }" @click="toggleHasDate">
            <span class="toggle-dot" /> Programmer une date
          </button>
          <template v-if="hasDate">
            <div class="dates-row">
              <input v-model="startDate" class="input date" type="date" />
              <button
                v-if="!hasRange"
                type="button"
                class="range-btn"
                aria-label="Ajouter une date de fin"
                @click="toggleHasRange"
              >+</button>
              <template v-else>
                <span class="date-sep">→</span>
                <input v-model="endDate" class="input date" type="date" />
                <button
                  type="button"
                  class="range-btn"
                  aria-label="Retirer la date de fin"
                  @click="toggleHasRange"
                >−</button>
              </template>
            </div>
            <p v-if="hasRange && startDate && endDate && endDate < startDate" class="date-error">
              La date de fin doit suivre la date de début.
            </p>
          </template>
        </div>

        <button type="submit" class="submit">Enregistrer</button>
      </form>
    </div>
  </div>
</template>

<style scoped>
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
  margin: 0.35rem 0 0;
  font-size: 0.75rem;
  color: #ff6b6b;
}
.date-sep {
  display: flex;
  align-items: center;
  color: var(--ink-faint);
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
