/**
 * 离线CRUD操作的通用组合式函数
 */
import { ref, type Ref } from 'vue'
import { addOfflineOperation } from '../utils/offlineSync'

export interface OfflineCRUDOptions<T> {
  resource: string // 'users' | 'posts' | 'comments' | 'albums'
  items: Ref<T[]>
  createApi: (data: any) => Promise<T>
  updateApi: (id: number, data: any) => Promise<T>
  deleteApi: (id: number) => Promise<void>
  getMaxId?: (items: T[]) => number
  onSuccess?: (operation: 'create' | 'update' | 'delete', item: T) => void
  onOffline?: (operation: 'create' | 'update' | 'delete', item: T) => void
}

export function useOfflineCRUD<T extends { id: number }>(options: OfflineCRUDOptions<T>) {
  const {
    resource,
    items,
    createApi,
    updateApi,
    deleteApi,
    getMaxId = (items) => Math.max(...items.map(item => item.id), 0),
    onSuccess,
    onOffline
  } = options

  const isOperating = ref(false)

  /**
   * 离线安全的创建操作
   */
  const createItemSafely = async (data: any): Promise<T | null> => {
    isOperating.value = true
    
    try {
      // 检查网络状态
      if (!navigator.onLine) {
        throw new Error('网络不可用')
      }

      // 在线模式：直接调用API
      const newItem = await createApi(data)
      
      // 分配新ID（处理JSONPlaceholder的ID问题）
      const maxId = getMaxId(items.value)
      const itemWithId = { ...newItem, id: maxId + 1 } as T
      
      items.value.unshift(itemWithId)
      
      onSuccess?.('create', itemWithId)
      console.log(`✅ ${resource} 创建成功:`, itemWithId)
      
      return itemWithId

    } catch (error: any) {
      // 网络错误时切换到离线模式
      if (error.message.includes('网络不可用') || 
          error.message.includes('fetch') || 
          error.message.includes('network')) {
        
        console.log(`📝 ${resource} 创建：网络不可用，添加到离线同步队列`)
        
        const maxId = getMaxId(items.value)
        const tempItem = {
          ...data,
          id: maxId + 1,
          _isOffline: true
        } as T & { _isOffline?: boolean }
        
        items.value.unshift(tempItem)
        addOfflineOperation('CREATE', resource, data)
        
        onOffline?.('create', tempItem)
        console.log(`📝 ${resource} 已添加到离线队列:`, tempItem)
        
        return tempItem
      } else {
        console.error(`❌ ${resource} 创建失败:`, error)
        throw error
      }
    } finally {
      isOperating.value = false
    }
  }

  /**
   * 离线安全的更新操作
   */
  const updateItemSafely = async (id: number, data: any): Promise<T | null> => {
    isOperating.value = true
    
    try {
      // 检查网络状态
      if (!navigator.onLine) {
        throw new Error('网络不可用')
      }

      // 在线模式：直接调用API
      const updatedItem = await updateApi(id, data)
      
      // 更新本地数组
      const index = items.value.findIndex(item => item.id === id)
      if (index !== -1) {
        items.value[index] = { ...items.value[index], ...updatedItem } as T
        
        onSuccess?.('update', items.value[index])
        console.log(`✅ ${resource} 更新成功:`, items.value[index])
        
        return items.value[index]
      }
      
      return null

    } catch (error: any) {
      // 网络错误时切换到离线模式
      if (error.message.includes('网络不可用') || 
          error.message.includes('fetch') || 
          error.message.includes('network')) {
        
        console.log(`📝 ${resource} 更新：网络不可用，添加到离线同步队列`)
        
        // 先在本地更新
        const index = items.value.findIndex(item => item.id === id)
        if (index !== -1) {
          items.value[index] = {
            ...items.value[index],
            ...data,
            _isOffline: true
          } as T & { _isOffline?: boolean }
          
          addOfflineOperation('UPDATE', resource, data, id)
          
          onOffline?.('update', items.value[index])
          console.log(`📝 ${resource} 更新已添加到离线队列:`, items.value[index])
          
          return items.value[index]
        }
      } else {
        console.error(`❌ ${resource} 更新失败:`, error)
        throw error
      }
      
      return null
    } finally {
      isOperating.value = false
    }
  }

  /**
   * 离线安全的删除操作
   */
  const deleteItemSafely = async (item: T): Promise<boolean> => {
    isOperating.value = true
    
    try {
      // 检查网络状态
      if (!navigator.onLine) {
        throw new Error('网络不可用')
      }

      // 在线模式：直接调用API
      await deleteApi(item.id)
      
      // 从本地数组中移除
      items.value = items.value.filter(i => i.id !== item.id)
      
      onSuccess?.('delete', item)
      console.log(`✅ ${resource} 删除成功:`, item)
      
      return true

    } catch (error: any) {
      // 网络错误时切换到离线模式
      if (error.message.includes('网络不可用') || 
          error.message.includes('fetch') || 
          error.message.includes('network')) {
        
        console.log(`📝 ${resource} 删除：网络不可用，添加到离线同步队列`)
        
        // 在本地标记为已删除
        const index = items.value.findIndex(i => i.id === item.id)
        if (index !== -1) {
          items.value[index] = {
            ...items.value[index],
            _isDeleted: true,
            _isOffline: true
          } as T & { _isDeleted?: boolean, _isOffline?: boolean }
          
          addOfflineOperation('DELETE', resource, { name: (item as any).name || (item as any).title }, item.id)
          
          onOffline?.('delete', items.value[index])
          console.log(`📝 ${resource} 删除已添加到离线队列:`, item)
          
          return true
        }
      } else {
        console.error(`❌ ${resource} 删除失败:`, error)
        throw error
      }
      
      return false
    } finally {
      isOperating.value = false
    }
  }

  /**
   * 显示操作结果消息
   */
  const showMessage = (type: 'success' | 'offline' | 'error', operation: string, message: string) => {
    const messages = {
      success: `${operation}成功！`,
      offline: `网络不可用，${operation}已保存到同步队列，网络恢复后将自动同步`,
      error: `${operation}失败: ${message}`
    }
    
    alert(messages[type])
  }

  /**
   * 获取项目显示样式类
   */
  const getItemClasses = (item: T & { _isOffline?: boolean, _isDeleted?: boolean }) => {
    return {
      'offline': item._isOffline && !item._isDeleted,
      'deleted': item._isDeleted
    }
  }

  /**
   * 获取项目状态标识
   */
  const getItemBadges = (item: T & { _isOffline?: boolean, _isDeleted?: boolean }) => {
    const badges = []
    
    if (item._isOffline && !item._isDeleted) {
      badges.push({
        icon: '📝',
        title: '离线操作，待同步',
        class: 'offline-badge'
      })
    }
    
    if (item._isDeleted) {
      badges.push({
        icon: '🗑️',
        title: '已标记删除，待同步',
        class: 'deleted-badge'
      })
    }
    
    return badges
  }

  return {
    isOperating,
    createItemSafely,
    updateItemSafely,
    deleteItemSafely,
    showMessage,
    getItemClasses,
    getItemBadges
  }
}

// 导出类型定义
export type OfflineItem<T> = T & {
  _isOffline?: boolean
  _isDeleted?: boolean
}
