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
          <a 
            href="#"
            class="nav-link"
            :class="{ active: route.path === '/' }"
            @click.prevent="handleNavClick('/', '首页', '🏠')"
          >
            <span class="nav-icon">🏠</span>
            <span class="nav-text">首页</span>
          </a>
        </li>
        <li class="nav-item">
          <a 
            href="#"
            class="nav-link"
            :class="{ active: route.path === '/weather' }"
            @click.prevent="handleNavClick('/weather', '天气预报', '🌤️')"
          >
            <span class="nav-icon">🌤️</span>
            <span class="nav-text">天气</span>
          </a>
        </li>
        <li class="nav-item">
          <a 
            href="#"
            class="nav-link"
            :class="{ active: route.path === '/news' }"
            @click.prevent="handleNavClick('/news', '新闻资讯', '📰')"
          >
            <span class="nav-icon">📰</span>
            <span class="nav-text">新闻</span>
          </a>
        </li>
        <li class="nav-item">
          <a 
            href="#"
            class="nav-link"
            :class="{ active: route.path === '/users' }"
            @click.prevent="handleNavClick('/users', '用户管理', '👥')"
          >
            <span class="nav-icon">👥</span>
            <span class="nav-text">用户</span>
          </a>
        </li>
        <li class="nav-item">
          <a 
            href="#"
            class="nav-link"
            :class="{ active: route.path === '/posts' }"
            @click.prevent="handleNavClick('/posts', '文章管理', '📝')"
          >
            <span class="nav-icon">📝</span>
            <span class="nav-text">文章</span>
          </a>
        </li>
        
        <li class="nav-item">
          <a 
            href="#"
            class="nav-link"
            :class="{ active: route.path === '/comments' }"
            @click.prevent="handleNavClick('/comments', '评论管理', '💬')"
          >
            <span class="nav-icon">💬</span>
            <span class="nav-text">评论</span>
          </a>
        </li>
        
        <li class="nav-item">
          <a 
            href="#"
            class="nav-link"
            :class="{ active: route.path === '/albums' }"
            @click.prevent="handleNavClick('/albums', '相册管理', '📸')"
          >
            <span class="nav-icon">📸</span>
            <span class="nav-text">相册</span>
          </a>
        </li>
        
        <li class="nav-item">
          <a 
            href="#"
            class="nav-link"
            :class="{ active: route.path === '/documents' }"
            @click.prevent="handleNavClick('/documents', '文档管理', '📄')"
          >
            <span class="nav-icon">📄</span>
            <span class="nav-text">文档</span>
          </a>
        </li>
        
        <li class="nav-item">
          <a 
            href="#"
            class="nav-link"
            :class="{ active: route.path === '/api-demo' }"
            @click.prevent="handleNavClick('/api-demo', 'API演示', '🚀')"
          >
            <span class="nav-icon">🚀</span>
            <span class="nav-text">API演示</span>
          </a>
        </li>
        
        <li class="nav-item">
          <a 
            href="#"
            class="nav-link"
            :class="{ active: route.path === '/tab-demo' }"
            @click.prevent="handleNavClick('/tab-demo', '多页签演示', '🗂️')"
          >
            <span class="nav-icon">🗂️</span>
            <span class="nav-text">多页签演示</span>
          </a>
        </li>
        
        <li class="nav-item">
          <a 
            href="#"
            class="nav-link"
            :class="{ active: route.path === '/pwa-dashboard' }"
            @click.prevent="handleNavClick('/pwa-dashboard', 'PWA控制面板', '📊')"
          >
            <span class="nav-icon">📊</span>
            <span class="nav-text">PWA控制面板</span>
          </a>
        </li>
        
        <li class="nav-item">
          <a 
            href="#"
            class="nav-link"
            :class="{ active: route.path === '/about' }"
            @click.prevent="handleNavClick('/about', '关于', 'ℹ️')"
          >
            <span class="nav-icon">ℹ️</span>
            <span class="nav-text">关于</span>
          </a>
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
import { useRoute, useRouter } from 'vue-router'
import { useTabManager } from '../composables/useTabManager'

// Vue Router
const router = useRouter()
const route = useRoute()

// 页签管理器
const { addTab } = useTabManager()

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

// 处理导航点击事件
const handleNavClick = (path: string, title: string, icon: string) => {
  closeMobileMenu()
  
  // 创建模拟路由对象
  const mockRoute = {
    path,
    name: title,
    meta: {
      title,
      icon
    }
  }
  
  // 添加到页签管理器
  addTab(mockRoute, { setActive: true })
  
  // 导航到对应路由
  router.push(path)
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
  background: #667eea;
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);
  border-radius: 0 0 24px 24px;
  padding: 20px 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 32px;
  position: relative;
  overflow: hidden;
}

.nav-menu::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="20" cy="20" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="80" cy="60" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="40" cy="90" r="1" fill="rgba(255,255,255,0.1)"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
  opacity: 0.3;
  pointer-events: none;
}

.nav-header {
  display: flex;
  align-items: center;
  gap: 16px;
}

.nav-logo {
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 700;
  color: white;
  font-size: 1.4rem;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.logo-icon {
  font-size: 1.8rem;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
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
  gap: 10px;
  padding: 14px 20px;
  text-decoration: none;
  color: rgba(255, 255, 255, 0.8);
  border-radius: 16px;
  transition: all 0.3s ease;
  font-weight: 500;
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.nav-link:hover {
  color: white;
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
  border-color: rgba(255, 255, 255, 0.3);
}

.nav-link.active {
  color: white;
  background: rgba(255, 255, 255, 0.25);
  font-weight: 600;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
  border-color: rgba(255, 255, 255, 0.4);
}

.nav-link.active::before {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 30px;
  height: 3px;
  background: linear-gradient(90deg, #ffffff, #f0f9ff);
  border-radius: 2px;
  box-shadow: 0 2px 8px rgba(255, 255, 255, 0.5);
}

.nav-icon {
  font-size: 1.3rem;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
}

.nav-text {
  font-size: 1rem;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

/* PWA状态指示器 */
.pwa-status {
  display: flex;
  align-items: center;
  gap: 20px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.9);
  background: rgba(255, 255, 255, 0.1);
  padding: 8px 12px;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
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
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 1001;
    background: rgba(255, 255, 255, 0.9);
    border-radius: 8px;
    backdrop-filter: blur(10px);
  }

  .nav-menu {
    position: fixed;
    top: 0;
    right: -100%;
    width: 320px;
    height: 100vh;
    flex-direction: column;
    justify-content: flex-start;
    align-items: stretch;
    padding: 24px;
    border-radius: 24px 0 0 24px;
    box-shadow: -10px 0 30px rgba(102, 126, 234, 0.3);
    transition: right 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    overflow-y: auto;
    z-index: 1000;
  }

  .nav-menu.open {
    right: 0;
  }

  .nav-menu.open ~ .nav-overlay {
    display: block;
  }

  .nav-header {
    justify-content: space-between;
    margin-bottom: 32px;
    padding-bottom: 20px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  }

  .mobile-close-btn {
    display: flex;
    color: white;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 50%;
    width: 40px;
    height: 40px;
  }

  .nav-list {
    flex-direction: column;
    gap: 12px;
    margin-bottom: 32px;
  }

  .nav-link {
    padding: 18px 24px;
    border-radius: 16px;
    font-size: 1.1rem;
    justify-content: flex-start;
  }

  .nav-link.active::before {
    display: none;
  }

  .nav-link.active {
    background: rgba(255, 255, 255, 0.3);
    color: white;
    box-shadow: 0 4px 20px rgba(255, 255, 255, 0.2);
  }

  .pwa-status {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
    padding-top: 20px;
    border-top: 1px solid rgba(255, 255, 255, 0.2);
  }

  .status-item {
    justify-content: center;
    padding: 14px;
    background: rgba(255, 255, 255, 0.15);
    border-radius: 12px;
    border-color: rgba(255, 255, 255, 0.3);
  }

  .nav-overlay {
    display: none;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(4px);
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
