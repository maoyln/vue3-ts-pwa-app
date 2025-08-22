<template>
  <div class="smart-install-prompt">
    <!-- 安装横幅 -->
    <Transition name="banner-slide">
      <div 
        v-if="showInstallBanner && !isInstalled" 
        class="install-banner"
        :class="{ 'banner-minimized': bannerMinimized }"
      >
        <div class="banner-content">
          <div class="banner-icon">
            <div class="app-icon">📱</div>
          </div>
          <div class="banner-text">
            <h3>安装应用到设备</h3>
            <p v-if="!bannerMinimized">获得更好的体验，支持离线使用</p>
          </div>
          <div class="banner-actions">
            <button 
              @click="installApp" 
              class="install-btn"
              :disabled="installing"
            >
              {{ installing ? '安装中...' : '安装' }}
            </button>
            <button @click="minimizeBanner" class="minimize-btn" title="最小化">
              {{ bannerMinimized ? '📋' : '➖' }}
            </button>
            <button @click="dismissBanner" class="close-btn" title="关闭">
              ✕
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 安装成功提示 -->
    <Transition name="notification">
      <div v-if="showSuccessNotification" class="success-notification">
        <div class="notification-content">
          <span class="success-icon">✅</span>
          <span class="success-text">应用安装成功！</span>
          <button @click="openApp" class="open-app-btn">打开应用</button>
        </div>
      </div>
    </Transition>

    <!-- A2HS (Add to Home Screen) 原生提示 -->
    <Transition name="modal">
      <div v-if="showA2HSModal" class="a2hs-modal" @click.self="closeA2HSModal">
        <div class="modal-content">
          <div class="modal-header">
            <h3>添加到主屏幕</h3>
            <button @click="closeA2HSModal" class="modal-close">✕</button>
          </div>
          <div class="modal-body">
            <div class="app-preview">
              <div class="phone-frame">
                <div class="phone-screen">
                  <div class="app-icon-large">📱</div>
                  <div class="app-name">Vue3PWA</div>
                </div>
              </div>
            </div>
            <div class="benefits-list">
              <h4>安装后您将获得：</h4>
              <ul>
                <li>
                  <span class="benefit-icon">🚀</span>
                  <span>更快的启动速度</span>
                </li>
                <li>
                  <span class="benefit-icon">📡</span>
                  <span>离线访问功能</span>
                </li>
                <li>
                  <span class="benefit-icon">🔔</span>
                  <span>推送通知支持</span>
                </li>
                <li>
                  <span class="benefit-icon">💾</span>
                  <span>节省存储空间</span>
                </li>
                <li>
                  <span class="benefit-icon">🎯</span>
                  <span>专注的应用体验</span>
                </li>
              </ul>
            </div>
          </div>
          <div class="modal-actions">
            <button @click="closeA2HSModal" class="btn btn-secondary">
              稍后再说
            </button>
            <button @click="confirmInstall" class="btn btn-primary" :disabled="installing">
              {{ installing ? '安装中...' : '立即安装' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 安装指引 (iOS Safari) -->
    <Transition name="modal">
      <div v-if="showIOSGuide" class="ios-guide-modal" @click.self="closeIOSGuide">
        <div class="modal-content">
          <div class="modal-header">
            <h3>添加到主屏幕</h3>
            <button @click="closeIOSGuide" class="modal-close">✕</button>
          </div>
          <div class="modal-body">
            <div class="ios-steps">
              <div class="step">
                <div class="step-number">1</div>
                <div class="step-content">
                  <p>点击底部的分享按钮</p>
                  <div class="ios-icon">📤</div>
                </div>
              </div>
              <div class="step">
                <div class="step-number">2</div>
                <div class="step-content">
                  <p>选择"添加到主屏幕"</p>
                  <div class="ios-icon">📱➕</div>
                </div>
              </div>
              <div class="step">
                <div class="step-number">3</div>
                <div class="step-content">
                  <p>点击"添加"完成安装</p>
                  <div class="ios-icon">✅</div>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-actions">
            <button @click="closeIOSGuide" class="btn btn-primary">
              我知道了
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'

// 响应式数据
const showInstallBanner = ref(false)
const showA2HSModal = ref(false)
const showIOSGuide = ref(false)
const showSuccessNotification = ref(false)
const bannerMinimized = ref(false)
const installing = ref(false)
const isInstalled = ref(false)
const deferredPrompt = ref<any>(null)

// 设备检测
const isIOS = computed(() => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
})

const isStandalone = computed(() => {
  return window.matchMedia('(display-mode: standalone)').matches ||
         (window.navigator as any).standalone ||
         document.referrer.includes('android-app://')
})

// 检查是否应该显示安装提示
const shouldShowInstallPrompt = () => {
  // 如果已经安装或在独立模式下，不显示
  if (isInstalled.value || isStandalone.value) {
    return false
  }

  // 检查用户是否之前拒绝过安装
  const lastDismissed = localStorage.getItem('pwa-install-dismissed')
  if (lastDismissed) {
    const dismissedTime = parseInt(lastDismissed)
    const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24)
    
    // 如果用户在7天内拒绝过，不显示
    if (daysSinceDismissed < 7) {
      return false
    }
  }

  // 检查用户访问次数
  const visitCount = parseInt(localStorage.getItem('pwa-visit-count') || '0')
  return visitCount >= 3 // 访问3次后显示
}

// 安装应用
const installApp = async () => {
  if (isIOS.value) {
    showIOSGuide.value = true
    return
  }

  if (!deferredPrompt.value) {
    showA2HSModal.value = true
    return
  }

  installing.value = true
  
  try {
    // 显示安装提示
    deferredPrompt.value.prompt()
    
    // 等待用户响应
    const { outcome } = await deferredPrompt.value.userChoice
    
    if (outcome === 'accepted') {
      console.log('用户接受安装')
      showSuccessNotification.value = true
      showInstallBanner.value = false
      
      // 3秒后隐藏成功通知
      setTimeout(() => {
        showSuccessNotification.value = false
      }, 3000)
    } else {
      console.log('用户拒绝安装')
      localStorage.setItem('pwa-install-dismissed', Date.now().toString())
    }
    
    // 清除 deferred prompt
    deferredPrompt.value = null
  } catch (error) {
    console.error('安装过程中出错:', error)
  } finally {
    installing.value = false
  }
}

// 确认安装（A2HS模态框）
const confirmInstall = () => {
  closeA2HSModal()
  installApp()
}

// 打开应用
const openApp = () => {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'OPEN_APP'
    })
  }
  showSuccessNotification.value = false
}

// 最小化横幅
const minimizeBanner = () => {
  bannerMinimized.value = !bannerMinimized.value
}

// 关闭横幅
const dismissBanner = () => {
  showInstallBanner.value = false
  localStorage.setItem('pwa-install-dismissed', Date.now().toString())
}

// 关闭模态框
const closeA2HSModal = () => {
  showA2HSModal.value = false
}

const closeIOSGuide = () => {
  showIOSGuide.value = false
}

// 检查安装状态
const checkInstallStatus = () => {
  // 检查是否在独立模式下运行
  if (isStandalone.value) {
    isInstalled.value = true
    return
  }

  // 检查是否通过其他方式安装
  if ('getInstalledRelatedApps' in navigator) {
    (navigator as any).getInstalledRelatedApps().then((relatedApps: any[]) => {
      if (relatedApps.length > 0) {
        isInstalled.value = true
      }
    })
  }
}

// 更新访问计数
const updateVisitCount = () => {
  const currentCount = parseInt(localStorage.getItem('pwa-visit-count') || '0')
  localStorage.setItem('pwa-visit-count', (currentCount + 1).toString())
}

// 事件监听器
const handleBeforeInstallPrompt = (e: Event) => {
  console.log('收到 beforeinstallprompt 事件')
  
  // 阻止默认的安装提示
  e.preventDefault()
  
  // 保存事件以便稍后使用
  deferredPrompt.value = e
  
  // 显示自定义安装提示
  if (shouldShowInstallPrompt()) {
    setTimeout(() => {
      showInstallBanner.value = true
    }, 2000) // 2秒后显示
  }
}

const handleAppInstalled = () => {
  console.log('应用已安装')
  isInstalled.value = true
  showInstallBanner.value = false
  showSuccessNotification.value = true
  
  // 清除相关存储
  localStorage.removeItem('pwa-install-dismissed')
  
  setTimeout(() => {
    showSuccessNotification.value = false
  }, 3000)
}

// 生命周期
onMounted(() => {
  checkInstallStatus()
  updateVisitCount()
  
  // 添加事件监听器
  window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  window.addEventListener('appinstalled', handleAppInstalled)
  
  // 对于iOS设备，显示不同的提示
  if (isIOS.value && !isStandalone.value && shouldShowInstallPrompt()) {
    setTimeout(() => {
      showInstallBanner.value = true
    }, 3000)
  }
})

onUnmounted(() => {
  // 移除事件监听器
  window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  window.removeEventListener('appinstalled', handleAppInstalled)
})

// 暴露方法给父组件
defineExpose({
  showInstallPrompt: () => {
    if (!isInstalled.value) {
      showInstallBanner.value = true
    }
  },
  hideInstallPrompt: () => {
    showInstallBanner.value = false
  }
})
</script>

<style scoped>
.smart-install-prompt {
  position: relative;
  z-index: 1000;
}

/* 安装横幅样式 */
.install-banner {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: linear-gradient(135deg, #7c3aed, #a855f7);
  color: white;
  box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3);
  z-index: 1001;
  transition: all 0.3s ease;
}

.install-banner.banner-minimized {
  height: 60px;
}

.banner-content {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  max-width: 1200px;
  margin: 0 auto;
  gap: 16px;
}

.banner-minimized .banner-content {
  padding: 12px 20px;
}

.banner-icon {
  flex-shrink: 0;
}

.app-icon {
  width: 48px;
  height: 48px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.banner-minimized .app-icon {
  width: 36px;
  height: 36px;
  font-size: 18px;
}

.banner-text {
  flex: 1;
}

.banner-text h3 {
  margin: 0 0 4px 0;
  font-size: 18px;
  font-weight: 600;
}

.banner-text p {
  margin: 0;
  font-size: 14px;
  opacity: 0.9;
}

.banner-minimized .banner-text h3 {
  font-size: 16px;
  margin: 0;
}

.banner-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.install-btn {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.install-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.3);
}

.install-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.minimize-btn, .close-btn {
  background: none;
  border: none;
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s ease;
}

.minimize-btn:hover, .close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

/* 成功通知样式 */
.success-notification {
  position: fixed;
  top: 20px;
  right: 20px;
  background: #10b981;
  color: white;
  padding: 16px 20px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  z-index: 1002;
}

.notification-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.success-icon {
  font-size: 20px;
}

.success-text {
  font-weight: 500;
}

.open-app-btn {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.open-app-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* 模态框样式 */
.a2hs-modal, .ios-guide-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1003;
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 16px;
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  animation: modalSlideIn 0.3s ease;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 24px 16px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  margin: 0;
  font-size: 20px;
  color: #1f2937;
}

.modal-close {
  background: none;
  border: none;
  font-size: 20px;
  color: #6b7280;
  cursor: pointer;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.modal-close:hover {
  background: #f3f4f6;
  color: #374151;
}

.modal-body {
  padding: 24px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px 24px;
  border-top: 1px solid #e5e7eb;
}

.btn {
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
}

.btn-primary {
  background: #7c3aed;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #6d28d9;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
}

.btn-secondary:hover {
  background: #e5e7eb;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 应用预览样式 */
.app-preview {
  text-align: center;
  margin-bottom: 24px;
}

.phone-frame {
  display: inline-block;
  background: #1f2937;
  padding: 8px;
  border-radius: 20px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}

.phone-screen {
  background: white;
  width: 120px;
  height: 160px;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.app-icon-large {
  width: 48px;
  height: 48px;
  background: #7c3aed;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;
}

.app-name {
  font-size: 12px;
  color: #374151;
  font-weight: 500;
}

/* 好处列表样式 */
.benefits-list h4 {
  margin: 0 0 16px 0;
  color: #1f2937;
}

.benefits-list ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.benefits-list li {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
}

.benefit-icon {
  font-size: 18px;
  width: 24px;
  text-align: center;
}

/* iOS 指引样式 */
.ios-steps {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.step {
  display: flex;
  align-items: center;
  gap: 16px;
}

.step-number {
  width: 32px;
  height: 32px;
  background: #7c3aed;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  flex-shrink: 0;
}

.step-content {
  flex: 1;
}

.step-content p {
  margin: 0 0 8px 0;
  color: #374151;
}

.ios-icon {
  font-size: 24px;
  text-align: center;
}

/* 动画效果 */
.banner-slide-enter-active,
.banner-slide-leave-active {
  transition: all 0.3s ease;
}

.banner-slide-enter-from {
  transform: translateY(-100%);
  opacity: 0;
}

.banner-slide-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}

.notification-enter-active,
.notification-leave-active {
  transition: all 0.3s ease;
}

.notification-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.notification-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-content,
.modal-leave-to .modal-content {
  transform: scale(0.9);
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .banner-content {
    padding: 12px 16px;
    gap: 12px;
  }
  
  .banner-text h3 {
    font-size: 16px;
  }
  
  .banner-text p {
    font-size: 13px;
  }
  
  .install-btn {
    padding: 8px 16px;
    font-size: 14px;
  }
  
  .modal-content {
    margin: 10px;
    max-height: 95vh;
  }
  
  .modal-header,
  .modal-body,
  .modal-actions {
    padding: 16px;
  }
}

@media (max-width: 480px) {
  .banner-content {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  
  .banner-text {
    text-align: center;
  }
  
  .banner-actions {
    justify-content: center;
  }
  
  .success-notification {
    top: 10px;
    right: 10px;
    left: 10px;
  }
  
  .notification-content {
    flex-direction: column;
    text-align: center;
    gap: 8px;
  }
}

/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
  .modal-content {
    background: #1f2937;
    color: #f9fafb;
  }
  
  .modal-header {
    border-bottom-color: #374151;
  }
  
  .modal-header h3 {
    color: #f9fafb;
  }
  
  .modal-actions {
    border-top-color: #374151;
  }
  
  .btn-secondary {
    background: #374151;
    color: #f9fafb;
  }
  
  .btn-secondary:hover {
    background: #4b5563;
  }
  
  .phone-screen {
    background: #374151;
  }
  
  .app-name {
    color: #d1d5db;
  }
  
  .benefits-list h4 {
    color: #f9fafb;
  }
  
  .step-content p {
    color: #d1d5db;
  }
}
</style>
