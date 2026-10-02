<script setup>
import { ref, computed } from 'vue'
import { X } from 'lucide-vue-next'
import { useChecklistsStore, GENERIC_SECTION } from '../stores/checklists'

const props = defineProps({
  listId: { type: String, default: null },
  templateId: { type: String, default: null }
})

const store = useChecklistsStore()
const open = ref(false)
const label = ref('')
const quantity = ref('')
const sectionChoice = ref('')
const newSectionName = ref('')

const target = computed(() =>
  props.listId ? store.listById(props.listId) : store.templateById(props.templateId)
)
const sections = computed(() => target.value?.sections ?? [])
const isNewSection = computed(() => sectionChoice.value === '__new__')
const newSectionPlaceholder = computed(
  () => `Nom de la catégorie ("${GENERIC_SECTION}" si vide)`
)

function close() {
  open.value = false
  label.value = ''
  quantity.value = ''
  sectionChoice.value = ''
  newSectionName.value = ''
}

function submit() {
  const value = label.value.trim()
  if (!value) return
  const qty = quantity.value.trim() === '' ? null : quantity.value.trim()

  let sectionId = sectionChoice.value
  if (isNewSection.value) {
    const name = newSectionName.value.trim() || GENERIC_SECTION
    const created = props.listId
      ? store.addSection(props.listId, name)
      : store.addTemplateSection(props.templateId, name)
    sectionId = created?.id ?? ''
  }

  if (props.listId) {
    store.addItem(props.listId, sectionId, value, qty)
  } else if (props.templateId) {
    store.addTemplateItem(props.templateId, sectionId, value, qty)
  }
  close()
}
</script>

<template>
  <div>
    <div v-if="open" class="form-card">
      <div class="form-head">
        <span class="font-mono form-title">Nouvel item</span>
        <button class="icon-btn" aria-label="Fermer" @click="close"><X :size="18" /></button>
      </div>
      <form @submit.prevent="submit">
        <input v-model="label" class="input" type="text" placeholder="Nom de l'item" autofocus />
        <input v-model="quantity" class="input" type="text" inputmode="numeric" placeholder="Nombre (optionnel)" />
        <select v-model="sectionChoice" class="input select">
          <option value="" disabled>Catégorie… ({{ GENERIC_SECTION }} si vide)</option>
          <option v-for="s in sections" :key="s.id" :value="s.id">{{ s.name }}</option>
          <option value="__new__">➕ Nouvelle catégorie…</option>
        </select>
        <input
          v-if="isNewSection"
          v-model="newSectionName"
          class="input"
          type="text"
          :placeholder="newSectionPlaceholder"
        />
        <button type="submit" class="submit">Ajouter</button>
      </form>
    </div>
    <button v-else class="add-inline" @click="open = true">
      <span class="plus-circle">+</span>
      <span class="add-label">Ajouter un item</span>
    </button>
  </div>
</template>

<style scoped>
.add-inline {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.9rem;
  padding: 0.85rem 1rem;
  border: 1px dashed var(--line-bright);
  border-radius: 1rem;
  background: transparent;
  color: var(--ink-faint);
  transition: border-color 0.15s, color 0.15s;
}
.add-inline:active {
  border-color: var(--accent-dim);
  color: var(--accent);
}
.plus-circle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border: 1px dashed var(--line-bright);
  border-radius: 0.6rem;
  font-size: 1.1rem;
  font-weight: 700;
  flex-shrink: 0;
}
.add-label {
  font-weight: 600;
  font-size: 0.9rem;
}
.form-card {
  border: 1px solid var(--accent-dim);
  border-radius: 1rem;
  background: var(--bg-1);
  padding: 0.85rem;
}
.form-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.6rem;
}
.form-title {
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
