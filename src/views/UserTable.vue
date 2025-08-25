<template>
  <div class="user-table">
    <div class="table-header">
      <h1>
        <i class="table-icon">👥</i>
        用户管理
      </h1>
      <p>基于JSONPlaceholder API的完整CRUD示例</p>
    </div>

    <!-- 操作工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <button @click="showAddModal = true" class="btn btn-primary">
          <span class="btn-icon">➕</span>
          添加用户
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
            placeholder="搜索用户名或邮箱..."
            class="search-input"
            @input="handleSearch"
          />
          <span class="search-icon">🔍</span>
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

    <!-- 数据展示区域 -->
    <div v-if="!loading && !error" class="data-container">
      <div class="data-header">
        <div class="data-info">
          <span class="record-count">共 {{ filteredUsers.length }} 条记录</span>
          <span v-if="searchQuery" class="search-result">（搜索结果）</span>
        </div>
        <div class="view-controls">
          <button 
            @click="viewMode = 'grid'" 
            :class="['view-btn', { active: viewMode === 'grid' }]"
            title="网格视图"
          >
            📊
          </button>
          <button 
            @click="viewMode = 'list'" 
            :class="['view-btn', { active: viewMode === 'list' }]"
            title="列表视图"
          >
            📋
          </button>
        </div>
      </div>
      
      <!-- 网格布局 -->
      <div v-if="viewMode === 'grid'" class="users-grid">
        <div 
          v-for="user in paginatedUsers" 
          :key="user.id" 
          class="user-card"
          :class="{ 
            'highlight': user.id === highlightUserId,
            'offline': user._isOffline,
            'deleted': user._isDeleted 
          }"
        >
          <div class="card-header">
            <div class="user-avatar" :class="{ 'offline': user._isOffline, 'deleted': user._isDeleted }">
              {{ getInitials(user.name) }}
            </div>
            <div class="user-basic">
              <h3 class="user-name">
                {{ user.name }}
                <span v-if="user._isOffline && !user._isDeleted" class="status-badge offline-badge" title="离线操作，待同步">📝</span>
                <span v-if="user._isDeleted" class="status-badge deleted-badge" title="已标记删除，待同步">🗑️</span>
              </h3>
              <p class="user-username">@{{ user.username }}</p>
              <span class="user-id">#{{ user.id }}</span>
            </div>
            <div class="card-actions">
              <button @click="viewUser(user)" class="action-btn view-btn" title="查看详情">
                👁️
              </button>
              <button @click="editUser(user)" class="action-btn edit-btn" title="编辑">
                ✏️
              </button>
              <button @click="deleteUser(user)" class="action-btn delete-btn" title="删除">
                🗑️
              </button>
            </div>
          </div>
          
          <div class="card-content">
            <div class="info-section">
              <div class="info-item">
                <span class="info-label">📧</span>
                <a :href="`mailto:${user.email}`" class="info-link">{{ user.email }}</a>
              </div>
              
              <div class="info-item">
                <span class="info-label">📱</span>
                <span class="info-value">{{ user.phone }}</span>
              </div>
              
              <div class="info-item">
                <span class="info-label">🌐</span>
                <a :href="`https://${user.website}`" target="_blank" rel="noopener" class="info-link">
                  {{ user.website }}
                </a>
              </div>
              
              <div class="info-item">
                <span class="info-label">🏢</span>
                <span class="info-value">{{ user.company?.name || '-' }}</span>
              </div>
              
              <div class="info-item">
                <span class="info-label">📍</span>
                <span class="info-value">
                  {{ user.address?.city || '-' }}, {{ user.address?.street || '-' }}
                </span>
              </div>
            </div>
          </div>
          
          <div class="card-footer">
            <div class="user-stats">
              <div class="stat-item">
                <span class="stat-label">邮编</span>
                <span class="stat-value">{{ user.address?.zipcode || '-' }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">套房</span>
                <span class="stat-value">{{ user.address?.suite || '-' }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 列表布局 -->
      <div v-else class="users-list">
        <div 
          v-for="user in paginatedUsers" 
          :key="user.id" 
          class="user-list-item"
          :class="{ 
            'highlight': user.id === highlightUserId,
            'offline': user._isOffline,
            'deleted': user._isDeleted 
          }"
        >
          <div class="list-item-main">
            <div class="user-avatar" :class="{ 'offline': user._isOffline, 'deleted': user._isDeleted }">
              {{ getInitials(user.name) }}
            </div>
            <div class="user-info">
              <div class="user-primary">
                <h4 class="user-name">
                  {{ user.name }}
                  <span v-if="user._isOffline && !user._isDeleted" class="status-badge offline-badge">📝</span>
                  <span v-if="user._isDeleted" class="status-badge deleted-badge">🗑️</span>
                </h4>
                <span class="user-id">#{{ user.id }}</span>
              </div>
              <div class="user-secondary">
                <span class="user-username">@{{ user.username }}</span>
                <span class="separator">•</span>
                <a :href="`mailto:${user.email}`" class="user-email">{{ user.email }}</a>
              </div>
              <div class="user-details">
                <span class="detail-item">📱 {{ user.phone }}</span>
                <span class="separator">•</span>
                <span class="detail-item">🏢 {{ user.company?.name || '-' }}</span>
                <span class="separator">•</span>
                <span class="detail-item">📍 {{ user.address?.city || '-' }}</span>
              </div>
            </div>
          </div>
          <div class="list-item-actions">
            <button @click="viewUser(user)" class="action-btn view-btn" title="查看详情">👁️</button>
            <button @click="editUser(user)" class="action-btn edit-btn" title="编辑">✏️</button>
            <button @click="deleteUser(user)" class="action-btn delete-btn" title="删除">🗑️</button>
          </div>
        </div>
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

    <!-- 添加/编辑用户模态框 -->
    <div v-if="showAddModal || showEditModal" class="modal-overlay" @click="closeModals">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>{{ showAddModal ? '添加用户' : '编辑用户' }}</h3>
          <button @click="closeModals" class="modal-close-btn">×</button>
        </div>
        
        <form @submit.prevent="saveUser" class="user-form">
          <div class="form-row">
            <div class="form-group">
              <label for="name">姓名 *</label>
              <input
                id="name"
                v-model="formData.name"
                type="text"
                required
                class="form-input"
                placeholder="请输入姓名"
              />
            </div>
            <div class="form-group">
              <label for="username">用户名 *</label>
              <input
                id="username"
                v-model="formData.username"
                type="text"
                required
                class="form-input"
                placeholder="请输入用户名"
              />
            </div>
          </div>
          
          <div class="form-row">
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
            <div class="form-group">
              <label for="phone">电话</label>
              <input
                id="phone"
                v-model="formData.phone"
                type="tel"
                class="form-input"
                placeholder="请输入电话"
              />
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="website">网站</label>
              <input
                id="website"
                v-model="formData.website"
                type="url"
                class="form-input"
                placeholder="请输入网站地址"
              />
            </div>
            <div class="form-group">
              <label for="company">公司</label>
              <input
                id="company"
                v-model="formData.company"
                type="text"
                class="form-input"
                placeholder="请输入公司名称"
              />
            </div>
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

    <!-- 查看用户详情模态框 -->
    <div v-if="showViewModal" class="modal-overlay" @click="showViewModal = false">
      <div class="modal-content view-modal" @click.stop>
        <div class="modal-header">
          <h3>用户详情</h3>
          <button @click="showViewModal = false" class="modal-close-btn">×</button>
        </div>
        
        <div v-if="selectedUser" class="user-details">
          <div class="detail-section">
            <h4>基本信息</h4>
            <div class="detail-grid">
              <div class="detail-item">
                <label>ID:</label>
                <span>{{ selectedUser.id }}</span>
              </div>
              <div class="detail-item">
                <label>姓名:</label>
                <span>{{ selectedUser.name }}</span>
              </div>
              <div class="detail-item">
                <label>用户名:</label>
                <span>{{ selectedUser.username }}</span>
              </div>
              <div class="detail-item">
                <label>邮箱:</label>
                <span>{{ selectedUser.email }}</span>
              </div>
              <div class="detail-item">
                <label>电话:</label>
                <span>{{ selectedUser.phone }}</span>
              </div>
              <div class="detail-item">
                <label>网站:</label>
                <span>{{ selectedUser.website }}</span>
              </div>
            </div>
          </div>
          
          <div v-if="selectedUser.address" class="detail-section">
            <h4>地址信息</h4>
            <div class="detail-grid">
              <div class="detail-item">
                <label>街道:</label>
                <span>{{ selectedUser.address.street }}</span>
              </div>
              <div class="detail-item">
                <label>套房:</label>
                <span>{{ selectedUser.address.suite }}</span>
              </div>
              <div class="detail-item">
                <label>城市:</label>
                <span>{{ selectedUser.address.city }}</span>
              </div>
              <div class="detail-item">
                <label>邮编:</label>
                <span>{{ selectedUser.address.zipcode }}</span>
              </div>
            </div>
          </div>
          
          <div v-if="selectedUser.company" class="detail-section">
            <h4>公司信息</h4>
            <div class="detail-grid">
              <div class="detail-item">
                <label>公司名:</label>
                <span>{{ selectedUser.company.name }}</span>
              </div>
              <div class="detail-item">
                <label>标语:</label>
                <span>{{ selectedUser.company.catchPhrase }}</span>
              </div>
              <div class="detail-item">
                <label>业务:</label>
                <span>{{ selectedUser.company.bs }}</span>
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
import { UserAPI } from '../api'

// 用户数据接口定义
interface User {
  id: number
  name: string
  username: string
  email: string
  phone: string
  website: string
  address?: {
    street: string
    suite: string
    city: string
    zipcode: string
    geo: {
      lat: string
      lng: string
    }
  }
  company?: {
    name: string
    catchPhrase: string
    bs: string
  }
  // 离线操作标识
  _isOffline?: boolean
  _isDeleted?: boolean
}

// 响应式数据
const users = ref<User[]>([])
const loading = ref(false)
const saving = ref(false)
const error = ref('')
const searchQuery = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const sortField = ref('id')
const sortOrder = ref<'asc' | 'desc'>('asc')
const highlightUserId = ref<number | null>(null)
const viewMode = ref<'grid' | 'list'>('grid')

// 模态框状态
const showAddModal = ref(false)
const showEditModal = ref(false)
const showViewModal = ref(false)
const selectedUser = ref<User | null>(null)

// 缓存信息
const showCacheInfo = ref(false)
const cacheStatus = ref<'fresh' | 'stale' | 'miss'>('miss')
const dataSource = ref('网络')
const lastUpdateTime = ref('')

// 表单数据
const formData = ref({
  id: 0,
  name: '',
  username: '',
  email: '',
  phone: '',
  website: '',
  company: ''
})

// API基础URL
const API_BASE_URL = 'https://jsonplaceholder.typicode.com'

// 计算属性
const filteredUsers = computed(() => {
  if (!searchQuery.value) return users.value
  
  const query = searchQuery.value.toLowerCase()
  return users.value.filter(user => 
    user.name.toLowerCase().includes(query) ||
    user.username.toLowerCase().includes(query) ||
    user.email.toLowerCase().includes(query)
  )
})

const sortedUsers = computed(() => {
  const sorted = [...filteredUsers.value].sort((a, b) => {
    const aValue = a[sortField.value as keyof User] as string | number
    const bValue = b[sortField.value as keyof User] as string | number
    
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

const paginatedUsers = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return sortedUsers.value.slice(start, end)
})

const totalPages = computed(() => {
  return Math.ceil(filteredUsers.value.length / pageSize.value)
})

// API调用函数
const fetchUsers = async (forceRefresh = false) => {
  loading.value = true
  error.value = ''
  
  try {
    let data: User[] | null = null
    
    // 如果不是强制刷新，先尝试从预缓存获取数据
    if (!forceRefresh) {
      data = await dataPrecacheService.getCachedData<User[]>('users')
      if (data) {
        users.value = data
        cacheStatus.value = 'fresh'
        dataSource.value = '预缓存'
        lastUpdateTime.value = new Date().toLocaleString('zh-CN')
        console.log('✅ 从预缓存加载用户数据:', data.length, '条记录')
        loading.value = false
        return
      }
    }
    
    // 使用新的axios封装API
    const response = await UserAPI.getUsers({
      useCache: !forceRefresh,
      cacheTime: 5 * 60 * 1000, // 5分钟缓存
      cacheStrategy: forceRefresh ? 'networkOnly' : 'networkFirst',
      offlineSupport: true,
      retry: true,
      retryCount: 3,
      showLoading: false // 我们自己管理loading状态
    })
    
    if (response.success && response.data) {
      users.value = response.data
      cacheStatus.value = response.fromCache ? 'fresh' : 'miss'
      dataSource.value = response.fromCache ? '缓存' : '网络'
      if (response.offline) {
        dataSource.value = '离线缓存'
        cacheStatus.value = 'stale'
      }
      lastUpdateTime.value = new Date().toLocaleString('zh-CN')
      console.log('✅ 用户数据加载成功:', response.data.length, '条记录')
    } else {
      throw new Error(response.message || '获取用户数据失败')
    }
    
  } catch (err: any) {
    console.error('❌ 获取用户数据失败:', err)
    
    // 网络失败时，尝试从预缓存获取数据
    const cachedData = await dataPrecacheService.getCachedData<User[]>('users')
    if (cachedData) {
      users.value = cachedData
      cacheStatus.value = 'stale'
      dataSource.value = '离线缓存'
      lastUpdateTime.value = new Date().toLocaleString('zh-CN')
      error.value = '网络连接失败，显示缓存数据'
      console.log('📦 从预缓存加载用户数据（网络失败）:', cachedData.length, '条记录')
    } else {
      // 检查是否是网络错误
      if (!navigator.onLine) {
        error.value = '网络连接断开，请检查网络后重试'
      } else if (err.message.includes('503')) {
        error.value = '服务暂时不可用，已显示缓存数据'
      } else {
        error.value = err.message || '获取用户数据失败'
      }
    }
  } finally {
    loading.value = false
  }
}

const createUser = async (userData: Partial<User>) => {
  const response = await UserAPI.createUser(userData, {
    retry: true,
    retryCount: 2,
    showLoading: true
  })
  
  if (!response.success) {
    throw new Error(response.message || '创建用户失败')
  }
  
  return response.data
}

const updateUser = async (id: number, userData: Partial<User>) => {
  const response = await UserAPI.updateUser(id, userData, {
    retry: true,
    retryCount: 2,
    showLoading: true
  })
  
  if (!response.success) {
    throw new Error(response.message || '更新用户失败')
  }
  
  return response.data
}

const deleteUserApi = async (id: number) => {
  const response = await UserAPI.deleteUser(id, {
    retry: true,
    retryCount: 2,
    showLoading: true
  })
  
  if (!response.success) {
    throw new Error(response.message || '删除用户失败')
  }
  
  return true
}

// 事件处理函数
const refreshData = () => {
  fetchUsers(true)
}

const forceRefresh = async () => {
  try {
    await refreshApiCache(`${API_BASE_URL}/users`)
    setTimeout(() => fetchUsers(true), 500)
  } catch (error) {
    console.error('强制刷新失败:', error)
  }
}

const clearTableCache = async () => {
  try {
    await refreshApiCache(`${API_BASE_URL}/users`)
    alert('缓存已清除')
  } catch (error) {
    console.error('清除缓存失败:', error)
  }
}

const handleSearch = () => {
  currentPage.value = 1
}

// 排序功能（暂时注释，因为新布局不使用表格排序）
// const sortBy = (field: string) => {
//   if (sortField.value === field) {
//     sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
//   } else {
//     sortField.value = field
//     sortOrder.value = 'asc'
//   }
// }

// const getSortClass = (field: string) => {
//   if (sortField.value !== field) return ''
//   return sortOrder.value === 'asc' ? 'sort-asc' : 'sort-desc'
// }

const viewUser = (user: User) => {
  selectedUser.value = user
  showViewModal.value = true
}

const editUser = (user: User) => {
  formData.value = {
    id: user.id,
    name: user.name,
    username: user.username,
    email: user.email,
    phone: user.phone,
    website: user.website,
    company: user.company?.name || ''
  }
  showEditModal.value = true
}

const deleteUser = async (user: User) => {
  if (!confirm(`确定要删除用户 "${user.name}" 吗？`)) {
    return
  }
  
  try {
    if (!navigator.onLine) {
      throw new Error('网络不可用')
    }
    
    await deleteUserApi(user.id)
    
    // 从本地数组中移除
    users.value = users.value.filter(u => u.id !== user.id)
    
    // 高亮效果
    highlightUserId.value = user.id
    setTimeout(() => {
      highlightUserId.value = null
    }, 1000)
    
    alert('用户删除成功！')
    console.log('✅ 用户删除成功:', user.name)
    
  } catch (err: any) {
    // 离线或网络错误时，添加到离线队列
    if (err.message.includes('网络不可用') || err.message.includes('fetch') || err.message.includes('network')) {
      console.log('📝 网络不可用，添加删除操作到离线同步队列')
      
      // 先在本地标记为已删除（但不真正移除，以防同步失败）
      const index = users.value.findIndex(u => u.id === user.id)
      if (index !== -1) {
        users.value[index] = {
          ...users.value[index],
          _isDeleted: true,
          _isOffline: true
        } as User & { _isDeleted?: boolean, _isOffline?: boolean }
      }
      
      addOfflineOperation('DELETE', 'users', { name: user.name }, user.id)
      
      alert('网络不可用，删除操作已保存到同步队列，网络恢复后将自动同步')
      console.log('📝 用户删除已添加到离线队列:', user.name)
    } else {
      error.value = err.message || '删除用户失败'
      alert('删除失败: ' + error.value)
      console.error('❌ 删除用户失败:', err)
    }
  }
}

const saveUser = async () => {
  saving.value = true
  
  try {
    const userData = {
      name: formData.value.name,
      username: formData.value.username,
      email: formData.value.email,
      phone: formData.value.phone,
      website: formData.value.website,
      company: formData.value.company ? { 
        name: formData.value.company,
        catchPhrase: '',
        bs: ''
      } : undefined
    }
    
    if (showAddModal.value) {
      // 添加用户
      try {
        if (!navigator.onLine) {
          throw new Error('网络不可用')
        }
        
        const newUser = await createUser(userData)
        
        // 添加到本地数组（JSONPlaceholder返回的ID可能不准确，使用最大ID+1）
        const maxId = Math.max(...users.value.map(u => u.id), 0)
        const userToAdd = {
          ...userData,
          id: maxId + 1,
          company: userData.company
        } as User
        
        users.value.unshift(userToAdd)
        
        // 高亮新添加的用户
        highlightUserId.value = userToAdd.id
        setTimeout(() => {
          highlightUserId.value = null
        }, 2000)
        
        alert('用户添加成功！')
        console.log('✅ 用户添加成功:', newUser)
        
      } catch (err: any) {
        // 离线或网络错误时，添加到离线队列
        console.log('📝 网络不可用，添加到离线同步队列')
        
        const maxId = Math.max(...users.value.map(u => u.id), 0)
        const tempUser = {
          ...userData,
          id: maxId + 1,
          company: userData.company,
          _isOffline: true // 标记为离线创建
        } as User & { _isOffline?: boolean }
        
        users.value.unshift(tempUser)
        addOfflineOperation('CREATE', 'users', userData)
        
        // 高亮新添加的用户
        highlightUserId.value = tempUser.id
        setTimeout(() => {
          highlightUserId.value = null
        }, 2000)
        
        alert('网络不可用，用户已添加到同步队列，网络恢复后将自动同步')
        console.log('📝 用户已添加到离线队列:', tempUser)
      }
      
    } else {
      // 更新用户
      try {
        if (!navigator.onLine) {
          throw new Error('网络不可用')
        }
        
        await updateUser(formData.value.id, userData)
        
        // 更新本地数组
        const index = users.value.findIndex(u => u.id === formData.value.id)
        if (index !== -1) {
          users.value[index] = {
            ...users.value[index],
            ...userData,
            company: userData.company
          } as User
        }
        
        // 高亮更新的用户
        highlightUserId.value = formData.value.id
        setTimeout(() => {
          highlightUserId.value = null
        }, 2000)
        
        alert('用户更新成功！')
        console.log('✅ 用户更新成功:', formData.value.name)
        
      } catch (err: any) {
        // 离线或网络错误时，添加到离线队列
        console.log('📝 网络不可用，添加到离线同步队列')
        
        // 先在本地更新
        const index = users.value.findIndex(u => u.id === formData.value.id)
        if (index !== -1) {
          users.value[index] = {
            ...users.value[index],
            ...userData,
            company: userData.company,
            _isOffline: true // 标记为离线修改
          } as User & { _isOffline?: boolean }
        }
        
        addOfflineOperation('UPDATE', 'users', userData, formData.value.id)
        
        // 高亮更新的用户
        highlightUserId.value = formData.value.id
        setTimeout(() => {
          highlightUserId.value = null
        }, 2000)
        
        alert('网络不可用，用户修改已保存到同步队列，网络恢复后将自动同步')
        console.log('📝 用户修改已添加到离线队列:', userData)
      }
    }
    
    closeModals()
    
  } catch (err: any) {
    error.value = err.message || '保存用户失败'
    alert('保存失败: ' + error.value)
    console.error('❌ 保存用户失败:', err)
  } finally {
    saving.value = false
  }
}

const closeModals = () => {
  showAddModal.value = false
  showEditModal.value = false
  showViewModal.value = false
  selectedUser.value = null
  
  // 重置表单
  formData.value = {
    id: 0,
    name: '',
    username: '',
    email: '',
    phone: '',
    website: '',
    company: ''
  }
}

const toggleCacheInfo = () => {
  showCacheInfo.value = !showCacheInfo.value
}

const getCacheStatusText = () => {
  const statusMap = {
    fresh: '新鲜',
    stale: '过期',
    miss: '未缓存'
  }
  return statusMap[cacheStatus.value] || '未知'
}

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .substring(0, 2)
}

// 监听Service Worker消息
const handleServiceWorkerMessage = (event: MessageEvent) => {
  if (event.data.type === 'API_DATA_UPDATED') {
    const { url } = event.data.payload
    if (url && url.includes('/users')) {
      console.log('🔄 用户数据已在后台更新')
      // 可以选择自动刷新数据
      // fetchUsers()
    }
  }
}

// 组件挂载
onMounted(() => {
  fetchUsers()
  
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
.user-table {
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
  background: #3b82f6;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
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

.search-box {
  position: relative;
  display: flex;
  align-items: center;
}

.search-input {
  padding: 10px 40px 10px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  width: 250px;
  transition: border-color 0.2s ease;
}

.search-input:focus {
  outline: none;
  border-color: #3b82f6;
}

.search-icon {
  position: absolute;
  right: 12px;
  color: #6b7280;
  pointer-events: none;
}

/* 缓存信息面板 */
.cache-info-panel {
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  margin-bottom: 24px;
  overflow: hidden;
}

.cache-info-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: #e5e7eb;
  border-bottom: 1px solid #d1d5db;
}

.cache-info-header h3 {
  margin: 0;
  font-size: 16px;
  color: #374151;
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
  color: #10b981;
}

.cache-stat .value.stale {
  color: #f59e0b;
}

.cache-stat .value.miss {
  color: #ef4444;
}

.cache-actions {
  display: flex;
  gap: 8px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
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
  border-left-color: #3b82f6;
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

/* 数据展示区域样式 */
.data-container {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.data-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border-bottom: 1px solid #e5e7eb;
}

.data-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.record-count {
  font-weight: 600;
  color: #374151;
}

.search-result {
  color: #6b7280;
  font-size: 14px;
}

.view-controls {
  display: flex;
  gap: 8px;
}

.view-btn {
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 16px;
}

.view-btn:hover {
  background: #f3f4f6;
  border-color: #9ca3af;
}

.view-btn.active {
  background: #3b82f6;
  border-color: #3b82f6;
  color: white;
}

/* 网格布局样式 */
.users-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 24px;
  padding: 24px;
}

.user-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  overflow: hidden;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.user-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
  border-color: #3b82f6;
}

.user-card.highlight {
  border-color: #10b981;
  box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
}

.user-card.offline {
  border-left: 4px solid #f59e0b;
}

.user-card.deleted {
  opacity: 0.6;
  border-left: 4px solid #ef4444;
}

.card-header {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 20px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-bottom: 1px solid #e5e7eb;
}

.user-avatar {
  width: 50px;
  height: 50px;
  border-radius: 12px;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 18px;
  flex-shrink: 0;
}

.user-avatar.offline {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
}

.user-avatar.deleted {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
}

.user-basic {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 4px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-username {
  color: #6b7280;
  font-size: 14px;
  margin: 0 0 8px 0;
}

.user-id {
  background: #e5e7eb;
  color: #374151;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge {
  font-size: 14px;
}

.card-actions {
  display: flex;
  gap: 4px;
}

.action-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
}

.action-btn:hover {
  background: white;
  transform: scale(1.1);
}

.view-btn:hover { box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3); }
.edit-btn:hover { box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3); }
.delete-btn:hover { box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3); }

.card-content {
  padding: 20px;
}

.info-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
}

.info-label {
  font-size: 16px;
  width: 24px;
  flex-shrink: 0;
}

.info-value {
  color: #374151;
  font-size: 14px;
  flex: 1;
}

.info-link {
  color: #3b82f6;
  text-decoration: none;
  font-size: 14px;
  flex: 1;
}

.info-link:hover {
  text-decoration: underline;
}

.card-footer {
  padding: 16px 20px;
  background: #f9fafb;
  border-top: 1px solid #e5e7eb;
}

.user-stats {
  display: flex;
  gap: 24px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.stat-label {
  font-size: 12px;
  color: #6b7280;
  font-weight: 500;
}

.stat-value {
  font-size: 14px;
  color: #111827;
  font-weight: 600;
}

/* 列表布局样式 */
.users-list {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.user-list-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  transition: all 0.2s ease;
}

.user-list-item:hover {
  border-color: #3b82f6;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.user-list-item.highlight {
  border-color: #10b981;
  background: rgba(16, 185, 129, 0.02);
}

.user-list-item.offline {
  border-left: 4px solid #f59e0b;
}

.user-list-item.deleted {
  opacity: 0.6;
  border-left: 4px solid #ef4444;
}

.list-item-main {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
  min-width: 0;
}

.user-info {
  flex: 1;
  min-width: 0;
}

.user-primary {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 4px;
}

.user-primary .user-name {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-primary .user-id {
  background: #e5e7eb;
  color: #374151;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
}

.user-secondary {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
  font-size: 14px;
}

.user-username {
  color: #6b7280;
}

.user-email {
  color: #3b82f6;
  text-decoration: none;
}

.user-email:hover {
  text-decoration: underline;
}

.separator {
  color: #d1d5db;
}

.user-details {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #6b7280;
}

.detail-item {
  white-space: nowrap;
}

.list-item-actions {
  display: flex;
  gap: 8px;
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
  background: #f8fafc;
  border-bottom: 1px solid #e5e7eb;
  font-size: 14px;
  color: #6b7280;
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
  background: #f8fafc;
  padding: 16px 12px;
  text-align: left;
  font-weight: 600;
  color: #374151;
  border-bottom: 2px solid #e5e7eb;
  white-space: nowrap;
}

.data-table th.sortable {
  cursor: pointer;
  user-select: none;
  transition: background-color 0.2s ease;
}

.data-table th.sortable:hover {
  background: #f1f5f9;
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
  background: #dbeafe;
  animation: highlight 2s ease-out;
}

@keyframes highlight {
  0% {
    background: #bfdbfe;
  }
  100% {
    background: #dbeafe;
  }
}

.id-cell {
  font-weight: 600;
  color: #6b7280;
  width: 60px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-avatar {
  width: 32px;
  height: 32px;
  background: #3b82f6;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  position: relative;
}

.user-avatar.offline {
  background: #f59e0b;
  border: 2px solid #fbbf24;
}

.user-avatar.deleted {
  background: #ef4444;
  border: 2px solid #f87171;
  opacity: 0.7;
}

.offline-badge, .deleted-badge {
  font-size: 12px;
  margin-left: 4px;
  opacity: 0.8;
}

.offline-badge {
  color: #f59e0b;
}

.deleted-badge {
  color: #ef4444;
}

.user-name {
  font-weight: 500;
  color: #1f2937;
}

.email-link, .website-link {
  color: #3b82f6;
  text-decoration: none;
}

.email-link:hover, .website-link:hover {
  text-decoration: underline;
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
  background: #f8fafc;
  border-top: 1px solid #e5e7eb;
}

.page-btn {
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
}

.page-btn:hover:not(:disabled) {
  background: #f3f4f6;
  border-color: #9ca3af;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  color: #6b7280;
  font-size: 14px;
}

.page-size-select {
  padding: 6px 8px;
  border: 1px solid #d1d5db;
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

.modal-content.view-modal {
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
.user-form {
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

.form-input {
  padding: 10px 12px;
  border: 2px solid #e5e7eb;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s ease;
}

.form-input:focus {
  outline: none;
  border-color: #3b82f6;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #e5e7eb;
}

/* 用户详情样式 */
.user-details {
  padding: 24px;
}

.detail-section {
  margin-bottom: 24px;
}

.detail-section h4 {
  margin: 0 0 16px 0;
  font-size: 16px;
  color: #1f2937;
  padding-bottom: 8px;
  border-bottom: 1px solid #e5e7eb;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-item label {
  font-size: 12px;
  color: #6b7280;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.detail-item span {
  font-size: 14px;
  color: #1f2937;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .users-grid {
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 20px;
    padding: 20px;
  }
  
  .user-card {
    border-radius: 12px;
  }
  
  .card-header {
    padding: 16px;
  }
  
  .card-content {
    padding: 16px;
  }
  
  .table-wrapper {
    font-size: 12px;
  }
  
  .data-table th,
  .data-table td {
    padding: 12px 8px;
  }
  
  .user-info {
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
  
  .search-input {
    width: 100%;
  }
  
  .data-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
    padding: 16px 20px;
  }
  
  .data-info {
    justify-content: center;
  }
  
  .view-controls {
    justify-content: center;
  }
  
  .users-grid {
    grid-template-columns: 1fr;
    gap: 16px;
    padding: 16px;
  }
  
  .user-card {
    border-radius: 12px;
  }
  
  .card-header {
    padding: 16px;
    gap: 12px;
  }
  
  .user-avatar {
    width: 40px;
    height: 40px;
    font-size: 16px;
  }
  
  .user-name {
    font-size: 16px;
  }
  
  .card-content {
    padding: 16px;
  }
  
  .info-item {
    padding: 6px 0;
  }
  
  .card-footer {
    padding: 12px 16px;
  }
  
  .user-stats {
    gap: 16px;
  }
  
  .users-list {
    padding: 16px;
    gap: 12px;
  }
  
  .user-list-item {
    padding: 16px;
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  
  .list-item-main {
    gap: 12px;
  }
  
  .user-details {
    flex-wrap: wrap;
    gap: 4px 8px;
  }
  
  .list-item-actions {
    justify-content: center;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .detail-grid {
    grid-template-columns: 1fr;
  }
  
  .pagination {
    flex-wrap: wrap;
    gap: 8px;
  }
  
  .action-buttons {
    flex-direction: column;
    gap: 2px;
  }
}

@media (max-width: 480px) {
  .user-table {
    padding: 16px;
  }
  
  .modal-overlay {
    padding: 10px;
  }
  
  .modal-content {
    max-height: 95vh;
  }
  
  .user-form {
    padding: 16px;
  }
  
  .user-details {
    padding: 16px;
  }
}

/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
  .user-table {
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
  
  .form-input {
    background: #374151;
    border-color: #4b5563;
    color: #f9fafb;
  }
  
  .form-input:focus {
    border-color: #60a5fa;
  }
}
</style>
