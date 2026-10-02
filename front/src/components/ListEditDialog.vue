<script setup>
import { ref, watch } from 'vue'
import { useChecklistsStore, LIST_TYPES } from '../stores/checklists'
import { X } from 'lucide-vue-next'

const props = defineProps({
  list: { type: Object, required: true }
})
const emit = defineEmits(['close', 'saved'])

const store = useChecklistsStore()

const name = ref('')
const emoji = ref('')
const type = ref('checklist')
const spaceId = ref('')
const labelIds = ref([])
const startDate = ref('')
const endDate = ref('')

const EMOJIS = ['📋', '🛒', '🧳', '🏠', '✈️', '🎒', '🎁', '📝', '🌟', '🧹', '🔧', '💊']

watch(
  () => props.list,
  (l) => {
    if (!l) return
    name.value = l.name
    emoji.value = l.emoji
    type.value = l.type ?? 'checklist'
    spaceId.value = l.spaceId ?? ''
    labelIds.value = [...(l.labelIds ?? [])]
    startDate.value = l.startDate ?? ''
    endDate.value = l.endDate && l.endDate !== l.startDate ? l.endDate : ''
  },
  { immediate: true }
)

function toggleLabel(id) {
  const i = labelIds.value.indexOf(id)
  if (i === -1) labelIds.value.push(id)
  else labelIds.value.splice(i, 1)
}

function save() {
  const trimmed = name.value.trim()
  if (!trimmed) return
  store.updateList(props.list.id, {
    name: trimmed,
    emoji: emoji.value,
    type: type.value,
    spaceId: spaceId.value || null,
    labelIds: labelIds.value,
    startDate: startDate.value || null,
    endDate: endDate.value || null
  })
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

        <div class="kind-row">
          <button
            v-for="t in LIST_TYPES"
            :key="t.id"
            type="button"
            class="kind-chip"
            :class="{ active: type === t.id }"
            @click="type = t.id"
          >
            {{ t.emoji }} {{ t.label }}
          </button>
        </div>

        <select v-model="spaceId" class="input select">
          <option value="">Sans espace</option>
          <option v-for="s in store.spaces" :key="s.id" :value="s.id">{{ s.emoji }} {{ s.name }}</option>
        </select>

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

        <div class="dates-row">
          <input v-model="startDate" class="input date" type="date" />
          <span class="date-sep">→</span>
          <input v-model="endDate" class="input date" type="date" />
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
.kind-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-bottom: 0.6rem;
}
.kind-chip {
  flex: 1;
  min-width: 5.5rem;
  padding: 0.4rem 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  border: 1px solid var(--line);
  border-radius: 0.6rem;
  color: var(--ink-muted);
  transition: border-color 0.15s, color 0.15s;
}
.kind-chip.active {
  border-color: var(--accent);
  color: var(--accent);
  background: color-mix(in srgb, var(--accent) 12%, transparent);
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
.dates-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.6rem;
}
.dates-row .input {
  margin-bottom: 0;
}
.date-sep {
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
