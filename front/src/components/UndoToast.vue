<script setup>
import { ref, watch, onBeforeUnmount } from 'vue'
import { Check, X } from 'lucide-vue-next'

const props = defineProps({
  message: { type: String, default: '' },
  visible: { type: Boolean, default: false }
})
const emit = defineEmits(['undo', 'close'])

let timer = null

watch(
  () => props.visible,
  (v) => {
    clearTimeout(timer)
    if (v) timer = setTimeout(() => emit('close'), 5000)
  }
)
onBeforeUnmount(() => clearTimeout(timer))
</script>

<template>
  <Transition name="toast">
    <div v-if="visible" class="toast">
      <span class="toast-msg"><Check :size="15" /> {{ message }}</span>
      <button class="toast-undo" @click="$emit('undo')">Annuler</button>
      <button class="toast-close" aria-label="Fermer" @click="$emit('close')"><X :size="15" /></button>
    </div>
  </Transition>
</template>

<style scoped>
.toast {
  position: fixed;
  left: 50%;
  transform: translateX(-50%);
  bottom: calc(4.5rem + env(safe-area-inset-bottom));
  z-index: 70;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  max-width: calc(100vw - 2rem);
  padding: 0.7rem 0.85rem;
  border: 1px solid var(--line-bright);
  border-radius: 0.85rem;
  background: var(--bg-2);
  color: var(--ink);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.55);
}
.toast-msg {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  min-width: 0;
}
.toast-msg > :first-child {
  color: var(--accent);
  flex-shrink: 0;
}
.toast-undo {
  flex-shrink: 0;
  padding: 0.3rem 0.7rem;
  border-radius: 0.5rem;
  background: var(--accent-deep);
  color: var(--accent);
  font-size: 0.8rem;
  font-weight: 700;
}
.toast-close {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.6rem;
  height: 1.6rem;
  border-radius: 0.4rem;
  color: var(--ink-faint);
}
.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.2s, transform 0.2s;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(0.5rem);
}
</style>
