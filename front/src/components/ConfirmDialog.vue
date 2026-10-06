<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  message: { type: String, required: true },
  confirmLabel: { type: String, default: 'Supprimer' },
  danger: { type: Boolean, default: true }
})
const emit = defineEmits(['confirm', 'cancel'])

const busy = ref(false)

async function confirm() {
  if (busy.value) return
  busy.value = true
  emit('confirm')
  busy.value = false
}

watch(
  () => props.message,
  () => {
    busy.value = false
  }
)
</script>

<template>
  <div class="overlay" @click.self="emit('cancel')">
    <div class="dialog">
      <p class="dialog-text">{{ message }}</p>
      <div class="dialog-actions">
        <button class="btn ghost" @click="emit('cancel')">Annuler</button>
        <button class="btn" :class="danger ? 'danger' : 'primary'" @click="confirm">
          {{ confirmLabel }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  z-index: 70;
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
.dialog-text {
  margin: 0 0 1rem;
  font-size: 0.95rem;
  line-height: 1.5;
}
.dialog-actions {
  display: flex;
  gap: 0.6rem;
  justify-content: flex-end;
}
.btn {
  padding: 0.55rem 1rem;
  border-radius: 0.7rem;
  font-size: 0.85rem;
  font-weight: 700;
}
.btn.ghost {
  border: 1px solid var(--line);
  color: var(--ink-muted);
}
.btn.danger {
  background: #e5484d;
  color: #fff;
}
.btn.primary {
  background: var(--accent);
  color: #fff;
}
</style>
