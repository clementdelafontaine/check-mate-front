<script setup>
import { computed, ref, watch } from 'vue'
import { parseQuantity } from '../services/quantity'

const props = defineProps({
  modelValue: { type: String, default: '' },
  units: { type: Array, required: true }
})
const emit = defineEmits(['update:modelValue'])

const draft = ref(null)
const inner = ref(props.modelValue)

watch(
  () => props.modelValue,
  (v) => {
    if (v !== inner.value) inner.value = v
    draft.value = null
  }
)

const quantityNum = computed(() => {
  const { n } = parseQuantity(inner.value)
  return n !== null && n > 0 ? n : null
})
const unitChoice = computed(() => parseQuantity(inner.value).unit ?? '')

const displayValue = computed(() => (draft.value !== null ? draft.value : String(quantityNum.value ?? 1)))
const inputWidth = computed(
  () => `${Math.max(2.5, displayValue.value.length + 1.2)}rem`
)

function buildValue(n, unit) {
  const rounded = Math.round(n * 100) / 100
  return unit ? `${rounded} ${unit}` : `${rounded}`
}
function commit(n) {
  if (n === null || n <= 0) n = 1
  draft.value = null
  const value = buildValue(n, unitChoice.value)
  inner.value = value
  emit('update:modelValue', value)
}
function onInput(e) {
  const raw = e.target.value
  const normalized = raw.replace(',', '.')
  if (normalized === '' || normalized === '.') {
    draft.value = raw
    return
  }
  const n = Number(normalized)
  if (Number.isNaN(n) || n < 0) {
    draft.value = raw.replace(/[^\d.,]/g, '')
    return
  }
  commit(Math.round(n * 100) / 100)
}
function onBlur() {
  if (draft.value !== null) {
    const { n } = parseQuantity(draft.value)
    commit(n !== null && n > 0 ? n : 1)
  }
}
function setUnit(u) {
  const unit = u === '-' ? '' : u
  const n =
    quantityNum.value ??
    (draft.value !== null ? parseQuantity(draft.value).n : null) ??
    1
  commit(n)
  const value = buildValue(n, unit)
  inner.value = value
  emit('update:modelValue', value)
}
function inc() {
  commit((quantityNum.value ?? 0) + 1)
}
function dec() {
  if (quantityNum.value !== null && quantityNum.value > 1) {
    commit(quantityNum.value - 1)
  } else if (quantityNum.value === null) {
    commit(1)
  }
}
</script>

<template>
  <div class="qty-field">
    <div class="qty-row">
      <button type="button" class="step" :disabled="!quantityNum || quantityNum <= 1" @click="dec">−</button>
      <input
        class="qty-value font-mono"
        type="text"
        inputmode="decimal"
        :value="displayValue"
        :style="{ width: inputWidth }"
        @input="onInput"
        @blur="onBlur"
      />
      <button type="button" class="step" @click="inc">+</button>
    </div>
    <div class="unit-tags">
      <button
        v-for="u in units"
        :key="u"
        type="button"
        class="unit-tag"
        :class="{ active: (unitChoice || '-') === u }"
        @click="setUnit(u)"
      >
        {{ u }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.qty-field {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.6rem;
}
.qty-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}
.step {
  width: 2.2rem;
  height: 2.2rem;
  flex-shrink: 0;
  border: 1px solid var(--line);
  border-radius: 0.6rem;
  background: var(--bg-1);
  color: var(--ink);
  font-size: 1.1rem;
  font-weight: 700;
}
.step:active {
  background: var(--bg-2);
}
.step:disabled {
  opacity: 0.35;
}
.qty-value {
  min-width: 2.5rem;
  padding: 0.4rem 0.5rem;
  border: 1px solid var(--line);
  border-radius: 0.6rem;
  background: var(--bg-2);
  color: var(--ink);
  text-align: center;
  font-size: 0.95rem;
  font-weight: 700;
  outline: none;
  transition: border-color 0.15s;
}
.qty-value:focus {
  border-color: var(--accent-dim);
}
.unit-tags {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 0.35rem;
  padding: 0.25rem;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--bg-2);
}
.unit-tag {
  padding: 0.25rem 0.65rem;
  border: none;
  border-radius: 999px;
  background: transparent;
  color: var(--ink-muted);
  font-size: 0.72rem;
  font-weight: 600;
  white-space: nowrap;
  transition: background 0.15s, color 0.15s;
}
.unit-tag.active {
  background: var(--accent);
  color: #fff;
}
</style>
