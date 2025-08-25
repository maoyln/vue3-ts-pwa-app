/**
 * @Author: maoyl maoyl@glodon.com
 * @Date: 2025-08-24 12:50:00
 * @LastEditors: maoyl maoyl@glodon.com
 * @LastEditTime: 2025-08-24 12:50:00
 * @FilePath: /my-vue3-ts-pwa-app/src/utils/pwaNetworkStrategy.ts
 * @Description: PWA网络策略优化配置
 */

// PWA网络策略配置
export interface PWANetworkConfig {
  // 缓存策略
  cacheStrategy: 'networkFirst' | 'cacheFirst' | 'networkOnly' | 'cacheOnly' | 'staleWhileRevalidate'
  
  // 缓存时间（毫秒）
  cacheTime: number
  
  // 网络超时时间（毫秒）
  networkTimeout: number
  
  // 是否启用后台同步
  backgroundSync: boolean
  
  // 是否启用预缓存
  precache: boolean
  
  // 重试配置
  retry: {
    enabled: boolean
    maxAttempts: number
    delay: number
  }
}

// 不同类型资源的网络策略配置
export const PWA_NETWORK_STRATEGIES = {
  // API接口 - 网络优先，支持离线回退
  API: {
    cacheStrategy: 'networkFirst',
    cacheTime: 5 * 60 * 1000,      // 5分钟
    networkTimeout: 8000,           // 8秒超时
    backgroundSync: true,
    precache: false,
    retry: {
      enabled: true,
      maxAttempts: 3,
      delay: 1000
    }
  } as PWANetworkConfig,

  // 静态资源 - 缓存优先
  STATIC: {
    cacheStrategy: 'cacheFirst',
    cacheTime: 24 * 60 * 60 * 1000, // 24小时
    networkTimeout: 5000,
    backgroundSync: false,
    precache: true,
    retry: {
      enabled: true,
      maxAttempts: 2,
      delay: 500
    }
  } as PWANetworkConfig,

  // 图片资源 - 缓存优先，长期缓存
  IMAGES: {
    cacheStrategy: 'cacheFirst',
    cacheTime: 7 * 24 * 60 * 60 * 1000, // 7天
    networkTimeout: 10000,
    backgroundSync: false,
    precache: false,
    retry: {
      enabled: true,
      maxAttempts: 2,
      delay: 1000
    }
  } as PWANetworkConfig,

  // 字体文件 - 缓存优先，永久缓存
  FONTS: {
    cacheStrategy: 'cacheFirst',
    cacheTime: 365 * 24 * 60 * 60 * 1000, // 1年
    networkTimeout: 5000,
    backgroundSync: false,
    precache: true,
    retry: {
      enabled: true,
      maxAttempts: 2,
      delay: 500
    }
  } as PWANetworkConfig,

  // 文档页面 - 网络优先，快速回退
  DOCUMENTS: {
    cacheStrategy: 'networkFirst',
    cacheTime: 30 * 60 * 1000,      // 30分钟
    networkTimeout: 3000,           // 3秒快速超时
    backgroundSync: true,
    precache: false,
    retry: {
      enabled: true,
      maxAttempts: 2,
      delay: 500
    }
  } as PWANetworkConfig,

  // 天气数据 - 网络优先，短期缓存
  WEATHER: {
    cacheStrategy: 'networkFirst',
    cacheTime: 10 * 60 * 1000,      // 10分钟
    networkTimeout: 5000,
    backgroundSync: true,
    precache: false,
    retry: {
      enabled: true,
      maxAttempts: 3,
      delay: 1000
    }
  } as PWANetworkConfig,

  // 新闻数据 - 网络优先，中期缓存
  NEWS: {
    cacheStrategy: 'networkFirst',
    cacheTime: 15 * 60 * 1000,      // 15分钟
    networkTimeout: 8000,
    backgroundSync: true,
    precache: false,
    retry: {
      enabled: true,
      maxAttempts: 3,
      delay: 1000
    }
  } as PWANetworkConfig,

  // 用户数据 - 网络优先，支持离线编辑
  USER_DATA: {
    cacheStrategy: 'networkFirst',
    cacheTime: 2 * 60 * 1000,       // 2分钟（用户数据变化频繁）
    networkTimeout: 5000,
    backgroundSync: true,
    precache: false,
    retry: {
      enabled: true,
      maxAttempts: 3,
      delay: 1000
    }
  } as PWANetworkConfig
} as const

// 根据URL匹配策略
export function getNetworkStrategy(url: string): PWANetworkConfig {
  const urlObj = new URL(url)
  const pathname = urlObj.pathname.toLowerCase()
  const origin = urlObj.origin

  // API接口
  if (
    origin.includes('jsonplaceholder.typicode.com') ||
    pathname.startsWith('/api/') ||
    pathname.includes('/users') ||
    pathname.includes('/posts') ||
    pathname.includes('/comments') ||
    pathname.includes('/albums')
  ) {
    return PWA_NETWORK_STRATEGIES.API
  }

  // 天气API
  if (origin.includes('openweathermap.org')) {
    return PWA_NETWORK_STRATEGIES.WEATHER
  }

  // 新闻API
  if (origin.includes('newsapi.org')) {
    return PWA_NETWORK_STRATEGIES.NEWS
  }

  // 图片资源
  if (
    pathname.match(/\.(jpg|jpeg|png|gif|webp|svg|ico)$/i) ||
    origin.includes('images') ||
    pathname.includes('/photos')
  ) {
    return PWA_NETWORK_STRATEGIES.IMAGES
  }

  // 字体文件
  if (
    pathname.match(/\.(woff|woff2|ttf|eot)$/i) ||
    origin.includes('fonts.googleapis.com') ||
    origin.includes('fonts.gstatic.com')
  ) {
    return PWA_NETWORK_STRATEGIES.FONTS
  }

  // 静态资源
  if (
    pathname.match(/\.(js|css|html)$/i) ||
    pathname.startsWith('/assets/') ||
    pathname.startsWith('/static/')
  ) {
    return PWA_NETWORK_STRATEGIES.STATIC
  }

  // 文档页面
  if (
    pathname.includes('/documents') ||
    pathname.includes('/doc') ||
    pathname.match(/\.(pdf|doc|docx)$/i)
  ) {
    return PWA_NETWORK_STRATEGIES.DOCUMENTS
  }

  // 用户相关数据
  if (
    pathname.includes('/user') ||
    pathname.includes('/profile') ||
    pathname.includes('/settings')
  ) {
    return PWA_NETWORK_STRATEGIES.USER_DATA
  }

  // 默认使用API策略
  return PWA_NETWORK_STRATEGIES.API
}

// PWA缓存管理器
export class PWACacheManager {
  private static instance: PWACacheManager
  private cacheNames = {
    STATIC: 'pwa-static-v1',
    API: 'pwa-api-v1',
    IMAGES: 'pwa-images-v1',
    FONTS: 'pwa-fonts-v1',
    RUNTIME: 'pwa-runtime-v1'
  }

  static getInstance(): PWACacheManager {
    if (!PWACacheManager.instance) {
      PWACacheManager.instance = new PWACacheManager()
    }
    return PWACacheManager.instance
  }

  // 获取缓存名称
  getCacheName(strategy: PWANetworkConfig): string {
    switch (strategy.cacheStrategy) {
      case 'cacheFirst':
        if (strategy === PWA_NETWORK_STRATEGIES.STATIC) return this.cacheNames.STATIC
        if (strategy === PWA_NETWORK_STRATEGIES.IMAGES) return this.cacheNames.IMAGES
        if (strategy === PWA_NETWORK_STRATEGIES.FONTS) return this.cacheNames.FONTS
        return this.cacheNames.RUNTIME
      case 'networkFirst':
      case 'staleWhileRevalidate':
        return this.cacheNames.API
      default:
        return this.cacheNames.RUNTIME
    }
  }

  // 清理过期缓存
  async cleanupExpiredCache(): Promise<void> {
    const cacheNames = await caches.keys()
    
    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName)
      const requests = await cache.keys()
      
      for (const request of requests) {
        const response = await cache.match(request)
        if (response) {
          const cachedTime = response.headers.get('sw-cached-time')
          if (cachedTime) {
            const age = Date.now() - parseInt(cachedTime)
            const strategy = getNetworkStrategy(request.url)
            
            if (age > strategy.cacheTime) {
              await cache.delete(request)
              console.log(`🗑️ 清理过期缓存: ${request.url}`)
            }
          }
        }
      }
    }
  }

  // 预缓存重要资源
  async precacheResources(urls: string[]): Promise<void> {
    const cache = await caches.open(this.cacheNames.STATIC)
    
    for (const url of urls) {
      try {
        const response = await fetch(url)
        if (response.ok) {
          await cache.put(url, response)
          console.log(`📦 预缓存成功: ${url}`)
        }
      } catch (error) {
        console.warn(`⚠️ 预缓存失败: ${url}`, error)
      }
    }
  }

  // 获取缓存统计信息
  async getCacheStats(): Promise<{
    totalSize: number
    cacheCount: number
    caches: Array<{
      name: string
      size: number
      count: number
    }>
  }> {
    const cacheNames = await caches.keys()
    const stats = {
      totalSize: 0,
      cacheCount: cacheNames.length,
      caches: [] as Array<{
        name: string
        size: number
        count: number
      }>
    }

    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName)
      const requests = await cache.keys()
      let cacheSize = 0

      for (const request of requests) {
        const response = await cache.match(request)
        if (response) {
          const blob = await response.blob()
          cacheSize += blob.size
        }
      }

      stats.caches.push({
        name: cacheName,
        size: cacheSize,
        count: requests.length
      })

      stats.totalSize += cacheSize
    }

    return stats
  }

  // 清空所有缓存
  async clearAllCaches(): Promise<void> {
    const cacheNames = await caches.keys()
    await Promise.all(
      cacheNames.map(cacheName => caches.delete(cacheName))
    )
    console.log('🗑️ 已清空所有缓存')
  }
}

// 网络状态监控
export class NetworkMonitor {
  private static instance: NetworkMonitor
  private listeners: Array<(online: boolean) => void> = []
  private _isOnline = navigator.onLine

  static getInstance(): NetworkMonitor {
    if (!NetworkMonitor.instance) {
      NetworkMonitor.instance = new NetworkMonitor()
    }
    return NetworkMonitor.instance
  }

  constructor() {
    this.setupEventListeners()
  }

  private setupEventListeners(): void {
    window.addEventListener('online', () => {
      this._isOnline = true
      this.notifyListeners(true)
      console.log('🌐 网络已连接')
    })

    window.addEventListener('offline', () => {
      this._isOnline = false
      this.notifyListeners(false)
      console.log('📴 网络已断开')
    })
  }

  private notifyListeners(online: boolean): void {
    this.listeners.forEach(listener => {
      try {
        listener(online)
      } catch (error) {
        console.error('网络状态监听器错误:', error)
      }
    })
  }

  get isOnline(): boolean {
    return this._isOnline
  }

  // 添加网络状态监听器
  addListener(listener: (online: boolean) => void): void {
    this.listeners.push(listener)
  }

  // 移除网络状态监听器
  removeListener(listener: (online: boolean) => void): void {
    const index = this.listeners.indexOf(listener)
    if (index > -1) {
      this.listeners.splice(index, 1)
    }
  }

  // 检测网络连接质量
  async checkNetworkQuality(): Promise<{
    online: boolean
    speed: 'fast' | 'slow' | 'offline'
    latency: number
  }> {
    if (!this._isOnline) {
      return { online: false, speed: 'offline', latency: -1 }
    }

    try {
      const startTime = Date.now()
      const response = await fetch('/favicon.ico', {
        method: 'HEAD',
        cache: 'no-cache'
      })
      const latency = Date.now() - startTime

      if (!response.ok) {
        return { online: false, speed: 'offline', latency: -1 }
      }

      const speed = latency < 500 ? 'fast' : 'slow'
      return { online: true, speed, latency }
    } catch (error) {
      return { online: false, speed: 'offline', latency: -1 }
    }
  }
}

// 导出单例实例
export const pwaCache = PWACacheManager.getInstance()
export const networkMonitor = NetworkMonitor.getInstance()

// 导出配置
export default PWA_NETWORK_STRATEGIES
