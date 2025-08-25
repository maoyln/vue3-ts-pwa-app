/**
 * @Author: maoyl maoyl@glodon.com
 * @Date: 2025-08-24 13:00:00
 * @LastEditors: maoyl maoyl@glodon.com
 * @LastEditTime: 2025-08-24 13:00:00
 * @FilePath: /my-vue3-ts-pwa-app/src/examples/apiMigration.ts
 * @Description: API迁移示例 - 从fetch迁移到axios封装
 */

import { UserAPI, PostAPI, CommentAPI, BatchAPI } from '../api'
import { dataPrecacheService } from '../utils/dataPrecacheService'

// ==================== 迁移前的代码示例 ====================

// 旧的fetch方式 - 用户数据获取
export const fetchUsersOld = async (forceRefresh = false) => {
  const loading = { value: true }
  const error = { value: '' }
  
  try {
    let data: any[] | null = null
    
    // 如果不是强制刷新，先尝试从预缓存获取数据
    if (!forceRefresh) {
      data = await dataPrecacheService.getCachedData<any[]>('users')
      if (data) {
        console.log('✅ 从预缓存加载用户数据:', data.length, '条记录')
        loading.value = false
        return { data, fromCache: true, source: '预缓存' }
      }
    }
    
    // 如果预缓存没有数据或强制刷新，从网络获取
    const url = `https://jsonplaceholder.typicode.com/users`
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    data = await response.json()
    
    // 检查缓存状态
    const cacheStatusHeader = response.headers.get('sw-cache-status')
    const cacheStatus = cacheStatusHeader || 'fresh'
    const dataSource = cacheStatusHeader === 'miss' ? '网络' : '缓存'
    
    console.log('✅ 用户数据加载成功:', data!.length, '条记录')
    
    return { 
      data, 
      fromCache: cacheStatus !== 'miss', 
      source: dataSource,
      cacheStatus 
    }
    
  } catch (err: any) {
    console.error('❌ 获取用户数据失败:', err)
    error.value = err.message || '获取用户数据失败'
    
    // 网络错误时尝试获取缓存数据
    if (err.message.includes('网络不可用') || err.message.includes('fetch') || err.message.includes('network')) {
      const cachedData = await dataPrecacheService.getCachedData<any[]>('users')
      if (cachedData) {
        console.log('📦 网络错误，返回缓存数据')
        return { 
          data: cachedData, 
          fromCache: true, 
          source: '离线缓存',
          offline: true 
        }
      }
    }
    
    throw err
  } finally {
    loading.value = false
  }
}

// 旧的fetch方式 - 创建用户
export const createUserOld = async (userData: any) => {
  try {
    const response = await fetch('https://jsonplaceholder.typicode.com/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData)
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const newUser = await response.json()
    console.log('✅ 用户创建成功:', newUser)
    return newUser
    
  } catch (error: any) {
    console.error('❌ 创建用户失败:', error)
    throw error
  }
}

// ==================== 迁移后的代码示例 ====================

// 新的axios封装方式 - 用户数据获取
export const fetchUsersNew = async (forceRefresh = false) => {
  try {
    // 使用新的API封装，自动处理缓存、重试、离线等逻辑
    const response = await UserAPI.getUsers({
      // 缓存配置
      useCache: !forceRefresh,
      cacheTime: 5 * 60 * 1000, // 5分钟缓存
      cacheStrategy: forceRefresh ? 'networkOnly' : 'networkFirst',
      
      // 离线支持
      offlineSupport: true,
      offlineMessage: '当前离线，显示缓存的用户数据',
      
      // 重试配置
      retry: true,
      retryCount: 3,
      retryDelay: 1000,
      
      // UI配置
      showLoading: true,
      showError: true
    })
    
    console.log('✅ 用户数据加载成功:', response.data?.length || 0, '条记录')
    
    return {
      data: response.data,
      fromCache: response.fromCache,
      source: response.fromCache ? '缓存' : '网络',
      offline: response.offline,
      success: response.success,
      message: response.message
    }
    
  } catch (error: any) {
    console.error('❌ 获取用户数据失败:', error)
    throw error
  }
}

// 新的axios封装方式 - 创建用户
export const createUserNew = async (userData: any) => {
  try {
    const response = await UserAPI.createUser(userData, {
      // 重试配置
      retry: true,
      retryCount: 2,
      retryDelay: 1000,
      
      // UI配置
      showLoading: true,
      showError: true
    })
    
    console.log('✅ 用户创建成功:', response.data)
    return response.data
    
  } catch (error: any) {
    console.error('❌ 创建用户失败:', error)
    throw error
  }
}

// ==================== 批量请求示例 ====================

// 旧的方式 - 手动管理多个请求
export const loadDashboardDataOld = async () => {
  const loading = { value: true }
  const errors: string[] = []
  
  try {
    // 手动发起多个请求
    const [usersResponse, postsResponse, commentsResponse] = await Promise.allSettled([
      fetch('https://jsonplaceholder.typicode.com/users'),
      fetch('https://jsonplaceholder.typicode.com/posts'),
      fetch('https://jsonplaceholder.typicode.com/comments')
    ])
    
    // 手动处理每个响应
    const users = usersResponse.status === 'fulfilled' && usersResponse.value.ok 
      ? await usersResponse.value.json() 
      : null
      
    const posts = postsResponse.status === 'fulfilled' && postsResponse.value.ok 
      ? await postsResponse.value.json() 
      : null
      
    const comments = commentsResponse.status === 'fulfilled' && commentsResponse.value.ok 
      ? await commentsResponse.value.json() 
      : null
    
    // 收集错误
    if (!users) errors.push('用户数据加载失败')
    if (!posts) errors.push('文章数据加载失败')
    if (!comments) errors.push('评论数据加载失败')
    
    return { users, posts, comments, errors }
    
  } catch (error: any) {
    console.error('❌ 仪表板数据加载失败:', error)
    throw error
  } finally {
    loading.value = false
  }
}

// 新的方式 - 使用批量请求API
export const loadDashboardDataNew = async () => {
  try {
    const startTime = Date.now()
    
    // 使用批量请求API，自动处理错误和缓存
    const results = await BatchAPI.parallel({
      users: UserAPI.getUsers({
        useCache: true,
        cacheTime: 5 * 60 * 1000,
        offlineSupport: true
      }),
      posts: PostAPI.getPosts({
        useCache: true,
        cacheTime: 5 * 60 * 1000,
        offlineSupport: true
      }),
      comments: CommentAPI.getComments({
        useCache: true,
        cacheTime: 5 * 60 * 1000,
        offlineSupport: true
      })
    })
    
    const duration = Date.now() - startTime
    console.log(`✅ 仪表板数据加载完成，耗时: ${duration}ms`)
    
    // 统计成功和失败的请求
    const successful = Object.values(results).filter(r => r !== null).length
    const total = Object.keys(results).length
    
    return {
      ...results,
      meta: {
        duration,
        successful,
        total,
        success: successful === total
      }
    }
    
  } catch (error: any) {
    console.error('❌ 仪表板数据加载失败:', error)
    throw error
  }
}

// ==================== 高级功能示例 ====================

// 条件请求 - 根据网络状态选择策略
export const smartDataFetch = async (resourceType: 'users' | 'posts' | 'comments') => {
  // 检查网络状态
  const isOnline = navigator.onLine
  const connection = (navigator as any).connection
  const isSlowNetwork = connection && connection.effectiveType && 
    ['slow-2g', '2g'].includes(connection.effectiveType)
  
  // 根据网络状态选择不同的策略
  const config = {
    useCache: true,
    cacheStrategy: isOnline && !isSlowNetwork ? 'networkFirst' : 'cacheFirst',
    cacheTime: isSlowNetwork ? 10 * 60 * 1000 : 5 * 60 * 1000, // 慢网络缓存更久
    networkTimeout: isSlowNetwork ? 15000 : 8000, // 慢网络超时时间更长
    offlineSupport: true,
    retry: isOnline,
    retryCount: isSlowNetwork ? 2 : 3,
    retryDelay: isSlowNetwork ? 2000 : 1000
  } as const
  
  console.log(`🌐 智能请求策略:`, {
    isOnline,
    isSlowNetwork,
    strategy: config.cacheStrategy,
    timeout: config.networkTimeout
  })
  
  switch (resourceType) {
    case 'users':
      return UserAPI.getUsers(config)
    case 'posts':
      return PostAPI.getPosts(config)
    case 'comments':
      return CommentAPI.getComments(config)
    default:
      throw new Error(`不支持的资源类型: ${resourceType}`)
  }
}

// 预加载数据
export const preloadCriticalData = async () => {
  console.log('🚀 开始预加载关键数据...')
  
  try {
    // 预加载用户数据（静默模式，不显示加载状态）
    UserAPI.getUsers({
      silent: true,
      useCache: true,
      cacheTime: 10 * 60 * 1000
    }).catch(error => {
      console.warn('⚠️ 用户数据预加载失败:', error.message)
    })
    
    // 预加载文章数据
    PostAPI.getPosts({
      silent: true,
      useCache: true,
      cacheTime: 10 * 60 * 1000
    }).catch(error => {
      console.warn('⚠️ 文章数据预加载失败:', error.message)
    })
    
    console.log('✅ 关键数据预加载已启动')
    
  } catch (error: any) {
    console.error('❌ 预加载失败:', error)
  }
}

// 导出迁移对比
export const migrationComparison = {
  // 旧方式的问题
  oldWayProblems: [
    '手动处理缓存逻辑',
    '手动处理错误重试',
    '手动处理离线场景',
    '重复的错误处理代码',
    '缺乏统一的请求拦截',
    '难以调试和监控',
    '缺乏请求去重',
    '缺乏加载状态管理'
  ],
  
  // 新方式的优势
  newWayBenefits: [
    '自动缓存管理（内存+持久化）',
    '智能重试机制（指数退避）',
    '完善的离线支持',
    '统一的错误处理',
    '请求/响应拦截器',
    '详细的请求日志',
    '自动请求去重',
    '集成加载状态管理',
    'TypeScript类型安全',
    'PWA网络策略优化',
    '批量请求支持',
    '网络质量自适应'
  ],
  
  // 迁移步骤
  migrationSteps: [
    '1. 安装axios依赖',
    '2. 引入HTTP客户端和API封装',
    '3. 替换fetch调用为对应的API方法',
    '4. 配置缓存和重试策略',
    '5. 添加离线支持配置',
    '6. 测试各种网络场景',
    '7. 优化错误处理',
    '8. 添加请求监控和日志'
  ]
}

// 导出所有示例
export default {
  // 旧方式
  fetchUsersOld,
  createUserOld,
  loadDashboardDataOld,
  
  // 新方式
  fetchUsersNew,
  createUserNew,
  loadDashboardDataNew,
  
  // 高级功能
  smartDataFetch,
  preloadCriticalData,
  
  // 迁移信息
  migrationComparison
}
