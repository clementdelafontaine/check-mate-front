<script setup>
import { useRouter } from 'vue-router'
</script>

<template>
  <header class="header">
    <router-link to="/" class="brand font-display">Check<span class="glow-text">Mate</span></router-link>
  </header>
</template>

<style scoped>
.header {
  position: sticky;
  top: 0;
  z-index: 30;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 3.5rem;
  border-bottom: 1px solid var(--line);
  background: var(--bg-0);
}
.brand {
  font-size: 1.15rem;
  user-select: none;
}
</style>
