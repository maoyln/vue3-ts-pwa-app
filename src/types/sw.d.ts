// Service Worker 类型定义

// 全局 Service Worker 接口扩展
declare global {
  interface ServiceWorkerGlobalScope {
    // 添加自定义属性
    __WB_MANIFEST?: any;
  }
}

// 缓存策略选项
export interface CacheOptions {
  networkTimeout?: number;
  cacheTimeout?: number;
  maxAge?: number;
  staleWhileRevalidate?: boolean;
  forceRefresh?: boolean;
}

// 缓存名称配置
export interface CacheNames {
  PRECACHE: string;
  DYNAMIC: string;
  API: string;
  IMAGES: string;
  FONTS: string;
  STATIC: string;
}

// Service Worker 消息类型
export interface ServiceWorkerMessage {
  type: string;
  payload?: any;
}

// API 数据更新消息
export interface ApiDataUpdatedMessage extends ServiceWorkerMessage {
  type: 'API_DATA_UPDATED';
  payload: {
    url: string;
    timestamp: number;
  };
}

// 缓存失效消息
export interface CacheInvalidatedMessage extends ServiceWorkerMessage {
  type: 'CACHE_INVALIDATED';
  payload: {
    resourceType: string;
    method: string;
    cleanedCount: number;
  };
}

// 缓存信息请求消息
export interface GetCacheInfoMessage extends ServiceWorkerMessage {
  type: 'GET_CACHE_INFO';
  payload: {};
}

// 刷新API缓存消息
export interface RefreshApiCacheMessage extends ServiceWorkerMessage {
  type: 'REFRESH_API_CACHE';
  payload: {
    url?: string;
  };
}

// 缓存信息响应
export interface CacheInfo {
  summary: {
    totalCaches: number;
    totalEntries: number;
    totalSize: string;
  };
  caches: {
    [cacheName: string]: {
      entryCount: number;
      size: string;
      entries: CacheEntry[];
    };
  };
}

// 缓存条目信息
export interface CacheEntry {
  url: string;
  method: string;
  cachedTime: number;
  size: string;
  isExpired: boolean;
  headers: { [key: string]: string };
}

// 网络请求处理函数类型
export type RequestHandler = (
  request: Request, 
  cacheName: string, 
  options?: CacheOptions
) => Promise<Response>;

// 缓存清理选项
export interface CacheCleanupOptions {
  maxAge: number;
  maxEntries?: number;
}

// Fetch 事件扩展
export interface FetchEventExtended extends FetchEvent {
  // 可以添加自定义属性
}

// Install 事件扩展
export interface InstallEventExtended extends ExtendableEvent {
  // 可以添加自定义属性
}

// Activate 事件扩展
export interface ActivateEventExtended extends ExtendableEvent {
  // 可以添加自定义属性
}

// Message 事件扩展
export interface MessageEventExtended extends ExtendableEvent {
  data: ServiceWorkerMessage;
  source: WindowClient | MessagePort | ServiceWorker | null;
  ports: readonly MessagePort[];
}

export {};
