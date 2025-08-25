# PWA 最佳实践与优化指南

## 📋 目录

1. [性能优化最佳实践](#1-性能优化最佳实践)
2. [用户体验优化](#2-用户体验优化)
3. [安全性最佳实践](#3-安全性最佳实践)
4. [SEO和可访问性](#4-seo和可访问性)
5. [监控和分析](#5-监控和分析)
6. [部署和维护](#6-部署和维护)
7. [常见问题解决](#7-常见问题解决)
8. [工具和资源](#8-工具和资源)

---

## 1. 性能优化最佳实践

### 1.1 资源加载优化

#### 1.1.1 关键渲染路径优化
```html
<!-- 预连接关键域名 -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://api.example.com">

<!-- 预加载关键资源 -->
<link rel="preload" href="/fonts/main.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/css/critical.css" as="style">

<!-- 预取可能需要的资源 -->
<link rel="prefetch" href="/js/secondary.js">
<link rel="prefetch" href="/images/hero-lg.jpg">

<!-- DNS预解析 -->
<link rel="dns-prefetch" href="//cdn.example.com">
```

#### 1.1.2 代码分割策略
```typescript
// 路由级别的代码分割
const router = createRouter({
  routes: [
    {
      path: '/',
      component: () => import('../views/Home.vue')
    },
    {
      path: '/dashboard',
      component: () => import('../views/Dashboard.vue'),
      // 预加载相关组件
      beforeEnter: () => {
        import('../components/Chart.vue')
        import('../components/DataTable.vue')
      }
    }
  ]
})

// 组件级别的懒加载
const LazyComponent = defineAsyncComponent({
  loader: () => import('./HeavyComponent.vue'),
  loadingComponent: LoadingSpinner,
  errorComponent: ErrorComponent,
  delay: 200,
  timeout: 3000
})

// 条件加载
const ConditionalComponent = defineAsyncComponent(() => {
  if (window.innerWidth > 768) {
    return import('./DesktopComponent.vue')
  } else {
    return import('./MobileComponent.vue')
  }
})
```

#### 1.1.3 资源压缩和优化
```typescript
// Vite配置优化
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['vue', 'vue-router'],
          ui: ['element-plus'],
          utils: ['lodash', 'dayjs']
        }
      }
    },
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  },
  plugins: [
    // 图片优化
    {
      name: 'image-optimization',
      generateBundle(options, bundle) {
        // 压缩图片，生成WebP格式
      }
    }
  ]
})
```

### 1.2 缓存优化策略

#### 1.2.1 多层缓存架构
```typescript
class OptimizedCacheManager {
  private memoryCache = new LRUCache<string, CacheEntry>({ max: 100 })
  private indexedDBCache: IDBDatabase
  private httpCache: Cache

  async get<T>(key: string): Promise<T | null> {
    // 1. 内存缓存 (最快)
    const memoryResult = this.memoryCache.get(key)
    if (memoryResult && !this.isExpired(memoryResult)) {
      return memoryResult.data
    }

    // 2. IndexedDB缓存 (中等速度)
    const dbResult = await this.getFromIndexedDB<T>(key)
    if (dbResult && !this.isExpired(dbResult)) {
      // 回写到内存缓存
      this.memoryCache.set(key, dbResult)
      return dbResult.data
    }

    // 3. HTTP缓存 (网络请求)
    const httpResult = await this.getFromHttpCache<T>(key)
    if (httpResult) {
      // 更新所有缓存层
      this.setAllLayers(key, httpResult)
      return httpResult
    }

    return null
  }

  // 预热缓存
  async warmup(keys: string[]): Promise<void> {
    const promises = keys.map(key => this.get(key))
    await Promise.allSettled(promises)
  }

  // 智能预取
  async predictivePreload(userBehavior: UserBehavior): Promise<void> {
    const predictions = this.analyzeUserPattern(userBehavior)
    
    for (const prediction of predictions) {
      if (prediction.confidence > 0.7) {
        // 高置信度的预测，立即预取
        this.preload(prediction.resource)
      } else if (prediction.confidence > 0.4) {
        // 中等置信度，在空闲时预取
        requestIdleCallback(() => this.preload(prediction.resource))
      }
    }
  }
}
```

#### 1.2.2 缓存失效策略
```typescript
class CacheInvalidationManager {
  private dependencies = new Map<string, Set<string>>()
  private tags = new Map<string, Set<string>>()

  // 基于依赖的失效
  addDependency(parent: string, child: string): void {
    if (!this.dependencies.has(parent)) {
      this.dependencies.set(parent, new Set())
    }
    this.dependencies.get(parent)!.add(child)
  }

  async invalidateWithDependencies(key: string): Promise<void> {
    const toInvalidate = new Set([key])
    const visited = new Set<string>()
    
    const collectDependencies = (currentKey: string) => {
      if (visited.has(currentKey)) return
      visited.add(currentKey)
      
      const deps = this.dependencies.get(currentKey)
      if (deps) {
        deps.forEach(dep => {
          toInvalidate.add(dep)
          collectDependencies(dep)
        })
      }
    }
    
    collectDependencies(key)
    
    // 批量失效
    await Promise.all(
      Array.from(toInvalidate).map(k => this.invalidateCache(k))
    )
  }

  // 基于标签的失效
  addTag(key: string, tag: string): void {
    if (!this.tags.has(tag)) {
      this.tags.set(tag, new Set())
    }
    this.tags.get(tag)!.add(key)
  }

  async invalidateByTag(tag: string): Promise<void> {
    const keys = this.tags.get(tag)
    if (keys) {
      await Promise.all(
        Array.from(keys).map(key => this.invalidateCache(key))
      )
    }
  }
}
```

### 1.3 网络优化

#### 1.3.1 请求优化
```typescript
class RequestOptimizer {
  private requestQueue = new Map<string, Promise<any>>()
  private batchQueue = new Map<string, BatchRequest[]>()
  private rateLimiter = new RateLimiter()

  // 请求去重
  async deduplicate<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    if (this.requestQueue.has(key)) {
      return this.requestQueue.get(key)!
    }

    const promise = requestFn()
    this.requestQueue.set(key, promise)

    try {
      return await promise
    } finally {
      this.requestQueue.delete(key)
    }
  }

  // 请求批处理
  batch<T>(endpoint: string, params: any): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.batchQueue.has(endpoint)) {
        this.batchQueue.set(endpoint, [])
      }

      this.batchQueue.get(endpoint)!.push({ params, resolve, reject })

      // 延迟执行批处理
      setTimeout(() => this.executeBatch(endpoint), 10)
    })
  }

  // 智能重试
  async retryWithBackoff<T>(
    requestFn: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<T> {
    const {
      maxRetries = 3,
      baseDelay = 1000,
      maxDelay = 10000,
      backoffFactor = 2,
      retryCondition = (error) => error.status >= 500
    } = options

    let lastError: Error
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await requestFn()
      } catch (error) {
        lastError = error as Error
        
        if (attempt === maxRetries || !retryCondition(error as any)) {
          throw error
        }

        const delay = Math.min(
          baseDelay * Math.pow(backoffFactor, attempt),
          maxDelay
        )
        
        // 添加随机抖动
        const jitteredDelay = delay + Math.random() * 1000
        await new Promise(resolve => setTimeout(resolve, jitteredDelay))
      }
    }

    throw lastError!
  }

  // 请求优先级管理
  async prioritizedRequest<T>(
    requestFn: () => Promise<T>,
    priority: 'high' | 'normal' | 'low' = 'normal'
  ): Promise<T> {
    await this.rateLimiter.acquire(priority)
    
    try {
      return await requestFn()
    } finally {
      this.rateLimiter.release(priority)
    }
  }
}

class RateLimiter {
  private queues = {
    high: [] as (() => void)[],
    normal: [] as (() => void)[],
    low: [] as (() => void)[]
  }
  private activeRequests = 0
  private readonly maxConcurrent = 6

  async acquire(priority: 'high' | 'normal' | 'low'): Promise<void> {
    return new Promise(resolve => {
      if (this.activeRequests < this.maxConcurrent) {
        this.activeRequests++
        resolve()
      } else {
        this.queues[priority].push(resolve)
      }
    })
  }

  release(priority: 'high' | 'normal' | 'low'): void {
    this.activeRequests--
    
    // 按优先级处理队列
    const nextRequest = 
      this.queues.high.shift() ||
      this.queues.normal.shift() ||
      this.queues.low.shift()
    
    if (nextRequest) {
      this.activeRequests++
      nextRequest()
    }
  }
}
```

---

## 2. 用户体验优化

### 2.1 加载体验优化

#### 2.1.1 渐进式加载
```vue
<template>
  <div class="progressive-image">
    <!-- 占位符 -->
    <div 
      v-if="!imageLoaded" 
      class="placeholder"
      :style="{ backgroundColor: dominantColor }"
    >
      <div class="skeleton-animation"></div>
    </div>
    
    <!-- 低质量图片 -->
    <img
      v-if="showLowQuality && !imageLoaded"
      :src="lowQualitySrc"
      class="low-quality-image"
      @load="onLowQualityLoad"
    />
    
    <!-- 高质量图片 -->
    <img
      v-show="imageLoaded"
      :src="highQualitySrc"
      class="high-quality-image"
      @load="onImageLoad"
      @error="onImageError"
    />
  </div>
</template>

<script setup lang="ts">
interface Props {
  src: string
  lowQualitySrc?: string
  dominantColor?: string
  alt: string
}

const props = withDefaults(defineProps<Props>(), {
  dominantColor: '#f0f0f0'
})

const imageLoaded = ref(false)
const showLowQuality = ref(!!props.lowQualitySrc)

const onLowQualityLoad = () => {
  // 开始加载高质量图片
  const img = new Image()
  img.src = props.src
  img.onload = onImageLoad
  img.onerror = onImageError
}

const onImageLoad = () => {
  imageLoaded.value = true
}

const onImageError = () => {
  console.error('Failed to load image:', props.src)
}

// 使用Intersection Observer懒加载
const { stop } = useIntersectionObserver(
  target,
  ([{ isIntersecting }]) => {
    if (isIntersecting) {
      if (props.lowQualitySrc) {
        // 先加载低质量图片
        const lowImg = new Image()
        lowImg.src = props.lowQualitySrc
        lowImg.onload = onLowQualityLoad
      } else {
        // 直接加载高质量图片
        const img = new Image()
        img.src = props.src
        img.onload = onImageLoad
        img.onerror = onImageError
      }
      stop()
    }
  },
  { threshold: 0.1 }
)
</script>
```

#### 2.1.2 智能预加载
```typescript
class IntelligentPreloader {
  private preloadQueue: PreloadItem[] = []
  private isPreloading = false
  private networkConditions: NetworkConditions
  
  constructor() {
    this.networkConditions = this.getNetworkConditions()
    this.monitorNetworkChanges()
  }

  async preload(items: PreloadItem[]): Promise<void> {
    // 根据网络条件过滤预加载项
    const filteredItems = this.filterByNetworkConditions(items)
    
    this.preloadQueue.push(...filteredItems)
    
    if (!this.isPreloading) {
      this.processQueue()
    }
  }

  private async processQueue(): Promise<void> {
    if (this.preloadQueue.length === 0 || this.isPreloading) return
    
    this.isPreloading = true
    
    // 按优先级排序
    this.preloadQueue.sort((a, b) => b.priority - a.priority)
    
    while (this.preloadQueue.length > 0) {
      const item = this.preloadQueue.shift()!
      
      try {
        await this.preloadItem(item)
      } catch (error) {
        console.warn('Preload failed:', item.url, error)
      }
      
      // 在慢速网络下增加延迟
      if (this.networkConditions.effectiveType === 'slow-2g' || 
          this.networkConditions.effectiveType === '2g') {
        await this.delay(1000)
      }
      
      // 检查是否应该继续预加载
      if (!this.shouldContinuePreloading()) {
        break
      }
    }
    
    this.isPreloading = false
  }

  private filterByNetworkConditions(items: PreloadItem[]): PreloadItem[] {
    const { effectiveType, saveData } = this.networkConditions
    
    if (saveData) {
      // 数据节省模式，只预加载关键资源
      return items.filter(item => item.critical)
    }
    
    switch (effectiveType) {
      case '4g':
        return items // 预加载所有
      case '3g':
        return items.filter(item => item.priority >= 2)
      case '2g':
      case 'slow-2g':
        return items.filter(item => item.critical)
      default:
        return items
    }
  }

  private shouldContinuePreloading(): boolean {
    // 检查设备资源
    if ('memory' in navigator && (navigator as any).memory.usedJSHeapSize > 100 * 1024 * 1024) {
      return false // 内存使用过多
    }
    
    // 检查电池状态
    if ('getBattery' in navigator) {
      navigator.getBattery().then((battery: any) => {
        if (battery.level < 0.2 && !battery.charging) {
          return false // 电量低且未充电
        }
      })
    }
    
    // 检查页面可见性
    if (document.hidden) {
      return false
    }
    
    return true
  }

  private getNetworkConditions(): NetworkConditions {
    const connection = (navigator as any).connection || 
                      (navigator as any).mozConnection || 
                      (navigator as any).webkitConnection

    return {
      effectiveType: connection?.effectiveType || '4g',
      downlink: connection?.downlink || 10,
      rtt: connection?.rtt || 100,
      saveData: connection?.saveData || false
    }
  }
}

interface PreloadItem {
  url: string
  type: 'image' | 'script' | 'style' | 'font'
  priority: number // 1-5, 5最高
  critical: boolean
  size?: number
}

interface NetworkConditions {
  effectiveType: string
  downlink: number
  rtt: number
  saveData: boolean
}
```

### 2.2 交互体验优化

#### 2.2.1 触摸和手势优化
```typescript
class TouchOptimizer {
  private element: HTMLElement
  private touchStartTime: number = 0
  private touchStartPos: { x: number; y: number } = { x: 0, y: 0 }
  
  constructor(element: HTMLElement) {
    this.element = element
    this.init()
  }

  private init(): void {
    // 优化触摸响应
    this.element.style.touchAction = 'manipulation'
    this.element.style.webkitTapHighlightColor = 'transparent'
    
    // 添加触摸事件监听
    this.element.addEventListener('touchstart', this.onTouchStart.bind(this), { passive: true })
    this.element.addEventListener('touchend', this.onTouchEnd.bind(this), { passive: true })
    this.element.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: true })
  }

  private onTouchStart(e: TouchEvent): void {
    this.touchStartTime = Date.now()
    const touch = e.touches[0]
    this.touchStartPos = { x: touch.clientX, y: touch.clientY }
    
    // 添加触摸反馈
    this.element.classList.add('touch-active')
  }

  private onTouchEnd(e: TouchEvent): void {
    const touchEndTime = Date.now()
    const touchDuration = touchEndTime - this.touchStartTime
    
    // 移除触摸反馈
    this.element.classList.remove('touch-active')
    
    // 检测快速点击
    if (touchDuration < 200) {
      this.handleFastTap(e)
    }
  }

  private onTouchMove(e: TouchEvent): void {
    const touch = e.touches[0]
    const deltaX = Math.abs(touch.clientX - this.touchStartPos.x)
    const deltaY = Math.abs(touch.clientY - this.touchStartPos.y)
    
    // 如果移动距离太大，取消触摸反馈
    if (deltaX > 10 || deltaY > 10) {
      this.element.classList.remove('touch-active')
    }
  }

  private handleFastTap(e: TouchEvent): void {
    // 防止双击缩放
    e.preventDefault()
    
    // 触发自定义点击事件
    this.element.dispatchEvent(new CustomEvent('fastTap', {
      detail: { originalEvent: e }
    }))
  }
}

// 手势识别
class GestureRecognizer {
  private startTouches: Touch[] = []
  private callbacks: Map<string, Function> = new Map()

  constructor(private element: HTMLElement) {
    this.init()
  }

  private init(): void {
    this.element.addEventListener('touchstart', this.onTouchStart.bind(this))
    this.element.addEventListener('touchmove', this.onTouchMove.bind(this))
    this.element.addEventListener('touchend', this.onTouchEnd.bind(this))
  }

  on(gesture: string, callback: Function): void {
    this.callbacks.set(gesture, callback)
  }

  private onTouchStart(e: TouchEvent): void {
    this.startTouches = Array.from(e.touches)
  }

  private onTouchMove(e: TouchEvent): void {
    if (this.startTouches.length === 2 && e.touches.length === 2) {
      this.detectPinch(e)
    } else if (this.startTouches.length === 1 && e.touches.length === 1) {
      this.detectSwipe(e)
    }
  }

  private detectPinch(e: TouchEvent): void {
    const touch1 = e.touches[0]
    const touch2 = e.touches[1]
    const startTouch1 = this.startTouches[0]
    const startTouch2 = this.startTouches[1]

    const startDistance = this.getDistance(startTouch1, startTouch2)
    const currentDistance = this.getDistance(touch1, touch2)
    const scale = currentDistance / startDistance

    const callback = this.callbacks.get('pinch')
    if (callback) {
      callback({ scale, center: this.getCenter(touch1, touch2) })
    }
  }

  private detectSwipe(e: TouchEvent): void {
    const touch = e.touches[0]
    const startTouch = this.startTouches[0]
    
    const deltaX = touch.clientX - startTouch.clientX
    const deltaY = touch.clientY - startTouch.clientY
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
    
    if (distance > 50) {
      const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI
      let direction: string
      
      if (angle > -45 && angle <= 45) direction = 'right'
      else if (angle > 45 && angle <= 135) direction = 'down'
      else if (angle > 135 || angle <= -135) direction = 'left'
      else direction = 'up'
      
      const callback = this.callbacks.get('swipe')
      if (callback) {
        callback({ direction, distance, deltaX, deltaY })
      }
    }
  }

  private getDistance(touch1: Touch, touch2: Touch): number {
    const dx = touch1.clientX - touch2.clientX
    const dy = touch1.clientY - touch2.clientY
    return Math.sqrt(dx * dx + dy * dy)
  }

  private getCenter(touch1: Touch, touch2: Touch): { x: number; y: number } {
    return {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2
    }
  }
}
```

#### 2.2.2 动画性能优化
```typescript
class AnimationOptimizer {
  private animationFrame: number | null = null
  private isAnimating = false
  private observers: IntersectionObserver[] = []

  // 使用transform而非改变layout属性
  animateTransform(
    element: HTMLElement,
    from: TransformValues,
    to: TransformValues,
    duration: number = 300
  ): Promise<void> {
    return new Promise((resolve) => {
      const startTime = performance.now()
      
      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime
        const progress = Math.min(elapsed / duration, 1)
        
        // 使用easing函数
        const eased = this.easeOutCubic(progress)
        
        // 计算当前值
        const current = this.interpolateTransform(from, to, eased)
        
        // 应用变换
        element.style.transform = this.buildTransformString(current)
        
        if (progress < 1) {
          this.animationFrame = requestAnimationFrame(animate)
        } else {
          resolve()
        }
      }
      
      this.animationFrame = requestAnimationFrame(animate)
    })
  }

  // 批量动画，避免layout thrashing
  batchAnimate(animations: Animation[]): Promise<void[]> {
    return new Promise((resolve) => {
      const startTime = performance.now()
      const maxDuration = Math.max(...animations.map(a => a.duration))
      
      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime
        const globalProgress = Math.min(elapsed / maxDuration, 1)
        
        // 批量更新所有元素
        animations.forEach(animation => {
          const progress = Math.min(elapsed / animation.duration, 1)
          const eased = this.easeOutCubic(progress)
          
          animation.element.style.transform = this.interpolateTransformString(
            animation.from,
            animation.to,
            eased
          )
        })
        
        if (globalProgress < 1) {
          this.animationFrame = requestAnimationFrame(animate)
        } else {
          resolve(animations.map(() => Promise.resolve()))
        }
      }
      
      this.animationFrame = requestAnimationFrame(animate)
    })
  }

  // 视口内动画优化
  animateOnVisible(
    element: HTMLElement,
    animationFn: () => void,
    options: IntersectionObserverInit = {}
  ): void {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animationFn()
          observer.unobserve(entry.target)
        }
      })
    }, { threshold: 0.1, ...options })
    
    observer.observe(element)
    this.observers.push(observer)
  }

  // 节流动画
  throttledAnimate(
    callback: () => void,
    fps: number = 60
  ): () => void {
    const interval = 1000 / fps
    let lastTime = 0
    
    return () => {
      const currentTime = performance.now()
      if (currentTime - lastTime >= interval) {
        callback()
        lastTime = currentTime
      }
    }
  }

  private easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3)
  }

  private interpolateTransform(
    from: TransformValues,
    to: TransformValues,
    progress: number
  ): TransformValues {
    return {
      x: from.x + (to.x - from.x) * progress,
      y: from.y + (to.y - from.y) * progress,
      scale: from.scale + (to.scale - from.scale) * progress,
      rotate: from.rotate + (to.rotate - from.rotate) * progress
    }
  }

  private buildTransformString(values: TransformValues): string {
    return `translate3d(${values.x}px, ${values.y}px, 0) scale(${values.scale}) rotate(${values.rotate}deg)`
  }

  destroy(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame)
    }
    
    this.observers.forEach(observer => observer.disconnect())
    this.observers = []
  }
}

interface TransformValues {
  x: number
  y: number
  scale: number
  rotate: number
}

interface Animation {
  element: HTMLElement
  from: TransformValues
  to: TransformValues
  duration: number
}
```

---

## 3. 安全性最佳实践

### 3.1 Content Security Policy (CSP)

#### 3.1.1 严格的CSP配置
```html
<!-- 生产环境CSP配置 -->
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'nonce-{{nonce}}' https://www.googletagmanager.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data: https: blob:;
  connect-src 'self' https://api.example.com wss://ws.example.com;
  worker-src 'self';
  manifest-src 'self';
  media-src 'self' https://media.example.com;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
  block-all-mixed-content;
">
```

#### 3.1.2 动态CSP管理
```typescript
class CSPManager {
  private nonce: string
  private allowedSources = new Set<string>()

  constructor() {
    this.nonce = this.generateNonce()
    this.setupCSP()
  }

  private generateNonce(): string {
    const array = new Uint8Array(16)
    crypto.getRandomValues(array)
    return btoa(String.fromCharCode.apply(null, Array.from(array)))
  }

  private setupCSP(): void {
    // 动态设置CSP
    const meta = document.createElement('meta')
    meta.httpEquiv = 'Content-Security-Policy'
    meta.content = this.buildCSPString()
    document.head.appendChild(meta)
  }

  addTrustedSource(directive: string, source: string): void {
    this.allowedSources.add(`${directive} ${source}`)
    this.updateCSP()
  }

  private buildCSPString(): string {
    const basePolicy = {
      'default-src': ["'self'"],
      'script-src': ["'self'", `'nonce-${this.nonce}'`],
      'style-src': ["'self'", "'unsafe-inline'"],
      'img-src': ["'self'", 'data:', 'https:'],
      'connect-src': ["'self'"],
      'worker-src': ["'self'"],
      'manifest-src': ["'self'"],
      'object-src': ["'none'"],
      'base-uri': ["'self'"],
      'form-action': ["'self'"],
      'frame-ancestors': ["'none'"]
    }

    // 添加动态允许的源
    for (const source of this.allowedSources) {
      const [directive, value] = source.split(' ', 2)
      if (basePolicy[directive]) {
        basePolicy[directive].push(value)
      }
    }

    return Object.entries(basePolicy)
      .map(([key, values]) => `${key} ${values.join(' ')}`)
      .join('; ')
  }

  getNonce(): string {
    return this.nonce
  }

  // 验证脚本安全性
  validateScript(scriptContent: string): boolean {
    // 检查危险模式
    const dangerousPatterns = [
      /eval\s*\(/,
      /Function\s*\(/,
      /innerHTML\s*=/,
      /document\.write/,
      /setTimeout\s*\(\s*['"`]/,
      /setInterval\s*\(\s*['"`]/
    ]

    return !dangerousPatterns.some(pattern => pattern.test(scriptContent))
  }
}
```

### 3.2 数据安全

#### 3.2.1 敏感数据处理
```typescript
class SecureDataManager {
  private encryptionKey: CryptoKey | null = null
  private readonly ENCRYPTION_ALGORITHM = 'AES-GCM'
  private readonly KEY_LENGTH = 256

  async init(): Promise<void> {
    // 生成或恢复加密密钥
    this.encryptionKey = await this.getOrCreateKey()
  }

  async encryptSensitiveData(data: string): Promise<string> {
    if (!this.encryptionKey) {
      throw new Error('Encryption key not initialized')
    }

    const encoder = new TextEncoder()
    const dataBuffer = encoder.encode(data)
    const iv = crypto.getRandomValues(new Uint8Array(12))

    const encryptedBuffer = await crypto.subtle.encrypt(
      { name: this.ENCRYPTION_ALGORITHM, iv },
      this.encryptionKey,
      dataBuffer
    )

    // 合并IV和加密数据
    const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength)
    combined.set(iv)
    combined.set(new Uint8Array(encryptedBuffer), iv.length)

    return btoa(String.fromCharCode(...combined))
  }

  async decryptSensitiveData(encryptedData: string): Promise<string> {
    if (!this.encryptionKey) {
      throw new Error('Encryption key not initialized')
    }

    const combined = new Uint8Array(
      atob(encryptedData).split('').map(char => char.charCodeAt(0))
    )

    const iv = combined.slice(0, 12)
    const encrypted = combined.slice(12)

    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: this.ENCRYPTION_ALGORITHM, iv },
      this.encryptionKey,
      encrypted
    )

    const decoder = new TextDecoder()
    return decoder.decode(decryptedBuffer)
  }

  // 安全存储敏感数据
  async secureStore(key: string, data: any): Promise<void> {
    const serialized = JSON.stringify(data)
    const encrypted = await this.encryptSensitiveData(serialized)
    
    // 添加完整性检查
    const hash = await this.calculateHash(serialized)
    const secureData = { encrypted, hash }
    
    localStorage.setItem(key, JSON.stringify(secureData))
  }

  async secureRetrieve(key: string): Promise<any> {
    const stored = localStorage.getItem(key)
    if (!stored) return null

    const secureData = JSON.parse(stored)
    const decrypted = await this.decryptSensitiveData(secureData.encrypted)
    
    // 验证完整性
    const calculatedHash = await this.calculateHash(decrypted)
    if (calculatedHash !== secureData.hash) {
      throw new Error('Data integrity check failed')
    }

    return JSON.parse(decrypted)
  }

  private async getOrCreateKey(): Promise<CryptoKey> {
    // 在实际应用中，密钥应该从安全的地方获取
    // 这里为了演示，生成一个新的密钥
    return crypto.subtle.generateKey(
      { name: this.ENCRYPTION_ALGORITHM, length: this.KEY_LENGTH },
      false,
      ['encrypt', 'decrypt']
    )
  }

  private async calculateHash(data: string): Promise<string> {
    const encoder = new TextEncoder()
    const dataBuffer = encoder.encode(data)
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }

  // 清理敏感数据
  secureClear(key: string): void {
    localStorage.removeItem(key)
    
    // 清理内存中的敏感数据
    if ('gc' in window) {
      (window as any).gc()
    }
  }
}
```

### 3.3 网络安全

#### 3.3.1 请求安全验证
```typescript
class RequestSecurity {
  private csrfToken: string | null = null
  private trustedDomains = new Set(['api.example.com'])

  async init(): Promise<void> {
    this.csrfToken = await this.fetchCSRFToken()
  }

  // 验证请求URL
  validateRequestURL(url: string): boolean {
    try {
      const urlObj = new URL(url)
      
      // 检查协议
      if (!['https:', 'wss:'].includes(urlObj.protocol)) {
        return false
      }
      
      // 检查域名白名单
      if (!this.trustedDomains.has(urlObj.hostname)) {
        return false
      }
      
      return true
    } catch {
      return false
    }
  }

  // 安全的请求包装
  async secureRequest(url: string, options: RequestInit = {}): Promise<Response> {
    if (!this.validateRequestURL(url)) {
      throw new Error('Untrusted request URL')
    }

    // 添加安全头
    const secureHeaders = {
      'X-Requested-With': 'XMLHttpRequest',
      'X-CSRF-Token': this.csrfToken || '',
      'Content-Type': 'application/json',
      ...options.headers
    }

    const secureOptions: RequestInit = {
      ...options,
      headers: secureHeaders,
      credentials: 'same-origin',
      mode: 'cors'
    }

    // 添加请求签名（如果需要）
    if (options.method === 'POST' || options.method === 'PUT') {
      secureOptions.body = await this.signRequest(options.body as string)
    }

    const response = await fetch(url, secureOptions)
    
    // 验证响应
    if (!this.validateResponse(response)) {
      throw new Error('Invalid response')
    }

    return response
  }

  private async fetchCSRFToken(): Promise<string> {
    try {
      const response = await fetch('/api/csrf-token')
      const data = await response.json()
      return data.token
    } catch {
      console.warn('Failed to fetch CSRF token')
      return ''
    }
  }

  private async signRequest(body: string): Promise<string> {
    if (!body) return body

    // 简单的请求签名示例
    const timestamp = Date.now().toString()
    const signature = await this.calculateSignature(body + timestamp)
    
    const signedBody = {
      data: JSON.parse(body),
      timestamp,
      signature
    }

    return JSON.stringify(signedBody)
  }

  private async calculateSignature(data: string): Promise<string> {
    const encoder = new TextEncoder()
    const dataBuffer = encoder.encode(data)
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }

  private validateResponse(response: Response): boolean {
    // 检查响应头
    const contentType = response.headers.get('content-type')
    if (contentType && !contentType.includes('application/json')) {
      return false
    }

    // 检查状态码
    if (!response.ok) {
      return false
    }

    return true
  }
}
```

---

## 4. SEO和可访问性

### 4.1 SEO优化

#### 4.1.1 结构化数据
```typescript
class SEOManager {
  private structuredData: Map<string, any> = new Map()

  addStructuredData(type: string, data: any): void {
    this.structuredData.set(type, data)
    this.updateStructuredDataScript()
  }

  private updateStructuredDataScript(): void {
    // 移除现有的结构化数据脚本
    const existingScript = document.querySelector('script[type="application/ld+json"]')
    if (existingScript) {
      existingScript.remove()
    }

    // 创建新的结构化数据脚本
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    
    const allData = Array.from(this.structuredData.values())
    script.textContent = JSON.stringify(allData.length === 1 ? allData[0] : allData)
    
    document.head.appendChild(script)
  }

  // 设置页面元数据
  setPageMetadata(metadata: PageMetadata): void {
    document.title = metadata.title
    
    this.setMetaTag('description', metadata.description)
    this.setMetaTag('keywords', metadata.keywords?.join(', '))
    
    // Open Graph
    this.setMetaTag('og:title', metadata.title, 'property')
    this.setMetaTag('og:description', metadata.description, 'property')
    this.setMetaTag('og:image', metadata.image, 'property')
    this.setMetaTag('og:url', metadata.url, 'property')
    this.setMetaTag('og:type', metadata.type || 'website', 'property')
    
    // Twitter Card
    this.setMetaTag('twitter:card', 'summary_large_image', 'name')
    this.setMetaTag('twitter:title', metadata.title, 'name')
    this.setMetaTag('twitter:description', metadata.description, 'name')
    this.setMetaTag('twitter:image', metadata.image, 'name')
    
    // 结构化数据
    if (metadata.structuredData) {
      this.addStructuredData('webpage', {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: metadata.title,
        description: metadata.description,
        url: metadata.url,
        image: metadata.image
      })
    }
  }

  private setMetaTag(name: string, content: string | undefined, attribute: string = 'name'): void {
    if (!content) return

    let meta = document.querySelector(`meta[${attribute}="${name}"]`)
    if (!meta) {
      meta = document.createElement('meta')
      meta.setAttribute(attribute, name)
      document.head.appendChild(meta)
    }
    meta.setAttribute('content', content)
  }

  // 生成站点地图
  generateSitemap(routes: Route[]): string {
    const urls = routes.map(route => {
      return `
    <url>
      <loc>${route.url}</loc>
      <lastmod>${route.lastmod || new Date().toISOString()}</lastmod>
      <changefreq>${route.changefreq || 'weekly'}</changefreq>
      <priority>${route.priority || '0.5'}</priority>
    </url>`
    }).join('')

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`
  }
}

interface PageMetadata {
  title: string
  description: string
  keywords?: string[]
  image?: string
  url?: string
  type?: string
  structuredData?: boolean
}

interface Route {
  url: string
  lastmod?: string
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
  priority?: string
}
```

### 4.2 可访问性优化

#### 4.2.1 无障碍访问支持
```typescript
class AccessibilityManager {
  private announcer: HTMLElement
  private focusTracker: FocusTracker

  constructor() {
    this.createAnnouncer()
    this.focusTracker = new FocusTracker()
    this.init()
  }

  private init(): void {
    // 键盘导航支持
    this.setupKeyboardNavigation()
    
    // 焦点管理
    this.setupFocusManagement()
    
    // 屏幕阅读器支持
    this.setupScreenReaderSupport()
  }

  // 创建屏幕阅读器公告区域
  private createAnnouncer(): void {
    this.announcer = document.createElement('div')
    this.announcer.setAttribute('aria-live', 'polite')
    this.announcer.setAttribute('aria-atomic', 'true')
    this.announcer.className = 'sr-only'
    this.announcer.style.cssText = `
      position: absolute !important;
      width: 1px !important;
      height: 1px !important;
      padding: 0 !important;
      margin: -1px !important;
      overflow: hidden !important;
      clip: rect(0, 0, 0, 0) !important;
      white-space: nowrap !important;
      border: 0 !important;
    `
    document.body.appendChild(this.announcer)
  }

  // 向屏幕阅读器宣布消息
  announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    this.announcer.setAttribute('aria-live', priority)
    this.announcer.textContent = message
    
    // 清除消息以便下次宣布
    setTimeout(() => {
      this.announcer.textContent = ''
    }, 1000)
  }

  // 设置键盘导航
  private setupKeyboardNavigation(): void {
    document.addEventListener('keydown', (e) => {
      // 跳过链接功能
      if (e.key === 'Tab' && e.ctrlKey) {
        e.preventDefault()
        this.skipToMainContent()
      }
      
      // ESC键关闭模态框
      if (e.key === 'Escape') {
        this.closeTopModal()
      }
      
      // 方向键导航
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        this.handleArrowNavigation(e)
      }
    })
  }

  private skipToMainContent(): void {
    const main = document.querySelector('main') || document.querySelector('[role="main"]')
    if (main) {
      (main as HTMLElement).focus()
      this.announce('跳转到主要内容')
    }
  }

  private closeTopModal(): void {
    const modal = document.querySelector('[role="dialog"]:last-of-type')
    if (modal) {
      const closeButton = modal.querySelector('[aria-label*="关闭"], [aria-label*="close"]')
      if (closeButton) {
        (closeButton as HTMLElement).click()
      }
    }
  }

  private handleArrowNavigation(e: KeyboardEvent): void {
    const activeElement = document.activeElement as HTMLElement
    const parent = activeElement?.closest('[role="menu"], [role="listbox"], [role="grid"]')
    
    if (parent) {
      e.preventDefault()
      this.navigateInContainer(parent, e.key, activeElement)
    }
  }

  private navigateInContainer(container: Element, key: string, current: HTMLElement): void {
    const items = Array.from(container.querySelectorAll('[role="menuitem"], [role="option"], [role="gridcell"]'))
    const currentIndex = items.indexOf(current)
    
    let nextIndex = currentIndex
    
    switch (key) {
      case 'ArrowDown':
        nextIndex = (currentIndex + 1) % items.length
        break
      case 'ArrowUp':
        nextIndex = currentIndex === 0 ? items.length - 1 : currentIndex - 1
        break
      case 'ArrowRight':
        if (container.getAttribute('role') === 'grid') {
          // Grid navigation logic
          nextIndex = this.getNextGridCell(container, currentIndex, 'right')
        }
        break
      case 'ArrowLeft':
        if (container.getAttribute('role') === 'grid') {
          nextIndex = this.getNextGridCell(container, currentIndex, 'left')
        }
        break
    }
    
    if (nextIndex !== currentIndex && items[nextIndex]) {
      (items[nextIndex] as HTMLElement).focus()
    }
  }

  // 焦点管理
  private setupFocusManagement(): void {
    // 焦点陷阱
    this.setupFocusTrap()
    
    // 焦点指示器
    this.setupFocusIndicator()
  }

  private setupFocusTrap(): void {
    document.addEventListener('focusin', (e) => {
      const modal = document.querySelector('[role="dialog"]:last-of-type')
      if (modal && !modal.contains(e.target as Node)) {
        const firstFocusable = this.getFirstFocusableElement(modal)
        if (firstFocusable) {
          firstFocusable.focus()
        }
      }
    })
  }

  private getFirstFocusableElement(container: Element): HTMLElement | null {
    const focusableSelector = `
      a[href],
      button:not([disabled]),
      input:not([disabled]),
      select:not([disabled]),
      textarea:not([disabled]),
      [tabindex]:not([tabindex="-1"])
    `
    
    const focusableElements = container.querySelectorAll(focusableSelector)
    return focusableElements[0] as HTMLElement || null
  }

  // 颜色对比度检查
  checkColorContrast(foreground: string, background: string): {
    ratio: number
    wcagAA: boolean
    wcagAAA: boolean
  } {
    const fgLuminance = this.getLuminance(foreground)
    const bgLuminance = this.getLuminance(background)
    
    const ratio = (Math.max(fgLuminance, bgLuminance) + 0.05) / 
                  (Math.min(fgLuminance, bgLuminance) + 0.05)
    
    return {
      ratio,
      wcagAA: ratio >= 4.5,
      wcagAAA: ratio >= 7
    }
  }

  private getLuminance(color: string): number {
    // 将颜色转换为RGB
    const rgb = this.hexToRgb(color)
    if (!rgb) return 0
    
    // 计算相对亮度
    const rsRGB = rgb.r / 255
    const gsRGB = rgb.g / 255
    const bsRGB = rgb.b / 255
    
    const r = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4)
    const g = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4)
    const b = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4)
    
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null
  }
}

class FocusTracker {
  private focusHistory: HTMLElement[] = []
  private maxHistory = 10

  trackFocus(element: HTMLElement): void {
    this.focusHistory.unshift(element)
    if (this.focusHistory.length > this.maxHistory) {
      this.focusHistory.pop()
    }
  }

  restorePreviousFocus(): void {
    const previous = this.focusHistory[1] // [0]是当前焦点
    if (previous && document.contains(previous)) {
      previous.focus()
    }
  }

  getFocusHistory(): HTMLElement[] {
    return [...this.focusHistory]
  }
}
```

---

## 5. 监控和分析

### 5.1 性能监控

#### 5.1.1 Web Vitals监控
```typescript
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals'

class PerformanceMonitor {
  private metrics: Map<string, MetricData> = new Map()
  private observers: PerformanceObserver[] = []
  private analyticsEndpoint = '/api/analytics/performance'

  init(): void {
    this.setupWebVitals()
    this.setupCustomMetrics()
    this.setupResourceTiming()
    this.setupNavigationTiming()
  }

  private setupWebVitals(): void {
    getCLS(this.onMetric.bind(this), { reportAllChanges: true })
    getFID(this.onMetric.bind(this))
    getFCP(this.onMetric.bind(this))
    getLCP(this.onMetric.bind(this), { reportAllChanges: true })
    getTTFB(this.onMetric.bind(this))
  }

  private onMetric(metric: any): void {
    const metricData: MetricData = {
      name: metric.name,
      value: metric.value,
      delta: metric.delta,
      id: metric.id,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      connectionType: this.getConnectionType()
    }

    this.metrics.set(metric.name, metricData)
    this.reportMetric(metricData)
  }

  private setupCustomMetrics(): void {
    // 监控Service Worker性能
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.type === 'PERFORMANCE_METRIC') {
          this.onCustomMetric(event.data.metric)
        }
      })
    }

    // 监控缓存命中率
    this.monitorCachePerformance()
    
    // 监控错误率
    this.monitorErrorRate()
    
    // 监控用户交互延迟
    this.monitorInteractionLatency()
  }

  private monitorCachePerformance(): void {
    let cacheHits = 0
    let cacheMisses = 0
    
    const originalFetch = window.fetch
    window.fetch = async (...args) => {
      const startTime = performance.now()
      const response = await originalFetch(...args)
      const endTime = performance.now()
      
      if (response.headers.get('x-cache') === 'HIT') {
        cacheHits++
      } else {
        cacheMisses++
      }
      
      // 定期报告缓存性能
      if ((cacheHits + cacheMisses) % 10 === 0) {
        this.onCustomMetric({
          name: 'cache-hit-rate',
          value: cacheHits / (cacheHits + cacheMisses),
          timestamp: Date.now()
        })
      }
      
      return response
    }
  }

  private monitorErrorRate(): void {
    let errorCount = 0
    let totalRequests = 0
    
    window.addEventListener('error', () => {
      errorCount++
      this.reportErrorRate()
    })
    
    window.addEventListener('unhandledrejection', () => {
      errorCount++
      this.reportErrorRate()
    })
    
    const reportErrorRate = () => {
      totalRequests++
      if (totalRequests % 50 === 0) {
        this.onCustomMetric({
          name: 'error-rate',
          value: errorCount / totalRequests,
          timestamp: Date.now()
        })
      }
    }
  }

  private monitorInteractionLatency(): void {
    let interactionStart = 0
    
    ['click', 'keydown', 'touchstart'].forEach(eventType => {
      document.addEventListener(eventType, () => {
        interactionStart = performance.now()
      }, { passive: true })
    })
    
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'measure' && interactionStart > 0) {
          const latency = entry.startTime - interactionStart
          this.onCustomMetric({
            name: 'interaction-latency',
            value: latency,
            timestamp: Date.now()
          })
        }
      }
    })
    
    observer.observe({ entryTypes: ['measure'] })
    this.observers.push(observer)
  }

  private onCustomMetric(metric: CustomMetric): void {
    const metricData: MetricData = {
      ...metric,
      url: window.location.href,
      userAgent: navigator.userAgent,
      connectionType: this.getConnectionType()
    }
    
    this.metrics.set(metric.name, metricData)
    this.reportMetric(metricData)
  }

  private async reportMetric(metric: MetricData): Promise<void> {
    try {
      // 使用beacon API确保数据发送
      if ('sendBeacon' in navigator) {
        navigator.sendBeacon(
          this.analyticsEndpoint,
          JSON.stringify(metric)
        )
      } else {
        // 降级到fetch
        fetch(this.analyticsEndpoint, {
          method: 'POST',
          body: JSON.stringify(metric),
          headers: { 'Content-Type': 'application/json' },
          keepalive: true
        }).catch(error => {
          console.warn('Failed to report metric:', error)
        })
      }
    } catch (error) {
      console.warn('Failed to report metric:', error)
    }
  }

  private getConnectionType(): string {
    const connection = (navigator as any).connection || 
                      (navigator as any).mozConnection || 
                      (navigator as any).webkitConnection
    
    return connection?.effectiveType || 'unknown'
  }

  getMetrics(): Map<string, MetricData> {
    return new Map(this.metrics)
  }

  // 生成性能报告
  generateReport(): PerformanceReport {
    const metrics = Array.from(this.metrics.values())
    
    return {
      timestamp: Date.now(),
      url: window.location.href,
      metrics: metrics,
      summary: {
        coreWebVitals: this.getCoreWebVitalsScore(),
        overallScore: this.calculateOverallScore(),
        recommendations: this.generateRecommendations()
      }
    }
  }

  private getCoreWebVitalsScore(): CoreWebVitalsScore {
    const cls = this.metrics.get('CLS')?.value || 0
    const fid = this.metrics.get('FID')?.value || 0
    const lcp = this.metrics.get('LCP')?.value || 0
    
    return {
      cls: {
        value: cls,
        score: cls <= 0.1 ? 'good' : cls <= 0.25 ? 'needs-improvement' : 'poor'
      },
      fid: {
        value: fid,
        score: fid <= 100 ? 'good' : fid <= 300 ? 'needs-improvement' : 'poor'
      },
      lcp: {
        value: lcp,
        score: lcp <= 2500 ? 'good' : lcp <= 4000 ? 'needs-improvement' : 'poor'
      }
    }
  }

  destroy(): void {
    this.observers.forEach(observer => observer.disconnect())
    this.observers = []
  }
}

interface MetricData {
  name: string
  value: number
  delta?: number
  id?: string
  timestamp: number
  url: string
  userAgent: string
  connectionType: string
}

interface CustomMetric {
  name: string
  value: number
  timestamp: number
}

interface PerformanceReport {
  timestamp: number
  url: string
  metrics: MetricData[]
  summary: {
    coreWebVitals: CoreWebVitalsScore
    overallScore: number
    recommendations: string[]
  }
}

interface CoreWebVitalsScore {
  cls: { value: number; score: 'good' | 'needs-improvement' | 'poor' }
  fid: { value: number; score: 'good' | 'needs-improvement' | 'poor' }
  lcp: { value: number; score: 'good' | 'needs-improvement' | 'poor' }
}
```

### 5.2 用户行为分析

#### 5.2.1 用户交互跟踪
```typescript
class UserBehaviorAnalytics {
  private sessionId: string
  private userId: string | null = null
  private events: UserEvent[] = []
  private heatmapData: HeatmapPoint[] = []
  private scrollData: ScrollData[] = []

  constructor() {
    this.sessionId = this.generateSessionId()
    this.init()
  }

  private init(): void {
    this.setupEventTracking()
    this.setupScrollTracking()
    this.setupHeatmapTracking()
    this.setupFormAnalytics()
    this.setupPerformanceTracking()
  }

  private setupEventTracking(): void {
    // 点击事件跟踪
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement
      this.trackEvent('click', {
        element: this.getElementSelector(target),
        text: target.textContent?.trim().substring(0, 100),
        position: { x: e.clientX, y: e.clientY },
        timestamp: Date.now()
      })
    })

    // 页面浏览跟踪
    this.trackPageView()

    // 路由变化跟踪
    window.addEventListener('popstate', () => {
      this.trackPageView()
    })

    // 错误跟踪
    window.addEventListener('error', (e) => {
      this.trackEvent('error', {
        message: e.message,
        filename: e.filename,
        lineno: e.lineno,
        colno: e.colno,
        stack: e.error?.stack
      })
    })
  }

  private setupScrollTracking(): void {
    let maxScroll = 0
    let scrollDepths = [25, 50, 75, 100]
    let trackedDepths = new Set<number>()

    const trackScroll = throttle(() => {
      const scrollTop = window.pageYOffset
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const scrollPercent = Math.round((scrollTop / docHeight) * 100)

      maxScroll = Math.max(maxScroll, scrollPercent)

      // 跟踪滚动深度里程碑
      scrollDepths.forEach(depth => {
        if (scrollPercent >= depth && !trackedDepths.has(depth)) {
          trackedDepths.add(depth)
          this.trackEvent('scroll_depth', {
            depth: depth,
            timestamp: Date.now()
          })
        }
      })

      this.scrollData.push({
        timestamp: Date.now(),
        scrollTop,
        scrollPercent
      })
    }, 100)

    window.addEventListener('scroll', trackScroll, { passive: true })

    // 页面离开时记录最大滚动深度
    window.addEventListener('beforeunload', () => {
      this.trackEvent('max_scroll', {
        maxScrollPercent: maxScroll,
        timestamp: Date.now()
      })
    })
  }

  private setupHeatmapTracking(): void {
    // 点击热图
    document.addEventListener('click', (e) => {
      this.heatmapData.push({
        x: e.clientX,
        y: e.clientY,
        type: 'click',
        timestamp: Date.now(),
        url: window.location.pathname
      })
    })

    // 鼠标移动热图（采样）
    let mouseMoveCount = 0
    document.addEventListener('mousemove', (e) => {
      mouseMoveCount++
      if (mouseMoveCount % 10 === 0) { // 采样率10%
        this.heatmapData.push({
          x: e.clientX,
          y: e.clientY,
          type: 'move',
          timestamp: Date.now(),
          url: window.location.pathname
        })
      }
    }, { passive: true })
  }

  private setupFormAnalytics(): void {
    // 表单交互跟踪
    document.addEventListener('focusin', (e) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
        this.trackEvent('form_field_focus', {
          field: this.getElementSelector(target),
          fieldType: (target as HTMLInputElement).type,
          timestamp: Date.now()
        })
      }
    })

    // 表单提交跟踪
    document.addEventListener('submit', (e) => {
      const form = e.target as HTMLFormElement
      this.trackEvent('form_submit', {
        form: this.getElementSelector(form),
        timestamp: Date.now()
      })
    })

    // 表单放弃跟踪
    this.trackFormAbandonment()
  }

  private trackFormAbandonment(): void {
    const formInteractions = new Map<string, FormInteraction>()

    document.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement
      if (target.form) {
        const formSelector = this.getElementSelector(target.form)
        const interaction = formInteractions.get(formSelector) || {
          formSelector,
          startTime: Date.now(),
          fields: new Set(),
          lastInteraction: Date.now()
        }

        interaction.fields.add(this.getElementSelector(target))
        interaction.lastInteraction = Date.now()
        formInteractions.set(formSelector, interaction)
      }
    })

    // 检查表单放弃
    setInterval(() => {
      const now = Date.now()
      formInteractions.forEach((interaction, formSelector) => {
        if (now - interaction.lastInteraction > 30000) { // 30秒无交互
          this.trackEvent('form_abandonment', {
            form: formSelector,
            fieldsInteracted: interaction.fields.size,
            timeSpent: now - interaction.startTime,
            timestamp: now
          })
          formInteractions.delete(formSelector)
        }
      })
    }, 10000) // 每10秒检查一次
  }

  trackEvent(eventType: string, data: any): void {
    const event: UserEvent = {
      type: eventType,
      data,
      sessionId: this.sessionId,
      userId: this.userId,
      url: window.location.href,
      referrer: document.referrer,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      screenResolution: `${screen.width}x${screen.height}`,
      viewportSize: `${window.innerWidth}x${window.innerHeight}`
    }

    this.events.push(event)

    // 批量发送事件
    if (this.events.length >= 10) {
      this.flushEvents()
    }
  }

  private async flushEvents(): Promise<void> {
    if (this.events.length === 0) return

    const eventsToSend = [...this.events]
    this.events = []

    try {
      await fetch('/api/analytics/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: eventsToSend }),
        keepalive: true
      })
    } catch (error) {
      console.warn('Failed to send analytics events:', error)
      // 重新加入队列
      this.events.unshift(...eventsToSend)
    }
  }

  private trackPageView(): void {
    this.trackEvent('page_view', {
      path: window.location.pathname,
      title: document.title,
      timestamp: Date.now()
    })
  }

  private getElementSelector(element: HTMLElement): string {
    if (element.id) return `#${element.id}`
    if (element.className) return `.${element.className.split(' ')[0]}`
    return element.tagName.toLowerCase()
  }

  private generateSessionId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36)
  }

  setUserId(userId: string): void {
    this.userId = userId
  }

  // 生成用户行为报告
  generateBehaviorReport(): BehaviorReport {
    return {
      sessionId: this.sessionId,
      userId: this.userId,
      events: this.events,
      heatmapData: this.heatmapData,
      scrollData: this.scrollData,
      summary: {
        totalEvents: this.events.length,
        sessionDuration: this.calculateSessionDuration(),
        pageViews: this.events.filter(e => e.type === 'page_view').length,
        interactions: this.events.filter(e => e.type === 'click').length
      }
    }
  }

  private calculateSessionDuration(): number {
    if (this.events.length === 0) return 0
    const firstEvent = Math.min(...this.events.map(e => e.timestamp))
    const lastEvent = Math.max(...this.events.map(e => e.timestamp))
    return lastEvent - firstEvent
  }

  destroy(): void {
    this.flushEvents()
  }
}

// 工具函数
function throttle(func: Function, wait: number): Function {
  let timeout: number | null = null
  let previous = 0
  
  return function executedFunction(...args: any[]) {
    const now = Date.now()
    const remaining = wait - (now - previous)
    
    if (remaining <= 0 || remaining > wait) {
      if (timeout) {
        clearTimeout(timeout)
        timeout = null
      }
      previous = now
      func.apply(this, args)
    } else if (!timeout) {
      timeout = setTimeout(() => {
        previous = Date.now()
        timeout = null
        func.apply(this, args)
      }, remaining)
    }
  }
}

interface UserEvent {
  type: string
  data: any
  sessionId: string
  userId: string | null
  url: string
  referrer: string
  timestamp: number
  userAgent: string
  screenResolution: string
  viewportSize: string
}

interface HeatmapPoint {
  x: number
  y: number
  type: 'click' | 'move'
  timestamp: number
  url: string
}

interface ScrollData {
  timestamp: number
  scrollTop: number
  scrollPercent: number
}

interface FormInteraction {
  formSelector: string
  startTime: number
  fields: Set<string>
  lastInteraction: number
}

interface BehaviorReport {
  sessionId: string
  userId: string | null
  events: UserEvent[]
  heatmapData: HeatmapPoint[]
  scrollData: ScrollData[]
  summary: {
    totalEvents: number
    sessionDuration: number
    pageViews: number
    interactions: number
  }
}
```

---

这份PWA最佳实践和优化指南涵盖了性能优化、用户体验、安全性、SEO、可访问性和监控分析等关键方面。每个部分都提供了详细的代码实现和实用的优化策略。

如需了解更多特定方面的实现细节或有其他问题，请随时告诉我！
