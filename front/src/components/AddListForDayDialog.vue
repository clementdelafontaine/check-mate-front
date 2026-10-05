<script setup>
import { ref, computed } from 'vue'
import { useChecklistsStore } from '../stores/checklists'
import { X, LayoutGrid, FilePlus2 } from 'lucide-vue-next'

const props = defineProps({
  date: { type: String, required: true }
})
const emit = defineEmits(['close', 'created'])

const store = useChecklistsStore()

const step = ref('template')
const pickedTemplateId = ref(null)
const name = ref('')
const emoji = ref('📋')
const spaceId = ref('')

const EMOJIS = ['📋', '🛒', '🧳', '🏠', '✈️', '🎒', '🎁', '📝', '🌟', '🧹', '🔧', '💊']

const pickedTemplate = () =>
  pickedTemplateId.value === 'blank'
    ? { id: 'blank', name: 'Liste vide', emoji: '📄' }
    : store.templateById(pickedTemplateId.value)

function pick(id) {
  pickedTemplateId.value = id
  const tpl = id === 'blank' ? null : store.templateById(id)
  name.value = tpl ? tpl.name : ''
  emoji.value = tpl ? tpl.emoji : '📋'
  spaceId.value = store.spaces[0]?.id ?? ''
  step.value = 'form'
}

function create() {
  const trimmed = name.value.trim()
  if (!trimmed) return
  const created =
    pickedTemplateId.value === 'blank'
      ? store.createEmptyList(trimmed, emoji.value, spaceId.value, [], props.date, props.date)
      : store.createListFromTemplate(pickedTemplateId.value, trimmed, emoji.value, spaceId.value)
  if (pickedTemplateId.value !== 'blank') {
    store.setListDates(created.id, props.date, props.date)
  }
  emit('created', created)
  emit('close')
}
</script>

<template>
  <div class="overlay" @click.self="emit('close')">
    <div class="dialog">
      <div class="dialog-head">
        <span class="font-mono dialog-title">Nouvelle liste du {{ date.split('-').reverse().join('/') }}</span>
        <button class="icon-btn" aria-label="Fermer" @click="emit('close')"><X :size="18" /></button>
      </div>

      <div v-if="step === 'template'" class="picker-list">
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

      <form v-else @submit.prevent="create">
        <div class="picked-from font-mono">
          {{ pickedTemplate()?.emoji }} {{ pickedTemplate()?.name }}
        </div>
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

        <select v-model="spaceId" class="input select">
          <option value="" disabled>Espace…</option>
          <option v-for="s in store.spaces" :key="s.id" :value="s.id">{{ s.emoji }} {{ s.name }}</option>
        </select>

        <div class="date-hint font-mono">Prévue le {{ date.split('-').reverse().join('/') }}</div>

        <button type="submit" class="submit">Créer</button>
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
.date-hint {
  font-size: 0.7rem;
  color: var(--accent);
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
</style>
