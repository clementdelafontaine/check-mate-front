<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function submit() {
  error.value = ''
  loading.value = true
  try {
    await auth.login(email.value.trim(), password.value)
    router.push(route.query.redirect ?? '/')
  } catch (err) {
    error.value =
      err.status === 401 ? 'Email ou mot de passe incorrect.' : 'Erreur de connexion.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <form class="login-card panel" @submit.prevent="submit">
      <h1 class="login-title">CheckMate</h1>
      <p class="login-sub">Connectez-vous pour accéder à vos listes.</p>

      <label class="field">
        <span class="field-label">Email</span>
        <input v-model="email" type="email" autocomplete="email" required />
      </label>

      <label class="field">
        <span class="field-label">Mot de passe</span>
        <input
          v-model="password"
          type="password"
          autocomplete="current-password"
          required
        />
      </label>

      <p v-if="error" class="login-error">{{ error }}</p>

      <button class="btn-primary" type="submit" :disabled="loading">
        {{ loading ? 'Connexion…' : 'Se connecter' }}
      </button>
    </form>
  </div>
</template>

<style scoped>
.login-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 70vh;
  padding: 1rem;
}

.login-card {
  width: 100%;
  max-width: 24rem;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.login-title {
  margin: 0;
  font-size: 1.5rem;
}

.login-sub {
  margin: 0;
  color: var(--ink-muted);
  font-size: 0.9rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.field-label {
  font-family: var(--font-mono, monospace);
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--ink-muted);
}

.login-error {
  margin: 0;
  color: var(--danger, #e5484d);
  font-size: 0.85rem;
}

.btn-primary {
  background: var(--accent);
  color: var(--on-accent);
  border: none;
  border-radius: var(--radius);
  padding: 0.75rem;
  font-weight: 600;
  cursor: pointer;
}

.btn-primary:disabled {
  opacity: 0.6;
}
</style>
