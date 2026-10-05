<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Sun, Moon, ArrowLeft } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const showBack = computed(
  () => route.name !== null && !['home', 'lists', 'recipes', 'login'].includes(route.name)
)

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

async function logout() {
  await auth.logout()
  router.push({ name: 'login' })
}
</script>

<template>
  <header class="header">
    <div class="header-inner">
      <div class="header-left">
        <button
          v-if="showBack"
          class="theme-btn back-btn"
          aria-label="Retour"
          @click="router.back()"
        >
          <ArrowLeft :size="18" />
        </button>
        <router-link to="/" class="brand font-display">Check<span class="glow-text">Mate</span></router-link>
      </div>
      <div class="header-actions">
        <router-link v-if="auth.isAdmin" to="/admin" class="theme-btn" aria-label="Administration">
          <Shield :size="17" />
        </router-link>
        <button class="theme-btn" :aria-label="theme === 'dark' ? 'Thème clair' : 'Thème sombre'" @click="toggleTheme">
          <Sun v-if="theme === 'dark'" :size="17" />
          <Moon v-else :size="17" />
        </button>
        <button v-if="auth.isAuthenticated" class="theme-btn" aria-label="Déconnexion" @click="logout">
          <LogOut :size="17" />
        </button>
      </div>
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
.header-left {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}
.back-btn {
  color: var(--ink);
}
.header-actions {
  display: flex;
  align-items: center;
  gap: 0.25rem;
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
