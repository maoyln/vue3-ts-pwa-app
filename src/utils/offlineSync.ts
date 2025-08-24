/**
 * 离线数据同步管理器
 * 处理离线时的CRUD操作缓存和网络恢复后的自动同步
 * 使用 IndexedDB 替代 localStorage 以支持大数据量存储
 */
import { indexedDBManager, STORES, type OfflineOperation as IDBOfflineOperation } from './indexedDBManager'

// 离线操作类型
export type OfflineOperationType = 'CREATE' | 'UPDATE' | 'DELETE'

// 离线操作接口（使用IndexedDB版本）
export type OfflineOperation = IDBOfflineOperation

// 同步结果接口
export interface SyncResult {
  success: boolean
  operation: OfflineOperation
  serverData?: any
  error?: string
}

// 同步状态接口
export interface SyncStatus {
  isOnline: boolean
  isSyncing: boolean
  pendingOperations: number
  lastSyncTime: number | null
  syncProgress: number
}

class OfflineSyncManager {
  private static instance: OfflineSyncManager
  private operations: OfflineOperation[] = []
  private syncStatus: SyncStatus = {
    isOnline: navigator.onLine,
    isSyncing: false,
    pendingOperations: 0,
    lastSyncTime: null,
    syncProgress: 0
  }
  private listeners: Set<(status: SyncStatus) => void> = new Set()
  private syncInProgress = false

  private constructor() {
    this.initializeDB()
    this.setupNetworkListeners()
    this.updateStatus()
  }

  /**
   * 初始化数据库
   */
  private async initializeDB(): Promise<void> {
    try {
      await indexedDBManager.init()
      await this.loadOperations()
      console.log('📦 离线同步管理器初始化完成')
    } catch (error) {
      console.error('初始化IndexedDB失败，回退到localStorage:', error)
      this.loadOperationsFromLocalStorage()
    }
  }

  static getInstance(): OfflineSyncManager {
    if (!OfflineSyncManager.instance) {
      OfflineSyncManager.instance = new OfflineSyncManager()
    }
    return OfflineSyncManager.instance
  }

  /**
   * 添加离线操作到队列
   */
  async addOperation(
    type: OfflineOperationType,
    resource: string,
    data: any,
    originalId?: string | number
  ): Promise<string> {
    const operation: OfflineOperation = {
      id: this.generateId(),
      type,
      resource,
      data: JSON.parse(JSON.stringify(data)), // 深拷贝避免引用问题
      originalId,
      timestamp: Date.now(),
      retryCount: 0,
      status: 'pending'
    }

    this.operations.push(operation)
    await this.saveOperations()
    this.updateStatus()

    console.log(`📝 添加离线操作:`, operation)

    // 如果在线，立即尝试同步
    if (this.syncStatus.isOnline && !this.syncInProgress) {
      this.startSync()
    }

    return operation.id
  }

  /**
   * 获取指定资源的待处理操作
   */
  getPendingOperations(resource?: string): OfflineOperation[] {
    const pending = this.operations.filter(op => op.status === 'pending')
    return resource ? pending.filter(op => op.resource === resource) : pending
  }

  /**
   * 获取同步状态
   */
  getSyncStatus(): SyncStatus {
    return { ...this.syncStatus }
  }

  /**
   * 监听同步状态变化
   */
  onStatusChange(listener: (status: SyncStatus) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  /**
   * 开始同步操作
   */
  async startSync(): Promise<void> {
    if (this.syncInProgress || !this.syncStatus.isOnline) {
      return
    }

    const pendingOps = this.getPendingOperations()
    if (pendingOps.length === 0) {
      return
    }

    this.syncInProgress = true
    this.syncStatus.isSyncing = true
    this.syncStatus.syncProgress = 0
    this.notifyListeners()

    console.log(`🔄 开始同步 ${pendingOps.length} 个离线操作`)

    try {
      const results: SyncResult[] = []
      
      for (let i = 0; i < pendingOps.length; i++) {
        const operation = pendingOps[i]
        
        try {
          operation.status = 'syncing'
          this.saveOperations()
          this.notifyListeners()

          const result = await this.syncOperation(operation)
          results.push(result)

          if (result.success) {
            operation.status = 'completed'
            console.log(`✅ 同步成功:`, operation)
          } else {
            operation.status = 'failed'
            operation.error = result.error
            operation.retryCount++
            console.error(`❌ 同步失败:`, operation, result.error)
          }
        } catch (error: any) {
          operation.status = 'failed'
          operation.error = error.message
          operation.retryCount++
          console.error(`❌ 同步异常:`, operation, error)
        }

        // 更新进度
        this.syncStatus.syncProgress = Math.round(((i + 1) / pendingOps.length) * 100)
        await this.saveOperations()
        this.notifyListeners()

        // 添加延迟避免请求过于频繁
        if (i < pendingOps.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      }

      // 清理已完成的操作
      this.operations = this.operations.filter(op => op.status !== 'completed')
      this.syncStatus.lastSyncTime = Date.now()

      console.log(`🎉 同步完成，成功: ${results.filter(r => r.success).length}，失败: ${results.filter(r => !r.success).length}`)

    } finally {
      this.syncInProgress = false
      this.syncStatus.isSyncing = false
      this.syncStatus.syncProgress = 0
      await this.saveOperations()
      this.updateStatus()
      this.notifyListeners()
    }
  }

  /**
   * 重试失败的操作
   */
  async retryFailedOperations(): Promise<void> {
    const failedOps = this.operations.filter(op => op.status === 'failed')
    
    // 重置状态为pending
    failedOps.forEach(op => {
      op.status = 'pending'
      op.error = undefined
    })

    await this.saveOperations()
    this.updateStatus()

    if (this.syncStatus.isOnline) {
      await this.startSync()
    }
  }

  /**
   * 清除所有操作
   */
  async clearOperations(): Promise<void> {
    this.operations = []
    await this.saveOperations()
    this.updateStatus()
  }

  /**
   * 清除指定资源的操作
   */
  async clearResourceOperations(resource: string): Promise<void> {
    this.operations = this.operations.filter(op => op.resource !== resource)
    await this.saveOperations()
    this.updateStatus()
  }

  /**
   * 同步单个操作
   */
  private async syncOperation(operation: OfflineOperation): Promise<SyncResult> {
    const { type, resource, data, originalId } = operation

    try {
      let response: Response
      let url = `https://jsonplaceholder.typicode.com/${resource}`
      let method = 'POST'
      let body = JSON.stringify(data)

      switch (type) {
        case 'CREATE':
          method = 'POST'
          break
          
        case 'UPDATE':
          method = 'PUT'
          url = `${url}/${originalId}`
          break
          
        case 'DELETE':
          method = 'DELETE'
          url = `${url}/${originalId}`
          body = ''
          break
      }

      response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: method === 'DELETE' ? undefined : body
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const serverData = method === 'DELETE' ? null : await response.json()

      return {
        success: true,
        operation,
        serverData
      }

    } catch (error: any) {
      return {
        success: false,
        operation,
        error: error.message
      }
    }
  }

  /**
   * 设置网络状态监听
   */
  private setupNetworkListeners(): void {
    const handleOnline = () => {
      console.log('🌐 网络已连接，准备同步离线操作')
      this.syncStatus.isOnline = true
      this.updateStatus()
      this.notifyListeners()
      
      // 延迟1秒后开始同步，确保网络稳定
      setTimeout(() => {
        if (this.syncStatus.isOnline) {
          this.startSync()
        }
      }, 1000)
    }

    const handleOffline = () => {
      console.log('📡 网络已断开')
      this.syncStatus.isOnline = false
      this.syncInProgress = false
      this.syncStatus.isSyncing = false
      this.updateStatus()
      this.notifyListeners()
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // 页面可见性变化时检查网络状态
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        setTimeout(() => {
          const wasOnline = this.syncStatus.isOnline
          this.syncStatus.isOnline = navigator.onLine
          
          if (!wasOnline && this.syncStatus.isOnline) {
            handleOnline()
          } else if (wasOnline && !this.syncStatus.isOnline) {
            handleOffline()
          }
        }, 500)
      }
    })
  }

  /**
   * 更新状态
   */
  private updateStatus(): void {
    this.syncStatus.pendingOperations = this.getPendingOperations().length
  }

  /**
   * 通知监听者
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.getSyncStatus())
      } catch (error) {
        console.error('同步状态监听器错误:', error)
      }
    })
  }

  /**
   * 生成唯一ID
   */
  private generateId(): string {
    return `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 保存操作到IndexedDB
   */
  private async saveOperations(): Promise<void> {
    try {
      // 清空现有操作
      await indexedDBManager.clear(STORES.OPERATIONS)
      
      // 批量保存操作
      if (this.operations.length > 0) {
        await indexedDBManager.batchOperation(
          STORES.OPERATIONS,
          this.operations.map(op => ({ type: 'add' as const, data: op }))
        )
      }
      
      console.log(`💾 已保存 ${this.operations.length} 个离线操作到IndexedDB`)
    } catch (error) {
      console.error('保存离线操作到IndexedDB失败，尝试localStorage:', error)
      this.saveOperationsToLocalStorage()
    }
  }

  /**
   * 从IndexedDB加载操作
   */
  private async loadOperations(): Promise<void> {
    try {
      this.operations = await indexedDBManager.getAll<OfflineOperation>(STORES.OPERATIONS)
      console.log(`📦 从IndexedDB加载了 ${this.operations.length} 个离线操作`)
    } catch (error) {
      console.error('从IndexedDB加载离线操作失败:', error)
      this.operations = []
    }
  }

  /**
   * 备用：保存到localStorage
   */
  private saveOperationsToLocalStorage(): void {
    try {
      // 为了避免localStorage限制，只保存关键信息
      const lightOperations = this.operations.map(op => ({
        id: op.id,
        type: op.type,
        resource: op.resource,
        data: op.data,
        originalId: op.originalId,
        timestamp: op.timestamp,
        retryCount: op.retryCount,
        status: op.status,
        error: op.error
      }))
      
      localStorage.setItem('offline_operations', JSON.stringify(lightOperations))
      console.log(`💾 已保存 ${lightOperations.length} 个离线操作到localStorage`)
    } catch (error) {
      console.error('保存到localStorage也失败:', error)
      // 如果localStorage也满了，清理一些旧数据
      this.cleanupLocalStorage()
    }
  }

  /**
   * 备用：从localStorage加载操作
   */
  private loadOperationsFromLocalStorage(): void {
    try {
      const saved = localStorage.getItem('offline_operations')
      if (saved) {
        this.operations = JSON.parse(saved)
        console.log(`📦 从localStorage加载了 ${this.operations.length} 个离线操作`)
      }
    } catch (error) {
      console.error('从localStorage加载离线操作失败:', error)
      this.operations = []
    }
  }

  /**
   * 清理localStorage
   */
  private cleanupLocalStorage(): void {
    try {
      // 只保留最近的50个操作
      if (this.operations.length > 50) {
        this.operations = this.operations
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, 50)
        
        const lightOperations = this.operations.map(op => ({
          id: op.id,
          type: op.type,
          resource: op.resource,
          data: op.data,
          originalId: op.originalId,
          timestamp: op.timestamp,
          retryCount: op.retryCount,
          status: op.status,
          error: op.error
        }))
        
        localStorage.setItem('offline_operations', JSON.stringify(lightOperations))
        console.log('🧹 已清理localStorage，保留最近50个操作')
      }
    } catch (error) {
      console.error('清理localStorage失败:', error)
    }
  }
}

// 导出单例实例
export const offlineSyncManager = OfflineSyncManager.getInstance()

// 导出便捷方法
export const addOfflineOperation = (
  type: OfflineOperationType,
  resource: string,
  data: any,
  originalId?: string | number
): Promise<string> => {
  return offlineSyncManager.addOperation(type, resource, data, originalId)
}

export const getSyncStatus = (): SyncStatus => {
  return offlineSyncManager.getSyncStatus()
}

export const onSyncStatusChange = (listener: (status: SyncStatus) => void): (() => void) => {
  return offlineSyncManager.onStatusChange(listener)
}

export const retrySync = (): Promise<void> => {
  return offlineSyncManager.retryFailedOperations()
}

export const clearAllOperations = (): Promise<void> => {
  return offlineSyncManager.clearOperations()
}
