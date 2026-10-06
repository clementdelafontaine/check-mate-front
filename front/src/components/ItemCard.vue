<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useExclusiveMenu } from '../composables/useExclusiveMenu'
import { MoreVertical, Trash2, Pencil, Share2, LogOut, GripVertical } from 'lucide-vue-next'

const props = defineProps({
  to: { type: String, default: null },
  emoji: { type: String, default: '' },
  name: { type: String, required: true },
  meta: { type: String, default: '' },
  dashed: { type: Boolean, default: false },
  editable: { type: Boolean, default: false },
  shared: { type: Boolean, default: false },
  canDelete: { type: Boolean, default: true },
  draggable: { type: Boolean, default: false }
})
const emit = defineEmits(['delete', 'edit', 'leave', 'share', 'dragstart', 'touchstart', 'touchmove', 'touchend'])

const menu = useExclusiveMenu()
const confirm = ref(false)
const root = ref(null)
const menuBtn = ref(null)

function onDocClick(e) {
  if (menu.isOpen.value && menuBtn.value && !menuBtn.value.contains(e.target)) menu.close()
  if (confirm.value && root.value && !root.value.contains(e.target)) confirm.value = false
}
onMounted(() => document.addEventListener('click', onDocClick))
onBeforeUnmount(() => document.removeEventListener('click', onDocClick))
</script>

<template>
  <div ref="root" class="card-row" :class="{ 'drag-source': draggable }">
    <component
      :is="to ? 'router-link' : 'div'"
      :to="to"
      class="card"
      :class="{ dashed }"
    >
      <span v-if="emoji" class="emoji">{{ emoji }}</span>
      <span class="card-info">
        <span class="card-name">{{ name }}</span>
        <span v-if="meta" class="card-meta">{{ meta }}</span>
        <span v-if="shared" class="shared-badge"><Share2 :size="11" /> partagée</span>
      </span>
      <div ref="menuBtn" class="menu-wrap" @click.stop @click.prevent>
        <button class="icon-btn" aria-label="Options" @click="menu.toggle()">
          <MoreVertical :size="18" />
        </button>
        <div v-if="menu.isOpen.value" class="menu" @click.stop @click.prevent>
          <button v-if="editable" class="menu-item" @click="menu.close(); emit('edit')">
            <Pencil :size="15" /> Modifier
          </button>
          <button v-if="editable" class="menu-item" @click="menu.close(); emit('share')">
            <Share2 :size="15" /> Partager
          </button>
          <button v-if="canDelete" class="menu-item danger" @click="menu.close(); confirm = true">
            <Trash2 :size="15" /> Supprimer
          </button>
          <button v-else class="menu-item danger" @click="menu.close(); emit('leave')">
            <LogOut :size="15" /> Quitter la liste
          </button>
        </div>
      </div>
      <span
        v-if="draggable"
        class="drag-handle"
        aria-label="Déplacer"
        @click.prevent
        @touchstart="$emit('touchstart', $event)"
        @touchmove="$emit('touchmove', $event)"
        @touchend="$emit('touchend')"
      >
        <GripVertical :size="18" />
      </span>
    </component>

    <div v-if="confirm" class="overlay" @click.self="confirm = false">
      <div class="dialog">
        <p class="dialog-text">
          Supprimer <strong>{{ name }}</strong> ?
          Cette action est définitive.
        </p>
        <div class="dialog-actions">
          <button class="btn ghost" @click="confirm = false">Annuler</button>
          <button class="btn danger" @click="confirm = false; emit('delete')">Supprimer</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.card-row {
  position: relative;
  display: flex;
  align-items: stretch;
}
.card-row > .card {
  flex: 1;
  min-width: 0;
}
.drag-handle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  flex-shrink: 0;
  color: var(--ink-faint);
  cursor: grab;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
}
.drag-handle:active {
  color: var(--accent);
}
.card {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  padding: 0.85rem 0.6rem 0.85rem 1rem;
  border: 1px solid var(--line);
  border-radius: 1rem;
  background: var(--bg-1);
  transition: background 0.15s;
}
.card:active {
  background: var(--bg-2);
}
.card.dashed {
  border-style: dashed;
}
.emoji {
  font-size: 1.5rem;
}
.card-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.card-name {
  font-weight: 700;
}
.card-meta {
  font-size: 0.75rem;
  color: var(--ink-faint);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.shared-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  width: fit-content;
  margin-top: 0.2rem;
  padding: 0.08rem 0.45rem;
  font-size: 0.62rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--accent);
  border: 1px solid var(--accent-dim);
  border-radius: 999px;
}
.menu-wrap {
  position: relative;
  flex-shrink: 0;
}
.icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 0.6rem;
  color: var(--ink-muted);
}
.icon-btn:active {
  background: var(--bg-2);
}
.menu {
  position: absolute;
  right: 0;
  top: calc(100% + 0.3rem);
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
</style>
