/**
 * IndexedDB 管理器
 * 用于大数据量的离线存储，替代localStorage的限制
 */

// 数据库配置
const DB_NAME = 'PWA_OfflineDB'
const DB_VERSION = 1

// 对象存储名称
export const STORES = {
  OPERATIONS: 'offline_operations',
  DOCUMENTS: 'documents',
  CACHE_DATA: 'cache_data',
  USER_SETTINGS: 'user_settings'
} as const

// 数据接口定义
export interface OfflineOperation {
  id: string
  type: 'CREATE' | 'UPDATE' | 'DELETE'
  resource: string
  data: any
  originalId?: string | number
  timestamp: number
  retryCount: number
  status: 'pending' | 'syncing' | 'completed' | 'failed'
  error?: string
  dataSize?: number // 数据大小（字节）
}

export interface DocumentData {
  id: string
  title: string
  content: string
  type: 'markdown' | 'html' | 'text'
  createdAt: number
  updatedAt: number
  size: number
  tags: string[]
  isOffline?: boolean
  isDraft?: boolean
}

export interface CacheData {
  key: string
  data: any
  timestamp: number
  expireTime?: number
  size: number
}

class IndexedDBManager {
  private static instance: IndexedDBManager
  private db: IDBDatabase | null = null
  private initPromise: Promise<void> | null = null

  private constructor() {}

  static getInstance(): IndexedDBManager {
    if (!IndexedDBManager.instance) {
      IndexedDBManager.instance = new IndexedDBManager()
    }
    return IndexedDBManager.instance
  }

  /**
   * 初始化数据库
   */
  async init(): Promise<void> {
    if (this.initPromise) {
      return this.initPromise
    }

    this.initPromise = new Promise((resolve, reject) => {
      if (!('indexedDB' in window)) {
        reject(new Error('IndexedDB 不支持'))
        return
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => {
        reject(new Error('IndexedDB 打开失败'))
      }

      request.onsuccess = () => {
        this.db = request.result
        console.log('✅ IndexedDB 初始化成功')
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // 创建离线操作存储
        if (!db.objectStoreNames.contains(STORES.OPERATIONS)) {
          const operationsStore = db.createObjectStore(STORES.OPERATIONS, { keyPath: 'id' })
          operationsStore.createIndex('resource', 'resource', { unique: false })
          operationsStore.createIndex('status', 'status', { unique: false })
          operationsStore.createIndex('timestamp', 'timestamp', { unique: false })
        }

        // 创建文档存储
        if (!db.objectStoreNames.contains(STORES.DOCUMENTS)) {
          const documentsStore = db.createObjectStore(STORES.DOCUMENTS, { keyPath: 'id' })
          documentsStore.createIndex('title', 'title', { unique: false })
          documentsStore.createIndex('type', 'type', { unique: false })
          documentsStore.createIndex('updatedAt', 'updatedAt', { unique: false })
          documentsStore.createIndex('tags', 'tags', { unique: false, multiEntry: true })
        }

        // 创建缓存数据存储
        if (!db.objectStoreNames.contains(STORES.CACHE_DATA)) {
          const cacheStore = db.createObjectStore(STORES.CACHE_DATA, { keyPath: 'key' })
          cacheStore.createIndex('timestamp', 'timestamp', { unique: false })
        }

        // 创建用户设置存储
        if (!db.objectStoreNames.contains(STORES.USER_SETTINGS)) {
          db.createObjectStore(STORES.USER_SETTINGS, { keyPath: 'key' })
        }

        console.log('🔧 IndexedDB 结构更新完成')
      }
    })

    return this.initPromise
  }

  /**
   * 确保数据库已初始化
   */
  private async ensureDB(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.init()
    }
    if (!this.db) {
      throw new Error('数据库未初始化')
    }
    return this.db
  }

  /**
   * 添加数据
   */
  async add<T>(storeName: string, data: T): Promise<void> {
    const db = await this.ensureDB()
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      
      try {
        // 清理数据，确保可以被IndexedDB序列化
        const cleanData = this.cleanDataForStorage(data)
        
        // 计算数据大小
        const dataSize = new TextEncoder().encode(JSON.stringify(cleanData)).length
        const dataWithSize = { ...cleanData, dataSize }
        
        const request = store.add(dataWithSize)
        
        request.onsuccess = () => {
          console.log(`📝 数据已添加到 ${storeName}:`, dataWithSize)
          resolve()
        }
        
        request.onerror = () => {
          reject(new Error(`添加数据失败: ${request.error?.message}`))
        }
      } catch (error: any) {
        reject(new Error(`数据预处理失败: ${error.message}`))
      }
    })
  }

  /**
   * 更新数据
   */
  async update<T>(storeName: string, data: T): Promise<void> {
    const db = await this.ensureDB()
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      
      try {
        // 清理数据，确保可以被IndexedDB序列化
        const cleanData = this.cleanDataForStorage(data)
        
        // 计算数据大小
        const dataSize = new TextEncoder().encode(JSON.stringify(cleanData)).length
        const dataWithSize = { ...cleanData, dataSize }
        
        const request = store.put(dataWithSize)
        
        request.onsuccess = () => {
          console.log(`✏️ 数据已更新在 ${storeName}:`, dataWithSize)
          resolve()
        }
        
        request.onerror = () => {
          reject(new Error(`更新数据失败: ${request.error?.message}`))
        }
      } catch (error: any) {
        reject(new Error(`数据预处理失败: ${error.message}`))
      }
    })
  }

  /**
   * 获取单个数据
   */
  async get<T>(storeName: string, key: string): Promise<T | null> {
    const db = await this.ensureDB()
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly')
      const store = transaction.objectStore(storeName)
      const request = store.get(key)
      
      request.onsuccess = () => {
        resolve(request.result || null)
      }
      
      request.onerror = () => {
        reject(new Error(`获取数据失败: ${request.error?.message}`))
      }
    })
  }

  /**
   * 获取所有数据
   */
  async getAll<T>(storeName: string): Promise<T[]> {
    const db = await this.ensureDB()
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly')
      const store = transaction.objectStore(storeName)
      const request = store.getAll()
      
      request.onsuccess = () => {
        resolve(request.result || [])
      }
      
      request.onerror = () => {
        reject(new Error(`获取所有数据失败: ${request.error?.message}`))
      }
    })
  }

  /**
   * 根据索引查询数据
   */
  async getByIndex<T>(storeName: string, indexName: string, value: any): Promise<T[]> {
    const db = await this.ensureDB()
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly')
      const store = transaction.objectStore(storeName)
      const index = store.index(indexName)
      const request = index.getAll(value)
      
      request.onsuccess = () => {
        resolve(request.result || [])
      }
      
      request.onerror = () => {
        reject(new Error(`根据索引查询失败: ${request.error?.message}`))
      }
    })
  }

  /**
   * 删除数据
   */
  async delete(storeName: string, key: string): Promise<void> {
    const db = await this.ensureDB()
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.delete(key)
      
      request.onsuccess = () => {
        console.log(`🗑️ 数据已从 ${storeName} 删除:`, key)
        resolve()
      }
      
      request.onerror = () => {
        reject(new Error(`删除数据失败: ${request.error?.message}`))
      }
    })
  }

  /**
   * 清空存储
   */
  async clear(storeName: string): Promise<void> {
    const db = await this.ensureDB()
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.clear()
      
      request.onsuccess = () => {
        console.log(`🧹 ${storeName} 已清空`)
        resolve()
      }
      
      request.onerror = () => {
        reject(new Error(`清空存储失败: ${request.error?.message}`))
      }
    })
  }

  /**
   * 获取存储统计信息
   */
  async getStorageStats(): Promise<{
    storeName: string
    count: number
    totalSize: number
  }[]> {
    const stats = []
    
    for (const storeName of Object.values(STORES)) {
      try {
        const data = await this.getAll(storeName)
        const count = data.length
        const totalSize = data.reduce((size, item: any) => {
          return size + (item.dataSize || 0)
        }, 0) as number
        
        stats.push({ storeName, count, totalSize })
      } catch (error) {
        console.warn(`获取 ${storeName} 统计信息失败:`, error)
      }
    }
    
    return stats
  }

  /**
   * 清理过期数据
   */
  async cleanupExpiredData(): Promise<void> {
    const now = Date.now()
    
    try {
      // 清理过期缓存
      const cacheData = await this.getAll<CacheData>(STORES.CACHE_DATA)
      for (const item of cacheData) {
        if (item.expireTime && item.expireTime < now) {
          await this.delete(STORES.CACHE_DATA, item.key)
        }
      }
      
      // 清理已完成超过7天的操作
      const operations = await this.getAll<OfflineOperation>(STORES.OPERATIONS)
      for (const op of operations) {
        if (op.status === 'completed' && (now - op.timestamp) > 7 * 24 * 60 * 60 * 1000) {
          await this.delete(STORES.OPERATIONS, op.id)
        }
      }
      
      console.log('🧹 过期数据清理完成')
    } catch (error) {
      console.error('清理过期数据失败:', error)
    }
  }

  /**
   * 压缩数据
   */
  async compressData<T>(data: T): Promise<string> {
    const jsonString = JSON.stringify(data)
    
    // 使用 CompressionStream API（如果支持）
    if ('CompressionStream' in window) {
      try {
        const stream = new CompressionStream('gzip')
        const writer = stream.writable.getWriter()
        const reader = stream.readable.getReader()
        
        writer.write(new TextEncoder().encode(jsonString))
        writer.close()
        
        const chunks = []
        let done = false
        
        while (!done) {
          const { value, done: readerDone } = await reader.read()
          done = readerDone
          if (value) chunks.push(value)
        }
        
        const compressed = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0))
        let offset = 0
        for (const chunk of chunks) {
          compressed.set(chunk, offset)
          offset += chunk.length
        }
        
        return btoa(String.fromCharCode(...compressed))
      } catch (error) {
        console.warn('压缩失败，使用原始数据:', error)
      }
    }
    
    return jsonString
  }

  /**
   * 解压数据
   */
  async decompressData<T>(compressedData: string): Promise<T> {
    // 尝试解压
    if ('DecompressionStream' in window && compressedData.length > 0 && compressedData[0] !== '{') {
      try {
        const compressed = Uint8Array.from(atob(compressedData), c => c.charCodeAt(0))
        const stream = new DecompressionStream('gzip')
        const writer = stream.writable.getWriter()
        const reader = stream.readable.getReader()
        
        writer.write(compressed)
        writer.close()
        
        const chunks = []
        let done = false
        
        while (!done) {
          const { value, done: readerDone } = await reader.read()
          done = readerDone
          if (value) chunks.push(value)
        }
        
        const decompressed = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0))
        let offset = 0
        for (const chunk of chunks) {
          decompressed.set(chunk, offset)
          offset += chunk.length
        }
        
        const jsonString = new TextDecoder().decode(decompressed)
        return JSON.parse(jsonString)
      } catch (error) {
        console.warn('解压失败，尝试直接解析:', error)
      }
    }
    
    // 直接解析JSON
    return JSON.parse(compressedData)
  }

  /**
   * 清理数据以确保IndexedDB兼容性
   */
  private cleanDataForStorage<T>(data: T): T {
    try {
      // 使用JSON序列化和反序列化来移除Vue响应式代理和不可序列化的属性
      const jsonString = JSON.stringify(data, (_key, value) => {
        // 过滤掉函数、Symbol、undefined等不可序列化的值
        if (typeof value === 'function' || typeof value === 'symbol' || value === undefined) {
          return null
        }
        
        // 确保数组是纯数组
        if (Array.isArray(value)) {
          return value.filter(item => 
            typeof item === 'string' || 
            typeof item === 'number' || 
            typeof item === 'boolean' ||
            (typeof item === 'object' && item !== null)
          )
        }
        
        return value
      })
      
      return JSON.parse(jsonString)
    } catch (error) {
      console.warn('数据清理失败，使用原始数据:', error)
      return data
    }
  }

  /**
   * 批量操作
   */
  async batchOperation<T>(
    storeName: string,
    operations: Array<{
      type: 'add' | 'update' | 'delete'
      data?: T
      key?: string
    }>
  ): Promise<void> {
    const db = await this.ensureDB()
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      
      let completed = 0
      let errors: string[] = []
      
      const checkCompletion = () => {
        if (completed === operations.length) {
          if (errors.length > 0) {
            reject(new Error(`批量操作部分失败: ${errors.join(', ')}`))
          } else {
            console.log(`✅ 批量操作完成，共 ${operations.length} 个操作`)
            resolve()
          }
        }
      }
      
      operations.forEach((op, index) => {
        let request: IDBRequest
        
        switch (op.type) {
          case 'add':
            request = store.add(op.data)
            break
          case 'update':
            request = store.put(op.data)
            break
          case 'delete':
            request = store.delete(op.key!)
            break
          default:
            completed++
            errors.push(`未知操作类型: ${op.type}`)
            checkCompletion()
            return
        }
        
        request.onsuccess = () => {
          completed++
          checkCompletion()
        }
        
        request.onerror = () => {
          completed++
          errors.push(`操作 ${index} 失败: ${request.error?.message}`)
          checkCompletion()
        }
      })
    })
  }
}

// 导出单例实例
export const indexedDBManager = IndexedDBManager.getInstance()

// 导出便捷方法
export const initDB = () => indexedDBManager.init()
export const addData = <T>(storeName: string, data: T) => indexedDBManager.add(storeName, data)
export const updateData = <T>(storeName: string, data: T) => indexedDBManager.update(storeName, data)
export const getData = <T>(storeName: string, key: string) => indexedDBManager.get<T>(storeName, key)
export const getAllData = <T>(storeName: string) => indexedDBManager.getAll<T>(storeName)
export const deleteData = (storeName: string, key: string) => indexedDBManager.delete(storeName, key)
export const clearStore = (storeName: string) => indexedDBManager.clear(storeName)
export const getStorageStats = () => indexedDBManager.getStorageStats()
export const cleanupExpired = () => indexedDBManager.cleanupExpiredData()
