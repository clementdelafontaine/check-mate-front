<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useSwipe } from '../composables/useSwipe'
import { MoreVertical, Trash2, ArrowRightLeft, Pencil } from 'lucide-vue-next'

const props = defineProps({
  label: { type: String, required: true },
  quantity: { type: [String, Number], default: null },
  checked: { type: Boolean, default: false },
  kind: { type: String, default: 'task' },
  sections: { type: Array, default: () => [] },
  showMove: { type: Boolean, default: false },
  swipeable: { type: Boolean, default: true },
  stepper: { type: Boolean, default: false }
})

const isNote = computed(() => props.kind === 'note')

const quantityNum = computed(() => {
  const n = Number(props.quantity)
  return Number.isFinite(n) && n > 0 ? n : null
})

const emit = defineEmits(['toggle', 'delete', 'move', 'increment', 'decrement', 'edit'])

const openMenu = ref(false)
const openMove = ref(false)
const root = ref(null)

const { deltaX, swipeHandlers } = useSwipe(() => emit('delete'))

function onDocClick(e) {
  if (openMenu.value && root.value && !root.value.contains(e.target)) openMenu.value = false
  if (openMove.value && root.value && !root.value.contains(e.target)) openMove.value = false
}
onMounted(() => document.addEventListener('click', onDocClick))
onBeforeUnmount(() => document.removeEventListener('click', onDocClick))
</script>

<template>
  <li ref="root" class="item-row">
    <div v-if="swipeable" class="swipe-wrap" v-bind="swipeHandlers">
      <span class="swipe-bg"><Trash2 :size="16" /></span>
      <button
        class="item"
        :class="{ checked, note: isNote }"
        :style="{ transform: `translateX(${deltaX}px)` }"
        @click="emit('toggle')"
      >
        <span v-if="isNote" class="note-dot" />
        <span v-else class="checkbox" :class="{ done: checked }">
          <svg v-if="checked" viewBox="0 0 24 24" width="13" height="13"><path d="M5 12.5l4 4L19 7" stroke="currentColor" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </span>
        <span class="label">{{ label }}</span>
        <span v-if="!stepper && quantity" class="qty font-mono">×{{ quantity }}</span>
        <span v-if="stepper" class="stepper">
          <button class="step" :disabled="!quantityNum || quantityNum <= 1" @click.stop="emit('decrement')">−</button>
          <span class="step-value font-mono">{{ quantityNum ?? 1 }}</span>
          <button class="step" @click.stop="emit('increment')">+</button>
        </span>
      </button>
    </div>
    <button
      v-else
      class="item"
      :class="{ checked, note: isNote }"
      @click="emit('toggle')"
    >
      <span v-if="isNote" class="note-dot" />
      <span v-else class="checkbox" :class="{ done: checked }">
        <svg v-if="checked" viewBox="0 0 24 24" width="13" height="13"><path d="M5 12.5l4 4L19 7" stroke="currentColor" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </span>
      <span class="label">{{ label }}</span>
      <span v-if="!stepper && quantity" class="qty font-mono">×{{ quantity }}</span>
      <span v-if="stepper" class="stepper">
        <button class="step" :disabled="!quantityNum || quantityNum <= 1" @click.stop="emit('decrement')">−</button>
        <span class="step-value font-mono">{{ quantityNum ?? 1 }}</span>
        <button class="step" @click.stop="emit('increment')">+</button>
      </span>
    </button>

    <div class="menu-wrap">
      <button class="icon-btn" aria-label="Options" @click.stop="openMenu = !openMenu">
        <MoreVertical :size="16" />
      </button>
      <div v-if="openMenu" class="menu" @click.stop>
        <button v-if="showMove" class="menu-item" @click="openMenu = false; openMove = true">
          <ArrowRightLeft :size="14" /> Déplacer
        </button>
        <button class="menu-item" @click="openMenu = false; emit('edit')">
          <Pencil :size="14" /> Modifier
        </button>
        <button class="menu-item danger" @click="openMenu = false; emit('delete')">
          <Trash2 :size="14" /> Supprimer
        </button>
      </div>
    </div>

    <div v-if="openMove" class="overlay" @click.self="openMove = false">
      <div class="dialog">
        <p class="dialog-text">Déplacer <strong>{{ label }}</strong> vers :</p>
        <div class="section-picker">
          <button
            v-for="s in sections"
            :key="s.id"
            class="picker-btn"
            @click="openMove = false; emit('move', s.id)"
          >
            {{ s.name }}
          </button>
        </div>
      </div>
    </div>
  </li>
</template>

<style scoped>
.item-row {
  display: flex;
  align-items: center;
  gap: 0.15rem;
}
.swipe-wrap,
.item-static {
  position: relative;
  flex: 1;
  min-width: 0;
}
.swipe-bg {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 1rem;
  border-radius: var(--radius);
  background: #e5484d;
  color: #fff;
}
.item {
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.7rem 0.85rem;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: var(--bg-1);
  text-align: left;
  transition: background 0.15s, border-color 0.15s;
  min-height: 2.75rem;
  touch-action: pan-y;
}
.item:active {
  background: var(--bg-2);
}
.item.checked {
  opacity: 0.55;
  background: transparent;
}
.item.checked .label {
  text-decoration: line-through;
  color: var(--ink-muted);
}
.item.note .label {
  font-style: italic;
  color: var(--ink-muted);
}
.note-dot {
  flex-shrink: 0;
  width: 0.45rem;
  height: 0.45rem;
  border-radius: 999px;
  background: var(--ink-faint);
  margin: 0 0.4rem;
}
.checkbox {
  flex-shrink: 0;
  width: 1.25rem;
  height: 1.25rem;
  border: 1.5px solid var(--line-bright);
  border-radius: 0.45rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--accent);
}
.checkbox.done {
  border-color: var(--accent-dim);
  background: var(--accent-deep);
}
.label {
  font-size: 0.95rem;
}
.qty {
  font-size: 0.7rem;
  color: var(--ink-faint);
  margin-left: auto;
  flex-shrink: 0;
}
.stepper {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  margin-left: auto;
  flex-shrink: 0;
}
.step {
  width: 1.55rem;
  height: 1.55rem;
  border: 1px solid var(--line-bright);
  border-radius: 0.45rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--ink-muted);
}
.step:active {
  background: var(--bg-2);
}
.step:disabled {
  opacity: 0.35;
}
.step-value {
  font-size: 0.8rem;
  color: var(--ink-muted);
  min-width: 1rem;
  text-align: center;
}
.menu-wrap {
  position: relative;
  flex-shrink: 0;
}
.icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.9rem;
  height: 1.9rem;
  border-radius: 0.5rem;
  color: var(--ink-muted);
}
.icon-btn:active {
  background: var(--bg-2);
}
.menu {
  position: absolute;
  right: 0;
  top: calc(100% + 0.25rem);
  z-index: 50;
  min-width: 10rem;
  padding: 0.35rem;
  border: 1px solid var(--line);
  border-radius: 0.75rem;
  background: var(--bg-1);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.55);
}
.menu-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.5rem 0.65rem;
  border-radius: 0.55rem;
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--ink-muted);
}
.menu-item:active {
  background: var(--bg-2);
}
.menu-item.danger {
  color: #ff6b6b;
}
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
.dialog-text {
  margin: 0 0 0.9rem;
  font-size: 0.95rem;
  line-height: 1.5;
}
.section-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.picker-btn {
  padding: 0.5rem 0.85rem;
  border: 1px solid var(--line);
  border-radius: 0.65rem;
  background: var(--bg-2);
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--ink-muted);
}
.picker-btn:active {
  border-color: var(--accent-dim);
  color: var(--accent);
}
</style>
