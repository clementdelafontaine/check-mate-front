import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import TodayView from '../views/TodayView.vue'

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
    }
  ]
})

export default router
