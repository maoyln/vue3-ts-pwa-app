import { createApp } from 'vue'
import App from './App.vue'
import './registerServiceWorker.ts'

const app = createApp(App)
app.mount('#app')