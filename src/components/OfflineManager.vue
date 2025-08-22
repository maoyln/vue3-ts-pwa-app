<template>
  <div class="offline-manager">
    <!-- 离线状态横幅 -->
    <Transition name="slide-down">
      <div v-if="!isOnline" class="offline-banner">
        <div class="offline-content">
          <div class="offline-icon">📡</div>
          <div class="offline-text">
            <span class="offline-title">当前离线</span>
            <span class="offline-subtitle">正在使用缓存数据</span>
          </div>
          <div class="offline-actions">
            <button @click="retryConnection" class="retry-btn" :disabled="retrying">
              {{ retrying ? '重试中...' : '重试连接' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 网络恢复通知 -->
    <Transition name="notification">
      <div v-if="showReconnectedNotification" class="reconnected-notification">
        <div class="notification-content">
          <span class="success-icon">✅</span>
          <span class="success-text">网络已恢复连接</span>
          <span class="sync-text">正在同步数据...</span>
        </div>
      </div>
    </Transition>

    <!-- 离线数据同步状态 -->
    <Transition name="fade">
      <div v-if="showSyncStatus" class="sync-status">
        <div class="sync-content">
          <div class="sync-icon">
            <div class="spinner"></div>
          </div>
          <div class="sync-text">
            <span class="sync-title">正在同步数据</span>
            <span class="sync-progress">{{ syncProgress }}%</span>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

// 响应式数据
const isOnline = ref(navigator.onLine)
const retrying = ref(false)
const showReconnectedNotification = ref(false)
const showSyncStatus = ref(false)
const syncProgress = ref(0)
const wasOffline = ref(false)

// 重试连接
const retryConnection = async () => {
  retrying.value = true
  
  try {
    // 尝试发送一个小的网络请求来测试连接
    const response = await fetch('/favicon.ico', {
      method: 'HEAD',
      cache: 'no-cache'
    })
    
    if (response.ok) {
      isOnline.value = true
      handleOnline()
    }
  } catch (error) {
    console.log('网络仍然不可用')
  } finally {
    setTimeout(() => {
      retrying.value = false
    }, 1000)
  }
}

// 处理网络连接事件
const handleOnline = () => {
  console.log('🌐 网络已连接')
  isOnline.value = true
  
  if (wasOffline.value) {
    showReconnectedNotification.value = true
    wasOffline.value = false
    
    // 开始数据同步
    startDataSync()
    
    // 3秒后隐藏通知
    setTimeout(() => {
      showReconnectedNotification.value = false
    }, 3000)
  }
}

const handleOffline = () => {
  console.log('📡 网络已断开')
  isOnline.value = false
  wasOffline.value = true
  showReconnectedNotification.value = false
  showSyncStatus.value = false
}

// 数据同步
const startDataSync = async () => {
  showSyncStatus.value = true
  syncProgress.value = 0
  
  try {
    // 模拟数据同步过程
    const syncTasks = [
      { name: '同步用户数据', weight: 25 },
      { name: '同步文章数据', weight: 25 },
      { name: '同步评论数据', weight: 25 },
      { name: '同步相册数据', weight: 25 }
    ]
    
    let completedWeight = 0
    
    for (const task of syncTasks) {
      console.log(`开始${task.name}`)
      
      // 模拟同步延迟
      await new Promise(resolve => setTimeout(resolve, 500))
      
      completedWeight += task.weight
      syncProgress.value = Math.round(completedWeight)
      
      // 通知相关组件刷新数据
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'SYNC_DATA',
          payload: { task: task.name }
        })
      }
    }
    
    console.log('✅ 数据同步完成')
    
    // 同步完成后延迟隐藏状态
    setTimeout(() => {
      showSyncStatus.value = false
      syncProgress.value = 0
    }, 1000)
    
  } catch (error) {
    console.error('❌ 数据同步失败:', error)
    showSyncStatus.value = false
  }
}

// 检查网络质量
const checkNetworkQuality = async () => {
  if (!isOnline.value) return null
  
  const startTime = Date.now()
  
  try {
    await fetch('/favicon.ico', {
      method: 'HEAD',
      cache: 'no-cache'
    })
    
    const latency = Date.now() - startTime
    
    if (latency < 100) return 'excellent'
    if (latency < 300) return 'good'
    if (latency < 600) return 'fair'
    return 'poor'
  } catch (error) {
    return null
  }
}

// 监听 Service Worker 消息
const handleServiceWorkerMessage = (event: MessageEvent) => {
  const { data } = event
  
  switch (data.type) {
    case 'CACHE_UPDATED':
      console.log('📦 缓存已更新:', data.payload)
      break
      
    case 'SYNC_COMPLETED':
      console.log('🔄 后台同步完成:', data.payload)
      break
      
    case 'NETWORK_STATUS':
      if (data.payload.online !== isOnline.value) {
        isOnline.value = data.payload.online
        if (data.payload.online) {
          handleOnline()
        } else {
          handleOffline()
        }
      }
      break
  }
}

// 定期检查网络状态
let networkCheckInterval: NodeJS.Timeout | null = null

const startNetworkMonitoring = () => {
  networkCheckInterval = setInterval(async () => {
    const wasOnlineBefore = isOnline.value
    const quality = await checkNetworkQuality()
    const isOnlineNow = quality !== null
    
    if (wasOnlineBefore !== isOnlineNow) {
      isOnline.value = isOnlineNow
      
      if (isOnlineNow) {
        handleOnline()
      } else {
        handleOffline()
      }
    }
  }, 5000) // 每5秒检查一次
}

const stopNetworkMonitoring = () => {
  if (networkCheckInterval) {
    clearInterval(networkCheckInterval)
    networkCheckInterval = null
  }
}

// 生命周期
onMounted(() => {
  // 初始状态
  wasOffline.value = !isOnline.value
  
  // 添加网络状态事件监听器
  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)
  
  // 监听 Service Worker 消息
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage)
  }
  
  // 开始网络监控
  startNetworkMonitoring()
  
  // 页面可见性变化时检查网络状态
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      // 页面变为可见时，检查网络状态
      setTimeout(async () => {
        const quality = await checkNetworkQuality()
        const currentOnline = quality !== null
        
        if (currentOnline !== isOnline.value) {
          isOnline.value = currentOnline
          
          if (currentOnline) {
            handleOnline()
          } else {
            handleOffline()
          }
        }
      }, 1000)
    }
  }
  
  document.addEventListener('visibilitychange', handleVisibilityChange)
})

onUnmounted(() => {
  // 移除事件监听器
  window.removeEventListener('online', handleOnline)
  window.removeEventListener('offline', handleOffline)
  
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage)
  }
  
  // 停止网络监控
  stopNetworkMonitoring()
})

// 暴露方法给父组件
defineExpose({
  isOnline,
  retryConnection,
  checkNetworkQuality
})
</script>

<style scoped>
.offline-manager {
  position: relative;
  z-index: 999;
}

/* 离线横幅样式 */
.offline-banner {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: white;
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
  z-index: 1000;
}

.offline-content {
  display: flex;
  align-items: center;
  padding: 12px 20px;
  max-width: 1200px;
  margin: 0 auto;
  gap: 16px;
}

.offline-icon {
  font-size: 24px;
  animation: pulse 2s infinite;
}

.offline-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.offline-title {
  font-weight: 600;
  font-size: 16px;
}

.offline-subtitle {
  font-size: 13px;
  opacity: 0.9;
}

.offline-actions {
  display: flex;
  align-items: center;
}

.retry-btn {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.retry-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.3);
}

.retry-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 重连通知样式 */
.reconnected-notification {
  position: fixed;
  top: 20px;
  right: 20px;
  background: #10b981;
  color: white;
  padding: 16px 20px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  z-index: 1001;
  max-width: 300px;
}

.notification-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.success-icon {
  font-size: 20px;
  margin-bottom: 4px;
}

.success-text {
  font-weight: 600;
  font-size: 15px;
}

.sync-text {
  font-size: 13px;
  opacity: 0.9;
}

/* 同步状态样式 */
.sync-status {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: white;
  border: 1px solid #e5e7eb;
  padding: 16px 20px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 1001;
  min-width: 200px;
}

.sync-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.sync-icon {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #e5e7eb;
  border-top: 2px solid #7c3aed;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.sync-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.sync-title {
  font-weight: 500;
  color: #374151;
  font-size: 14px;
}

.sync-progress {
  font-size: 12px;
  color: #7c3aed;
  font-weight: 600;
}

/* 动画效果 */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}

.slide-down-enter-from {
  transform: translateY(-100%);
  opacity: 0;
}

.slide-down-leave-to {
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

.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .offline-content {
    padding: 10px 16px;
    gap: 12px;
  }
  
  .offline-text {
    flex-direction: row;
    align-items: center;
    gap: 8px;
  }
  
  .offline-title {
    font-size: 14px;
  }
  
  .offline-subtitle {
    font-size: 12px;
  }
  
  .retry-btn {
    padding: 6px 12px;
    font-size: 13px;
  }
  
  .reconnected-notification {
    top: 10px;
    right: 10px;
    left: 10px;
    max-width: none;
  }
  
  .sync-status {
    bottom: 10px;
    right: 10px;
    left: 10px;
    min-width: auto;
  }
}

@media (max-width: 480px) {
  .offline-content {
    flex-direction: column;
    align-items: stretch;
    text-align: center;
    gap: 8px;
  }
  
  .offline-text {
    justify-content: center;
  }
  
  .notification-content {
    text-align: center;
  }
  
  .sync-content {
    justify-content: center;
  }
}

/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
  .sync-status {
    background: #1f2937;
    border-color: #374151;
  }
  
  .sync-title {
    color: #f9fafb;
  }
  
  .spinner {
    border-color: #4b5563;
    border-top-color: #a78bfa;
  }
}
</style>
