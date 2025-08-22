/**
 * Vue3 PWA Service Worker 注册管理器
 * 
 * 功能特性：
 * 1. Service Worker 注册和生命周期管理
 * 2. 自动更新检测和处理
 * 3. 离线状态监控
 * 4. 推送通知权限管理
 * 5. 安装提示处理
 * 6. 错误处理和重试机制
 * 7. 与主应用的消息通信
 */

// 类型定义
interface ServiceWorkerConfig {
  swUrl?: string
  scope?: string
  updateInterval?: number
  enableNotifications?: boolean
  enableBackgroundSync?: boolean
}

interface UpdateInfo {
  isUpdateAvailable: boolean
  registration?: ServiceWorkerRegistration
  newWorker?: ServiceWorker
  timestamp: number
}

interface InstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

// 默认配置
const DEFAULT_CONFIG: Required<ServiceWorkerConfig> = {
  swUrl: '/sw.js',
  scope: '/',
  updateInterval: 60000, // 1分钟检查一次更新
  enableNotifications: true,
  enableBackgroundSync: true
}

// 全局状态
let swRegistration: ServiceWorkerRegistration | null = null
let updateCheckInterval: number | null = null
let installPromptEvent: InstallPromptEvent | null = null
let isOnline = navigator.onLine

/**
 * 主注册函数 - 初始化Service Worker
 * @param config 配置选项
 */
export default function register(config: ServiceWorkerConfig = {}) {
  // 检查浏览器支持
  if (!('serviceWorker' in navigator)) {
    console.warn('⚠️ 当前浏览器不支持Service Worker')
    return Promise.reject(new Error('Service Worker not supported'))
  }

  const finalConfig = { ...DEFAULT_CONFIG, ...config }
  
  console.log('🚀 开始注册Service Worker...')
  console.log('📋 配置信息:', finalConfig)

  // 等待页面完全加载后再注册
  return new Promise<ServiceWorkerRegistration>((resolve, reject) => {
    if (document.readyState === 'complete') {
      registerServiceWorker(finalConfig).then(resolve).catch(reject)
    } else {
    window.addEventListener('load', () => {
        registerServiceWorker(finalConfig).then(resolve).catch(reject)
      })
    }
  })
}

/**
 * 注册Service Worker的核心逻辑
 */
async function registerServiceWorker(config: Required<ServiceWorkerConfig>): Promise<ServiceWorkerRegistration> {
  try {
    // 注册Service Worker
    const registration = await navigator.serviceWorker.register(config.swUrl, { 
      scope: config.scope,
      updateViaCache: 'imports' // 优化更新策略
    })

    swRegistration = registration
    console.log('✅ Service Worker 注册成功:', registration)

    // 设置事件监听器
    setupEventListeners(registration, config)

    // 启动定期更新检查
    if (config.updateInterval > 0) {
      startUpdateChecker(registration, config.updateInterval)
    }

    // 初始化推送通知
    if (config.enableNotifications) {
      await initializeNotifications(registration)
    }

    // 初始化后台同步
    if (config.enableBackgroundSync) {
      initializeBackgroundSync(registration)
    }

    // 监听网络状态变化
    setupNetworkMonitoring()

    // 监听应用安装提示
    setupInstallPrompt()

    // 设置与Service Worker的消息通信
    setupMessageChannel(registration)

    return registration

  } catch (error) {
    console.error('❌ Service Worker 注册失败:', error)
    
    // 错误重试机制
    setTimeout(() => {
      console.log('🔄 尝试重新注册Service Worker...')
      registerServiceWorker(config)
    }, 5000)

    throw error
  }
}

/**
 * 设置事件监听器
 */
function setupEventListeners(registration: ServiceWorkerRegistration, _config: Required<ServiceWorkerConfig>) {
  // 监听Service Worker状态变化
          registration.addEventListener('updatefound', () => {
    console.log('🔄 检测到Service Worker更新')
    handleUpdateFound(registration)
  })

  // 监听Service Worker控制器变化
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    console.log('🔄 Service Worker控制器已更改')
    // 可以选择自动刷新页面
    if (confirm('应用已更新，是否刷新页面以应用更新？')) {
      window.location.reload()
    }
  })

  // 监听来自Service Worker的消息
  navigator.serviceWorker.addEventListener('message', (event) => {
    handleServiceWorkerMessage(event.data)
  })
}

/**
 * 处理Service Worker更新发现
 */
function handleUpdateFound(registration: ServiceWorkerRegistration) {
            const newWorker = registration.installing

  if (!newWorker) return

  console.log('📦 新的Service Worker正在安装...')

              newWorker.addEventListener('statechange', () => {
    console.log('🔄 Service Worker状态变更:', newWorker.state)

    switch (newWorker.state) {
      case 'installed':
                  if (navigator.serviceWorker.controller) {
          // 有新版本可用
          console.log('🆕 新版本已准备就绪')
          notifyUpdateAvailable(registration, newWorker)
                  } else {
          // 首次安装
          console.log('✅ 应用已缓存，可离线使用')
          notifyAppReady()
        }
        break

      case 'activated':
        console.log('✅ 新版本Service Worker已激活')
        notifyUpdateActivated()
        break

      case 'redundant':
        console.log('❌ Service Worker已过时')
        break
    }
  })
}

/**
 * 通知更新可用
 */
function notifyUpdateAvailable(registration: ServiceWorkerRegistration, newWorker: ServiceWorker) {
  const updateInfo: UpdateInfo = {
    isUpdateAvailable: true,
    registration,
    newWorker,
    timestamp: Date.now()
  }

  // 派发自定义事件
  const event = new CustomEvent('swUpdateAvailable', { 
    detail: updateInfo 
  })
  document.dispatchEvent(event)

  // 存储更新信息到localStorage
  localStorage.setItem('swUpdateInfo', JSON.stringify({
    timestamp: updateInfo.timestamp,
    version: 'pending'
  }))
}

/**
 * 通知应用就绪
 */
function notifyAppReady() {
  const event = new CustomEvent('swAppReady', {
    detail: { timestamp: Date.now() }
  })
  document.dispatchEvent(event)

  console.log('🎉 PWA应用已就绪，支持离线访问')
}

/**
 * 通知更新已激活
 */
function notifyUpdateActivated() {
  const event = new CustomEvent('swUpdateActivated', {
    detail: { timestamp: Date.now() }
  })
  document.dispatchEvent(event)

  // 清理更新信息
  localStorage.removeItem('swUpdateInfo')
}

/**
 * 启动定期更新检查
 */
function startUpdateChecker(registration: ServiceWorkerRegistration, interval: number) {
  // 清理之前的定时器
  if (updateCheckInterval) {
    clearInterval(updateCheckInterval)
  }

  updateCheckInterval = window.setInterval(() => {
    // 只在页面可见时检查更新
    if (!document.hidden) {
      console.log('🔍 检查Service Worker更新...')
      registration.update().catch(error => {
        console.warn('更新检查失败:', error)
      })
    }
  }, interval)

  // 页面卸载时清理定时器
  window.addEventListener('beforeunload', () => {
    if (updateCheckInterval) {
      clearInterval(updateCheckInterval)
    }
  })
}

/**
 * 初始化推送通知
 */
async function initializeNotifications(registration: ServiceWorkerRegistration) {
  try {
    // 检查通知权限
    if (!('Notification' in window)) {
      console.warn('⚠️ 浏览器不支持通知功能')
      return
    }

    let permission = Notification.permission

    // 如果权限未确定，请求权限
    if (permission === 'default') {
      permission = await Notification.requestPermission()
    }

    if (permission === 'granted') {
      console.log('✅ 通知权限已获取')
      
      // 订阅推送通知（需要VAPID密钥）
      try {
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          // applicationServerKey: 'YOUR_VAPID_PUBLIC_KEY' // 需要配置VAPID密钥
        })
        console.log('📱 推送订阅成功:', subscription)
      } catch (error) {
        console.warn('推送订阅失败（可能需要配置VAPID密钥）:', error)
      }
    } else {
      console.log('❌ 通知权限被拒绝')
    }
  } catch (error) {
    console.error('初始化通知失败:', error)
  }
}

/**
 * 初始化后台同步
 */
function initializeBackgroundSync(registration: ServiceWorkerRegistration) {
  if ('sync' in registration) {
    console.log('✅ 后台同步功能可用')
    
    // 注册后台同步
    const syncManager = (registration as any).sync
    if (syncManager && typeof syncManager.register === 'function') {
      syncManager.register('background-sync').catch((error: any) => {
        console.warn('注册后台同步失败:', error)
      })
    }
  } else {
    console.warn('⚠️ 浏览器不支持后台同步')
  }
}

/**
 * 设置网络状态监控
 */
function setupNetworkMonitoring() {
  const handleOnline = () => {
    isOnline = true
    console.log('🌐 网络已连接')
    
    const event = new CustomEvent('networkStatusChange', {
      detail: { isOnline: true }
    })
    document.dispatchEvent(event)

    // 网络恢复时检查更新
    if (swRegistration) {
      swRegistration.update().catch(() => {})
    }
  }

  const handleOffline = () => {
    isOnline = false
    console.log('📡 网络已断开')
    
    const event = new CustomEvent('networkStatusChange', {
      detail: { isOnline: false }
    })
    document.dispatchEvent(event)
  }

  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)

  // 初始状态
  console.log('🌐 当前网络状态:', isOnline ? '在线' : '离线')
}

/**
 * 设置应用安装提示
 */
function setupInstallPrompt() {
  window.addEventListener('beforeinstallprompt', (e) => {
    console.log('📱 检测到安装提示事件')
    
    // 阻止默认的安装提示
    e.preventDefault()
    
    // 保存事件以便稍后使用
    installPromptEvent = e as InstallPromptEvent

    // 派发自定义事件
    const event = new CustomEvent('appInstallPrompt', {
      detail: { canInstall: true }
    })
    document.dispatchEvent(event)
  })

  // 监听应用安装完成
  window.addEventListener('appinstalled', () => {
    console.log('🎉 PWA应用安装成功')
    installPromptEvent = null

    const event = new CustomEvent('appInstalled', {
      detail: { timestamp: Date.now() }
    })
    document.dispatchEvent(event)
  })
}

/**
 * 设置消息通道
 */
function setupMessageChannel(registration: ServiceWorkerRegistration) {
  // 监听来自Service Worker的消息
  navigator.serviceWorker.addEventListener('message', (event) => {
    handleServiceWorkerMessage(event.data)
  })

  // 发送初始化消息给Service Worker
  if (registration.active) {
    registration.active.postMessage({
      type: 'CLIENT_READY',
      payload: { timestamp: Date.now() }
    })
  }
}

/**
 * 处理来自Service Worker的消息
 */
function handleServiceWorkerMessage(data: any) {
  console.log('💬 收到Service Worker消息:', data)

  const { type, payload } = data

  switch (type) {
    case 'SW_READY':
      console.log('✅ Service Worker就绪:', payload)
      break

    case 'BACKGROUND_SYNC_SUCCESS':
      console.log('🔄 后台同步成功:', payload)
      break

    case 'NAVIGATE_TO':
      // 处理导航请求（来自通知点击等）
      if (payload.url) {
        window.location.href = payload.url
      }
      break

    default:
      console.log('未知消息类型:', type)
  }
}

/**
 * 工具函数 - 手动触发应用安装
 */
export function triggerInstallPrompt(): Promise<boolean> {
  return new Promise((resolve) => {
    if (!installPromptEvent) {
      console.warn('⚠️ 安装提示不可用')
      resolve(false)
      return
    }

    installPromptEvent.prompt()

    installPromptEvent.userChoice.then((choiceResult) => {
      const accepted = choiceResult.outcome === 'accepted'
      console.log('用户安装选择:', accepted ? '接受' : '拒绝')
      
      if (accepted) {
        installPromptEvent = null
      }
      
      resolve(accepted)
    })
  })
}

/**
 * 工具函数 - 手动触发更新
 */
export function triggerUpdate(): Promise<boolean> {
  return new Promise((resolve) => {
    if (!swRegistration) {
      console.warn('⚠️ Service Worker未注册')
      resolve(false)
      return
    }

    const updateInfo = localStorage.getItem('swUpdateInfo')
    if (!updateInfo) {
      console.warn('⚠️ 没有可用的更新')
      resolve(false)
      return
    }

    // 发送跳过等待消息
    if (swRegistration.waiting) {
      swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' })
      resolve(true)
    } else {
      console.warn('⚠️ 没有等待中的Service Worker')
      resolve(false)
    }
  })
}

/**
 * 工具函数 - 获取Service Worker状态
 */
export function getServiceWorkerStatus() {
  return {
    isSupported: 'serviceWorker' in navigator,
    registration: swRegistration,
    isOnline,
    canInstall: !!installPromptEvent,
    hasUpdate: !!localStorage.getItem('swUpdateInfo')
  }
}

/**
 * 工具函数 - 清理缓存
 */
export async function clearCache(cacheName?: string): Promise<boolean> {
  try {
    if (!swRegistration?.active) {
      console.warn('⚠️ Service Worker未激活')
      return false
    }

    // 发送清理缓存消息
    swRegistration.active.postMessage({
      type: 'CLEAR_CACHE',
      payload: { cacheName }
    })

    console.log('🧹 缓存清理请求已发送')
    return true
  } catch (error) {
    console.error('缓存清理失败:', error)
    return false
  }
}

/**
 * 工具函数 - 预加载资源
 */
export async function prefetchResources(urls: string[]): Promise<boolean> {
  try {
    if (!swRegistration?.active) {
      console.warn('⚠️ Service Worker未激活')
      return false
    }

    swRegistration.active.postMessage({
      type: 'PREFETCH_RESOURCES',
      payload: { urls }
    })

    console.log('📦 资源预加载请求已发送:', urls)
    return true
  } catch (error) {
    console.error('资源预加载失败:', error)
    return false
  }
}

/**
 * 工具函数 - 刷新API缓存
 */
export async function refreshApiCache(url?: string): Promise<boolean> {
  try {
    if (!swRegistration?.active) {
      console.warn('⚠️ Service Worker未激活')
      return false
    }

    swRegistration.active.postMessage({
      type: 'REFRESH_API_CACHE',
      payload: { url }
    })

    console.log('🔄 API缓存刷新请求已发送:', url || '所有API')
    return true
  } catch (error) {
    console.error('刷新API缓存失败:', error)
    return false
  }
}

/**
 * 工具函数 - 获取缓存信息
 */
export async function getCacheInfo(): Promise<any> {
  return new Promise((resolve, reject) => {
    try {
      if (!swRegistration?.active) {
        console.warn('⚠️ Service Worker未激活')
        reject(new Error('Service Worker未激活'))
        return
      }

      const channel = new MessageChannel()
      
      channel.port1.onmessage = (event) => {
        resolve(event.data)
      }

      swRegistration.active.postMessage({
        type: 'GET_CACHE_INFO',
        payload: {}
      }, [channel.port2])

      // 设置超时
      setTimeout(() => {
        reject(new Error('获取缓存信息超时'))
      }, 5000)

    } catch (error) {
      console.error('获取缓存信息失败:', error)
      reject(error)
    }
  })
}

// 自动执行注册（可选）
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
  // 生产环境自动注册
  register().catch(error => {
    console.error('Service Worker自动注册失败:', error)
  })
}

// 开发模式下的调试信息
if (process.env.NODE_ENV === 'development') {
  console.log('🛠️ 开发模式 - Service Worker注册器已加载')
  
  // 开发模式下可以手动注册
  // register({ updateInterval: 10000 }) // 10秒检查一次更新
}