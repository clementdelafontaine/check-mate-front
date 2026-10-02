<script setup>
import { ref, watch } from 'vue'
import { X } from 'lucide-vue-next'

const props = defineProps({
  item: { type: Object, required: true }
})
const emit = defineEmits(['close', 'saved'])

const label = ref('')
const kind = ref('task')
const quantity = ref('')

const KINDS = [
  { id: 'task', label: 'Tâche' },
  { id: 'product', label: 'Produit' },
  { id: 'note', label: 'Note' }
]

watch(
  () => props.item,
  (i) => {
    if (!i) return
    label.value = i.label
    kind.value = i.kind ?? 'task'
    quantity.value = i.quantity ?? ''
  },
  { immediate: true }
)

function save() {
  const trimmed = label.value.trim()
  if (!trimmed) return
  emit('saved', {
    label: trimmed,
    kind: kind.value,
    quantity: kind.value === 'product' && quantity.value.trim() !== '' ? quantity.value.trim() : null
  })
  emit('close')
}
</script>

<template>
  <div class="overlay" @click.self="emit('close')">
    <div class="dialog">
      <div class="dialog-head">
        <span class="font-mono dialog-title">Modifier l'item</span>
        <button class="icon-btn" aria-label="Fermer" @click="emit('close')"><X :size="18" /></button>
      </div>
      <form @submit.prevent="save">
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
        <input
          v-if="kind === 'product'"
          v-model="quantity"
          class="input"
          type="text"
          inputmode="numeric"
          placeholder="Nombre"
        />
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
