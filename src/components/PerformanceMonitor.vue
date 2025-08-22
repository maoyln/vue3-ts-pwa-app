<template>
  <div class="performance-monitor">
    <!-- 性能指标显示 -->
    <div v-if="showMetrics && performanceData" class="metrics-panel">
      <div class="metrics-header">
        <h3>性能指标</h3>
        <button @click="toggleMetrics" class="toggle-btn">{{ showDetails ? '简化' : '详细' }}</button>
      </div>
      
      <div class="metrics-content">
        <!-- 核心 Web Vitals -->
        <div class="vitals-section">
          <h4>Core Web Vitals</h4>
          <div class="vitals-grid">
            <div class="vital-item" :class="getVitalStatus('lcp')">
              <div class="vital-label">LCP</div>
              <div class="vital-value">{{ formatMs(performanceData.lcp) }}</div>
              <div class="vital-description">最大内容绘制</div>
            </div>
            <div class="vital-item" :class="getVitalStatus('fid')">
              <div class="vital-label">FID</div>
              <div class="vital-value">{{ formatMs(performanceData.fid) }}</div>
              <div class="vital-description">首次输入延迟</div>
            </div>
            <div class="vital-item" :class="getVitalStatus('cls')">
              <div class="vital-label">CLS</div>
              <div class="vital-value">{{ performanceData.cls?.toFixed(3) || 'N/A' }}</div>
              <div class="vital-description">累积布局偏移</div>
            </div>
          </div>
        </div>
        
        <!-- 详细指标 -->
        <div v-if="showDetails" class="detailed-metrics">
          <div class="metrics-row">
            <div class="metric-item">
              <span class="metric-label">TTFB:</span>
              <span class="metric-value">{{ formatMs(performanceData.ttfb) }}</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">FCP:</span>
              <span class="metric-value">{{ formatMs(performanceData.fcp) }}</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">TTI:</span>
              <span class="metric-value">{{ formatMs(performanceData.tti) }}</span>
            </div>
          </div>
          
          <div class="metrics-row">
            <div class="metric-item">
              <span class="metric-label">内存使用:</span>
              <span class="metric-value">{{ formatBytes(memoryUsage) }}</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">缓存命中率:</span>
              <span class="metric-value">{{ cacheHitRate }}%</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">网络类型:</span>
              <span class="metric-value">{{ networkType }}</span>
            </div>
          </div>
        </div>
        
        <!-- 性能建议 -->
        <div v-if="suggestions.length > 0" class="suggestions">
          <h4>性能建议</h4>
          <ul>
            <li v-for="suggestion in suggestions" :key="suggestion.id" class="suggestion-item">
              <span class="suggestion-icon" :class="suggestion.priority">{{ suggestion.icon }}</span>
              <span class="suggestion-text">{{ suggestion.text }}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
    
    <!-- 性能警告 -->
    <Transition name="warning-slide">
      <div v-if="showWarning" class="performance-warning">
        <div class="warning-content">
          <span class="warning-icon">⚠️</span>
          <span class="warning-text">{{ warningMessage }}</span>
          <button @click="dismissWarning" class="warning-dismiss">✕</button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

// 接口定义
interface PerformanceData {
  lcp: number | null
  fid: number | null
  cls: number | null
  ttfb: number | null
  fcp: number | null
  tti: number | null
  timestamp: number
}

interface PerformanceSuggestion {
  id: string
  text: string
  icon: string
  priority: 'high' | 'medium' | 'low'
}

// 响应式数据
const showMetrics = ref(false)
const showDetails = ref(false)
const showWarning = ref(false)
const warningMessage = ref('')
const performanceData = ref<PerformanceData | null>(null)
const memoryUsage = ref(0)
const cacheHitRate = ref(0)
const networkType = ref('unknown')
const suggestions = ref<PerformanceSuggestion[]>([])

// 计算属性
const vitalsThresholds = {
  lcp: { good: 2500, needs_improvement: 4000 },
  fid: { good: 100, needs_improvement: 300 },
  cls: { good: 0.1, needs_improvement: 0.25 }
}

// 获取 Vital 状态
const getVitalStatus = (vital: keyof typeof vitalsThresholds) => {
  const value = performanceData.value?.[vital]
  if (value === null || value === undefined) return 'unknown'
  
  const thresholds = vitalsThresholds[vital]
  if (value <= thresholds.good) return 'good'
  if (value <= thresholds.needs_improvement) return 'needs-improvement'
  return 'poor'
}

// 格式化函数
const formatMs = (ms: number | null) => {
  if (ms === null || ms === undefined) return 'N/A'
  if (ms < 1000) return `${Math.round(ms)}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 收集性能数据
const collectPerformanceData = (): Promise<PerformanceData> => {
  return new Promise((resolve) => {
    const data: PerformanceData = {
      lcp: null,
      fid: null,
      cls: null,
      ttfb: null,
      fcp: null,
      tti: null,
      timestamp: Date.now()
    }

    // 使用 Performance Observer API 收集 Web Vitals
    if ('PerformanceObserver' in window) {
      // LCP (Largest Contentful Paint)
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1] as any
        data.lcp = lastEntry.startTime
      })
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true })

      // FID (First Input Delay)
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry: any) => {
          data.fid = entry.processingStart - entry.startTime
        })
      })
      fidObserver.observe({ type: 'first-input', buffered: true })

      // CLS (Cumulative Layout Shift)
      let clsValue = 0
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value
          }
        })
        data.cls = clsValue
      })
      clsObserver.observe({ type: 'layout-shift', buffered: true })
    }

    // 使用 Navigation Timing API
    if ('performance' in window && performance.timing) {
      const timing = performance.timing
      data.ttfb = timing.responseStart - timing.navigationStart
      
      // 使用 Performance API 获取 Paint Timing
      if (performance.getEntriesByType) {
        const paintEntries = performance.getEntriesByType('paint')
        const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint')
        if (fcpEntry) {
          data.fcp = fcpEntry.startTime
        }
      }
    }

    // 模拟 TTI (实际项目中可以使用 lighthouse 或其他工具)
    setTimeout(() => {
      data.tti = performance.now()
      resolve(data)
    }, 100)
  })
}

// 收集内存使用情况
const collectMemoryUsage = () => {
  if ('memory' in performance) {
    const memory = (performance as any).memory
    memoryUsage.value = memory.usedJSHeapSize
  }
}

// 获取网络信息
const getNetworkInfo = () => {
  if ('connection' in navigator) {
    const connection = (navigator as any).connection
    networkType.value = connection.effectiveType || connection.type || 'unknown'
  }
}

// 计算缓存命中率
const calculateCacheHitRate = async () => {
  try {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      // 向 Service Worker 请求缓存统计
      const channel = new MessageChannel()
      
      channel.port1.onmessage = (event) => {
        const { hits, total } = event.data
        if (total > 0) {
          cacheHitRate.value = Math.round((hits / total) * 100)
        }
      }
      
      navigator.serviceWorker.controller.postMessage({
        type: 'GET_CACHE_STATS'
      }, [channel.port2])
    }
  } catch (error) {
    console.warn('无法获取缓存统计:', error)
  }
}

// 生成性能建议
const generateSuggestions = () => {
  const newSuggestions: PerformanceSuggestion[] = []
  
  if (performanceData.value) {
    const data = performanceData.value
    
    // LCP 建议
    if (data.lcp && data.lcp > 4000) {
      newSuggestions.push({
        id: 'lcp-slow',
        text: '最大内容绘制时间过长，考虑优化图片大小和服务器响应时间',
        icon: '🐌',
        priority: 'high'
      })
    }
    
    // FID 建议
    if (data.fid && data.fid > 300) {
      newSuggestions.push({
        id: 'fid-slow',
        text: '首次输入延迟过长，考虑减少主线程阻塞时间',
        icon: '⏱️',
        priority: 'high'
      })
    }
    
    // CLS 建议
    if (data.cls && data.cls > 0.25) {
      newSuggestions.push({
        id: 'cls-high',
        text: '布局偏移过多，为图片和广告预留空间',
        icon: '📐',
        priority: 'medium'
      })
    }
  }
  
  // 内存使用建议
  if (memoryUsage.value > 50 * 1024 * 1024) { // 50MB
    newSuggestions.push({
      id: 'memory-high',
      text: '内存使用较高，考虑清理未使用的数据',
      icon: '💾',
      priority: 'medium'
    })
  }
  
  // 缓存命中率建议
  if (cacheHitRate.value < 70) {
    newSuggestions.push({
      id: 'cache-low',
      text: '缓存命中率较低，考虑优化缓存策略',
      icon: '📦',
      priority: 'low'
    })
  }
  
  suggestions.value = newSuggestions
}

// 显示性能警告
const showPerformanceWarning = (message: string) => {
  warningMessage.value = message
  showWarning.value = true
  
  // 5秒后自动消失
  setTimeout(() => {
    showWarning.value = false
  }, 5000)
}

// 监控性能变化
const monitorPerformance = () => {
  // 监控长任务
  if ('PerformanceObserver' in window) {
    const longTaskObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      entries.forEach((entry) => {
        if (entry.duration > 50) { // 超过50ms的任务
          showPerformanceWarning(`检测到长任务: ${Math.round(entry.duration)}ms`)
        }
      })
    })
    
    try {
      longTaskObserver.observe({ type: 'longtask', buffered: true })
    } catch (e) {
      console.warn('Long Task API 不支持')
    }
  }
  
  // 监控内存使用
  setInterval(() => {
    collectMemoryUsage()
    
    // 内存使用过高警告
    if (memoryUsage.value > 100 * 1024 * 1024) { // 100MB
      showPerformanceWarning('内存使用过高，可能影响性能')
    }
  }, 10000) // 每10秒检查一次
}

// 切换指标显示
const toggleMetrics = () => {
  showDetails.value = !showDetails.value
}

// 关闭警告
const dismissWarning = () => {
  showWarning.value = false
}

// 初始化性能监控
const initPerformanceMonitoring = async () => {
  try {
    // 收集初始性能数据
    performanceData.value = await collectPerformanceData()
    
    // 收集其他信息
    collectMemoryUsage()
    getNetworkInfo()
    await calculateCacheHitRate()
    
    // 生成建议
    generateSuggestions()
    
    // 开始监控
    monitorPerformance()
    
    console.log('性能监控已启动')
  } catch (error) {
    console.error('性能监控初始化失败:', error)
  }
}

// 生命周期
onMounted(() => {
  // 检查是否在开发模式下显示性能指标
  const isDevelopment = process.env.NODE_ENV === 'development'
  const showDebug = new URLSearchParams(window.location.search).has('debug')
  
  showMetrics.value = isDevelopment || showDebug
  
  // 延迟初始化，避免影响页面加载性能
  setTimeout(initPerformanceMonitoring, 1000)
})

// 暴露方法给父组件
defineExpose({
  showMetrics: () => { showMetrics.value = true },
  hideMetrics: () => { showMetrics.value = false },
  getPerformanceData: () => performanceData.value,
  refreshData: initPerformanceMonitoring
})
</script>

<style scoped>
.performance-monitor {
  position: relative;
  z-index: 998;
}

/* 性能指标面板 */
.metrics-panel {
  position: fixed;
  top: 60px;
  left: 20px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  z-index: 999;
  min-width: 300px;
  max-width: 400px;
}

.metrics-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
}

.metrics-header h3 {
  margin: 0;
  font-size: 16px;
  color: #1f2937;
}

.toggle-btn {
  background: #f3f4f6;
  color: #374151;
  border: none;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.toggle-btn:hover {
  background: #e5e7eb;
}

.metrics-content {
  padding: 16px 20px;
}

/* Core Web Vitals */
.vitals-section h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #374151;
}

.vitals-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.vital-item {
  text-align: center;
  padding: 12px 8px;
  border-radius: 8px;
  border: 2px solid;
  transition: all 0.2s ease;
}

.vital-item.good {
  border-color: #10b981;
  background: #ecfdf5;
}

.vital-item.needs-improvement {
  border-color: #f59e0b;
  background: #fffbeb;
}

.vital-item.poor {
  border-color: #ef4444;
  background: #fef2f2;
}

.vital-item.unknown {
  border-color: #6b7280;
  background: #f9fafb;
}

.vital-label {
  font-weight: 600;
  font-size: 12px;
  color: #374151;
  margin-bottom: 4px;
}

.vital-value {
  font-weight: 700;
  font-size: 16px;
  margin-bottom: 2px;
}

.vital-item.good .vital-value {
  color: #059669;
}

.vital-item.needs-improvement .vital-value {
  color: #d97706;
}

.vital-item.poor .vital-value {
  color: #dc2626;
}

.vital-item.unknown .vital-value {
  color: #6b7280;
}

.vital-description {
  font-size: 10px;
  color: #6b7280;
  line-height: 1.2;
}

/* 详细指标 */
.detailed-metrics {
  margin-bottom: 20px;
}

.metrics-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  gap: 12px;
}

.metric-item {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 8px;
  background: #f9fafb;
  border-radius: 4px;
  font-size: 12px;
}

.metric-label {
  color: #6b7280;
  font-weight: 500;
}

.metric-value {
  color: #1f2937;
  font-weight: 600;
}

/* 性能建议 */
.suggestions h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #374151;
}

.suggestions ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.suggestion-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 8px 0;
  border-bottom: 1px solid #f3f4f6;
}

.suggestion-item:last-child {
  border-bottom: none;
}

.suggestion-icon {
  font-size: 16px;
  flex-shrink: 0;
  margin-top: 1px;
}

.suggestion-icon.high {
  filter: hue-rotate(0deg);
}

.suggestion-icon.medium {
  filter: hue-rotate(30deg);
}

.suggestion-icon.low {
  filter: hue-rotate(60deg);
}

.suggestion-text {
  font-size: 12px;
  color: #374151;
  line-height: 1.4;
}

/* 性能警告 */
.performance-warning {
  position: fixed;
  bottom: 20px;
  left: 20px;
  background: #fef3c7;
  border: 1px solid #f59e0b;
  color: #92400e;
  padding: 12px 16px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.2);
  z-index: 1000;
  max-width: 300px;
}

.warning-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.warning-icon {
  font-size: 16px;
  flex-shrink: 0;
}

.warning-text {
  flex: 1;
  font-size: 13px;
  line-height: 1.4;
}

.warning-dismiss {
  background: none;
  border: none;
  color: #92400e;
  cursor: pointer;
  padding: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s ease;
}

.warning-dismiss:hover {
  background: rgba(146, 64, 14, 0.1);
}

/* 动画效果 */
.warning-slide-enter-active,
.warning-slide-leave-active {
  transition: all 0.3s ease;
}

.warning-slide-enter-from {
  transform: translateX(-100%);
  opacity: 0;
}

.warning-slide-leave-to {
  transform: translateX(-100%);
  opacity: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .metrics-panel {
    top: 10px;
    left: 10px;
    right: 10px;
    min-width: auto;
    max-width: none;
  }
  
  .vitals-grid {
    grid-template-columns: 1fr;
    gap: 8px;
  }
  
  .vital-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    text-align: left;
  }
  
  .vital-description {
    display: none;
  }
  
  .metrics-row {
    flex-direction: column;
    gap: 4px;
  }
  
  .performance-warning {
    bottom: 10px;
    left: 10px;
    right: 10px;
    max-width: none;
  }
}

/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
  .metrics-panel {
    background: rgba(31, 41, 55, 0.95);
    border-color: #374151;
  }
  
  .metrics-header {
    border-bottom-color: #374151;
  }
  
  .metrics-header h3 {
    color: #f9fafb;
  }
  
  .toggle-btn {
    background: #374151;
    color: #d1d5db;
  }
  
  .toggle-btn:hover {
    background: #4b5563;
  }
  
  .vitals-section h4,
  .suggestions h4 {
    color: #f9fafb;
  }
  
  .vital-label,
  .vital-description {
    color: #d1d5db;
  }
  
  .metric-item {
    background: #374151;
  }
  
  .metric-label {
    color: #9ca3af;
  }
  
  .metric-value {
    color: #f9fafb;
  }
  
  .suggestion-text {
    color: #d1d5db;
  }
  
  .performance-warning {
    background: #451a03;
    border-color: #92400e;
    color: #fbbf24;
  }
  
  .warning-dismiss {
    color: #fbbf24;
  }
  
  .warning-dismiss:hover {
    background: rgba(251, 191, 36, 0.1);
  }
}
</style>
