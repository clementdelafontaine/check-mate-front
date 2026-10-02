<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useChecklistsStore } from '../stores/checklists'
import { Sparkles, MoreVertical, Trash2, Plus, X } from 'lucide-vue-next'

const store = useChecklistsStore()
const openMenuId = ref(null)
const confirmDelete = ref(null)
const menuEl = ref(null)

function toggleMenu(id) {
  openMenuId.value = openMenuId.value === id ? null : id
}

function askDelete(tpl) {
  openMenuId.value = null
  confirmDelete.value = tpl
}

function doDelete() {
  if (confirmDelete.value) store.removeTemplate(confirmDelete.value.id)
  confirmDelete.value = null
}

function onDocClick(e) {
  if (menuEl.value && !menuEl.value.contains(e.target)) openMenuId.value = null
}
onMounted(() => document.addEventListener('click', onDocClick))
onBeforeUnmount(() => document.removeEventListener('click', onDocClick))

const showCreate = ref(false)
const newName = ref('')
const newDescription = ref('')
function createTemplate() {
  const name = newName.value.trim()
  if (!name) return
  store.createEmptyTemplate(name, newDescription.value.trim())
  newName.value = ''
  newDescription.value = ''
  showCreate.value = false
}
</script>

<template>
  <div class="view">
    <div class="view-header">
      <h1 class="view-title font-display">Mes templates</h1>
    </div>

    <ul class="lists">
      <li v-for="tpl in store.templates" :key="tpl.id" class="list-row">
        <router-link class="list-card template" :to="`/template/${tpl.id}`">
          <span class="emoji">{{ tpl.emoji }}</span>
          <span class="list-info">
            <span class="list-name">{{ tpl.name }}</span>
            <span class="list-meta">{{ tpl.description }}</span>
          </span>
          <Sparkles :size="16" class="spark" />
        </router-link>
        <div class="menu-wrap" ref="menuEl">
          <button class="icon-btn" aria-label="Options" @click.stop="toggleMenu(tpl.id)">
            <MoreVertical :size="18" />
          </button>
          <div v-if="openMenuId === tpl.id" class="menu">
            <button class="menu-item danger" @click.stop="askDelete(tpl)">
              <Trash2 :size="15" /> Supprimer
            </button>
          </div>
        </div>
      </li>
    </ul>

    <div v-if="store.templates.length === 0" class="empty">
      Aucun template pour l'instant. Créez-en un avec le bouton +.
    </div>

    <div class="fab-zone">
      <div v-if="showCreate" class="sheet">
        <div class="sheet-head">
          <span class="font-mono sheet-title">Nouveau template</span>
          <button class="icon-btn" aria-label="Fermer" @click="showCreate = false"><X :size="18" /></button>
        </div>
        <form @submit.prevent="createTemplate">
          <input v-model="newName" class="input" type="text" placeholder="Nom du template" autofocus />
          <input v-model="newDescription" class="input" type="text" placeholder="Description (optionnelle)" />
          <button type="submit" class="submit">Créer</button>
        </form>
      </div>
      <button v-if="!showCreate" class="fab" aria-label="Ajouter un template" @click="showCreate = true">
        <Plus :size="26" :stroke-width="2.4" />
      </button>
    </div>

    <div v-if="confirmDelete" class="overlay" @click.self="confirmDelete = null">
      <div class="dialog">
        <p class="dialog-text">
          Supprimer le template <strong>{{ confirmDelete.name }}</strong> ?
          Cette action est définitive.
        </p>
        <div class="dialog-actions">
          <button class="btn ghost" @click="confirmDelete = null">Annuler</button>
          <button class="btn danger" @click="doDelete">Supprimer</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.lists {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}
.list-row {
  position: relative;
  display: flex;
  align-items: center;
}
.list-card {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 0.9rem;
  padding: 0.85rem 1rem;
  border: 1px solid var(--line);
  border-radius: 1rem;
  background: var(--bg-1);
  transition: background 0.15s;
}
.list-card:active {
  background: var(--bg-2);
}
.list-card.template {
  border-style: dashed;
}
.emoji {
  font-size: 1.5rem;
}
.list-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.list-name {
  font-weight: 700;
}
.list-meta {
  font-size: 0.75rem;
  color: var(--ink-faint);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.spark {
  color: var(--ink-faint);
  flex-shrink: 0;
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
.empty {
  margin-top: 1.5rem;
  text-align: center;
  color: var(--ink-faint);
  font-size: 0.9rem;
}
.fab-zone {
  position: fixed;
  right: 1rem;
  bottom: calc(4.5rem + env(safe-area-inset-bottom));
  z-index: 40;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.75rem;
}
.fab {
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--accent);
  color: #fff;
  box-shadow: 0 8px 24px rgba(77, 141, 255, 0.35);
  transition: transform 0.15s;
}
.fab:active {
  transform: scale(0.92);
}
.sheet {
  width: min(20rem, calc(100vw - 2rem));
  border: 1px solid var(--line);
  border-radius: 1rem;
  background: var(--bg-1);
  padding: 0.85rem;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.5);
}
.sheet-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.6rem;
}
.sheet-title {
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.18em;
  color: var(--ink-faint);
}
.input {
  width: 100%;
  padding: 0.6rem 0.75rem;
  border: 1px solid var(--line);
  border-radius: 0.7rem;
  background: var(--bg-2);
  color: var(--ink);
  outline: none;
  margin-bottom: 0.5rem;
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
