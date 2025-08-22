/// <reference lib="webworker" />

/**
 * Service Worker - TypeScript版本
 * 
 * 功能特性：
 * 1. 网络优先缓存策略 - 优先网络请求，断网时使用缓存
 * 2. 智能缓存管理 - 支持过期检测和自动清理
 * 3. API请求缓存 - 针对不同API设置差异化缓存策略
 * 4. 图片资源缓存 - 支持跨域图片缓存
 * 5. 离线回退支持 - 网络失败时的友好降级
 * 6. 缓存失效通知 - CRUD操作后自动清理相关缓存
 * 7. 实时消息通信 - 与前端页面的双向通信
 */

import type {
  CacheOptions,
  CacheNames,
  ServiceWorkerMessage,
  ApiDataUpdatedMessage,
  CacheInvalidatedMessage,
  GetCacheInfoMessage,
  RefreshApiCacheMessage,
  CacheInfo,
  CacheEntry,
  RequestHandler,
  CacheCleanupOptions,
  FetchEventExtended,
  InstallEventExtended,
  ActivateEventExtended
} from './types/sw';

// 声明 Service Worker 全局作用域
declare const self: ServiceWorkerGlobalScope;

// 缓存名称配置
const CACHE_NAMES: CacheNames = {
  PRECACHE: 'precache-v1',
  DYNAMIC: 'dynamic-v1', 
  API: 'api-cache-v1',
  IMAGES: 'images-v1',
  FONTS: 'fonts-v1',
  STATIC: 'static-v1'
};

// 预缓存资源列表（将由 Workbox 注入）
const PRECACHE_MANIFEST: string[] = self.__WB_MANIFEST || [];

/**
 * Service Worker 安装事件
 * 预缓存关键资源
 */
self.addEventListener('install', (event: InstallEventExtended) => {
  console.log('🔧 Service Worker 安装中...');
  
  event.waitUntil(
    (async (): Promise<void> => {
      try {
        // 预缓存静态资源
        const cache = await caches.open(CACHE_NAMES.PRECACHE);
        
        if (PRECACHE_MANIFEST.length > 0) {
          console.log('💾 预缓存资源:', PRECACHE_MANIFEST.length, '个文件');
          await cache.addAll(PRECACHE_MANIFEST);
        }
        
        // 跳过等待，立即激活新的 Service Worker
        await self.skipWaiting();
        
        console.log('✅ Service Worker 安装完成');
      } catch (error) {
        console.error('❌ Service Worker 安装失败:', error);
      }
    })()
  );
});

/**
 * Service Worker 激活事件
 * 清理旧缓存，接管所有客户端
 */
self.addEventListener('activate', (event: ActivateEventExtended) => {
  console.log('🚀 Service Worker 激活中...');
  
  event.waitUntil(
    (async (): Promise<void> => {
      try {
        // 清理过期的缓存
        await cleanupOldCaches();
        
        // 清理过期的API缓存
        await cleanExpiredApiCache();
        
        // 接管所有客户端
        await self.clients.claim();
        
        console.log('✅ Service Worker 激活完成');
        
        // 通知客户端 Service Worker 已激活
        await notifyClientsServiceWorkerActivated();
      } catch (error) {
        console.error('❌ Service Worker 激活失败:', error);
      }
    })()
  );
});

/**
 * 网络请求拦截和缓存处理
 */
self.addEventListener('fetch', (event: FetchEventExtended) => {
  const { request } = event;
  const url = new URL(request.url);

  // 跳过非HTTP(S)请求
  if (!request.url.startsWith('http')) {
    return;
  }

  // 跳过Chrome扩展请求
  if (url.protocol === 'chrome-extension:') {
    return;
  }

  // 1. 导航请求 - 网络优先策略
  if (request.mode === 'navigate') {
    event.respondWith(
      networkFirst(request, CACHE_NAMES.DYNAMIC, { networkTimeout: 3000 })
    );
    return;
  }

  // 2. API请求 - 网络优先策略（优先网络，断网时使用缓存）
  if (url.origin === 'https://api.openweathermap.org' ||
      url.origin === 'https://newsapi.org' ||
      url.origin === 'https://jsonplaceholder.typicode.com' ||
      url.pathname.startsWith('/api/')) {
    
    // 根据不同API设置不同的缓存策略
    let cacheOptions: CacheOptions = {
      networkTimeout: 5000, // 默认5秒
      cacheTimeout: 24 * 60 * 60 * 1000 // 缓存24小时有效
    };
    
    // JSONPlaceholder API - 数据缓存策略
    if (url.origin === 'https://jsonplaceholder.typicode.com') {
      if (url.pathname === '/users') {
        cacheOptions.networkTimeout = 6000; // 用户数据6秒超时
      } else if (url.pathname === '/posts') {
        cacheOptions.networkTimeout = 6000; // 文章数据6秒超时
      } else if (url.pathname === '/comments') {
        cacheOptions.networkTimeout = 5000; // 评论数据5秒超时
      } else if (url.pathname === '/albums') {
        cacheOptions.networkTimeout = 5000; // 相册数据5秒超时
      }
    }
    
    // 新闻API - 较短超时时间
    if (url.origin === 'https://newsapi.org') {
      cacheOptions.networkTimeout = 4000; // 新闻数据4秒超时
    }
    
    // 天气API - 中等超时时间
    if (url.origin === 'https://api.openweathermap.org') {
      cacheOptions.networkTimeout = 5000; // 天气数据5秒超时
    }
    
    // POST/PUT/DELETE请求不缓存，但要清理相关缓存
    if (request.method !== 'GET') {
      event.respondWith(
        handleMutationRequest(request, url)
      );
      return;
    }
    
    event.respondWith(
      networkFirstWithFallback(request, CACHE_NAMES.API, cacheOptions)
    );
    return;
  }

  // 3. 图片资源 - 缓存优先策略，支持跨域图片
  if (request.destination === 'image') {
    event.respondWith(
      imageCache(request, CACHE_NAMES.IMAGES)
    );
    return;
  }

  // 4. 字体文件 - 缓存优先策略
  if (request.destination === 'font') {
    event.respondWith(
      cacheFirst(request, CACHE_NAMES.FONTS)
    );
    return;
  }

  // 5. CSS/JS等静态资源 - 缓存优先策略
  if (request.destination === 'style' || 
      request.destination === 'script' ||
      url.pathname.endsWith('.css') ||
      url.pathname.endsWith('.js')) {
    event.respondWith(
      cacheFirst(request, CACHE_NAMES.STATIC)
    );
    return;
  }

  // 6. 其他请求 - 网络优先策略
  event.respondWith(
    networkFirst(request, CACHE_NAMES.DYNAMIC, { networkTimeout: 5000 })
  );
});

/**
 * 消息事件处理
 * 处理来自客户端的消息
 */
self.addEventListener('message', (event: ExtendableMessageEvent) => {
  const { data } = event;
  
  console.log('📨 收到消息:', data.type);
  
  switch (data.type) {
    case 'REFRESH_API_CACHE':
      handleRefreshApiCache(event, data as RefreshApiCacheMessage);
      break;
      
    case 'GET_CACHE_INFO':
      handleGetCacheInfo(event, data as GetCacheInfoMessage);
      break;
      
    case 'GET_CACHE_STATS':
      handleGetCacheStats(event);
      break;
      
    case 'SYNC_DATA':
      handleSyncData(event, data);
      break;
      
    case 'OPEN_APP':
      handleOpenApp(event);
      break;
      
    default:
      console.warn('未知消息类型:', data.type);
  }
});

/**
 * 网络优先策略 - 优先网络请求，断网时使用缓存
 */
const networkFirstWithFallback: RequestHandler = async (
  request: Request, 
  cacheName: string, 
  options: CacheOptions = {}
): Promise<Response> => {
  const {
    networkTimeout = 5000,
    cacheTimeout = 24 * 60 * 60 * 1000 // 24小时
  } = options;

  console.log('🌐 网络优先请求:', request.url);

  try {
    // 1. 优先尝试网络请求
    const networkResponse = await fetchWithTimeout(request, networkTimeout);
    
    if (networkResponse.ok) {
      console.log('✅ 网络请求成功:', request.url);
      
      // 网络请求成功，更新缓存
      const cache = await caches.open(cacheName);
      const responseToCache = networkResponse.clone();
      
      // 添加缓存时间戳
      const headers = new Headers(responseToCache.headers);
      headers.set('sw-cached-time', Date.now().toString());
      headers.set('sw-cache-status', 'fresh');
      
      const responseWithTimestamp = new Response(responseToCache.body, {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers: headers
      });
      
      await cache.put(request, responseWithTimestamp);
      console.log('💾 网络响应已缓存:', request.url);
      
      return networkResponse;
    } else {
      throw new Error(`Network response not ok: ${networkResponse.status}`);
    }

  } catch (networkError) {
    console.warn('🌐 网络请求失败，尝试缓存:', request.url, networkError);
    
    // 2. 网络失败，尝试从缓存获取
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      // 检查缓存是否过期
      const cachedTime = cachedResponse.headers.get('sw-cached-time');
      const isExpired = cachedTime ? 
        (Date.now() - parseInt(cachedTime)) > cacheTimeout : 
        true;

      if (!isExpired) {
        console.log('📦 使用有效缓存:', request.url);
        
        // 添加缓存状态标识
        const headers = new Headers(cachedResponse.headers);
        headers.set('sw-cache-status', 'hit');
        
        return new Response(cachedResponse.body, {
          status: cachedResponse.status,
          statusText: cachedResponse.statusText,
          headers: headers
        });
      } else {
        console.log('📦 使用过期缓存 (离线模式):', request.url);
        
        // 即使过期也返回缓存（离线情况下）
        const headers = new Headers(cachedResponse.headers);
        headers.set('sw-cache-status', 'stale');
        
        return new Response(cachedResponse.body, {
          status: cachedResponse.status,
          statusText: cachedResponse.statusText,
          headers: headers
        });
      }
    }
    
    // 3. 没有缓存，返回离线错误响应
    console.error('❌ 网络失败且无缓存:', request.url);
    return new Response(JSON.stringify({
      error: '网络连接失败，暂无缓存数据',
      offline: true,
      url: request.url,
      timestamp: Date.now()
    }), {
      status: 503,
      statusText: 'Service Unavailable',
      headers: {
        'Content-Type': 'application/json',
        'sw-cache-status': 'miss'
      }
    });
  }
};

/**
 * 网络优先策略 - 基础版本
 */
const networkFirst: RequestHandler = async (
  request: Request, 
  cacheName: string, 
  options: CacheOptions = {}
): Promise<Response> => {
  const { networkTimeout = 5000 } = options;

  try {
    const networkResponse = await fetchWithTimeout(request, networkTimeout);
    
    if (networkResponse.ok) {
      // 网络请求成功，更新缓存
      const cache = await caches.open(cacheName);
      await cache.put(request, networkResponse.clone());
      return networkResponse;
    }
  } catch (error) {
    console.warn('网络请求失败，尝试缓存:', request.url);
  }

  // 网络失败，尝试缓存
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }

  // 没有缓存时等待网络响应
  return fetch(request);
};

/**
 * 缓存优先策略
 */
const cacheFirst: RequestHandler = async (
  request: Request, 
  cacheName: string
): Promise<Response> => {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // 缓存未命中，从网络获取
  const networkResponse = await fetch(request);
  
  if (networkResponse.ok) {
    await cache.put(request, networkResponse.clone());
  }
  
  return networkResponse;
};

/**
 * 带超时的网络请求
 */
const fetchWithTimeout = async (request: Request, timeout: number): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(request, { 
      signal: controller.signal 
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

/**
 * 图片缓存策略 - 支持跨域图片缓存
 */
const imageCache = async (request: Request, cacheName: string): Promise<Response> => {
  console.log('🖼️ 图片请求:', request.url);
  
  try {
    // 1. 先检查缓存
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      console.log('📦 使用图片缓存:', request.url);
      return cachedResponse;
    }
    
    // 2. 缓存未命中，尝试网络请求
    console.log('🌐 网络获取图片:', request.url);
    
    // 对于跨域图片，使用 cors 模式
    const fetchOptions: RequestInit = {};
    const url = new URL(request.url);
    
    // 检查是否为跨域请求
    if (url.origin !== self.location.origin) {
      fetchOptions.mode = 'cors';
      fetchOptions.credentials = 'omit';
    }
    
    const networkResponse = await fetch(request, fetchOptions);
    
    if (networkResponse.ok || networkResponse.type === 'opaque') {
      // 成功获取图片，存入缓存
      const responseToCache = networkResponse.clone();
      await cache.put(request, responseToCache);
      console.log('💾 图片已缓存:', request.url);
      
      return networkResponse;
    } else {
      throw new Error(`Image fetch failed: ${networkResponse.status}`);
    }
    
  } catch (error) {
    console.warn('❌ 图片请求失败:', request.url, error);
    
    // 3. 网络失败，再次尝试缓存（可能之前缓存检查有问题）
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      console.log('📦 网络失败，使用缓存图片:', request.url);
      return cachedResponse;
    }
    
    // 4. 返回默认图片或透明图片
    console.log('🔄 返回默认图片:', request.url);
    return generatePlaceholderImage();
  }
};

/**
 * 生成占位符图片
 */
const generatePlaceholderImage = (): Response => {
  // 生成一个1x1透明PNG图片
  const transparentPixel = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  
  return new Response(
    Uint8Array.from(atob(transparentPixel.split(',')[1]), c => c.charCodeAt(0)),
    {
      status: 200,
      statusText: 'OK',
      headers: {
        'Content-Type': 'image/png',
        'sw-cache-status': 'placeholder'
      }
    }
  );
};

/**
 * 处理CRUD操作请求（POST/PUT/DELETE）
 */
const handleMutationRequest = async (request: Request, url: URL): Promise<Response> => {
  try {
    console.log('🔄 处理变更请求:', request.method, url.pathname);
    
    // 执行网络请求
    const response = await fetch(request);
    
    if (response.ok) {
      // 请求成功，清理相关缓存
      await invalidateRelatedCache(url, request.method);
      
      // 通知客户端数据已更新
      await notifyClientsDataUpdated(url.href);
    }
    
    return response;
  } catch (error) {
    console.error('❌ 变更请求失败:', error);
    throw error;
  }
};

/**
 * 清理相关缓存
 */
const invalidateRelatedCache = async (url: URL, method: string): Promise<void> => {
  const cache = await caches.open(CACHE_NAMES.API);
  
  try {
    if (url.origin === 'https://jsonplaceholder.typicode.com') {
      const keys = await cache.keys();
      let cleanedCount = 0;
      let resourceType = '';
      
      if (url.pathname.startsWith('/users')) {
        // 清理用户相关的缓存
        const userCacheKeys = keys.filter(request => {
          const requestUrl = new URL(request.url);
          return requestUrl.origin === 'https://jsonplaceholder.typicode.com' &&
                 requestUrl.pathname.startsWith('/users');
        });
        
        await Promise.all(userCacheKeys.map(key => cache.delete(key)));
        cleanedCount = userCacheKeys.length;
        resourceType = 'users';
        
        console.log(`🗑️ 已清理 ${cleanedCount} 个用户相关缓存`);
      }
      
      else if (url.pathname.startsWith('/posts')) {
        // 清理文章相关的缓存
        const postCacheKeys = keys.filter(request => {
          const requestUrl = new URL(request.url);
          return requestUrl.origin === 'https://jsonplaceholder.typicode.com' &&
                 requestUrl.pathname.startsWith('/posts');
        });
        
        await Promise.all(postCacheKeys.map(key => cache.delete(key)));
        cleanedCount = postCacheKeys.length;
        resourceType = 'posts';
        
        console.log(`🗑️ 已清理 ${cleanedCount} 个文章相关缓存`);
      }
      
      else if (url.pathname.startsWith('/comments')) {
        // 清理评论相关的缓存
        const commentCacheKeys = keys.filter(request => {
          const requestUrl = new URL(request.url);
          return requestUrl.origin === 'https://jsonplaceholder.typicode.com' &&
                 requestUrl.pathname.startsWith('/comments');
        });
        
        await Promise.all(commentCacheKeys.map(key => cache.delete(key)));
        cleanedCount = commentCacheKeys.length;
        resourceType = 'comments';
        
        console.log(`🗑️ 已清理 ${cleanedCount} 个评论相关缓存`);
      }
      
      else if (url.pathname.startsWith('/albums')) {
        // 清理相册相关的缓存
        const albumCacheKeys = keys.filter(request => {
          const requestUrl = new URL(request.url);
          return requestUrl.origin === 'https://jsonplaceholder.typicode.com' &&
                 requestUrl.pathname.startsWith('/albums');
        });
        
        await Promise.all(albumCacheKeys.map(key => cache.delete(key)));
        cleanedCount = albumCacheKeys.length;
        resourceType = 'albums';
        
        console.log(`🗑️ 已清理 ${cleanedCount} 个相册相关缓存`);
      }
      
      // 发送缓存失效消息
      if (cleanedCount > 0) {
        await notifyClientsCacheInvalidated(resourceType, method, cleanedCount);
      }
    }
  } catch (error) {
    console.error('清理缓存失败:', error);
  }
};

/**
 * 通知客户端数据已更新
 */
const notifyClientsDataUpdated = async (url: string): Promise<void> => {
  const clients = await self.clients.matchAll();
  const message: ApiDataUpdatedMessage = {
    type: 'API_DATA_UPDATED',
    payload: {
      url,
      timestamp: Date.now()
    }
  };
  
  clients.forEach(client => {
    client.postMessage(message);
  });
  
  console.log('📢 已通知', clients.length, '个客户端数据更新');
};

/**
 * 通知客户端缓存已失效
 */
const notifyClientsCacheInvalidated = async (
  resourceType: string, 
  method: string, 
  cleanedCount: number
): Promise<void> => {
  const clients = await self.clients.matchAll();
  const message: CacheInvalidatedMessage = {
    type: 'CACHE_INVALIDATED',
    payload: {
      resourceType,
      method,
      cleanedCount
    }
  };
  
  clients.forEach(client => {
    client.postMessage(message);
  });
  
  console.log('📢 已通知', clients.length, '个客户端缓存失效');
};

/**
 * 通知客户端 Service Worker 已激活
 */
const notifyClientsServiceWorkerActivated = async (): Promise<void> => {
  const clients = await self.clients.matchAll();
  const message: ServiceWorkerMessage = {
    type: 'SW_ACTIVATED',
    payload: {
      timestamp: Date.now()
    }
  };
  
  clients.forEach(client => {
    client.postMessage(message);
  });
  
  console.log('📢 已通知', clients.length, '个客户端 Service Worker 激活');
};

/**
 * 处理刷新API缓存请求
 */
const handleRefreshApiCache = async (
  event: ExtendableMessageEvent, 
  data: RefreshApiCacheMessage
): Promise<void> => {
  const { url } = data.payload;
  
  try {
    const cache = await caches.open(CACHE_NAMES.API);
    
    if (url) {
      // 刷新特定URL的缓存
      await cache.delete(url);
      console.log('🔄 已刷新缓存:', url);
    } else {
      // 清空所有API缓存
      const keys = await cache.keys();
      await Promise.all(keys.map(key => cache.delete(key)));
      console.log('🔄 已清空所有API缓存:', keys.length, '个条目');
    }
    
    // 回复成功消息
    if (event.source) {
      (event.source as Client).postMessage({
        type: 'REFRESH_API_CACHE_SUCCESS',
        payload: { url }
      });
    }
  } catch (error: any) {
    console.error('刷新API缓存失败:', error);
    
    // 回复失败消息
    if (event.source) {
      (event.source as Client).postMessage({
        type: 'REFRESH_API_CACHE_ERROR',
        payload: { error: error?.message || 'Unknown error' }
      });
    }
  }
};

/**
 * 处理获取缓存信息请求
 */
const handleGetCacheInfo = async (
  event: ExtendableMessageEvent, 
  _data: GetCacheInfoMessage
): Promise<void> => {
  try {
    const cacheInfo = await getCacheInfo();
    
    // 通过 MessageChannel 回复缓存信息
    if (event.ports && event.ports.length > 0) {
      event.ports[0].postMessage(cacheInfo);
    }
  } catch (error: any) {
    console.error('获取缓存信息失败:', error);
    
    // 回复错误信息
    if (event.ports && event.ports.length > 0) {
      event.ports[0].postMessage({
        error: error?.message || 'Unknown error'
      });
    }
  }
};

/**
 * 获取缓存信息
 */
const getCacheInfo = async (): Promise<CacheInfo> => {
  const cacheNames = await caches.keys();
  const cacheInfo: CacheInfo = {
    summary: {
      totalCaches: 0,
      totalEntries: 0,
      totalSize: '0 B'
    },
    caches: {}
  };
  
  let totalSize = 0;
  let totalEntries = 0;
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    const entries: CacheEntry[] = [];
    let cacheSize = 0;
    
    for (const request of keys) {
      const response = await cache.match(request);
      if (response) {
        const responseText = await response.clone().text();
        const size = new Blob([responseText]).size;
        const cachedTime = parseInt(response.headers.get('sw-cached-time') || '0');
        const isExpired = cachedTime ? (Date.now() - cachedTime) > (24 * 60 * 60 * 1000) : false;
        
        entries.push({
          url: request.url,
          method: request.method,
          cachedTime,
          size: formatBytes(size),
          isExpired,
          headers: Object.fromEntries(response.headers.entries())
        });
        
        cacheSize += size;
      }
    }
    
    cacheInfo.caches[cacheName] = {
      entryCount: entries.length,
      size: formatBytes(cacheSize),
      entries
    };
    
    totalSize += cacheSize;
    totalEntries += entries.length;
  }
  
  cacheInfo.summary = {
    totalCaches: cacheNames.length,
    totalEntries,
    totalSize: formatBytes(totalSize)
  };
  
  return cacheInfo;
};

/**
 * 格式化字节大小
 */
const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * 清理过期的缓存
 */
const cleanupOldCaches = async (): Promise<void> => {
  const cacheNames = await caches.keys();
  const validCacheNames = Object.values(CACHE_NAMES);
  
  const deletePromises = cacheNames
    .filter(cacheName => !validCacheNames.includes(cacheName))
    .map(cacheName => caches.delete(cacheName));
  
  await Promise.all(deletePromises);
  
  if (deletePromises.length > 0) {
    console.log('🗑️ 已清理', deletePromises.length, '个过期缓存');
  }
};

/**
 * 清理过期的API缓存条目
 */
const cleanExpiredApiCache = async (): Promise<void> => {
  const options: CacheCleanupOptions = {
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7天
    maxEntries: 1000
  };
  
  try {
    const cache = await caches.open(CACHE_NAMES.API);
    const keys = await cache.keys();
    
    let deletedCount = 0;
    
    for (const request of keys) {
      const response = await cache.match(request);
      if (response) {
        const cachedTime = parseInt(response.headers.get('sw-cached-time') || '0');
        const isExpired = cachedTime ? (Date.now() - cachedTime) > options.maxAge : true;
        
        if (isExpired) {
          await cache.delete(request);
          deletedCount++;
        }
      }
    }
    
    // 如果条目数量超过限制，删除最旧的条目
    const remainingKeys = await cache.keys();
    if (remainingKeys.length > (options.maxEntries || 1000)) {
      const excessCount = remainingKeys.length - (options.maxEntries || 1000);
      for (let i = 0; i < excessCount; i++) {
        await cache.delete(remainingKeys[i]);
        deletedCount++;
      }
    }
    
    if (deletedCount > 0) {
      console.log('🗑️ 已清理', deletedCount, '个过期API缓存条目');
    }
  } catch (error) {
    console.error('清理过期API缓存失败:', error);
  }
};

/**
 * 处理缓存统计请求
 */
const handleGetCacheStats = async (event: ExtendableMessageEvent): Promise<void> => {
  try {
    let totalRequests = 0;
    let cacheHits = 0;
    
    // 这里可以实现更复杂的统计逻辑
    // 现在简单模拟一些数据
    const cacheNames = await caches.keys();
    
    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const keys = await cache.keys();
      totalRequests += keys.length;
      cacheHits += Math.floor(keys.length * 0.8); // 模拟80%命中率
    }
    
    if (event.source) {
      (event.source as Client).postMessage({
        type: 'CACHE_STATS_RESPONSE',
        payload: {
          hits: cacheHits,
          total: totalRequests
        }
      });
    }
  } catch (error) {
    console.error('获取缓存统计失败:', error);
  }
};

/**
 * 处理数据同步请求
 */
const handleSyncData = async (_event: ExtendableMessageEvent, data: any): Promise<void> => {
  try {
    console.log('🔄 开始数据同步:', data.payload?.task);
    
    // 这里可以实现实际的数据同步逻辑
    // 例如：清理过期缓存、预加载重要数据等
    
    if (data.payload?.task) {
      // 根据任务类型执行不同的同步操作
      switch (data.payload.task) {
        case '同步用户数据':
          await syncUserData();
          break;
        case '同步文章数据':
          await syncPostsData();
          break;
        case '同步评论数据':
          await syncCommentsData();
          break;
        case '同步相册数据':
          await syncAlbumsData();
          break;
      }
    }
    
    // 通知客户端同步完成
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_COMPLETED',
        payload: {
          task: data.payload?.task,
          timestamp: Date.now()
        }
      });
    });
    
  } catch (error) {
    console.error('数据同步失败:', error);
  }
};

/**
 * 处理打开应用请求
 */
const handleOpenApp = async (_event: ExtendableMessageEvent): Promise<void> => {
  try {
    // 获取所有客户端
    const clients = await self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    });
    
    // 如果有已打开的客户端，聚焦到它
    if (clients.length > 0) {
      const client = clients[0] as WindowClient;
      if (client.focus) {
        await client.focus();
      }
      return;
    }
    
    // 如果没有打开的客户端，打开新窗口
    if (self.clients.openWindow) {
      await self.clients.openWindow('/');
    }
    
    console.log('✅ 应用已打开');
  } catch (error) {
    console.error('打开应用失败:', error);
  }
};

/**
 * 同步用户数据
 */
const syncUserData = async (): Promise<void> => {
  try {
    const cache = await caches.open(CACHE_NAMES.API);
    const userRequests = (await cache.keys()).filter(request => 
      request.url.includes('/users')
    );
    
    // 清理过期的用户数据缓存
    for (const request of userRequests) {
      const response = await cache.match(request);
      if (response) {
        const cachedTime = response.headers.get('sw-cached-time');
        if (cachedTime) {
          const age = Date.now() - parseInt(cachedTime);
          if (age > 60 * 60 * 1000) { // 1小时
            await cache.delete(request);
          }
        }
      }
    }
    
    console.log('✅ 用户数据同步完成');
  } catch (error) {
    console.error('❌ 用户数据同步失败:', error);
  }
};

/**
 * 同步文章数据
 */
const syncPostsData = async (): Promise<void> => {
  try {
    const cache = await caches.open(CACHE_NAMES.API);
    const postRequests = (await cache.keys()).filter(request => 
      request.url.includes('/posts')
    );
    
    // 清理过期的文章数据缓存
    for (const request of postRequests) {
      const response = await cache.match(request);
      if (response) {
        const cachedTime = response.headers.get('sw-cached-time');
        if (cachedTime) {
          const age = Date.now() - parseInt(cachedTime);
          if (age > 45 * 60 * 1000) { // 45分钟
            await cache.delete(request);
          }
        }
      }
    }
    
    console.log('✅ 文章数据同步完成');
  } catch (error) {
    console.error('❌ 文章数据同步失败:', error);
  }
};

/**
 * 同步评论数据
 */
const syncCommentsData = async (): Promise<void> => {
  try {
    const cache = await caches.open(CACHE_NAMES.API);
    const commentRequests = (await cache.keys()).filter(request => 
      request.url.includes('/comments')
    );
    
    // 清理过期的评论数据缓存
    for (const request of commentRequests) {
      const response = await cache.match(request);
      if (response) {
        const cachedTime = response.headers.get('sw-cached-time');
        if (cachedTime) {
          const age = Date.now() - parseInt(cachedTime);
          if (age > 30 * 60 * 1000) { // 30分钟
            await cache.delete(request);
          }
        }
      }
    }
    
    console.log('✅ 评论数据同步完成');
  } catch (error) {
    console.error('❌ 评论数据同步失败:', error);
  }
};

/**
 * 同步相册数据
 */
const syncAlbumsData = async (): Promise<void> => {
  try {
    const cache = await caches.open(CACHE_NAMES.API);
    const albumRequests = (await cache.keys()).filter(request => 
      request.url.includes('/albums')
    );
    
    // 清理过期的相册数据缓存
    for (const request of albumRequests) {
      const response = await cache.match(request);
      if (response) {
        const cachedTime = response.headers.get('sw-cached-time');
        if (cachedTime) {
          const age = Date.now() - parseInt(cachedTime);
          if (age > 60 * 60 * 1000) { // 1小时
            await cache.delete(request);
          }
        }
      }
    }
    
    console.log('✅ 相册数据同步完成');
  } catch (error) {
    console.error('❌ 相册数据同步失败:', error);
  }
};

// 定期清理过期缓存（每小时执行一次）
setInterval(() => {
  cleanExpiredApiCache().catch(error => {
    console.error('定期清理缓存失败:', error);
  });
}, 60 * 60 * 1000);

console.log('🚀 Service Worker (TypeScript) 已加载');

export {};
