import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useChecklistsStore } from './stores/checklists'
import './styles/main.css'

const pinia = createPinia()

pinia.subscribe(({ storeId }) => {
  if (storeId === 'checklists') {
    const store = useChecklistsStore()
    store.persist()
  }
})

createApp(App).use(pinia).use(router).mount('#app')
