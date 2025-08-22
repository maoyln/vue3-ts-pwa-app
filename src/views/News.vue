<template>
  <div class="news">
    <div class="news-header">
      <h1>
        <i class="news-icon">📰</i>
        新闻资讯
      </h1>
      <p>获取最新新闻动态</p>
    </div>

    <!-- 分类选择 -->
    <div class="category-section">
      <div class="category-tabs">
        <button
          v-for="category in categories"
          :key="category.key"
          @click="selectCategory(category.key)"
          :class="['category-tab', { active: selectedCategory === category.key }]"
        >
          {{ category.name }}
        </button>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading">
      <div class="loading-spinner"></div>
      <p>正在加载新闻...</p>
    </div>

    <!-- 错误信息 -->
    <div v-if="error" class="error">
      <div class="error-icon">⚠️</div>
      <p>{{ error }}</p>
      <button @click="retryNews" class="retry-btn">重试</button>
    </div>

    <!-- 新闻列表 -->
    <div v-if="newsList.length && !loading" class="news-content">
      <div class="news-grid">
        <article
          v-for="(news, index) in newsList"
          :key="index"
          class="news-card"
          @click="openNewsDetail(news)"
        >
          <div v-if="news.urlToImage" class="news-image">
            <img
              :src="news.urlToImage"
              :alt="news.title"
              @error="handleImageError"
              loading="lazy"
            />
          </div>
          <div class="news-content-area">
            <h3 class="news-title">{{ news.title }}</h3>
            <p v-if="news.description" class="news-description">
              {{ truncateText(news.description, 120) }}
            </p>
            <div class="news-meta">
              <span class="news-source">{{ news.source?.name || '未知来源' }}</span>
              <span class="news-time">{{ formatTime(news.publishedAt) }}</span>
            </div>
          </div>
        </article>
      </div>

      <!-- 加载更多按钮 -->
      <div v-if="hasMore" class="load-more-section">
        <button @click="loadMore" :disabled="loadingMore" class="load-more-btn">
          {{ loadingMore ? '加载中...' : '加载更多' }}
        </button>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-if="!newsList.length && !loading && !error" class="empty-state">
      <div class="empty-icon">📄</div>
      <p>暂无新闻数据</p>
    </div>

    <!-- 新闻详情模态框 -->
    <div v-if="selectedNews" class="modal-overlay" @click="closeNewsDetail">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>{{ selectedNews.title }}</h2>
          <button @click="closeNewsDetail" class="close-btn">×</button>
        </div>
        <div class="modal-body">
          <div v-if="selectedNews.urlToImage" class="modal-image">
            <img :src="selectedNews.urlToImage" :alt="selectedNews.title" />
          </div>
          <div class="modal-meta">
            <span class="modal-source">{{ selectedNews.source?.name }}</span>
            <span class="modal-time">{{ formatTime(selectedNews.publishedAt) }}</span>
          </div>
          <p v-if="selectedNews.description" class="modal-description">
            {{ selectedNews.description }}
          </p>
          <p v-if="selectedNews.content" class="modal-content-text">
            {{ selectedNews.content }}
          </p>
          <div class="modal-actions">
            <a
              v-if="selectedNews.url"
              :href="selectedNews.url"
              target="_blank"
              rel="noopener noreferrer"
              class="read-more-btn"
            >
              阅读原文 ↗
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'

// 新闻数据接口定义
interface NewsArticle {
  title: string
  description: string
  url: string
  urlToImage: string
  publishedAt: string
  source: {
    name: string
  }
  content: string
}

interface NewsResponse {
  articles: NewsArticle[]
  totalResults: number
}

// 响应式数据
const newsList = ref<NewsArticle[]>([])
const selectedNews = ref<NewsArticle | null>(null)
const loading = ref(false)
const loadingMore = ref(false)
const error = ref('')
const selectedCategory = ref('general')
const currentPage = ref(1)
const totalResults = ref(0)

// 新闻分类
const categories = [
  { key: 'general', name: '综合' },
  { key: 'technology', name: '科技' },
  { key: 'business', name: '商业' },
  { key: 'health', name: '健康' },
  { key: 'science', name: '科学' },
  { key: 'sports', name: '体育' },
  { key: 'entertainment', name: '娱乐' }
]

// 计算属性
const hasMore = computed(() => {
  return newsList.value.length < totalResults.value && newsList.value.length < 100 // 限制最多加载100条
})

// NewsAPI密钥 (这里使用免费的公共API，但有请求限制)
// const API_KEY = 'your_newsapi_key_here' // 请替换为您的NewsAPI密钥

// 获取新闻数据
const getNews = async (category: string, page: number = 1, append: boolean = false) => {
  if (page === 1) {
    loading.value = true
  } else {
    loadingMore.value = true
  }
  error.value = ''

  try {
    // 由于NewsAPI在生产环境有CORS限制，这里使用一个模拟的新闻数据
    // 在实际项目中，您需要通过后端代理或使用其他新闻API
    const mockNews = generateMockNews(category, page)
    
    if (append) {
      newsList.value = [...newsList.value, ...mockNews.articles]
    } else {
      newsList.value = mockNews.articles
    }
    
    totalResults.value = mockNews.totalResults
    currentPage.value = page

    // 保存到localStorage以便离线使用
    const cacheKey = `news_${category}_${page}`
    localStorage.setItem(cacheKey, JSON.stringify(mockNews))
    localStorage.setItem(`${cacheKey}_timestamp`, Date.now().toString())
    
  } catch (err: any) {
    console.warn('新闻获取失败，尝试缓存:', err)
    error.value = err.message || '获取新闻失败'
    
    // 尝试从缓存获取数据
    await loadFromCache(category, page, append)
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

// 从缓存加载数据
const loadFromCache = async (category: string, page: number, append: boolean) => {
  const cacheKey = `news_${category}_${page}`
  const cachedData = localStorage.getItem(cacheKey)
  const cachedTimestamp = localStorage.getItem(`${cacheKey}_timestamp`)
  
  if (cachedData) {
    const mockNews = JSON.parse(cachedData)
    if (append) {
      newsList.value = [...newsList.value, ...mockNews.articles]
    } else {
      newsList.value = mockNews.articles
    }
    totalResults.value = mockNews.totalResults
    
    // 检查缓存时间
    const cacheAge = cachedTimestamp ? Date.now() - parseInt(cachedTimestamp) : 0
    const cacheHours = Math.floor(cacheAge / (1000 * 60 * 60))
    
    if (cacheHours > 0) {
      error.value = `网络连接失败，显示 ${cacheHours} 小时前的缓存数据`
    } else {
      error.value = '网络连接失败，显示缓存数据'
    }
    
    console.log('✅ 使用缓存新闻数据:', category, page)
  } else {
    error.value = '网络连接失败且无缓存数据'
    console.warn('❌ 无缓存数据可用:', category, page)
  }
}

// 生成模拟新闻数据
const generateMockNews = (category: string, page: number): NewsResponse => {
  const newsTemplates = {
    technology: [
      { title: '人工智能技术取得重大突破', desc: 'AI技术在多个领域实现突破性进展...' },
      { title: '新型芯片技术发布', desc: '最新芯片技术将改变计算机性能...' },
      { title: '5G网络覆盖率持续提升', desc: '全国5G网络建设进展顺利...' }
    ],
    business: [
      { title: '经济复苏势头良好', desc: '最新经济数据显示复苏态势...' },
      { title: '新能源汽车销量创新高', desc: '电动汽车市场持续火热...' },
      { title: '数字经济发展迅速', desc: '数字化转型推动经济增长...' }
    ],
    general: [
      { title: '重要政策发布', desc: '政府发布重要政策文件...' },
      { title: '社会发展新动态', desc: '社会各界关注的热点话题...' },
      { title: '民生改善措施出台', desc: '多项民生政策惠及百姓...' }
    ]
  }

  const templates = newsTemplates[category as keyof typeof newsTemplates] || newsTemplates.general
  const articles: NewsArticle[] = []

  for (let i = 0; i < 10; i++) {
    const template = templates[i % templates.length]
    const articleIndex = (page - 1) * 10 + i + 1
    
    articles.push({
      title: `${template.title} ${articleIndex}`,
      description: `${template.desc}这是第${articleIndex}条新闻的详细描述内容，包含了相关的背景信息和重要细节。`,
      url: `https://example.com/news/${articleIndex}`,
      urlToImage: `https://picsum.photos/400/250?random=${articleIndex}`,
      publishedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      source: { name: `新闻源 ${(articleIndex % 5) + 1}` },
      content: `这是第${articleIndex}条新闻的完整内容。${template.desc}详细内容包括背景介绍、事件经过、相关影响等多个方面的信息。这些信息对于了解事件的全貌具有重要意义。`
    })
  }

  return {
    articles,
    totalResults: 50 // 模拟总数
  }
}

// 选择分类
const selectCategory = (category: string) => {
  if (selectedCategory.value !== category) {
    selectedCategory.value = category
    currentPage.value = 1
    getNews(category, 1, false)
  }
}

// 加载更多
const loadMore = () => {
  if (!loadingMore.value && hasMore.value) {
    getNews(selectedCategory.value, currentPage.value + 1, true)
  }
}

// 重试
const retryNews = () => {
  getNews(selectedCategory.value, 1, false)
}

// 打开新闻详情
const openNewsDetail = (news: NewsArticle) => {
  selectedNews.value = news
  document.body.style.overflow = 'hidden'
}

// 关闭新闻详情
const closeNewsDetail = () => {
  selectedNews.value = null
  document.body.style.overflow = 'auto'
}

// 处理图片加载错误
const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjI1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzlmYTZiNyIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPuaXoOazleaYvuekuuWbvueJhzwvdGV4dD48L3N2Zz4='
}

// 截断文本
const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

// 格式化时间
const formatTime = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))
  
  if (hours < 1) {
    return '刚刚'
  } else if (hours < 24) {
    return `${hours}小时前`
  } else {
    return date.toLocaleDateString('zh-CN')
  }
}

// 组件挂载时加载新闻
onMounted(() => {
  // 检查网络状态
  if (!navigator.onLine) {
    console.log('🔌 检测到离线状态，尝试加载缓存数据')
    loadFromCache(selectedCategory.value, 1, false)
  } else {
    getNews(selectedCategory.value)
  }
  
  // 监听网络状态变化
  const handleOnline = () => {
    console.log('🌐 网络已连接，刷新数据')
    getNews(selectedCategory.value)
  }
  
  const handleOffline = () => {
    console.log('🔌 网络已断开')
    // 可以显示离线提示
  }
  
  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)
  
  // 组件卸载时清理事件监听
  onUnmounted(() => {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
  })
})
</script>

<style scoped>
.news {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.news-header {
  text-align: center;
  margin-bottom: 32px;
}

.news-header h1 {
  font-size: 2.5rem;
  color: #1f2937;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.news-icon {
  font-size: 3rem;
}

.news-header p {
  color: #6b7280;
  font-size: 1.1rem;
}

.category-section {
  margin-bottom: 32px;
}

.category-tabs {
  display: flex;
  gap: 8px;
  justify-content: center;
  flex-wrap: wrap;
}

.category-tab {
  padding: 8px 16px;
  border: 2px solid #e5e7eb;
  background: white;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;
}

.category-tab:hover {
  border-color: #3b82f6;
}

.category-tab.active {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.loading, .error {
  text-align: center;
  padding: 40px;
  color: #6b7280;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e5e7eb;
  border-left-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

.error {
  color: #dc2626;
}

.error-icon {
  font-size: 3rem;
  margin-bottom: 16px;
}

.retry-btn {
  margin-top: 16px;
  padding: 8px 16px;
  background: #dc2626;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.news-content {
  animation: fadeIn 0.5s ease-in;
}

.news-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
}

.news-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;
}

.news-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.news-image {
  height: 200px;
  overflow: hidden;
}

.news-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.news-content-area {
  padding: 20px;
}

.news-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 12px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.news-description {
  color: #6b7280;
  line-height: 1.5;
  margin-bottom: 16px;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.news-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.875rem;
  color: #9ca3af;
}

.load-more-section {
  text-align: center;
}

.load-more-btn {
  padding: 12px 32px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.load-more-btn:hover:not(:disabled) {
  background: #2563eb;
}

.load-more-btn:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #6b7280;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 16px;
}

/* 模态框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 12px;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  animation: modalSlideIn 0.3s ease-out;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 24px 24px 0;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 24px;
}

.modal-header h2 {
  flex: 1;
  font-size: 1.5rem;
  color: #1f2937;
  margin: 0 16px 0 0;
  line-height: 1.4;
}

.close-btn {
  background: none;
  border: none;
  font-size: 2rem;
  color: #6b7280;
  cursor: pointer;
  padding: 0;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.3s ease;
}

.close-btn:hover {
  background: #f3f4f6;
}

.modal-body {
  padding: 0 24px 24px;
}

.modal-image {
  margin-bottom: 20px;
  border-radius: 8px;
  overflow: hidden;
}

.modal-image img {
  width: 100%;
  height: auto;
}

.modal-meta {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
  font-size: 0.875rem;
  color: #6b7280;
}

.modal-description {
  font-size: 1.1rem;
  color: #374151;
  line-height: 1.6;
  margin-bottom: 20px;
}

.modal-content-text {
  color: #4b5563;
  line-height: 1.6;
  margin-bottom: 24px;
}

.modal-actions {
  text-align: center;
}

.read-more-btn {
  display: inline-block;
  padding: 12px 24px;
  background: #3b82f6;
  color: white;
  text-decoration: none;
  border-radius: 8px;
  font-weight: 500;
  transition: background-color 0.3s ease;
}

.read-more-btn:hover {
  background: #2563eb;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .news-header h1 {
    font-size: 2rem;
  }
  
  .news-icon {
    font-size: 2.5rem;
  }
  
  .news-grid {
    grid-template-columns: 1fr;
  }
  
  .category-tabs {
    justify-content: flex-start;
    overflow-x: auto;
    padding-bottom: 8px;
  }
  
  .modal-overlay {
    padding: 10px;
  }
  
  .modal-content {
    max-height: 95vh;
  }
  
  .modal-header {
    padding: 16px 16px 0;
  }
  
  .modal-body {
    padding: 0 16px 16px;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
