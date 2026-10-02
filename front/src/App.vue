<script setup>
import AppHeader from './components/AppHeader.vue'
import AppNav from './components/AppNav.vue'
</script>

<template>
  <AppHeader />
  <main class="flex-1">
    <router-view />
  </main>
  <AppNav />
</template>
