import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import TodayView from '../views/TodayView.vue'
import { useAuthStore } from '../stores/auth'
import { useFriendsStore } from '../stores/friends'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/today', name: 'today', component: TodayView },
    {
      path: '/lists',
      name: 'lists',
      component: () => import('../views/ListsView.vue')
    },
    {
      path: '/calendar',
      name: 'calendar',
      component: () => import('../views/CalendarView.vue')
    },
    {
      path: '/recipes',
      name: 'recipes',
      component: () => import('../views/RecipesView.vue')
    },
    {
      path: '/recipe/:id',
      name: 'recipe',
      component: () => import('../views/RecipeView.vue')
    },
    {
      path: '/templates',
      name: 'templates',
      component: () => import('../views/TemplatesView.vue')
    },
    {
      path: '/list/:id',
      name: 'list',
      component: () => import('../views/ListView.vue')
    },
    {
      path: '/template/:id',
      name: 'template',
      component: () => import('../views/TemplateView.vue')
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
      meta: { public: true }
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('../views/SettingsView.vue')
    },
    {
      path: '/friends',
      name: 'friends',
      component: () => import('../views/FriendsView.vue')
    },
    {
      path: '/admin',
      name: 'admin',
      component: () => import('../views/AdminView.vue'),
      meta: { admin: true }
    }
  ]
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  if (!auth.initialized) {
    await auth.init()
  }
  if (auth.isAuthenticated) {
    const friends = useFriendsStore()
    if (!friends.loaded) {
      friends.init().catch(() => {})
    }
  }
  if (!to.meta.public && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (to.meta.admin && !auth.isAdmin) {
    return { name: 'home' }
  }
})

export default router
