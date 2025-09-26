<script setup lang="ts">
import { onMounted } from 'vue'
import Navigation from './components/Navigation.vue'
import TabManager from './components/TabManager.vue'
import PWAUpdatePrompt from './components/PWAUpdatePrompt.vue'
import SmartInstallPrompt from './components/SmartInstallPrompt.vue'
import OfflineManager from './components/OfflineManager.vue'
import PerformanceMonitor from './components/PerformanceMonitor.vue'
import OfflineSyncStatus from './components/OfflineSyncStatus.vue'
import { useTabManager } from './composables/useTabManager'

// 页签管理器
const { initializeHomeTabs } = useTabManager()

// 初始化应用
onMounted(() => {
  console.log('Vue3 PWA应用已启动')
  
  // 初始化首页页签
  initializeHomeTabs({
    path: '/',
    name: '首页',
    meta: {
      title: '首页',
      icon: '🏠'
    }
  })
  
  // 注册Service Worker更新监听
  document.addEventListener('swUpdated', () => {
    console.log('检测到Service Worker更新')
    // 这里可以显示更新提示
  })
})
</script>

<template>
  <div id="app" class="app">
    <!-- 导航栏 -->
    <Navigation />
    
    <!-- 页签管理器 - 放在导航栏下方 -->
    <TabManager />
    
    <!-- PWA 增强组件 -->
    <SmartInstallPrompt />
    <OfflineManager />
    <PerformanceMonitor />
    <OfflineSyncStatus />
    
    <!-- PWA更新提示 -->
    <PWAUpdatePrompt />
    
    <!-- 页脚 -->
    <footer class="app-footer">
      <div class="footer-content">
        <p>&copy; 2024 Vue3 PWA Demo. 使用 Vue 3 + TypeScript + Vite 构建</p>
        <div class="footer-links">
          <a href="https://vuejs.org" target="_blank" rel="noopener noreferrer">Vue 3</a>
          <a href="https://vitejs.dev" target="_blank" rel="noopener noreferrer">Vite</a>
          <a href="https://pwa.dev" target="_blank" rel="noopener noreferrer">PWA</a>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f8fafc;
}

.main-content {
  flex: 1;
  padding-top: 0;
  min-height: calc(100vh - 120px);
}

/* 页面切换动画 */
.page-enter-active,
.page-leave-active {
  transition: all 0.3s ease;
}

.page-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.page-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

/* 页脚样式 */
.app-footer {
  background: white;
  border-top: 1px solid #e5e7eb;
  padding: 24px 0;
  margin-top: auto;
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.footer-content p {
  color: #6b7280;
  margin: 0;
  font-size: 0.9rem;
}

.footer-links {
  display: flex;
  gap: 20px;
}

.footer-links a {
  color: #3b82f6;
  text-decoration: none;
  font-size: 0.9rem;
  transition: color 0.3s ease;
}

.footer-links a:hover {
  color: #1d4ed8;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .main-content {
    padding-top: 0; /* 页签管理器已在顶部 */
  }
  
  .footer-content {
    flex-direction: column;
    text-align: center;
    gap: 12px;
  }
  
  .footer-links {
    gap: 16px;
  }
}

/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
  .app {
    background: #111827;
  }
  
  .app-footer {
    background: #1f2937;
    border-top-color: #374151;
  }
  
  .footer-content p {
    color: #d1d5db;
  }
  
  .footer-links a {
    color: #60a5fa;
  }
  
  .footer-links a:hover {
    color: #93c5fd;
  }
}

/* 滚动行为优化 */
@media (prefers-reduced-motion: no-preference) {
  html {
    scroll-behavior: smooth;
  }
}

/* 无障碍支持 */
.footer-links a:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
  border-radius: 4px;
}

/* 打印样式 */
@media print {
  .app-footer {
    display: none;
  }
  
  .main-content {
    padding-top: 0;
  }
}
</style>
