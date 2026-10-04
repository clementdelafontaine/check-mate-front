<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { authApi } from '../services/authApi'

const auth = useAuthStore()

const users = ref([])
const loading = ref(true)
const error = ref('')

const newEmail = ref('')
const newPassword = ref('')
const newRole = ref('user')
const creating = ref(false)

const editingPassword = ref(null)
const editPasswordValue = ref('')

const confirmDelete = ref(null)

async function refresh() {
  loading.value = true
  error.value = ''
  try {
    users.value = await authApi.listUsers()
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

async function createUser() {
  error.value = ''
  creating.value = true
  try {
    await authApi.createUser(newEmail.value.trim(), newPassword.value, newRole.value)
    newEmail.value = ''
    newPassword.value = ''
    newRole.value = 'user'
    await refresh()
  } catch (err) {
    error.value = err.message
  } finally {
    creating.value = false
  }
}

async function deleteUser(user) {
  try {
    await authApi.deleteUser(user.id)
    confirmDelete.value = null
    await refresh()
  } catch (err) {
    error.value = err.message
  }
}

async function savePassword(user) {
  try {
    await authApi.setUserPassword(user.id, editPasswordValue.value)
    editingPassword.value = null
    editPasswordValue.value = ''
  } catch (err) {
    error.value = err.message
  }
}

onMounted(refresh)
</script>

<template>
  <div class="admin-page">
    <section class="panel admin-card">
      <header class="admin-header">
        <h1>Utilisateurs</h1>
        <button class="btn-ghost" @click="refresh">Rafraîchir</button>
      </header>

      <p v-if="error" class="admin-error">{{ error }}</p>
      <p v-if="loading" class="admin-muted">Chargement…</p>

      <ul v-else class="user-list">
        <li v-for="user in users" :key="user.id" class="user-row">
          <div class="user-info">
            <span class="user-email">{{ user.email }}</span>
            <span class="user-role" :class="{ admin: user.role === 'admin' }">
              {{ user.role }}
            </span>
          </div>

          <div class="user-actions">
            <button class="btn-ghost" @click="editingPassword = user; editPasswordValue = ''">
              Mot de passe
            </button>
            <button
              v-if="user.id !== auth.user?.id"
              class="btn-danger-ghost"
              @click="confirmDelete = user"
            >
              Supprimer
            </button>
          </div>

          <div v-if="editingPassword?.id === user.id" class="pwd-edit">
            <input
              v-model="editPasswordValue"
              type="password"
              placeholder="Nouveau mot de passe (8+)"
            />
            <button class="btn-primary" :disabled="editPasswordValue.length < 8" @click="savePassword(user)">
              Enregistrer
            </button>
            <button class="btn-ghost" @click="editingPassword = null">Annuler</button>
          </div>

          <div v-if="confirmDelete?.id === user.id" class="confirm-box">
            <p>Supprimer {{ user.email }} ? Toutes ses listes seront définitivement supprimées.</p>
            <button class="btn-danger" @click="deleteUser(user)">Supprimer</button>
            <button class="btn-ghost" @click="confirmDelete = null">Annuler</button>
          </div>
        </li>
      </ul>
    </section>

    <section class="panel admin-card">
      <h2>Créer un utilisateur</h2>
      <p class="admin-muted">
        Les utilisateurs ne peuvent créer un compte que depuis ici : l'inscription
        publique est désactivée.
      </p>

      <label class="field">
        <span class="field-label">Email</span>
        <input v-model="newEmail" type="email" />
      </label>

      <label class="field">
        <span class="field-label">Mot de passe (8 caractères min.)</span>
        <input v-model="newPassword" type="password" />
      </label>

      <label class="field">
        <span class="field-label">Rôle</span>
        <select v-model="newRole">
          <option value="user">Utilisateur</option>
          <option value="admin">Administrateur</option>
        </select>
      </label>

      <button
        class="btn-primary"
        :disabled="creating || !newEmail || newPassword.length < 8"
        @click="createUser"
      >
        {{ creating ? 'Création…' : 'Créer' }}
      </button>
    </section>
  </div>
</template>

<style scoped>
.admin-page {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 0.5rem 0 4rem;
  max-width: 40rem;
  margin: 0 auto;
  width: 100%;
}

.admin-card {
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.admin-header h1,
.admin-card h2 {
  margin: 0;
  font-size: 1.1rem;
}

.admin-muted {
  color: var(--ink-muted);
  font-size: 0.85rem;
  margin: 0;
}

.admin-error {
  color: var(--danger, #e5484d);
  font-size: 0.85rem;
  margin: 0;
}

.user-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.user-row {
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  justify-content: space-between;
}

.user-email {
  font-weight: 600;
  overflow-wrap: anywhere;
}

.user-role {
  font-family: var(--font-mono, monospace);
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--ink-faint);
  border: 1px solid var(--line);
  border-radius: 999px;
  padding: 0.15rem 0.5rem;
}

.user-role.admin {
  color: var(--accent);
  border-color: var(--accent-dim);
}

.user-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.pwd-edit {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.pwd-edit input {
  flex: 1;
  min-width: 10rem;
}

.confirm-box {
  border: 1px solid var(--danger, #e5484d);
  border-radius: var(--radius);
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.confirm-box p {
  margin: 0;
  font-size: 0.85rem;
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

.btn-primary {
  background: var(--accent);
  color: var(--on-accent);
  border: none;
  border-radius: var(--radius);
  padding: 0.6rem 1rem;
  font-weight: 600;
  cursor: pointer;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-ghost {
  background: transparent;
  color: var(--ink);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 0.4rem 0.8rem;
  cursor: pointer;
}

.btn-danger {
  background: var(--danger, #e5484d);
  color: #fff;
  border: none;
  border-radius: var(--radius);
  padding: 0.4rem 0.8rem;
  cursor: pointer;
}

.btn-danger-ghost {
  background: transparent;
  color: var(--danger, #e5484d);
  border: 1px solid var(--danger, #e5484d);
  border-radius: var(--radius);
  padding: 0.4rem 0.8rem;
  cursor: pointer;
}
</style>
