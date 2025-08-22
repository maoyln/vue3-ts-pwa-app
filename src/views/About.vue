<template>
  <div class="about">
    <div class="about-header">
      <h1>
        <i class="about-icon">ℹ️</i>
        关于应用
      </h1>
      <p>了解更多关于这个Vue3 PWA应用的信息</p>
    </div>

    <!-- 应用信息 -->
    <div class="app-info">
      <div class="info-card">
        <h2>应用介绍</h2>
        <p>
          这是一个基于Vue 3、TypeScript和Vite构建的现代化渐进式Web应用(PWA)。
          应用集成了多种实用功能，包括天气查询、新闻资讯等，并具备完整的PWA特性。
        </p>
      </div>

      <div class="info-card">
        <h2>技术栈</h2>
        <div class="tech-stack">
          <div class="tech-item">
            <span class="tech-icon">⚡</span>
            <div>
              <strong>Vue 3</strong>
              <p>现代化的渐进式JavaScript框架</p>
            </div>
          </div>
          <div class="tech-item">
            <span class="tech-icon">📘</span>
            <div>
              <strong>TypeScript</strong>
              <p>类型安全的JavaScript超集</p>
            </div>
          </div>
          <div class="tech-item">
            <span class="tech-icon">🚀</span>
            <div>
              <strong>Vite</strong>
              <p>快速的前端构建工具</p>
            </div>
          </div>
          <div class="tech-item">
            <span class="tech-icon">🍍</span>
            <div>
              <strong>Pinia</strong>
              <p>Vue的官方状态管理库</p>
            </div>
          </div>
          <div class="tech-item">
            <span class="tech-icon">🛣️</span>
            <div>
              <strong>Vue Router</strong>
              <p>Vue.js的官方路由管理器</p>
            </div>
          </div>
          <div class="tech-item">
            <span class="tech-icon">📱</span>
            <div>
              <strong>PWA</strong>
              <p>渐进式Web应用技术</p>
            </div>
          </div>
        </div>
      </div>

      <div class="info-card">
        <h2>PWA 特性</h2>
        <div class="feature-grid">
          <div class="feature-item">
            <div class="feature-icon">📱</div>
            <div class="feature-content">
              <h3>可安装</h3>
              <p>可以像原生应用一样安装到设备上</p>
            </div>
          </div>
          <div class="feature-item">
            <div class="feature-icon">📡</div>
            <div class="feature-content">
              <h3>离线可用</h3>
              <p>通过Service Worker实现离线缓存</p>
            </div>
          </div>
          <div class="feature-item">
            <div class="feature-icon">🔄</div>
            <div class="feature-content">
              <h3>自动更新</h3>
              <p>后台自动检查和下载更新</p>
            </div>
          </div>
          <div class="feature-item">
            <div class="feature-icon">⚡</div>
            <div class="feature-content">
              <h3>快速加载</h3>
              <p>通过缓存策略实现快速启动</p>
            </div>
          </div>
          <div class="feature-item">
            <div class="feature-icon">🔒</div>
            <div class="feature-content">
              <h3>安全连接</h3>
              <p>必须通过HTTPS提供服务</p>
            </div>
          </div>
          <div class="feature-item">
            <div class="feature-icon">📲</div>
            <div class="feature-content">
              <h3>响应式设计</h3>
              <p>适配各种设备和屏幕尺寸</p>
            </div>
          </div>
        </div>
      </div>

      <div class="info-card">
        <h2>功能模块</h2>
        <div class="module-list">
          <div class="module-item">
            <div class="module-icon">🏠</div>
            <div class="module-info">
              <h3>首页</h3>
              <p>应用概览和功能导航</p>
            </div>
          </div>
          <div class="module-item">
            <div class="module-icon">🌤️</div>
            <div class="module-info">
              <h3>天气预报</h3>
              <p>实时天气信息查询，支持多城市</p>
            </div>
          </div>
          <div class="module-item">
            <div class="module-icon">📰</div>
            <div class="module-info">
              <h3>新闻资讯</h3>
              <p>多分类新闻浏览，支持详情查看</p>
            </div>
          </div>
          <div class="module-item">
            <div class="module-icon">ℹ️</div>
            <div class="module-info">
              <h3>关于页面</h3>
              <p>应用信息和技术说明</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 应用统计 -->
      <div class="info-card">
        <h2>应用统计</h2>
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-number">{{ appStats.version }}</div>
            <div class="stat-label">当前版本</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">{{ appStats.buildTime }}</div>
            <div class="stat-label">构建时间</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">{{ appStats.cacheSize }}</div>
            <div class="stat-label">缓存大小</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">{{ appStats.visitCount }}</div>
            <div class="stat-label">访问次数</div>
          </div>
        </div>
      </div>

      <!-- 开发者信息 -->
      <div class="info-card">
        <h2>开发者信息</h2>
        <div class="developer-info">
          <div class="developer-avatar">
            <div class="avatar-placeholder">👨‍💻</div>
          </div>
          <div class="developer-details">
            <h3>Vue3 PWA Demo</h3>
            <p>这是一个演示项目，展示了如何使用Vue 3构建功能完整的PWA应用。</p>
            <div class="developer-links">
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" class="dev-link">
                <span>📦</span> GitHub
              </a>
              <a href="https://vue3.dev" target="_blank" rel="noopener noreferrer" class="dev-link">
                <span>🌐</span> 官网
              </a>
            </div>
          </div>
        </div>
      </div>

      <!-- 使用说明 -->
      <div class="info-card">
        <h2>使用说明</h2>
        <div class="usage-steps">
          <div class="step-item">
            <div class="step-number">1</div>
            <div class="step-content">
              <h3>安装应用</h3>
              <p>点击浏览器地址栏的安装按钮，或使用应用内的安装提示</p>
            </div>
          </div>
          <div class="step-item">
            <div class="step-number">2</div>
            <div class="step-content">
              <h3>离线使用</h3>
              <p>应用会自动缓存资源，即使没有网络也能正常使用基本功能</p>
            </div>
          </div>
          <div class="step-item">
            <div class="step-number">3</div>
            <div class="step-content">
              <h3>自动更新</h3>
              <p>应用会在后台检查更新，有新版本时会自动提示更新</p>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 缓存调试器（仅在开发模式显示） -->
    <CacheDebugger v-if="showDebugger" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import CacheDebugger from '../components/CacheDebugger.vue'

// 是否显示调试器（开发模式或包含debug参数）
const showDebugger = ref(
  process.env.NODE_ENV === 'development' || 
  new URLSearchParams(window.location.search).has('debug')
)

// 应用统计数据
const appStats = ref({
  version: '1.0.0',
  buildTime: '今天',
  cacheSize: '计算中...',
  visitCount: 0
})

// 获取缓存大小
const getCacheSize = async () => {
  try {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate()
      const sizeInMB = ((estimate.usage || 0) / 1024 / 1024).toFixed(2)
      appStats.value.cacheSize = `${sizeInMB} MB`
    } else {
      appStats.value.cacheSize = '不支持'
    }
  } catch (error) {
    appStats.value.cacheSize = '获取失败'
  }
}

// 获取访问次数
const getVisitCount = () => {
  const count = parseInt(localStorage.getItem('visitCount') || '0') + 1
  localStorage.setItem('visitCount', count.toString())
  appStats.value.visitCount = count
}

// 获取构建时间
const getBuildTime = () => {
  const now = new Date()
  appStats.value.buildTime = now.toLocaleDateString('zh-CN')
}

onMounted(() => {
  getCacheSize()
  getVisitCount()
  getBuildTime()
})
</script>

<style scoped>
.about {
  padding: 20px;
  max-width: 1000px;
  margin: 0 auto;
}

.about-header {
  text-align: center;
  margin-bottom: 40px;
}

.about-header h1 {
  font-size: 2.5rem;
  color: #1f2937;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.about-icon {
  font-size: 3rem;
}

.about-header p {
  color: #6b7280;
  font-size: 1.1rem;
}

.app-info {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.info-card {
  background: white;
  padding: 32px;
  border-radius: 16px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  animation: fadeInUp 0.6s ease-out;
}

.info-card h2 {
  color: #1f2937;
  font-size: 1.5rem;
  margin-bottom: 20px;
  border-bottom: 2px solid #e5e7eb;
  padding-bottom: 8px;
}

.tech-stack {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}

.tech-item {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 12px;
  border-left: 4px solid #3b82f6;
}

.tech-icon {
  font-size: 2rem;
  flex-shrink: 0;
}

.tech-item strong {
  color: #1f2937;
  font-size: 1.1rem;
}

.tech-item p {
  color: #6b7280;
  margin-top: 4px;
  font-size: 0.9rem;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.feature-item {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 20px;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border-radius: 12px;
  border: 1px solid #bae6fd;
}

.feature-icon {
  font-size: 2.5rem;
  flex-shrink: 0;
}

.feature-content h3 {
  color: #0c4a6e;
  margin-bottom: 6px;
  font-size: 1.1rem;
}

.feature-content p {
  color: #0369a1;
  font-size: 0.9rem;
  line-height: 1.4;
}

.module-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.module-item {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 20px;
  background: #fafafa;
  border-radius: 12px;
  border-left: 4px solid #10b981;
  transition: transform 0.3s ease;
}

.module-item:hover {
  transform: translateX(8px);
}

.module-icon {
  font-size: 2.5rem;
  flex-shrink: 0;
}

.module-info h3 {
  color: #1f2937;
  margin-bottom: 4px;
  font-size: 1.1rem;
}

.module-info p {
  color: #6b7280;
  font-size: 0.9rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 20px;
}

.stat-item {
  text-align: center;
  padding: 24px;
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border-radius: 12px;
  border: 1px solid #f59e0b;
}

.stat-number {
  font-size: 2rem;
  font-weight: bold;
  color: #92400e;
  margin-bottom: 8px;
}

.stat-label {
  color: #b45309;
  font-size: 0.9rem;
}

.developer-info {
  display: flex;
  align-items: center;
  gap: 24px;
}

.developer-avatar {
  flex-shrink: 0;
}

.avatar-placeholder {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
}

.developer-details h3 {
  color: #1f2937;
  margin-bottom: 8px;
  font-size: 1.25rem;
}

.developer-details p {
  color: #6b7280;
  margin-bottom: 16px;
  line-height: 1.5;
}

.developer-links {
  display: flex;
  gap: 12px;
}

.dev-link {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: #f3f4f6;
  color: #374151;
  text-decoration: none;
  border-radius: 8px;
  font-size: 0.9rem;
  transition: all 0.3s ease;
}

.dev-link:hover {
  background: #e5e7eb;
  transform: translateY(-2px);
}

.usage-steps {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.step-item {
  display: flex;
  align-items: flex-start;
  gap: 20px;
}

.step-number {
  width: 40px;
  height: 40px;
  background: #3b82f6;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1.1rem;
  flex-shrink: 0;
}

.step-content h3 {
  color: #1f2937;
  margin-bottom: 6px;
  font-size: 1.1rem;
}

.step-content p {
  color: #6b7280;
  line-height: 1.5;
}

/* 动画效果 */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .about-header h1 {
    font-size: 2rem;
    flex-direction: column;
    gap: 8px;
  }
  
  .about-icon {
    font-size: 2.5rem;
  }
  
  .info-card {
    padding: 24px 20px;
  }
  
  .tech-stack {
    grid-template-columns: 1fr;
  }
  
  .feature-grid {
    grid-template-columns: 1fr;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .developer-info {
    flex-direction: column;
    text-align: center;
  }
  
  .developer-links {
    justify-content: center;
  }
  
  .step-item {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
}

@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .developer-links {
    flex-direction: column;
    width: 100%;
  }
  
  .dev-link {
    justify-content: center;
  }
}
</style>
