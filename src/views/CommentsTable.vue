<template>
  <div class="comments-table">
    <div class="table-header">
      <h1>
        <i class="table-icon">💬</i>
        评论管理
      </h1>
      <p>基于JSONPlaceholder API的评论CRUD示例</p>
    </div>

    <!-- 操作工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <button @click="showAddModal = true" class="btn btn-primary">
          <span class="btn-icon">➕</span>
          添加评论
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
            placeholder="搜索评论内容或邮箱..."
            class="search-input"
            @input="handleSearch"
          />
          <span class="search-icon">🔍</span>
        </div>
        
        <div class="filter-box">
          <select v-model="selectedPostId" @change="handleFilter" class="filter-select">
            <option value="">所有文章</option>
            <option v-for="post in posts" :key="post.id" :value="post.id">
              {{ truncateText(post.title, 30) }}
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
        <span>共 {{ filteredComments.length }} 条评论</span>
        <span v-if="searchQuery || selectedPostId">（筛选结果）</span>
      </div>
      
      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th @click="sortBy('id')" class="sortable">
                ID
                <span class="sort-indicator" :class="getSortClass('id')">↕️</span>
              </th>
              <th>文章</th>
              <th @click="sortBy('name')" class="sortable">
                评论者
                <span class="sort-indicator" :class="getSortClass('name')">↕️</span>
              </th>
              <th @click="sortBy('email')" class="sortable">
                邮箱
                <span class="sort-indicator" :class="getSortClass('email')">↕️</span>
              </th>
              <th>评论内容</th>
              <th>评分</th>
              <th>状态</th>
              <th class="actions-column">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="comment in paginatedComments"
              :key="comment.id"
              class="table-row"
              :class="{ 'row-highlight': comment.id === highlightCommentId }"
            >
              <td class="id-cell">{{ comment.id }}</td>
              <td class="post-cell">
                <div class="post-info">
                  <span class="post-title" :title="getPostTitle(comment.postId)">
                    {{ truncateText(getPostTitle(comment.postId), 25) }}
                  </span>
                  <span class="post-id">#{{ comment.postId }}</span>
                </div>
              </td>
              <td class="name-cell">
                <div class="commenter-info">
                  <div class="commenter-avatar">{{ getInitials(comment.name) }}</div>
                  <span class="commenter-name">{{ comment.name }}</span>
                </div>
              </td>
              <td class="email-cell">
                <a :href="`mailto:${comment.email}`" class="email-link">
                  {{ comment.email }}
                </a>
              </td>
              <td class="content-cell">
                <div class="comment-preview" :title="comment.body">
                  {{ truncateText(comment.body, 50) }}
                </div>
              </td>
              <td class="rating-cell">
                <div class="rating-display">
                  <span class="stars">{{ getStarRating(comment.rating || 0) }}</span>
                  <span class="rating-value">{{ comment.rating || 0 }}/5</span>
                </div>
              </td>
              <td class="status-cell">
                <span class="status-badge" :class="getStatusClass(comment.id)">
                  {{ getStatusText(comment.id) }}
                </span>
              </td>
              <td class="actions-cell">
                <div class="action-buttons">
                  <button
                    @click="viewComment(comment)"
                    class="action-btn view-btn"
                    title="查看详情"
                  >
                    👁️
                  </button>
                  <button
                    @click="editComment(comment)"
                    class="action-btn edit-btn"
                    title="编辑"
                  >
                    ✏️
                  </button>
                  <button
                    @click="deleteComment(comment)"
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

    <!-- 添加/编辑评论模态框 -->
    <div v-if="showAddModal || showEditModal" class="modal-overlay" @click="closeModals">
      <div class="modal-content comment-modal" @click.stop>
        <div class="modal-header">
          <h3>{{ showAddModal ? '添加评论' : '编辑评论' }}</h3>
          <button @click="closeModals" class="modal-close-btn">×</button>
        </div>
        
        <form @submit.prevent="saveComment" class="comment-form">
          <div class="form-row">
            <div class="form-group">
              <label for="postId">文章 *</label>
              <select
                id="postId"
                v-model="formData.postId"
                required
                class="form-select"
              >
                <option value="">请选择文章</option>
                <option v-for="post in posts" :key="post.id" :value="post.id">
                  {{ post.title }}
                </option>
              </select>
            </div>
            <div class="form-group">
              <label for="rating">评分</label>
              <select
                id="rating"
                v-model="formData.rating"
                class="form-select"
              >
                <option value="5">⭐⭐⭐⭐⭐ 5分</option>
                <option value="4">⭐⭐⭐⭐ 4分</option>
                <option value="3">⭐⭐⭐ 3分</option>
                <option value="2">⭐⭐ 2分</option>
                <option value="1">⭐ 1分</option>
              </select>
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="name">评论者姓名 *</label>
              <input
                id="name"
                v-model="formData.name"
                type="text"
                required
                class="form-input"
                placeholder="请输入姓名"
                maxlength="50"
              />
            </div>
            <div class="form-group">
              <label for="email">邮箱 *</label>
              <input
                id="email"
                v-model="formData.email"
                type="email"
                required
                class="form-input"
                placeholder="请输入邮箱"
              />
            </div>
          </div>
          
          <div class="form-group">
            <label for="body">评论内容 *</label>
            <textarea
              id="body"
              v-model="formData.body"
              required
              class="form-textarea"
              placeholder="请输入评论内容"
              rows="4"
              maxlength="500"
            ></textarea>
            <div class="char-count">{{ formData.body.length }}/500</div>
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

    <!-- 查看评论详情模态框 -->
    <div v-if="showViewModal" class="modal-overlay" @click="showViewModal = false">
      <div class="modal-content view-modal comment-view-modal" @click.stop>
        <div class="modal-header">
          <h3>评论详情</h3>
          <button @click="showViewModal = false" class="modal-close-btn">×</button>
        </div>
        
        <div v-if="selectedComment" class="comment-details">
          <div class="comment-header">
            <div class="commenter-profile">
              <div class="profile-avatar">{{ getInitials(selectedComment.name) }}</div>
              <div class="profile-info">
                <h4>{{ selectedComment.name }}</h4>
                <p>{{ selectedComment.email }}</p>
              </div>
            </div>
            <div class="comment-meta">
              <div class="rating-display large">
                <span class="stars">{{ getStarRating(selectedComment.rating || 0) }}</span>
                <span class="rating-value">{{ selectedComment.rating || 0 }}/5</span>
              </div>
              <div class="status-info">
                <span class="status-badge" :class="getStatusClass(selectedComment.id)">
                  {{ getStatusText(selectedComment.id) }}
                </span>
              </div>
            </div>
          </div>
          
          <div class="comment-content">
            <h4>评论内容</h4>
            <div class="content-text">{{ selectedComment.body }}</div>
          </div>
          
          <div class="comment-context">
            <h4>所属文章</h4>
            <div class="post-info-card">
              <div class="post-title">{{ getPostTitle(selectedComment.postId) }}</div>
              <div class="post-meta">文章ID: #{{ selectedComment.postId }}</div>
            </div>
          </div>
          
          <div class="comment-stats">
            <h4>评论统计</h4>
            <div class="stats-grid">
              <div class="stat-item">
                <span class="stat-label">评论ID:</span>
                <span class="stat-value">#{{ selectedComment.id }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">字符数:</span>
                <span class="stat-value">{{ selectedComment.body.length }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">单词数:</span>
                <span class="stat-value">{{ countWords(selectedComment.body) }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">评分:</span>
                <span class="stat-value">{{ selectedComment.rating || 0 }}/5</span>
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
import { refreshApiCache } from '../registerServiceWorker'

// 评论数据接口定义
interface Comment {
  id: number
  postId: number
  name: string
  email: string
  body: string
  rating?: number
}

// 文章数据接口定义
interface Post {
  id: number
  title: string
}

// 响应式数据
const comments = ref<Comment[]>([])
const posts = ref<Post[]>([])
const loading = ref(false)
const saving = ref(false)
const error = ref('')
const searchQuery = ref('')
const selectedPostId = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const sortField = ref('id')
const sortOrder = ref<'asc' | 'desc'>('desc')
const highlightCommentId = ref<number | null>(null)

// 模态框状态
const showAddModal = ref(false)
const showEditModal = ref(false)
const showViewModal = ref(false)
const selectedComment = ref<Comment | null>(null)

// 缓存信息
const showCacheInfo = ref(false)
const cacheStatus = ref<'fresh' | 'stale' | 'miss'>('miss')
const dataSource = ref('网络')
const lastUpdateTime = ref('')

// 表单数据
const formData = ref({
  id: 0,
  postId: 0,
  name: '',
  email: '',
  body: '',
  rating: 5
})

// API基础URL
const API_BASE_URL = 'https://jsonplaceholder.typicode.com'

// 计算属性
const filteredComments = computed(() => {
  let filtered = comments.value
  
  // 按文章筛选
  if (selectedPostId.value) {
    filtered = filtered.filter(comment => comment.postId === parseInt(selectedPostId.value))
  }
  
  // 按搜索词筛选
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(comment => 
      comment.body.toLowerCase().includes(query) ||
      comment.name.toLowerCase().includes(query) ||
      comment.email.toLowerCase().includes(query)
    )
  }
  
  return filtered
})

const sortedComments = computed(() => {
  const sorted = [...filteredComments.value].sort((a, b) => {
    const aValue = a[sortField.value as keyof Comment] as string | number
    const bValue = b[sortField.value as keyof Comment] as string | number
    
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

const paginatedComments = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return sortedComments.value.slice(start, end)
})

const totalPages = computed(() => {
  return Math.ceil(filteredComments.value.length / pageSize.value)
})

// API调用函数
const fetchComments = async (_forceRefresh = false) => {
  loading.value = true
  error.value = ''
  
  try {
    const url = `${API_BASE_URL}/comments`
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    // 添加评分（模拟）
    comments.value = data.map((comment: Comment) => ({
      ...comment,
      rating: Math.floor(Math.random() * 5) + 1
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
    
    console.log('✅ 评论数据加载成功:', data.length, '条评论')
    
  } catch (err: any) {
    console.error('❌ 获取评论数据失败:', err)
    
    // 检查是否是网络错误
    if (!navigator.onLine) {
      error.value = '网络连接断开，请检查网络后重试'
    } else if (err.message.includes('503')) {
      error.value = '服务暂时不可用，已显示缓存数据'
    } else {
      error.value = err.message || '获取评论数据失败'
    }
  } finally {
    loading.value = false
  }
}

const fetchPosts = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/posts`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data = await response.json()
    posts.value = data
    console.log('✅ 文章数据加载成功:', data.length, '篇文章')
  } catch (err: any) {
    console.error('❌ 获取文章数据失败:', err)
  }
}

const createComment = async (commentData: Partial<Comment>) => {
  const response = await fetch(`${API_BASE_URL}/comments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(commentData)
  })
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }
  
  return response.json()
}

const updateComment = async (id: number, commentData: Partial<Comment>) => {
  const response = await fetch(`${API_BASE_URL}/comments/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(commentData)
  })
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }
  
  return response.json()
}

const deleteCommentApi = async (id: number) => {
  const response = await fetch(`${API_BASE_URL}/comments/${id}`, {
    method: 'DELETE'
  })
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }
  
  return response.ok
}

// 事件处理函数
const refreshData = () => {
  Promise.all([fetchComments(true), fetchPosts()])
}

const forceRefresh = async () => {
  try {
    await refreshApiCache(`${API_BASE_URL}/comments`)
    setTimeout(() => refreshData(), 500)
  } catch (error) {
    console.error('强制刷新失败:', error)
  }
}

const clearTableCache = async () => {
  try {
    await refreshApiCache(`${API_BASE_URL}/comments`)
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

const viewComment = (comment: Comment) => {
  selectedComment.value = comment
  showViewModal.value = true
}

const editComment = (comment: Comment) => {
  formData.value = {
    id: comment.id,
    postId: comment.postId,
    name: comment.name,
    email: comment.email,
    body: comment.body,
    rating: comment.rating || 5
  }
  showEditModal.value = true
}

const deleteComment = async (comment: Comment) => {
  if (!confirm(`确定要删除评论 "${truncateText(comment.body, 30)}" 吗？`)) {
    return
  }
  
  try {
    await deleteCommentApi(comment.id)
    
    // 从本地数组中移除
    comments.value = comments.value.filter(c => c.id !== comment.id)
    
    // 高亮效果
    highlightCommentId.value = comment.id
    setTimeout(() => {
      highlightCommentId.value = null
    }, 1000)
    
    alert('评论删除成功！')
    console.log('✅ 评论删除成功:', comment.id)
    
  } catch (err: any) {
    error.value = err.message || '删除评论失败'
    alert('删除失败: ' + error.value)
    console.error('❌ 删除评论失败:', err)
  }
}

const saveComment = async () => {
  saving.value = true
  
  try {
    const commentData = {
      postId: formData.value.postId,
      name: formData.value.name,
      email: formData.value.email,
      body: formData.value.body,
      rating: formData.value.rating
    }
    
    if (showAddModal.value) {
      // 添加评论
      const newComment = await createComment(commentData)
      
      // 添加到本地数组
      const maxId = Math.max(...comments.value.map(c => c.id), 0)
      const commentToAdd = {
        ...commentData,
        id: maxId + 1
      } as Comment
      
      comments.value.unshift(commentToAdd)
      
      // 高亮新添加的评论
      highlightCommentId.value = commentToAdd.id
      setTimeout(() => {
        highlightCommentId.value = null
      }, 2000)
      
      alert('评论添加成功！')
      console.log('✅ 评论添加成功:', newComment)
      
    } else {
      // 更新评论
      await updateComment(formData.value.id, commentData)
      
      // 更新本地数组
      const index = comments.value.findIndex(c => c.id === formData.value.id)
      if (index !== -1) {
        comments.value[index] = {
          ...comments.value[index],
          ...commentData
        }
      }
      
      // 高亮更新的评论
      highlightCommentId.value = formData.value.id
      setTimeout(() => {
        highlightCommentId.value = null
      }, 2000)
      
      alert('评论更新成功！')
      console.log('✅ 评论更新成功:', formData.value.id)
    }
    
    closeModals()
    
  } catch (err: any) {
    error.value = err.message || '保存评论失败'
    alert('保存失败: ' + error.value)
    console.error('❌ 保存评论失败:', err)
  } finally {
    saving.value = false
  }
}

const closeModals = () => {
  showAddModal.value = false
  showEditModal.value = false
  showViewModal.value = false
  selectedComment.value = null
  
  // 重置表单
  formData.value = {
    id: 0,
    postId: 0,
    name: '',
    email: '',
    body: '',
    rating: 5
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

const getPostTitle = (postId: number) => {
  const post = posts.value.find(p => p.id === postId)
  return post ? post.title : `文章 ${postId}`
}

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .substring(0, 2)
}

const getStarRating = (rating: number) => {
  return '⭐'.repeat(Math.max(0, Math.min(5, rating)))
}

const getStatusClass = (commentId: number) => {
  // 根据ID模拟不同状态
  const status = commentId % 3
  switch (status) {
    case 0: return 'status-approved'
    case 1: return 'status-pending'
    default: return 'status-rejected'
  }
}

const getStatusText = (commentId: number) => {
  const status = commentId % 3
  switch (status) {
    case 0: return '已通过'
    case 1: return '待审核'
    default: return '已拒绝'
  }
}

const countWords = (text: string) => {
  return text.trim().split(/\s+/).length
}

// 监听Service Worker消息
const handleServiceWorkerMessage = (event: MessageEvent) => {
  if (event.data.type === 'API_DATA_UPDATED') {
    const { url } = event.data.payload
    if (url && url.includes('/comments')) {
      console.log('🔄 评论数据已在后台更新')
    }
  }
}

// 组件挂载
onMounted(() => {
  Promise.all([fetchComments(), fetchPosts()])
  
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
.comments-table {
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
  background: #7c3aed;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #6d28d9;
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
  width: 200px;
}

.search-input:focus, .filter-select:focus {
  outline: none;
  border-color: #7c3aed;
}

.search-icon {
  position: absolute;
  right: 12px;
  color: #6b7280;
  pointer-events: none;
}

/* 缓存信息面板 */
.cache-info-panel {
  background: #faf5ff;
  border: 1px solid #ddd6fe;
  border-radius: 12px;
  margin-bottom: 24px;
  overflow: hidden;
}

.cache-info-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: #e9d5ff;
  border-bottom: 1px solid #ddd6fe;
}

.cache-info-header h3 {
  margin: 0;
  font-size: 16px;
  color: #581c87;
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
  border-top: 1px solid #ddd6fe;
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
  border-left-color: #7c3aed;
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
  background: #faf5ff;
  border-bottom: 1px solid #ddd6fe;
  font-size: 14px;
  color: #581c87;
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
  background: #faf5ff;
  padding: 16px 12px;
  text-align: left;
  font-weight: 600;
  color: #581c87;
  border-bottom: 2px solid #ddd6fe;
  white-space: nowrap;
}

.data-table th.sortable {
  cursor: pointer;
  user-select: none;
  transition: background-color 0.2s ease;
}

.data-table th.sortable:hover {
  background: #f3e8ff;
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
  background: #f8fafc;
}

.table-row.row-highlight {
  background: #e9d5ff;
  animation: highlight 2s ease-out;
}

@keyframes highlight {
  0% {
    background: #ddd6fe;
  }
  100% {
    background: #e9d5ff;
  }
}

.id-cell {
  font-weight: 600;
  color: #6b7280;
  width: 60px;
}

.post-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.post-title {
  font-weight: 500;
  color: #1f2937;
  line-height: 1.3;
}

.post-id {
  font-size: 12px;
  color: #6b7280;
}

.commenter-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.commenter-avatar {
  width: 32px;
  height: 32px;
  background: #7c3aed;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
}

.commenter-name {
  font-weight: 500;
  color: #1f2937;
}

.email-link {
  color: #7c3aed;
  text-decoration: none;
}

.email-link:hover {
  text-decoration: underline;
}

.comment-preview {
  color: #6b7280;
  line-height: 1.4;
  font-size: 13px;
  max-width: 200px;
}

.rating-display {
  display: flex;
  align-items: center;
  gap: 6px;
}

.rating-display.large {
  font-size: 18px;
}

.stars {
  color: #fbbf24;
}

.rating-value {
  font-size: 12px;
  color: #6b7280;
  font-weight: 500;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.status-approved {
  background: #dcfce7;
  color: #166534;
}

.status-pending {
  background: #fef3c7;
  color: #92400e;
}

.status-rejected {
  background: #fee2e2;
  color: #dc2626;
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
  background: #faf5ff;
  border-top: 1px solid #ddd6fe;
}

.page-btn {
  padding: 8px 12px;
  border: 1px solid #ddd6fe;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
}

.page-btn:hover:not(:disabled) {
  background: #faf5ff;
  border-color: #7c3aed;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  color: #581c87;
  font-size: 14px;
}

.page-size-select {
  padding: 6px 8px;
  border: 1px solid #ddd6fe;
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

.modal-content.comment-modal {
  max-width: 700px;
}

.modal-content.comment-view-modal {
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
.comment-form {
  padding: 24px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  margin-bottom: 6px;
  font-weight: 500;
  color: #374151;
  font-size: 14px;
}

.form-input, .form-select, .form-textarea {
  padding: 10px 12px;
  border: 2px solid #e5e7eb;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s ease;
  font-family: inherit;
}

.form-input:focus, .form-select:focus, .form-textarea:focus {
  outline: none;
  border-color: #7c3aed;
}

.form-textarea {
  resize: vertical;
  min-height: 100px;
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

/* 评论详情样式 */
.comment-details {
  padding: 24px;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e5e7eb;
}

.commenter-profile {
  display: flex;
  align-items: center;
  gap: 16px;
}

.profile-avatar {
  width: 48px;
  height: 48px;
  background: #7c3aed;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 600;
}

.profile-info h4 {
  margin: 0 0 4px 0;
  color: #1f2937;
}

.profile-info p {
  margin: 0;
  color: #6b7280;
  font-size: 14px;
}

.comment-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 12px;
}

.comment-content {
  margin-bottom: 24px;
}

.comment-content h4 {
  font-size: 16px;
  color: #1f2937;
  margin-bottom: 12px;
}

.content-text {
  line-height: 1.6;
  color: #374151;
  font-size: 15px;
}

.comment-context {
  margin-bottom: 24px;
}

.comment-context h4 {
  font-size: 16px;
  color: #1f2937;
  margin-bottom: 12px;
}

.post-info-card {
  background: #f9fafb;
  padding: 16px;
  border-radius: 8px;
  border-left: 4px solid #7c3aed;
}

.post-info-card .post-title {
  font-weight: 500;
  color: #1f2937;
  margin-bottom: 4px;
}

.post-info-card .post-meta {
  font-size: 14px;
  color: #6b7280;
}

.comment-stats h4 {
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
  color: #7c3aed;
}

/* 响应式设计 */
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
  
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .comment-header {
    flex-direction: column;
    gap: 16px;
  }
  
  .comment-meta {
    align-items: flex-start;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .comments-table {
    padding: 16px;
  }
  
  .modal-overlay {
    padding: 10px;
  }
  
  .modal-content {
    max-height: 95vh;
  }
  
  .comment-form {
    padding: 16px;
  }
  
  .comment-details {
    padding: 16px;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
}

/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
  .comments-table {
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
    border-color: #a78bfa;
  }
}
</style>
