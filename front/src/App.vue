<script setup>
import AppHeader from './components/AppHeader.vue'
import AppNav from './components/AppNav.vue'
import { useRoute } from 'vue-router'
import UndoToast from './components/UndoToast.vue'
import { useUndoToast } from './composables/useUndoToast'
import { computed } from 'vue'

const toast = useUndoToast()
const route = useRoute()
const showNav = computed(() => route.name !== 'login')
</script>

<template>
  <AppHeader />
  <main class="flex-1">
    <router-view />
  </main>
  <AppNav v-if="showNav" />
  <UndoToast
    :message="toast.message.value"
    :visible="toast.visible.value"
    @undo="toast.undo"
    @close="toast.close"
  />
</template>
