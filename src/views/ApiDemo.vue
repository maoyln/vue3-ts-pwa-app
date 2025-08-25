<!--
 * @Author: maoyl maoyl@glodon.com
 * @Date: 2025-08-24 12:55:00
 * @LastEditors: maoyl maoyl@glodon.com
 * @LastEditTime: 2025-08-24 12:55:00
 * @FilePath: /my-vue3-ts-pwa-app/src/views/ApiDemo.vue
 * @Description: API封装演示页面
-->

<template>
  <div class="api-demo">
    <!-- 英雄标题区域 -->
    <div class="demo-hero">
      <div class="hero-background">
        <div class="hero-pattern"></div>
      </div>
      <div class="hero-content">
        <div class="hero-badge">
          <span class="badge-icon">🚀</span>
          <span class="badge-text">HTTP Client Demo</span>
        </div>
        <h1 class="hero-title">
          Axios 封装演示
          <span class="title-gradient">API Showcase</span>
        </h1>
        <p class="hero-desc">
          展示现代化HTTP客户端的强大功能：智能缓存、自动重试、离线支持、性能监控
        </p>
        
        <!-- 网络状态卡片 -->
        <div class="network-card" :class="{ offline: !isOnline }">
          <div class="network-info">
            <div class="network-status">
              <span class="status-dot" :class="{ online: isOnline }"></span>
              <span class="status-text">{{ isOnline ? '网络在线' : '网络离线' }}</span>
            </div>
            <div v-if="networkQuality" class="network-details">
              <span class="quality-badge" :class="networkQuality.speed">
                {{ networkQuality.speed === 'fast' ? '🚀 高速' : '🐌 慢速' }}
              </span>
              <span class="latency">{{ networkQuality.latency }}ms</span>
            </div>
          </div>
          <button @click="checkNetwork" class="network-check-btn">
            <span class="btn-icon">📡</span>
            检测网络
          </button>
        </div>
      </div>
    </div>

    <!-- 功能演示区域 -->
    <div class="demo-sections">
      
      <!-- 基础请求演示 -->
      <section class="demo-section">
        <div class="section-header">
          <div class="section-title">
            <span class="section-icon">📡</span>
            <h2>基础请求演示</h2>
          </div>
          <div class="section-badge">Basic API</div>
        </div>
        <div class="section-content">
          <div class="demo-controls">
            <button @click="testBasicGet" :disabled="loading.basic" class="demo-btn primary">
              <span class="btn-icon">⬇️</span>
              <span class="btn-text">{{ loading.basic ? '请求中...' : 'GET 请求' }}</span>
              <span v-if="loading.basic" class="btn-spinner"></span>
            </button>
            <button @click="testBasicPost" :disabled="loading.basic" class="demo-btn success">
              <span class="btn-icon">⬆️</span>
              <span class="btn-text">{{ loading.basic ? '请求中...' : 'POST 请求' }}</span>
              <span v-if="loading.basic" class="btn-spinner"></span>
            </button>
            <button @click="testBasicError" :disabled="loading.basic" class="demo-btn danger">
              <span class="btn-icon">⚠️</span>
              <span class="btn-text">错误请求</span>
            </button>
          </div>
          <div v-if="results.basic" class="demo-result">
            <div class="result-header">
              <span class="result-icon">📋</span>
              <span class="result-title">响应结果</span>
              <button @click="results.basic = null" class="result-close">×</button>
            </div>
            <div class="result-content">
              <pre class="result-json">{{ JSON.stringify(results.basic, null, 2) }}</pre>
            </div>
          </div>
        </div>
      </section>

      <!-- 缓存策略演示 -->
      <section class="demo-section">
        <h2>📦 缓存策略演示</h2>
        <div class="demo-controls">
          <button @click="testCacheFirst" :disabled="loading.cache" class="demo-btn">
            缓存优先
          </button>
          <button @click="testNetworkFirst" :disabled="loading.cache" class="demo-btn">
            网络优先
          </button>
          <button @click="testCacheOnly" :disabled="loading.cache" class="demo-btn">
            仅缓存
          </button>
          <button @click="clearCache" class="demo-btn warning">
            清除缓存
          </button>
        </div>
        <div class="cache-info">
          <p>缓存统计: {{ cacheStats.size }} 个缓存项</p>
          <div class="cache-keys" v-if="cacheStats.keys.length > 0">
            <details>
              <summary>缓存键列表 ({{ cacheStats.keys.length }})</summary>
              <ul>
                <li v-for="key in cacheStats.keys" :key="key" class="cache-key">
                  {{ key }}
                </li>
              </ul>
            </details>
          </div>
        </div>
        <div v-if="results.cache" class="demo-result">
          <div class="result-meta">
            <span class="cache-status" :class="results.cache.fromCache ? 'cached' : 'network'">
              {{ results.cache.fromCache ? '📦 来自缓存' : '🌐 来自网络' }}
            </span>
            <span v-if="results.cache.offline" class="offline-indicator">📴 离线模式</span>
          </div>
          <pre>{{ JSON.stringify(results.cache, null, 2) }}</pre>
        </div>
      </section>

      <!-- 重试机制演示 -->
      <section class="demo-section">
        <h2>🔄 重试机制演示</h2>
        <div class="demo-controls">
          <button @click="testRetrySuccess" :disabled="loading.retry" class="demo-btn">
            重试成功
          </button>
          <button @click="testRetryFail" :disabled="loading.retry" class="demo-btn error">
            重试失败
          </button>
          <button @click="testCustomRetry" :disabled="loading.retry" class="demo-btn">
            自定义重试
          </button>
        </div>
        <div class="retry-logs" v-if="retryLogs.length > 0">
          <h4>重试日志:</h4>
          <ul>
            <li v-for="(log, index) in retryLogs" :key="index" class="retry-log">
              <span class="log-time">{{ log.time }}</span>
              <span class="log-message">{{ log.message }}</span>
            </li>
          </ul>
        </div>
        <div v-if="results.retry" class="demo-result">
          <pre>{{ JSON.stringify(results.retry, null, 2) }}</pre>
        </div>
      </section>

      <!-- 批量请求演示 -->
      <section class="demo-section">
        <h2>📊 批量请求演示</h2>
        <div class="demo-controls">
          <button @click="testParallelRequests" :disabled="loading.batch" class="demo-btn">
            并行请求
          </button>
          <button @click="testSeriesRequests" :disabled="loading.batch" class="demo-btn">
            串行请求
          </button>
        </div>
        <div v-if="results.batch" class="demo-result">
          <div class="batch-summary">
            <p>请求耗时: {{ batchDuration }}ms</p>
            <p>成功: {{ batchSuccess }} / {{ batchTotal }}</p>
          </div>
          <pre>{{ JSON.stringify(results.batch, null, 2) }}</pre>
        </div>
      </section>

      <!-- PWA离线演示 -->
      <section class="demo-section">
        <h2>📱 PWA离线演示</h2>
        <div class="demo-controls">
          <button @click="testOfflineSupport" :disabled="loading.offline" class="demo-btn">
            离线支持测试
          </button>
          <button @click="simulateOffline" class="demo-btn warning">
            {{ isSimulatingOffline ? '恢复在线' : '模拟离线' }}
          </button>
        </div>
        <div class="offline-tips">
          <p>💡 提示: 可以断开网络连接来测试真实的离线场景</p>
        </div>
        <div v-if="results.offline" class="demo-result">
          <pre>{{ JSON.stringify(results.offline, null, 2) }}</pre>
        </div>
      </section>

    </div>

    <!-- 全局加载状态 -->
    <div v-if="globalLoading" class="global-loading">
      <div class="loading-spinner"></div>
      <p>请求处理中...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { UserAPI, PostAPI, BatchAPI } from '../api'
import http from '../utils/http'
import { networkMonitor } from '../utils/pwaNetworkStrategy'

// 响应式数据
const isOnline = ref(navigator.onLine)
const isSimulatingOffline = ref(false)
const networkQuality = ref<any>(null)
const globalLoading = ref(false)

const loading = reactive({
  basic: false,
  cache: false,
  retry: false,
  batch: false,
  offline: false
})

const results = reactive({
  basic: null as any,
  cache: null as any,
  retry: null as any,
  batch: null as any,
  offline: null as any
})

const cacheStats = reactive({
  size: 0,
  keys: [] as string[]
})

const retryLogs = ref<Array<{ time: string; message: string }>>([])
const batchDuration = ref(0)
const batchSuccess = ref(0)
const batchTotal = ref(0)

// 计算属性 - 暂时注释掉未使用的计算属性
// const hasAnyLoading = computed(() => {
//   return Object.values(loading).some(Boolean)
// })

// 网络状态监听
onMounted(() => {
  networkMonitor.addListener((online) => {
    isOnline.value = online
  })
  
  updateCacheStats()
  checkNetwork()
})

// 检测网络质量
const checkNetwork = async () => {
  try {
    networkQuality.value = await networkMonitor.checkNetworkQuality()
  } catch (error) {
    console.error('网络检测失败:', error)
  }
}

// 更新缓存统计
const updateCacheStats = () => {
  const stats = http.getCacheStats()
  cacheStats.size = stats.size
  cacheStats.keys = stats.keys
}

// 添加重试日志
const addRetryLog = (message: string) => {
  retryLogs.value.unshift({
    time: new Date().toLocaleTimeString(),
    message
  })
  
  // 只保留最近10条日志
  if (retryLogs.value.length > 10) {
    retryLogs.value = retryLogs.value.slice(0, 10)
  }
}

// 基础请求演示
const testBasicGet = async () => {
  loading.basic = true
  try {
    const response = await UserAPI.getUsers()
    results.basic = {
      type: 'GET请求',
      success: response.success,
      dataCount: response.data?.length || 0,
      fromCache: response.fromCache,
      timestamp: new Date().toLocaleString()
    }
  } catch (error: any) {
    results.basic = {
      type: 'GET请求',
      error: error.message,
      timestamp: new Date().toLocaleString()
    }
  } finally {
    loading.basic = false
  }
}

const testBasicPost = async () => {
  loading.basic = true
  try {
    const response = await UserAPI.createUser({
      name: 'Test User',
      username: 'testuser',
      email: 'test@example.com'
    })
    results.basic = {
      type: 'POST请求',
      success: response.success,
      data: response.data,
      timestamp: new Date().toLocaleString()
    }
  } catch (error: any) {
    results.basic = {
      type: 'POST请求',
      error: error.message,
      timestamp: new Date().toLocaleString()
    }
  } finally {
    loading.basic = false
  }
}

const testBasicError = async () => {
  loading.basic = true
  try {
    // 故意请求一个不存在的端点
    await http.get('/nonexistent-endpoint')
  } catch (error: any) {
    results.basic = {
      type: '错误请求',
      error: error.message,
      code: error.code,
      timestamp: new Date().toLocaleString()
    }
  } finally {
    loading.basic = false
  }
}

// 缓存策略演示
const testCacheFirst = async () => {
  loading.cache = true
  try {
    const response = await UserAPI.getUsers({
      cacheStrategy: 'cacheFirst',
      cacheTime: 60000 // 1分钟缓存
    })
    results.cache = {
      strategy: '缓存优先',
      success: response.success,
      fromCache: response.fromCache,
      dataCount: response.data?.length || 0,
      timestamp: new Date().toLocaleString()
    }
    updateCacheStats()
  } catch (error: any) {
    results.cache = {
      strategy: '缓存优先',
      error: error.message,
      timestamp: new Date().toLocaleString()
    }
  } finally {
    loading.cache = false
  }
}

const testNetworkFirst = async () => {
  loading.cache = true
  try {
    const response = await UserAPI.getUsers({
      cacheStrategy: 'networkFirst',
      cacheTime: 30000 // 30秒缓存
    })
    results.cache = {
      strategy: '网络优先',
      success: response.success,
      fromCache: response.fromCache,
      dataCount: response.data?.length || 0,
      timestamp: new Date().toLocaleString()
    }
    updateCacheStats()
  } catch (error: any) {
    results.cache = {
      strategy: '网络优先',
      error: error.message,
      timestamp: new Date().toLocaleString()
    }
  } finally {
    loading.cache = false
  }
}

const testCacheOnly = async () => {
  loading.cache = true
  try {
    const response = await UserAPI.getUsers({
      cacheStrategy: 'cacheOnly'
    })
    results.cache = {
      strategy: '仅缓存',
      success: response.success,
      fromCache: true,
      dataCount: response.data?.length || 0,
      timestamp: new Date().toLocaleString()
    }
  } catch (error: any) {
    results.cache = {
      strategy: '仅缓存',
      error: error.message,
      timestamp: new Date().toLocaleString()
    }
  } finally {
    loading.cache = false
  }
}

const clearCache = () => {
  http.clearCache()
  updateCacheStats()
  results.cache = {
    action: '缓存已清除',
    timestamp: new Date().toLocaleString()
  }
}

// 重试机制演示
const testRetrySuccess = async () => {
  loading.retry = true
  addRetryLog('开始重试成功测试')
  
  try {
    const response = await UserAPI.getUsers({
      retry: true,
      retryCount: 3,
      retryDelay: 1000
    })
    
    results.retry = {
      type: '重试成功',
      success: response.success,
      dataCount: response.data?.length || 0,
      timestamp: new Date().toLocaleString()
    }
    addRetryLog('重试测试成功完成')
  } catch (error: any) {
    results.retry = {
      type: '重试成功',
      error: error.message,
      timestamp: new Date().toLocaleString()
    }
    addRetryLog(`重试测试失败: ${error.message}`)
  } finally {
    loading.retry = false
  }
}

const testRetryFail = async () => {
  loading.retry = true
  addRetryLog('开始重试失败测试')
  
  try {
    // 请求一个会失败的端点
    await http.get('/will-fail-endpoint', {
      retry: true,
      retryCount: 2,
      retryDelay: 500
    })
  } catch (error: any) {
    results.retry = {
      type: '重试失败',
      error: error.message,
      retryAttempts: 2,
      timestamp: new Date().toLocaleString()
    }
    addRetryLog(`重试失败测试完成: ${error.message}`)
  } finally {
    loading.retry = false
  }
}

const testCustomRetry = async () => {
  loading.retry = true
  addRetryLog('开始自定义重试测试')
  
  try {
    const response = await UserAPI.getUsers({
      retry: true,
      retryCount: 5,
      retryDelay: 2000 // 2秒延迟
    })
    
    results.retry = {
      type: '自定义重试',
      success: response.success,
      retryConfig: {
        count: 5,
        delay: 2000
      },
      timestamp: new Date().toLocaleString()
    }
    addRetryLog('自定义重试测试成功')
  } catch (error: any) {
    results.retry = {
      type: '自定义重试',
      error: error.message,
      timestamp: new Date().toLocaleString()
    }
    addRetryLog(`自定义重试测试失败: ${error.message}`)
  } finally {
    loading.retry = false
  }
}

// 批量请求演示
const testParallelRequests = async () => {
  loading.batch = true
  const startTime = Date.now()
  
  try {
    const requests = {
      users: UserAPI.getUsers(),
      posts: PostAPI.getPosts(),
      user1: UserAPI.getUser(1),
      post1: PostAPI.getPost(1)
    }
    
    const responses = await BatchAPI.parallel(requests)
    batchDuration.value = Date.now() - startTime
    
    // 统计成功数量
    batchTotal.value = Object.keys(requests).length
    batchSuccess.value = Object.values(responses).filter(r => r !== null).length
    
    results.batch = {
      type: '并行请求',
      duration: batchDuration.value,
      success: batchSuccess.value,
      total: batchTotal.value,
      results: Object.keys(responses).reduce((acc: any, key) => {
        acc[key] = (responses as any)[key] ? 'success' : 'failed'
        return acc
      }, {}),
      timestamp: new Date().toLocaleString()
    }
  } catch (error: any) {
    results.batch = {
      type: '并行请求',
      error: error.message,
      timestamp: new Date().toLocaleString()
    }
  } finally {
    loading.batch = false
  }
}

const testSeriesRequests = async () => {
  loading.batch = true
  const startTime = Date.now()
  
  try {
    const requests = [
      () => UserAPI.getUsers(),
      () => PostAPI.getPosts(),
      () => UserAPI.getUser(1),
      () => PostAPI.getPost(1)
    ]
    
    const responses = await BatchAPI.series(requests as any)
    batchDuration.value = Date.now() - startTime
    
    batchTotal.value = requests.length
    batchSuccess.value = responses.length
    
    results.batch = {
      type: '串行请求',
      duration: batchDuration.value,
      success: batchSuccess.value,
      total: batchTotal.value,
      timestamp: new Date().toLocaleString()
    }
  } catch (error: any) {
    results.batch = {
      type: '串行请求',
      error: error.message,
      timestamp: new Date().toLocaleString()
    }
  } finally {
    loading.batch = false
  }
}

// PWA离线演示
const testOfflineSupport = async () => {
  loading.offline = true
  
  try {
    const response = await UserAPI.getUsers({
      offlineSupport: true,
      offlineMessage: '当前离线，显示缓存的用户数据'
    })
    
    results.offline = {
      type: '离线支持测试',
      success: response.success,
      offline: response.offline,
      fromCache: response.fromCache,
      message: response.message,
      dataCount: response.data?.length || 0,
      timestamp: new Date().toLocaleString()
    }
  } catch (error: any) {
    results.offline = {
      type: '离线支持测试',
      error: error.message,
      timestamp: new Date().toLocaleString()
    }
  } finally {
    loading.offline = false
  }
}

const simulateOffline = () => {
  isSimulatingOffline.value = !isSimulatingOffline.value
  // 这里可以通过修改网络请求来模拟离线状态
  // 实际项目中可能需要更复杂的模拟逻辑
}
</script>

<style scoped>
.api-demo {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
  overflow-x: hidden;
}

.demo-header {
  text-align: center;
  margin-bottom: 40px;
}

.demo-header h1 {
  color: #2c3e50;
  margin-bottom: 10px;
}

.demo-header p {
  color: #7f8c8d;
  font-size: 16px;
}

.network-status {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background: #e8f5e8;
  border-radius: 8px;
  margin-bottom: 30px;
  transition: all 0.3s ease;
}

.network-status.offline {
  background: #ffeaa7;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 10px;
}

.status-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #e74c3c;
  transition: all 0.3s ease;
}

.status-dot.online {
  background: #27ae60;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.status-text {
  font-weight: 600;
  color: #2c3e50;
}

.network-quality {
  color: #7f8c8d;
  font-size: 14px;
}

.check-btn {
  padding: 8px 16px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.3s ease;
}

.check-btn:hover {
  background: #2980b9;
}

.demo-sections {
  display: grid;
  gap: 30px;
}

.demo-section {
  background: white;
  border-radius: 12px;
  padding: 25px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  border: 1px solid #e1e8ed;
}

.demo-section h2 {
  color: #2c3e50;
  margin-bottom: 20px;
  font-size: 20px;
}

.demo-controls {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.demo-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
  background: #3498db;
  color: white;
}

.demo-btn:hover:not(:disabled) {
  background: #2980b9;
  transform: translateY(-1px);
}

.demo-btn:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
  transform: none;
}

.demo-btn.error {
  background: #e74c3c;
}

.demo-btn.error:hover:not(:disabled) {
  background: #c0392b;
}

.demo-btn.warning {
  background: #f39c12;
}

.demo-btn.warning:hover:not(:disabled) {
  background: #e67e22;
}

.demo-result {
  background: #f8f9fa;
  border-radius: 6px;
  padding: 15px;
  border-left: 4px solid #3498db;
}

.demo-result pre {
  margin: 0;
  font-size: 13px;
  line-height: 1.4;
  color: #2c3e50;
  white-space: pre-wrap;
  word-break: break-word;
}

.result-meta {
  display: flex;
  gap: 15px;
  margin-bottom: 10px;
  font-size: 14px;
}

.cache-status {
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: 500;
}

.cache-status.cached {
  background: #d5f4e6;
  color: #27ae60;
}

.cache-status.network {
  background: #dbeafe;
  color: #3498db;
}

.offline-indicator {
  background: #ffeaa7;
  color: #f39c12;
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: 500;
}

.cache-info {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 6px;
  margin-bottom: 15px;
}

.cache-keys {
  margin-top: 10px;
}

.cache-keys summary {
  cursor: pointer;
  font-weight: 500;
  color: #3498db;
}

.cache-keys ul {
  margin: 10px 0 0 20px;
  padding: 0;
}

.cache-key {
  font-family: 'Courier New', monospace;
  font-size: 12px;
  color: #7f8c8d;
  margin: 5px 0;
  word-break: break-all;
}

.retry-logs {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 6px;
  margin-bottom: 15px;
  max-height: 200px;
  overflow-y: auto;
}

.retry-logs h4 {
  margin: 0 0 10px 0;
  color: #2c3e50;
}

.retry-logs ul {
  margin: 0;
  padding: 0;
  list-style: none;
}

.retry-log {
  display: flex;
  gap: 10px;
  margin: 5px 0;
  font-size: 13px;
}

.log-time {
  color: #7f8c8d;
  font-family: 'Courier New', monospace;
  min-width: 80px;
}

.log-message {
  color: #2c3e50;
}

.batch-summary {
  background: #e8f5e8;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 10px;
}

.batch-summary p {
  margin: 5px 0;
  font-size: 14px;
  color: #27ae60;
}

.offline-tips {
  background: #fff3cd;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 15px;
  border-left: 4px solid #ffc107;
}

.offline-tips p {
  margin: 0;
  color: #856404;
  font-size: 14px;
}

.global-loading {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  color: white;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top: 4px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 15px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .api-demo {
    padding: 15px;
  }
  
  .demo-controls {
    flex-direction: column;
  }
  
  .demo-btn {
    width: 100%;
  }
  
  .network-status {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }
  
  .result-meta {
    flex-direction: column;
    gap: 8px;
  }
}
</style>
