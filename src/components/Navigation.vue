<template>
  <nav class="navigation">
    <!-- 移动端菜单按钮 -->
    <button 
      class="mobile-menu-btn" 
      @click="toggleMobileMenu"
      :class="{ active: isMobileMenuOpen }"
    >
      <span></span>
      <span></span>
      <span></span>
    </button>

    <!-- 导航菜单 -->
    <div class="nav-menu" :class="{ open: isMobileMenuOpen }">
      <div class="nav-header">
        <div class="nav-logo">
          <span class="logo-icon">🚀</span>
          <span class="logo-text">Vue3 PWA</span>
        </div>
        <button class="mobile-close-btn" @click="closeMobileMenu">×</button>
      </div>

      <ul class="nav-list">
        <li class="nav-item">
          <router-link 
            to="/" 
            class="nav-link"
            :class="{ active: route.path === '/' }"
            @click="closeMobileMenu"
          >
            <span class="nav-icon">🏠</span>
            <span class="nav-text">首页</span>
          </router-link>
        </li>
        <li class="nav-item">
          <router-link 
            to="/weather" 
            class="nav-link"
            :class="{ active: route.path === '/weather' }"
            @click="closeMobileMenu"
          >
            <span class="nav-icon">🌤️</span>
            <span class="nav-text">天气</span>
          </router-link>
        </li>
        <li class="nav-item">
          <router-link 
            to="/news" 
            class="nav-link"
            :class="{ active: route.path === '/news' }"
            @click="closeMobileMenu"
          >
            <span class="nav-icon">📰</span>
            <span class="nav-text">新闻</span>
          </router-link>
        </li>
        <li class="nav-item">
          <router-link 
            to="/users" 
            class="nav-link"
            :class="{ active: route.path === '/users' }"
            @click="closeMobileMenu"
          >
            <span class="nav-icon">👥</span>
            <span class="nav-text">用户</span>
          </router-link>
        </li>
        <li class="nav-item">
          <router-link 
            to="/posts" 
            class="nav-link"
            :class="{ active: route.path === '/posts' }"
            @click="closeMobileMenu"
          >
            <span class="nav-icon">📝</span>
            <span class="nav-text">文章</span>
          </router-link>
        </li>
        
        <li class="nav-item">
          <router-link 
            to="/comments" 
            class="nav-link"
            :class="{ active: route.path === '/comments' }"
            @click="closeMobileMenu"
          >
            <span class="nav-icon">💬</span>
            <span class="nav-text">评论</span>
          </router-link>
        </li>
        
        <li class="nav-item">
          <router-link 
            to="/albums" 
            class="nav-link"
            :class="{ active: route.path === '/albums' }"
            @click="closeMobileMenu"
          >
            <span class="nav-icon">📸</span>
            <span class="nav-text">相册</span>
          </router-link>
        </li>
        
        <li class="nav-item">
          <router-link 
            to="/documents" 
            class="nav-link"
            :class="{ active: route.path === '/documents' }"
            @click="closeMobileMenu"
          >
            <span class="nav-icon">📄</span>
            <span class="nav-text">文档</span>
          </router-link>
        </li>
        
        <li class="nav-item">
          <router-link 
            to="/api-demo" 
            class="nav-link"
            :class="{ active: route.path === '/api-demo' }"
            @click="closeMobileMenu"
          >
            <span class="nav-icon">🚀</span>
            <span class="nav-text">API演示</span>
          </router-link>
        </li>
        
        <li class="nav-item">
          <router-link 
            to="/pwa-dashboard" 
            class="nav-link"
            :class="{ active: route.path === '/pwa-dashboard' }"
            @click="closeMobileMenu"
          >
            <span class="nav-icon">📊</span>
            <span class="nav-text">PWA控制面板</span>
          </router-link>
        </li>
        
        <li class="nav-item">
          <router-link 
            to="/about" 
            class="nav-link"
            :class="{ active: route.path === '/about' }"
            @click="closeMobileMenu"
          >
            <span class="nav-icon">ℹ️</span>
            <span class="nav-text">关于</span>
          </router-link>
        </li>
      </ul>

      <!-- PWA状态指示器 -->
      <div class="pwa-status">
        <div class="status-item">
          <span class="status-icon" :class="{ online: isOnline, offline: !isOnline }">
            {{ isOnline ? '🟢' : '🔴' }}
          </span>
          <span class="status-text">{{ isOnline ? '在线' : '离线' }}</span>
        </div>
        <div v-if="isInstalled" class="status-item">
          <span class="status-icon">📱</span>
          <span class="status-text">已安装</span>
        </div>
      </div>
    </div>

    <!-- 遮罩层 -->
    <div 
      v-if="isMobileMenuOpen" 
      class="nav-overlay" 
      @click="closeMobileMenu"
    ></div>
  </nav>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'

// Vue Router
// const router = useRouter()
const route = useRoute()

// 响应式数据
const isMobileMenuOpen = ref(false)
const isOnline = ref(navigator.onLine)
const isInstalled = ref(false)

// 切换移动端菜单
const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
  // 防止背景滚动
  if (isMobileMenuOpen.value) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = 'auto'
  }
}

// 关闭移动端菜单
const closeMobileMenu = () => {
  isMobileMenuOpen.value = false
  document.body.style.overflow = 'auto'
}

// 监听网络状态
const handleOnline = () => {
  isOnline.value = true
}

const handleOffline = () => {
  isOnline.value = false
}

// 检测PWA安装状态
const checkInstallStatus = () => {
  // 检测是否在独立模式下运行（已安装）
  if (window.matchMedia('(display-mode: standalone)').matches) {
    isInstalled.value = true
  }
  
  // 检测是否在PWA环境中
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(() => {
      // Service Worker已就绪，可能已安装
    })
  }
}

// 组件挂载
onMounted(() => {
  // 监听网络状态变化
  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)
  
  // 检查安装状态
  checkInstallStatus()
  
  // 监听窗口大小变化，自动关闭移动端菜单
  const handleResize = () => {
    if (window.innerWidth > 768 && isMobileMenuOpen.value) {
      closeMobileMenu()
    }
  }
  window.addEventListener('resize', handleResize)
})

// 组件卸载
onUnmounted(() => {
  window.removeEventListener('online', handleOnline)
  window.removeEventListener('offline', handleOffline)
  document.body.style.overflow = 'auto'
})
</script>

<style scoped>
.navigation {
  position: relative;
  z-index: 100;
}

/* 移动端菜单按钮 */
.mobile-menu-btn {
  display: none;
  flex-direction: column;
  justify-content: space-around;
  width: 30px;
  height: 30px;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
  z-index: 1001;
  position: fixed;
  top: 20px;
  left: 20px;
  transition: all 0.3s ease;
}

.mobile-menu-btn span {
  width: 100%;
  height: 3px;
  background: #374151;
  border-radius: 2px;
  transition: all 0.3s ease;
  transform-origin: center;
}

.mobile-menu-btn.active span:nth-child(1) {
  transform: rotate(45deg) translate(7px, 7px);
}

.mobile-menu-btn.active span:nth-child(2) {
  opacity: 0;
}

.mobile-menu-btn.active span:nth-child(3) {
  transform: rotate(-45deg) translate(7px, -7px);
}

/* 导航菜单 */
.nav-menu {
  background: white;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  border-radius: 0 0 16px 16px;
  padding: 16px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}

.nav-header {
  display: flex;
  align-items: center;
  gap: 16px;
}

.nav-logo {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #1f2937;
  font-size: 1.2rem;
}

.logo-icon {
  font-size: 1.5rem;
}

.mobile-close-btn {
  display: none;
  background: none;
  border: none;
  font-size: 2rem;
  color: #6b7280;
  cursor: pointer;
  padding: 0;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-list {
  display: flex;
  list-style: none;
  margin: 0;
  padding: 0;
  gap: 8px;
}

.nav-item {
  position: relative;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  text-decoration: none;
  color: #6b7280;
  border-radius: 12px;
  transition: all 0.3s ease;
  font-weight: 500;
  position: relative;
  overflow: hidden;
}

.nav-link:hover {
  color: #3b82f6;
  background: #eff6ff;
  transform: translateY(-2px);
}

.nav-link.active {
  color: #3b82f6;
  background: #dbeafe;
  font-weight: 600;
}

.nav-link.active::before {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 20px;
  height: 3px;
  background: #3b82f6;
  border-radius: 2px;
}

.nav-icon {
  font-size: 1.2rem;
}

.nav-text {
  font-size: 0.95rem;
}

/* PWA状态指示器 */
.pwa-status {
  display: flex;
  align-items: center;
  gap: 16px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.875rem;
  color: #6b7280;
}

.status-icon {
  font-size: 0.75rem;
}

.status-icon.online {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

/* 遮罩层 */
.nav-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
  display: none;
}

/* 移动端样式 */
@media (max-width: 768px) {
  .mobile-menu-btn {
    display: flex;
  }

  .nav-menu {
    position: fixed;
    top: 0;
    left: -100%;
    width: 280px;
    height: 100vh;
    flex-direction: column;
    justify-content: flex-start;
    align-items: stretch;
    padding: 24px;
    border-radius: 0;
    box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
    transition: left 0.3s ease;
    overflow-y: auto;
    z-index: 1000;
  }

  .nav-menu.open {
    left: 0;
  }

  .nav-menu.open ~ .nav-overlay {
    display: block;
  }

  .nav-header {
    justify-content: space-between;
    margin-bottom: 32px;
    padding-bottom: 16px;
    border-bottom: 1px solid #e5e7eb;
  }

  .mobile-close-btn {
    display: flex;
  }

  .nav-list {
    flex-direction: column;
    gap: 8px;
    margin-bottom: 32px;
  }

  .nav-link {
    padding: 16px 20px;
    border-radius: 12px;
    font-size: 1rem;
  }

  .nav-link.active::before {
    display: none;
  }

  .nav-link.active {
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
    color: white;
  }

  .pwa-status {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
    padding-top: 16px;
    border-top: 1px solid #e5e7eb;
  }

  .status-item {
    justify-content: center;
    padding: 12px;
    background: #f8fafc;
    border-radius: 8px;
  }

  .nav-overlay {
    display: none;
  }

  .nav-menu.open ~ .nav-overlay {
    display: block;
  }
}

/* 平板端样式 */
@media (min-width: 769px) and (max-width: 1024px) {
  .nav-menu {
    padding: 16px 20px;
    gap: 16px;
  }

  .nav-list {
    gap: 4px;
  }

  .nav-link {
    padding: 10px 14px;
  }

  .nav-text {
    font-size: 0.9rem;
  }
}

/* 大屏幕样式 */
@media (min-width: 1200px) {
  .nav-menu {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px 32px;
  }

  .nav-list {
    gap: 12px;
  }

  .nav-link {
    padding: 14px 20px;
  }
}

/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
  .nav-menu {
    background: #1f2937;
    color: #f9fafb;
  }

  .nav-logo {
    color: #f9fafb;
  }

  .nav-link {
    color: #d1d5db;
  }

  .nav-link:hover {
    color: #60a5fa;
    background: #374151;
  }

  .nav-link.active {
    color: #60a5fa;
    background: #1e40af;
  }

  .mobile-menu-btn span {
    background: #f9fafb;
  }

  .status-item {
    color: #d1d5db;
  }

  @media (max-width: 768px) {
    .nav-header {
      border-bottom-color: #374151;
    }

    .pwa-status {
      border-top-color: #374151;
    }

    .status-item {
      background: #374151;
    }
  }
}

/* 动画效果 */
.nav-link {
  position: relative;
  overflow: hidden;
}

.nav-link::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.1), transparent);
  transition: left 0.5s ease;
}

.nav-link:hover::after {
  left: 100%;
}

/* 无障碍支持 */
.nav-link:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

.mobile-menu-btn:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

/* 减少动画（用户偏好） */
@media (prefers-reduced-motion: reduce) {
  .nav-link,
  .mobile-menu-btn span,
  .nav-menu {
    transition: none;
  }

  .status-icon.online {
    animation: none;
  }

  .nav-link::after {
    display: none;
  }
}
</style>
