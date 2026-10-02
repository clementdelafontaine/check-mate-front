import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: HomeView },
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
