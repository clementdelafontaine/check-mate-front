<script setup>
import { ref } from 'vue'
import { useChecklistsStore } from '../stores/checklists'
import ItemCard from '../components/ItemCard.vue'
import AddCard from '../components/AddCard.vue'
import { X } from 'lucide-vue-next'

const store = useChecklistsStore()

const showForm = ref(false)
const newName = ref('')
const newDescription = ref('')

function close() {
  showForm.value = false
  newName.value = ''
  newDescription.value = ''
}

function create() {
  const name = newName.value.trim()
  if (!name) return
  store.createEmptyTemplate(name, newDescription.value.trim())
  close()
}
</script>

<template>
  <div class="view">
    <div class="view-header">
      <h1 class="view-title font-display">Mes templates</h1>
    </div>

    <ul class="lists">
      <li v-for="tpl in store.templates" :key="tpl.id">
        <ItemCard
          :to="`/template/${tpl.id}`"
          :emoji="tpl.emoji"
          :name="tpl.name"
          :meta="tpl.description"
          dashed
          @delete="store.removeTemplate(tpl.id)"
        />
      </li>
      <li><AddCard label="Ajouter un template" @click="showForm = true" /></li>
    </ul>

    <div v-if="showForm" class="overlay" @click.self="close">
      <div class="dialog">
        <div class="dialog-head">
          <span class="font-mono dialog-title">Nouveau template</span>
          <button class="icon-btn" aria-label="Fermer" @click="close"><X :size="18" /></button>
        </div>
        <form @submit.prevent="create">
          <input v-model="newName" class="input" type="text" placeholder="Nom du template" autofocus />
          <input v-model="newDescription" class="input" type="text" placeholder="Description (optionnelle)" />
          <button type="submit" class="submit">Créer</button>
        </form>
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
.dialog-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}
.dialog-title {
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.18em;
  color: var(--ink-faint);
}
.icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 0.5rem;
  color: var(--ink-muted);
}
.input {
  width: 100%;
  padding: 0.6rem 0.75rem;
  border: 1px solid var(--line);
  border-radius: 0.7rem;
  background: var(--bg-2);
  color: var(--ink);
  outline: none;
  margin-bottom: 0.6rem;
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
