/**
 * 数据预缓存服务
 * 在应用初始化时预先缓存所有模块的数据
 */

import { indexedDBManager, STORES } from './indexedDBManager'

// API基础URL
const API_BASE_URL = 'https://jsonplaceholder.typicode.com'

// 缓存配置
interface CacheConfig {
  key: string
  url: string
  transformer?: (data: any) => any
  dependencies?: string[] // 依赖的其他缓存
}

// 所有模块的缓存配置
const CACHE_CONFIGS: CacheConfig[] = [
  {
    key: 'users',
    url: `${API_BASE_URL}/users`
  },
  {
    key: 'posts',
    url: `${API_BASE_URL}/posts`,
    transformer: (data: any[]) => data.slice(0, 20) // 限制文章数量
  },
  {
    key: 'comments',
    url: `${API_BASE_URL}/comments`,
    transformer: (data: any[]) => data.slice(0, 50).map((comment: any) => ({
      ...comment,
      rating: Math.floor(Math.random() * 5) + 1 // 添加评分
    }))
  },
  {
    key: 'albums',
    url: `${API_BASE_URL}/albums`,
    transformer: (data: any[]) => data.map((album: any, index: number) => ({
      ...album,
      photoCount: Math.floor(Math.random() * 50) + 1,
      createdAt: new Date(Date.now() - (data.length - index) * 24 * 60 * 60 * 1000)
    }))
  }
]

// 新闻数据生成器（模拟数据）
const generateMockNews = (category: string = 'general') => {
  // const categories = ['technology', 'business', 'health', 'science', 'sports', 'entertainment', 'general'] // 已在generateMockNews中使用
  const titles = {
    technology: [
      '人工智能在医疗领域的最新突破',
      '5G技术推动智慧城市发展',
      '量子计算机商业化进程加速',
      '区块链技术在供应链管理中的应用',
      '自动驾驶汽车安全性测试新进展'
    ],
    business: [
      '全球经济复苏迹象明显',
      '新兴市场投资机会分析',
      '数字化转型推动企业增长',
      '可持续发展成为投资新趋势',
      '跨国公司供应链重构策略'
    ],
    health: [
      '新型疫苗研发取得重要进展',
      '精准医疗个性化治疗方案',
      '心理健康关注度持续上升',
      '运动医学在康复治疗中的应用',
      '营养学研究揭示健康饮食秘诀'
    ],
    science: [
      '太空探索任务获得新发现',
      '气候变化研究最新成果',
      '海洋生物多样性保护进展',
      '新材料技术突破传统限制',
      '基因编辑技术伦理讨论'
    ],
    sports: [
      '奥运会筹备工作进展顺利',
      '职业体育联赛改革创新',
      '运动科学提升竞技表现',
      '体育产业数字化转型',
      '青少年体育教育新模式'
    ],
    entertainment: [
      '流媒体平台原创内容竞争',
      '虚拟现实娱乐体验升级',
      '音乐产业数字化变革',
      '电影制作技术创新应用',
      '游戏行业发展新趋势'
    ],
    general: [
      '城市化进程中的挑战与机遇',
      '教育改革促进人才培养',
      '环保政策推动绿色发展',
      '社会保障体系不断完善',
      '文化传承与创新并重'
    ]
  }

  const categoryTitles = titles[category as keyof typeof titles] || titles.general
  
  return {
    status: 'ok',
    totalResults: 100,
    articles: categoryTitles.map((title, index) => ({
      source: { id: `source-${index}`, name: `新闻源 ${index + 1}` },
      author: `记者 ${String.fromCharCode(65 + index)}`,
      title,
      description: `这是关于"${title}"的详细报道，包含了最新的信息和深度分析...`,
      url: `https://example.com/news/${category}/${index + 1}`,
      urlToImage: `https://picsum.photos/400/200?random=${Date.now() + index}`,
      publishedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      content: `${title}的完整内容。这里包含了详细的新闻报道内容，涵盖了事件的背景、发展过程、相关影响以及专家观点等多个方面...`
    }))
  }
}

// 数据预缓存管理器
class DataPrecacheService {
  private static instance: DataPrecacheService
  private isInitialized = false
  private initPromise: Promise<void> | null = null
  
  static getInstance(): DataPrecacheService {
    if (!DataPrecacheService.instance) {
      DataPrecacheService.instance = new DataPrecacheService()
    }
    return DataPrecacheService.instance
  }

  /**
   * 初始化预缓存服务
   */
  async init(): Promise<void> {
    if (this.isInitialized) {
      return
    }

    if (this.initPromise) {
      return this.initPromise
    }

    this.initPromise = this.performInit()
    return this.initPromise
  }

  private async performInit(): Promise<void> {
    try {
      console.log('🚀 开始数据预缓存初始化...')
      
      // 确保IndexedDB已初始化
      await indexedDBManager.init()
      
      // 检查是否需要预缓存（避免重复缓存）
      const shouldPrecache = await this.shouldPerformPrecache()
      
      if (shouldPrecache) {
        console.log('📦 开始预缓存所有模块数据...')
        
        // 并行预缓存所有模块数据
        const precachePromises = [
          this.precacheApiData(),
          this.precacheNewsData()
        ]
        
        await Promise.allSettled(precachePromises)
        
        // 记录预缓存完成时间
        await this.markPrecacheCompleted()
        
        console.log('✅ 所有模块数据预缓存完成')
      } else {
        console.log('⏭️ 数据已是最新，跳过预缓存')
      }
      
      this.isInitialized = true
      
    } catch (error) {
      console.error('❌ 数据预缓存初始化失败:', error)
      this.isInitialized = true // 即使失败也标记为已初始化，避免重复尝试
    }
  }

  /**
   * 检查是否需要执行预缓存
   */
  private async shouldPerformPrecache(): Promise<boolean> {
    try {
      const lastPrecacheTime = await indexedDBManager.get<{ timestamp: number }>(
        STORES.CACHE_DATA, 
        'last_precache_time'
      )
      
      if (!lastPrecacheTime) {
        return true // 首次运行，需要预缓存
      }
      
      // 检查是否超过24小时（可配置）
      const now = Date.now()
      const timeDiff = now - lastPrecacheTime.timestamp
      const maxAge = 24 * 60 * 60 * 1000 // 24小时
      
      return timeDiff > maxAge
      
    } catch (error) {
      console.warn('检查预缓存状态失败，执行预缓存:', error)
      return true
    }
  }

  /**
   * 预缓存API数据
   */
  private async precacheApiData(): Promise<void> {
    const results = await Promise.allSettled(
      CACHE_CONFIGS.map(config => this.cacheApiData(config))
    )
    
    // 统计结果
    const successful = results.filter(r => r.status === 'fulfilled').length
    const failed = results.filter(r => r.status === 'rejected').length
    
    console.log(`📊 API数据预缓存结果: 成功 ${successful}/${CACHE_CONFIGS.length}, 失败 ${failed}`)
    
    // 记录失败的缓存
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.warn(`❌ ${CACHE_CONFIGS[index].key} 预缓存失败:`, result.reason)
      }
    })
  }

  /**
   * 缓存单个API数据
   */
  private async cacheApiData(config: CacheConfig): Promise<void> {
    try {
      console.log(`📥 预缓存 ${config.key} 数据...`)
      
      // 检查网络状态
      if (!navigator.onLine) {
        console.warn(`⚠️ 离线状态，跳过 ${config.key} 预缓存`)
        return
      }
      
      // 发起网络请求
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10秒超时
      
      const response = await fetch(config.url, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      let data = await response.json()
      
      // 应用数据转换器
      if (config.transformer) {
        data = config.transformer(data)
      }
      
      // 存储到IndexedDB缓存
      const cacheData = {
        key: config.key,
        data: data,
        timestamp: Date.now(),
        source: 'precache',
        url: config.url
      }
      
      await indexedDBManager.add(STORES.CACHE_DATA, cacheData)
      
      console.log(`✅ ${config.key} 数据预缓存成功 (${Array.isArray(data) ? data.length : 1} 条记录)`)
      
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.warn(`⏱️ ${config.key} 预缓存超时`)
      } else {
        console.error(`❌ ${config.key} 预缓存失败:`, error.message)
      }
      throw error
    }
  }

  /**
   * 预缓存新闻数据
   */
  private async precacheNewsData(): Promise<void> {
    try {
      console.log('📰 预缓存新闻数据...')
      
      const categories = ['general', 'technology', 'business', 'health', 'science', 'sports', 'entertainment']
      
      const newsPromises = categories.map(async (category) => {
        const newsData = generateMockNews(category)
        
        const cacheData = {
          key: `news_${category}`,
          data: newsData,
          timestamp: Date.now(),
          source: 'precache',
          url: `mock://news/${category}`
        }
        
        await indexedDBManager.add(STORES.CACHE_DATA, cacheData)
        console.log(`✅ ${category} 新闻预缓存成功`)
      })
      
      await Promise.all(newsPromises)
      
      console.log('✅ 所有新闻分类预缓存完成')
      
    } catch (error) {
      console.error('❌ 新闻数据预缓存失败:', error)
      throw error
    }
  }

  /**
   * 标记预缓存完成
   */
  private async markPrecacheCompleted(): Promise<void> {
    try {
      const completionData = {
        key: 'last_precache_time',
        data: { timestamp: Date.now() },
        timestamp: Date.now(),
        source: 'system'
      }
      
      await indexedDBManager.update(STORES.CACHE_DATA, completionData)
      
    } catch (error) {
      console.warn('记录预缓存完成时间失败:', error)
    }
  }

  /**
   * 获取缓存数据
   */
  async getCachedData<T = any>(key: string): Promise<T | null> {
    try {
      const cached = await indexedDBManager.get<{
        key: string
        data: T
        timestamp: number
        source: string
      }>(STORES.CACHE_DATA, key)
      
      return cached ? cached.data : null
      
    } catch (error) {
      console.warn(`获取缓存数据失败 ${key}:`, error)
      return null
    }
  }

  /**
   * 强制刷新特定模块缓存
   */
  async refreshModuleCache(moduleKey: string): Promise<void> {
    const config = CACHE_CONFIGS.find(c => c.key === moduleKey)
    
    if (!config) {
      throw new Error(`未找到模块配置: ${moduleKey}`)
    }
    
    console.log(`🔄 强制刷新 ${moduleKey} 缓存...`)
    
    try {
      await this.cacheApiData(config)
      console.log(`✅ ${moduleKey} 缓存刷新成功`)
    } catch (error) {
      console.error(`❌ ${moduleKey} 缓存刷新失败:`, error)
      throw error
    }
  }

  /**
   * 获取预缓存统计信息
   */
  async getPrecacheStats(): Promise<{
    totalModules: number
    cachedModules: number
    lastUpdateTime: number | null
    cacheSize: number
  }> {
    try {
      const stats = await indexedDBManager.getStorageStats()
      const cacheStats = stats.find(s => s.storeName === STORES.CACHE_DATA)
      
      const lastPrecacheTime = await indexedDBManager.get<{ timestamp: number }>(
        STORES.CACHE_DATA, 
        'last_precache_time'
      )
      
      // 检查每个模块的缓存状态
      const cachedModules = await Promise.all(
        CACHE_CONFIGS.map(async (config) => {
          const cached = await this.getCachedData(config.key)
          return cached !== null
        })
      )
      
      return {
        totalModules: CACHE_CONFIGS.length + 7, // API模块 + 新闻分类
        cachedModules: cachedModules.filter(Boolean).length,
        lastUpdateTime: lastPrecacheTime?.timestamp || null,
        cacheSize: cacheStats?.totalSize || 0
      }
      
    } catch (error) {
      console.error('获取预缓存统计失败:', error)
      return {
        totalModules: CACHE_CONFIGS.length + 7,
        cachedModules: 0,
        lastUpdateTime: null,
        cacheSize: 0
      }
    }
  }

  /**
   * 清除所有预缓存数据
   */
  async clearAllCache(): Promise<void> {
    try {
      console.log('🧹 清除所有预缓存数据...')
      
      await indexedDBManager.clear(STORES.CACHE_DATA)
      
      console.log('✅ 预缓存数据清除完成')
      
    } catch (error) {
      console.error('❌ 清除预缓存数据失败:', error)
      throw error
    }
  }
}

// 导出单例实例
export const dataPrecacheService = DataPrecacheService.getInstance()

// 导出类型
export type { CacheConfig }
