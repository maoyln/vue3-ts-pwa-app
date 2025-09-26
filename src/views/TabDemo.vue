<template>
  <div class="tab-demo">
    <div class="demo-container">
      <h1 class="demo-title">🗂️ PWA多页签功能演示</h1>
      <p class="demo-description">
        在PWA中实现类似浏览器多页签的功能，支持在应用内打开多个页面而不跳转到浏览器
      </p>

      <!-- 功能演示区域 -->
      <div class="demo-sections">
        <!-- 基本功能 -->
        <section class="demo-section">
          <h2 class="section-title">🚀 基本功能</h2>
          <div class="button-grid">
            <button 
              class="demo-btn primary"
              @click="openNewTabExample"
            >
              打开新页签
            </button>
            <button 
              class="demo-btn secondary"
              @click="openWeatherTab"
            >
              打开天气页面
            </button>
            <button 
              class="demo-btn secondary"
              @click="openNewsTab"
            >
              打开新闻页面
            </button>
            <button 
              class="demo-btn danger"
              @click="closeCurrentTab"
            >
              关闭当前页签
            </button>
          </div>
        </section>

        <!-- 高级功能 -->
        <section class="demo-section">
          <h2 class="section-title">⚡ 高级功能</h2>
          <div class="button-grid">
            <button 
              class="demo-btn warning"
              @click="openMultipleTabs"
            >
              批量打开多个页签
            </button>
            <button 
              class="demo-btn info"
              @click="duplicateCurrentTab"
            >
              复制当前页签
            </button>
            <button 
              class="demo-btn secondary"
              @click="refreshCurrentTab"
            >
              刷新当前页签
            </button>
            <button 
              class="demo-btn danger"
              @click="closeAllTabs"
            >
              关闭所有页签
            </button>
          </div>
        </section>

        <!-- 状态信息 */
        <section class="demo-section">
          <h2 class="section-title">📊 页签状态</h2>
          <div class="status-grid">
            <div class="status-card">
              <span class="status-label">当前页签数量:</span>
              <span class="status-value">{{ tabsCount }}</span>
            </div>
            <div class="status-card">
              <span class="status-label">活动页签:</span>
              <span class="status-value">{{ activeTab?.title || '无' }}</span>
            </div>
            <div class="status-card">
              <span class="status-label">当前路径:</span>
              <span class="status-value">{{ currentPath }}</span>
            </div>
          </div>
        </section>

        <!-- 页签列表 -->
        <section class="demo-section">
          <h2 class="section-title">📋 页签列表</h2>
          <div class="tabs-list">
            <div
              v-for="tab in tabs"
              :key="tab.id"
              class="tab-card"
              :class="{ active: tab.isActive }"
            >
              <div class="tab-info">
                <span class="tab-icon">{{ tab.icon || '📄' }}</span>
                <div class="tab-details">
                  <h4 class="tab-name">{{ tab.title }}</h4>
                  <p class="tab-path">{{ tab.path }}</p>
                </div>
              </div>
              <div class="tab-actions">
                <button 
                  class="action-btn"
                  @click="switchToTab(tab.id)"
                  title="切换到此页签"
                >
                  👁️
                </button>
                <button 
                  v-if="tab.isClosable"
                  class="action-btn danger"
                  @click="closeTab(tab.id)"
                  title="关闭页签"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        </section>

        <!-- 代码示例 -->
        <section class="demo-section">
          <h2 class="section-title">💻 代码示例</h2>
          <div class="code-examples">
            <div class="code-block">
              <h4>基本用法</h4>
              <pre><code>// 打开新页签
openInNewTab('/weather', {
  title: '天气预报',
  icon: '🌤️',
  closable: true
})

// 关闭页签
closeTab(tabId)

// 获取当前页签
const currentTab = getCurrentTab()</code></pre>
            </div>
            
            <div class="code-block">
              <h4>在组件中使用</h4>
              <pre><code>import { openInNewTab } from '@/utils/tabUtils'

// 点击事件处理
const handleOpenWeather = () => {
  openInNewTab('/weather', {
    title: '天气预报',
    icon: '🌤️'
  })
}</code></pre>
            </div>

            <div class="code-block">
              <h4>全局方法</h4>
              <pre><code>// 在任何地方都可以使用
window.openInNewTab('/news')
window.closeTab(tabId)
window.closeAllTabs()
window.refreshTab()</code></pre>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useTabManager } from '../composables/useTabManager'
import { openInNewTab, closeTab, closeAllTabs, switchToTab, refreshTab } from '../utils/tabUtils'

// Vue Router
const route = useRoute()

// 页签管理器
const { tabs, activeTab, tabsCount } = useTabManager()

// 当前路径
const currentPath = computed(() => route.path)

// 确保变量被TypeScript识别为已使用
console.debug('TabDemo loaded:', { tabsCount: tabsCount.value, currentPath: currentPath.value })

// 打开新页签示例
const openNewTabExample = () => {
  openInNewTab('/users', {
    title: '用户管理示例',
    icon: '👥',
    closable: true
  })
}

// 打开天气页签
const openWeatherTab = () => {
  openInNewTab('/weather', {
    title: '天气预报',
    icon: '🌤️'
  })
}

// 打开新闻页签
const openNewsTab = () => {
  openInNewTab('/news', {
    title: '新闻资讯',
    icon: '📰'
  })
}

// 关闭当前页签
const closeCurrentTab = () => {
  if (activeTab.value && activeTab.value.isClosable) {
    closeTab(activeTab.value.id)
  } else {
    alert('当前页签不能关闭')
  }
}

// 批量打开多个页签
const openMultipleTabs = () => {
  const pages = [
    { path: '/posts', title: '文章管理', icon: '📝' },
    { path: '/comments', title: '评论管理', icon: '💬' },
    { path: '/albums', title: '相册管理', icon: '📸' }
  ]

  pages.forEach((page, index) => {
    setTimeout(() => {
      openInNewTab(page.path, {
        title: page.title,
        icon: page.icon,
        setActive: index === pages.length - 1 // 最后一个设为活动页签
      })
    }, index * 200) // 延迟打开，避免太快
  })
}

// 复制当前页签
const duplicateCurrentTab = () => {
  if (activeTab.value) {
    openInNewTab(activeTab.value.path, {
      title: `${activeTab.value.title} (副本)`,
      icon: activeTab.value.icon,
      allowDuplicate: true
    })
  }
}

// 刷新当前页签
const refreshCurrentTab = () => {
  if (activeTab.value) {
    refreshTab(activeTab.value.id)
  }
}
</script>

<style scoped>
.tab-demo {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 20px;
}

.demo-container {
  max-width: 1200px;
  margin: 0 auto;
}

.demo-title {
  font-size: 2.5rem;
  font-weight: 700;
  text-align: center;
  color: #2d3748;
  margin-bottom: 16px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.demo-description {
  font-size: 1.1rem;
  text-align: center;
  color: #4a5568;
  margin-bottom: 40px;
  line-height: 1.6;
}

.demo-sections {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.demo-section {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.button-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.demo-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.demo-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.demo-btn.primary {
  background: #3182ce;
  color: white;
}

.demo-btn.primary:hover {
  background: #2c5aa0;
}

.demo-btn.secondary {
  background: #718096;
  color: white;
}

.demo-btn.secondary:hover {
  background: #4a5568;
}

.demo-btn.warning {
  background: #ed8936;
  color: white;
}

.demo-btn.warning:hover {
  background: #c05621;
}

.demo-btn.info {
  background: #38b2ac;
  color: white;
}

.demo-btn.info:hover {
  background: #319795;
}

.demo-btn.danger {
  background: #e53e3e;
  color: white;
}

.demo-btn.danger:hover {
  background: #c53030;
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.status-card {
  background: #f7fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.status-label {
  font-size: 0.875rem;
  color: #718096;
  font-weight: 500;
}

.status-value {
  font-size: 1.125rem;
  color: #2d3748;
  font-weight: 600;
}

.tabs-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 400px;
  overflow-y: auto;
}

.tab-card {
  background: #f7fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.3s ease;
}

.tab-card:hover {
  border-color: #cbd5e0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.tab-card.active {
  background: #ebf8ff;
  border-color: #3182ce;
}

.tab-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.tab-icon {
  font-size: 1.5rem;
}

.tab-details {
  flex: 1;
}

.tab-name {
  font-size: 1rem;
  font-weight: 600;
  color: #2d3748;
  margin: 0 0 4px 0;
}

.tab-path {
  font-size: 0.875rem;
  color: #718096;
  margin: 0;
}

.tab-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  background: #e2e8f0;
  color: #4a5568;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  font-size: 0.875rem;
}

.action-btn:hover {
  background: #cbd5e0;
}

.action-btn.danger {
  background: #fed7d7;
  color: #e53e3e;
}

.action-btn.danger:hover {
  background: #feb2b2;
}

.code-examples {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.code-block {
  background: #1a202c;
  border-radius: 8px;
  padding: 20px;
  overflow-x: auto;
}

.code-block h4 {
  color: #e2e8f0;
  margin: 0 0 12px 0;
  font-size: 1rem;
  font-weight: 600;
}

.code-block pre {
  margin: 0;
  color: #e2e8f0;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.875rem;
  line-height: 1.6;
}

.code-block code {
  color: #e2e8f0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .tab-demo {
    padding: 16px;
  }

  .demo-title {
    font-size: 2rem;
  }

  .button-grid {
    grid-template-columns: 1fr;
  }

  .status-grid {
    grid-template-columns: 1fr;
  }

  .tab-card {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .tab-actions {
    align-self: flex-end;
  }

  .code-block {
    padding: 16px;
  }
}

/* 深色模式 */
@media (prefers-color-scheme: dark) {
  .tab-demo {
    background: linear-gradient(135deg, #1a202c 0%, #2d3748 100%);
  }

  .demo-title {
    color: #f7fafc;
  }

  .demo-description {
    color: #e2e8f0;
  }

  .demo-section {
    background: #2d3748;
    border-color: #4a5568;
  }

  .section-title {
    color: #f7fafc;
  }

  .status-card {
    background: #4a5568;
    border-color: #718096;
  }

  .status-label {
    color: #cbd5e0;
  }

  .status-value {
    color: #f7fafc;
  }

  .tab-card {
    background: #4a5568;
    border-color: #718096;
  }

  .tab-card:hover {
    border-color: #a0aec0;
  }

  .tab-card.active {
    background: #2c5aa0;
    border-color: #3182ce;
  }

  .tab-name {
    color: #f7fafc;
  }

  .tab-path {
    color: #cbd5e0;
  }

  .action-btn {
    background: #718096;
    color: #f7fafc;
  }

  .action-btn:hover {
    background: #a0aec0;
  }
}

/* 滚动条样式 */
.tabs-list::-webkit-scrollbar {
  width: 6px;
}

.tabs-list::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 3px;
}

.tabs-list::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.tabs-list::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>
