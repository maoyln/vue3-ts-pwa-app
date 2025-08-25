<template>
  <div class="home">
    <!-- 英雄区域 -->
    <div class="hero-section">
      <div class="hero-content">
        <div class="hero-badge">
          <span class="badge-icon">✨</span>
          <span class="badge-text">Vue3 + TypeScript + PWA</span>
        </div>
        <h1 class="hero-title">
          现代化 PWA 应用
          <span class="title-gradient">演示平台</span>
        </h1>
        <p class="hero-desc">
          基于 Vue3 + TypeScript + Vite 构建的渐进式Web应用，
          <br>
          集成了完整的 PWA 功能、智能缓存、离线支持和现代化UI设计
        </p>
        <div class="hero-actions">
          <button class="hero-btn primary" @click="$router.push('/api-demo')">
            <span class="btn-icon">🚀</span>
            体验 API 演示
          </button>
          <button class="hero-btn secondary" @click="$router.push('/pwa-dashboard')">
            <span class="btn-icon">📊</span>
            PWA 控制面板
          </button>
        </div>
      </div>
      <div class="hero-visual">
        <div class="visual-card">
          <div class="card-header">
            <div class="card-dots">
              <span class="dot red"></span>
              <span class="dot yellow"></span>
              <span class="dot green"></span>
            </div>
          </div>
          <div class="card-content">
            <div class="code-line">
              <span class="code-keyword">import</span>
              <span class="code-text"> { createApp } </span>
              <span class="code-keyword">from</span>
              <span class="code-string"> 'vue'</span>
            </div>
            <div class="code-line">
              <span class="code-keyword">import</span>
              <span class="code-text"> App </span>
              <span class="code-keyword">from</span>
              <span class="code-string"> './App.vue'</span>
            </div>
            <div class="code-line">
              <span class="code-comment">// PWA Ready! 🚀</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 功能特性 -->
    <div class="features-section">
      <div class="section-header">
        <h2 class="section-title">核心功能</h2>
        <p class="section-desc">探索现代化Web应用的强大功能</p>
      </div>
      
      <div class="features-grid">
        <!-- 数据管理 -->
        <div class="feature-category">
          <h3 class="category-title">
            <span class="category-icon">🗄️</span>
            数据管理
          </h3>
          <div class="category-cards">
            <div class="feature-card" @click="$router.push('/users')">
              <div class="card-icon">👥</div>
              <div class="card-content">
                <h4>用户管理</h4>
                <p>完整的CRUD操作演示</p>
                <div class="card-tags">
                  <span class="tag">增删改查</span>
                  <span class="tag">离线支持</span>
                </div>
              </div>
            </div>
            
            <div class="feature-card" @click="$router.push('/posts')">
              <div class="card-icon">📝</div>
              <div class="card-content">
                <h4>文章管理</h4>
                <p>文章内容管理系统</p>
                <div class="card-tags">
                  <span class="tag">富文本</span>
                  <span class="tag">分页</span>
                </div>
              </div>
            </div>
            
            <div class="feature-card" @click="$router.push('/comments')">
              <div class="card-icon">💬</div>
              <div class="card-content">
                <h4>评论管理</h4>
                <p>评论内容管理系统</p>
                <div class="card-tags">
                  <span class="tag">实时</span>
                  <span class="tag">筛选</span>
                </div>
              </div>
            </div>
            
            <div class="feature-card" @click="$router.push('/albums')">
              <div class="card-icon">📸</div>
              <div class="card-content">
                <h4>相册管理</h4>
                <p>相册照片管理系统</p>
                <div class="card-tags">
                  <span class="tag">图片</span>
                  <span class="tag">预览</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 应用功能 -->
        <div class="feature-category">
          <h3 class="category-title">
            <span class="category-icon">⚡</span>
            应用功能
          </h3>
          <div class="category-cards">
            <div class="feature-card" @click="$router.push('/weather')">
              <div class="card-icon">🌤️</div>
              <div class="card-content">
                <h4>天气预报</h4>
                <p>实时天气信息查询</p>
                <div class="card-tags">
                  <span class="tag">API集成</span>
                  <span class="tag">定位</span>
                </div>
              </div>
            </div>
            
            <div class="feature-card" @click="$router.push('/news')">
              <div class="card-icon">📰</div>
              <div class="card-content">
                <h4>新闻资讯</h4>
                <p>最新新闻动态获取</p>
                <div class="card-tags">
                  <span class="tag">RSS</span>
                  <span class="tag">推送</span>
                </div>
              </div>
            </div>
            
            <div class="feature-card" @click="$router.push('/documents')">
              <div class="card-icon">📄</div>
              <div class="card-content">
                <h4>文档管理</h4>
                <p>文档存储和管理</p>
                <div class="card-tags">
                  <span class="tag">IndexedDB</span>
                  <span class="tag">离线</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 开发工具 -->
        <div class="feature-category">
          <h3 class="category-title">
            <span class="category-icon">🛠️</span>
            开发工具
          </h3>
          <div class="category-cards">
            <div class="feature-card" @click="$router.push('/api-demo')">
              <div class="card-icon">🚀</div>
              <div class="card-content">
                <h4>API 演示</h4>
                <p>Axios封装功能展示</p>
                <div class="card-tags">
                  <span class="tag">缓存</span>
                  <span class="tag">重试</span>
                </div>
              </div>
            </div>
            
            <div class="feature-card" @click="$router.push('/pwa-dashboard')">
              <div class="card-icon">📊</div>
              <div class="card-content">
                <h4>PWA 控制面板</h4>
                <p>实时监控和管理</p>
                <div class="card-tags">
                  <span class="tag">监控</span>
                  <span class="tag">配置</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 技术栈展示 -->
    <div class="tech-section">
      <div class="section-header">
        <h2 class="section-title">技术栈</h2>
        <p class="section-desc">基于现代化前端技术构建</p>
      </div>
      
      <div class="tech-grid">
        <div class="tech-item">
          <div class="tech-icon vue">Vue</div>
          <div class="tech-info">
            <h4>Vue 3</h4>
            <p>组合式API</p>
          </div>
        </div>
        
        <div class="tech-item">
          <div class="tech-icon ts">TS</div>
          <div class="tech-info">
            <h4>TypeScript</h4>
            <p>类型安全</p>
          </div>
        </div>
        
        <div class="tech-item">
          <div class="tech-icon vite">⚡</div>
          <div class="tech-info">
            <h4>Vite</h4>
            <p>极速构建</p>
          </div>
        </div>
        
        <div class="tech-item">
          <div class="tech-icon pwa">📱</div>
          <div class="tech-info">
            <h4>PWA</h4>
            <p>离线优先</p>
          </div>
        </div>
        
        <div class="tech-item">
          <div class="tech-icon axios">🌐</div>
          <div class="tech-info">
            <h4>Axios</h4>
            <p>HTTP客户端</p>
          </div>
        </div>
        
        <div class="tech-item">
          <div class="tech-icon router">🛣️</div>
          <div class="tech-info">
            <h4>Vue Router</h4>
            <p>路由管理</p>
          </div>
        </div>
      </div>
    </div>

    <!-- PWA 特性展示 -->
    <div class="pwa-section">
      <div class="section-header">
        <h2 class="section-title">PWA 特性</h2>
        <p class="section-desc">现代化Web应用的强大能力</p>
      </div>
      
      <div class="pwa-features">
        <div class="pwa-feature">
          <div class="pwa-icon">📱</div>
          <h4>可安装应用</h4>
          <p>一键安装到桌面，像原生应用一样使用</p>
        </div>
        
        <div class="pwa-feature">
          <div class="pwa-icon">📡</div>
          <h4>离线可用</h4>
          <p>断网情况下依然可以正常使用核心功能</p>
        </div>
        
        <div class="pwa-feature">
          <div class="pwa-icon">🔄</div>
          <h4>自动更新</h4>
          <p>后台自动检测更新，确保使用最新版本</p>
        </div>
        
        <div class="pwa-feature">
          <div class="pwa-icon">⚡</div>
          <h4>极速加载</h4>
          <p>智能缓存策略，毫秒级响应速度</p>
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
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
  overflow-x: hidden;
}

/* 英雄区域 */
.hero-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 60px;
  align-items: center;
  min-height: 100vh;
  padding: 80px 60px;
  max-width: 1400px;
  margin: 0 auto;
  color: white;
}

.hero-content {
  z-index: 2;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.1);
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 24px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.badge-icon {
  font-size: 16px;
}

.hero-title {
  font-size: 3.5rem;
  font-weight: 800;
  line-height: 1.1;
  margin-bottom: 24px;
  letter-spacing: -0.02em;
}

.title-gradient {
  background: linear-gradient(135deg, #ffeaa7 0%, #fab1a0 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-desc {
  font-size: 1.2rem;
  line-height: 1.6;
  opacity: 0.9;
  margin-bottom: 40px;
  max-width: 500px;
}

.hero-actions {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.hero-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 28px;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;
}

.hero-btn.primary {
  background: linear-gradient(135deg, #ffeaa7 0%, #fab1a0 100%);
  color: #2d3436;
}

.hero-btn.primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(255, 234, 167, 0.4);
}

.hero-btn.secondary {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(10px);
}

.hero-btn.secondary:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
}

.btn-icon {
  font-size: 18px;
}

/* 英雄视觉区域 */
.hero-visual {
  display: flex;
  justify-content: center;
  align-items: center;
}

.visual-card {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 24px;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
}

.card-header {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.card-dots {
  display: flex;
  gap: 8px;
}

.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.dot.red { background: #ff5f56; }
.dot.yellow { background: #ffbd2e; }
.dot.green { background: #27ca3f; }

.card-content {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 14px;
  line-height: 1.6;
}

.code-line {
  margin-bottom: 8px;
}

.code-keyword { color: #ff79c6; }
.code-text { color: #f8f8f2; }
.code-string { color: #f1fa8c; }
.code-comment { color: #6272a4; }

/* 功能特性区域 */
.features-section {
  background: white;
  padding: 100px 60px;
}

.section-header {
  text-align: center;
  margin-bottom: 80px;
}

.section-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: #2d3436;
  margin-bottom: 16px;
}

.section-desc {
  font-size: 1.2rem;
  color: #636e72;
  max-width: 600px;
  margin: 0 auto;
}

.features-grid {
  max-width: 1400px;
  margin: 0 auto;
  display: grid;
  gap: 60px;
}

.feature-category {
  background: #f8f9fa;
  border-radius: 20px;
  padding: 40px;
}

.category-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 1.8rem;
  font-weight: 600;
  color: #2d3436;
  margin-bottom: 30px;
}

.category-icon {
  font-size: 2rem;
}

.category-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
}

.feature-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.feature-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
  border-color: #667eea;
}

.card-icon {
  font-size: 2.5rem;
  margin-bottom: 16px;
  display: block;
}

.card-content h4 {
  font-size: 1.3rem;
  font-weight: 600;
  color: #2d3436;
  margin-bottom: 8px;
}

.card-content p {
  color: #636e72;
  line-height: 1.5;
  margin-bottom: 16px;
}

.card-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.tag {
  background: #e3f2fd;
  color: #1976d2;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

/* 技术栈区域 */
.tech-section {
  background: linear-gradient(135deg, #74b9ff 0%, #0984e3 100%);
  padding: 100px 60px;
  color: white;
}

.tech-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 30px;
  max-width: 1200px;
  margin: 0 auto;
}

.tech-item {
  display: flex;
  align-items: center;
  gap: 16px;
  background: rgba(255, 255, 255, 0.1);
  padding: 20px;
  border-radius: 16px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
}

.tech-item:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
}

.tech-icon {
  width: 50px;
  height: 50px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 16px;
}

.tech-icon.vue { background: #4fc08d; color: white; }
.tech-icon.ts { background: #3178c6; color: white; }
.tech-icon.vite { background: #646cff; color: white; }
.tech-icon.pwa { background: #5a0fc8; color: white; }
.tech-icon.axios { background: #5a29e4; color: white; }
.tech-icon.router { background: #42b883; color: white; }

.tech-info h4 {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 4px;
}

.tech-info p {
  font-size: 0.9rem;
  opacity: 0.8;
}

/* PWA特性区域 */
.pwa-section {
  background: #2d3436;
  padding: 100px 60px;
  color: white;
}

.pwa-features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 30px;
  max-width: 1200px;
  margin: 0 auto;
}

.pwa-feature {
  text-align: center;
  padding: 30px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
}

.pwa-feature:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateY(-4px);
}

.pwa-icon {
  font-size: 3rem;
  margin-bottom: 20px;
}

.pwa-feature h4 {
  font-size: 1.3rem;
  font-weight: 600;
  margin-bottom: 12px;
}

.pwa-feature p {
  opacity: 0.8;
  line-height: 1.5;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .hero-section {
    grid-template-columns: 1fr;
    text-align: center;
    padding: 60px 40px;
    gap: 40px;
  }
  
  .hero-title {
    font-size: 2.8rem;
  }
  
  .features-section,
  .tech-section,
  .pwa-section {
    padding: 80px 40px;
  }
}

@media (max-width: 768px) {
  .hero-section {
    padding: 40px 20px;
  }
  
  .hero-title {
    font-size: 2.2rem;
  }
  
  .hero-desc {
    font-size: 1rem;
  }
  
  .hero-actions {
    justify-content: center;
  }
  
  .features-section,
  .tech-section,
  .pwa-section {
    padding: 60px 20px;
  }
  
  .section-title {
    font-size: 2rem;
  }
  
  .feature-category {
    padding: 30px 20px;
  }
  
  .category-cards {
    grid-template-columns: 1fr;
  }
  
  .tech-grid {
    grid-template-columns: 1fr;
  }
  
  .pwa-features {
    grid-template-columns: 1fr;
  }
}

/* 动画效果 */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.feature-card {
  animation: fadeInUp 0.6s ease forwards;
}

.feature-card:nth-child(1) { animation-delay: 0.1s; }
.feature-card:nth-child(2) { animation-delay: 0.2s; }
.feature-card:nth-child(3) { animation-delay: 0.3s; }
.feature-card:nth-child(4) { animation-delay: 0.4s; }

.tech-item {
  animation: fadeInUp 0.6s ease forwards;
}

.tech-item:nth-child(1) { animation-delay: 0.1s; }
.tech-item:nth-child(2) { animation-delay: 0.2s; }
.tech-item:nth-child(3) { animation-delay: 0.3s; }
.tech-item:nth-child(4) { animation-delay: 0.4s; }
.tech-item:nth-child(5) { animation-delay: 0.5s; }
.tech-item:nth-child(6) { animation-delay: 0.6s; }

.pwa-feature {
  animation: fadeInUp 0.6s ease forwards;
}

.pwa-feature:nth-child(1) { animation-delay: 0.1s; }
.pwa-feature:nth-child(2) { animation-delay: 0.2s; }
.pwa-feature:nth-child(3) { animation-delay: 0.3s; }
.pwa-feature:nth-child(4) { animation-delay: 0.4s; }
</style>