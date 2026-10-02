<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useChecklistsStore } from '../stores/checklists'
import AddItemCard from '../components/AddItemCard.vue'
import { ArrowLeft, CopyPlus } from 'lucide-vue-next'

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
</script>

<template>
  <div v-if="tpl" class="view">
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
          <span class="checkbox" />
          <span class="label">{{ item.label }}</span>
          <span v-if="item.quantity" class="qty font-mono">×{{ item.quantity }}</span>
        </li>
      </ul>
    </section>

    <AddItemCard :template-id="tpl.id" />
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
  gap: 0.75rem;
  padding: 0.7rem 0.85rem;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: var(--bg-1);
  font-size: 0.95rem;
}
.checkbox {
  flex-shrink: 0;
  width: 1.25rem;
  height: 1.25rem;
  border: 1.5px solid var(--line-bright);
  border-radius: 0.45rem;
}
.label {
  flex: 1;
  min-width: 0;
}
.qty {
  font-size: 0.7rem;
  color: var(--ink-faint);
  flex-shrink: 0;
}
</style>
