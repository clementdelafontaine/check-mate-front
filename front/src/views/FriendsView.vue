<script setup>
import { ref, onMounted } from 'vue'
import { useFriendsStore } from '../stores/friends'
import { UserPlus, Check, X, Share2 } from 'lucide-vue-next'

const friends = useFriendsStore()
const newFriendUsername = ref('')
const error = ref('')
const busy = ref(false)

onMounted(() => {
  friends.init()
})

async function sendRequest() {
  error.value = ''
  busy.value = true
  try {
    await friends.sendRequest(newFriendUsername.value.trim())
    newFriendUsername.value = ''
  } catch (err) {
    error.value = err.message ?? 'Erreur'
  } finally {
    busy.value = false
  }
}

async function accept(friend) {
  await friends.acceptRequest(friend.id)
}

async function remove(friend) {
  await friends.removeFriend(friend.id)
}
</script>

<template>
  <div class="view">
    <div class="view-header">
      <h1 class="view-title font-display">Amis</h1>
    </div>

    <section class="block">
      <div class="block-head">
        <h2 class="section-label">Ajouter un ami</h2>
      </div>
      <form class="add-form" @submit.prevent="sendRequest">
        <input
          v-model="newFriendUsername"
          class="input"
          type="text"
          placeholder="Pseudo de l'utilisateur"
          autofocus
        />
        <button
          class="add-btn"
          type="submit"
          :disabled="busy || !newFriendUsername.trim()"
        >
          <UserPlus :size="15" />
          <span>Demander</span>
        </button>
      </form>
      <p class="hint">
        Envoyez une demande avec le pseudo de l'utilisateur. Une fois acceptée,
        vous pourrez partager des listes avec lui.
      </p>
      <p v-if="error" class="error">{{ error }}</p>
    </section>

    <section v-if="friends.incoming.length" class="block">
      <div class="block-head">
        <h2 class="section-label">Demandes reçues</h2>
        <span class="font-mono count">{{ friends.incoming.length }}</span>
      </div>
      <ul class="rows">
        <li v-for="friend in friends.incoming" :key="friend.id" class="row">
          <span class="row-name">{{ friend.username }}</span>
          <span class="row-actions">
            <button class="icon-btn" aria-label="Accepter" @click="accept(friend)">
              <Check :size="15" />
            </button>
            <button class="icon-btn danger" aria-label="Refuser" @click="remove(friend)">
              <X :size="15" />
            </button>
          </span>
        </li>
      </ul>
    </section>

    <section v-if="friends.outgoing.length" class="block">
      <div class="block-head">
        <h2 class="section-label">Demandes envoyées</h2>
        <span class="font-mono count">{{ friends.outgoing.length }}</span>
      </div>
      <ul class="rows">
        <li v-for="friend in friends.outgoing" :key="friend.id" class="row">
          <span class="row-name">{{ friend.username }}</span>
          <span class="row-meta font-mono">en attente</span>
          <button class="icon-btn danger" aria-label="Annuler" @click="remove(friend)">
            <X :size="15" />
          </button>
        </li>
      </ul>
    </section>

    <section class="block">
      <div class="block-head">
        <h2 class="section-label">Mes amis</h2>
        <span class="font-mono count">{{ friends.accepted.length }}</span>
      </div>
      <p v-if="!friends.accepted.length" class="empty">
        Aucun ami pour le moment. Ajoutez-en pour partager des listes !
      </p>
      <ul v-else class="rows">
        <li v-for="friend in friends.accepted" :key="friend.id" class="row">
          <span class="row-name">{{ friend.username }}</span>
          <button class="icon-btn danger" aria-label="Retirer" @click="remove(friend)">
            <X :size="15" />
          </button>
        </li>
      </ul>
    </section>

    <section class="block">
      <div class="block-head">
        <h2 class="section-label">Listes partagées avec moi</h2>
        <span class="font-mono count">{{ friends.sharedLists.length }}</span>
      </div>
      <p v-if="!friends.sharedLists.length" class="empty">
        Aucune liste partagée pour le moment.
      </p>
      <ul v-else class="rows">
        <li v-for="list in friends.sharedLists" :key="list.id" class="row">
          <span class="emoji">{{ list.emoji }}</span>
          <router-link class="row-name" :to="`/list/${list.id}`">
            {{ list.name }}
          </router-link>
          <span class="row-meta">de {{ list.ownerUsername }}</span>
          <Share2 :size="13" class="share-icon" />
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.block {
  border: 1px solid var(--line);
  border-radius: 1rem;
  background: var(--bg-1);
  padding: 1rem;
  margin-bottom: 1.2rem;
}

.block-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.block-head .section-label {
  margin: 0;
}

.count {
  font-size: 0.75rem;
  color: var(--ink-faint);
}

.add-form {
  display: flex;
  gap: 0.5rem;
}

.input {
  flex: 1;
  min-width: 0;
  padding: 0.6rem 0.75rem;
  border: 1px solid var(--line);
  border-radius: 0.7rem;
  background: var(--bg-2);
  color: var(--ink);
  outline: none;
  color-scheme: dark;
}

html[data-theme='light'] .input {
  color-scheme: light;
}

.input:focus {
  border-color: var(--accent-dim);
}

.add-btn {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.6rem 1rem;
  font-size: 0.85rem;
  font-weight: 700;
  border: 1px solid var(--accent-dim);
  border-radius: 0.7rem;
  color: var(--accent);
  background: var(--accent-deep);
}

.add-btn:disabled {
  opacity: 0.5;
}

.hint {
  margin: 0.55rem 0 0;
  font-size: 0.78rem;
  color: var(--ink-faint);
}

.error {
  margin: 0.55rem 0 0;
  font-size: 0.8rem;
  color: #ff6b6b;
}

.rows {
  list-style: none;
  margin: 0.4rem 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.row {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  padding: 0.45rem 0.6rem;
  border: 1px solid var(--line);
  border-radius: 0.7rem;
  background: var(--bg-2);
}

.row-name {
  flex: 1;
  min-width: 0;
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--ink);
  text-decoration: none;
  overflow-wrap: anywhere;
}

.row-meta {
  font-size: 0.72rem;
  color: var(--ink-faint);
}

.emoji {
  font-size: 1.1rem;
}

.share-icon {
  color: var(--ink-faint);
  flex-shrink: 0;
}

.row-actions {
  display: flex;
  gap: 0.25rem;
}

.icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 0.55rem;
  color: var(--ink-muted);
  flex-shrink: 0;
}

.icon-btn:active {
  background: var(--bg-1);
}

.icon-btn.danger {
  color: #ff6b6b;
}

.empty {
  margin: 0.2rem 0 0;
  font-size: 0.85rem;
  color: var(--ink-faint);
}
</style>
