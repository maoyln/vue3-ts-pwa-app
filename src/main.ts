import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './registerServiceWorker.ts'
import './style.css'

const app = createApp(App)

// 使用Pinia状态管理
app.use(createPinia())

// 使用Vue Router路由
app.use(router)

app.mount('#app')