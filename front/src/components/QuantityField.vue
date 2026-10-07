<script setup>
import { computed } from 'vue'
import { parseQuantity, stepQuantity } from '../services/quantity'

const props = defineProps({
  modelValue: { type: String, default: '' },
  units: { type: Array, required: true },
  autofocus: { type: Boolean, default: false }
})
const emit = defineEmits(['update:modelValue'])

const quantityNum = computed(() => {
  const { n } = parseQuantity(props.modelValue)
  return n !== null && n > 0 ? n : null
})
const unitChoice = computed(() => parseQuantity(props.modelValue).unit ?? '')

function setUnit(u) {
  const unit = u === '-' ? '' : u
  const { n } = parseQuantity(props.modelValue)
  emit('update:modelValue', unit ? `${n ?? 1} ${unit}` : String(n ?? 1))
}
function inc() {
  emit('update:modelValue', stepQuantity(props.modelValue || '1', 1))
}
function dec() {
  if (quantityNum.value !== null && quantityNum.value > 1) {
    emit('update:modelValue', stepQuantity(props.modelValue, -1))
  }
}
</script>

<template>
  <div class="qty-field">
    <div class="qty-row">
      <button type="button" class="step" :disabled="!quantityNum || quantityNum <= 1" @click="dec">−</button>
      <input
        :value="modelValue"
        class="qty-input font-mono"
        type="text"
        inputmode="decimal"
        placeholder="1"
        :autofocus="autofocus"
        @input="emit('update:modelValue', $event.target.value)"
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
  gap: 0.5rem;
  margin-bottom: 0.6rem;
}
.qty-row {
  display: flex;
  align-items: center;
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
.qty-input {
  width: 4.5rem;
  min-width: 0;
  flex: 0 1 auto;
  text-align: center;
  padding: 0.4rem 0.3rem;
  border: 1px solid var(--line);
  border-radius: 0.6rem;
  background: var(--bg-1);
  color: var(--ink);
  font-size: 0.95rem;
}
.unit-tags {
  display: flex;
  flex-wrap: wrap;
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
