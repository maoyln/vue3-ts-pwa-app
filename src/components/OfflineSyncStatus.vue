<template>
  <div class="offline-sync-status">
    <!-- 同步状态横幅 -->
    <Transition name="slide-down">
      <div v-if="showSyncBanner" class="sync-banner" :class="bannerClass">
        <div class="sync-banner-content">
          <div class="sync-icon">
            <div v-if="syncStatus.isSyncing" class="spinner"></div>
            <span v-else-if="!syncStatus.isOnline" class="offline-icon">📡</span>
            <span v-else-if="syncStatus.pendingOperations > 0" class="pending-icon">📝</span>
            <span v-else class="success-icon">✅</span>
          </div>
          
          <div class="sync-text">
            <div class="sync-title">{{ syncTitle }}</div>
            <div v-if="syncSubtitle" class="sync-subtitle">{{ syncSubtitle }}</div>
          </div>
          
          <div class="sync-actions">
            <button 
              v-if="!syncStatus.isOnline && syncStatus.pendingOperations > 0"
              @click="showPendingOperations = true"
              class="action-btn secondary"
            >
              查看待同步 ({{ syncStatus.pendingOperations }})
            </button>
            
            <button 
              v-if="syncStatus.isOnline && syncStatus.pendingOperations > 0 && !syncStatus.isSyncing"
              @click="retrySync"
              class="action-btn primary"
            >
              立即同步
            </button>
            
            <button @click="hideBanner" class="close-btn">✕</button>
          </div>
        </div>
        
        <!-- 同步进度条 -->
        <div v-if="syncStatus.isSyncing" class="sync-progress">
          <div class="progress-bar">
            <div 
              class="progress-fill" 
              :style="{ width: `${syncStatus.syncProgress}%` }"
            ></div>
          </div>
          <div class="progress-text">{{ syncStatus.syncProgress }}%</div>
        </div>
      </div>
    </Transition>

    <!-- 待同步操作列表模态框 -->
    <Transition name="modal">
      <div v-if="showPendingOperations" class="pending-modal" @click.self="showPendingOperations = false">
        <div class="modal-content">
          <div class="modal-header">
            <h3>待同步操作</h3>
            <button @click="showPendingOperations = false" class="modal-close">✕</button>
          </div>
          
          <div class="modal-body">
            <div v-if="pendingOps.length === 0" class="empty-state">
              <div class="empty-icon">📭</div>
              <p>暂无待同步操作</p>
            </div>
            
            <div v-else class="operations-list">
              <div 
                v-for="operation in pendingOps" 
                :key="operation.id"
                class="operation-item"
                :class="operation.status"
              >
                <div class="operation-icon">
                  <span v-if="operation.type === 'CREATE'">➕</span>
                  <span v-else-if="operation.type === 'UPDATE'">✏️</span>
                  <span v-else-if="operation.type === 'DELETE'">🗑️</span>
                </div>
                
                <div class="operation-content">
                  <div class="operation-title">
                    {{ getOperationTitle(operation) }}
                  </div>
                  <div class="operation-details">
                    <span class="resource">{{ getResourceName(operation.resource) }}</span>
                    <span class="timestamp">{{ formatTimestamp(operation.timestamp) }}</span>
                    <span v-if="operation.retryCount > 0" class="retry-count">
                      重试 {{ operation.retryCount }} 次
                    </span>
                  </div>
                  <div v-if="operation.error" class="operation-error">
                    {{ operation.error }}
                  </div>
                </div>
                
                <div class="operation-status">
                  <div v-if="operation.status === 'syncing'" class="status-syncing">
                    <div class="mini-spinner"></div>
                    <span>同步中</span>
                  </div>
                  <div v-else-if="operation.status === 'failed'" class="status-failed">
                    <span>❌</span>
                    <span>失败</span>
                  </div>
                  <div v-else class="status-pending">
                    <span>⏳</span>
                    <span>待同步</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="modal-actions">
            <button @click="clearAllOps" class="btn btn-secondary">
              清空全部
            </button>
            <button 
              @click="retrySync" 
              class="btn btn-primary"
              :disabled="syncStatus.isSyncing"
            >
              {{ syncStatus.isSyncing ? '同步中...' : '重试同步' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 同步完成通知 -->
    <Transition name="notification">
      <div v-if="showSyncNotification" class="sync-notification">
        <div class="notification-content">
          <span class="notification-icon">🎉</span>
          <div class="notification-text">
            <div class="notification-title">同步完成</div>
            <div class="notification-subtitle">{{ syncNotificationText }}</div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { 
  offlineSyncManager, 
  onSyncStatusChange, 
  retrySync as retryOfflineSync,
  clearAllOperations,
  type SyncStatus,
  type OfflineOperation
} from '../utils/offlineSync'

// 响应式数据
const syncStatus = ref<SyncStatus>({
  isOnline: true,
  isSyncing: false,
  pendingOperations: 0,
  lastSyncTime: null,
  syncProgress: 0
})

const showSyncBanner = ref(false)
const showPendingOperations = ref(false)
const showSyncNotification = ref(false)
const syncNotificationText = ref('')
const bannerDismissed = ref(false)
const pendingOps = ref<OfflineOperation[]>([])

// 计算属性
const bannerClass = computed(() => {
  if (!syncStatus.value.isOnline) return 'offline'
  if (syncStatus.value.isSyncing) return 'syncing'
  if (syncStatus.value.pendingOperations > 0) return 'pending'
  return 'online'
})

const syncTitle = computed(() => {
  if (!syncStatus.value.isOnline) {
    return `离线模式 - ${syncStatus.value.pendingOperations} 个操作待同步`
  }
  if (syncStatus.value.isSyncing) {
    return '正在同步数据...'
  }
  if (syncStatus.value.pendingOperations > 0) {
    return `${syncStatus.value.pendingOperations} 个操作待同步`
  }
  return '数据已同步'
})

const syncSubtitle = computed(() => {
  if (!syncStatus.value.isOnline) {
    return '网络恢复后将自动同步您的操作'
  }
  if (syncStatus.value.isSyncing) {
    return `进度: ${syncStatus.value.syncProgress}%`
  }
  if (syncStatus.value.pendingOperations > 0) {
    return '点击立即同步或等待自动同步'
  }
  if (syncStatus.value.lastSyncTime) {
    return `上次同步: ${formatTimestamp(syncStatus.value.lastSyncTime)}`
  }
  return ''
})

// 方法
const updatePendingOperations = () => {
  pendingOps.value = offlineSyncManager.getPendingOperations()
}

const shouldShowBanner = (status: SyncStatus) => {
  // 如果用户主动关闭了横幅，只在有新操作时再显示
  if (bannerDismissed.value) {
    return status.pendingOperations > 0 && !status.isOnline
  }
  
  // 有待同步操作或正在同步时显示
  return status.pendingOperations > 0 || status.isSyncing
}

const hideBanner = () => {
  showSyncBanner.value = false
  bannerDismissed.value = true
  
  // 10秒后重置，允许再次显示
  setTimeout(() => {
    bannerDismissed.value = false
  }, 10000)
}

const retrySync = async () => {
  try {
    await retryOfflineSync()
  } catch (error) {
    console.error('重试同步失败:', error)
  }
}

const clearAllOps = () => {
  clearAllOperations()
  showPendingOperations.value = false
  updatePendingOperations()
}

const getOperationTitle = (operation: OfflineOperation): string => {
  const resource = getResourceName(operation.resource)
  const actions = {
    CREATE: '新增',
    UPDATE: '修改', 
    DELETE: '删除'
  }
  return `${actions[operation.type]} ${resource}`
}

const getResourceName = (resource: string): string => {
  const names: Record<string, string> = {
    users: '用户',
    posts: '文章',
    comments: '评论',
    albums: '相册'
  }
  return names[resource] || resource
}

const formatTimestamp = (timestamp: number): string => {
  const now = Date.now()
  const diff = now - timestamp
  
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`
  
  return new Date(timestamp).toLocaleString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 监听同步状态变化
let unsubscribe: (() => void) | null = null

onMounted(() => {
  // 初始化状态
  syncStatus.value = offlineSyncManager.getSyncStatus()
  updatePendingOperations()
  showSyncBanner.value = shouldShowBanner(syncStatus.value)
  
  // 监听状态变化
  unsubscribe = onSyncStatusChange((status) => {
    const prevPendingCount = syncStatus.value.pendingOperations
    const prevSyncing = syncStatus.value.isSyncing
    
    syncStatus.value = status
    updatePendingOperations()
    
    // 决定是否显示横幅
    showSyncBanner.value = shouldShowBanner(status)
    
    // 同步完成通知
    if (prevSyncing && !status.isSyncing && prevPendingCount > 0) {
      const remainingOps = offlineSyncManager.getPendingOperations().length
      const syncedCount = prevPendingCount - remainingOps
      
      if (syncedCount > 0) {
        syncNotificationText.value = `成功同步 ${syncedCount} 个操作${remainingOps > 0 ? `，${remainingOps} 个操作同步失败` : ''}`
        showSyncNotification.value = true
        
        setTimeout(() => {
          showSyncNotification.value = false
        }, 4000)
      }
    }
    
    // 网络恢复时重置横幅关闭状态
    if (!syncStatus.value.isOnline && status.isOnline) {
      bannerDismissed.value = false
    }
  })
})

onUnmounted(() => {
  if (unsubscribe) {
    unsubscribe()
  }
})
</script>

<style scoped>
.offline-sync-status {
  position: relative;
  z-index: 1000;
}

/* 同步横幅样式 */
.sync-banner {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1001;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.sync-banner.offline {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: white;
}

.sync-banner.syncing {
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  color: white;
}

.sync-banner.pending {
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  color: white;
}

.sync-banner.online {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
}

.sync-banner-content {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  max-width: 1200px;
  margin: 0 auto;
  gap: 16px;
}

.sync-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}

.spinner, .mini-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.mini-spinner {
  width: 14px;
  height: 14px;
  border-width: 1.5px;
}

.sync-text {
  flex: 1;
}

.sync-title {
  font-weight: 600;
  font-size: 16px;
  margin-bottom: 2px;
}

.sync-subtitle {
  font-size: 13px;
  opacity: 0.9;
}

.sync-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.action-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn.primary {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.action-btn.primary:hover {
  background: rgba(255, 255, 255, 0.3);
}

.action-btn.secondary {
  background: rgba(0, 0, 0, 0.1);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.action-btn.secondary:hover {
  background: rgba(0, 0, 0, 0.2);
}

.close-btn {
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

.close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

/* 进度条样式 */
.sync-progress {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 20px 12px;
  max-width: 1200px;
  margin: 0 auto;
}

.progress-bar {
  flex: 1;
  height: 4px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: white;
  border-radius: 2px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 12px;
  font-weight: 600;
  min-width: 40px;
  text-align: right;
}

/* 模态框样式 */
.pending-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1002;
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 16px;
  max-width: 600px;
  width: 100%;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
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
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-state p {
  color: #6b7280;
  font-size: 16px;
  margin: 0;
}

.operations-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.operation-item {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  transition: all 0.2s ease;
}

.operation-item.syncing {
  border-color: #3b82f6;
  background: #eff6ff;
}

.operation-item.failed {
  border-color: #ef4444;
  background: #fef2f2;
}

.operation-icon {
  width: 40px;
  height: 40px;
  background: #f3f4f6;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}

.operation-item.syncing .operation-icon {
  background: #dbeafe;
}

.operation-item.failed .operation-icon {
  background: #fee2e2;
}

.operation-content {
  flex: 1;
}

.operation-title {
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 4px;
}

.operation-details {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 4px;
}

.resource {
  background: #f3f4f6;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 500;
}

.retry-count {
  color: #f59e0b;
  font-weight: 500;
}

.operation-error {
  font-size: 12px;
  color: #ef4444;
  background: #fef2f2;
  padding: 6px 8px;
  border-radius: 4px;
  margin-top: 8px;
}

.operation-status {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  min-width: 80px;
}

.status-syncing, .status-failed, .status-pending {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 500;
}

.status-syncing {
  color: #3b82f6;
}

.status-failed {
  color: #ef4444;
}

.status-pending {
  color: #6b7280;
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

/* 通知样式 */
.sync-notification {
  position: fixed;
  top: 80px;
  right: 20px;
  background: #10b981;
  color: white;
  padding: 16px 20px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  z-index: 1003;
  max-width: 320px;
}

.notification-content {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.notification-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.notification-text {
  flex: 1;
}

.notification-title {
  font-weight: 600;
  margin-bottom: 2px;
}

.notification-subtitle {
  font-size: 13px;
  opacity: 0.9;
}

/* 动画效果 */
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

/* 响应式设计 */
@media (max-width: 768px) {
  .sync-banner-content {
    padding: 12px 16px;
    gap: 12px;
  }
  
  .sync-title {
    font-size: 14px;
  }
  
  .sync-subtitle {
    font-size: 12px;
  }
  
  .action-btn {
    padding: 6px 12px;
    font-size: 13px;
  }
  
  .sync-progress {
    padding: 0 16px 12px;
  }
  
  .pending-modal {
    padding: 10px;
  }
  
  .modal-content {
    max-height: 90vh;
  }
  
  .modal-header,
  .modal-body,
  .modal-actions {
    padding: 16px;
  }
  
  .operation-item {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  
  .operation-status {
    flex-direction: row;
    justify-content: center;
    min-width: auto;
  }
  
  .sync-notification {
    top: 10px;
    right: 10px;
    left: 10px;
    max-width: none;
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
  
  .operation-item {
    border-color: #374151;
    background: #111827;
  }
  
  .operation-item.syncing {
    border-color: #60a5fa;
    background: #1e3a8a;
  }
  
  .operation-item.failed {
    border-color: #f87171;
    background: #7f1d1d;
  }
  
  .operation-icon {
    background: #374151;
  }
  
  .operation-title {
    color: #f9fafb;
  }
  
  .operation-details {
    color: #d1d5db;
  }
  
  .resource {
    background: #374151;
    color: #f9fafb;
  }
  
  .operation-error {
    background: #7f1d1d;
    color: #fca5a5;
  }
  
  .btn-secondary {
    background: #374151;
    color: #f9fafb;
  }
  
  .btn-secondary:hover {
    background: #4b5563;
  }
}
</style>
