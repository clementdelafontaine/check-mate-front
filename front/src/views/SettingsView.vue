<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { authApi } from '../services/authApi'
import { KeyRound, LogOut } from 'lucide-vue-next'

const auth = useAuthStore()
const router = useRouter()

const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const error = ref('')
const success = ref('')
const saving = ref(false)

async function changePassword() {
  error.value = ''
  success.value = ''
  if (newPassword.value.length < 8) {
    error.value = 'Le nouveau mot de passe doit faire au moins 8 caractères.'
    return
  }
  if (newPassword.value !== confirmPassword.value) {
    error.value = 'Les deux mots de passe ne correspondent pas.'
    return
  }
  saving.value = true
  try {
    await authApi.changePassword(currentPassword.value, newPassword.value)
    success.value = 'Mot de passe mis à jour. Veuillez vous reconnecter.'
    currentPassword.value = ''
    newPassword.value = ''
    confirmPassword.value = ''
    setTimeout(async () => {
      await auth.logout()
      router.push({ name: 'login' })
    }, 1500)
  } catch (err) {
    error.value =
      err.status === 401 ? 'Mot de passe actuel incorrect.' : err.message ?? 'Erreur.'
  } finally {
    saving.value = false
  }
}

async function logout() {
  await auth.logout()
  router.push({ name: 'login' })
}
</script>

<template>
  <div class="view">
    <div class="view-header">
      <h1 class="view-title font-display">Paramètres</h1>
    </div>

    <section class="panel-card">
      <h2 class="section-label">Mes données</h2>
      <ul class="data-list">
        <li class="data-row">
          <span class="data-label font-mono">Pseudo</span>
          <span class="data-value">{{ auth.user?.username ?? '—' }}</span>
        </li>
        <li class="data-row">
          <span class="data-label font-mono">Email</span>
          <span class="data-value">{{ auth.user?.email ?? '—' }}</span>
        </li>
        <li class="data-row">
          <span class="data-label font-mono">Rôle</span>
          <span class="data-value">{{ auth.user?.role === 'admin' ? 'Administrateur' : 'Utilisateur' }}</span>
        </li>
      </ul>
    </section>

    <section class="panel-card">
      <h2 class="section-label"><KeyRound :size="13" /> Changer mon mot de passe</h2>
      <form @submit.prevent="changePassword">
        <label class="field-label" for="pwd-current">Mot de passe actuel</label>
        <input id="pwd-current" v-model="currentPassword" class="input" type="password" autocomplete="current-password" required />
        <label class="field-label" for="pwd-new">Nouveau mot de passe (8 caractères min.)</label>
        <input id="pwd-new" v-model="newPassword" class="input" type="password" autocomplete="new-password" required />
        <label class="field-label" for="pwd-confirm">Confirmer le nouveau mot de passe</label>
        <input id="pwd-confirm" v-model="confirmPassword" class="input" type="password" autocomplete="new-password" required />
        <p v-if="error" class="form-error">{{ error }}</p>
        <p v-if="success" class="form-success">{{ success }}</p>
        <button type="submit" class="submit" :disabled="saving || !currentPassword || !newPassword || !confirmPassword">
          {{ saving ? 'Enregistrement…' : 'Mettre à jour' }}
        </button>
      </form>
    </section>

    <button class="logout-btn" @click="logout">
      <LogOut :size="15" /> Se déconnecter
    </button>
  </div>
</template>

<style scoped>
.panel-card {
  border: 1px solid var(--line);
  border-radius: 1rem;
  background: var(--bg-1);
  padding: 1rem;
  margin-bottom: 1rem;
}
.section-label {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  margin: 0 0 0.75rem;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--ink-muted);
}
.data-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.data-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 0.5rem 0.6rem;
  border: 1px solid var(--line);
  border-radius: 0.7rem;
  background: var(--bg-2);
}
.data-label {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--ink-faint);
}
.data-value {
  font-weight: 600;
  font-size: 0.9rem;
  overflow-wrap: anywhere;
}
.field-label {
  display: block;
  margin: 0.35rem 0 0.25rem 0.15rem;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
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
  margin-bottom: 0.5rem;
  color-scheme: dark;
}
html[data-theme='light'] .input {
  color-scheme: light;
}
.input:focus {
  border-color: var(--accent-dim);
}
.form-error {
  margin: 0.25rem 0;
  font-size: 0.8rem;
  color: #ff6b6b;
}
.form-success {
  margin: 0.25rem 0;
  font-size: 0.8rem;
  color: #3fb950;
}
.submit {
  width: 100%;
  padding: 0.65rem;
  margin-top: 0.3rem;
  border-radius: 0.7rem;
  background: var(--accent);
  color: #fff;
  font-weight: 700;
  font-size: 0.9rem;
}
.submit:disabled {
  opacity: 0.5;
}
.logout-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  width: 100%;
  padding: 0.65rem;
  border: 1px solid var(--line);
  border-radius: 0.8rem;
  color: var(--ink-muted);
  font-weight: 600;
  font-size: 0.85rem;
  background: var(--bg-1);
  margin-bottom: 4rem;
}
</style>
