<template>
  <div class="home">
    <!-- 欢迎区域 -->
    <div class="welcome-section">
      <h1 class="welcome-title">
        <i class="icon">🏠</i>
        欢迎使用 Vue3 PWA 应用
      </h1>
      <p class="welcome-desc">
        这是一个功能完整的渐进式Web应用(PWA)，支持离线访问、推送通知等功能
      </p>
    </div>

    <!-- 功能卡片 -->
    <div class="feature-grid">
      <div class="feature-card" @click="$router.push('/weather')">
        <div class="card-icon">🌤️</div>
        <h3>天气预报</h3>
        <p>查看实时天气信息</p>
      </div>
      
      <div class="feature-card" @click="$router.push('/news')">
        <div class="card-icon">📰</div>
        <h3>新闻资讯</h3>
        <p>获取最新新闻动态</p>
      </div>
      
      <div class="feature-card" @click="$router.push('/users')">
        <div class="card-icon">👥</div>
        <h3>用户管理</h3>
        <p>完整的CRUD表格示例</p>
      </div>
      
      <div class="feature-card" @click="$router.push('/posts')">
        <div class="card-icon">📝</div>
        <h3>文章管理</h3>
        <p>文章内容管理系统</p>
      </div>
      
      <div class="feature-card" @click="$router.push('/comments')">
        <div class="card-icon">💬</div>
        <h3>评论管理</h3>
        <p>评论内容管理系统</p>
      </div>
      
      <div class="feature-card" @click="$router.push('/albums')">
        <div class="card-icon">📸</div>
        <h3>相册管理</h3>
        <p>相册照片管理系统</p>
      </div>
      
      <div class="feature-card" @click="$router.push('/documents')">
        <div class="card-icon">📄</div>
        <h3>文档管理</h3>
        <p>在线文档编辑器，支持Markdown、HTML和纯文本，离线编辑自动同步</p>
      </div>
      
      <div class="feature-card" @click="$router.push('/about')">
        <div class="card-icon">ℹ️</div>
        <h3>关于应用</h3>
        <p>了解更多应用信息</p>
      </div>
    </div>

    <!-- PWA 功能展示 -->
    <div class="pwa-features">
      <h2>PWA 特性</h2>
      <div class="feature-list">
        <div class="feature-item">
          <span class="feature-icon">📱</span>
          <span>可安装到设备</span>
        </div>
        <div class="feature-item">
          <span class="feature-icon">🔄</span>
          <span>自动更新</span>
        </div>
        <div class="feature-item">
          <span class="feature-icon">📡</span>
          <span>离线可用</span>
        </div>
        <div class="feature-item">
          <span class="feature-icon">⚡</span>
          <span>快速加载</span>
        </div>
      </div>
    </div>

    <!-- 安装提示组件 -->
    <InstallPrompt />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import InstallPrompt from '../components/InstallPrompt.vue'

onMounted(() => {
  console.log('首页已加载')
})
</script>

<style scoped>
.home {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.welcome-section {
  text-align: center;
  margin-bottom: 40px;
  padding: 40px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  color: white;
}

.welcome-title {
  font-size: 2.5rem;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.welcome-title .icon {
  font-size: 3rem;
}

.welcome-desc {
  font-size: 1.1rem;
  opacity: 0.9;
  line-height: 1.6;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
  margin-bottom: 40px;
}

.feature-card {
  background: white;
  padding: 32px 24px;
  border-radius: 12px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
}

.feature-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.card-icon {
  font-size: 3rem;
  margin-bottom: 16px;
}

.feature-card h3 {
  color: #1f2937;
  margin-bottom: 8px;
  font-size: 1.25rem;
}

.feature-card p {
  color: #6b7280;
  line-height: 1.5;
}

.pwa-features {
  background: #f8fafc;
  padding: 32px;
  border-radius: 12px;
  margin-bottom: 40px;
}

.pwa-features h2 {
  text-align: center;
  color: #1f2937;
  margin-bottom: 24px;
  font-size: 1.75rem;
}

.feature-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: white;
  border-radius: 8px;
  font-weight: 500;
  color: #374151;
}

.feature-icon {
  font-size: 1.5rem;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .welcome-title {
    font-size: 2rem;
  }
  
  .welcome-title .icon {
    font-size: 2.5rem;
  }
  
  .feature-grid {
    grid-template-columns: 1fr;
  }
  
  .feature-list {
    grid-template-columns: 1fr;
  }
}
</style>
