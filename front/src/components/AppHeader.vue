<script setup>
import { ref, onMounted } from 'vue'
import { Sun, Moon } from 'lucide-vue-next'

const theme = ref('dark')

onMounted(() => {
  const saved = localStorage.getItem('checkmate-theme')
  if (saved === 'light' || saved === 'dark') theme.value = saved
  applyTheme()
})

function toggleTheme() {
  theme.value = theme.value === 'dark' ? 'light' : 'dark'
  localStorage.setItem('checkmate-theme', theme.value)
  applyTheme()
}

function applyTheme() {
  document.documentElement.dataset.theme = theme.value
}
</script>

<template>
  <header class="header">
    <div class="header-inner">
      <router-link to="/" class="brand font-display">Check<span class="glow-text">Mate</span></router-link>
      <button class="theme-btn" :aria-label="theme === 'dark' ? 'Thème clair' : 'Thème sombre'" @click="toggleTheme">
        <Sun v-if="theme === 'dark'" :size="17" />
        <Moon v-else :size="17" />
      </button>
    </div>
  </header>
</template>

<style scoped>
.header {
  position: sticky;
  top: 0;
  z-index: 30;
  border-bottom: 1px solid var(--line);
  background: var(--bg-0);
}
.header-inner {
  max-width: 640px;
  margin: 0 auto;
  height: 3.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1rem;
}
.brand {
  font-size: 1.15rem;
  user-select: none;
}
.theme-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 0.6rem;
  color: var(--ink-muted);
  transition: color 0.15s;
}
.theme-btn:active {
  background: var(--bg-2);
}
</style>
