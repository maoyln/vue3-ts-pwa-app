<template>
  <div class="albums-table">
    <div class="table-header">
      <h1>
        <i class="table-icon">📸</i>
        相册管理
      </h1>
      <p>基于JSONPlaceholder API的相册CRUD示例</p>
    </div>

    <!-- 操作工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <button @click="showAddModal = true" class="btn btn-primary">
          <span class="btn-icon">➕</span>
          创建相册
        </button>
        <button @click="refreshData" :disabled="loading" class="btn btn-secondary">
          <span class="btn-icon">🔄</span>
          {{ loading ? '刷新中...' : '刷新数据' }}
        </button>
        <button @click="toggleViewMode" class="btn btn-info">
          <span class="btn-icon">{{ viewMode === 'table' ? '🎯' : '📋' }}</span>
          {{ viewMode === 'table' ? '卡片视图' : '表格视图' }}
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
            placeholder="搜索相册标题..."
            class="search-input"
            @input="handleSearch"
          />
          <span class="search-icon">🔍</span>
        </div>
        
        <div class="filter-box">
          <select v-model="selectedUserId" @change="handleFilter" class="filter-select">
            <option value="">所有用户</option>
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

    <!-- 表格视图 -->
    <div v-if="!loading && !error && viewMode === 'table'" class="table-container">
      <div class="table-info">
        <span>共 {{ filteredAlbums.length }} 个相册</span>
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
                相册标题
                <span class="sort-indicator" :class="getSortClass('title')">↕️</span>
              </th>
              <th @click="sortBy('userId')" class="sortable">
                创建者
                <span class="sort-indicator" :class="getSortClass('userId')">↕️</span>
              </th>
              <th>照片数量</th>
              <th>创建时间</th>
              <th>状态</th>
              <th class="actions-column">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="album in paginatedAlbums"
              :key="album.id"
              class="table-row"
              :class="{ 'row-highlight': album.id === highlightAlbumId }"
            >
              <td class="id-cell">{{ album.id }}</td>
              <td class="title-cell">
                <div class="album-title">
                  <span class="title-text" :title="album.title">
                    {{ truncateText(album.title, 40) }}
                  </span>
                </div>
              </td>
              <td class="user-cell">
                <div class="user-info">
                  <div class="user-avatar">{{ getUserInitials(album.userId) }}</div>
                  <span class="user-name">{{ getUserName(album.userId) }}</span>
                </div>
              </td>
              <td class="photos-cell">
                <div class="photos-count">
                  <span class="count-number">{{ album.photoCount || 0 }}</span>
                  <span class="count-label">张照片</span>
                </div>
              </td>
              <td class="time-cell">
                {{ formatDate(album.createdAt || new Date()) }}
              </td>
              <td class="status-cell">
                <span class="status-badge" :class="getStatusClass(album.id)">
                  {{ getStatusText(album.id) }}
                </span>
              </td>
              <td class="actions-cell">
                <div class="action-buttons">
                  <button
                    @click="viewAlbum(album)"
                    class="action-btn view-btn"
                    title="查看详情"
                  >
                    👁️
                  </button>
                  <button
                    @click="editAlbum(album)"
                    class="action-btn edit-btn"
                    title="编辑"
                  >
                    ✏️
                  </button>
                  <button
                    @click="deleteAlbum(album)"
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
    </div>

    <!-- 卡片视图 -->
    <div v-if="!loading && !error && viewMode === 'cards'" class="cards-container">
      <div class="cards-info">
        <span>共 {{ filteredAlbums.length }} 个相册</span>
        <span v-if="searchQuery || selectedUserId">（筛选结果）</span>
      </div>
      
      <div class="cards-grid">
        <div
          v-for="album in paginatedAlbums"
          :key="album.id"
          class="album-card"
          :class="{ 'card-highlight': album.id === highlightAlbumId }"
        >
          <div class="card-header">
            <div class="album-cover">
              <div class="cover-placeholder">
                <span class="cover-icon">📸</span>
                <span class="photo-count">{{ album.photoCount || 0 }}</span>
              </div>
            </div>
            <div class="card-actions">
              <button @click="viewAlbum(album)" class="card-action-btn" title="查看">
                👁️
              </button>
              <button @click="editAlbum(album)" class="card-action-btn" title="编辑">
                ✏️
              </button>
              <button @click="deleteAlbum(album)" class="card-action-btn" title="删除">
                🗑️
              </button>
            </div>
          </div>
          
          <div class="card-body">
            <h3 class="album-title" :title="album.title">
              {{ truncateText(album.title, 30) }}
            </h3>
            <div class="album-meta">
              <div class="creator-info">
                <div class="creator-avatar">{{ getUserInitials(album.userId) }}</div>
                <span class="creator-name">{{ getUserName(album.userId) }}</span>
              </div>
              <div class="album-stats">
                <span class="stat-item">{{ album.photoCount || 0 }} 张</span>
                <span class="stat-item">{{ formatDate(album.createdAt || new Date()) }}</span>
              </div>
            </div>
          </div>
          
          <div class="card-footer">
            <span class="status-badge" :class="getStatusClass(album.id)">
              {{ getStatusText(album.id) }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 分页 -->
    <div v-if="!loading && !error && totalPages > 1" class="pagination">
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
        <option value="12">12个/页</option>
        <option value="24">24个/页</option>
        <option value="48">48个/页</option>
      </select>
    </div>

    <!-- 添加/编辑相册模态框 -->
    <div v-if="showAddModal || showEditModal" class="modal-overlay" @click="closeModals">
      <div class="modal-content album-modal" @click.stop>
        <div class="modal-header">
          <h3>{{ showAddModal ? '创建相册' : '编辑相册' }}</h3>
          <button @click="closeModals" class="modal-close-btn">×</button>
        </div>
        
        <form @submit.prevent="saveAlbum" class="album-form">
          <div class="form-group">
            <label for="userId">创建者 *</label>
            <select
              id="userId"
              v-model="formData.userId"
              required
              class="form-select"
            >
              <option value="">请选择创建者</option>
              <option v-for="user in users" :key="user.id" :value="user.id">
                {{ user.name }}
              </option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="title">相册标题 *</label>
            <input
              id="title"
              v-model="formData.title"
              type="text"
              required
              class="form-input"
              placeholder="请输入相册标题"
              maxlength="100"
            />
            <div class="char-count">{{ formData.title.length }}/100</div>
          </div>
          
          <div class="form-group">
            <label for="description">相册描述</label>
            <textarea
              id="description"
              v-model="formData.description"
              class="form-textarea"
              placeholder="请输入相册描述（可选）"
              rows="3"
              maxlength="200"
            ></textarea>
            <div class="char-count">{{ formData.description.length }}/200</div>
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

    <!-- 查看相册详情模态框 -->
    <div v-if="showViewModal" class="modal-overlay" @click="showViewModal = false">
      <div class="modal-content view-modal album-view-modal" @click.stop>
        <div class="modal-header">
          <h3>相册详情</h3>
          <button @click="showViewModal = false" class="modal-close-btn">×</button>
        </div>
        
        <div v-if="selectedAlbum" class="album-details">
          <div class="album-header">
            <div class="album-cover-large">
              <div class="cover-placeholder-large">
                <span class="cover-icon-large">📸</span>
                <span class="photo-count-large">{{ selectedAlbum.photoCount || 0 }} 张照片</span>
              </div>
            </div>
            <div class="album-info">
              <h2 class="album-title-large">{{ selectedAlbum.title }}</h2>
              <div class="album-meta-large">
                <div class="creator-info-large">
                  <div class="creator-avatar-large">{{ getUserInitials(selectedAlbum.userId) }}</div>
                  <div class="creator-details">
                    <span class="creator-name-large">{{ getUserName(selectedAlbum.userId) }}</span>
                    <span class="creator-role">创建者</span>
                  </div>
                </div>
                <div class="album-stats-large">
                  <div class="stat-item-large">
                    <span class="stat-label">相册ID:</span>
                    <span class="stat-value">#{{ selectedAlbum.id }}</span>
                  </div>
                  <div class="stat-item-large">
                    <span class="stat-label">创建时间:</span>
                    <span class="stat-value">{{ formatDate(selectedAlbum.createdAt || new Date()) }}</span>
                  </div>
                  <div class="stat-item-large">
                    <span class="stat-label">状态:</span>
                    <span class="status-badge" :class="getStatusClass(selectedAlbum.id)">
                      {{ getStatusText(selectedAlbum.id) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div v-if="selectedAlbum.description" class="album-description">
            <h4>相册描述</h4>
            <p>{{ selectedAlbum.description }}</p>
          </div>
          
          <div class="album-photos">
            <h4>照片预览</h4>
            <div class="photos-grid">
              <div
                v-for="i in Math.min(selectedAlbum.photoCount || 0, 12)"
                :key="i"
                class="photo-placeholder"
              >
                <span class="photo-icon">🖼️</span>
                <span class="photo-number">{{ i }}</span>
              </div>
              <div v-if="(selectedAlbum.photoCount || 0) > 12" class="more-photos">
                <span class="more-icon">➕</span>
                <span class="more-text">还有 {{ (selectedAlbum.photoCount || 0) - 12 }} 张</span>
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

// 相册数据接口定义
interface Album {
  id: number
  title: string
  userId: number
  photoCount?: number
  description?: string
  createdAt?: Date
}

// 用户数据接口定义
interface User {
  id: number
  name: string
  username: string
  email: string
}

// 响应式数据
const albums = ref<Album[]>([])
const users = ref<User[]>([])
const loading = ref(false)
const saving = ref(false)
const error = ref('')
const searchQuery = ref('')
const selectedUserId = ref('')
const currentPage = ref(1)
const pageSize = ref(12)
const sortField = ref('id')
const sortOrder = ref<'asc' | 'desc'>('desc')
const highlightAlbumId = ref<number | null>(null)
const viewMode = ref<'table' | 'cards'>('cards')

// 模态框状态
const showAddModal = ref(false)
const showEditModal = ref(false)
const showViewModal = ref(false)
const selectedAlbum = ref<Album | null>(null)

// 缓存信息
const showCacheInfo = ref(false)
const cacheStatus = ref<'fresh' | 'stale' | 'miss'>('miss')
const dataSource = ref('网络')
const lastUpdateTime = ref('')

// 表单数据
const formData = ref({
  id: 0,
  title: '',
  userId: 0,
  description: ''
})

// API基础URL
const API_BASE_URL = 'https://jsonplaceholder.typicode.com'

// 计算属性
const filteredAlbums = computed(() => {
  let filtered = albums.value
  
  // 按用户筛选
  if (selectedUserId.value) {
    filtered = filtered.filter(album => album.userId === parseInt(selectedUserId.value))
  }
  
  // 按搜索词筛选
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(album => 
      album.title.toLowerCase().includes(query)
    )
  }
  
  return filtered
})

const sortedAlbums = computed(() => {
  const sorted = [...filteredAlbums.value].sort((a, b) => {
    const aValue = a[sortField.value as keyof Album] as string | number
    const bValue = b[sortField.value as keyof Album] as string | number
    
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

const paginatedAlbums = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return sortedAlbums.value.slice(start, end)
})

const totalPages = computed(() => {
  return Math.ceil(filteredAlbums.value.length / pageSize.value)
})

// API调用函数
const fetchAlbums = async (_forceRefresh = false) => {
  loading.value = true
  error.value = ''
  
  try {
    const url = `${API_BASE_URL}/albums`
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    // 添加照片数量和创建时间（模拟）
    albums.value = data.map((album: Album, index: number) => ({
      ...album,
      photoCount: Math.floor(Math.random() * 50) + 1,
      createdAt: new Date(Date.now() - (data.length - index) * 24 * 60 * 60 * 1000)
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
    
    console.log('✅ 相册数据加载成功:', data.length, '个相册')
    
  } catch (err: any) {
    console.error('❌ 获取相册数据失败:', err)
    
    // 检查是否是网络错误
    if (!navigator.onLine) {
      error.value = '网络连接断开，请检查网络后重试'
    } else if (err.message.includes('503')) {
      error.value = '服务暂时不可用，已显示缓存数据'
    } else {
      error.value = err.message || '获取相册数据失败'
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

const createAlbum = async (albumData: Partial<Album>) => {
  const response = await fetch(`${API_BASE_URL}/albums`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(albumData)
  })
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }
  
  return response.json()
}

const updateAlbum = async (id: number, albumData: Partial<Album>) => {
  const response = await fetch(`${API_BASE_URL}/albums/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(albumData)
  })
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }
  
  return response.json()
}

const deleteAlbumApi = async (id: number) => {
  const response = await fetch(`${API_BASE_URL}/albums/${id}`, {
    method: 'DELETE'
  })
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }
  
  return response.ok
}

// 事件处理函数
const refreshData = () => {
  Promise.all([fetchAlbums(true), fetchUsers()])
}

const forceRefresh = async () => {
  try {
    await refreshApiCache(`${API_BASE_URL}/albums`)
    setTimeout(() => refreshData(), 500)
  } catch (error) {
    console.error('强制刷新失败:', error)
  }
}

const clearTableCache = async () => {
  try {
    await refreshApiCache(`${API_BASE_URL}/albums`)
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

const toggleViewMode = () => {
  viewMode.value = viewMode.value === 'table' ? 'cards' : 'table'
  // 调整分页大小
  pageSize.value = viewMode.value === 'cards' ? 12 : 10
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

const viewAlbum = (album: Album) => {
  selectedAlbum.value = album
  showViewModal.value = true
}

const editAlbum = (album: Album) => {
  formData.value = {
    id: album.id,
    title: album.title,
    userId: album.userId,
    description: album.description || ''
  }
  showEditModal.value = true
}

const deleteAlbum = async (album: Album) => {
  if (!confirm(`确定要删除相册 "${truncateText(album.title, 30)}" 吗？`)) {
    return
  }
  
  try {
    await deleteAlbumApi(album.id)
    
    // 从本地数组中移除
    albums.value = albums.value.filter(a => a.id !== album.id)
    
    // 高亮效果
    highlightAlbumId.value = album.id
    setTimeout(() => {
      highlightAlbumId.value = null
    }, 1000)
    
    alert('相册删除成功！')
    console.log('✅ 相册删除成功:', album.title)
    
  } catch (err: any) {
    error.value = err.message || '删除相册失败'
    alert('删除失败: ' + error.value)
    console.error('❌ 删除相册失败:', err)
  }
}

const saveAlbum = async () => {
  saving.value = true
  
  try {
    const albumData = {
      title: formData.value.title,
      userId: formData.value.userId,
      description: formData.value.description
    }
    
    if (showAddModal.value) {
      // 添加相册
      const newAlbum = await createAlbum(albumData)
      
      // 添加到本地数组
      const maxId = Math.max(...albums.value.map(a => a.id), 0)
      const albumToAdd = {
        ...albumData,
        id: maxId + 1,
        photoCount: 0,
        createdAt: new Date()
      } as Album
      
      albums.value.unshift(albumToAdd)
      
      // 高亮新添加的相册
      highlightAlbumId.value = albumToAdd.id
      setTimeout(() => {
        highlightAlbumId.value = null
      }, 2000)
      
      alert('相册创建成功！')
      console.log('✅ 相册创建成功:', newAlbum)
      
    } else {
      // 更新相册
      await updateAlbum(formData.value.id, albumData)
      
      // 更新本地数组
      const index = albums.value.findIndex(a => a.id === formData.value.id)
      if (index !== -1) {
        albums.value[index] = {
          ...albums.value[index],
          ...albumData
        }
      }
      
      // 高亮更新的相册
      highlightAlbumId.value = formData.value.id
      setTimeout(() => {
        highlightAlbumId.value = null
      }, 2000)
      
      alert('相册更新成功！')
      console.log('✅ 相册更新成功:', formData.value.title)
    }
    
    closeModals()
    
  } catch (err: any) {
    error.value = err.message || '保存相册失败'
    alert('保存失败: ' + error.value)
    console.error('❌ 保存相册失败:', err)
  } finally {
    saving.value = false
  }
}

const closeModals = () => {
  showAddModal.value = false
  showEditModal.value = false
  showViewModal.value = false
  selectedAlbum.value = null
  
  // 重置表单
  formData.value = {
    id: 0,
    title: '',
    userId: 0,
    description: ''
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

const getUserName = (userId: number) => {
  const user = users.value.find(u => u.id === userId)
  return user ? user.name : `用户 ${userId}`
}

const getUserInitials = (userId: number) => {
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

const getStatusClass = (albumId: number) => {
  // 根据ID模拟不同状态
  const status = albumId % 3
  switch (status) {
    case 0: return 'status-public'
    case 1: return 'status-private'
    default: return 'status-shared'
  }
}

const getStatusText = (albumId: number) => {
  const status = albumId % 3
  switch (status) {
    case 0: return '公开'
    case 1: return '私密'
    default: return '共享'
  }
}

const formatDate = (date: Date) => {
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

// 监听Service Worker消息
const handleServiceWorkerMessage = (event: MessageEvent) => {
  if (event.data.type === 'API_DATA_UPDATED') {
    const { url } = event.data.payload
    if (url && url.includes('/albums')) {
      console.log('🔄 相册数据已在后台更新')
    }
  }
}

// 组件挂载
onMounted(() => {
  Promise.all([fetchAlbums(), fetchUsers()])
  
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
.albums-table {
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
  background: #f59e0b;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #d97706;
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
  border-color: #f59e0b;
}

.search-icon {
  position: absolute;
  right: 12px;
  color: #6b7280;
  pointer-events: none;
}

/* 缓存信息面板 */
.cache-info-panel {
  background: #fffbeb;
  border: 1px solid #fed7aa;
  border-radius: 12px;
  margin-bottom: 24px;
  overflow: hidden;
}

.cache-info-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: #fef3c7;
  border-bottom: 1px solid #fed7aa;
}

.cache-info-header h3 {
  margin: 0;
  font-size: 16px;
  color: #92400e;
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
  border-top: 1px solid #fed7aa;
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
  border-left-color: #f59e0b;
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

.table-info, .cards-info {
  padding: 16px 20px;
  background: #fffbeb;
  border-bottom: 1px solid #fed7aa;
  font-size: 14px;
  color: #92400e;
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
  background: #fffbeb;
  padding: 16px 12px;
  text-align: left;
  font-weight: 600;
  color: #92400e;
  border-bottom: 2px solid #fed7aa;
  white-space: nowrap;
}

.data-table th.sortable {
  cursor: pointer;
  user-select: none;
  transition: background-color 0.2s ease;
}

.data-table th.sortable:hover {
  background: #fef3c7;
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
  background: #fef3c7;
  animation: highlight 2s ease-out;
}

@keyframes highlight {
  0% {
    background: #fed7aa;
  }
  100% {
    background: #fef3c7;
  }
}

.id-cell {
  font-weight: 600;
  color: #6b7280;
  width: 60px;
}

.album-title {
  font-weight: 500;
  color: #1f2937;
  line-height: 1.4;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-avatar {
  width: 32px;
  height: 32px;
  background: #f59e0b;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
}

.user-name {
  font-weight: 500;
  color: #1f2937;
}

.photos-count {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.count-number {
  font-size: 18px;
  font-weight: 600;
  color: #f59e0b;
}

.count-label {
  font-size: 12px;
  color: #6b7280;
}

.time-cell {
  color: #6b7280;
  font-size: 13px;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.status-public {
  background: #dcfce7;
  color: #166534;
}

.status-private {
  background: #fef3c7;
  color: #92400e;
}

.status-shared {
  background: #dbeafe;
  color: #1e40af;
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

/* 卡片视图样式 */
.cards-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  padding: 20px;
}

.album-card {
  background: white;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.album-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
}

.album-card.card-highlight {
  border-color: #fed7aa;
  background: #fffbeb;
  animation: cardHighlight 2s ease-out;
}

@keyframes cardHighlight {
  0% {
    background: #fef3c7;
  }
  100% {
    background: #fffbeb;
  }
}

.card-header {
  position: relative;
  height: 160px;
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
}

.album-cover {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cover-placeholder {
  text-align: center;
  color: white;
}

.cover-icon {
  display: block;
  font-size: 48px;
  margin-bottom: 8px;
}

.photo-count {
  font-size: 14px;
  font-weight: 500;
}

.card-actions {
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.album-card:hover .card-actions {
  opacity: 1;
}

.card-action-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.9);
  color: #1f2937;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.card-action-btn:hover {
  background: white;
  transform: scale(1.1);
}

.card-body {
  padding: 16px;
}

.album-title {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 12px;
  line-height: 1.3;
}

.album-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.creator-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.creator-avatar {
  width: 24px;
  height: 24px;
  background: #f59e0b;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 600;
}

.creator-name {
  font-size: 12px;
  color: #6b7280;
  font-weight: 500;
}

.album-stats {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}

.stat-item {
  font-size: 11px;
  color: #6b7280;
}

.card-footer {
  padding: 12px 16px;
  border-top: 1px solid #f3f4f6;
  background: #f9fafb;
}

/* 分页样式 */
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 20px;
  background: #fffbeb;
  border-top: 1px solid #fed7aa;
}

.page-btn {
  padding: 8px 12px;
  border: 1px solid #fed7aa;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
}

.page-btn:hover:not(:disabled) {
  background: #fffbeb;
  border-color: #f59e0b;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  color: #92400e;
  font-size: 14px;
}

.page-size-select {
  padding: 6px 8px;
  border: 1px solid #fed7aa;
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

.modal-content.album-modal {
  max-width: 500px;
}

.modal-content.album-view-modal {
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
.album-form {
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
  border-color: #f59e0b;
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
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

/* 相册详情样式 */
.album-details {
  padding: 24px;
}

.album-header {
  display: flex;
  gap: 24px;
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 1px solid #e5e7eb;
}

.album-cover-large {
  width: 200px;
  height: 150px;
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  border-radius: 12px;
  flex-shrink: 0;
}

.cover-placeholder-large {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  text-align: center;
}

.cover-icon-large {
  font-size: 48px;
  margin-bottom: 8px;
}

.photo-count-large {
  font-size: 14px;
  font-weight: 500;
}

.album-info {
  flex: 1;
}

.album-title-large {
  font-size: 24px;
  color: #1f2937;
  margin-bottom: 16px;
  line-height: 1.3;
}

.album-meta-large {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.creator-info-large {
  display: flex;
  align-items: center;
  gap: 12px;
}

.creator-avatar-large {
  width: 40px;
  height: 40px;
  background: #f59e0b;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 600;
}

.creator-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.creator-name-large {
  font-weight: 500;
  color: #1f2937;
}

.creator-role {
  font-size: 12px;
  color: #6b7280;
}

.album-stats-large {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat-item-large {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-label {
  font-size: 12px;
  color: #6b7280;
  font-weight: 500;
}

.stat-value {
  font-size: 14px;
  color: #1f2937;
  font-weight: 500;
}

.album-description {
  margin-bottom: 32px;
}

.album-description h4 {
  font-size: 16px;
  color: #1f2937;
  margin-bottom: 12px;
}

.album-description p {
  line-height: 1.6;
  color: #374151;
}

.album-photos h4 {
  font-size: 16px;
  color: #1f2937;
  margin-bottom: 16px;
}

.photos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 12px;
}

.photo-placeholder {
  aspect-ratio: 1;
  background: #f3f4f6;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  font-size: 12px;
  border: 2px dashed #d1d5db;
}

.photo-icon {
  font-size: 20px;
  margin-bottom: 4px;
}

.photo-number {
  font-size: 10px;
}

.more-photos {
  aspect-ratio: 1;
  background: #fbbf24;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 12px;
  font-weight: 500;
}

.more-icon {
  font-size: 20px;
  margin-bottom: 4px;
}

.more-text {
  font-size: 10px;
  text-align: center;
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
  
  .cards-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .album-header {
    flex-direction: column;
    gap: 16px;
  }
  
  .album-cover-large {
    width: 100%;
    height: 120px;
  }
  
  .photos-grid {
    grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
    gap: 8px;
  }
}

@media (max-width: 480px) {
  .albums-table {
    padding: 16px;
  }
  
  .modal-overlay {
    padding: 10px;
  }
  
  .modal-content {
    max-height: 95vh;
  }
  
  .album-form {
    padding: 16px;
  }
  
  .album-details {
    padding: 16px;
  }
}

/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
  .albums-table {
    background: #111827;
    color: #f9fafb;
  }
  
  .table-header h1 {
    color: #f9fafb;
  }
  
  .table-header p {
    color: #d1d5db;
  }
  
  .table-container, .cards-container {
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
  
  .album-card {
    background: #1f2937;
    border-color: #374151;
  }
  
  .album-card:hover {
    background: #1f2937;
  }
  
  .card-footer {
    background: #374151;
    border-top-color: #4b5563;
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
    border-color: #fbbf24;
  }
}
</style>
