<script setup>
import { ref, computed, watch } from 'vue'
import { X } from 'lucide-vue-next'
import { useChecklistsStore, GENERIC_SECTION, ITEM_KINDS } from '../stores/checklists'

const props = defineProps({
  listId: { type: String, default: null },
  templateId: { type: String, default: null }
})

const store = useChecklistsStore()
const open = ref(false)
const label = ref('')
const kind = ref('task')
const quantity = ref('')
const sectionChoice = ref('')
const newSectionName = ref('')

const KINDS = [
  { id: 'task', label: 'Tâche' },
  { id: 'product', label: 'Produit' },
  { id: 'note', label: 'Note' }
]

const target = computed(() =>
  props.listId ? store.listById(props.listId) : store.templateById(props.templateId)
)

watch(open, (isOpen) => {
  if (isOpen) kind.value = props.listId ? store.defaultItemKind(props.listId) : 'task'
})
const sections = computed(() => target.value?.sections ?? [])
const isNewSection = computed(() => sectionChoice.value === '__new__')
const newSectionPlaceholder = computed(
  () => `Nom de la catégorie ("${GENERIC_SECTION}" si vide)`
)

const suggestionsDismissed = ref(false)
const suggestions = computed(() => store.suggestionsFor(label.value))
const showSuggestions = computed(
  () => suggestions.value.length > 0 && label.value.trim() !== '' && !suggestionsDismissed.value
)
function applySuggestion(s) {
  label.value = s
  suggestionsDismissed.value = true
}

const sectionSuggestions = computed(() => {
  const prefix = newSectionName.value.trim().toLowerCase()
  if (!prefix) return []
  return store
    .knownSectionNames()
    .filter((n) => n.toLowerCase().startsWith(prefix))
    .slice(0, 4)
})
function applySectionSuggestion(name) {
  newSectionName.value = name
}

function close() {
  open.value = false
  label.value = ''
  kind.value = 'task'
  quantity.value = ''
  sectionChoice.value = ''
  newSectionName.value = ''
  suggestionsDismissed.value = false
}

function submit() {
  const value = label.value.trim()
  if (!value) return
  const qty = kind.value === 'product' && quantity.value.trim() !== '' ? quantity.value.trim() : null

  let sectionId = sectionChoice.value
  if (isNewSection.value) {
    const name = newSectionName.value.trim() || GENERIC_SECTION
    const created = props.listId
      ? store.addSection(props.listId, name)
      : store.addTemplateSection(props.templateId, name)
    sectionId = created?.id ?? ''
  }

  if (props.listId) {
    store.addItem(props.listId, sectionId, value, qty, kind.value)
  } else if (props.templateId) {
    store.addTemplateItem(props.templateId, sectionId, value, qty, kind.value)
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
        <div class="kind-row">
          <button
            v-for="k in KINDS"
            :key="k.id"
            type="button"
            class="kind-chip"
            :class="{ active: kind === k.id }"
            @click="kind = k.id"
          >
            {{ k.label }}
          </button>
        </div>
        <input v-model="label" class="input" type="text" placeholder="Nom de l'item" autofocus />
        <div v-if="showSuggestions" class="suggestions">
          <button
            v-for="s in suggestions"
            :key="s"
            type="button"
            class="suggestion"
            @mousedown.prevent="applySuggestion(s)"
          >
            {{ s }}
          </button>
        </div>
        <input v-if="kind === 'product'" v-model="quantity" class="input" type="text" inputmode="numeric" placeholder="Nombre (optionnel)" />
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
        <div v-if="isNewSection && sectionSuggestions.length" class="suggestions">
          <button
            v-for="name in sectionSuggestions"
            :key="name"
            type="button"
            class="suggestion"
            @mousedown.prevent="applySectionSuggestion(name)"
          >
            {{ name }}
          </button>
        </div>
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
.kind-row {
  display: flex;
  gap: 0.4rem;
  margin-bottom: 0.6rem;
}
.kind-chip {
  flex: 1;
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
.suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin: -0.25rem 0 0.5rem;
}
.suggestion {
  padding: 0.35rem 0.7rem;
  border: 1px solid var(--accent-dim);
  border-radius: 0.55rem;
  background: var(--accent-deep);
  color: var(--accent);
  font-size: 0.8rem;
  font-weight: 600;
}
</style>
