<template>
  <div class="posts-table">
    <div class="table-header">
      <h1>
        <i class="table-icon">📝</i>
        文章管理
      </h1>
      <p>基于JSONPlaceholder API的文章CRUD示例</p>
    </div>

    <!-- 操作工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <button @click="showAddModal = true" class="btn btn-primary">
          <span class="btn-icon">➕</span>
          添加文章
        </button>
        <button @click="refreshData" :disabled="loading" class="btn btn-secondary">
          <span class="btn-icon">🔄</span>
          {{ loading ? '刷新中...' : '刷新数据' }}
        </button>
        <button @click="toggleCacheInfo" class="btn btn-info">
          <span class="btn-icon">📊</span>
          缓存信息
        </button>
      </div>
      
      <div class="toolbar-right">
        <div class="search-box">
          <input
            v-model="searchQuery"
            placeholder="搜索文章标题或内容..."
            class="search-input"
            @input="handleSearch"
          />
          <span class="search-icon">🔍</span>
        </div>
        
        <div class="filter-box">
          <select v-model="selectedUserId" @change="handleFilter" class="filter-select">
            <option value="">所有作者</option>
            <option v-for="user in users" :key="user.id" :value="user.id">
              {{ user.name }}
            </option>
          </select>
        </div>
      </div>
    </div>

    <!-- 缓存信息面板 -->
    <div v-if="showCacheInfo" class="cache-info-panel">
      <div class="cache-info-header">
        <h3>📊 数据缓存信息</h3>
        <button @click="showCacheInfo = false" class="close-btn">×</button>
      </div>
      <div class="cache-info-content">
        <div class="cache-stat">
          <span class="label">缓存状态:</span>
          <span class="value" :class="cacheStatus">{{ getCacheStatusText() }}</span>
        </div>
        <div class="cache-stat">
          <span class="label">数据来源:</span>
          <span class="value">{{ dataSource }}</span>
        </div>
        <div class="cache-stat">
          <span class="label">最后更新:</span>
          <span class="value">{{ lastUpdateTime || '未知' }}</span>
        </div>
        <div class="cache-actions">
          <button @click="clearTableCache" class="btn btn-warning btn-sm">
            清除缓存
          </button>
          <button @click="forceRefresh" class="btn btn-primary btn-sm">
            强制刷新
          </button>
        </div>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>正在加载数据...</p>
    </div>

    <!-- 错误信息 -->
    <div v-if="error" class="error-container">
      <div class="error-icon">⚠️</div>
      <p>{{ error }}</p>
      <button @click="refreshData" class="retry-btn">重试</button>
    </div>

    <!-- 数据表格 -->
    <div v-if="!loading && !error" class="table-container">
      <div class="table-info">
        <span>共 {{ filteredPosts.length }} 篇文章</span>
        <span v-if="searchQuery || selectedUserId">（筛选结果）</span>
      </div>
      
      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th @click="sortBy('id')" class="sortable">
                ID
                <span class="sort-indicator" :class="getSortClass('id')">↕️</span>
              </th>
              <th @click="sortBy('title')" class="sortable">
                标题
                <span class="sort-indicator" :class="getSortClass('title')">↕️</span>
              </th>
              <th>内容预览</th>
              <th @click="sortBy('userId')" class="sortable">
                作者
                <span class="sort-indicator" :class="getSortClass('userId')">↕️</span>
              </th>
              <th>状态</th>
              <th>创建时间</th>
              <th class="actions-column">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="post in paginatedPosts"
              :key="post.id"
              class="table-row"
              :class="{ 
                'row-highlight': post.id === highlightPostId,
                'row-offline': post._isOffline && !post._isDeleted,
                'row-deleted': post._isDeleted
              }"
            >
              <td class="id-cell">{{ post.id }}</td>
              <td class="title-cell">
                <div class="post-title">
                  <span class="title-text" :title="post.title">
                    {{ truncateText(post.title, 40) }}
                  </span>
                  <span v-if="post.title.length > 40" class="title-badge">...</span>
                  <span v-if="post._isOffline && !post._isDeleted" class="offline-badge" title="离线操作，待同步">📝</span>
                  <span v-if="post._isDeleted" class="deleted-badge" title="已标记删除，待同步">🗑️</span>
                </div>
              </td>
              <td class="content-cell">
                <div class="content-preview" :title="post.body">
                  {{ truncateText(post.body, 60) }}
                </div>
              </td>
              <td class="author-cell">
                <div class="author-info">
                  <div class="author-avatar">{{ getAuthorInitials(post.userId) }}</div>
                  <span class="author-name">{{ getAuthorName(post.userId) }}</span>
                </div>
              </td>
              <td class="status-cell">
                <span class="status-badge" :class="getStatusClass(post.id)">
                  {{ getStatusText(post.id) }}
                </span>
              </td>
              <td class="time-cell">
                {{ formatDate(post.createdAt || new Date()) }}
              </td>
              <td class="actions-cell">
                <div class="action-buttons">
                  <button
                    @click="viewPost(post)"
                    class="action-btn view-btn"
                    title="查看详情"
                  >
                    👁️
                  </button>
                  <button
                    @click="editPost(post)"
                    class="action-btn edit-btn"
                    title="编辑"
                  >
                    ✏️
                  </button>
                  <button
                    @click="deletePost(post)"
                    class="action-btn delete-btn"
                    title="删除"
                  >
                    🗑️
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 分页 -->
      <div v-if="totalPages > 1" class="pagination">
        <button
          @click="currentPage = 1"
          :disabled="currentPage === 1"
          class="page-btn"
        >
          首页
        </button>
        <button
          @click="currentPage--"
          :disabled="currentPage === 1"
          class="page-btn"
        >
          上一页
        </button>
        
        <span class="page-info">
          第 {{ currentPage }} 页，共 {{ totalPages }} 页
        </span>
        
        <button
          @click="currentPage++"
          :disabled="currentPage === totalPages"
          class="page-btn"
        >
          下一页
        </button>
        <button
          @click="currentPage = totalPages"
          :disabled="currentPage === totalPages"
          class="page-btn"
        >
          末页
        </button>
        
        <select v-model="pageSize" @change="currentPage = 1" class="page-size-select">
          <option value="10">10条/页</option>
          <option value="20">20条/页</option>
          <option value="50">50条/页</option>
        </select>
      </div>
    </div>

    <!-- 添加/编辑文章模态框 -->
    <div v-if="showAddModal || showEditModal" class="modal-overlay" @click="closeModals">
      <div class="modal-content post-modal" @click.stop>
        <div class="modal-header">
          <h3>{{ showAddModal ? '添加文章' : '编辑文章' }}</h3>
          <button @click="closeModals" class="modal-close-btn">×</button>
        </div>
        
        <form @submit.prevent="savePost" class="post-form">
          <div class="form-group">
            <label for="author">作者 *</label>
            <select
              id="author"
              v-model="formData.userId"
              required
              class="form-select"
            >
              <option value="">请选择作者</option>
              <option v-for="user in users" :key="user.id" :value="user.id">
                {{ user.name }}
              </option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="title">标题 *</label>
            <input
              id="title"
              v-model="formData.title"
              type="text"
              required
              class="form-input"
              placeholder="请输入文章标题"
              maxlength="100"
            />
            <div class="char-count">{{ formData.title.length }}/100</div>
          </div>
          
          <div class="form-group">
            <label for="body">内容 *</label>
            <textarea
              id="body"
              v-model="formData.body"
              required
              class="form-textarea"
              placeholder="请输入文章内容"
              rows="8"
              maxlength="1000"
            ></textarea>
            <div class="char-count">{{ formData.body.length }}/1000</div>
          </div>
          
          <div class="form-actions">
            <button type="button" @click="closeModals" class="btn btn-secondary">
              取消
            </button>
            <button type="submit" :disabled="saving" class="btn btn-primary">
              {{ saving ? '保存中...' : '保存' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- 查看文章详情模态框 -->
    <div v-if="showViewModal" class="modal-overlay" @click="showViewModal = false">
      <div class="modal-content view-modal post-view-modal" @click.stop>
        <div class="modal-header">
          <h3>文章详情</h3>
          <button @click="showViewModal = false" class="modal-close-btn">×</button>
        </div>
        
        <div v-if="selectedPost" class="post-details">
          <div class="post-header">
            <h2 class="post-title">{{ selectedPost.title }}</h2>
            <div class="post-meta">
              <div class="meta-item">
                <span class="meta-label">作者:</span>
                <span class="meta-value">{{ getAuthorName(selectedPost.userId) }}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">ID:</span>
                <span class="meta-value">#{{ selectedPost.id }}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">状态:</span>
                <span class="status-badge" :class="getStatusClass(selectedPost.id)">
                  {{ getStatusText(selectedPost.id) }}
                </span>
              </div>
              <div class="meta-item">
                <span class="meta-label">创建时间:</span>
                <span class="meta-value">{{ formatDate(selectedPost.createdAt || new Date()) }}</span>
              </div>
            </div>
          </div>
          
          <div class="post-content">
            <h4>文章内容</h4>
            <div class="content-text">{{ selectedPost.body }}</div>
          </div>
          
          <div class="post-stats">
            <h4>文章统计</h4>
            <div class="stats-grid">
              <div class="stat-item">
                <span class="stat-label">字符数:</span>
                <span class="stat-value">{{ selectedPost.body.length }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">单词数:</span>
                <span class="stat-value">{{ countWords(selectedPost.body) }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">段落数:</span>
                <span class="stat-value">{{ countParagraphs(selectedPost.body) }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">预计阅读:</span>
                <span class="stat-value">{{ estimateReadTime(selectedPost.body) }}分钟</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { addOfflineOperation } from '../utils/offlineSync'
import { refreshApiCache } from '../registerServiceWorker'
import { dataPrecacheService } from '../utils/dataPrecacheService'

// 文章数据接口定义
interface Post {
  id: number
  title: string
  body: string
  userId: number
  createdAt?: Date
  // 离线操作标识
  _isOffline?: boolean
  _isDeleted?: boolean
}

// 用户数据接口定义
interface User {
  id: number
  name: string
  username: string
  email: string
}

// 响应式数据
const posts = ref<Post[]>([])
const users = ref<User[]>([])
const loading = ref(false)
const saving = ref(false)
const error = ref('')
const searchQuery = ref('')
const selectedUserId = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const sortField = ref('id')
const sortOrder = ref<'asc' | 'desc'>('desc')
const highlightPostId = ref<number | null>(null)

// 模态框状态
const showAddModal = ref(false)
const showEditModal = ref(false)
const showViewModal = ref(false)
const selectedPost = ref<Post | null>(null)

// 缓存信息
const showCacheInfo = ref(false)
const cacheStatus = ref<'fresh' | 'stale' | 'miss'>('miss')
const dataSource = ref('网络')
const lastUpdateTime = ref('')

// 表单数据
const formData = ref({
  id: 0,
  title: '',
  body: '',
  userId: 0
})

// API基础URL
const API_BASE_URL = 'https://jsonplaceholder.typicode.com'

// 计算属性
const filteredPosts = computed(() => {
  let filtered = posts.value
  
  // 按作者筛选
  if (selectedUserId.value) {
    filtered = filtered.filter(post => post.userId === parseInt(selectedUserId.value))
  }
  
  // 按搜索词筛选
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(post => 
      post.title.toLowerCase().includes(query) ||
      post.body.toLowerCase().includes(query)
    )
  }
  
  return filtered
})

const sortedPosts = computed(() => {
  const sorted = [...filteredPosts.value].sort((a, b) => {
    const aValue = a[sortField.value as keyof Post] as string | number
    const bValue = b[sortField.value as keyof Post] as string | number
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortOrder.value === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue)
    } else {
      return sortOrder.value === 'asc'
        ? (aValue as number) - (bValue as number)
        : (bValue as number) - (aValue as number)
    }
  })
  
  return sorted
})

const paginatedPosts = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return sortedPosts.value.slice(start, end)
})

const totalPages = computed(() => {
  return Math.ceil(filteredPosts.value.length / pageSize.value)
})

// API调用函数
const fetchPosts = async (forceRefresh = false) => {
  loading.value = true
  error.value = ''
  
  try {
    let data: any[] | null = null
    
    // 如果不是强制刷新，先尝试从预缓存获取数据
    if (!forceRefresh) {
      data = await dataPrecacheService.getCachedData<any[]>('posts')
      if (data) {
        posts.value = data.map((post: Post, index: number) => ({
          ...post,
          createdAt: post.createdAt || new Date(Date.now() - (data!.length - index) * 24 * 60 * 60 * 1000)
        }))
        cacheStatus.value = 'fresh'
        dataSource.value = '预缓存'
        lastUpdateTime.value = new Date().toLocaleString('zh-CN')
        console.log('✅ 从预缓存加载文章数据:', data.length, '篇文章')
        loading.value = false
        return
      }
    }
    
    // 如果预缓存没有数据或强制刷新，从网络获取
    const url = `${API_BASE_URL}/posts`
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    data = await response.json()
    // 添加创建时间（模拟）
    posts.value = data!.map((post: Post, index: number) => ({
      ...post,
      createdAt: new Date(Date.now() - (data!.length - index) * 24 * 60 * 60 * 1000)
    }))
    
    // 检查缓存状态
    const cacheStatusHeader = response.headers.get('sw-cache-status')
    if (cacheStatusHeader) {
      cacheStatus.value = cacheStatusHeader as 'fresh' | 'stale' | 'miss'
      dataSource.value = cacheStatusHeader === 'miss' ? '网络' : '缓存'
    } else {
      cacheStatus.value = 'fresh'
      dataSource.value = '网络'
    }
    
    lastUpdateTime.value = new Date().toLocaleString('zh-CN')
    
    console.log('✅ 文章数据加载成功:', data!.length, '篇文章')
    
  } catch (err: any) {
    console.error('❌ 获取文章数据失败:', err)
    
    // 网络失败时，尝试从预缓存获取数据
    const cachedData = await dataPrecacheService.getCachedData<any[]>('posts')
    if (cachedData) {
      posts.value = cachedData.map((post: Post, index: number) => ({
        ...post,
        createdAt: post.createdAt || new Date(Date.now() - (cachedData.length - index) * 24 * 60 * 60 * 1000)
      }))
      cacheStatus.value = 'stale'
      dataSource.value = '离线缓存'
      lastUpdateTime.value = new Date().toLocaleString('zh-CN')
      error.value = '网络连接失败，显示缓存数据'
      console.log('📦 从预缓存加载文章数据（网络失败）:', cachedData.length, '篇文章')
    } else {
      // 检查是否是网络错误
      if (!navigator.onLine) {
        error.value = '网络连接断开，请检查网络后重试'
      } else if (err.message.includes('503')) {
        error.value = '服务暂时不可用，已显示缓存数据'
      } else {
        error.value = err.message || '获取文章数据失败'
      }
    }
  } finally {
    loading.value = false
  }
}

const fetchUsers = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/users`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data = await response.json()
    users.value = data
    console.log('✅ 用户数据加载成功:', data.length, '个用户')
  } catch (err: any) {
    console.error('❌ 获取用户数据失败:', err)
  }
}

const createPost = async (postData: Partial<Post>) => {
  const response = await fetch(`${API_BASE_URL}/posts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(postData)
  })
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }
  
  return response.json()
}

const updatePost = async (id: number, postData: Partial<Post>) => {
  const response = await fetch(`${API_BASE_URL}/posts/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(postData)
  })
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }
  
  return response.json()
}

const deletePostApi = async (id: number) => {
  const response = await fetch(`${API_BASE_URL}/posts/${id}`, {
    method: 'DELETE'
  })
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }
  
  return response.ok
}

// 事件处理函数
const refreshData = () => {
  Promise.all([fetchPosts(true), fetchUsers()])
}

const forceRefresh = async () => {
  try {
    await refreshApiCache(`${API_BASE_URL}/posts`)
    setTimeout(() => refreshData(), 500)
  } catch (error) {
    console.error('强制刷新失败:', error)
  }
}

const clearTableCache = async () => {
  try {
    await refreshApiCache(`${API_BASE_URL}/posts`)
    alert('缓存已清除')
  } catch (error) {
    console.error('清除缓存失败:', error)
  }
}

const handleSearch = () => {
  currentPage.value = 1
}

const handleFilter = () => {
  currentPage.value = 1
}

const sortBy = (field: string) => {
  if (sortField.value === field) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortField.value = field
    sortOrder.value = 'asc'
  }
}

const getSortClass = (field: string) => {
  if (sortField.value !== field) return ''
  return sortOrder.value === 'asc' ? 'sort-asc' : 'sort-desc'
}

const viewPost = (post: Post) => {
  selectedPost.value = post
  showViewModal.value = true
}

const editPost = (post: Post) => {
  formData.value = {
    id: post.id,
    title: post.title,
    body: post.body,
    userId: post.userId
  }
  showEditModal.value = true
}

const deletePost = async (post: Post) => {
  if (!confirm(`确定要删除文章 "${truncateText(post.title, 30)}" 吗？`)) {
    return
  }
  
  try {
    if (!navigator.onLine) throw new Error('网络不可用')
    
    await deletePostApi(post.id)
    
    // 从本地数组中移除
    posts.value = posts.value.filter(p => p.id !== post.id)
    
    // 高亮效果
    highlightPostId.value = post.id
    setTimeout(() => {
      highlightPostId.value = null
    }, 1000)
    
    alert('文章删除成功！')
    console.log('✅ 文章删除成功:', post.title)
    
  } catch (err: any) {
    if (err.message.includes('网络不可用') || err.message.includes('fetch') || err.message.includes('network')) {
      console.log('📝 网络不可用，添加删除操作到离线同步队列')
      
      const index = posts.value.findIndex(p => p.id === post.id)
      if (index !== -1) {
        posts.value[index] = {
          ...posts.value[index],
          _isDeleted: true,
          _isOffline: true
        } as Post & { _isDeleted?: boolean, _isOffline?: boolean }
      }
      
      // 高亮效果
      highlightPostId.value = post.id
      setTimeout(() => {
        highlightPostId.value = null
      }, 1000)
      
      await addOfflineOperation('DELETE', 'posts', { title: post.title }, post.id)
      alert('网络不可用，删除操作已保存到同步队列，网络恢复后将自动同步')
    } else {
      error.value = err.message || '删除文章失败'
      alert('删除失败: ' + error.value)
      console.error('❌ 删除文章失败:', err)
    }
  }
}

const savePost = async () => {
  saving.value = true
  
  try {
    const postData = {
      title: formData.value.title,
      body: formData.value.body,
      userId: formData.value.userId
    }
    
    if (showAddModal.value) {
      // 添加文章
      try {
        if (!navigator.onLine) throw new Error('网络不可用')
        
        const newPost = await createPost(postData)
        
        // 添加到本地数组
        const maxId = Math.max(...posts.value.map(p => p.id), 0)
        const postToAdd = {
          ...postData,
          id: maxId + 1,
          createdAt: new Date()
        } as Post
        
        posts.value.unshift(postToAdd)
        
        // 高亮新添加的文章
        highlightPostId.value = postToAdd.id
        setTimeout(() => {
          highlightPostId.value = null
        }, 2000)
        
        alert('文章添加成功！')
        console.log('✅ 文章添加成功:', newPost)
        
      } catch (err: any) {
        if (err.message.includes('网络不可用') || err.message.includes('fetch') || err.message.includes('network')) {
          console.log('📝 网络不可用，添加到离线同步队列')
          
          // 生成临时ID
          const maxId = Math.max(...posts.value.map(p => p.id), 0)
          const tempPost = {
            ...postData,
            id: maxId + 1,
            createdAt: new Date(),
            _isOffline: true
          } as Post & { _isOffline?: boolean }
          
          posts.value.unshift(tempPost)
          
          // 高亮新添加的文章
          highlightPostId.value = tempPost.id
          setTimeout(() => {
            highlightPostId.value = null
          }, 2000)
          
          await addOfflineOperation('CREATE', 'posts', postData)
          alert('网络不可用，文章已添加到同步队列，网络恢复后将自动同步')
        } else {
          throw err
        }
      }
      
    } else {
      // 更新文章
      try {
        if (!navigator.onLine) throw new Error('网络不可用')
        
        await updatePost(formData.value.id, postData)
        
        // 更新本地数组
        const index = posts.value.findIndex(p => p.id === formData.value.id)
        if (index !== -1) {
          posts.value[index] = {
            ...posts.value[index],
            ...postData
          }
        }
        
        // 高亮更新的文章
        highlightPostId.value = formData.value.id
        setTimeout(() => {
          highlightPostId.value = null
        }, 2000)
        
        alert('文章更新成功！')
        console.log('✅ 文章更新成功:', formData.value.title)
        
      } catch (err: any) {
        if (err.message.includes('网络不可用') || err.message.includes('fetch') || err.message.includes('network')) {
          console.log('📝 网络不可用，添加到离线同步队列')
          
          const index = posts.value.findIndex(p => p.id === formData.value.id)
          if (index !== -1) {
            posts.value[index] = {
              ...posts.value[index],
              ...postData,
              _isOffline: true
            } as Post & { _isOffline?: boolean }
          }
          
          // 高亮更新的文章
          highlightPostId.value = formData.value.id
          setTimeout(() => {
            highlightPostId.value = null
          }, 2000)
          
          await addOfflineOperation('UPDATE', 'posts', postData, formData.value.id)
          alert('网络不可用，文章修改已保存到同步队列，网络恢复后将自动同步')
        } else {
          throw err
        }
      }
    }
    
    closeModals()
    
  } catch (err: any) {
    error.value = err.message || '保存文章失败'
    alert('保存失败: ' + error.value)
    console.error('❌ 保存文章失败:', err)
  } finally {
    saving.value = false
  }
}

const closeModals = () => {
  showAddModal.value = false
  showEditModal.value = false
  showViewModal.value = false
  selectedPost.value = null
  
  // 重置表单
  formData.value = {
    id: 0,
    title: '',
    body: '',
    userId: 0
  }
}

const toggleCacheInfo = () => {
  showCacheInfo.value = !showCacheInfo.value
}

// 工具函数
const getCacheStatusText = () => {
  const statusMap = {
    fresh: '新鲜',
    stale: '过期',
    miss: '未缓存'
  }
  return statusMap[cacheStatus.value] || '未知'
}

const truncateText = (text: string, maxLength: number) => {
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
}

const getAuthorName = (userId: number) => {
  const user = users.value.find(u => u.id === userId)
  return user ? user.name : `用户 ${userId}`
}

const getAuthorInitials = (userId: number) => {
  const user = users.value.find(u => u.id === userId)
  if (user) {
    return user.name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2)
  }
  return `U${userId}`
}

const getStatusClass = (postId: number) => {
  // 根据ID模拟不同状态
  const status = postId % 4
  switch (status) {
    case 0: return 'status-published'
    case 1: return 'status-draft'
    case 2: return 'status-review'
    default: return 'status-archived'
  }
}

const getStatusText = (postId: number) => {
  const status = postId % 4
  switch (status) {
    case 0: return '已发布'
    case 1: return '草稿'
    case 2: return '待审核'
    default: return '已归档'
  }
}

const formatDate = (date: Date) => {
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

const countWords = (text: string) => {
  return text.trim().split(/\s+/).length
}

const countParagraphs = (text: string) => {
  return text.split(/\n\s*\n/).filter(p => p.trim()).length
}

const estimateReadTime = (text: string) => {
  const wordsPerMinute = 200
  const wordCount = countWords(text)
  return Math.ceil(wordCount / wordsPerMinute) || 1
}

// 监听Service Worker消息
const handleServiceWorkerMessage = (event: MessageEvent) => {
  if (event.data.type === 'API_DATA_UPDATED') {
    const { url } = event.data.payload
    if (url && url.includes('/posts')) {
      console.log('🔄 文章数据已在后台更新')
    }
  }
}

// 组件挂载
onMounted(() => {
  Promise.all([fetchPosts(), fetchUsers()])
  
  // 监听Service Worker消息
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage)
  }
})

// 组件卸载
onUnmounted(() => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage)
  }
})
</script>

<style scoped>
.posts-table {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.table-header {
  text-align: center;
  margin-bottom: 32px;
}

.table-header h1 {
  font-size: 2.5rem;
  color: #1f2937;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.table-icon {
  font-size: 3rem;
}

.table-header p {
  color: #6b7280;
  font-size: 1.1rem;
}

/* 工具栏样式 */
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  gap: 16px;
  flex-wrap: wrap;
}

.toolbar-left {
  display: flex;
  gap: 12px;
  align-items: center;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: #059669;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #047857;
}

.btn-secondary {
  background: #6b7280;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #4b5563;
}

.btn-info {
  background: #0891b2;
  color: white;
}

.btn-info:hover:not(:disabled) {
  background: #0e7490;
}

.btn-warning {
  background: #f59e0b;
  color: white;
}

.btn-warning:hover:not(:disabled) {
  background: #d97706;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 12px;
}

.btn-icon {
  font-size: 16px;
}

.search-box, .filter-box {
  position: relative;
  display: flex;
  align-items: center;
}

.search-input, .filter-select {
  padding: 10px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.2s ease;
}

.search-input {
  width: 250px;
  padding-right: 40px;
}

.filter-select {
  width: 150px;
}

.search-input:focus, .filter-select:focus {
  outline: none;
  border-color: #059669;
}

.search-icon {
  position: absolute;
  right: 12px;
  color: #6b7280;
  pointer-events: none;
}

/* 缓存信息面板 */
.cache-info-panel {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 12px;
  margin-bottom: 24px;
  overflow: hidden;
}

.cache-info-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: #dcfce7;
  border-bottom: 1px solid #bbf7d0;
}

.cache-info-header h3 {
  margin: 0;
  font-size: 16px;
  color: #166534;
}

.close-btn {
  background: none;
  border: none;
  font-size: 20px;
  color: #6b7280;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: #374151;
}

.cache-info-content {
  padding: 20px;
}

.cache-stat {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-size: 14px;
}

.cache-stat .label {
  color: #6b7280;
  font-weight: 500;
}

.cache-stat .value {
  color: #374151;
  font-weight: 600;
}

.cache-stat .value.fresh {
  color: #059669;
}

.cache-stat .value.stale {
  color: #f59e0b;
}

.cache-stat .value.miss {
  color: #dc2626;
}

.cache-actions {
  display: flex;
  gap: 8px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #bbf7d0;
}

/* 加载和错误状态 */
.loading-container, .error-container {
  text-align: center;
  padding: 60px 20px;
  color: #6b7280;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e5e7eb;
  border-left-color: #059669;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error-container {
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

.retry-btn:hover {
  background: #b91c1c;
}

/* 表格样式 */
.table-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.table-info {
  padding: 16px 20px;
  background: #f0fdf4;
  border-bottom: 1px solid #bbf7d0;
  font-size: 14px;
  color: #166534;
}

.table-wrapper {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.data-table th {
  background: #f0fdf4;
  padding: 16px 12px;
  text-align: left;
  font-weight: 600;
  color: #166534;
  border-bottom: 2px solid #bbf7d0;
  white-space: nowrap;
}

.data-table th.sortable {
  cursor: pointer;
  user-select: none;
  transition: background-color 0.2s ease;
}

.data-table th.sortable:hover {
  background: #dcfce7;
}

.sort-indicator {
  margin-left: 4px;
  opacity: 0.5;
  font-size: 12px;
}

.sort-indicator.sort-asc {
  opacity: 1;
  transform: rotate(180deg);
}

.sort-indicator.sort-desc {
  opacity: 1;
}

.data-table td {
  padding: 16px 12px;
  border-bottom: 1px solid #f3f4f6;
  vertical-align: middle;
}

.table-row {
  transition: background-color 0.2s ease;
}

.table-row:hover {
  background: #f9fafb;
}

.table-row.row-highlight {
  background: #dcfce7;
  animation: highlight 2s ease-out;
}

.table-row.row-offline {
  border-left: 4px solid #f59e0b !important;
  background-color: rgba(245, 158, 11, 0.05);
}

.table-row.row-deleted {
  border-left: 4px solid #ef4444 !important;
  background-color: rgba(239, 68, 68, 0.05);
  opacity: 0.7;
}

.offline-badge, .deleted-badge {
  font-size: 12px;
  margin-left: 6px;
}

.offline-badge {
  color: #f59e0b;
}

.deleted-badge {
  color: #ef4444;
}

@keyframes highlight {
  0% {
    background: #bbf7d0;
  }
  100% {
    background: #dcfce7;
  }
}

.id-cell {
  font-weight: 600;
  color: #6b7280;
  width: 60px;
}

.title-cell {
  max-width: 200px;
}

.post-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.title-text {
  font-weight: 500;
  color: #1f2937;
  line-height: 1.4;
}

.title-badge {
  background: #e5e7eb;
  color: #6b7280;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
}

.content-cell {
  max-width: 250px;
}

.content-preview {
  color: #6b7280;
  line-height: 1.4;
  font-size: 13px;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.author-avatar {
  width: 32px;
  height: 32px;
  background: #059669;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
}

.author-name {
  font-weight: 500;
  color: #1f2937;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.status-published {
  background: #dcfce7;
  color: #166534;
}

.status-draft {
  background: #fef3c7;
  color: #92400e;
}

.status-review {
  background: #dbeafe;
  color: #1e40af;
}

.status-archived {
  background: #f3f4f6;
  color: #6b7280;
}

.time-cell {
  color: #6b7280;
  font-size: 13px;
}

.actions-column {
  width: 120px;
  text-align: center;
}

.action-buttons {
  display: flex;
  gap: 4px;
  justify-content: center;
}

.action-btn {
  background: none;
  border: none;
  padding: 6px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s ease;
}

.action-btn:hover {
  background: #f3f4f6;
}

.view-btn:hover {
  background: #dbeafe;
}

.edit-btn:hover {
  background: #fef3c7;
}

.delete-btn:hover {
  background: #fee2e2;
}

/* 分页样式 */
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 20px;
  background: #f0fdf4;
  border-top: 1px solid #bbf7d0;
}

.page-btn {
  padding: 8px 12px;
  border: 1px solid #bbf7d0;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
}

.page-btn:hover:not(:disabled) {
  background: #f0fdf4;
  border-color: #059669;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  color: #166534;
  font-size: 14px;
}

.page-size-select {
  padding: 6px 8px;
  border: 1px solid #bbf7d0;
  border-radius: 6px;
  font-size: 14px;
  background: white;
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
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 12px;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  animation: modalSlideIn 0.3s ease-out;
}

.modal-content.post-modal {
  max-width: 700px;
}

.modal-content.post-view-modal {
  max-width: 800px;
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
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  color: #1f2937;
}

.modal-close-btn {
  background: none;
  border: none;
  font-size: 24px;
  color: #6b7280;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.modal-close-btn:hover {
  background: #f3f4f6;
  color: #374151;
}

/* 表单样式 */
.post-form {
  padding: 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  color: #374151;
  font-size: 14px;
}

.form-input, .form-select, .form-textarea {
  width: 100%;
  padding: 10px 12px;
  border: 2px solid #e5e7eb;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s ease;
  font-family: inherit;
}

.form-input:focus, .form-select:focus, .form-textarea:focus {
  outline: none;
  border-color: #059669;
}

.form-textarea {
  resize: vertical;
  min-height: 120px;
}

.char-count {
  text-align: right;
  font-size: 12px;
  color: #6b7280;
  margin-top: 4px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #e5e7eb;
}

/* 文章详情样式 */
.post-details {
  padding: 24px;
}

.post-header {
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e5e7eb;
}

.post-title {
  font-size: 24px;
  color: #1f2937;
  margin-bottom: 16px;
  line-height: 1.3;
}

.post-meta {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.meta-label {
  font-size: 12px;
  color: #6b7280;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.meta-value {
  font-size: 14px;
  color: #1f2937;
  font-weight: 500;
}

.post-content {
  margin-bottom: 24px;
}

.post-content h4 {
  font-size: 16px;
  color: #1f2937;
  margin-bottom: 12px;
}

.content-text {
  line-height: 1.6;
  color: #374151;
  font-size: 15px;
}

.post-stats h4 {
  font-size: 16px;
  color: #1f2937;
  margin-bottom: 16px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 16px;
}

.stat-item {
  background: #f9fafb;
  padding: 12px;
  border-radius: 8px;
  text-align: center;
}

.stat-label {
  display: block;
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 4px;
}

.stat-value {
  display: block;
  font-size: 18px;
  font-weight: 600;
  color: #059669;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .table-wrapper {
    font-size: 12px;
  }
  
  .data-table th,
  .data-table td {
    padding: 12px 8px;
  }
  
  .author-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}

@media (max-width: 768px) {
  .table-header h1 {
    font-size: 2rem;
    flex-direction: column;
    gap: 8px;
  }
  
  .table-icon {
    font-size: 2.5rem;
  }
  
  .toolbar {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  
  .toolbar-left {
    flex-wrap: wrap;
  }
  
  .toolbar-right {
    flex-direction: column;
    gap: 8px;
  }
  
  .search-input, .filter-select {
    width: 100%;
  }
  
  .pagination {
    flex-wrap: wrap;
    gap: 8px;
  }
  
  .action-buttons {
    flex-direction: column;
    gap: 2px;
  }
  
  .post-meta {
    grid-template-columns: 1fr;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .posts-table {
    padding: 16px;
  }
  
  .modal-overlay {
    padding: 10px;
  }
  
  .modal-content {
    max-height: 95vh;
  }
  
  .post-form {
    padding: 16px;
  }
  
  .post-details {
    padding: 16px;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
}

/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
  .posts-table {
    background: #111827;
    color: #f9fafb;
  }
  
  .table-header h1 {
    color: #f9fafb;
  }
  
  .table-header p {
    color: #d1d5db;
  }
  
  .table-container {
    background: #1f2937;
  }
  
  .data-table th {
    background: #374151;
    color: #f9fafb;
    border-bottom-color: #4b5563;
  }
  
  .data-table th.sortable:hover {
    background: #4b5563;
  }
  
  .data-table td {
    border-bottom-color: #374151;
  }
  
  .table-row:hover {
    background: #374151;
  }
  
  .modal-content {
    background: #1f2937;
    color: #f9fafb;
  }
  
  .modal-header {
    border-bottom-color: #374151;
  }
  
  .form-input, .form-select, .form-textarea {
    background: #374151;
    border-color: #4b5563;
    color: #f9fafb;
  }
  
  .form-input:focus, .form-select:focus, .form-textarea:focus {
    border-color: #10b981;
  }
  
  .cache-info-panel {
    background: #1f2937;
    border-color: #374151;
  }
  
  .cache-info-header {
    background: #374151;
    border-bottom-color: #4b5563;
  }
}
</style>
