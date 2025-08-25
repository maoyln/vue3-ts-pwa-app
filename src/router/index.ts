/*
 * @Author: maoyl maoyl@glodon.com
 * @Date: 2025-08-19 14:09:01
 * @LastEditors: maoyl maoyl@glodon.com
 * @LastEditTime: 2025-08-19 14:35:15
 * @FilePath: /my-vue3-ts-pwa-app/src/router/index.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

// 路由组件懒加载
const Home = () => import('../views/Home.vue')
const Weather = () => import('../views/Weather.vue')
const News = () => import('../views/News.vue')
const UserTable = () => import('../views/UserTable.vue')
const PostsTable = () => import('../views/PostsTable.vue')
const CommentsTable = () => import('../views/CommentsTable.vue')
const AlbumsTable = () => import('../views/AlbumsTable.vue')
const About = () => import('../views/About.vue')
const ApiDemo = () => import('../views/ApiDemo.vue')
const PWADashboard = () => import('../components/EnhancedPWADashboard.vue')

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'Home',
    component: Home,
    meta: {
      title: '首页',
      keepAlive: true
    }
  },
  {
    path: '/weather',
    name: 'Weather',
    component: Weather,
    meta: {
      title: '天气预报',
      keepAlive: true
    }
  },
  {
    path: '/news',
    name: 'News',
    component: News,
    meta: {
      title: '新闻资讯',
      keepAlive: false
    }
  },
  {
    path: '/users',
    name: 'UserTable',
    component: UserTable,
    meta: {
      title: '用户管理',
      keepAlive: true
    }
  },
  {
    path: '/posts',
    name: 'PostsTable',
    component: PostsTable,
    meta: {
      title: '文章管理',
      keepAlive: true
    }
  },
  {
    path: '/comments',
    name: 'CommentsTable',
    component: CommentsTable,
    meta: {
      title: '评论管理',
      keepAlive: true
    }
  },
  {
    path: '/albums',
    name: 'AlbumsTable',
    component: AlbumsTable,
    meta: {
      title: '相册管理',
      keepAlive: true
    }
  },
  {
    path: '/documents',
    name: 'DocumentManager',
    component: () => import('../views/DocumentManager.vue'),
    meta: {
      title: '文档管理',
      keepAlive: true
    }
  },
  {
    path: '/api-demo',
    name: 'ApiDemo',
    component: ApiDemo,
    meta: {
      title: 'API演示',
      keepAlive: true
    }
  },
  {
    path: '/pwa-dashboard',
    name: 'PWADashboard',
    component: PWADashboard,
    meta: {
      title: 'PWA控制面板',
      keepAlive: true
    }
  },
  {
    path: '/about',
    name: 'About',
    component: About,
    meta: {
      title: '关于',
      keepAlive: true
    }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(_to, _from, savedPosition) {
    // 页面切换时的滚动行为
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

// 路由守卫 - 设置页面标题
router.beforeEach((to, _from, next) => {
  // 设置页面标题
  if (to.meta.title) {
    document.title = `${to.meta.title} ❗ - Vue3 PWA App`
  }
  next()
})

export default router
