import { defineStore } from 'pinia'
import { authApi } from '../services/authApi'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    initialized: false
  }),
  getters: {
    isAuthenticated: (state) => !!state.user,
    isAdmin: (state) => state.user?.role === 'admin'
  },
  actions: {
    async init() {
      if (import.meta.env.VITE_USE_API !== 'true') {
        this.user = { id: 'local', email: 'local@checkmate', role: 'admin' }
        this.initialized = true
        return
      }
      try {
        this.user = await authApi.me()
      } catch {
        this.user = null
      } finally {
        this.initialized = true
      }
    },
    async login(email, password) {
      if (import.meta.env.VITE_USE_API !== 'true') {
        this.user = { id: 'local', email, role: 'admin' }
        return this.user
      }
      this.user = await authApi.login(email, password)
      return this.user
    },
    async logout() {
      try {
        await authApi.logout()
      } finally {
        this.user = null
      }
    }
  }
})
