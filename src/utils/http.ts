/**
 * @Author: maoyl maoyl@glodon.com
 * @Date: 2025-08-24 12:43:00
 * @LastEditors: maoyl maoyl@glodon.com
 * @LastEditTime: 2025-08-24 12:43:00
 * @FilePath: /my-vue3-ts-pwa-app/src/utils/http.ts
 * @Description: 基于axios的HTTP客户端封装，支持PWA离线缓存、重试机制、请求拦截等功能
 */

import axios, { AxiosError } from 'axios'
import type { 
  AxiosInstance, 
  AxiosRequestConfig, 
  AxiosResponse, 
  InternalAxiosRequestConfig
} from 'axios'

// 请求配置接口
export interface HttpRequestConfig extends AxiosRequestConfig {
  // PWA相关配置
  useCache?: boolean           // 是否使用缓存
  cacheTime?: number          // 缓存时间（毫秒）
  cacheStrategy?: 'networkFirst' | 'cacheFirst' | 'networkOnly' | 'cacheOnly'
  
  // 重试配置
  retry?: boolean             // 是否启用重试
  retryCount?: number         // 重试次数
  retryDelay?: number         // 重试延迟（毫秒）
  
  // 离线配置
  offlineSupport?: boolean    // 是否支持离线
  offlineMessage?: string     // 离线提示信息
  
  // 其他配置
  showLoading?: boolean       // 是否显示加载状态
  showError?: boolean         // 是否显示错误提示
  silent?: boolean            // 静默模式（不显示任何提示）
}

// 响应数据接口
export interface HttpResponse<T = any> {
  code: number
  data: T
  message: string
  success: boolean
  timestamp: number
  // PWA相关字段
  fromCache?: boolean         // 是否来自缓存
  cacheTime?: number          // 缓存时间
  offline?: boolean           // 是否离线响应
}

// 请求状态枚举
export const RequestStatus = {
  PENDING: 'pending' as const,
  SUCCESS: 'success' as const,
  ERROR: 'error' as const,
  OFFLINE: 'offline' as const
}

// 缓存策略枚举
export const CacheStrategy = {
  NETWORK_FIRST: 'networkFirst' as const,    // 网络优先
  CACHE_FIRST: 'cacheFirst' as const,        // 缓存优先
  NETWORK_ONLY: 'networkOnly' as const,      // 仅网络
  CACHE_ONLY: 'cacheOnly' as const           // 仅缓存
}

// 错误类型
export class HttpError extends Error {
  public code: number
  public config: HttpRequestConfig
  public response?: AxiosResponse

  constructor(message: string, code: number, config: HttpRequestConfig, response?: AxiosResponse) {
    super(message)
    this.name = 'HttpError'
    this.code = code
    this.config = config
    this.response = response
  }
}

// 缓存管理器
class CacheManager {
  private cache = new Map<string, {
    data: any
    timestamp: number
    expireTime: number
  }>()

  // 生成缓存键
  private generateKey(config: HttpRequestConfig): string {
    const { method = 'GET', url = '', params, data } = config
    return `${method.toUpperCase()}_${url}_${JSON.stringify(params || {})}_${JSON.stringify(data || {})}`
  }

  // 设置缓存
  set(config: HttpRequestConfig, data: any, cacheTime: number = 5 * 60 * 1000): void {
    const key = this.generateKey(config)
    const now = Date.now()
    
    this.cache.set(key, {
      data,
      timestamp: now,
      expireTime: now + cacheTime
    })

    // 同时存储到localStorage（持久化缓存）
    try {
      const cacheData = {
        data,
        timestamp: now,
        expireTime: now + cacheTime
      }
      localStorage.setItem(`http_cache_${key}`, JSON.stringify(cacheData))
    } catch (error) {
      console.warn('缓存存储到localStorage失败:', error)
    }
  }

  // 获取缓存
  get(config: HttpRequestConfig): any | null {
    const key = this.generateKey(config)
    const now = Date.now()

    // 先从内存缓存获取
    let cached = this.cache.get(key)
    
    // 如果内存缓存不存在，尝试从localStorage获取
    if (!cached) {
      try {
        const stored = localStorage.getItem(`http_cache_${key}`)
        if (stored) {
          cached = JSON.parse(stored)
          // 恢复到内存缓存
          if (cached && cached.expireTime > now) {
            this.cache.set(key, cached)
          }
        }
      } catch (error) {
        console.warn('从localStorage读取缓存失败:', error)
      }
    }

    if (!cached) return null

    // 检查是否过期
    if (now > cached.expireTime) {
      this.cache.delete(key)
      try {
        localStorage.removeItem(`http_cache_${key}`)
      } catch (error) {
        console.warn('删除过期缓存失败:', error)
      }
      return null
    }

    return cached.data
  }

  // 清除缓存
  clear(pattern?: string): void {
    if (pattern) {
      // 清除匹配模式的缓存
      for (const [key] of this.cache) {
        if (key.includes(pattern)) {
          this.cache.delete(key)
          try {
            localStorage.removeItem(`http_cache_${key}`)
          } catch (error) {
            console.warn('删除缓存失败:', error)
          }
        }
      }
    } else {
      // 清除所有缓存
      this.cache.clear()
      try {
        const keys = Object.keys(localStorage)
        keys.forEach(key => {
          if (key.startsWith('http_cache_')) {
            localStorage.removeItem(key)
          }
        })
      } catch (error) {
        console.warn('清除localStorage缓存失败:', error)
      }
    }
  }

  // 获取缓存统计
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    }
  }
}

// HTTP客户端类
export class HttpClient {
  private instance: AxiosInstance
  private cacheManager: CacheManager
  private requestQueue = new Map<string, Promise<any>>()
  private loadingCount = 0

  constructor(config: AxiosRequestConfig = {}) {
    this.cacheManager = new CacheManager()
    
    // 创建axios实例
    this.instance = axios.create({
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      },
      ...config
    })

    this.setupInterceptors()
  }

  // 设置拦截器
  private setupInterceptors(): void {
    // 请求拦截器
    this.instance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const httpConfig = config as InternalAxiosRequestConfig & HttpRequestConfig

        // 添加请求ID
        ;(httpConfig as any).metadata = {
          requestId: this.generateRequestId(),
          startTime: Date.now()
        }

        // 添加认证头
        const token = this.getAuthToken()
        if (token) {
          httpConfig.headers.Authorization = `Bearer ${token}`
        }

        // 显示加载状态
        if (httpConfig.showLoading !== false) {
          this.showLoading()
        }

        console.log(`🚀 HTTP请求开始:`, {
          method: httpConfig.method?.toUpperCase(),
          url: httpConfig.url,
          requestId: (httpConfig as any).metadata?.requestId
        })

        return httpConfig
      },
      (error: AxiosError) => {
        console.error('❌ 请求拦截器错误:', error)
        return Promise.reject(error)
      }
    )

    // 响应拦截器
    this.instance.interceptors.response.use(
      (response: AxiosResponse) => {
        const config = response.config as InternalAxiosRequestConfig & HttpRequestConfig
        const duration = Date.now() - ((config as any).metadata?.startTime || 0)

        // 隐藏加载状态
        if (config.showLoading !== false) {
          this.hideLoading()
        }

        console.log(`✅ HTTP请求成功:`, {
          method: config.method?.toUpperCase(),
          url: config.url,
          status: response.status,
          duration: `${duration}ms`,
          requestId: (config as any).metadata?.requestId
        })

        // 处理响应数据
        return response // 返回原始响应以保持axios接口一致性
      },
      (error: AxiosError) => {
        const config = error.config as (InternalAxiosRequestConfig & HttpRequestConfig) | undefined
        
        // 隐藏加载状态
        if (config?.showLoading !== false) {
          this.hideLoading()
        }

        console.error(`❌ HTTP请求失败:`, {
          method: config?.method?.toUpperCase(),
          url: config?.url,
          status: error.response?.status,
          message: error.message,
          requestId: (config as any)?.metadata?.requestId
        })

        return this.handleError(error)
      }
    )
  }

  // 处理响应
  private handleResponse(response: AxiosResponse): HttpResponse {
    const { data, status, headers } = response
    const config = response.config as InternalAxiosRequestConfig & HttpRequestConfig

    // 标准化响应格式
    let result: HttpResponse

    if (data && typeof data === 'object' && 'code' in data) {
      // 已经是标准格式
      result = {
        ...data,
        success: data.code === 200 || data.code === 0,
        timestamp: Date.now()
      }
    } else {
      // 转换为标准格式
      result = {
        code: status,
        data: data,
        message: 'success',
        success: status >= 200 && status < 300,
        timestamp: Date.now()
      }
    }

    // 添加缓存信息
    const cacheStatus = headers['sw-cache-status']
    if (cacheStatus) {
      result.fromCache = cacheStatus !== 'miss'
      result.cacheTime = headers['sw-cached-time'] ? parseInt(headers['sw-cached-time']) : undefined
    }

    // 缓存响应数据
    if (config.useCache !== false && result.success) {
      const cacheTime = config.cacheTime || 5 * 60 * 1000 // 默认5分钟
      this.cacheManager.set(config, result, cacheTime)
    }

    return result
  }

  // 处理错误
  private async handleError(error: AxiosError): Promise<any> {
    const config = error.config as (InternalAxiosRequestConfig & HttpRequestConfig) | undefined
    
    if (!config) {
      throw new HttpError('请求配置错误', 0, {})
    }

    // 检查是否需要重试
    if (config.retry !== false && this.shouldRetry(error)) {
      return this.retryRequest(config, error)
    }

    // 检查离线支持
    if (config.offlineSupport !== false && !navigator.onLine) {
      const cachedData = this.cacheManager.get(config)
      if (cachedData) {
        console.log('🔄 网络离线，返回缓存数据')
        return Promise.resolve({
          ...cachedData,
          offline: true,
          message: config.offlineMessage || '当前离线，显示缓存数据'
        })
      }
    }

    // 显示错误提示
    if (config.showError !== false && !config.silent) {
      this.showError(error)
    }

    // 抛出标准化错误
    const httpError = new HttpError(
      error.message || '请求失败',
      error.response?.status || 0,
      config,
      error.response
    )

    return Promise.reject(httpError)
  }

  // 判断是否应该重试
  private shouldRetry(error: AxiosError): boolean {
    const config = error.config as (InternalAxiosRequestConfig & HttpRequestConfig) | undefined
    
    if (!config || config.retry === false) return false
    
    // 已经重试过的次数
    const retryCount = (config as any).__retryCount || 0
    const maxRetries = config.retryCount || 3
    
    if (retryCount >= maxRetries) return false

    // 只对特定错误进行重试
    const retryableErrors = [
      'ECONNABORTED', // 超时
      'ENOTFOUND',    // DNS错误
      'ECONNREFUSED', // 连接被拒绝
      'ETIMEDOUT',    // 超时
      'NETWORK_ERROR' // 网络错误
    ]

    const shouldRetryStatus = [408, 429, 500, 502, 503, 504]
    
    return (
      retryableErrors.some(code => error.code === code) ||
      (error.response && shouldRetryStatus.includes(error.response.status)) ||
      !navigator.onLine
    )
  }

  // 重试请求
  private async retryRequest(config: InternalAxiosRequestConfig & HttpRequestConfig, error: AxiosError): Promise<any> {
    const retryCount = ((config as any).__retryCount || 0) + 1
    const retryDelay = config.retryDelay || 1000 * Math.pow(2, retryCount - 1) // 指数退避
    
    ;(config as any).__retryCount = retryCount

    console.log(`🔄 请求重试 (${retryCount}/${config.retryCount || 3}):`, {
      url: config.url,
      delay: `${retryDelay}ms`,
      reason: error.message
    })

    // 等待重试延迟
    await new Promise(resolve => setTimeout(resolve, retryDelay))

    // 重新发起请求
    return this.instance.request(config)
  }

  // 生成请求ID
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // 获取认证token
  private getAuthToken(): string | null {
    try {
      return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')
    } catch {
      return null
    }
  }

  // 显示加载状态
  private showLoading(): void {
    this.loadingCount++
    // 这里可以集成你的loading组件
    document.body.classList.add('http-loading')
  }

  // 隐藏加载状态
  private hideLoading(): void {
    this.loadingCount = Math.max(0, this.loadingCount - 1)
    if (this.loadingCount === 0) {
      document.body.classList.remove('http-loading')
    }
  }

  // 显示错误提示
  private showError(error: AxiosError): void {
    const responseData = error.response?.data as any
    const message = responseData?.message || error.message || '请求失败'
    console.error('HTTP Error:', message)
    // 这里可以集成你的消息提示组件
    // toast.error(message)
  }

  // GET请求
  async get<T = any>(url: string, config?: HttpRequestConfig): Promise<HttpResponse<T>> {
    const mergedConfig: HttpRequestConfig = {
      method: 'GET',
      url,
      useCache: true,
      cacheStrategy: 'networkFirst',
      ...config
    }

    return this.request<T>(mergedConfig)
  }

  // POST请求
  async post<T = any>(url: string, data?: any, config?: HttpRequestConfig): Promise<HttpResponse<T>> {
    const mergedConfig: HttpRequestConfig = {
      method: 'POST',
      url,
      data,
      useCache: false,
      ...config
    }

    return this.request<T>(mergedConfig)
  }

  // PUT请求
  async put<T = any>(url: string, data?: any, config?: HttpRequestConfig): Promise<HttpResponse<T>> {
    const mergedConfig: HttpRequestConfig = {
      method: 'PUT',
      url,
      data,
      useCache: false,
      ...config
    }

    return this.request<T>(mergedConfig)
  }

  // DELETE请求
  async delete<T = any>(url: string, config?: HttpRequestConfig): Promise<HttpResponse<T>> {
    const mergedConfig: HttpRequestConfig = {
      method: 'DELETE',
      url,
      useCache: false,
      ...config
    }

    return this.request<T>(mergedConfig)
  }

  // 通用请求方法
  async request<T = any>(config: HttpRequestConfig): Promise<HttpResponse<T>> {
    // 生成请求键用于去重
    const requestKey = this.generateRequestKey(config)
    
    // 检查是否有相同的请求正在进行
    if (this.requestQueue.has(requestKey)) {
      console.log('🔄 发现重复请求，返回已有Promise:', config.url)
      return this.requestQueue.get(requestKey)!
    }

    // 检查缓存策略
    if (config.useCache !== false && config.method?.toLowerCase() === 'get') {
      const cachedData = this.cacheManager.get(config)
      
      if (cachedData && config.cacheStrategy === 'cacheFirst') {
        console.log('📦 缓存优先，返回缓存数据:', config.url)
        return cachedData
      }
      
      if (cachedData && config.cacheStrategy === 'cacheOnly') {
        console.log('📦 仅缓存，返回缓存数据:', config.url)
        return cachedData
      }
      
      if (!navigator.onLine && cachedData) {
        console.log('📦 离线状态，返回缓存数据:', config.url)
        return {
          ...cachedData,
          offline: true,
          message: '当前离线，显示缓存数据'
        }
      }
    }

    // 如果是仅缓存策略但没有缓存，抛出错误
    if (config.cacheStrategy === 'cacheOnly') {
      throw new HttpError('缓存数据不存在', 404, config)
    }

    // 创建请求Promise
    const requestPromise = this.instance.request(config)
      .then((response: AxiosResponse) => {
        // 处理响应并返回标准格式
        return this.handleResponse(response)
      })
      .finally(() => {
        // 请求完成后从队列中移除
        this.requestQueue.delete(requestKey)
      })

    // 添加到请求队列
    this.requestQueue.set(requestKey, requestPromise)

    return requestPromise
  }

  // 生成请求键
  private generateRequestKey(config: HttpRequestConfig): string {
    const { method = 'GET', url = '', params, data } = config
    return `${method.toUpperCase()}_${url}_${JSON.stringify(params || {})}_${JSON.stringify(data || {})}`
  }

  // 取消请求
  cancelRequest(requestKey: string): void {
    if (this.requestQueue.has(requestKey)) {
      // 这里可以实现取消逻辑
      this.requestQueue.delete(requestKey)
    }
  }

  // 取消所有请求
  cancelAllRequests(): void {
    this.requestQueue.clear()
  }

  // 清除缓存
  clearCache(pattern?: string): void {
    this.cacheManager.clear(pattern)
  }

  // 获取缓存统计
  getCacheStats(): { size: number; keys: string[] } {
    return this.cacheManager.getStats()
  }

  // 设置认证token
  setAuthToken(token: string): void {
    try {
      localStorage.setItem('auth_token', token)
      this.instance.defaults.headers.common['Authorization'] = `Bearer ${token}`
    } catch (error) {
      console.warn('设置认证token失败:', error)
    }
  }

  // 清除认证token
  clearAuthToken(): void {
    try {
      localStorage.removeItem('auth_token')
      sessionStorage.removeItem('auth_token')
      delete this.instance.defaults.headers.common['Authorization']
    } catch (error) {
      console.warn('清除认证token失败:', error)
    }
  }
}

// 创建默认实例
const http = new HttpClient({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://jsonplaceholder.typicode.com',
  timeout: 10000
})

// 导出
export default http
