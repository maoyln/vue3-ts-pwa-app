import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './registerServiceWorker.ts'
import './style.css'
import { dataPrecacheService } from './utils/dataPrecacheService'

const app = createApp(App)

// 使用Pinia状态管理
app.use(createPinia())

// 使用Vue Router路由
app.use(router)

// 初始化应用
const initializeApp = async () => {
  try {
    console.log('🚀 应用初始化开始...')
    
    // 显示加载指示器
    const loadingElement = document.getElementById('app')
    if (loadingElement) {
      loadingElement.innerHTML = `
        <div style="
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          color: white;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          z-index: 9999;
        ">
          <div style="
            width: 60px;
            height: 60px;
            border: 4px solid rgba(255,255,255,0.3);
            border-top: 4px solid white;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 20px;
          "></div>
          <h2 style="margin: 0 0 10px 0; font-size: 24px; font-weight: 600;">初始化应用</h2>
          <p id="init-status" style="margin: 0; opacity: 0.8; font-size: 16px;">正在加载...</p>
          <style>
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          </style>
        </div>
      `
    }
    
    const updateStatus = (message: string) => {
      const statusElement = document.getElementById('init-status')
      if (statusElement) {
        statusElement.textContent = message
      }
    }
    
    // 初始化数据预缓存服务
    updateStatus('正在初始化数据缓存...')
    await dataPrecacheService.init()
    
    updateStatus('应用初始化完成')
    
    // 延迟一点时间让用户看到完成状态
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // 挂载Vue应用
    app.mount('#app')
    
    console.log('✅ 应用初始化完成')
    
  } catch (error) {
    console.error('❌ 应用初始化失败:', error)
    
    // 即使初始化失败也要挂载应用
    app.mount('#app')
    
    // 显示错误提示
    setTimeout(() => {
      console.warn('⚠️ 数据预缓存失败，但应用仍可正常使用')
    }, 1000)
  }
}

// 启动应用初始化
initializeApp()