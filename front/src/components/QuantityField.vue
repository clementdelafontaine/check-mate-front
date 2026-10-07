<script setup>
import { computed } from 'vue'
import { parseQuantity, stepQuantity } from '../services/quantity'

const props = defineProps({
  modelValue: { type: String, default: '' },
  units: { type: Array, required: true }
})
const emit = defineEmits(['update:modelValue'])

const quantityNum = computed(() => {
  const { n } = parseQuantity(props.modelValue)
  return n !== null && n > 0 ? n : null
})
const unitChoice = computed(() => parseQuantity(props.modelValue).unit ?? '')

function commit(n, unit) {
  const num = n === null || n === undefined || n === '' ? 1 : n
  emit('update:modelValue', unit ? `${num} ${unit}` : `${num}`)
}
function setUnit(u) {
  const unit = u === '-' ? '' : u
  commit(quantityNum.value, unit)
}
function inc() {
  commit((quantityNum.value ?? 0) + 1, unitChoice.value)
}
function dec() {
  if (quantityNum.value !== null && quantityNum.value > 1) {
    commit(quantityNum.value - 1, unitChoice.value)
  }
}
</script>

<template>
  <div class="qty-field">
    <div class="qty-row">
      <button type="button" class="step" :disabled="!quantityNum || quantityNum <= 1" @click="dec">−</button>
      <span class="qty-value font-mono">{{ quantityNum ?? 1 }}</span>
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
