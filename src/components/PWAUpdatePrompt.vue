<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { triggerUpdate } from '../registerServiceWorker'

// 响应式数据
const showUpdatePrompt = ref(false)
const showInstallPrompt = ref(false)
const isUpdating = ref(false)
const updateProgress = ref(0)
const registration = ref<ServiceWorkerRegistration | null>(null)

// 更新应用
const updateApp = async () => {
  if (!registration.value) return
  
  isUpdating.value = true
  updateProgress.value = 0
  
  try {
    // 模拟更新进度
    const progressInterval = setInterval(() => {
      updateProgress.value += 10
      if (updateProgress.value >= 90) {
        clearInterval(progressInterval)
      }
    }, 100)
    
    // 触发更新
    const success = await triggerUpdate()
    
    clearInterval(progressInterval)
    updateProgress.value = 100
    
    if (success) {
      setTimeout(() => {
        showUpdatePrompt.value = false
        isUpdating.value = false
      }, 500)
    } else {
      throw new Error('更新失败')
    }
    
  } catch (error) {
    console.error('更新失败:', error)
    isUpdating.value = false
    updateProgress.value = 0
    
    // 显示错误提示
    alert('更新失败，请刷新页面重试')
  }
}

// 关闭更新提示
const dismissUpdate = () => {
  showUpdatePrompt.value = false
  // 可以设置一个延迟，稍后再提醒
  setTimeout(() => {
    if (registration.value) {
      showUpdatePrompt.value = true
    }
  }, 30 * 60 * 1000) // 30分钟后再提醒
}

// 安装应用
const installApp = async () => {
  try {
    const { triggerInstallPrompt } = await import('../registerServiceWorker')
    const success = await triggerInstallPrompt()
    
    if (success) {
      showInstallPrompt.value = false
    }
  } catch (error) {
    console.error('安装失败:', error)
  }
}

// 关闭安装提示
const dismissInstall = () => {
  showInstallPrompt.value = false
  // 记住用户的选择
  localStorage.setItem('installPromptDismissed', Date.now().toString())
}

// 检查是否应该显示安装提示
const shouldShowInstallPrompt = () => {
  const dismissed = localStorage.getItem('installPromptDismissed')
  if (!dismissed) return true
  
  // 如果用户之前拒绝了，7天后再次显示
  const dismissedTime = parseInt(dismissed)
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  
  return dismissedTime < sevenDaysAgo
}

// 事件监听器
const handleUpdateAvailable = (event: CustomEvent) => {
  console.log('收到更新可用事件:', event.detail)
  registration.value = event.detail.registration
  showUpdatePrompt.value = true
}

const handleInstallPrompt = (event: CustomEvent) => {
  console.log('收到安装提示事件:', event.detail)
  if (shouldShowInstallPrompt()) {
    showInstallPrompt.value = true
  }
}

const handleAppInstalled = () => {
  console.log('应用已安装')
  showInstallPrompt.value = false
  localStorage.removeItem('installPromptDismissed')
}

const handleControllerChange = () => {
  console.log('Service Worker控制器已更改，准备刷新页面')
  // 延迟刷新，给用户一点时间看到更新完成的提示
  setTimeout(() => {
    window.location.reload()
  }, 1000)
}

// 组件挂载
onMounted(() => {
  // 监听Service Worker相关事件
  document.addEventListener('swUpdateAvailable', handleUpdateAvailable as EventListener)
  document.addEventListener('appInstallPrompt', handleInstallPrompt as EventListener)
  document.addEventListener('appInstalled', handleAppInstalled)
  
  // 监听Service Worker控制器变化
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange)
  }
  
  // 检查是否有待处理的更新
  const updateInfo = localStorage.getItem('swUpdateInfo')
  if (updateInfo) {
    showUpdatePrompt.value = true
  }
})

// 组件卸载
onUnmounted(() => {
  document.removeEventListener('swUpdateAvailable', handleUpdateAvailable as EventListener)
  document.removeEventListener('appInstallPrompt', handleInstallPrompt as EventListener)
  document.removeEventListener('appInstalled', handleAppInstalled)
  
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange)
  }
})
</script>

<template>
  <!-- 更新提示 -->
  <Transition name="slide-up" appear>
    <div v-if="showUpdatePrompt" class="pwa-prompt update-prompt">
      <div class="prompt-content">
        <div class="prompt-header">
          <div class="prompt-icon update-icon">🔄</div>
          <div class="prompt-info">
            <h3>新版本可用!</h3>
            <p>发现应用更新，包含新功能和改进</p>
          </div>
          <button 
            v-if="!isUpdating" 
            @click="dismissUpdate" 
            class="close-btn"
            aria-label="稍后提醒"
          >
            ×
          </button>
        </div>
        
        <!-- 更新进度 -->
        <div v-if="isUpdating" class="update-progress">
          <div class="progress-bar">
            <div 
              class="progress-fill" 
              :style="{ width: updateProgress + '%' }"
            ></div>
          </div>
          <div class="progress-text">更新中... {{ updateProgress }}%</div>
        </div>
        
        <!-- 操作按钮 -->
        <div v-if="!isUpdating" class="prompt-actions">
          <button @click="dismissUpdate" class="btn btn-secondary">
            稍后更新
          </button>
          <button @click="updateApp" class="btn btn-primary">
            立即更新
          </button>
        </div>
      </div>
    </div>
  </Transition>

  <!-- 安装提示 -->
  <Transition name="slide-up" appear>
    <div v-if="showInstallPrompt" class="pwa-prompt install-prompt">
      <div class="prompt-content">
        <div class="prompt-header">
          <div class="prompt-icon install-icon">📱</div>
          <div class="prompt-info">
            <h3>安装应用</h3>
            <p>将此应用安装到您的设备，获得更好的体验</p>
          </div>
          <button @click="dismissInstall" class="close-btn" aria-label="关闭">
            ×
          </button>
        </div>
        
        <!-- 安装优势 -->
        <div class="install-benefits">
          <div class="benefit-item">
            <span class="benefit-icon">⚡</span>
            <span class="benefit-text">快速启动</span>
          </div>
          <div class="benefit-item">
            <span class="benefit-icon">📡</span>
            <span class="benefit-text">离线访问</span>
          </div>
          <div class="benefit-item">
            <span class="benefit-icon">🔔</span>
            <span class="benefit-text">推送通知</span>
          </div>
        </div>
        
        <!-- 操作按钮 -->
        <div class="prompt-actions">
          <button @click="dismissInstall" class="btn btn-secondary">
            暂不安装
          </button>
          <button @click="installApp" class="btn btn-primary">
            立即安装
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
/* PWA提示框基础样式 */
.pwa-prompt {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 9999;
  max-width: 380px;
  min-width: 320px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  border: 1px solid rgba(0, 0, 0, 0.08);
  overflow: hidden;
  backdrop-filter: blur(20px);
}

.prompt-content {
  padding: 24px;
}

/* 提示框头部 */
.prompt-header {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 20px;
}

.prompt-icon {
  font-size: 2.5rem;
  flex-shrink: 0;
  line-height: 1;
}

.update-icon {
  animation: rotate 2s linear infinite;
}

.install-icon {
  animation: bounce 2s ease-in-out infinite;
}

.prompt-info {
  flex: 1;
  min-width: 0;
}

.prompt-info h3 {
  margin: 0 0 8px 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  line-height: 1.3;
}

.prompt-info p {
  margin: 0;
  font-size: 0.9rem;
  color: #6b7280;
  line-height: 1.4;
}

/* 关闭按钮 */
.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #9ca3af;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.close-btn:hover {
  background: #f3f4f6;
  color: #6b7280;
}

/* 更新进度 */
.update-progress {
  margin-bottom: 20px;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #1d4ed8);
  border-radius: 4px;
  transition: width 0.3s ease;
  position: relative;
}

.progress-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  animation: shimmer 1.5s infinite;
}

.progress-text {
  font-size: 0.875rem;
  color: #6b7280;
  text-align: center;
}

/* 安装优势 */
.install-benefits {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 12px;
}

.benefit-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  flex: 1;
  gap: 6px;
}

.benefit-icon {
  font-size: 1.5rem;
}

.benefit-text {
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 500;
}

/* 操作按钮 */
.prompt-actions {
  display: flex;
  gap: 12px;
}

.btn {
  flex: 1;
  padding: 12px 16px;
  border: none;
  border-radius: 10px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-primary {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
}

.btn-primary:hover {
  background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
  transform: translateY(-1px);
}

.btn-secondary {
  background: #f8fafc;
  color: #6b7280;
  border: 1px solid #e5e7eb;
}

.btn-secondary:hover {
  background: #f1f5f9;
  color: #374151;
  border-color: #d1d5db;
}

/* 动画效果 */
@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-10px);
  }
  60% {
    transform: translateY(-5px);
  }
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

/* 过渡动画 */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-up-enter-from {
  opacity: 0;
  transform: translateY(100px) scale(0.9);
}

.slide-up-leave-to {
  opacity: 0;
  transform: translateY(100px) scale(0.9);
}

/* 更新提示特殊样式 */
.update-prompt {
  border-left: 4px solid #3b82f6;
}

.update-prompt .prompt-icon {
  color: #3b82f6;
}

/* 安装提示特殊样式 */
.install-prompt {
  border-left: 4px solid #10b981;
}

.install-prompt .prompt-icon {
  color: #10b981;
}

/* 响应式设计 */
@media (max-width: 480px) {
  .pwa-prompt {
    left: 20px;
    right: 20px;
    bottom: 20px;
    max-width: none;
    min-width: 0;
  }

  .prompt-content {
    padding: 20px;
  }

  .prompt-header {
    gap: 12px;
    margin-bottom: 16px;
  }

  .prompt-icon {
    font-size: 2rem;
  }

  .prompt-info h3 {
    font-size: 1.1rem;
  }

  .prompt-info p {
    font-size: 0.85rem;
  }

  .install-benefits {
    gap: 12px;
    padding: 12px;
  }

  .benefit-item {
    gap: 4px;
  }

  .benefit-icon {
    font-size: 1.25rem;
  }

  .benefit-text {
    font-size: 0.7rem;
  }

  .prompt-actions {
    flex-direction: column;
    gap: 8px;
  }

  .btn {
    padding: 14px 16px;
  }
}

/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
  .pwa-prompt {
    background: #1f2937;
    border-color: rgba(255, 255, 255, 0.08);
    color: #f9fafb;
  }

  .prompt-info h3 {
    color: #f9fafb;
  }

  .prompt-info p {
    color: #d1d5db;
  }

  .close-btn {
    color: #9ca3af;
  }

  .close-btn:hover {
    background: #374151;
    color: #d1d5db;
  }

  .progress-bar {
    background: #374151;
  }

  .progress-text {
    color: #d1d5db;
  }

  .install-benefits {
    background: #374151;
  }

  .benefit-text {
    color: #d1d5db;
  }

  .btn-secondary {
    background: #374151;
    color: #d1d5db;
    border-color: #4b5563;
  }

  .btn-secondary:hover {
    background: #4b5563;
    color: #f9fafb;
    border-color: #6b7280;
  }
}

/* 减少动画（用户偏好） */
@media (prefers-reduced-motion: reduce) {
  .update-icon,
  .install-icon {
    animation: none;
  }

  .slide-up-enter-active,
  .slide-up-leave-active {
    transition: opacity 0.2s ease;
  }

  .slide-up-enter-from,
  .slide-up-leave-to {
    transform: none;
  }

  .progress-fill::after {
    animation: none;
  }
}

/* 高对比度模式 */
@media (prefers-contrast: high) {
  .pwa-prompt {
    border: 2px solid currentColor;
  }

  .btn-primary {
    background: #0000ff;
  }

  .btn-secondary {
    border: 2px solid currentColor;
  }
}

/* 无障碍支持 */
.btn:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

.close-btn:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

/* 打印样式 */
@media print {
  .pwa-prompt {
    display: none;
  }
}
</style>