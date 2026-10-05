<script setup>
import { ref, computed } from 'vue'
import { useChecklistsStore } from '../stores/checklists'
import { Plus } from 'lucide-vue-next'

const model = defineModel({ type: String, default: '' })
const store = useChecklistsStore()

const showNew = ref(false)
const newName = ref('')
const newEmoji = ref('📁')
const EMOJIS = ['📁', '🛒', '🏠', '✈️', '💼', '🎓', '🎨', '💪', '🎮', '🌱', '🐶', '🎁']

function pick(id) {
  model.value = id
}

async function createSpace() {
  const name = newName.value.trim()
  if (!name) return
  const created = await store.addSpace(name, newEmoji.value)
  showNew.value = false
  newName.value = ''
  newEmoji.value = '📁'
  if (created?.id) model.value = created.id
}
</script>

<template>
  <div class="space-picker">
    <span class="field-label">Espace</span>
    <div class="chips-row">
      <button
        v-for="s in store.spaces"
        :key="s.id"
        type="button"
        class="space-chip"
        :class="{ active: model === s.id }"
        @click="pick(s.id)"
      >
        {{ s.emoji }} {{ s.name }}
      </button>
      <button type="button" class="space-chip add" @click="showNew = !showNew">
        <Plus :size="13" /> Nouveau
      </button>
    </div>
    <div v-if="showNew" class="new-space">
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
      <div class="new-row">
        <input v-model="newName" class="input" type="text" placeholder="Nom de l'espace" @keydown.enter.prevent="createSpace" />
        <button type="button" class="add-btn" :disabled="!newName.trim()" @click="createSpace">Créer</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.field-label {
  display: block;
  margin: 0.35rem 0 0.25rem 0.15rem;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--ink-muted);
}
.chips-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-bottom: 0.5rem;
}
.space-chip {
  padding: 0.35rem 0.7rem;
  font-size: 0.78rem;
  font-weight: 600;
  border: 1px solid var(--line);
  border-radius: 0.55rem;
  color: var(--ink-muted);
}
.space-chip.active {
  border-color: var(--accent);
  color: var(--accent);
  background: var(--accent-deep);
}
.space-chip.add {
  border-style: dashed;
  color: var(--ink-faint);
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}
.new-space {
  border: 1px dashed var(--accent-dim);
  border-radius: 0.7rem;
  padding: 0.6rem;
  margin-bottom: 0.5rem;
}
.emoji-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
  margin-bottom: 0.5rem;
}
.emoji-choice {
  width: 1.9rem;
  height: 1.9rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  border: 1px solid var(--line);
  border-radius: 0.5rem;
}
.emoji-choice.active {
  border-color: var(--accent);
  background: var(--accent-deep);
}
.new-row {
  display: flex;
  gap: 0.4rem;
}
.new-row .input {
  flex: 1;
  margin-bottom: 0;
}
.add-btn {
  padding: 0 0.9rem;
  border-radius: 0.7rem;
  background: var(--accent);
  color: #fff;
  font-weight: 700;
  font-size: 0.8rem;
}
.add-btn:disabled {
  opacity: 0.45;
}
</style>
