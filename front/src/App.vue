<script setup>
import AppHeader from './components/AppHeader.vue'
import AppNav from './components/AppNav.vue'
import UndoToast from './components/UndoToast.vue'
import { useUndoToast } from './composables/useUndoToast'

const toast = useUndoToast()
</script>

<template>
  <AppHeader />
  <main class="flex-1">
    <router-view />
  </main>
  <AppNav />
  <UndoToast
    :message="toast.message.value"
    :visible="toast.visible.value"
    @undo="toast.undo"
    @close="toast.close"
  />
</template>
