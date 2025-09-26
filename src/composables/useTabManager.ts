/**
 * 页签管理 Composable
 * 提供PWA内部多页签功能，支持打开新页签而不跳转到浏览器
 */
import { ref, computed, nextTick } from 'vue'
import type { RouteLocationNormalizedLoaded } from 'vue-router'

export interface Tab {
  id: string
  title: string
  path: string
  icon?: string
  component?: any
  meta?: any
  isActive: boolean
  isClosable: boolean
  timestamp: number
}

// 全局状态
const tabs = ref<Tab[]>([])
const activeTabId = ref<string>('')
const nextTabId = ref(1)

export function useTabManager() {
  // 计算属性
  const activeTabs = computed(() => tabs.value)
  const activeTab = computed(() => tabs.value.find(tab => tab.id === activeTabId.value))
  const tabsCount = computed(() => tabs.value.length)
  const hasMultipleTabs = computed(() => tabs.value.length > 1)

  // 生成唯一ID
  const generateTabId = (): string => {
    return `tab-${nextTabId.value++}-${Date.now()}`
  }

  // 创建新页签
  const createTab = (route: RouteLocationNormalizedLoaded | any, options: {
    setActive?: boolean
    isClosable?: boolean
  } = {}): Tab => {
    const { isClosable = true } = options

    const newTab: Tab = {
      id: generateTabId(),
      title: route.meta?.title || route.name || route.path,
      path: route.path,
      icon: route.meta?.icon,
      component: route.matched?.[0]?.components?.default,
      meta: route.meta,
      isActive: false,
      isClosable,
      timestamp: Date.now()
    }

    return newTab
  }

  // 添加页签
  const addTab = (route: RouteLocationNormalizedLoaded | any, options: {
    setActive?: boolean
    isClosable?: boolean
    allowDuplicate?: boolean
  } = {}): string => {
    const { setActive = true, isClosable = true, allowDuplicate = false } = options

    // 检查是否已存在相同路径的页签
    if (!allowDuplicate) {
      const existingTab = tabs.value.find(tab => tab.path === route.path)
      if (existingTab) {
        if (setActive) {
          setActiveTab(existingTab.id)
        }
        return existingTab.id
      }
    }

    const newTab = createTab(route, { setActive, isClosable })
    tabs.value.push(newTab)

    if (setActive) {
      setActiveTab(newTab.id)
    }

    return newTab.id
  }

  // 设置活动页签
  const setActiveTab = (tabId: string): void => {
    // 重置所有页签状态
    tabs.value.forEach(tab => {
      tab.isActive = tab.id === tabId
    })
    activeTabId.value = tabId
  }

  // 关闭页签
  const closeTab = (tabId: string): void => {
    const tabIndex = tabs.value.findIndex(tab => tab.id === tabId)
    if (tabIndex === -1) return

    const tab = tabs.value[tabIndex]
    if (!tab.isClosable) return

    // 如果关闭的是当前活动页签，需要切换到其他页签
    if (tab.isActive && tabs.value.length > 1) {
      // 优先切换到右侧页签，如果没有则切换到左侧
      const nextTab = tabs.value[tabIndex + 1] || tabs.value[tabIndex - 1]
      if (nextTab) {
        setActiveTab(nextTab.id)
      }
    }

    // 移除页签
    tabs.value.splice(tabIndex, 1)

    // 如果没有页签了，重置状态
    if (tabs.value.length === 0) {
      activeTabId.value = ''
    }
  }

  // 关闭其他页签
  const closeOtherTabs = (keepTabId: string): void => {
    const keepTab = tabs.value.find(tab => tab.id === keepTabId)
    if (!keepTab) return

    tabs.value = tabs.value.filter(tab => tab.id === keepTabId || !tab.isClosable)
    setActiveTab(keepTabId)
  }

  // 关闭所有页签
  const closeAllTabs = (): void => {
    tabs.value = tabs.value.filter(tab => !tab.isClosable)
    if (tabs.value.length > 0) {
      setActiveTab(tabs.value[0].id)
    } else {
      activeTabId.value = ''
    }
  }

  // 关闭右侧页签
  const closeRightTabs = (tabId: string): void => {
    const tabIndex = tabs.value.findIndex(tab => tab.id === tabId)
    if (tabIndex === -1) return

    const rightTabs = tabs.value.slice(tabIndex + 1)
    rightTabs.forEach(tab => {
      if (tab.isClosable) {
        closeTab(tab.id)
      }
    })
  }

  // 移动页签位置
  const moveTab = (fromIndex: number, toIndex: number): void => {
    if (fromIndex < 0 || fromIndex >= tabs.value.length ||
        toIndex < 0 || toIndex >= tabs.value.length) {
      return
    }

    const tab = tabs.value.splice(fromIndex, 1)[0]
    tabs.value.splice(toIndex, 0, tab)
  }

  // 刷新页签
  const refreshTab = (tabId: string): void => {
    const tab = tabs.value.find(tab => tab.id === tabId)
    if (tab) {
      tab.timestamp = Date.now()
      // 触发组件重新渲染
      nextTick(() => {
        // 可以在这里添加刷新逻辑
      })
    }
  }

  // 更新页签标题
  const updateTabTitle = (tabId: string, title: string): void => {
    const tab = tabs.value.find(tab => tab.id === tabId)
    if (tab) {
      tab.title = title
    }
  }

  // 获取页签信息
  const getTab = (tabId: string): Tab | undefined => {
    return tabs.value.find(tab => tab.id === tabId)
  }

  // 获取页签索引
  const getTabIndex = (tabId: string): number => {
    return tabs.value.findIndex(tab => tab.id === tabId)
  }

  // 判断页签是否存在
  const hasTab = (path: string): boolean => {
    return tabs.value.some(tab => tab.path === path)
  }

  // 获取指定路径的页签
  const getTabByPath = (path: string): Tab | undefined => {
    return tabs.value.find(tab => tab.path === path)
  }

  // 初始化首页页签
  const initializeHomeTabs = (homeRoute: any): void => {
    if (tabs.value.length === 0) {
      addTab(homeRoute, { isClosable: false })
    }
  }

  // 清理所有页签
  const clearAllTabs = (): void => {
    tabs.value = []
    activeTabId.value = ''
    nextTabId.value = 1
  }

  // 导出页签配置
  const exportTabsConfig = () => {
    return {
      tabs: tabs.value.map(tab => ({
        title: tab.title,
        path: tab.path,
        icon: tab.icon,
        isClosable: tab.isClosable
      })),
      activeTabId: activeTabId.value
    }
  }

  // 导入页签配置
  const importTabsConfig = (config: any): void => {
    if (config.tabs && Array.isArray(config.tabs)) {
      clearAllTabs()
      config.tabs.forEach((tabConfig: any) => {
        const mockRoute = {
          path: tabConfig.path,
          meta: {
            title: tabConfig.title,
            icon: tabConfig.icon
          }
        }
        addTab(mockRoute, {
          isClosable: tabConfig.isClosable,
          setActive: false
        })
      })
      
      if (config.activeTabId) {
        const targetTab = tabs.value.find(tab => 
          tab.path === config.activeTabId || tab.id === config.activeTabId
        )
        if (targetTab) {
          setActiveTab(targetTab.id)
        }
      }
    }
  }

  return {
    // 状态
    tabs: activeTabs,
    activeTab,
    activeTabId: computed(() => activeTabId.value),
    tabsCount,
    hasMultipleTabs,

    // 方法
    addTab,
    closeTab,
    closeOtherTabs,
    closeAllTabs,
    closeRightTabs,
    setActiveTab,
    moveTab,
    refreshTab,
    updateTabTitle,
    getTab,
    getTabIndex,
    hasTab,
    getTabByPath,
    initializeHomeTabs,
    clearAllTabs,
    exportTabsConfig,
    importTabsConfig
  }
}
