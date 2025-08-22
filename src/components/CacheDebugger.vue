<template>
  <div v-if="showDebugger" class="cache-debugger">
    <div class="debugger-header">
      <h3>🔧 缓存调试器</h3>
      <button @click="toggleDebugger" class="close-btn">×</button>
    </div>
    
    <div class="debugger-content">
      <!-- 缓存概览 -->
      <div class="cache-overview">
        <h4>缓存概览</h4>
        <div v-if="cacheInfo" class="cache-summary">
          <div class="summary-item">
            <span class="label">版本:</span>
            <span class="value">{{ cacheInfo.version }}</span>
          </div>
          <div class="summary-item">
            <span class="label">更新时间:</span>
            <span class="value">{{ formatTime(cacheInfo.timestamp) }}</span>
          </div>
          <div class="summary-item">
            <span class="label">总缓存数:</span>
            <span class="value">{{ getTotalCacheCount() }}</span>
          </div>
          <div class="summary-item">
            <span class="label">总大小:</span>
            <span class="value">{{ formatSize(getTotalCacheSize()) }}</span>
          </div>
        </div>
        
        <div class="cache-actions">
          <button @click="refreshCacheInfo" :disabled="loading" class="action-btn">
            {{ loading ? '加载中...' : '刷新信息' }}
          </button>
          <button @click="refreshAllApiCache" class="action-btn primary">
            刷新API缓存
          </button>
          <button @click="clearAllCache" class="action-btn danger">
            清空所有缓存
          </button>
        </div>
      </div>

      <!-- 缓存详情 -->
      <div v-if="cacheInfo" class="cache-details">
        <div 
          v-for="(cache, name) in cacheInfo.caches" 
          :key="name" 
          class="cache-section"
        >
          <div class="section-header" @click="toggleSection(String(name))">
            <h4>
              {{ getCacheName(String(name)) }}
              <span class="entry-count">({{ cache.entryCount }} 项)</span>
            </h4>
            <span class="toggle-icon" :class="{ expanded: expandedSections[String(name)] }">
              ▼
            </span>
          </div>
          
          <div v-if="expandedSections[String(name)]" class="section-content">
            <div class="section-info">
              <span>大小: {{ formatSize(cache.totalSize) }}</span>
              <span>缓存名: {{ cache.cacheName }}</span>
            </div>
            
            <div class="cache-entries">
              <div 
                v-for="(entry, index) in cache.entries" 
                :key="index"
                class="cache-entry"
                :class="{ expired: entry.isExpired }"
              >
                <div class="entry-url">{{ getShortUrl(entry.url) }}</div>
                <div class="entry-info">
                  <span class="entry-method">{{ entry.method }}</span>
                  <span class="entry-size">{{ formatSize(entry.size) }}</span>
                  <span v-if="entry.cachedTime" class="entry-time">
                    {{ formatTime(entry.cachedTime) }}
                  </span>
                  <span v-if="entry.isExpired" class="entry-expired">已过期</span>
                </div>
                <button 
                  v-if="String(name) === 'API'" 
                  @click="refreshSingleCache(entry.url)"
                  class="refresh-btn"
                  title="刷新这个缓存"
                >
                  🔄
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <!-- 触发按钮 -->
  <button 
    v-if="!showDebugger" 
    @click="toggleDebugger" 
    class="debug-trigger"
    title="打开缓存调试器"
  >
    🔧
  </button>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { getCacheInfo, refreshApiCache, clearCache } from '../registerServiceWorker'

// 响应式数据
const showDebugger = ref(false)
const cacheInfo = ref<any>(null)
const loading = ref(false)
const expandedSections = reactive<{ [key: string]: boolean }>({})

// 切换调试器显示
const toggleDebugger = () => {
  showDebugger.value = !showDebugger.value
  if (showDebugger.value && !cacheInfo.value) {
    refreshCacheInfo()
  }
}

// 切换区域展开/收起
const toggleSection = (name: string) => {
  expandedSections[name] = !expandedSections[name]
}

// 刷新缓存信息
const refreshCacheInfo = async () => {
  loading.value = true
  try {
    cacheInfo.value = await getCacheInfo()
    console.log('缓存信息:', cacheInfo.value)
  } catch (error) {
    console.error('获取缓存信息失败:', error)
    alert('获取缓存信息失败: ' + error)
  } finally {
    loading.value = false
  }
}

// 刷新所有API缓存
const refreshAllApiCache = async () => {
  try {
    await refreshApiCache()
    alert('API缓存刷新请求已发送')
    // 延迟刷新缓存信息
    setTimeout(refreshCacheInfo, 1000)
  } catch (error) {
    console.error('刷新API缓存失败:', error)
    alert('刷新API缓存失败: ' + error)
  }
}

// 刷新单个缓存
const refreshSingleCache = async (url: string) => {
  try {
    await refreshApiCache(url)
    alert(`缓存刷新请求已发送: ${getShortUrl(url)}`)
    // 延迟刷新缓存信息
    setTimeout(refreshCacheInfo, 1000)
  } catch (error) {
    console.error('刷新缓存失败:', error)
    alert('刷新缓存失败: ' + error)
  }
}

// 清空所有缓存
const clearAllCache = async () => {
  if (confirm('确定要清空所有缓存吗？这将删除所有离线数据。')) {
    try {
      await clearCache()
      alert('缓存清理请求已发送')
      // 延迟刷新缓存信息
      setTimeout(refreshCacheInfo, 1000)
    } catch (error) {
      console.error('清理缓存失败:', error)
      alert('清理缓存失败: ' + error)
    }
  }
}

// 获取缓存名称
const getCacheName = (name: string): string => {
  const nameMap: { [key: string]: string } = {
    STATIC: '静态资源',
    DYNAMIC: '动态内容',
    API: 'API接口',
    IMAGES: '图片资源',
    FONTS: '字体文件'
  }
  return nameMap[name] || name
}

// 获取短URL
const getShortUrl = (url: string): string => {
  try {
    const urlObj = new URL(url)
    const path = urlObj.pathname + urlObj.search
    return path.length > 50 ? path.substring(0, 47) + '...' : path
  } catch {
    return url.length > 50 ? url.substring(0, 47) + '...' : url
  }
}

// 格式化时间
const formatTime = (timestamp: number): string => {
  return new Date(timestamp).toLocaleString('zh-CN')
}

// 格式化大小
const formatSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 获取总缓存数
const getTotalCacheCount = (): number => {
  if (!cacheInfo.value) return 0
  return Object.values(cacheInfo.value.caches).reduce(
    (total: number, cache: any) => total + cache.entryCount, 0
  )
}

// 获取总缓存大小
const getTotalCacheSize = (): number => {
  if (!cacheInfo.value) return 0
  return Object.values(cacheInfo.value.caches).reduce(
    (total: number, cache: any) => total + cache.totalSize, 0
  )
}

// 组件挂载时的操作
onMounted(() => {
  // 在开发模式下自动展开API缓存
  if (process.env.NODE_ENV === 'development') {
    expandedSections.API = true
  }
})
</script>

<style scoped>
.cache-debugger {
  position: fixed;
  top: 20px;
  right: 20px;
  width: 400px;
  max-height: 80vh;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  border: 1px solid #e5e7eb;
  z-index: 1000;
  overflow: hidden;
  font-size: 14px;
}

.debugger-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: #f8fafc;
  border-bottom: 1px solid #e5e7eb;
}

.debugger-header h3 {
  margin: 0;
  font-size: 16px;
  color: #374151;
}

.close-btn {
  background: none;
  border: none;
  font-size: 20px;
  color: #6b7280;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: #374151;
}

.debugger-content {
  max-height: calc(80vh - 60px);
  overflow-y: auto;
  padding: 16px 20px;
}

.cache-overview {
  margin-bottom: 20px;
}

.cache-overview h4 {
  margin: 0 0 12px 0;
  color: #374151;
  font-size: 14px;
}

.cache-summary {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 16px;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 12px;
  background: #f8fafc;
  border-radius: 6px;
  font-size: 12px;
}

.summary-item .label {
  color: #6b7280;
}

.summary-item .value {
  color: #374151;
  font-weight: 500;
}

.cache-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.action-btn {
  padding: 6px 12px;
  border: 1px solid #d1d5db;
  background: white;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn:hover {
  background: #f3f4f6;
}

.action-btn.primary {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.action-btn.primary:hover {
  background: #2563eb;
}

.action-btn.danger {
  background: #dc2626;
  color: white;
  border-color: #dc2626;
}

.action-btn.danger:hover {
  background: #b91c1c;
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.cache-section {
  margin-bottom: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f8fafc;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.section-header:hover {
  background: #f1f5f9;
}

.section-header h4 {
  margin: 0;
  font-size: 14px;
  color: #374151;
}

.entry-count {
  color: #6b7280;
  font-weight: normal;
  font-size: 12px;
}

.toggle-icon {
  color: #6b7280;
  transition: transform 0.2s ease;
}

.toggle-icon.expanded {
  transform: rotate(180deg);
}

.section-content {
  padding: 16px;
}

.section-info {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
  font-size: 12px;
  color: #6b7280;
}

.cache-entries {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.cache-entry {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background: #f8fafc;
  border-radius: 6px;
  border-left: 3px solid #10b981;
}

.cache-entry.expired {
  border-left-color: #f59e0b;
  background: #fffbeb;
}

.entry-url {
  flex: 1;
  font-size: 12px;
  color: #374151;
  font-family: monospace;
  word-break: break-all;
}

.entry-info {
  display: flex;
  gap: 8px;
  align-items: center;
  font-size: 11px;
  color: #6b7280;
}

.entry-method {
  background: #e5e7eb;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 500;
}

.entry-expired {
  color: #f59e0b;
  font-weight: 500;
}

.refresh-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.refresh-btn:hover {
  background: #e5e7eb;
}

.debug-trigger {
  position: fixed;
  bottom: 20px;
  left: 20px;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: #3b82f6;
  color: white;
  border: none;
  font-size: 20px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
  z-index: 999;
  transition: all 0.3s ease;
}

.debug-trigger:hover {
  background: #2563eb;
  transform: scale(1.1);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .cache-debugger {
    width: calc(100vw - 40px);
    right: 20px;
    left: 20px;
  }
  
  .cache-summary {
    grid-template-columns: 1fr;
  }
  
  .cache-actions {
    flex-direction: column;
  }
  
  .action-btn {
    width: 100%;
  }
}

/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
  .cache-debugger {
    background: #1f2937;
    border-color: #374151;
    color: #f9fafb;
  }
  
  .debugger-header {
    background: #374151;
    border-bottom-color: #4b5563;
  }
  
  .debugger-header h3 {
    color: #f9fafb;
  }
  
  .close-btn {
    color: #d1d5db;
  }
  
  .close-btn:hover {
    color: #f9fafb;
  }
  
  .summary-item {
    background: #374151;
  }
  
  .summary-item .label {
    color: #d1d5db;
  }
  
  .summary-item .value {
    color: #f9fafb;
  }
  
  .action-btn {
    background: #374151;
    border-color: #4b5563;
    color: #f9fafb;
  }
  
  .action-btn:hover {
    background: #4b5563;
  }
  
  .cache-section {
    border-color: #4b5563;
  }
  
  .section-header {
    background: #374151;
  }
  
  .section-header:hover {
    background: #4b5563;
  }
  
  .section-header h4 {
    color: #f9fafb;
  }
  
  .cache-entry {
    background: #374151;
  }
  
  .cache-entry.expired {
    background: #451a03;
  }
  
  .entry-url {
    color: #f9fafb;
  }
  
  .entry-info {
    color: #d1d5db;
  }
  
  .entry-method {
    background: #4b5563;
    color: #f9fafb;
  }
}
</style>
