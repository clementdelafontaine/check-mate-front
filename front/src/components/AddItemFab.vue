<script setup>
import { ref } from 'vue'
import { Plus, X } from 'lucide-vue-next'
import { useChecklistsStore } from '../stores/checklists'

const props = defineProps({
  listId: { type: String, required: true }
})

const store = useChecklistsStore()
const open = ref(false)
const label = ref('')
const sectionId = ref('')

const sections = () => store.listById(props.listId)?.sections ?? []

function submit() {
  const value = label.value.trim()
  if (!value) return
  store.addItem(props.listId, sectionId.value, value)
  label.value = ''
}
</script>

<template>
  <div class="fab-zone">
    <div v-if="open" class="sheet">
      <div class="sheet-head">
        <span class="font-mono sheet-title">Ajouter un item</span>
        <button class="icon-btn" aria-label="Fermer" @click="open = false"><X :size="18" /></button>
      </div>
      <form @submit.prevent="submit">
        <input
          v-model="label"
          class="input"
          type="text"
          placeholder="Ex : chorizo"
          autofocus
        />
        <select v-model="sectionId" class="input select">
          <option value="" disabled>Sous-rubrique…</option>
          <option v-for="s in sections()" :key="s.id" :value="s.id">{{ s.name }}</option>
        </select>
        <button type="submit" class="submit">Ajouter</button>
      </form>
    </div>
    <button v-if="!open" class="fab" aria-label="Ajouter un item" @click="open = true">
      <Plus :size="26" :stroke-width="2.4" />
    </button>
  </div>
</template>

<style scoped>
.fab-zone {
  position: fixed;
  right: 1rem;
  bottom: calc(4.5rem + env(safe-area-inset-bottom));
  z-index: 40;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.75rem;
}
.fab {
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--accent);
  color: #fff;
  box-shadow: 0 8px 24px rgba(77, 141, 255, 0.35);
  transition: transform 0.15s;
}
.fab:active {
  transform: scale(0.92);
}
.sheet {
  width: min(20rem, calc(100vw - 2rem));
  border: 1px solid var(--line);
  border-radius: 1rem;
  background: var(--bg-1);
  padding: 0.85rem;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.5);
}
.sheet-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.6rem;
}
.sheet-title {
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
.input {
  width: 100%;
  padding: 0.6rem 0.75rem;
  border: 1px solid var(--line);
  border-radius: 0.7rem;
  background: var(--bg-2);
  color: var(--ink);
  outline: none;
  margin-bottom: 0.5rem;
}
.input:focus {
  border-color: var(--accent-dim);
}
.select {
  appearance: none;
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
