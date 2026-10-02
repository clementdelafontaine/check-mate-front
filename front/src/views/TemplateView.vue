<script setup>
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useChecklistsStore } from '../stores/checklists'
import AddItemCard from '../components/AddItemCard.vue'
import { ArrowLeft, CopyPlus, MoreVertical, Trash2 } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const store = useChecklistsStore()

const tpl = computed(() => store.templateById(route.params.id))
const creating = ref(false)

function useTemplate() {
  if (!tpl.value) return
  creating.value = true
  const list = store.createListFromTemplate(tpl.value.id)
  router.push(`/list/${list.id}`)
}

const openMenuKey = ref(null)
const confirmItem = ref(null)
const root = ref(null)

function askDelete(sectionId, item) {
  openMenuKey.value = null
  confirmItem.value = { sectionId, item }
}
function doDelete() {
  if (confirmItem.value) {
    store.removeTemplateItem(tpl.value.id, confirmItem.value.sectionId, confirmItem.value.item.label)
  }
  confirmItem.value = null
}

function onDocClick(e) {
  if (openMenuKey.value && root.value && !root.value.contains(e.target)) openMenuKey.value = null
  if (confirmItem.value && root.value && !root.value.contains(e.target)) confirmItem.value = null
}
onMounted(() => document.addEventListener('click', onDocClick))
onBeforeUnmount(() => document.removeEventListener('click', onDocClick))
</script>

<template>
  <div v-if="tpl" ref="root" class="view">
    <div class="view-header">
      <button class="back" aria-label="Retour" @click="router.back()">
        <ArrowLeft :size="20" />
      </button>
      <div class="title-block">
        <h1 class="view-title font-display">{{ tpl.emoji }} {{ tpl.name }}</h1>
        <span class="desc">{{ tpl.description }}</span>
      </div>
    </div>

    <button class="use-btn" :disabled="creating" @click="useTemplate">
      <CopyPlus :size="17" />
      {{ creating ? 'Création…' : 'Utiliser ce template' }}
    </button>

    <section v-for="section in tpl.sections" :key="section.id" class="section">
      <h3 class="section-name">{{ section.name }}</h3>
      <ul class="items">
        <li v-for="item in section.items" :key="item.label" class="item-row">
          <div class="item">
            <span class="checkbox" />
            <span class="label">{{ item.label }}</span>
            <span v-if="item.quantity" class="qty font-mono">×{{ item.quantity }}</span>
          </div>
          <div class="menu-wrap">
            <button
              class="icon-btn"
              aria-label="Options"
              @click.stop="openMenuKey = openMenuKey === section.id + item.label ? null : section.id + item.label"
            >
              <MoreVertical :size="16" />
            </button>
            <div
              v-if="openMenuKey === section.id + item.label"
              class="menu"
              @click.stop
            >
              <button class="menu-item danger" @click="askDelete(section.id, item)">
                <Trash2 :size="14" /> Supprimer
              </button>
            </div>
          </div>
        </li>
      </ul>
    </section>

    <AddItemCard :template-id="tpl.id" />

    <div v-if="confirmItem" class="overlay" @click.self="confirmItem = null">
      <div class="dialog">
        <p class="dialog-text">
          Supprimer <strong>{{ confirmItem.item.label }}</strong> ?
          Cette action est définitive.
        </p>
        <div class="dialog-actions">
          <button class="btn ghost" @click="confirmItem = null">Annuler</button>
          <button class="btn danger" @click="doDelete">Supprimer</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.back {
  flex-shrink: 0;
  width: 2.25rem;
  height: 2.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.6rem;
  color: var(--ink-muted);
}
.title-block {
  flex: 1;
  min-width: 0;
}
.desc {
  font-size: 0.78rem;
  color: var(--ink-faint);
}
.use-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.8rem;
  margin-bottom: 1.5rem;
  border-radius: 0.9rem;
  background: var(--accent);
  color: #fff;
  font-weight: 700;
  font-size: 0.95rem;
  transition: opacity 0.15s;
}
.use-btn:disabled {
  opacity: 0.6;
}
.use-btn:active {
  transform: scale(0.99);
}
.section {
  margin-bottom: 1.5rem;
}
.section-name {
  margin: 0 0 0.6rem;
  font-size: 0.95rem;
  font-weight: 700;
}
.items {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}
.item-row {
  display: flex;
  align-items: center;
  gap: 0.15rem;
}
.item {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.7rem 0.85rem;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: var(--bg-1);
  min-height: 2.75rem;
}
.checkbox {
  flex-shrink: 0;
  width: 1.25rem;
  height: 1.25rem;
  border: 1.5px solid var(--line-bright);
  border-radius: 0.45rem;
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
  min-width: 9rem;
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
