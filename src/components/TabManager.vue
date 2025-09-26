<template>
  <div class="tab-manager">
    <!-- 页签栏 -->
    <div class="tab-bar" v-if="hasMultipleTabs || tabs.length > 0">
      <div class="tab-list" ref="tabListRef">
        <div
          v-for="tab in tabs"
          :key="tab.id"
          class="tab-item"
          :class="{
            active: tab.isActive,
            closable: tab.isClosable
          }"
          @click="handleTabClick(tab)"
          @contextmenu.prevent="showContextMenu($event, tab)"
        >
          <!-- 页签图标 -->
          <span v-if="tab.icon" class="tab-icon">{{ tab.icon }}</span>
          
          <!-- 页签标题 -->
          <span class="tab-title" :title="tab.title">{{ tab.title }}</span>
          
          <!-- 关闭按钮 -->
          <button
            v-if="tab.isClosable"
            class="tab-close"
            @click.stop="handleCloseTab(tab.id)"
            :title="`关闭 ${tab.title}`"
          >
            ×
          </button>
        </div>
      </div>

      <!-- 页签操作按钮 -->
      <div class="tab-actions">
        <button
          class="action-btn"
          @click="showTabMenu"
          title="页签菜单"
        >
          ⋮
        </button>
      </div>
    </div>

    <!-- 页签内容区域 -->
    <div class="tab-content">
      <div
        v-for="tab in tabs"
        :key="`content-${tab.id}`"
        class="tab-pane"
        :class="{ active: tab.isActive }"
        v-show="tab.isActive"
      >
        <!-- 使用 router-view 来显示路由组件 -->
        <router-view
          v-if="tab.isActive && currentPath === tab.path"
          :key="tab.path"
        />
      </div>
    </div>

    <!-- 右键菜单 -->
    <div
      v-if="contextMenu.show"
      class="context-menu"
      :style="{
        left: contextMenu.x + 'px',
        top: contextMenu.y + 'px'
      }"
      @click.stop
    >
      <div class="menu-item" @click="handleRefreshTab(contextMenu.tab.id)">
        <span class="menu-icon">🔄</span>
        <span>刷新页签</span>
      </div>
      <div
        v-if="contextMenu.tab.isClosable"
        class="menu-item"
        @click="handleCloseTab(contextMenu.tab.id)"
      >
        <span class="menu-icon">✕</span>
        <span>关闭页签</span>
      </div>
      <div class="menu-item" @click="handleCloseOtherTabs(contextMenu.tab.id)">
        <span class="menu-icon">📋</span>
        <span>关闭其他页签</span>
      </div>
      <div class="menu-item" @click="handleCloseRightTabs(contextMenu.tab.id)">
        <span class="menu-icon">➡️</span>
        <span>关闭右侧页签</span>
      </div>
    </div>

    <!-- 页签菜单 -->
    <div
      v-if="tabMenu.show"
      class="tab-menu"
      :style="{
        right: '10px',
        top: '50px'
      }"
    >
      <div class="menu-item" @click="handleCloseAllTabs">
        <span class="menu-icon">🗑️</span>
        <span>关闭所有页签</span>
      </div>
      <div class="menu-divider"></div>
      <div class="menu-item" @click="handleExportTabs">
        <span class="menu-icon">💾</span>
        <span>导出页签配置</span>
      </div>
      <div class="menu-item" @click="handleImportTabs">
        <span class="menu-icon">📁</span>
        <span>导入页签配置</span>
      </div>
    </div>

    <!-- 遮罩层 -->
    <div
      v-if="contextMenu.show || tabMenu.show"
      class="menu-overlay"
      @click="hideAllMenus"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useTabManager } from '../composables/useTabManager'
import type { Tab } from '../composables/useTabManager'

// Vue Router
const router = useRouter()
const route = useRoute()

// 页签管理器
const {
  tabs,
  hasMultipleTabs,
  setActiveTab,
  closeTab,
  closeOtherTabs,
  closeAllTabs,
  closeRightTabs,
  refreshTab,
  exportTabsConfig,
  importTabsConfig
} = useTabManager()

// 引用
const tabListRef = ref<HTMLElement>()

// 当前路径
const currentPath = computed(() => route.path)

// 右键菜单状态
const contextMenu = ref({
  show: false,
  x: 0,
  y: 0,
  tab: {} as Tab
})

// 页签菜单状态
const tabMenu = ref({
  show: false
})

// 处理页签点击
const handleTabClick = (tab: Tab) => {
  setActiveTab(tab.id)
  // 导航到对应路由
  if (route.path !== tab.path) {
    router.push(tab.path)
  }
}

// 处理关闭页签
const handleCloseTab = (tabId: string) => {
  const tab = tabs.value.find(t => t.id === tabId)
  if (!tab) return

  closeTab(tabId)
  
  // 如果关闭的是当前页签，需要导航到新的活动页签
  if (tab.isActive && tabs.value.length > 0) {
    const newActiveTab = tabs.value.find(t => t.isActive)
    if (newActiveTab && route.path !== newActiveTab.path) {
      router.push(newActiveTab.path)
    }
  } else if (tabs.value.length === 0) {
    // 如果没有页签了，导航到首页
    router.push('/')
  }
}

// 显示右键菜单
const showContextMenu = (event: MouseEvent, tab: Tab) => {
  contextMenu.value = {
    show: true,
    x: event.clientX,
    y: event.clientY,
    tab
  }
  tabMenu.value.show = false
}

// 显示页签菜单
const showTabMenu = () => {
  tabMenu.value.show = !tabMenu.value.show
  contextMenu.value.show = false
}

// 隐藏所有菜单
const hideAllMenus = () => {
  contextMenu.value.show = false
  tabMenu.value.show = false
}

// 刷新页签
const handleRefreshTab = (tabId: string) => {
  refreshTab(tabId)
  hideAllMenus()
  
  // 重新加载当前路由
  const tab = tabs.value.find(t => t.id === tabId)
  if (tab && tab.isActive) {
    router.go(0)
  }
}

// 关闭其他页签
const handleCloseOtherTabs = (tabId: string) => {
  closeOtherTabs(tabId)
  hideAllMenus()
  
  // 确保导航到正确的页签
  const tab = tabs.value.find(t => t.id === tabId)
  if (tab && route.path !== tab.path) {
    router.push(tab.path)
  }
}

// 关闭右侧页签
const handleCloseRightTabs = (tabId: string) => {
  closeRightTabs(tabId)
  hideAllMenus()
}

// 关闭所有页签
const handleCloseAllTabs = () => {
  closeAllTabs()
  hideAllMenus()
  
  // 导航到首页
  router.push('/')
}

// 导出页签配置
const handleExportTabs = () => {
  const config = exportTabsConfig()
  const blob = new Blob([JSON.stringify(config, null, 2)], {
    type: 'application/json'
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'tabs-config.json'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  hideAllMenus()
}

// 导入页签配置
const handleImportTabs = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  input.onchange = (e) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const config = JSON.parse(e.target?.result as string)
          importTabsConfig(config)
        } catch (error) {
          console.error('导入页签配置失败:', error)
          alert('导入失败，配置文件格式不正确')
        }
      }
      reader.readAsText(file)
    }
  }
  input.click()
  hideAllMenus()
}

// 监听点击事件，关闭菜单
const handleDocumentClick = (event: Event) => {
  const target = event.target as HTMLElement
  if (!target.closest('.context-menu') && !target.closest('.tab-menu')) {
    hideAllMenus()
  }
}

// 监听路由变化，同步页签状态
watch(() => route.path, (newPath) => {
  const currentTab = tabs.value.find(tab => tab.path === newPath)
  if (currentTab && !currentTab.isActive) {
    setActiveTab(currentTab.id)
  }
})

// 组件挂载
onMounted(() => {
  document.addEventListener('click', handleDocumentClick)
})

// 组件卸载
onUnmounted(() => {
  document.removeEventListener('click', handleDocumentClick)
})
</script>

<style scoped>
.tab-manager {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 80px); /* 减去导航栏的高度 */
  background: #f8fafc;
}

/* 页签栏 */
.tab-bar {
  display: flex;
  align-items: flex-end;
  background: #f1f5f9;
  border-bottom: 1px solid #d1d5db;
  padding: 0 16px;
  min-height: 40px;
  overflow: hidden;
  position: relative;
  z-index: 100;
}

.tab-list {
  display: flex;
  flex: 1;
  overflow-x: auto;
  overflow-y: hidden;
  gap: 2px;
  scroll-behavior: smooth;
}

.tab-list::-webkit-scrollbar {
  height: 3px;
}

.tab-list::-webkit-scrollbar-track {
  background: #f1f5f9;
}

.tab-list::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.tab-list::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* 页签项 */
.tab-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #e5e7eb;
  border: 1px solid #d1d5db;
  border-bottom: none;
  border-radius: 8px 8px 0 0;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  min-width: 140px;
  max-width: 240px;
  position: relative;
  user-select: none;
  margin-right: 2px;
  height: 32px;
}

.tab-item:hover {
  background: #f3f4f6;
  border-color: #9ca3af;
  transform: translateY(-1px);
}

.tab-item.active {
  background: white;
  border-color: #d1d5db;
  border-bottom: 1px solid white;
  color: #1f2937;
  font-weight: 600;
  z-index: 10;
  transform: translateY(1px);
}

.tab-item.active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: -1px;
  right: -1px;
  height: 1px;
  background: white;
  z-index: 1;
}

.tab-icon {
  font-size: 1rem;
  flex-shrink: 0;
}

.tab-title {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 0.875rem;
  line-height: 1.2;
}

.tab-close {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: none;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #6b7280;
  transition: all 0.2s ease;
  flex-shrink: 0;
  opacity: 0.7;
}

.tab-close:hover {
  background: #f87171;
  color: white;
  opacity: 1;
}

.tab-item:hover .tab-close {
  opacity: 1;
}

/* 页签操作 */
.tab-actions {
  display: flex;
  align-items: center;
  margin-left: 8px;
}

.action-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  transition: all 0.2s ease;
  font-size: 14px;
}

.action-btn:hover {
  background: #e5e7eb;
  color: #374151;
}

/* 页签内容 */
.tab-content {
  flex: 1;
  overflow: hidden;
  position: relative;
}

.tab-pane {
  height: 100%;
  overflow: auto;
}

.tab-pane.active {
  display: block;
}

/* 右键菜单和页签菜单 */
.context-menu,
.tab-menu {
  position: fixed;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  min-width: 160px;
  padding: 4px 0;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  font-size: 0.875rem;
}

.menu-item:hover {
  background: #f3f4f6;
}

.menu-icon {
  font-size: 0.875rem;
  width: 16px;
  text-align: center;
}

.menu-divider {
  height: 1px;
  background: #e5e7eb;
  margin: 4px 0;
}

.menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 999;
  background: transparent;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .tab-manager {
    height: calc(100vh - 60px); /* 移动端导航栏可能更小 */
  }

  .tab-bar {
    padding: 0 8px;
    min-height: 36px;
  }

  .tab-item {
    min-width: 80px;
    max-width: 120px;
    padding: 6px 10px;
    height: 28px;
  }

  .tab-title {
    font-size: 0.75rem;
  }

  .tab-icon {
    font-size: 0.875rem;
  }

  .tab-close {
    width: 16px;
    height: 16px;
    font-size: 10px;
  }

  .action-btn {
    width: 24px;
    height: 24px;
    font-size: 12px;
  }
}

/* 深色模式 */
@media (prefers-color-scheme: dark) {
  .tab-manager {
    background: #1f2937;
  }

  .tab-bar {
    background: #374151;
    border-bottom-color: #4b5563;
  }

  .tab-item {
    background: #4b5563;
    border-color: #6b7280;
    color: #e5e7eb;
  }

  .tab-item:hover {
    background: #6b7280;
    border-color: #9ca3af;
  }

  .tab-item.active {
    background: #1f2937;
    border-color: #6b7280;
    border-bottom: 1px solid #1f2937;
    color: #f3f4f6;
  }

  .tab-item.active::after {
    background: #1f2937;
  }

  .tab-close {
    color: #9ca3af;
  }

  .tab-close:hover {
    background: #ef4444;
    color: white;
  }

  .action-btn {
    color: #9ca3af;
  }

  .action-btn:hover {
    background: #4b5563;
    color: #e5e7eb;
  }

  .context-menu,
  .tab-menu {
    background: #374151;
    border-color: #4b5563;
  }

  .menu-item {
    color: #e5e7eb;
  }

  .menu-item:hover {
    background: #4b5563;
  }

  .menu-divider {
    background: #4b5563;
  }
}

/* 动画效果 */
.tab-item {
  transform: translateY(0);
}

.tab-item:hover {
  transform: translateY(-1px);
}

.tab-item.active {
  transform: translateY(0);
}

/* 减少动画（用户偏好） */
@media (prefers-reduced-motion: reduce) {
  .tab-item,
  .tab-close,
  .action-btn,
  .menu-item {
    transition: none;
  }

  .tab-item:hover {
    transform: none;
  }
}
</style>
