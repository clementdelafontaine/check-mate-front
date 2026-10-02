<script setup>
import { Plus } from 'lucide-vue-next'

defineProps({
  label: { type: String, required: true }
})
defineEmits(['click'])
</script>

<template>
  <button class="add-card" @click="$emit('click')">
    <span class="plus-circle"><Plus :size="17" :stroke-width="2.4" /></span>
    <span class="add-label">{{ label }}</span>
  </button>
</template>

<style scoped>
.add-card {
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
.add-card:active {
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
  flex-shrink: 0;
}
.add-label {
  font-weight: 600;
  font-size: 0.9rem;
}
</style>
