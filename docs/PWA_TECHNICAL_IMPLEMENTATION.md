# PWA 技术实现详细文档

## 📋 目录

1. [Service Worker 详细实现](#1-service-worker-详细实现)
2. [缓存策略实现](#2-缓存策略实现)
3. [离线数据同步](#3-离线数据同步)
4. [推送通知实现](#4-推送通知实现)
5. [安装和更新机制](#5-安装和更新机制)
6. [性能监控实现](#6-性能监控实现)
7. [错误处理机制](#7-错误处理机制)
8. [测试策略](#8-测试策略)

---

## 1. Service Worker 详细实现

### 1.1 Service Worker 注册和管理

```typescript
// src/registerServiceWorker.ts
class ServiceWorkerManager {
  private registration: ServiceWorkerRegistration | null = null
  private updateAvailable = false
  private refreshing = false

  async register(): Promise<void> {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service Worker not supported')
      return
    }

    try {
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none' // 强制检查更新
      })

      console.log('SW registered:', this.registration.scope)
      
      // 监听更新
      this.registration.addEventListener('updatefound', this.onUpdateFound.bind(this))
      
      // 检查是否有等待中的SW
      if (this.registration.waiting) {
        this.showUpdatePrompt()
      }

      // 监听控制器变化
      navigator.serviceWorker.addEventListener('controllerchange', this.onControllerChange.bind(this))

    } catch (error) {
      console.error('SW registration failed:', error)
    }
  }

  private onUpdateFound(): void {
    const newWorker = this.registration!.installing
    
    if (newWorker) {
      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          this.updateAvailable = true
          this.showUpdatePrompt()
        }
      })
    }
  }

  private onControllerChange(): void {
    if (this.refreshing) return
    
    this.refreshing = true
    window.location.reload()
  }

  async skipWaiting(): Promise<void> {
    if (this.registration?.waiting) {
      this.registration.waiting.postMessage({ type: 'SKIP_WAITING' })
    }
  }

  // 检查更新
  async checkForUpdate(): Promise<boolean> {
    if (this.registration) {
      await this.registration.update()
      return this.updateAvailable
    }
    return false
  }

  // 获取SW状态
  getStatus(): ServiceWorkerStatus {
    return {
      registered: !!this.registration,
      updateAvailable: this.updateAvailable,
      controller: !!navigator.serviceWorker.controller
    }
  }
}

interface ServiceWorkerStatus {
  registered: boolean
  updateAvailable: boolean
  controller: boolean
}

export const swManager = new ServiceWorkerManager()
```

### 1.2 Service Worker 核心逻辑

```typescript
// src/sw.ts
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { StaleWhileRevalidate, CacheFirst, NetworkFirst } from 'workbox-strategies'
import { CacheableResponsePlugin } from 'workbox-cacheable-response'
import { ExpirationPlugin } from 'workbox-expiration'

declare const self: ServiceWorkerGlobalScope

// 预缓存静态资源
precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()

// 缓存策略配置
const CACHE_NAMES = {
  static: 'static-cache-v1',
  api: 'api-cache-v1',
  images: 'images-cache-v1',
  fonts: 'fonts-cache-v1'
}

// 静态资源缓存策略
registerRoute(
  ({ request }) => request.destination === 'style' ||
                  request.destination === 'script' ||
                  request.destination === 'worker',
  new CacheFirst({
    cacheName: CACHE_NAMES.static,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200]
      }),
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 30 * 24 * 60 * 60 // 30天
      })
    ]
  })
)

// 图片缓存策略
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: CACHE_NAMES.images,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200]
      }),
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 7 * 24 * 60 * 60 // 7天
      })
    ]
  })
)

// 字体缓存策略
registerRoute(
  ({ request }) => request.destination === 'font',
  new CacheFirst({
    cacheName: CACHE_NAMES.fonts,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200]
      }),
      new ExpirationPlugin({
        maxEntries: 10,
        maxAgeSeconds: 365 * 24 * 60 * 60 // 1年
      })
    ]
  })
)

// API缓存策略
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: CACHE_NAMES.api,
    networkTimeoutSeconds: 3,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200]
      }),
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 60 * 60 // 1小时
      })
    ]
  })
)

// 导航请求处理
registerRoute(
  ({ request }) => request.mode === 'navigate',
  async ({ event }) => {
    try {
      return await fetch(event.request)
    } catch (error) {
      // 离线时返回缓存的首页
      const cache = await caches.open(self.__WB_MANIFEST[0].revision)
      return cache.match('/') || new Response('Offline')
    }
  }
)

// 监听消息
self.addEventListener('message', (event) => {
  const { type, payload } = event.data

  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting()
      break
    
    case 'GET_VERSION':
      event.ports[0].postMessage({ version: '1.0.0' })
      break
    
    case 'CLEAR_CACHE':
      clearSpecificCache(payload.cacheName)
      break
  }
})

// 清理指定缓存
async function clearSpecificCache(cacheName: string): Promise<void> {
  const cache = await caches.open(cacheName)
  const keys = await cache.keys()
  
  await Promise.all(
    keys.map(key => cache.delete(key))
  )
}

// 后台同步
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(handleBackgroundSync())
  }
})

async function handleBackgroundSync(): Promise<void> {
  // 处理离线时的操作队列
  const operations = await getOfflineOperations()
  
  for (const operation of operations) {
    try {
      await executeOperation(operation)
      await markOperationCompleted(operation.id)
    } catch (error) {
      console.error('Background sync failed:', error)
      await markOperationFailed(operation.id, error.message)
    }
  }
}
```

---

## 2. 缓存策略实现

### 2.1 智能缓存管理器

```typescript
// src/utils/cache/CacheManager.ts
export class CacheManager {
  private static instance: CacheManager
  private cacheStats = new Map<string, CacheStats>()
  private readonly maxCacheSize = 50 * 1024 * 1024 // 50MB
  
  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager()
    }
    return CacheManager.instance
  }

  async get<T>(key: string, options: CacheOptions = {}): Promise<T | null> {
    const cacheKey = this.generateCacheKey(key, options)
    
    try {
      // 检查内存缓存
      const memoryResult = this.getFromMemory<T>(cacheKey)
      if (memoryResult) {
        this.updateStats(cacheKey, 'hit', 'memory')
        return memoryResult
      }

      // 检查IndexedDB缓存
      const dbResult = await this.getFromIndexedDB<T>(cacheKey)
      if (dbResult && !this.isExpired(dbResult)) {
        this.updateStats(cacheKey, 'hit', 'indexeddb')
        // 回写到内存缓存
        this.setToMemory(cacheKey, dbResult.data, dbResult.ttl)
        return dbResult.data
      }

      // 检查HTTP缓存
      const httpResult = await this.getFromHttpCache<T>(cacheKey)
      if (httpResult) {
        this.updateStats(cacheKey, 'hit', 'http')
        return httpResult
      }

      this.updateStats(cacheKey, 'miss')
      return null

    } catch (error) {
      console.error('Cache get error:', error)
      this.updateStats(cacheKey, 'error')
      return null
    }
  }

  async set<T>(key: string, data: T, options: CacheOptions = {}): Promise<void> {
    const cacheKey = this.generateCacheKey(key, options)
    const ttl = options.ttl || 3600000 // 默认1小时
    
    try {
      // 设置内存缓存
      this.setToMemory(cacheKey, data, ttl)
      
      // 异步设置IndexedDB缓存
      this.setToIndexedDB(cacheKey, data, ttl)
      
      // 如果启用HTTP缓存
      if (options.httpCache) {
        await this.setToHttpCache(cacheKey, data, options)
      }

    } catch (error) {
      console.error('Cache set error:', error)
    }
  }

  async invalidate(pattern: string): Promise<void> {
    // 清除匹配的缓存项
    const keys = await this.getMatchingKeys(pattern)
    
    await Promise.all([
      this.clearMemoryCache(keys),
      this.clearIndexedDBCache(keys),
      this.clearHttpCache(keys)
    ])
  }

  async getStats(): Promise<CacheStatsReport> {
    const totalSize = await this.calculateTotalSize()
    const hitRate = this.calculateHitRate()
    
    return {
      totalSize,
      hitRate,
      entries: this.cacheStats.size,
      breakdown: Object.fromEntries(this.cacheStats)
    }
  }

  // 缓存清理策略
  async cleanup(): Promise<void> {
    const currentSize = await this.calculateTotalSize()
    
    if (currentSize > this.maxCacheSize) {
      await this.performLRUCleanup()
    }
  }

  private async performLRUCleanup(): Promise<void> {
    // 获取所有缓存项并按最后访问时间排序
    const entries = Array.from(this.cacheStats.entries())
      .sort((a, b) => a[1].lastAccess - b[1].lastAccess)
    
    // 删除最少使用的缓存项，直到大小符合要求
    let currentSize = await this.calculateTotalSize()
    const targetSize = this.maxCacheSize * 0.8 // 清理到80%
    
    for (const [key] of entries) {
      if (currentSize <= targetSize) break
      
      await this.delete(key)
      currentSize = await this.calculateTotalSize()
    }
  }
}

interface CacheOptions {
  ttl?: number
  tags?: string[]
  httpCache?: boolean
  priority?: 'high' | 'normal' | 'low'
}

interface CacheStats {
  hits: number
  misses: number
  errors: number
  lastAccess: number
  size: number
  source: 'memory' | 'indexeddb' | 'http'
}
```

### 2.2 缓存策略配置

```typescript
// src/utils/cache/CacheStrategies.ts
export enum CacheStrategy {
  CACHE_FIRST = 'cache-first',
  NETWORK_FIRST = 'network-first',
  CACHE_ONLY = 'cache-only',
  NETWORK_ONLY = 'network-only',
  STALE_WHILE_REVALIDATE = 'stale-while-revalidate'
}

export class CacheStrategyManager {
  private strategies = new Map<string, CacheStrategyConfig>()

  constructor() {
    this.initializeDefaultStrategies()
  }

  private initializeDefaultStrategies(): void {
    // 静态资源策略
    this.strategies.set('/assets/**', {
      strategy: CacheStrategy.CACHE_FIRST,
      ttl: 365 * 24 * 60 * 60 * 1000, // 1年
      maxEntries: 100
    })

    // API数据策略
    this.strategies.set('/api/**', {
      strategy: CacheStrategy.NETWORK_FIRST,
      ttl: 60 * 60 * 1000, // 1小时
      networkTimeout: 3000,
      maxEntries: 50
    })

    // 用户头像等图片
    this.strategies.set('/images/**', {
      strategy: CacheStrategy.STALE_WHILE_REVALIDATE,
      ttl: 7 * 24 * 60 * 60 * 1000, // 7天
      maxEntries: 100
    })
  }

  getStrategy(url: string): CacheStrategyConfig | null {
    for (const [pattern, config] of this.strategies) {
      if (this.matchPattern(pattern, url)) {
        return config
      }
    }
    return null
  }

  async executeStrategy<T>(
    url: string, 
    fetchFn: () => Promise<T>,
    cacheKey?: string
  ): Promise<T> {
    const strategy = this.getStrategy(url)
    if (!strategy) {
      return fetchFn()
    }

    const cacheManager = CacheManager.getInstance()
    const key = cacheKey || url

    switch (strategy.strategy) {
      case CacheStrategy.CACHE_FIRST:
        return this.cacheFirst(key, fetchFn, strategy)
      
      case CacheStrategy.NETWORK_FIRST:
        return this.networkFirst(key, fetchFn, strategy)
      
      case CacheStrategy.STALE_WHILE_REVALIDATE:
        return this.staleWhileRevalidate(key, fetchFn, strategy)
      
      case CacheStrategy.CACHE_ONLY:
        return this.cacheOnly(key, strategy)
      
      case CacheStrategy.NETWORK_ONLY:
        return fetchFn()
      
      default:
        return fetchFn()
    }
  }

  private async cacheFirst<T>(
    key: string, 
    fetchFn: () => Promise<T>,
    strategy: CacheStrategyConfig
  ): Promise<T> {
    const cacheManager = CacheManager.getInstance()
    
    // 先尝试从缓存获取
    const cached = await cacheManager.get<T>(key)
    if (cached) {
      return cached
    }

    // 缓存未命中，从网络获取
    const data = await fetchFn()
    await cacheManager.set(key, data, { ttl: strategy.ttl })
    return data
  }

  private async networkFirst<T>(
    key: string, 
    fetchFn: () => Promise<T>,
    strategy: CacheStrategyConfig
  ): Promise<T> {
    const cacheManager = CacheManager.getInstance()
    
    try {
      // 先尝试网络请求
      const networkPromise = fetchFn()
      
      // 如果有超时设置，使用Promise.race
      if (strategy.networkTimeout) {
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Network timeout')), strategy.networkTimeout)
        })
        
        const data = await Promise.race([networkPromise, timeoutPromise])
        await cacheManager.set(key, data, { ttl: strategy.ttl })
        return data
      } else {
        const data = await networkPromise
        await cacheManager.set(key, data, { ttl: strategy.ttl })
        return data
      }
    } catch (error) {
      // 网络失败，尝试从缓存获取
      const cached = await cacheManager.get<T>(key)
      if (cached) {
        return cached
      }
      throw error
    }
  }

  private async staleWhileRevalidate<T>(
    key: string, 
    fetchFn: () => Promise<T>,
    strategy: CacheStrategyConfig
  ): Promise<T> {
    const cacheManager = CacheManager.getInstance()
    
    // 立即返回缓存数据（如果有）
    const cached = await cacheManager.get<T>(key)
    
    // 后台更新缓存
    fetchFn().then(data => {
      cacheManager.set(key, data, { ttl: strategy.ttl })
    }).catch(error => {
      console.warn('Background revalidation failed:', error)
    })
    
    if (cached) {
      return cached
    }
    
    // 如果没有缓存，等待网络请求
    return fetchFn()
  }

  private async cacheOnly<T>(
    key: string,
    strategy: CacheStrategyConfig
  ): Promise<T> {
    const cacheManager = CacheManager.getInstance()
    const cached = await cacheManager.get<T>(key)
    
    if (cached) {
      return cached
    }
    
    throw new Error('Cache miss and network disabled')
  }
}

interface CacheStrategyConfig {
  strategy: CacheStrategy
  ttl: number
  networkTimeout?: number
  maxEntries?: number
  priority?: 'high' | 'normal' | 'low'
}
```

---

## 3. 离线数据同步

### 3.1 离线操作队列

```typescript
// src/utils/offline/OfflineQueue.ts
export class OfflineQueue {
  private db: IDBDatabase | null = null
  private readonly dbName = 'OfflineQueue'
  private readonly version = 1
  private syncInProgress = false

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)
      
      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        
        if (!db.objectStoreNames.contains('operations')) {
          const store = db.createObjectStore('operations', { 
            keyPath: 'id', 
            autoIncrement: true 
          })
          store.createIndex('status', 'status', { unique: false })
          store.createIndex('timestamp', 'timestamp', { unique: false })
          store.createIndex('priority', 'priority', { unique: false })
        }
      }
    })
  }

  async addOperation(operation: OfflineOperation): Promise<number> {
    if (!this.db) throw new Error('Database not initialized')
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['operations'], 'readwrite')
      const store = transaction.objectStore('operations')
      
      const operationData: OfflineOperationData = {
        ...operation,
        id: undefined, // 让IndexedDB自动生成
        status: 'pending',
        timestamp: Date.now(),
        retryCount: 0,
        lastError: null
      }
      
      const request = store.add(operationData)
      
      request.onsuccess = () => resolve(request.result as number)
      request.onerror = () => reject(request.error)
    })
  }

  async getOperations(status?: OperationStatus): Promise<OfflineOperationData[]> {
    if (!this.db) throw new Error('Database not initialized')
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['operations'], 'readonly')
      const store = transaction.objectStore('operations')
      
      let request: IDBRequest
      
      if (status) {
        const index = store.index('status')
        request = index.getAll(status)
      } else {
        request = store.getAll()
      }
      
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async updateOperation(id: number, updates: Partial<OfflineOperationData>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized')
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['operations'], 'readwrite')
      const store = transaction.objectStore('operations')
      
      const getRequest = store.get(id)
      
      getRequest.onsuccess = () => {
        const operation = getRequest.result
        if (operation) {
          const updatedOperation = { ...operation, ...updates }
          const putRequest = store.put(updatedOperation)
          
          putRequest.onsuccess = () => resolve()
          putRequest.onerror = () => reject(putRequest.error)
        } else {
          reject(new Error('Operation not found'))
        }
      }
      
      getRequest.onerror = () => reject(getRequest.error)
    })
  }

  async removeOperation(id: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized')
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['operations'], 'readwrite')
      const store = transaction.objectStore('operations')
      
      const request = store.delete(id)
      
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async sync(): Promise<SyncResult> {
    if (this.syncInProgress) {
      return { success: false, message: 'Sync already in progress' }
    }

    this.syncInProgress = true
    const result: SyncResult = {
      success: true,
      processed: 0,
      failed: 0,
      errors: []
    }

    try {
      const pendingOperations = await this.getOperations('pending')
      
      // 按优先级和时间戳排序
      pendingOperations.sort((a, b) => {
        const priorityOrder = { high: 3, normal: 2, low: 1 }
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority]
        return priorityDiff !== 0 ? priorityDiff : a.timestamp - b.timestamp
      })

      for (const operation of pendingOperations) {
        try {
          await this.executeOperation(operation)
          await this.updateOperation(operation.id!, { 
            status: 'completed',
            completedAt: Date.now()
          })
          result.processed++
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          
          await this.updateOperation(operation.id!, {
            status: 'failed',
            retryCount: (operation.retryCount || 0) + 1,
            lastError: errorMessage
          })
          
          result.failed++
          result.errors.push({
            operationId: operation.id!,
            error: errorMessage
          })
        }
      }

    } catch (error) {
      result.success = false
      result.message = error instanceof Error ? error.message : 'Unknown error'
    } finally {
      this.syncInProgress = false
    }

    return result
  }

  private async executeOperation(operation: OfflineOperationData): Promise<void> {
    const { type, endpoint, method, data, headers } = operation

    switch (type) {
      case 'http':
        await this.executeHttpOperation(endpoint, method, data, headers)
        break
      
      case 'custom':
        await this.executeCustomOperation(operation)
        break
      
      default:
        throw new Error(`Unknown operation type: ${type}`)
    }
  }

  private async executeHttpOperation(
    endpoint: string,
    method: string,
    data?: any,
    headers?: Record<string, string>
  ): Promise<void> {
    const response = await fetch(endpoint, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: data ? JSON.stringify(data) : undefined
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
  }

  private async executeCustomOperation(operation: OfflineOperationData): Promise<void> {
    // 自定义操作处理器
    const handler = this.getCustomHandler(operation.customType!)
    if (handler) {
      await handler(operation)
    } else {
      throw new Error(`No handler for custom type: ${operation.customType}`)
    }
  }

  private customHandlers = new Map<string, (operation: OfflineOperationData) => Promise<void>>()

  registerCustomHandler(type: string, handler: (operation: OfflineOperationData) => Promise<void>): void {
    this.customHandlers.set(type, handler)
  }

  private getCustomHandler(type: string): ((operation: OfflineOperationData) => Promise<void>) | undefined {
    return this.customHandlers.get(type)
  }
}

// 类型定义
export interface OfflineOperation {
  type: 'http' | 'custom'
  endpoint: string
  method: string
  data?: any
  headers?: Record<string, string>
  priority: 'high' | 'normal' | 'low'
  customType?: string
  metadata?: Record<string, any>
}

export interface OfflineOperationData extends OfflineOperation {
  id?: number
  status: OperationStatus
  timestamp: number
  retryCount: number
  lastError: string | null
  completedAt?: number
}

export type OperationStatus = 'pending' | 'completed' | 'failed'

export interface SyncResult {
  success: boolean
  processed: number
  failed: number
  errors: Array<{ operationId: number; error: string }>
  message?: string
}
```

### 3.2 数据冲突解决

```typescript
// src/utils/offline/ConflictResolver.ts
export class ConflictResolver {
  private strategies = new Map<string, ConflictStrategy>()

  constructor() {
    this.initializeDefaultStrategies()
  }

  private initializeDefaultStrategies(): void {
    // 最后写入获胜策略
    this.strategies.set('last-write-wins', {
      resolve: (local, remote) => {
        return local.updatedAt > remote.updatedAt ? local : remote
      }
    })

    // 合并策略
    this.strategies.set('merge', {
      resolve: (local, remote) => {
        return { ...remote, ...local }
      }
    })

    // 用户选择策略
    this.strategies.set('user-choice', {
      resolve: async (local, remote) => {
        return new Promise((resolve) => {
          this.showConflictDialog(local, remote, resolve)
        })
      }
    })
  }

  async resolveConflict<T>(
    local: T & ConflictableEntity,
    remote: T & ConflictableEntity,
    strategyName: string = 'last-write-wins'
  ): Promise<T & ConflictableEntity> {
    const strategy = this.strategies.get(strategyName)
    
    if (!strategy) {
      throw new Error(`Unknown conflict resolution strategy: ${strategyName}`)
    }

    return strategy.resolve(local, remote)
  }

  private showConflictDialog<T>(
    local: T,
    remote: T,
    callback: (resolved: T) => void
  ): void {
    // 创建冲突解决对话框
    const dialog = document.createElement('div')
    dialog.className = 'conflict-dialog'
    dialog.innerHTML = `
      <div class="conflict-dialog-content">
        <h3>数据冲突</h3>
        <p>检测到数据冲突，请选择要保留的版本：</p>
        
        <div class="conflict-options">
          <div class="option">
            <h4>本地版本</h4>
            <pre>${JSON.stringify(local, null, 2)}</pre>
            <button class="btn-local">使用本地版本</button>
          </div>
          
          <div class="option">
            <h4>服务器版本</h4>
            <pre>${JSON.stringify(remote, null, 2)}</pre>
            <button class="btn-remote">使用服务器版本</button>
          </div>
        </div>
        
        <div class="dialog-actions">
          <button class="btn-merge">尝试合并</button>
          <button class="btn-cancel">取消</button>
        </div>
      </div>
    `

    // 添加事件监听器
    dialog.querySelector('.btn-local')?.addEventListener('click', () => {
      document.body.removeChild(dialog)
      callback(local)
    })

    dialog.querySelector('.btn-remote')?.addEventListener('click', () => {
      document.body.removeChild(dialog)
      callback(remote)
    })

    dialog.querySelector('.btn-merge')?.addEventListener('click', () => {
      document.body.removeChild(dialog)
      callback({ ...remote, ...local } as T)
    })

    dialog.querySelector('.btn-cancel')?.addEventListener('click', () => {
      document.body.removeChild(dialog)
      callback(remote) // 默认使用服务器版本
    })

    document.body.appendChild(dialog)
  }

  registerStrategy(name: string, strategy: ConflictStrategy): void {
    this.strategies.set(name, strategy)
  }
}

interface ConflictStrategy {
  resolve: <T>(local: T & ConflictableEntity, remote: T & ConflictableEntity) => Promise<T & ConflictableEntity> | T & ConflictableEntity
}

interface ConflictableEntity {
  id: string | number
  updatedAt: number
  version?: number
}
```

---

## 4. 推送通知实现

### 4.1 通知管理器

```typescript
// src/utils/notifications/NotificationManager.ts
export class NotificationManager {
  private subscription: PushSubscription | null = null
  private vapidPublicKey: string
  
  constructor(vapidPublicKey: string) {
    this.vapidPublicKey = vapidPublicKey
  }

  async init(): Promise<void> {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      console.warn('Notifications not supported')
      return
    }

    // 检查现有订阅
    const registration = await navigator.serviceWorker.ready
    this.subscription = await registration.pushManager.getSubscription()
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      return 'denied'
    }

    let permission = Notification.permission

    if (permission === 'default') {
      permission = await Notification.requestPermission()
    }

    return permission
  }

  async subscribe(): Promise<PushSubscription | null> {
    const permission = await this.requestPermission()
    
    if (permission !== 'granted') {
      throw new Error('Notification permission denied')
    }

    const registration = await navigator.serviceWorker.ready
    
    this.subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey)
    })

    // 将订阅信息发送到服务器
    await this.sendSubscriptionToServer(this.subscription)
    
    return this.subscription
  }

  async unsubscribe(): Promise<boolean> {
    if (this.subscription) {
      const success = await this.subscription.unsubscribe()
      if (success) {
        await this.removeSubscriptionFromServer()
        this.subscription = null
      }
      return success
    }
    return true
  }

  async showNotification(title: string, options: NotificationOptions = {}): Promise<void> {
    const permission = await this.requestPermission()
    
    if (permission !== 'granted') {
      throw new Error('Notification permission denied')
    }

    const registration = await navigator.serviceWorker.ready
    
    const defaultOptions: NotificationOptions = {
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      vibrate: [200, 100, 200],
      actions: [
        { action: 'view', title: '查看', icon: '/icons/view.png' },
        { action: 'dismiss', title: '忽略', icon: '/icons/dismiss.png' }
      ],
      requireInteraction: false,
      silent: false
    }

    await registration.showNotification(title, { ...defaultOptions, ...options })
  }

  private async sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
    await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        subscription: subscription.toJSON(),
        userAgent: navigator.userAgent,
        timestamp: Date.now()
      })
    })
  }

  private async removeSubscriptionFromServer(): Promise<void> {
    if (this.subscription) {
      await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          endpoint: this.subscription.endpoint
        })
      })
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }

  getSubscription(): PushSubscription | null {
    return this.subscription
  }

  isSupported(): boolean {
    return 'Notification' in window && 
           'serviceWorker' in navigator && 
           'PushManager' in window
  }
}
```

### 4.2 Service Worker 推送处理

```typescript
// Service Worker中的推送处理
self.addEventListener('push', (event) => {
  let data: PushNotificationData
  
  try {
    data = event.data ? event.data.json() : {}
  } catch (error) {
    console.error('Invalid push data:', error)
    return
  }

  const options: NotificationOptions = {
    body: data.body,
    icon: data.icon || '/icons/icon-192x192.png',
    badge: data.badge || '/icons/badge-72x72.png',
    image: data.image,
    vibrate: data.vibrate || [200, 100, 200],
    sound: data.sound,
    actions: data.actions || [
      { action: 'view', title: '查看' },
      { action: 'dismiss', title: '忽略' }
    ],
    data: {
      url: data.url,
      id: data.id,
      timestamp: Date.now()
    },
    requireInteraction: data.requireInteraction || false,
    silent: data.silent || false,
    tag: data.tag,
    renotify: data.renotify || false
  }

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  )
})

// 通知点击处理
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const action = event.action
  const data = event.notification.data

  if (action === 'dismiss') {
    return
  }

  let targetUrl = '/'
  
  if (action === 'view' && data.url) {
    targetUrl = data.url
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        // 查找现有窗口
        for (const client of clientList) {
          if (client.url === targetUrl && 'focus' in client) {
            return client.focus()
          }
        }
        
        // 打开新窗口
        if (clients.openWindow) {
          return clients.openWindow(targetUrl)
        }
      })
  )
})

interface PushNotificationData {
  title: string
  body: string
  icon?: string
  badge?: string
  image?: string
  sound?: string
  vibrate?: number[]
  actions?: NotificationAction[]
  url?: string
  id?: string
  tag?: string
  requireInteraction?: boolean
  silent?: boolean
  renotify?: boolean
}
```

---

## 5. 安装和更新机制

### 5.1 智能安装提示

```typescript
// src/utils/install/InstallManager.ts
export class InstallManager {
  private deferredPrompt: BeforeInstallPromptEvent | null = null
  private installCriteria: InstallCriteria
  private userEngagement: UserEngagement
  
  constructor(criteria: InstallCriteria = {}) {
    this.installCriteria = {
      minVisits: criteria.minVisits || 3,
      minEngagementTime: criteria.minEngagementTime || 30000,
      minInteractions: criteria.minInteractions || 5,
      cooldownPeriod: criteria.cooldownPeriod || 7 * 24 * 60 * 60 * 1000 // 7天
    }
    
    this.userEngagement = this.loadUserEngagement()
    this.init()
  }

  private init(): void {
    // 监听安装提示事件
    window.addEventListener('beforeinstallprompt', this.onBeforeInstallPrompt.bind(this))
    
    // 监听应用安装事件
    window.addEventListener('appinstalled', this.onAppInstalled.bind(this))
    
    // 跟踪用户交互
    this.trackUserEngagement()
    
    // 定期检查是否应该显示安装提示
    setInterval(() => this.checkInstallPrompt(), 60000) // 每分钟检查一次
  }

  private onBeforeInstallPrompt(e: BeforeInstallPromptEvent): void {
    // 阻止默认的安装提示
    e.preventDefault()
    this.deferredPrompt = e
    
    // 检查是否应该显示自定义安装提示
    if (this.shouldShowInstallPrompt()) {
      this.showCustomInstallPrompt()
    }
  }

  private onAppInstalled(): void {
    console.log('PWA was installed')
    this.deferredPrompt = null
    
    // 记录安装事件
    this.recordEvent('app_installed')
    
    // 显示安装后的引导
    this.showPostInstallGuide()
  }

  private shouldShowInstallPrompt(): boolean {
    // 检查冷却期
    const lastPrompt = localStorage.getItem('lastInstallPrompt')
    if (lastPrompt) {
      const lastPromptTime = parseInt(lastPrompt)
      if (Date.now() - lastPromptTime < this.installCriteria.cooldownPeriod) {
        return false
      }
    }

    // 检查用户是否已经拒绝过
    const dismissed = localStorage.getItem('installPromptDismissed')
    if (dismissed === 'true') {
      return false
    }

    // 检查用户参与度
    return this.userEngagement.visits >= this.installCriteria.minVisits &&
           this.userEngagement.totalEngagementTime >= this.installCriteria.minEngagementTime &&
           this.userEngagement.interactions >= this.installCriteria.minInteractions
  }

  private showCustomInstallPrompt(): void {
    const promptElement = this.createInstallPromptElement()
    document.body.appendChild(promptElement)
    
    // 记录提示显示事件
    this.recordEvent('install_prompt_shown')
    localStorage.setItem('lastInstallPrompt', Date.now().toString())
  }

  private createInstallPromptElement(): HTMLElement {
    const prompt = document.createElement('div')
    prompt.className = 'install-prompt'
    prompt.innerHTML = `
      <div class="install-prompt-content">
        <div class="install-prompt-icon">📱</div>
        <div class="install-prompt-text">
          <h3>安装应用到主屏幕</h3>
          <p>获得更好的使用体验，支持离线访问</p>
        </div>
        <div class="install-prompt-actions">
          <button class="install-btn">安装</button>
          <button class="dismiss-btn">稍后</button>
        </div>
      </div>
    `

    // 添加事件监听器
    const installBtn = prompt.querySelector('.install-btn')
    const dismissBtn = prompt.querySelector('.dismiss-btn')

    installBtn?.addEventListener('click', () => {
      this.triggerInstall()
      document.body.removeChild(prompt)
    })

    dismissBtn?.addEventListener('click', () => {
      this.dismissInstallPrompt()
      document.body.removeChild(prompt)
    })

    return prompt
  }

  async triggerInstall(): Promise<boolean> {
    if (!this.deferredPrompt) {
      return false
    }

    try {
      // 显示安装提示
      this.deferredPrompt.prompt()
      
      // 等待用户选择
      const { outcome } = await this.deferredPrompt.userChoice
      
      this.recordEvent('install_prompt_result', { outcome })
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt')
        return true
      } else {
        console.log('User dismissed the install prompt')
        this.dismissInstallPrompt()
        return false
      }
    } catch (error) {
      console.error('Install prompt failed:', error)
      return false
    } finally {
      this.deferredPrompt = null
    }
  }

  private dismissInstallPrompt(): void {
    localStorage.setItem('installPromptDismissed', 'true')
    this.recordEvent('install_prompt_dismissed')
  }

  private trackUserEngagement(): void {
    let startTime = Date.now()
    let interactionCount = 0

    // 跟踪页面可见性
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        const sessionTime = Date.now() - startTime
        this.userEngagement.totalEngagementTime += sessionTime
        this.saveUserEngagement()
      } else {
        startTime = Date.now()
      }
    })

    // 跟踪用户交互
    const interactionEvents = ['click', 'scroll', 'keydown', 'touchstart']
    
    const handleInteraction = () => {
      interactionCount++
      this.userEngagement.interactions++
      
      if (interactionCount % 10 === 0) {
        this.saveUserEngagement()
      }
    }

    interactionEvents.forEach(event => {
      document.addEventListener(event, handleInteraction, { passive: true })
    })

    // 页面卸载时保存数据
    window.addEventListener('beforeunload', () => {
      const sessionTime = Date.now() - startTime
      this.userEngagement.totalEngagementTime += sessionTime
      this.saveUserEngagement()
    })
  }

  private loadUserEngagement(): UserEngagement {
    const saved = localStorage.getItem('userEngagement')
    if (saved) {
      return JSON.parse(saved)
    }

    return {
      visits: 1,
      totalEngagementTime: 0,
      interactions: 0,
      firstVisit: Date.now(),
      lastVisit: Date.now()
    }
  }

  private saveUserEngagement(): void {
    this.userEngagement.visits++
    this.userEngagement.lastVisit = Date.now()
    localStorage.setItem('userEngagement', JSON.stringify(this.userEngagement))
  }

  private recordEvent(event: string, data?: any): void {
    // 发送分析事件
    if ('gtag' in window) {
      (window as any).gtag('event', event, data)
    }
    
    // 或发送到自定义分析服务
    fetch('/api/analytics/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, data, timestamp: Date.now() })
    }).catch(error => console.warn('Analytics event failed:', error))
  }

  isInstallable(): boolean {
    return !!this.deferredPrompt
  }

  isInstalled(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone === true
  }
}

interface InstallCriteria {
  minVisits?: number
  minEngagementTime?: number
  minInteractions?: number
  cooldownPeriod?: number
}

interface UserEngagement {
  visits: number
  totalEngagementTime: number
  interactions: number
  firstVisit: number
  lastVisit: number
}
```

### 5.2 应用更新管理

```typescript
// src/utils/update/UpdateManager.ts
export class UpdateManager {
  private registration: ServiceWorkerRegistration | null = null
  private updateAvailable = false
  private updateCheckInterval: number = 60000 // 1分钟
  private updateTimer: number | null = null

  async init(registration: ServiceWorkerRegistration): Promise<void> {
    this.registration = registration
    
    // 监听更新
    registration.addEventListener('updatefound', this.onUpdateFound.bind(this))
    
    // 定期检查更新
    this.startUpdateCheck()
    
    // 页面焦点时检查更新
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.checkForUpdate()
      }
    })
  }

  private onUpdateFound(): void {
    const newWorker = this.registration!.installing
    
    if (newWorker) {
      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          this.updateAvailable = true
          this.showUpdateNotification()
        }
      })
    }
  }

  private startUpdateCheck(): void {
    this.updateTimer = setInterval(() => {
      this.checkForUpdate()
    }, this.updateCheckInterval)
  }

  private stopUpdateCheck(): void {
    if (this.updateTimer) {
      clearInterval(this.updateTimer)
      this.updateTimer = null
    }
  }

  async checkForUpdate(): Promise<boolean> {
    if (this.registration) {
      try {
        await this.registration.update()
        return this.updateAvailable
      } catch (error) {
        console.error('Update check failed:', error)
        return false
      }
    }
    return false
  }

  private showUpdateNotification(): void {
    // 创建更新通知
    const notification = this.createUpdateNotification()
    document.body.appendChild(notification)
    
    // 自动隐藏通知
    setTimeout(() => {
      if (document.body.contains(notification)) {
        this.hideUpdateNotification(notification)
      }
    }, 10000) // 10秒后自动隐藏
  }

  private createUpdateNotification(): HTMLElement {
    const notification = document.createElement('div')
    notification.className = 'update-notification'
    notification.innerHTML = `
      <div class="update-notification-content">
        <div class="update-icon">🔄</div>
        <div class="update-text">
          <h4>新版本可用</h4>
          <p>发现应用更新，重启后生效</p>
        </div>
        <div class="update-actions">
          <button class="update-btn">立即更新</button>
          <button class="later-btn">稍后</button>
        </div>
      </div>
    `

    // 添加事件监听器
    const updateBtn = notification.querySelector('.update-btn')
    const laterBtn = notification.querySelector('.later-btn')

    updateBtn?.addEventListener('click', () => {
      this.applyUpdate()
      this.hideUpdateNotification(notification)
    })

    laterBtn?.addEventListener('click', () => {
      this.hideUpdateNotification(notification)
    })

    return notification
  }

  private hideUpdateNotification(notification: HTMLElement): void {
    notification.classList.add('fade-out')
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification)
      }
    }, 300)
  }

  async applyUpdate(): Promise<void> {
    if (this.registration?.waiting) {
      // 通知Service Worker跳过等待
      this.registration.waiting.postMessage({ type: 'SKIP_WAITING' })
      
      // 监听控制器变化
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload()
      })
    }
  }

  // 强制更新（用于关键更新）
  async forceUpdate(): Promise<void> {
    // 清除所有缓存
    const cacheNames = await caches.keys()
    await Promise.all(
      cacheNames.map(name => caches.delete(name))
    )
    
    // 注销Service Worker
    if (this.registration) {
      await this.registration.unregister()
    }
    
    // 重新加载页面
    window.location.reload()
  }

  // 版本比较
  async getVersionInfo(): Promise<VersionInfo> {
    try {
      // 获取当前版本
      const currentVersion = await this.getCurrentVersion()
      
      // 检查远程版本
      const remoteVersion = await this.getRemoteVersion()
      
      return {
        current: currentVersion,
        remote: remoteVersion,
        updateAvailable: this.compareVersions(remoteVersion, currentVersion) > 0
      }
    } catch (error) {
      console.error('Version check failed:', error)
      return {
        current: 'unknown',
        remote: 'unknown',
        updateAvailable: false
      }
    }
  }

  private async getCurrentVersion(): Promise<string> {
    // 从Service Worker获取版本信息
    return new Promise((resolve) => {
      if (navigator.serviceWorker.controller) {
        const channel = new MessageChannel()
        channel.port1.onmessage = (event) => {
          resolve(event.data.version || 'unknown')
        }
        
        navigator.serviceWorker.controller.postMessage(
          { type: 'GET_VERSION' },
          [channel.port2]
        )
      } else {
        resolve('unknown')
      }
    })
  }

  private async getRemoteVersion(): Promise<string> {
    try {
      const response = await fetch('/api/version', { 
        cache: 'no-cache' 
      })
      const data = await response.json()
      return data.version
    } catch (error) {
      return 'unknown'
    }
  }

  private compareVersions(a: string, b: string): number {
    const aParts = a.split('.').map(Number)
    const bParts = b.split('.').map(Number)
    const maxLength = Math.max(aParts.length, bParts.length)
    
    for (let i = 0; i < maxLength; i++) {
      const aPart = aParts[i] || 0
      const bPart = bParts[i] || 0
      
      if (aPart > bPart) return 1
      if (aPart < bPart) return -1
    }
    
    return 0
  }

  isUpdateAvailable(): boolean {
    return this.updateAvailable
  }

  destroy(): void {
    this.stopUpdateCheck()
  }
}

interface VersionInfo {
  current: string
  remote: string
  updateAvailable: boolean
}
```

---

这份技术实现文档涵盖了PWA的核心技术细节，包括Service Worker管理、缓存策略、离线同步、推送通知和更新机制等。每个部分都提供了详细的代码实现和最佳实践。

如需继续了解其他方面的实现细节（如性能监控、错误处理、测试策略等），请告诉我！
