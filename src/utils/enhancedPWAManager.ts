/**
 * @Author: maoyl maoyl@glodon.com
 * @Date: 2025-08-24 13:35:00
 * @LastEditors: maoyl maoyl@glodon.com
 * @LastEditTime: 2025-08-24 13:35:00
 * @FilePath: /my-vue3-ts-pwa-app/src/utils/enhancedPWAManager.ts
 * @Description: 增强的PWA管理器 - 提供更灵活和可扩展的PWA功能
 */

import { reactive, computed } from 'vue'
import { pwaCache, networkMonitor } from './pwaNetworkStrategy'
import http from './http'

// PWA状态接口
export interface PWAState {
  isOnline: boolean
  isInstalled: boolean
  isUpdateAvailable: boolean
  installPromptEvent: any
  networkQuality: {
    speed: 'fast' | 'slow' | 'offline'
    latency: number
    effectiveType?: string
  }
  cacheStats: {
    totalSize: number
    cacheCount: number
    hitRate: number
  }
  syncQueue: {
    pending: number
    failed: number
    completed: number
  }
}

// PWA配置接口
export interface PWAConfig {
  // 缓存配置
  cache: {
    maxSize: number              // 最大缓存大小（字节）
    maxAge: number              // 默认缓存时间（毫秒）
    cleanupInterval: number     // 清理间隔（毫秒）
    strategies: Record<string, any>
  }
  
  // 同步配置
  sync: {
    enabled: boolean
    retryInterval: number       // 重试间隔（毫秒）
    maxRetries: number         // 最大重试次数
    batchSize: number          // 批量同步大小
  }
  
  // 安装配置
  install: {
    autoPrompt: boolean        // 自动显示安装提示
    promptDelay: number        // 提示延迟（毫秒）
    criteria: {
      minVisits: number        // 最小访问次数
      minEngagement: number    // 最小参与时间（毫秒）
    }
  }
  
  // 更新配置
  update: {
    autoCheck: boolean         // 自动检查更新
    checkInterval: number      // 检查间隔（毫秒）
    forceUpdate: boolean       // 强制更新
  }
  
  // 监控配置
  monitoring: {
    enabled: boolean
    reportInterval: number     // 报告间隔（毫秒）
    metrics: string[]          // 监控指标
  }
}

// 默认PWA配置
const DEFAULT_PWA_CONFIG: PWAConfig = {
  cache: {
    maxSize: 50 * 1024 * 1024,    // 50MB
    maxAge: 24 * 60 * 60 * 1000,  // 24小时
    cleanupInterval: 60 * 60 * 1000, // 1小时
    strategies: {}
  },
  sync: {
    enabled: true,
    retryInterval: 30 * 1000,     // 30秒
    maxRetries: 3,
    batchSize: 10
  },
  install: {
    autoPrompt: true,
    promptDelay: 3 * 1000,        // 3秒
    criteria: {
      minVisits: 3,
      minEngagement: 30 * 1000    // 30秒
    }
  },
  update: {
    autoCheck: true,
    checkInterval: 30 * 60 * 1000, // 30分钟
    forceUpdate: false
  },
  monitoring: {
    enabled: true,
    reportInterval: 5 * 60 * 1000, // 5分钟
    metrics: ['cache', 'network', 'performance', 'errors']
  }
}

/**
 * 增强的PWA管理器类
 */
export class EnhancedPWAManager {
  private static instance: EnhancedPWAManager
  private config: PWAConfig
  private state: PWAState
  private listeners: Map<string, Function[]> = new Map()
  private timers: Map<string, NodeJS.Timeout> = new Map()

  constructor(config: Partial<PWAConfig> = {}) {
    this.config = { ...DEFAULT_PWA_CONFIG, ...config }
    this.state = reactive({
      isOnline: navigator.onLine,
      isInstalled: this.checkInstallStatus(),
      isUpdateAvailable: false,
      installPromptEvent: null,
      networkQuality: {
        speed: 'fast',
        latency: 0
      },
      cacheStats: {
        totalSize: 0,
        cacheCount: 0,
        hitRate: 0
      },
      syncQueue: {
        pending: 0,
        failed: 0,
        completed: 0
      }
    })

    this.initialize()
  }

  static getInstance(config?: Partial<PWAConfig>): EnhancedPWAManager {
    if (!EnhancedPWAManager.instance) {
      EnhancedPWAManager.instance = new EnhancedPWAManager(config)
    }
    return EnhancedPWAManager.instance
  }

  /**
   * 初始化PWA管理器
   */
  private async initialize(): Promise<void> {
    console.log('🚀 初始化增强PWA管理器...')

    // 设置网络监听
    this.setupNetworkListeners()
    
    // 设置安装监听
    this.setupInstallListeners()
    
    // 设置更新监听
    this.setupUpdateListeners()
    
    // 启动定时任务
    this.startTimers()
    
    // 初始化缓存统计
    await this.updateCacheStats()
    
    // 检查网络质量
    await this.checkNetworkQuality()

    console.log('✅ PWA管理器初始化完成')
  }

  /**
   * 设置网络监听器
   */
  private setupNetworkListeners(): void {
    networkMonitor.addListener((online) => {
      this.state.isOnline = online
      this.emit('networkChange', { online })
      
      if (online) {
        this.handleOnline()
      } else {
        this.handleOffline()
      }
    })
  }

  /**
   * 设置安装监听器
   */
  private setupInstallListeners(): void {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault()
      this.state.installPromptEvent = e
      
      if (this.config.install.autoPrompt) {
        setTimeout(() => {
          this.showInstallPrompt()
        }, this.config.install.promptDelay)
      }
      
      this.emit('installPromptReady', { event: e })
    })

    window.addEventListener('appinstalled', () => {
      this.state.isInstalled = true
      this.state.installPromptEvent = null
      this.emit('appInstalled', {})
      console.log('📱 PWA应用已安装')
    })
  }

  /**
   * 设置更新监听器
   */
  private setupUpdateListeners(): void {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'SW_UPDATE_AVAILABLE') {
          this.state.isUpdateAvailable = true
          this.emit('updateAvailable', { version: event.data.version })
        }
      })
    }
  }

  /**
   * 启动定时任务
   */
  private startTimers(): void {
    // 缓存清理定时器
    const cleanupTimer = setInterval(() => {
      this.cleanupCache()
    }, this.config.cache.cleanupInterval)
    this.timers.set('cleanup', cleanupTimer)

    // 更新检查定时器
    if (this.config.update.autoCheck) {
      const updateTimer = setInterval(() => {
        this.checkForUpdates()
      }, this.config.update.checkInterval)
      this.timers.set('update', updateTimer)
    }

    // 监控报告定时器
    if (this.config.monitoring.enabled) {
      const monitorTimer = setInterval(() => {
        this.reportMetrics()
      }, this.config.monitoring.reportInterval)
      this.timers.set('monitor', monitorTimer)
    }

    // 网络质量检查定时器
    const networkTimer = setInterval(() => {
      this.checkNetworkQuality()
    }, 60 * 1000) // 每分钟检查一次
    this.timers.set('network', networkTimer)
  }

  /**
   * 处理上线事件
   */
  private async handleOnline(): Promise<void> {
    console.log('🌐 网络已连接，开始同步离线数据...')
    
    // 检查网络质量
    await this.checkNetworkQuality()
    
    // 触发离线同步
    this.emit('online', {})
    
    // 更新缓存统计
    await this.updateCacheStats()
  }

  /**
   * 处理离线事件
   */
  private handleOffline(): void {
    console.log('📴 网络已断开，启用离线模式...')
    
    this.state.networkQuality = {
      speed: 'offline',
      latency: -1
    }
    
    this.emit('offline', {})
  }

  /**
   * 检查安装状态
   */
  private checkInstallStatus(): boolean {
    // 检查是否在独立模式下运行
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return true
    }
    
    // 检查是否在PWA环境中
    if ((window.navigator as any).standalone === true) {
      return true
    }
    
    return false
  }

  /**
   * 检查网络质量
   */
  private async checkNetworkQuality(): Promise<void> {
    try {
      const quality = await networkMonitor.checkNetworkQuality()
      this.state.networkQuality = quality
      
      // 根据网络质量调整配置
      this.adjustConfigByNetworkQuality(quality)
      
    } catch (error) {
      console.warn('网络质量检查失败:', error)
    }
  }

  /**
   * 根据网络质量调整配置
   */
  private adjustConfigByNetworkQuality(quality: any): void {
    if (quality.speed === 'slow') {
      // 慢网络时增加缓存时间
      this.config.cache.maxAge = 60 * 60 * 1000 // 1小时
      console.log('🐌 检测到慢网络，调整缓存策略')
    } else if (quality.speed === 'fast') {
      // 快网络时减少缓存时间
      this.config.cache.maxAge = 30 * 60 * 1000 // 30分钟
    }
  }

  /**
   * 更新缓存统计
   */
  private async updateCacheStats(): Promise<void> {
    try {
      const stats = await pwaCache.getCacheStats()
      this.state.cacheStats = {
        totalSize: stats.totalSize,
        cacheCount: stats.cacheCount,
        hitRate: this.calculateCacheHitRate()
      }
    } catch (error) {
      console.warn('更新缓存统计失败:', error)
    }
  }

  /**
   * 计算缓存命中率
   */
  private calculateCacheHitRate(): number {
    const httpStats = http.getCacheStats()
    // 这里可以实现更复杂的命中率计算逻辑
    return httpStats.size > 0 ? 0.8 : 0 // 示例值
  }

  /**
   * 清理过期缓存
   */
  private async cleanupCache(): Promise<void> {
    try {
      await pwaCache.cleanupExpiredCache()
      await this.updateCacheStats()
      console.log('🧹 缓存清理完成')
    } catch (error) {
      console.error('缓存清理失败:', error)
    }
  }

  /**
   * 检查更新
   */
  private async checkForUpdates(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready
        await registration.update()
        console.log('🔄 检查更新完成')
      } catch (error) {
        console.error('检查更新失败:', error)
      }
    }
  }

  /**
   * 报告监控指标
   */
  private reportMetrics(): void {
    const metrics = {
      timestamp: Date.now(),
      state: this.state,
      config: this.config,
      performance: this.getPerformanceMetrics()
    }
    
    this.emit('metricsReport', metrics)
    console.log('📊 监控指标报告:', metrics)
  }

  /**
   * 获取性能指标
   */
  private getPerformanceMetrics(): any {
    if ('performance' in window) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      return {
        loadTime: navigation.loadEventEnd - navigation.loadEventStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
        firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
      }
    }
    return {}
  }

  /**
   * 显示安装提示
   */
  public async showInstallPrompt(): Promise<boolean> {
    if (!this.state.installPromptEvent) {
      console.warn('安装提示事件不可用')
      return false
    }

    try {
      this.state.installPromptEvent.prompt()
      const { outcome } = await this.state.installPromptEvent.userChoice
      
      if (outcome === 'accepted') {
        console.log('✅ 用户接受了安装提示')
        return true
      } else {
        console.log('❌ 用户拒绝了安装提示')
        return false
      }
    } catch (error) {
      console.error('显示安装提示失败:', error)
      return false
    }
  }

  /**
   * 强制更新应用
   */
  public async forceUpdate(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready
        if (registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' })
          window.location.reload()
        }
      } catch (error) {
        console.error('强制更新失败:', error)
      }
    }
  }

  /**
   * 清除所有缓存
   */
  public async clearAllCaches(): Promise<void> {
    try {
      await pwaCache.clearAllCaches()
      http.clearCache()
      await this.updateCacheStats()
      console.log('🗑️ 所有缓存已清除')
      this.emit('cacheCleared', {})
    } catch (error) {
      console.error('清除缓存失败:', error)
    }
  }

  /**
   * 预缓存资源
   */
  public async precacheResources(urls: string[]): Promise<void> {
    try {
      await pwaCache.precacheResources(urls)
      await this.updateCacheStats()
      console.log('📦 资源预缓存完成')
      this.emit('precacheComplete', { urls })
    } catch (error) {
      console.error('预缓存失败:', error)
    }
  }

  /**
   * 获取PWA状态
   */
  public getState(): PWAState {
    return this.state
  }

  /**
   * 获取PWA配置
   */
  public getConfig(): PWAConfig {
    return this.config
  }

  /**
   * 更新配置
   */
  public updateConfig(newConfig: Partial<PWAConfig>): void {
    this.config = { ...this.config, ...newConfig }
    this.emit('configUpdated', { config: this.config })
  }

  /**
   * 事件监听
   */
  public on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event)!.push(callback)
  }

  /**
   * 移除事件监听
   */
  public off(event: string, callback: Function): void {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  /**
   * 触发事件
   */
  private emit(event: string, data: any): void {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error(`事件回调执行失败 [${event}]:`, error)
        }
      })
    }
  }

  /**
   * 销毁管理器
   */
  public destroy(): void {
    // 清除所有定时器
    this.timers.forEach((timer) => {
      clearInterval(timer)
    })
    this.timers.clear()

    // 清除所有监听器
    this.listeners.clear()

    console.log('🔥 PWA管理器已销毁')
  }
}

// 创建默认实例
export const pwaManager = EnhancedPWAManager.getInstance()

// 导出Vue组合式API
export function usePWA() {
  const manager = EnhancedPWAManager.getInstance()
  
  return {
    // 状态
    state: computed(() => manager.getState()),
    config: computed(() => manager.getConfig()),
    
    // 方法
    showInstallPrompt: () => manager.showInstallPrompt(),
    forceUpdate: () => manager.forceUpdate(),
    clearAllCaches: () => manager.clearAllCaches(),
    precacheResources: (urls: string[]) => manager.precacheResources(urls),
    updateConfig: (config: Partial<PWAConfig>) => manager.updateConfig(config),
    
    // 事件监听
    on: (event: string, callback: Function) => manager.on(event, callback),
    off: (event: string, callback: Function) => manager.off(event, callback)
  }
}

export default pwaManager
