/**
 * 页签工具函数
 * 提供全局的页签操作方法，模拟 window.open 行为但在PWA内部打开
 */
import { useTabManager } from '../composables/useTabManager'
import { useRouter } from 'vue-router'

// 定义页签选项接口
export interface TabOptions {
  title?: string
  icon?: string
  closable?: boolean
  setActive?: boolean
  allowDuplicate?: boolean
}

// 定义全局页签管理器实例
let tabManagerInstance: ReturnType<typeof useTabManager> | null = null
let routerInstance: ReturnType<typeof useRouter> | null = null

// 初始化全局实例
export function initTabUtils() {
  if (typeof window !== 'undefined') {
    // 只在浏览器环境中初始化
    try {
      tabManagerInstance = useTabManager()
      routerInstance = useRouter()
    } catch (error) {
      console.warn('页签工具初始化失败，可能不在Vue组件上下文中')
    }
  }
}

/**
 * 在新页签中打开页面（模拟window.open行为）
 * @param url 要打开的URL路径
 * @param options 页签选项
 * @returns 页签ID
 */
export function openInNewTab(url: string, options: TabOptions = {}): string | null {
  if (!tabManagerInstance || !routerInstance) {
    console.warn('页签管理器未初始化，请先调用 initTabUtils()')
    return null
  }

  const {
    title,
    icon,
    closable = true,
    setActive = true,
    allowDuplicate = false
  } = options

  // 创建模拟路由对象
  const mockRoute = {
    path: url,
    name: title || extractTitleFromPath(url),
    meta: {
      title: title || extractTitleFromPath(url),
      icon: icon || getDefaultIcon(url)
    }
  }

  // 添加到页签管理器
  const tabId = tabManagerInstance.addTab(mockRoute, {
    isClosable: closable,
    setActive,
    allowDuplicate
  })

  // 如果设置为活动页签，则导航到对应路由
  if (setActive && routerInstance) {
    routerInstance.push(url)
  }

  return tabId
}

/**
 * 根据路径提取标题
 */
function extractTitleFromPath(path: string): string {
  const pathMap: Record<string, string> = {
    '/': '首页',
    '/weather': '天气预报',
    '/news': '新闻资讯',
    '/users': '用户管理',
    '/posts': '文章管理',
    '/comments': '评论管理',
    '/albums': '相册管理',
    '/documents': '文档管理',
    '/api-demo': 'API演示',
    '/pwa-dashboard': 'PWA控制面板',
    '/about': '关于'
  }

  return pathMap[path] || path.split('/').pop() || '新页面'
}

/**
 * 根据路径获取默认图标
 */
function getDefaultIcon(path: string): string {
  const iconMap: Record<string, string> = {
    '/': '🏠',
    '/weather': '🌤️',
    '/news': '📰',
    '/users': '👥',
    '/posts': '📝',
    '/comments': '💬',
    '/albums': '📸',
    '/documents': '📄',
    '/api-demo': '🚀',
    '/pwa-dashboard': '📊',
    '/about': 'ℹ️'
  }

  return iconMap[path] || '📄'
}

/**
 * 关闭指定页签
 */
export function closeTab(tabId: string): void {
  if (!tabManagerInstance) {
    console.warn('页签管理器未初始化')
    return
  }
  tabManagerInstance.closeTab(tabId)
}

/**
 * 关闭所有页签
 */
export function closeAllTabs(): void {
  if (!tabManagerInstance) {
    console.warn('页签管理器未初始化')
    return
  }
  tabManagerInstance.closeAllTabs()
}

/**
 * 获取当前活动页签
 */
export function getCurrentTab() {
  if (!tabManagerInstance) {
    console.warn('页签管理器未初始化')
    return null
  }
  return tabManagerInstance.activeTab.value
}

/**
 * 获取所有页签
 */
export function getAllTabs() {
  if (!tabManagerInstance) {
    console.warn('页签管理器未初始化')
    return []
  }
  return tabManagerInstance.tabs.value
}

/**
 * 切换到指定页签
 */
export function switchToTab(tabId: string): void {
  if (!tabManagerInstance || !routerInstance) {
    console.warn('页签管理器未初始化')
    return
  }

  const tab = tabManagerInstance.getTab(tabId)
  if (tab) {
    tabManagerInstance.setActiveTab(tabId)
    routerInstance.push(tab.path)
  }
}

/**
 * 刷新页签
 */
export function refreshTab(tabId?: string): void {
  if (!tabManagerInstance) {
    console.warn('页签管理器未初始化')
    return
  }

  const targetTabId = tabId || tabManagerInstance.activeTabId.value
  if (targetTabId) {
    tabManagerInstance.refreshTab(targetTabId)
    
    // 如果是当前活动页签，重新加载页面
    if (routerInstance && targetTabId === tabManagerInstance.activeTabId.value) {
      routerInstance.go(0)
    }
  }
}

// 在 window 对象上挂载全局方法（模拟window.open）
if (typeof window !== 'undefined') {
  // 添加全局方法到 window 对象
  (window as any).openInNewTab = openInNewTab;
  (window as any).closeTab = closeTab;
  (window as any).closeAllTabs = closeAllTabs;
  (window as any).getCurrentTab = getCurrentTab;
  (window as any).getAllTabs = getAllTabs;
  (window as any).switchToTab = switchToTab;
  (window as any).refreshTab = refreshTab;
}

// 默认导出所有方法
export default {
  openInNewTab,
  closeTab,
  closeAllTabs,
  getCurrentTab,
  getAllTabs,
  switchToTab,
  refreshTab,
  initTabUtils
}
