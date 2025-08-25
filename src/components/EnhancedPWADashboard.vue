<!--
 * @Author: maoyl maoyl@glodon.com
 * @Date: 2025-08-24 13:40:00
 * @LastEditors: maoyl maoyl@glodon.com
 * @LastEditTime: 2025-08-24 13:40:00
 * @FilePath: /my-vue3-ts-pwa-app/src/components/EnhancedPWADashboard.vue
 * @Description: 增强的PWA控制面板组件
-->

<template>
  <div class="pwa-dashboard">
    <!-- 英雄标题区域 -->
    <div class="dashboard-hero">
      <div class="hero-content">
        <div class="hero-badge">
          <span class="badge-icon">⚡</span>
          <span class="badge-text">PWA 管理中心</span>
        </div>
        <h1 class="hero-title">
          应用控制面板
          <span class="title-accent">Dashboard</span>
        </h1>
        <p class="hero-desc">
          实时监控和管理您的渐进式Web应用状态
        </p>
      </div>
      <div class="hero-actions">
        <button @click="refreshStats" class="hero-btn primary" :disabled="refreshing">
          <span class="btn-icon">🔄</span>
          {{ refreshing ? '刷新中...' : '刷新数据' }}
        </button>
        <button @click="toggleExpanded" class="hero-btn secondary">
          <span class="btn-icon">{{ expanded ? '📉' : '📊' }}</span>
          {{ expanded ? '收起详情' : '展开详情' }}
        </button>
      </div>
    </div>

    <!-- 状态概览 -->
    <div class="status-overview">
      <div class="metric-card network" :class="{ online: pwaState.isOnline, offline: !pwaState.isOnline }">
        <div class="card-header">
          <div class="metric-icon">
            <span class="icon-bg">{{ pwaState.isOnline ? '🌐' : '📡' }}</span>
          </div>
          <div class="metric-status">
            <span class="status-dot" :class="{ online: pwaState.isOnline, offline: !pwaState.isOnline }"></span>
            <span class="status-text">{{ pwaState.isOnline ? '在线' : '离线' }}</span>
          </div>
        </div>
        <div class="card-content">
          <h3 class="metric-title">网络连接</h3>
          <div class="metric-value">
            {{ pwaState.networkQuality.speed === 'fast' ? '高速网络' : 
               pwaState.networkQuality.speed === 'slow' ? '慢速网络' : '网络断开' }}
          </div>
          <div class="metric-detail">
            <span v-if="pwaState.networkQuality.latency > 0" class="latency">
              延迟: {{ pwaState.networkQuality.latency }}ms
            </span>
            <span v-else class="no-data">无网络数据</span>
          </div>
        </div>
      </div>

      <div class="metric-card install" :class="{ installed: pwaState.isInstalled }">
        <div class="card-header">
          <div class="metric-icon">
            <span class="icon-bg">{{ pwaState.isInstalled ? '📱' : '💻' }}</span>
          </div>
          <div class="metric-status">
            <span class="status-dot" :class="{ installed: pwaState.isInstalled }"></span>
            <span class="status-text">{{ pwaState.isInstalled ? '已安装' : '未安装' }}</span>
          </div>
        </div>
        <div class="card-content">
          <h3 class="metric-title">应用安装</h3>
          <div class="metric-value">
            {{ pwaState.isInstalled ? '桌面应用' : '浏览器访问' }}
          </div>
          <div class="metric-actions">
            <button 
              v-if="pwaState.installPromptEvent && !pwaState.isInstalled" 
              @click="showInstallPrompt"
              class="action-btn primary"
            >
              <span class="btn-icon">📥</span>
              立即安装
            </button>
            <span v-else-if="pwaState.isInstalled" class="success-text">
              ✅ 已安装到设备
            </span>
            <span v-else class="info-text">
              ℹ️ 暂不支持安装
            </span>
          </div>
        </div>
      </div>

      <div class="metric-card update" :class="{ 'has-update': pwaState.isUpdateAvailable }">
        <div class="card-header">
          <div class="metric-icon">
            <span class="icon-bg">{{ pwaState.isUpdateAvailable ? '🔄' : '✅' }}</span>
          </div>
          <div class="metric-status">
            <span class="status-dot" :class="{ update: pwaState.isUpdateAvailable, latest: !pwaState.isUpdateAvailable }"></span>
            <span class="status-text">{{ pwaState.isUpdateAvailable ? '有更新' : '最新版' }}</span>
          </div>
        </div>
        <div class="card-content">
          <h3 class="metric-title">版本状态</h3>
          <div class="metric-value">
            {{ pwaState.isUpdateAvailable ? '发现新版本' : '当前最新' }}
          </div>
          <div class="metric-actions">
            <button 
              v-if="pwaState.isUpdateAvailable" 
              @click="forceUpdate"
              class="action-btn primary"
            >
              <span class="btn-icon">⬆️</span>
              立即更新
            </button>
            <span v-else class="success-text">
              ✅ 版本最新
            </span>
          </div>
        </div>
      </div>

      <div class="metric-card cache">
        <div class="card-header">
          <div class="metric-icon">
            <span class="icon-bg">💾</span>
          </div>
          <div class="metric-status">
            <span class="status-dot active"></span>
            <span class="status-text">活跃</span>
          </div>
        </div>
        <div class="card-content">
          <h3 class="metric-title">缓存存储</h3>
          <div class="metric-value">
            {{ pwaState.cacheStats.cacheCount }} 项缓存
          </div>
          <div class="metric-detail">
            <span class="cache-size">
              {{ formatBytes(pwaState.cacheStats.totalSize || 0) }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 详细信息面板 -->
    <div v-if="expanded" class="details-panel">
      <!-- HTTP缓存统计 -->
      <div class="detail-section">
        <div class="section-header">
          <h3 class="section-title">
            <span class="section-icon">🌐</span>
            HTTP 缓存统计
          </h3>
          <button @click="clearHttpCache" class="section-action">
            <span class="btn-icon">🗑️</span>
            清空缓存
          </button>
        </div>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon">📊</div>
            <div class="stat-info">
              <div class="stat-value">{{ httpCacheStats.size }}</div>
              <div class="stat-label">缓存项目</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">🔑</div>
            <div class="stat-info">
              <div class="stat-value">{{ httpCacheStats.keys.length }}</div>
              <div class="stat-label">缓存键值</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">⏱️</div>
            <div class="stat-info">
              <div class="stat-value">{{ formatTime(Date.now()) }}</div>
              <div class="stat-label">最后更新</div>
            </div>
          </div>
        </div>
        <div class="cache-keys">
          <h4 class="keys-title">缓存键值列表</h4>
          <div class="keys-list">
            <div v-for="key in httpCacheStats.keys.slice(0, 5)" :key="key" class="cache-key">
              <span class="key-icon">🔗</span>
              <span class="key-text">{{ key }}</span>
            </div>
            <div v-if="httpCacheStats.keys.length > 5" class="more-keys">
              还有 {{ httpCacheStats.keys.length - 5 }} 个缓存项...
            </div>
          </div>
        </div>
      </div>

      <!-- 性能指标 -->
      <div class="detail-section">
        <div class="section-header">
          <h3 class="section-title">
            <span class="section-icon">⚡</span>
            性能指标
          </h3>
        </div>
        <div class="performance-grid">
          <div class="perf-card">
            <div class="perf-header">
              <span class="perf-icon">🚀</span>
              <span class="perf-title">页面加载</span>
            </div>
            <div class="perf-value">{{ formatTime(Date.now()) }}</div>
            <div class="perf-desc">从启动到现在</div>
          </div>
          <div class="perf-card">
            <div class="perf-header">
              <span class="perf-icon">🎯</span>
              <span class="perf-title">内存使用</span>
            </div>
            <div class="perf-value">{{ getMemoryUsage() }}</div>
            <div class="perf-desc">当前内存占用</div>
          </div>
          <div class="perf-card">
            <div class="perf-header">
              <span class="perf-icon">📡</span>
              <span class="perf-title">网络质量</span>
            </div>
            <div class="perf-value">{{ pwaState.networkQuality.speed }}</div>
            <div class="perf-desc">连接速度评级</div>
          </div>
        </div>
      </div>

      <!-- 操作面板 -->
      <div class="detail-section">
        <div class="section-header">
          <h3 class="section-title">
            <span class="section-icon">🛠️</span>
            操作面板
          </h3>
        </div>
        <div class="actions-grid">
          <button @click="clearAllCaches" class="action-card danger">
            <div class="action-icon">🗑️</div>
            <div class="action-content">
              <div class="action-title">清空所有缓存</div>
              <div class="action-desc">删除所有缓存数据</div>
            </div>
          </button>
          <button @click="() => precacheResources([])" class="action-card primary">
            <div class="action-icon">📥</div>
            <div class="action-content">
              <div class="action-title">预缓存资源</div>
              <div class="action-desc">预加载重要资源</div>
            </div>
          </button>
          <button @click="exportConfig" class="action-card secondary">
            <div class="action-icon">📤</div>
            <div class="action-content">
              <div class="action-title">导出配置</div>
              <div class="action-desc">下载当前配置</div>
            </div>
          </button>
          <button @click="resetApp" class="action-card warning">
            <div class="action-icon">🔄</div>
            <div class="action-content">
              <div class="action-title">重置应用</div>
              <div class="action-desc">恢复默认设置</div>
            </div>
          </button>
        </div>
      </div>

      <!-- 配置选项 -->
      <div class="detail-section">
        <div class="section-header">
          <h3 class="section-title">
            <span class="section-icon">⚙️</span>
            配置选项
          </h3>
        </div>
        <div class="config-form">
          <div class="config-group">
            <label class="config-label">
              <input 
                type="checkbox" 
                v-model="localConfig.cache.enabled"
                @change="updatePWAConfig"
                class="config-checkbox"
              >
              <span class="checkbox-custom"></span>
              <span class="label-text">启用缓存功能</span>
            </label>
            <p class="config-desc">开启后将自动缓存API响应数据</p>
          </div>
          
          <div class="config-group">
            <label class="config-label">
              <input 
                type="checkbox" 
                v-model="localConfig.sync.enabled"
                @change="updatePWAConfig"
                class="config-checkbox"
              >
              <span class="checkbox-custom"></span>
              <span class="label-text">启用离线同步</span>
            </label>
            <p class="config-desc">离线时自动同步数据变更</p>
          </div>
          
          <div class="config-group">
            <label class="config-label">
              <input 
                type="checkbox" 
                v-model="localConfig.notifications.enabled"
                @change="updatePWAConfig"
                class="config-checkbox"
              >
              <span class="checkbox-custom"></span>
              <span class="label-text">启用推送通知</span>
            </label>
            <p class="config-desc">接收应用更新和重要消息通知</p>
          </div>
          
          <div class="config-group">
            <label class="config-label">
              <input 
                type="checkbox" 
                v-model="localConfig.performance.monitoring"
                @change="updatePWAConfig"
                class="config-checkbox"
              >
              <span class="checkbox-custom"></span>
              <span class="label-text">性能监控</span>
            </label>
            <p class="config-desc">监控应用性能指标和用户体验</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { usePWA } from '../utils/enhancedPWAManager'

// PWA管理器
const { 
  state: pwaState, 
  showInstallPrompt, 
  forceUpdate, 
  clearAllCaches, 
  precacheResources,
  updateConfig
} = usePWA()

// 组件状态
const expanded = ref(false)
const refreshing = ref(false)
const httpCacheStats = ref<{ size: number; keys: string[] }>({ size: 0, keys: [] })

// 本地配置
const localConfig = reactive({
  cache: { 
    enabled: true,
    maxSize: 100,
    maxAge: 3600000,
    cleanupInterval: 300000,
    strategies: {}
  },
  sync: { 
    enabled: true,
    retryInterval: 1000,
    maxRetries: 3,
    batchSize: 10
  },
  notifications: { 
    enabled: false,
    permission: 'default' as NotificationPermission
  },
  performance: { 
    monitoring: true,
    metricsCollection: true
  }
})

// 切换展开状态
const toggleExpanded = () => {
  expanded.value = !expanded.value
}

// 刷新统计数据
const refreshStats = async () => {
  refreshing.value = true
  try {
    // 模拟刷新延迟
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 更新HTTP缓存统计
    const cacheKeys = ['api/users', 'api/posts', 'api/comments', 'api/albums', 'weather/current']
    httpCacheStats.value = {
      size: cacheKeys.length,
      keys: cacheKeys
    }
  } finally {
    refreshing.value = false
  }
}

// 清空HTTP缓存
const clearHttpCache = () => {
  httpCacheStats.value = { size: 0, keys: [] }
  console.log('HTTP缓存已清空')
}

// 更新PWA配置
const updatePWAConfig = () => {
  updateConfig(localConfig)
}

// 导出配置
const exportConfig = () => {
  const config = JSON.stringify(localConfig, null, 2)
  const blob = new Blob([config], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'pwa-config.json'
  a.click()
  URL.revokeObjectURL(url)
}

// 重置应用
const resetApp = () => {
  if (confirm('确定要重置应用吗？这将清除所有数据和配置。')) {
    localStorage.clear()
    sessionStorage.clear()
    location.reload()
  }
}

// 格式化字节数
const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 格式化时间
const formatTime = (timestamp: number): string => {
  return new Date(timestamp).toLocaleTimeString()
}

// 获取内存使用情况
const getMemoryUsage = (): string => {
  if ('memory' in performance) {
    const memory = (performance as any).memory
    return formatBytes(memory.usedJSHeapSize)
  }
  return '不支持'
}

// 组件挂载时初始化
onMounted(() => {
  refreshStats()
})
</script>

<style scoped>
.pwa-dashboard {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 0;
}

/* 英雄区域 */
.dashboard-hero {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 80px 40px 60px;
  text-align: center;
  color: white;
  position: relative;
  overflow: hidden;
}

.dashboard-hero::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="0.5"/></pattern></defs><rect width="100" height="100" fill="url(%23grid)"/></svg>');
  opacity: 0.3;
}

.hero-content {
  position: relative;
  z-index: 2;
  max-width: 800px;
  margin: 0 auto 40px;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.15);
  padding: 8px 20px;
  border-radius: 25px;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 24px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.badge-icon {
  font-size: 16px;
}

.hero-title {
  font-size: 3.5rem;
  font-weight: 800;
  line-height: 1.1;
  margin-bottom: 20px;
  letter-spacing: -0.02em;
}

.title-accent {
  background: linear-gradient(135deg, #ffeaa7 0%, #fab1a0 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  display: block;
  font-size: 0.8em;
  margin-top: 8px;
}

.hero-desc {
  font-size: 1.2rem;
  line-height: 1.6;
  opacity: 0.9;
  margin-bottom: 0;
}

.hero-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
  position: relative;
  z-index: 2;
}

.hero-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 28px;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;
}

.hero-btn.primary {
  background: linear-gradient(135deg, #ffeaa7 0%, #fab1a0 100%);
  color: #2d3436;
}

.hero-btn.primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(255, 234, 167, 0.4);
}

.hero-btn.secondary {
  background: rgba(255, 255, 255, 0.15);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(10px);
}

.hero-btn.secondary:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: translateY(-2px);
}

.hero-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
}

.btn-icon {
  font-size: 18px;
}

/* 状态概览 */
.status-overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
  padding: 40px;
  background: white;
  margin: -30px 40px 0;
  border-radius: 20px 20px 0 0;
  box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.1);
  position: relative;
  z-index: 3;
}

.metric-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 24px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.metric-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
}

.metric-card.network.online {
  border-left: 4px solid #10b981;
}

.metric-card.network.offline {
  border-left: 4px solid #ef4444;
}

.metric-card.install.installed {
  border-left: 4px solid #3b82f6;
}

.metric-card.update.has-update {
  border-left: 4px solid #f59e0b;
}

.metric-card.cache {
  border-left: 4px solid #8b5cf6;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.metric-icon {
  width: 50px;
  height: 50px;
  border-radius: 12px;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.metric-status {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #d1d5db;
}

.status-dot.online { background: #10b981; }
.status-dot.offline { background: #ef4444; }
.status-dot.installed { background: #3b82f6; }
.status-dot.update { background: #f59e0b; }
.status-dot.latest { background: #10b981; }
.status-dot.active { background: #8b5cf6; }

.status-text {
  font-size: 12px;
  font-weight: 500;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.card-content {
  flex: 1;
}

.metric-title {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 8px 0;
}

.metric-value {
  font-size: 16px;
  color: #374151;
  margin-bottom: 12px;
}

.metric-detail {
  font-size: 14px;
  color: #6b7280;
}

.metric-actions {
  margin-top: 16px;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn.primary {
  background: #3b82f6;
  color: white;
}

.action-btn.primary:hover {
  background: #2563eb;
  transform: translateY(-1px);
}

.success-text {
  color: #10b981;
  font-size: 14px;
  font-weight: 500;
}

.info-text {
  color: #6b7280;
  font-size: 14px;
}

/* 详细信息面板 */
.details-panel {
  background: white;
  padding: 40px;
  margin: 0 40px;
  border-radius: 0 0 20px 20px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
}

.detail-section {
  margin-bottom: 40px;
}

.detail-section:last-child {
  margin-bottom: 0;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid #f3f4f6;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 20px;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.section-icon {
  font-size: 24px;
}

.section-action {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: 1px solid #d1d5db;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
  color: #374151;
}

.section-action:hover {
  background: #f9fafb;
  border-color: #9ca3af;
}

/* 统计网格 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
}

.stat-icon {
  font-size: 32px;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #6b7280;
}

/* 缓存键值 */
.cache-keys {
  background: #f8fafc;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid #e5e7eb;
}

.keys-title {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 16px 0;
}

.keys-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.cache-key {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: white;
  border-radius: 8px;
  font-size: 14px;
}

.key-icon {
  font-size: 16px;
}

.key-text {
  color: #374151;
  font-family: monospace;
}

.more-keys {
  padding: 8px 12px;
  color: #6b7280;
  font-size: 14px;
  font-style: italic;
  text-align: center;
}

/* 性能网格 */
.performance-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.perf-card {
  padding: 24px;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  text-align: center;
}

.perf-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 16px;
}

.perf-icon {
  font-size: 24px;
}

.perf-title {
  font-size: 16px;
  font-weight: 600;
  color: #374151;
}

.perf-value {
  font-size: 28px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 8px;
}

.perf-desc {
  font-size: 14px;
  color: #6b7280;
}

/* 操作网格 */
.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.action-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  border: 2px solid transparent;
  border-radius: 12px;
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: left;
}

.action-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.action-card.primary {
  border-color: #3b82f6;
}

.action-card.primary:hover {
  background: #eff6ff;
}

.action-card.secondary {
  border-color: #6b7280;
}

.action-card.secondary:hover {
  background: #f9fafb;
}

.action-card.danger {
  border-color: #ef4444;
}

.action-card.danger:hover {
  background: #fef2f2;
}

.action-card.warning {
  border-color: #f59e0b;
}

.action-card.warning:hover {
  background: #fffbeb;
}

.action-icon {
  font-size: 32px;
  flex-shrink: 0;
}

.action-content {
  flex: 1;
}

.action-title {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 4px;
}

.action-desc {
  font-size: 14px;
  color: #6b7280;
}

/* 配置表单 */
.config-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.config-group {
  padding: 20px;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
}

.config-label {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
  color: #111827;
}

.config-checkbox {
  display: none;
}

.checkbox-custom {
  width: 20px;
  height: 20px;
  border: 2px solid #d1d5db;
  border-radius: 4px;
  background: white;
  position: relative;
  transition: all 0.2s ease;
}

.config-checkbox:checked + .checkbox-custom {
  background: #3b82f6;
  border-color: #3b82f6;
}

.config-checkbox:checked + .checkbox-custom::after {
  content: '✓';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-size: 12px;
  font-weight: bold;
}

.label-text {
  flex: 1;
}

.config-desc {
  margin: 8px 0 0 32px;
  font-size: 14px;
  color: #6b7280;
  line-height: 1.5;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .status-overview {
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
    padding: 30px;
    margin: -20px 30px 0;
  }
  
  .details-panel {
    padding: 30px;
    margin: 0 30px;
  }
  
  .stats-grid,
  .performance-grid,
  .actions-grid {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  }
}

@media (max-width: 768px) {
  .dashboard-hero {
    padding: 60px 20px 40px;
  }
  
  .hero-title {
    font-size: 2.5rem;
  }
  
  .hero-desc {
    font-size: 1rem;
  }
  
  .hero-actions {
    flex-direction: column;
    align-items: center;
  }
  
  .hero-btn {
    width: 100%;
    max-width: 300px;
    justify-content: center;
  }
  
  .status-overview {
    grid-template-columns: 1fr;
    gap: 16px;
    padding: 20px;
    margin: -20px 20px 0;
  }
  
  .details-panel {
    padding: 20px;
    margin: 0 20px;
  }
  
  .section-header {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }
  
  .stats-grid,
  .performance-grid,
  .actions-grid {
    grid-template-columns: 1fr;
  }
  
  .metric-card {
    padding: 20px;
  }
  
  .card-header {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  
  .metric-icon {
    align-self: center;
  }
  
  .metric-status {
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .dashboard-hero {
    padding: 40px 16px 30px;
  }
  
  .hero-title {
    font-size: 2rem;
  }
  
  .status-overview {
    padding: 16px;
    margin: -16px 16px 0;
  }
  
  .details-panel {
    padding: 16px;
    margin: 0 16px;
  }
  
  .metric-card {
    padding: 16px;
  }
}
</style>