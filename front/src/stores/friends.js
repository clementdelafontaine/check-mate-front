import { defineStore } from 'pinia'
import { api } from '../services/api'
import { useChecklistsStore } from './checklists'

const POLL_INTERVAL_MS = 5000

export const useFriendsStore = defineStore('friends', {
  state: () => ({
    friends: [],
    sharedLists: [],
    loaded: false,
    polling: false,
    versions: {}
  }),
  getters: {
    accepted: (state) => state.friends.filter((f) => f.status === 'accepted'),
    incoming: (state) => state.friends.filter((f) => f.status === 'pending' && f.direction === 'incoming'),
    outgoing: (state) => state.friends.filter((f) => f.status === 'pending' && f.direction === 'outgoing')
  },
  actions: {
    async refresh() {
      if (!api.useApi) return
      const [friends, sharedLists] = await Promise.all([
        api.fetchFriends(),
        api.fetchSharedLists()
      ])
      this.friends = friends
      this.sharedLists = sharedLists
      this.loaded = true
    },
    async sendRequest(username) {
      await api.sendFriendRequest(username)
      await this.refresh()
    },
    async acceptRequest(id) {
      await api.acceptFriendRequest(id)
      await this.refresh()
    },
    async removeFriend(id) {
      await api.removeFriend(id)
      await this.refresh()
      const lists = useChecklistsStore()
      await lists.refresh()
    },
    async shareList(listId, userId) {
      await api.shareList(listId, userId)
      await this.refresh()
    },
    async unshareList(listId, userId) {
      await api.unshareList(listId, userId)
      await this.refresh()
    },
    async pollSharedLists() {
      if (!api.useApi || !this.loaded) return
      try {
        const versions = await api.fetchListVersions()
        const known = this.versions
        const changed = versions.filter(
          (v) => known[v.id] && known[v.id] !== v.updatedAt
        )
        this.versions = Object.fromEntries(versions.map((v) => [v.id, v.updatedAt]))
        if (!changed.length) return
        const checklists = useChecklistsStore()
        await checklists.refresh()
        await this.refresh()
      } catch {
        /* ignore polling errors */
      }
    },
    startPolling() {
      if (this.polling || !api.useApi) return
      this.polling = true
      const tick = async () => {
        if (!this.polling) return
        await this.pollSharedLists()
        setTimeout(tick, POLL_INTERVAL_MS)
      }
      setTimeout(tick, POLL_INTERVAL_MS)
    },
    stopPolling() {
      this.polling = false
    },
    async init() {
      if (!api.useApi) return
      await this.refresh()
      const versions = await api.fetchListVersions()
      this.versions = Object.fromEntries(versions.map((v) => [v.id, v.updatedAt]))
      this.startPolling()
    }
  }
})
