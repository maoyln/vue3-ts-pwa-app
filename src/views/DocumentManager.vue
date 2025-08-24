<template>
  <div class="document-manager">
    <div class="manager-header">
      <h1>
        <i class="table-icon">📄</i>
        文档管理
      </h1>
      <p>支持离线编辑的文档管理系统，自动同步到云端</p>
    </div>

    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <button @click="createNewDocument" class="btn btn-primary">
          <span class="btn-icon">📝</span>
          新建文档
        </button>
        <button @click="refreshDocuments" :disabled="loading" class="btn btn-secondary">
          <span class="btn-icon">🔄</span>
          {{ loading ? '刷新中...' : '刷新' }}
        </button>
        <button @click="toggleViewMode" class="btn btn-info">
          <span class="btn-icon">{{ viewMode === 'grid' ? '📋' : '⚏' }}</span>
          {{ viewMode === 'grid' ? '列表视图' : '网格视图' }}
        </button>
      </div>
      
      <div class="toolbar-right">
        <div class="search-box">
          <input
            v-model="searchQuery"
            placeholder="搜索文档标题或内容..."
            class="search-input"
            @input="handleSearch"
          />
          <span class="search-icon">🔍</span>
        </div>
        <select v-model="filterType" class="filter-select">
          <option value="">所有类型</option>
          <option value="markdown">Markdown</option>
          <option value="html">HTML</option>
          <option value="text">纯文本</option>
        </select>
      </div>
    </div>

    <!-- 存储统计信息 -->
    <div v-if="storageStats" class="storage-stats">
      <div class="stats-item">
        <span class="stats-label">文档数量:</span>
        <span class="stats-value">{{ documents.length }}</span>
      </div>
      <div class="stats-item">
        <span class="stats-label">存储使用:</span>
        <span class="stats-value">{{ formatBytes(storageStats.totalSize) }}</span>
      </div>
      <div class="stats-item">
        <span class="stats-label">离线操作:</span>
        <span class="stats-value">{{ pendingOperations }}</span>
      </div>
      <button @click="cleanupStorage" class="btn btn-warning btn-sm">
        清理存储
      </button>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>正在加载文档...</p>
    </div>

    <!-- 错误信息 -->
    <div v-if="error" class="error-container">
      <div class="error-icon">⚠️</div>
      <p>{{ error }}</p>
      <button @click="refreshDocuments" class="retry-btn">重试</button>
    </div>

    <!-- 文档列表/网格 -->
    <div v-if="!loading && !error" class="documents-container">
      <div v-if="filteredDocuments.length === 0" class="empty-state">
        <div class="empty-icon">📄</div>
        <h3>暂无文档</h3>
        <p>{{ searchQuery ? '没有找到匹配的文档' : '点击"新建文档"开始创建您的第一个文档' }}</p>
        <button v-if="!searchQuery" @click="createNewDocument" class="btn btn-primary">
          新建文档
        </button>
      </div>

      <!-- 网格视图 -->
      <div v-else-if="viewMode === 'grid'" class="documents-grid">
        <div
          v-for="doc in paginatedDocuments"
          :key="doc.id"
          class="document-card"
          :class="{ 
            'card-offline': doc.isOffline,
            'card-draft': doc.isDraft
          }"
          @click="openDocument(doc)"
        >
          <div class="card-header">
            <div class="card-type">
              <span v-if="doc.type === 'markdown'">📝</span>
              <span v-else-if="doc.type === 'html'">🌐</span>
              <span v-else>📄</span>
            </div>
            <div class="card-actions">
              <button @click.stop="editDocument(doc)" class="action-btn" title="编辑">
                ✏️
              </button>
              <button @click.stop="duplicateDocument(doc)" class="action-btn" title="复制">
                📋
              </button>
              <button @click.stop="deleteDocument(doc)" class="action-btn danger" title="删除">
                🗑️
              </button>
            </div>
          </div>
          
          <div class="card-content">
            <h3 class="card-title">
              {{ doc.title }}
              <span v-if="doc.isOffline" class="offline-badge" title="离线编辑，待同步">📝</span>
              <span v-if="doc.isDraft" class="draft-badge" title="草稿">📝</span>
            </h3>
            <div class="card-preview">{{ getPreview(doc.content) }}</div>
            <div class="card-tags">
              <span v-for="tag in doc.tags" :key="tag" class="tag">{{ tag }}</span>
            </div>
          </div>
          
          <div class="card-footer">
            <div class="card-meta">
              <span class="meta-size">{{ formatBytes(doc.size) }}</span>
              <span class="meta-date">{{ formatDate(doc.updatedAt) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 列表视图 -->
      <div v-else class="documents-list">
        <div class="list-header">
          <div class="list-col col-title" @click="sortBy('title')">
            标题
            <span class="sort-indicator" :class="getSortClass('title')">↕️</span>
          </div>
          <div class="list-col col-type">类型</div>
          <div class="list-col col-size" @click="sortBy('size')">
            大小
            <span class="sort-indicator" :class="getSortClass('size')">↕️</span>
          </div>
          <div class="list-col col-date" @click="sortBy('updatedAt')">
            修改时间
            <span class="sort-indicator" :class="getSortClass('updatedAt')">↕️</span>
          </div>
          <div class="list-col col-actions">操作</div>
        </div>

        <div
          v-for="doc in paginatedDocuments"
          :key="doc.id"
          class="list-row"
          :class="{ 
            'row-offline': doc.isOffline,
            'row-draft': doc.isDraft
          }"
          @click="openDocument(doc)"
        >
          <div class="list-col col-title">
            <div class="title-content">
              <span v-if="doc.type === 'markdown'">📝</span>
              <span v-else-if="doc.type === 'html'">🌐</span>
              <span v-else>📄</span>
              <span class="title-text">{{ doc.title }}</span>
              <span v-if="doc.isOffline" class="offline-badge" title="离线编辑，待同步">📝</span>
              <span v-if="doc.isDraft" class="draft-badge" title="草稿">📝</span>
            </div>
          </div>
          <div class="list-col col-type">
            <span class="type-badge" :class="`type-${doc.type}`">
              {{ doc.type.toUpperCase() }}
            </span>
          </div>
          <div class="list-col col-size">{{ formatBytes(doc.size) }}</div>
          <div class="list-col col-date">{{ formatDate(doc.updatedAt) }}</div>
          <div class="list-col col-actions">
            <button @click.stop="editDocument(doc)" class="action-btn" title="编辑">
              ✏️
            </button>
            <button @click.stop="duplicateDocument(doc)" class="action-btn" title="复制">
              📋
            </button>
            <button @click.stop="deleteDocument(doc)" class="action-btn danger" title="删除">
              🗑️
            </button>
          </div>
        </div>
      </div>

      <!-- 分页 -->
      <div v-if="totalPages > 1" class="pagination">
        <button
          @click="currentPage = Math.max(1, currentPage - 1)"
          :disabled="currentPage === 1"
          class="pagination-btn"
        >
          ‹ 上一页
        </button>
        
        <div class="pagination-info">
          第 {{ currentPage }} 页，共 {{ totalPages }} 页
          ({{ filteredDocuments.length }} 个文档)
        </div>
        
        <button
          @click="currentPage = Math.min(totalPages, currentPage + 1)"
          :disabled="currentPage === totalPages"
          class="pagination-btn"
        >
          下一页 ›
        </button>
      </div>
    </div>

    <!-- 文档编辑器模态框 -->
    <Transition name="modal">
      <div v-if="showEditor" class="editor-modal" @click.self="closeEditor">
        <div class="editor-container">
          <div class="editor-header">
            <input
              v-model="editingDocument.title"
              class="editor-title"
              placeholder="文档标题..."
              @input="markAsModified"
            />
            <div class="editor-controls">
              <select v-model="editingDocument.type" @change="markAsModified" class="type-select">
                <option value="markdown">Markdown</option>
                <option value="html">HTML</option>
                <option value="text">纯文本</option>
              </select>
              <button @click="togglePreview" class="btn btn-secondary btn-sm">
                {{ showPreview ? '编辑' : '预览' }}
              </button>
              <button @click="saveDraft" class="btn btn-info btn-sm" :disabled="saving">
                {{ saving ? '保存中...' : '保存草稿' }}
              </button>
              <button @click="saveDocument" class="btn btn-primary btn-sm" :disabled="saving">
                {{ saving ? '保存中...' : '保存' }}
              </button>
              <button @click="closeEditor" class="btn btn-secondary btn-sm">
                关闭
              </button>
            </div>
          </div>

          <div class="editor-body">
            <!-- 编辑模式 -->
            <div v-if="!showPreview" class="editor-content">
              <textarea
                v-model="editingDocument.content"
                class="content-editor"
                placeholder="开始编写您的文档内容..."
                @input="markAsModified"
                @keydown.ctrl.s.prevent="saveDocument"
                @keydown.meta.s.prevent="saveDocument"
              ></textarea>
              
              <div class="editor-sidebar">
                <div class="sidebar-section">
                  <h4>标签</h4>
                  <div class="tags-input">
                    <div class="tags-list">
                      <span
                        v-for="(tag, index) in editingDocument.tags"
                        :key="index"
                        class="tag"
                      >
                        {{ tag }}
                        <button @click="removeTag(index)" class="tag-remove">×</button>
                      </span>
                    </div>
                    <input
                      v-model="newTag"
                      @keydown.enter.prevent="addTag"
                      @keydown.comma.prevent="addTag"
                      placeholder="添加标签..."
                      class="tag-input"
                    />
                  </div>
                </div>

                <div class="sidebar-section">
                  <h4>统计信息</h4>
                  <div class="stats-grid">
                    <div class="stat-item">
                      <span class="stat-label">字符数:</span>
                      <span class="stat-value">{{ editingDocument.content.length }}</span>
                    </div>
                    <div class="stat-item">
                      <span class="stat-label">单词数:</span>
                      <span class="stat-value">{{ getWordCount(editingDocument.content) }}</span>
                    </div>
                    <div class="stat-item">
                      <span class="stat-label">行数:</span>
                      <span class="stat-value">{{ getLineCount(editingDocument.content) }}</span>
                    </div>
                    <div class="stat-item">
                      <span class="stat-label">大小:</span>
                      <span class="stat-value">{{ formatBytes(getContentSize(editingDocument.content)) }}</span>
                    </div>
                  </div>
                </div>

                <div class="sidebar-section">
                  <h4>操作历史</h4>
                  <div class="history-list">
                    <div class="history-item">
                      <span class="history-time">{{ formatDate(Date.now()) }}</span>
                      <span class="history-action">当前编辑</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 预览模式 -->
            <div v-else class="preview-content">
              <div class="preview-render" v-html="getRenderedContent()"></div>
            </div>
          </div>

          <div class="editor-footer">
            <div class="footer-info">
              <span v-if="isModified" class="modified-indicator">● 已修改</span>
              <span v-if="editingDocument.isOffline" class="offline-indicator">📝 离线编辑</span>
              <span class="save-info">{{ lastSavedText }}</span>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { indexedDBManager, STORES, type DocumentData } from '../utils/indexedDBManager'
import { addOfflineOperation, onSyncStatusChange } from '../utils/offlineSync'

// 响应式数据
const documents = ref<DocumentData[]>([])
const loading = ref(false)
const saving = ref(false)
const error = ref('')
const searchQuery = ref('')
const filterType = ref('')
const viewMode = ref<'grid' | 'list'>('grid')
const sortField = ref('updatedAt')
const sortOrder = ref<'asc' | 'desc'>('desc')
const currentPage = ref(1)
const pageSize = 12

// 编辑器相关
const showEditor = ref(false)
const showPreview = ref(false)
const editingDocument = ref<DocumentData>({
  id: '',
  title: '',
  content: '',
  type: 'markdown',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  size: 0,
  tags: [],
  isOffline: false,
  isDraft: false
})
const isModified = ref(false)
const lastSavedAt = ref<number | null>(null)
const newTag = ref('')

// 存储统计
const storageStats = ref<{ totalSize: number } | null>(null)
const pendingOperations = ref(0)

// 计算属性
const filteredDocuments = computed(() => {
  let filtered = documents.value

  // 搜索过滤
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(doc =>
      doc.title.toLowerCase().includes(query) ||
      doc.content.toLowerCase().includes(query) ||
      doc.tags.some(tag => tag.toLowerCase().includes(query))
    )
  }

  // 类型过滤
  if (filterType.value) {
    filtered = filtered.filter(doc => doc.type === filterType.value)
  }

  // 排序
  filtered.sort((a, b) => {
    let aValue = a[sortField.value as keyof DocumentData]
    let bValue = b[sortField.value as keyof DocumentData]

    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase()
      bValue = (bValue as string).toLowerCase()
    }

    // 处理undefined值
    if (aValue === undefined) aValue = ''
    if (bValue === undefined) bValue = ''

    if (sortOrder.value === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
    }
  })

  return filtered
})

const totalPages = computed(() => Math.ceil(filteredDocuments.value.length / pageSize))

const paginatedDocuments = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  const end = start + pageSize
  return filteredDocuments.value.slice(start, end)
})

const lastSavedText = computed(() => {
  if (!lastSavedAt.value) return '未保存'
  const now = Date.now()
  const diff = now - lastSavedAt.value
  
  if (diff < 60000) return '刚刚保存'
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前保存`
  return `${Math.floor(diff / 3600000)} 小时前保存`
})

// 方法
const refreshDocuments = async () => {
  loading.value = true
  error.value = ''

  try {
    // 从IndexedDB加载文档
    documents.value = await indexedDBManager.getAll<DocumentData>(STORES.DOCUMENTS)
    
    // 更新存储统计
    await updateStorageStats()
    
    console.log(`📄 加载了 ${documents.value.length} 个文档`)
  } catch (err: any) {
    error.value = `加载文档失败: ${err.message}`
    console.error('加载文档失败:', err)
  } finally {
    loading.value = false
  }
}

const updateStorageStats = async () => {
  try {
    const stats = await indexedDBManager.getStorageStats()
    const docStats = stats.find(s => s.storeName === STORES.DOCUMENTS)
    
    storageStats.value = {
      totalSize: docStats?.totalSize || 0
    }
  } catch (error) {
    console.warn('更新存储统计失败:', error)
  }
}

const createNewDocument = () => {
  editingDocument.value = {
    id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    title: '新建文档',
    content: '',
    type: 'markdown',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    size: 0,
    tags: [],
    isOffline: false,
    isDraft: true
  }
  isModified.value = false
  lastSavedAt.value = null
  showEditor.value = true
}

const openDocument = (doc: DocumentData) => {
  editingDocument.value = { ...doc }
  isModified.value = false
  lastSavedAt.value = doc.updatedAt
  showEditor.value = true
}

const editDocument = (doc: DocumentData) => {
  openDocument(doc)
}

const duplicateDocument = async (doc: DocumentData) => {
  const newDoc: DocumentData = {
    ...doc,
    id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    title: `${doc.title} (副本)`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isDraft: true,
    isOffline: !navigator.onLine
  }

  try {
    await saveDocumentToStorage(newDoc)
    documents.value.unshift(newDoc)
    console.log('📋 文档复制成功:', newDoc.title)
  } catch (error) {
    console.error('复制文档失败:', error)
  }
}

const deleteDocument = async (doc: DocumentData) => {
  if (!confirm(`确定要删除文档 "${doc.title}" 吗？`)) {
    return
  }

  try {
    if (!navigator.onLine) {
      // 离线模式：标记删除并添加到同步队列
      const index = documents.value.findIndex(d => d.id === doc.id)
      if (index !== -1) {
        documents.value.splice(index, 1)
      }
      
      await indexedDBManager.delete(STORES.DOCUMENTS, doc.id)
      await addOfflineOperation('DELETE', 'documents', { title: doc.title }, doc.id)
      
      console.log('📝 离线删除文档，已添加到同步队列:', doc.title)
    } else {
      // 在线模式：直接删除
      await indexedDBManager.delete(STORES.DOCUMENTS, doc.id)
      
      const index = documents.value.findIndex(d => d.id === doc.id)
      if (index !== -1) {
        documents.value.splice(index, 1)
      }
      
      console.log('🗑️ 文档删除成功:', doc.title)
    }
    
    await updateStorageStats()
  } catch (error) {
    console.error('删除文档失败:', error)
  }
}

const saveDocument = async () => {
  if (!editingDocument.value.title.trim()) {
    alert('请输入文档标题')
    return
  }

  saving.value = true

  try {
    const doc = {
      ...editingDocument.value,
      updatedAt: Date.now(),
      size: getContentSize(editingDocument.value.content),
      isDraft: false,
      isOffline: !navigator.onLine
    }

    await saveDocumentToStorage(doc)

    // 更新本地列表
    const index = documents.value.findIndex(d => d.id === doc.id)
    if (index !== -1) {
      documents.value[index] = doc
    } else {
      documents.value.unshift(doc)
    }

    // 如果离线，添加到同步队列
    if (!navigator.onLine) {
      const existingDoc = documents.value.find(d => d.id === doc.id)
      if (existingDoc) {
        await addOfflineOperation('UPDATE', 'documents', doc, doc.id)
      } else {
        await addOfflineOperation('CREATE', 'documents', doc)
      }
    }

    editingDocument.value = doc
    isModified.value = false
    lastSavedAt.value = Date.now()
    
    await updateStorageStats()
    
    console.log('💾 文档保存成功:', doc.title)
  } catch (error: any) {
    console.error('保存文档失败:', error)
    const errorMessage = error.message || '未知错误'
    alert(`保存失败: ${errorMessage}\n\n请检查：\n1. 文档标题是否填写\n2. 浏览器存储空间是否充足\n3. 网络连接是否正常`)
  } finally {
    saving.value = false
  }
}

const saveDraft = async () => {
  saving.value = true

  try {
    const doc = {
      ...editingDocument.value,
      updatedAt: Date.now(),
      size: getContentSize(editingDocument.value.content),
      isDraft: true
    }

    await saveDocumentToStorage(doc)

    // 更新本地列表
    const index = documents.value.findIndex(d => d.id === doc.id)
    if (index !== -1) {
      documents.value[index] = doc
    } else {
      documents.value.unshift(doc)
    }

    editingDocument.value = doc
    isModified.value = false
    lastSavedAt.value = Date.now()
    
    await updateStorageStats()
    
    console.log('📝 草稿保存成功:', doc.title)
  } catch (error: any) {
    console.error('保存草稿失败:', error)
    const errorMessage = error.message || '未知错误'
    alert(`保存草稿失败: ${errorMessage}\n\n请检查浏览器存储空间是否充足`)
  } finally {
    saving.value = false
  }
}

const saveDocumentToStorage = async (doc: DocumentData): Promise<void> => {
  try {
    console.log('📄 开始保存文档到存储:', doc.title, `大小: ${doc.size} 字节`)
    
    // 创建一个纯净的数据对象，避免Vue响应式代理和不可序列化的数据
    const cleanDoc: DocumentData = {
      id: doc.id,
      title: doc.title,
      content: doc.content,
      type: doc.type,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      size: doc.size,
      tags: Array.isArray(doc.tags) ? [...doc.tags].filter(tag => typeof tag === 'string') : [],
      isOffline: doc.isOffline || false,
      isDraft: doc.isDraft || false
    }
    
    console.log('🧹 清理后的文档数据:', cleanDoc)
    
    const existingDoc = await indexedDBManager.get<DocumentData>(STORES.DOCUMENTS, cleanDoc.id)
    
    if (existingDoc) {
      console.log('📝 更新现有文档:', cleanDoc.id)
      await indexedDBManager.update(STORES.DOCUMENTS, cleanDoc)
    } else {
      console.log('🆕 创建新文档:', cleanDoc.id)
      await indexedDBManager.add(STORES.DOCUMENTS, cleanDoc)
    }
    
    console.log('✅ 文档保存到存储成功')
  } catch (error: any) {
    console.error('❌ 保存到存储失败:', error)
    console.error('原始文档数据:', doc)
    throw new Error(`存储操作失败: ${error.message}`)
  }
}

const markAsModified = () => {
  isModified.value = true
}

const closeEditor = () => {
  if (isModified.value) {
    if (confirm('文档已修改，确定要关闭吗？未保存的修改将丢失。')) {
      showEditor.value = false
      showPreview.value = false
    }
  } else {
    showEditor.value = false
    showPreview.value = false
  }
}

const toggleViewMode = () => {
  viewMode.value = viewMode.value === 'grid' ? 'list' : 'grid'
}

const togglePreview = () => {
  showPreview.value = !showPreview.value
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

const handleSearch = () => {
  currentPage.value = 1
}

const addTag = () => {
  const tag = newTag.value.trim()
  if (tag && !editingDocument.value.tags.includes(tag)) {
    editingDocument.value.tags.push(tag)
    newTag.value = ''
    markAsModified()
  }
}

const removeTag = (index: number) => {
  editingDocument.value.tags.splice(index, 1)
  markAsModified()
}

const cleanupStorage = async () => {
  if (confirm('确定要清理存储吗？这将删除所有草稿和临时文件。')) {
    try {
      await indexedDBManager.cleanupExpiredData()
      await refreshDocuments()
      console.log('🧹 存储清理完成')
    } catch (error) {
      console.error('清理存储失败:', error)
    }
  }
}

// 工具函数
const getPreview = (content: string) => {
  return content.substring(0, 100) + (content.length > 100 ? '...' : '')
}

const getWordCount = (text: string) => {
  return text.trim() ? text.trim().split(/\s+/).length : 0
}

const getLineCount = (text: string) => {
  return text.split('\n').length
}

const getContentSize = (text: string) => {
  return new TextEncoder().encode(text).length
}

const getRenderedContent = () => {
  const content = editingDocument.value.content
  
  if (editingDocument.value.type === 'html') {
    return content
  } else if (editingDocument.value.type === 'markdown') {
    // 简单的Markdown渲染（实际项目中建议使用marked.js等库）
    return content
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>')
  } else {
    return content.replace(/\n/g, '<br>')
  }
}

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatDate = (timestamp: number) => {
  return new Date(timestamp).toLocaleString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 监听同步状态
let unsubscribeSyncStatus: (() => void) | null = null

onMounted(async () => {
  try {
    // 确保IndexedDB已初始化
    await indexedDBManager.init()
    console.log('📦 IndexedDB初始化完成')
    
    await refreshDocuments()
    
    // 监听同步状态变化
    unsubscribeSyncStatus = onSyncStatusChange((status) => {
      pendingOperations.value = status.pendingOperations
    })
    
    // 自动保存功能
    setInterval(() => {
      if (showEditor.value && isModified.value && editingDocument.value.content.trim()) {
        saveDraft()
      }
    }, 30000) // 每30秒自动保存草稿
  } catch (err: any) {
    console.error('文档管理器初始化失败:', err)
    error.value = '初始化失败，请刷新页面重试'
  }
})

onUnmounted(() => {
  if (unsubscribeSyncStatus) {
    unsubscribeSyncStatus()
  }
})
</script>

<style scoped>
.document-manager {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.manager-header {
  text-align: center;
  margin-bottom: 30px;
}

.manager-header h1 {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: #1f2937;
  margin: 0 0 8px 0;
}

.table-icon {
  font-size: 2rem;
}

.manager-header p {
  color: #6b7280;
  margin: 0;
}

/* 工具栏样式 */
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  gap: 20px;
  flex-wrap: wrap;
}

.toolbar-left {
  display: flex;
  gap: 12px;
  align-items: center;
}

.toolbar-right {
  display: flex;
  gap: 12px;
  align-items: center;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
}

.btn-primary {
  background: #7c3aed;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #6d28d9;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
}

.btn-secondary:hover:not(:disabled) {
  background: #e5e7eb;
}

.btn-info {
  background: #0ea5e9;
  color: white;
}

.btn-info:hover:not(:disabled) {
  background: #0284c7;
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
  font-size: 14px;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.search-box {
  position: relative;
}

.search-input {
  padding: 10px 40px 10px 16px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  width: 250px;
  font-size: 14px;
}

.search-icon {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #6b7280;
}

.filter-select {
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  background: white;
}

/* 存储统计样式 */
.storage-stats {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 12px 16px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  margin-bottom: 20px;
}

.stats-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.stats-label {
  color: #64748b;
  font-size: 14px;
}

.stats-value {
  font-weight: 600;
  color: #1e293b;
}

/* 加载和错误状态 */
.loading-container, .error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f4f6;
  border-top: 4px solid #7c3aed;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

.error-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.retry-btn {
  margin-top: 12px;
  padding: 8px 16px;
  background: #7c3aed;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 80px 20px;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 20px;
  opacity: 0.5;
}

.empty-state h3 {
  color: #374151;
  margin-bottom: 8px;
}

.empty-state p {
  color: #6b7280;
  margin-bottom: 20px;
}

/* 网格视图 */
.documents-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.document-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.document-card:hover {
  border-color: #7c3aed;
  box-shadow: 0 4px 12px rgba(124, 58, 237, 0.1);
}

.document-card.card-offline {
  border-left: 4px solid #f59e0b;
}

.document-card.card-draft {
  border-left: 4px solid #6b7280;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.card-type {
  font-size: 24px;
}

.card-actions {
  display: flex;
  gap: 4px;
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

.action-btn.danger:hover {
  background: #fef2f2;
  color: #ef4444;
}

.card-content {
  margin-bottom: 16px;
}

.card-title {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 8px 0;
  display: flex;
  align-items: center;
  gap: 6px;
}

.card-preview {
  color: #6b7280;
  font-size: 14px;
  line-height: 1.5;
  margin-bottom: 12px;
}

.card-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.tag {
  background: #e0e7ff;
  color: #3730a3;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
}

.card-footer {
  border-top: 1px solid #f3f4f6;
  padding-top: 12px;
}

.card-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #6b7280;
}

/* 列表视图 */
.documents-list {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 30px;
}

.list-header {
  display: grid;
  grid-template-columns: 2fr 100px 100px 150px 120px;
  gap: 16px;
  padding: 16px 20px;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  font-weight: 600;
  color: #374151;
}

.list-col {
  display: flex;
  align-items: center;
  gap: 4px;
}

.list-col.sortable {
  cursor: pointer;
}

.list-row {
  display: grid;
  grid-template-columns: 2fr 100px 100px 150px 120px;
  gap: 16px;
  padding: 16px 20px;
  border-bottom: 1px solid #f3f4f6;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.list-row:hover {
  background: #f8fafc;
}

.list-row.row-offline {
  border-left: 4px solid #f59e0b;
}

.list-row.row-draft {
  border-left: 4px solid #6b7280;
}

.title-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.title-text {
  font-weight: 500;
  color: #1f2937;
}

.type-badge {
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
}

.type-badge.type-markdown {
  background: #dbeafe;
  color: #1e40af;
}

.type-badge.type-html {
  background: #dcfce7;
  color: #166534;
}

.type-badge.type-text {
  background: #f3f4f6;
  color: #374151;
}

/* 徽章样式 */
.offline-badge, .draft-badge {
  font-size: 12px;
  opacity: 0.8;
}

.offline-badge {
  color: #f59e0b;
}

.draft-badge {
  color: #6b7280;
}

/* 排序指示器 */
.sort-indicator {
  font-size: 12px;
  opacity: 0.5;
}

.sort-indicator.sort-asc {
  opacity: 1;
  transform: rotate(180deg);
}

.sort-indicator.sort-desc {
  opacity: 1;
}

/* 分页样式 */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin-top: 30px;
}

.pagination-btn {
  padding: 8px 16px;
  background: #f3f4f6;
  color: #374151;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.pagination-btn:hover:not(:disabled) {
  background: #e5e7eb;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-info {
  font-size: 14px;
  color: #6b7280;
}

/* 编辑器模态框 */
.editor-modal {
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

.editor-container {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 1200px;
  height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.editor-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
}

.editor-title {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 600;
}

.editor-controls {
  display: flex;
  gap: 8px;
  align-items: center;
}

.type-select {
  padding: 6px 8px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 14px;
}

.editor-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.editor-content {
  display: flex;
  flex: 1;
}

.content-editor {
  flex: 1;
  border: none;
  padding: 20px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 14px;
  line-height: 1.6;
  resize: none;
  outline: none;
}

.editor-sidebar {
  width: 300px;
  border-left: 1px solid #e5e7eb;
  background: #f9fafb;
  padding: 20px;
  overflow-y: auto;
}

.sidebar-section {
  margin-bottom: 24px;
}

.sidebar-section h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #374151;
}

.tags-input {
  margin-bottom: 12px;
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
}

.tag {
  background: #e0e7ff;
  color: #3730a3;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.tag-remove {
  background: none;
  border: none;
  color: #3730a3;
  cursor: pointer;
  font-size: 14px;
  padding: 0;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.tag-remove:hover {
  background: rgba(55, 48, 163, 0.1);
}

.tag-input {
  width: 100%;
  padding: 6px 8px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 12px;
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat-label {
  font-size: 11px;
  color: #6b7280;
}

.stat-value {
  font-size: 13px;
  font-weight: 600;
  color: #1f2937;
}

.history-list {
  max-height: 100px;
  overflow-y: auto;
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
  font-size: 11px;
  color: #6b7280;
}

.preview-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.preview-render {
  line-height: 1.6;
  color: #374151;
}

.editor-footer {
  padding: 12px 20px;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.footer-info {
  display: flex;
  gap: 16px;
  align-items: center;
  font-size: 12px;
  color: #6b7280;
}

.modified-indicator {
  color: #f59e0b;
  font-weight: 600;
}

.offline-indicator {
  color: #f59e0b;
}

/* 动画 */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .editor-container,
.modal-leave-to .editor-container {
  transform: scale(0.9);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .toolbar-left,
  .toolbar-right {
    flex-wrap: wrap;
  }

  .search-input {
    width: 100%;
  }

  .documents-grid {
    grid-template-columns: 1fr;
  }

  .list-header,
  .list-row {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .list-header .list-col:not(.col-title),
  .list-row .list-col:not(.col-title) {
    display: none;
  }

  .editor-container {
    height: 95vh;
  }

  .editor-header {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .editor-controls {
    justify-content: center;
    flex-wrap: wrap;
  }

  .editor-content {
    flex-direction: column;
  }

  .editor-sidebar {
    width: 100%;
    max-height: 200px;
  }
}

/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
  .document-manager {
    background: #111827;
    color: #f9fafb;
  }

  .document-card,
  .documents-list,
  .editor-container {
    background: #1f2937;
    border-color: #374151;
  }

  .manager-header h1 {
    color: #f9fafb;
  }

  .btn-secondary {
    background: #374151;
    color: #f9fafb;
  }

  .search-input,
  .filter-select,
  .editor-title,
  .type-select,
  .tag-input {
    background: #374151;
    border-color: #4b5563;
    color: #f9fafb;
  }

  .content-editor {
    background: #1f2937;
    color: #f9fafb;
  }

  .editor-sidebar {
    background: #374151;
  }
}
</style>
