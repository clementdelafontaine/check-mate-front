<script setup>
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useChecklistsStore } from '../stores/checklists'
import { api } from '../services/api'
import { useUndoToast } from '../composables/useUndoToast'
import ChecklistSection from '../components/ChecklistSection.vue'
import ConfirmDialog from '../components/ConfirmDialog.vue'
import CheckedPile from '../components/CheckedPile.vue'
import AddItemCard from '../components/AddItemCard.vue'
import UndoToast from '../components/UndoToast.vue'
import ListEditDialog from '../components/ListEditDialog.vue'
import { useFriendsStore } from '../stores/friends'
import { useAuthStore } from '../stores/auth'
import { ArrowLeft, RotateCcw, Eraser, Pencil, Share2, MoreVertical, Trash2 } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const store = useChecklistsStore()
const toast = useUndoToast()

const list = computed(() => store.listById(route.params.id))

const total = computed(() =>
  list.value ? list.value.sections.reduce((n, s) => n + s.items.length, 0) : 0
)
const done = computed(() =>
  list.value
    ? list.value.sections.reduce((n, s) => n + s.items.filter((i) => i.checked).length, 0)
    : 0
)
const progress = computed(() => (total.value === 0 ? 0 : Math.round((done.value / total.value) * 100)))

const fmtDate = (isoStr) => {
  if (!isoStr || typeof isoStr !== 'string') return null
  const [y, m, d] = isoStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

const dateLabel = computed(() => {
  const start = list.value?.startDate
  const end = list.value?.endDate
  const s = fmtDate(start)
  if (!s) return null
  const e = fmtDate(end)
  if (e && end !== start) return `${s} → ${e}`
  return s
})

const checkedItems = computed(() =>
  list.value ? list.value.sections.flatMap((s) => s.items.filter((i) => i.checked)) : []
)

const confirmClear = ref(false)
const showEdit = ref(false)
const showShare = ref(false)
const friends = useFriendsStore()
const auth = useAuthStore()
const shareBusy = ref(false)

const isListShared = computed(() => !!list.value?.isShared)
onMounted(() => {
  if (route.query.share === '1' && isOwnList.value) openShare()
})

const isOwnList = computed(
  () => !list.value || list.value.ownerId === null || list.value.ownerId === auth.user?.id
)
const sharedUserIds = ref(new Set())

async function openShare() {
  showShare.value = true
  if (!isOwnList.value) return
  await friends.refresh()
  try {
    const rows = await api.fetchCollaborators(route.params.id)
    sharedUserIds.value = new Set(rows.map((c) => c.userId))
  } catch {
    sharedUserIds.value = new Set()
  }
}

const confirmLeave = ref(false)
const leaveBusy = ref(false)

async function leaveSharedList() {
  if (leaveBusy.value) return
  leaveBusy.value = true
  try {
    await api.unshareList(list.value.id, 'me')
    showShare.value = false
    confirmLeave.value = false
    await store.refresh()
    toast.show(`Vous avez quitté « ${list.value.name} »`)
    router.push('/lists')
  } catch {
    toast.show('Impossible de quitter la liste')
  } finally {
    leaveBusy.value = false
  }
}

function isSharedWith(friend) {
  return sharedUserIds.value.has(friend.userId)
}

async function toggleShare(friend) {
  if (shareBusy.value) return
  shareBusy.value = true
  try {
    if (sharedUserIds.value.has(friend.userId)) {
      await friends.unshareList(list.value.id, friend.userId)
      sharedUserIds.value = new Set([...sharedUserIds.value].filter((id) => id !== friend.userId))
      toast.show(`Partage retiré à ${friend.username}`)
    } else {
      await friends.shareList(list.value.id, friend.userId)
      sharedUserIds.value = new Set([...sharedUserIds.value, friend.userId])
      toast.show(`Liste partagée avec ${friend.username}`)
    }
  } catch (err) {
    toast.show(err.message ?? 'Erreur')
  } finally {
    shareBusy.value = false
  }
}

async function clearChecked() {
  const removed = await store.clearChecked(list.value.id)
  confirmClear.value = false
  toast.show(`${removed.length} item(s) retiré(s)`, () => store.restoreCleared(list.value.id, removed))
}

function resetList() {
  store.resetList(list.value.id)
  toast.show('Liste réinitialisée')
}

function saveAsTemplate() {
  store.saveListAsTemplate(list.value.id)
  toast.show('Liste enregistrée comme template')
}

async function duplicate() {
  const copy = await store.duplicateList(list.value.id)
  toast.show('Liste dupliquée', () => {
    store.removeList(copy.id)
  })
}
const sectionMenu = ref(null)
const listView = ref(null)
function onDocClick(e) {
  if (sectionMenu.value !== null && listView.value && !listView.value.contains(e.target)) {
    sectionMenu.value = null
  }
}
onMounted(() => document.addEventListener('click', onDocClick))
onBeforeUnmount(() => document.removeEventListener('click', onDocClick))
const editingSection = ref(null)
const sectionDraft = ref('')
const showSectionForm = ref(false)
const newSectionName = ref('')

async function submitSection() {
  const name = newSectionName.value.trim()
  if (!name || !list.value) return
  await store.addSection(list.value.id, name)
  newSectionName.value = ''
  showSectionForm.value = false
}
const confirmRemoveSection = ref(null)
function startSectionEdit(section) {
  editingSection.value = section.id
  sectionDraft.value = section.name
}
async function saveSectionEdit(section) {
  const name = sectionDraft.value.trim()
  editingSection.value = null
  if (!name || name === section.name) return
  try {
    await store.renameSection(list.value.id, section.id, name)
  } catch {
    toast.show('Impossible de renommer la catégorie')
  }
}
async function removeSection(section) {
  confirmRemoveSection.value = null
  const payload = await store.removeSection(list.value.id, section.id)
  if (!payload) {
    toast.show('Impossible de supprimer la catégorie')
    return
  }
  toast.show(`« ${payload.section.name} » supprimée`, () =>
    store.restoreSection(list.value.id, payload)
  )
}
</script>

<template>
  <div v-if="list" ref="listView" class="view">
    <div class="view-header">
      <button class="back" aria-label="Retour" @click="router.back()">
        <ArrowLeft :size="20" />
      </button>
      <div class="title-block">
        <h1 class="view-title font-display">{{ list.emoji }} {{ list.name }}</h1>
        <span class="font-mono meta">
          <span v-if="dateLabel" class="date-chip">{{ dateLabel }}</span>
          {{ done }}/{{ total }} · {{ progress }}%
        </span>
      </div>
      <button class="clear" @click="confirmClear = true">
        <Eraser :size="16" /> Vider
      </button>
    </div>

    <div class="toolbar">
      <button v-if="done > 0" class="tool-btn" @click="resetList">
        <RotateCcw :size="14" /> Tout décocher
      </button>
      <button v-if="isOwnList" class="tool-btn" @click="duplicate">Dupliquer</button>
      <button v-if="isOwnList" class="tool-btn" @click="saveAsTemplate">→ Template</button>
      <button v-if="isOwnList" class="tool-btn" @click="showEdit = true">
        <Pencil :size="14" /> Modifier
      </button>
      <button class="tool-btn" :class="{ shared: isListShared }" @click="openShare">
        <Share2 :size="14" /> Partager
      </button>
    </div>

    <div class="global-progress">
      <div class="global-fill" :style="{ width: progress + '%' }" />
    </div>

    <section v-for="section in list.sections" :key="section.id" class="section-block">
      <div class="section-head">
        <input
          v-if="editingSection === section.id"
          v-model="sectionDraft"
          class="section-edit-input"
          type="text"
          @keyup.enter="saveSectionEdit(section)"
          @keyup.escape="editingSection = null"
          @vue:mounted="($event) => $event.el?.focus?.()"
        />
        <h3
          v-else
          class="section-name"
          :class="{ empty: section.items.filter((i) => !i.checked).length === 0 }"
          @click="startSectionEdit(section)"
        >{{ section.name }}</h3>
        <div class="section-actions">
          <span class="section-count font-mono">
            {{ section.items.filter((i) => !i.checked).length }}/{{ section.items.length }}
          </span>
          <div class="menu-wrap" @click.stop>
            <button class="icon-btn" aria-label="Options de la catégorie" @click="sectionMenu = sectionMenu === section.id ? null : section.id">
              <MoreVertical :size="16" />
            </button>
            <div v-if="sectionMenu === section.id" class="menu">
              <button class="menu-item" @click="sectionMenu = null; startSectionEdit(section)">
                <Pencil :size="14" /> Éditer
              </button>
              <button class="menu-item danger" @click="sectionMenu = null; confirmRemoveSection = section">
                <Trash2 :size="14" /> Supprimer
              </button>
            </div>
          </div>
        </div>
      </div>
      <ChecklistSection :list-id="list.id" :section="section" :all-sections="list.sections" />
    </section>

    <AddItemCard :list-id="list.id" />
    <div v-if="showSectionForm" class="form-card">
      <form @submit.prevent="submitSection">
        <input v-model="newSectionName" class="input" type="text" placeholder="Nouvelle catégorie" autofocus />
        <button type="submit" class="submit">Ajouter la catégorie</button>
      </form>
    </div>
    <button v-else class="add-inline add-section-inline" @click="showSectionForm = true">
      <span class="plus-circle">+</span>
      <span class="add-label">Ajouter une catégorie</span>
    </button>

    <CheckedPile v-if="checkedItems.length" :list-id="list.id" :items="checkedItems" />
    <ConfirmDialog
      v-if="confirmRemoveSection"
      :message="`Supprimer la catégorie « ${confirmRemoveSection.name} » et ses ${confirmRemoveSection.items.length} item(s) ?`"
      @cancel="confirmRemoveSection = null"
      @confirm="removeSection(confirmRemoveSection)"
    />

    <ListEditDialog
      v-if="showEdit && list"
      :list="list"
      @close="showEdit = false"
      @saved="toast.show('Liste modifiée')"
    />
    <div v-if="showShare" class="overlay" @click.self="showShare = false">
      <div class="dialog">
        <template v-if="isOwnList">
        <p class="dialog-text">Partager <strong>{{ list.name }}</strong> avec un ami</p>
        <p v-if="!friends.accepted.length" class="dialog-text muted">
          Aucun ami pour le moment — ajoutez-en depuis la page Amis.
        </p>
        <ul v-else class="share-list">
          <li v-for="friend in friends.accepted" :key="friend.id">
            <label class="share-row" :class="{ active: isSharedWith(friend) }">
              <input
                type="checkbox"
                :checked="isSharedWith(friend)"
                :disabled="shareBusy"
                @change="toggleShare(friend)"
              />
              <span>{{ friend.username }}</span>
            </label>
          </li>
        </ul>
        <div class="dialog-actions">
          <button class="btn ghost" @click="showShare = false">Fermer</button>
        </div>
        </template>
        <template v-else>
          <p class="dialog-text">
            <strong>{{ list.name }}</strong> est une liste partagée par
            <strong>{{ list.ownerUsername ?? 'un autre utilisateur' }}</strong>.
          </p>
          <p class="dialog-text muted">
            Vous pouvez cocher les items, mais seul le propriétaire gère le partage.
          </p>
          <div class="dialog-actions">
            <button class="btn danger" :disabled="leaveBusy" @click="confirmLeave = true">
              Quitter la liste
            </button>
            <button class="btn ghost" @click="showShare = false">Fermer</button>
          </div>
        </template>
      </div>
    </div>
    <div v-if="confirmLeave" class="overlay" @click.self="confirmLeave = false">
      <div class="dialog">
        <p class="dialog-text">
          Quitter <strong>{{ list.name }}</strong> ?
          Cette liste ne sera plus partagée avec vous et disparaîtra de vos listes.
        </p>
        <div class="dialog-actions">
          <button class="btn ghost" @click="confirmLeave = false">Annuler</button>
          <button class="btn danger" :disabled="leaveBusy" @click="leaveSharedList">
            Quitter
          </button>
        </div>
      </div>
    </div>

    <div v-if="confirmClear" class="overlay" @click.self="confirmClear = false">
      <div class="dialog">
        <p class="dialog-text">
          Vider la liste <strong>{{ list.name }}</strong> ?
          {{ done > 0 ? `Les ${done} item(s) cochés seront retirés définitivement.` : "Aucun item n'est coché pour le moment." }}
        </p>
        <div class="dialog-actions">
          <button class="btn ghost" @click="confirmClear = false">Annuler</button>
          <button class="btn danger" @click="clearChecked">Vider</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.view-header {
  margin-bottom: 0.75rem;
}
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
.back:active {
  background: var(--bg-2);
}
.title-block {
  flex: 1;
  min-width: 0;
}
.meta {
  font-size: 0.7rem;
  color: var(--ink-faint);
}
.date-chip {
  display: inline-flex;
  align-items: center;
  padding: 0.1rem 0.45rem;
  margin-right: 0.4rem;
  border: 1px solid var(--accent-dim);
  border-radius: 999px;
  color: var(--accent);
  background: var(--accent-deep);
}
.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}
.tool-btn {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.45rem 0.8rem;
  font-size: 0.78rem;
  font-weight: 600;
  border: 1px solid var(--line);
  border-radius: 0.65rem;
  color: var(--ink-muted);
  transition: border-color 0.15s, color 0.15s;
}
.tool-btn:active {
  border-color: var(--accent-dim);
  color: var(--accent);
}
.tool-btn.shared {
  border-color: var(--accent);
  color: var(--accent);
  background: var(--accent-deep);
}
.share-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  width: 100%;
  padding: 0.45rem 0.6rem;
  border: 1px solid var(--line);
  border-radius: 0.6rem;
  cursor: pointer;
  font-size: 0.85rem;
  transition: border-color 0.15s, color 0.15s, background 0.15s;
}
.share-row.active {
  border-color: var(--accent);
  color: var(--accent);
  background: var(--accent-deep);
  font-weight: 600;
}
.share-row input[type='checkbox'] {
  accent-color: var(--accent);
  width: 1rem;
  height: 1rem;
}
.global-progress {
  height: 4px;
  border-radius: 999px;
  background: var(--bg-2);
  margin-bottom: 1.25rem;
  overflow: hidden;
}
.global-fill {
  height: 100%;
  background: var(--accent);
  border-radius: 999px;
  transition: width 0.25s;
}
.section-block {
  margin-bottom: 1.5rem;
}
.section-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}
.section-edit-input {
  flex: 1;
  min-width: 0;
  font-size: 0.95rem;
  font-weight: 700;
  padding: 0.25rem 0.5rem;
  border: 1px solid var(--accent);
  border-radius: 0.5rem;
  background: var(--bg-1);
  color: inherit;
}
.section-actions {
  display: flex;
  align-items: center;
  gap: 0.15rem;
  flex-shrink: 0;
  margin-left: auto;
  position: relative;
}
.menu-wrap {
  position: relative;
  flex-shrink: 0;
}
.icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  border: none;
  background: none;
  border-radius: 0.5rem;
  color: var(--ink-muted);
  cursor: pointer;
}
.icon-btn:active {
  background: var(--bg-2);
}
.menu {
  position: absolute;
  right: 0;
  top: calc(100% + 0.3rem);
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
  gap: 0.5rem;
  padding: 0.45rem 0.6rem;
  border: none;
  background: none;
  border-radius: 0.5rem;
  font-size: 0.8rem;
  color: var(--ink);
  cursor: pointer;
  text-align: left;
}
.menu-item:active {
  background: var(--bg-2);
}
.menu-item.danger {
  color: #e5484d;
}
.section-name {
  cursor: pointer;
  margin: 0;
  font-size: 0.95rem;
  font-weight: 700;
}
.section-name.empty {
  color: var(--ink-faint);
  font-weight: 500;
}
.clear {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  flex-shrink: 0;
  padding: 0.4rem 0.7rem;
  font-size: 0.75rem;
  font-weight: 600;
  border: 1px solid var(--line);
  border-radius: 0.6rem;
  color: var(--ink-muted);
}
.clear:active {
  background: var(--bg-2);
}
.section-count {
  font-size: 0.7rem;
  color: var(--ink-faint);
  white-space: nowrap;
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

.share-list {
  list-style: none;
  margin: 0 0 1rem;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 14rem;
  overflow-y: auto;
}

.share-list li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
  padding: 0.45rem 0.6rem;
  border: 1px solid var(--line);
  border-radius: 0.6rem;
}

.muted {
  color: var(--ink-muted);
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
.add-section-inline {
  margin-top: 0.75rem;
}
.add-inline {
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
.add-inline:active {
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
  font-size: 1.1rem;
  font-weight: 700;
  flex-shrink: 0;
}
.add-label {
  font-weight: 600;
  font-size: 0.9rem;
}
.form-card {
  border: 1px solid var(--accent-dim);
  border-radius: 1rem;
  background: var(--bg-1);
  padding: 0.85rem;
  margin-top: 0.75rem;
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
</style>
