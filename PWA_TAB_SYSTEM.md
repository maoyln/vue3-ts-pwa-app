# PWA多页签系统使用说明

## 概述

本项目实现了类似浏览器多页签的功能，允许在PWA应用内部打开多个页面，而无需跳转到浏览器的新标签页。这个功能特别适用于需要同时查看和操作多个页面内容的场景。

## 核心特性

### ✨ 主要功能
- 🗂️ **多页签管理** - 支持打开、关闭、切换多个页签
- 🎯 **智能去重** - 相同路径的页签默认会复用，避免重复
- 🔄 **页签操作** - 支持刷新、复制、关闭等操作
- 💾 **状态持久化** - 支持导出/导入页签配置
- 📱 **响应式设计** - 完美适配桌面端和移动端
- 🎨 **丰富交互** - 右键菜单、拖拽排序等

### 🚀 使用场景
- **多页面对比** - 同时查看不同的数据表格
- **工作流程** - 在不同功能模块间快速切换
- **数据录入** - 保持多个编辑页面的状态
- **信息浏览** - 类似浏览器的多标签体验

## 使用方法

### 基本用法

#### 1. 在组件中使用

```typescript
import { openInNewTab } from '@/utils/tabUtils'

// 打开新页签
const openWeatherPage = () => {
  openInNewTab('/weather', {
    title: '天气预报',
    icon: '🌤️',
    closable: true
  })
}

// 批量打开页签
const openMultiplePages = () => {
  const pages = [
    { path: '/users', title: '用户管理', icon: '👥' },
    { path: '/posts', title: '文章管理', icon: '📝' }
  ]
  
  pages.forEach(page => {
    openInNewTab(page.path, {
      title: page.title,
      icon: page.icon
    })
  })
}
```

#### 2. 全局方法调用

```javascript
// 在任何地方都可以使用
window.openInNewTab('/news', {
  title: '新闻资讯',
  icon: '📰'
})

// 关闭页签
window.closeTab(tabId)

// 关闭所有页签
window.closeAllTabs()

// 获取当前页签
const currentTab = window.getCurrentTab()

// 刷新页签
window.refreshTab(tabId)
```

#### 3. 使用 Composable

```typescript
import { useTabManager } from '@/composables/useTabManager'

const {
  tabs,           // 所有页签
  activeTab,      // 当前活动页签
  tabsCount,      // 页签数量
  addTab,         // 添加页签
  closeTab,       // 关闭页签
  setActiveTab    // 设置活动页签
} = useTabManager()
```

### API 参考

#### openInNewTab(url, options)

打开新页签的主要方法。

**参数：**
- `url` (string): 要打开的路径
- `options` (object): 配置选项
  - `title` (string): 页签标题
  - `icon` (string): 页签图标（emoji）
  - `closable` (boolean): 是否可关闭，默认 true
  - `setActive` (boolean): 是否设为活动页签，默认 true
  - `allowDuplicate` (boolean): 是否允许重复，默认 false

**返回值：**
- `string | null`: 页签ID

**示例：**
```typescript
// 基本用法
openInNewTab('/about')

// 完整配置
const tabId = openInNewTab('/users', {
  title: '用户管理',
  icon: '👥',
  closable: true,
  setActive: true,
  allowDuplicate: false
})
```

#### 其他方法

```typescript
// 关闭页签
closeTab(tabId: string): void

// 关闭所有页签
closeAllTabs(): void

// 切换到指定页签
switchToTab(tabId: string): void

// 刷新页签
refreshTab(tabId?: string): void

// 获取当前页签
getCurrentTab(): Tab | null

// 获取所有页签
getAllTabs(): Tab[]
```

### 页签管理器组件

#### 基本用法

```vue
<template>
  <div class="app-container">
    <!-- 页签管理器会自动处理页签显示和路由 -->
    <TabManager />
  </div>
</template>

<script setup>
import TabManager from '@/components/TabManager.vue'
</script>
```

#### 页签操作

- **左键点击** - 切换到该页签
- **右键点击** - 显示上下文菜单
  - 刷新页签
  - 关闭页签
  - 关闭其他页签
  - 关闭右侧页签
- **页签菜单** - 点击页签栏右侧的菜单按钮
  - 关闭所有页签
  - 导出页签配置
  - 导入页签配置

### 高级功能

#### 1. 页签配置导出/导入

```typescript
import { useTabManager } from '@/composables/useTabManager'

const { exportTabsConfig, importTabsConfig } = useTabManager()

// 导出配置
const config = exportTabsConfig()
console.log(config)
// 输出：
// {
//   tabs: [
//     { title: '首页', path: '/', icon: '🏠', isClosable: false },
//     { title: '用户管理', path: '/users', icon: '👥', isClosable: true }
//   ],
//   activeTabId: 'tab-1-xxx'
// }

// 导入配置
importTabsConfig(config)
```

#### 2. 自定义页签行为

```typescript
// 不可关闭的页签
openInNewTab('/dashboard', {
  title: '控制面板',
  closable: false
})

// 允许重复的页签
openInNewTab('/edit', {
  title: '编辑页面',
  allowDuplicate: true
})

// 在后台打开页签
openInNewTab('/background', {
  title: '后台任务',
  setActive: false
})
```

#### 3. 监听页签变化

```typescript
import { watch } from 'vue'
import { useTabManager } from '@/composables/useTabManager'

const { tabs, activeTab } = useTabManager()

// 监听页签数量变化
watch(tabs, (newTabs) => {
  console.log(`当前有 ${newTabs.length} 个页签`)
})

// 监听活动页签变化
watch(activeTab, (newTab) => {
  if (newTab) {
    console.log(`切换到页签: ${newTab.title}`)
  }
})
```

## 样式定制

### CSS 变量

```css
:root {
  --tab-bg-color: #f1f5f9;
  --tab-active-color: #3b82f6;
  --tab-border-color: #e2e8f0;
  --tab-hover-color: #e2e8f0;
}
```

### 自定义样式

```css
/* 页签栏样式 */
.tab-bar {
  background: var(--tab-bg-color);
  border-bottom: 1px solid var(--tab-border-color);
}

/* 活动页签样式 */
.tab-item.active {
  background: white;
  border-color: var(--tab-active-color);
  color: var(--tab-active-color);
}
```

## 最佳实践

### 1. 页签标题规范

```typescript
// ✅ 好的标题
openInNewTab('/users', { title: '用户管理' })
openInNewTab('/posts/123', { title: '编辑文章 #123' })

// ❌ 避免的标题
openInNewTab('/users', { title: 'users' })
openInNewTab('/posts/123', { title: 'Page' })
```

### 2. 图标使用建议

```typescript
// 使用有意义的emoji图标
const iconMap = {
  '/users': '👥',
  '/posts': '📝',
  '/comments': '💬',
  '/settings': '⚙️',
  '/dashboard': '📊',
  '/notifications': '🔔'
}
```

### 3. 性能优化

```typescript
// 避免频繁创建页签
const openPage = (path: string) => {
  // 检查是否已存在
  const existingTab = getAllTabs().find(tab => tab.path === path)
  if (existingTab) {
    switchToTab(existingTab.id)
  } else {
    openInNewTab(path)
  }
}
```

### 4. 错误处理

```typescript
// 添加错误处理
const safeOpenTab = (path: string, options: TabOptions = {}) => {
  try {
    return openInNewTab(path, options)
  } catch (error) {
    console.error('打开页签失败:', error)
    // 降级方案
    router.push(path)
    return null
  }
}
```

## 注意事项

### 1. 路由配置

确保所有页签对应的路由都已正确配置：

```typescript
// router/index.ts
const routes = [
  {
    path: '/users',
    name: 'Users',
    component: () => import('@/views/Users.vue'),
    meta: {
      title: '用户管理',
      icon: '👥'
    }
  }
  // ...
]
```

### 2. 内存管理

- 页签关闭时会自动清理相关状态
- 避免在页签中保存大量数据
- 定期清理不需要的页签

### 3. 浏览器兼容性

- 支持现代浏览器
- 在不支持的环境中会降级到普通路由
- PWA环境中体验最佳

### 4. SEO 考虑

- 页签切换不会影响URL
- 首次加载时会自动创建首页页签
- 支持深度链接访问

## 故障排除

### 常见问题

1. **页签无法打开**
   - 检查路由是否正确配置
   - 确认组件是否正确导入

2. **页签状态丢失**
   - 检查是否正确初始化页签管理器
   - 确认在正确的Vue组件上下文中使用

3. **样式显示异常**
   - 检查CSS是否正确加载
   - 确认没有样式冲突

### 调试工具

```typescript
// 开启调试模式
window.debugTabs = true

// 查看当前状态
console.log('所有页签:', getAllTabs())
console.log('当前页签:', getCurrentTab())
```

## 演示页面

访问 `/tab-demo` 路径可以查看完整的功能演示和交互示例。

---

## 技术实现

### 架构设计

```
src/
├── composables/
│   └── useTabManager.ts     # 页签管理核心逻辑
├── components/
│   └── TabManager.vue       # 页签UI组件
├── utils/
│   └── tabUtils.ts          # 工具函数和全局方法
└── views/
    └── TabDemo.vue          # 功能演示页面
```

### 核心技术

- **Vue 3 Composition API** - 响应式状态管理
- **Vue Router** - 路由集成
- **TypeScript** - 类型安全
- **CSS Modules** - 样式隔离

通过这套多页签系统，您的PWA应用将具备更强大的多任务处理能力和更好的用户体验！
