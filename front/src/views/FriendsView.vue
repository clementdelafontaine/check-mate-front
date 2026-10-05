<script setup>
import { ref, onMounted } from 'vue'
import { useFriendsStore } from '../stores/friends'
import { useAuthStore } from '../stores/auth'
import { UserPlus, UserMinus, Check, X, Users } from 'lucide-vue-next'

const friends = useFriendsStore()
const auth = useAuthStore()
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

    <section class="panel-card">
      <h2><Users :size="16" /> Ajouter un ami</h2>
      <p class="muted">
        Envoyez une demande avec le pseudo de l'utilisateur. Une fois acceptée,
        vous pourrez partager des listes avec lui.
      </p>
      <form class="add-friend" @submit.prevent="sendRequest">
        <input
          v-model="newFriendUsername"
          type="text"
          placeholder="Pseudo de l'utilisateur"
        />
        <button class="btn-primary" type="submit" :disabled="busy || !newFriendUsername.trim()">
          <UserPlus :size="16" /> Demander
        </button>
      </form>
      <p v-if="error" class="error">{{ error }}</p>
    </section>

    <section v-if="friends.incoming.length" class="panel-card">
      <h2>Demandes reçues</h2>
      <ul class="friend-list">
        <li v-for="friend in friends.incoming" :key="friend.id" class="friend-row">
          <span class="friend-name">{{ friend.username }}</span>
          <span class="friend-actions">
            <button class="btn-ghost" @click="accept(friend)"><Check :size="16" /> Accepter</button>
            <button class="btn-danger-ghost" @click="remove(friend)"><X :size="16" /> Refuser</button>
          </span>
        </li>
      </ul>
    </section>

    <section v-if="friends.outgoing.length" class="panel-card">
      <h2>Demandes envoyées</h2>
      <ul class="friend-list">
        <li v-for="friend in friends.outgoing" :key="friend.id" class="friend-row">
          <span class="friend-name">{{ friend.username }}</span>
          <span class="pending">en attente</span>
          <button class="btn-danger-ghost" @click="remove(friend)">
            <UserMinus :size="16" /> Annuler
          </button>
        </li>
      </ul>
    </section>

    <section class="panel-card">
      <h2>Mes amis</h2>
      <p v-if="!friends.accepted.length" class="muted">
        Aucun ami pour le moment. Ajoutez-en pour partager des listes !
      </p>
      <ul v-else class="friend-list">
        <li v-for="friend in friends.accepted" :key="friend.id" class="friend-row">
          <span class="friend-name">{{ friend.username }}</span>
          <button class="btn-danger-ghost" @click="remove(friend)">
            <UserMinus :size="16" /> Retirer
          </button>
        </li>
      </ul>
    </section>

    <section class="panel-card">
      <h2>Listes partagées avec moi</h2>
      <p v-if="!friends.sharedLists.length" class="muted">
        Aucune liste partagée pour le moment.
      </p>
      <ul v-else class="friend-list">
        <li v-for="list in friends.sharedLists" :key="list.id" class="friend-row">
          <span class="friend-name">
            {{ list.emoji }} {{ list.name }}
            <span class="owner">de {{ list.ownerUsername }}</span>
          </span>
          <router-link class="btn-ghost" :to="`/list/${list.id}`">Ouvrir</router-link>
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.add-friend {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.add-friend input {
  flex: 1;
  min-width: 12rem;
}
.friend-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.friend-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.friend-name {
  font-weight: 600;
  flex: 1;
  overflow-wrap: anywhere;
}
.owner {
  font-weight: 400;
  color: var(--ink-muted);
  font-size: 0.8rem;
}
.pending {
  font-family: var(--font-mono, monospace);
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--ink-faint);
}
.friend-actions {
  display: flex;
  gap: 0.5rem;
}
.muted {
  color: var(--ink-muted);
  font-size: 0.85rem;
}
.error {
  color: #e5484d;
  font-size: 0.85rem;
}
h2 {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-top: 0;
}
</style>
