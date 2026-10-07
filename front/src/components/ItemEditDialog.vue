<script setup>
import { ref, watch, computed } from 'vue'
import { X } from 'lucide-vue-next'
import { parseQuantity, stepQuantity, UNITS } from '../services/quantity'

const props = defineProps({
  item: { type: Object, required: true }
})
const emit = defineEmits(['close', 'saved'])

const label = ref('')
const kind = ref('task')
const quantity = ref('')

const UNIT_CHOICES = ['-', ...UNITS]
const KINDS = [
  { id: 'task', label: 'Tâche' },
  { id: 'product', label: 'Produit' }
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

const quantityNum = computed(() => {
  const { n } = parseQuantity(quantity.value)
  return n !== null && n > 0 ? n : null
})
const unitChoice = computed(() => parseQuantity(quantity.value).unit ?? '')

function setUnit(u) {
  const { n } = parseQuantity(quantity.value)
  quantity.value = u ? `${n ?? 1} ${u}` : String(n ?? 1)
}

function incQuantity() {
  quantity.value = stepQuantity(quantity.value || '1', 1)
}

function decQuantity() {
  if (quantityNum.value !== null && quantityNum.value > 1) {
    quantity.value = stepQuantity(quantity.value, -1)
  }
}

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
        <div v-if="kind === 'product'" class="qty-row">
          <button type="button" class="step" :disabled="!quantityNum || quantityNum <= 1" @click="decQuantity">−</button>
          <input v-model="quantity" class="input qty-input" type="text" inputmode="numeric" placeholder="1" />
          <button type="button" class="step" @click="incQuantity">+</button>
        </div>
        <div v-if="kind === 'product'" class="unit-tags">
          <button
            v-for="u in UNIT_CHOICES"
            :key="u"
            type="button"
            class="unit-tag"
            :class="{ active: (unitChoice || '-') === u }"
            @click="setUnit(u === '-' ? '' : u)"
          >
            {{ u }}
          </button>
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
.qty-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.6rem;
}
.qty-input {
  text-align: center;
  margin-bottom: 0;
}
.step {
  width: 2.4rem;
  height: 2.4rem;
  flex-shrink: 0;
  border: 1px solid var(--line);
  border-radius: 0.6rem;
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--ink);
}
.step:active {
  background: var(--bg-2);
}
.step:disabled {
  opacity: 0.35;
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

.unit-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
  margin: -0.2rem 0 0.6rem;
}
.unit-tag {
  padding: 0.2rem 0.55rem;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--bg-1);
  color: var(--ink-muted);
  font-size: 0.72rem;
  font-weight: 600;
  white-space: nowrap;
}
.unit-tag.active {
  border-color: var(--accent);
  background: var(--accent-deep);
  color: var(--accent);
}
