/**
 * @Author: maoyl maoyl@glodon.com
 * @Date: 2025-08-24 13:30:00
 * @LastEditors: maoyl maoyl@glodon.com
 * @LastEditTime: 2025-08-24 13:30:00
 * @FilePath: /my-vue3-ts-pwa-app/src/utils/fetchMigrationHelper.ts
 * @Description: Fetch迁移辅助工具 - 帮助快速替换项目中的fetch调用
 */

import { UserAPI, PostAPI, CommentAPI, AlbumAPI, WeatherAPI } from '../api'
import type { HttpRequestConfig } from './http'

// 通用的fetch替换配置
export const DEFAULT_FETCH_CONFIG: HttpRequestConfig = {
  useCache: true,
  cacheTime: 5 * 60 * 1000, // 5分钟缓存
  cacheStrategy: 'networkFirst',
  offlineSupport: true,
  retry: true,
  retryCount: 3,
  showLoading: false // 通常由组件自己管理loading状态
}

// 创建操作的配置
export const CREATE_CONFIG: HttpRequestConfig = {
  retry: true,
  retryCount: 2,
  showLoading: true,
  useCache: false
}

// 更新操作的配置
export const UPDATE_CONFIG: HttpRequestConfig = {
  retry: true,
  retryCount: 2,
  showLoading: true,
  useCache: false
}

// 删除操作的配置
export const DELETE_CONFIG: HttpRequestConfig = {
  retry: true,
  retryCount: 2,
  showLoading: true,
  useCache: false
}

// 静默操作的配置（用于后台数据获取）
export const SILENT_CONFIG: HttpRequestConfig = {
  ...DEFAULT_FETCH_CONFIG,
  silent: true,
  showLoading: false,
  showError: false
}

/**
 * 用户相关的fetch替换函数
 */
export const userFetchReplacements = {
  // 获取用户列表
  async getUsers(forceRefresh = false) {
    const config = {
      ...DEFAULT_FETCH_CONFIG,
      cacheStrategy: forceRefresh ? 'networkOnly' : 'networkFirst'
    } as const
    
    const response = await UserAPI.getUsers(config)
    
    if (!response.success) {
      throw new Error(response.message || '获取用户数据失败')
    }
    
    return {
      data: response.data,
      fromCache: response.fromCache,
      offline: response.offline,
      source: response.fromCache ? '缓存' : '网络'
    }
  },

  // 创建用户
  async createUser(userData: any) {
    const response = await UserAPI.createUser(userData, CREATE_CONFIG)
    
    if (!response.success) {
      throw new Error(response.message || '创建用户失败')
    }
    
    return response.data
  },

  // 更新用户
  async updateUser(id: number, userData: any) {
    const response = await UserAPI.updateUser(id, userData, UPDATE_CONFIG)
    
    if (!response.success) {
      throw new Error(response.message || '更新用户失败')
    }
    
    return response.data
  },

  // 删除用户
  async deleteUser(id: number) {
    const response = await UserAPI.deleteUser(id, DELETE_CONFIG)
    
    if (!response.success) {
      throw new Error(response.message || '删除用户失败')
    }
    
    return true
  }
}

/**
 * 文章相关的fetch替换函数
 */
export const postFetchReplacements = {
  // 获取文章列表
  async getPosts(forceRefresh = false) {
    const config = {
      ...DEFAULT_FETCH_CONFIG,
      cacheStrategy: forceRefresh ? 'networkOnly' : 'networkFirst'
    } as const
    
    const response = await PostAPI.getPosts(config)
    
    if (!response.success) {
      throw new Error(response.message || '获取文章数据失败')
    }
    
    return {
      data: response.data,
      fromCache: response.fromCache,
      offline: response.offline,
      source: response.fromCache ? '缓存' : '网络'
    }
  },

  // 创建文章
  async createPost(postData: any) {
    const response = await PostAPI.createPost(postData, CREATE_CONFIG)
    
    if (!response.success) {
      throw new Error(response.message || '创建文章失败')
    }
    
    return response.data
  },

  // 更新文章
  async updatePost(id: number, postData: any) {
    const response = await PostAPI.updatePost(id, postData, UPDATE_CONFIG)
    
    if (!response.success) {
      throw new Error(response.message || '更新文章失败')
    }
    
    return response.data
  },

  // 删除文章
  async deletePost(id: number) {
    const response = await PostAPI.deletePost(id, DELETE_CONFIG)
    
    if (!response.success) {
      throw new Error(response.message || '删除文章失败')
    }
    
    return true
  }
}

/**
 * 评论相关的fetch替换函数
 */
export const commentFetchReplacements = {
  // 获取评论列表
  async getComments(forceRefresh = false) {
    const config = {
      ...DEFAULT_FETCH_CONFIG,
      cacheStrategy: forceRefresh ? 'networkOnly' : 'networkFirst'
    } as const
    
    const response = await CommentAPI.getComments(config)
    
    if (!response.success) {
      throw new Error(response.message || '获取评论数据失败')
    }
    
    return {
      data: response.data,
      fromCache: response.fromCache,
      offline: response.offline,
      source: response.fromCache ? '缓存' : '网络'
    }
  },

  // 创建评论
  async createComment(commentData: any) {
    const response = await CommentAPI.createComment(commentData, CREATE_CONFIG)
    
    if (!response.success) {
      throw new Error(response.message || '创建评论失败')
    }
    
    return response.data
  },

  // 更新评论
  async updateComment(id: number, commentData: any) {
    const response = await CommentAPI.updateComment(id, commentData, UPDATE_CONFIG)
    
    if (!response.success) {
      throw new Error(response.message || '更新评论失败')
    }
    
    return response.data
  },

  // 删除评论
  async deleteComment(id: number) {
    const response = await CommentAPI.deleteComment(id, DELETE_CONFIG)
    
    if (!response.success) {
      throw new Error(response.message || '删除评论失败')
    }
    
    return true
  }
}

/**
 * 相册相关的fetch替换函数
 */
export const albumFetchReplacements = {
  // 获取相册列表
  async getAlbums(forceRefresh = false) {
    const config = {
      ...DEFAULT_FETCH_CONFIG,
      cacheStrategy: forceRefresh ? 'networkOnly' : 'networkFirst'
    } as const
    
    const response = await AlbumAPI.getAlbums(config)
    
    if (!response.success) {
      throw new Error(response.message || '获取相册数据失败')
    }
    
    return {
      data: response.data,
      fromCache: response.fromCache,
      offline: response.offline,
      source: response.fromCache ? '缓存' : '网络'
    }
  },

  // 创建相册
  async createAlbum(albumData: any) {
    const response = await AlbumAPI.createAlbum(albumData, CREATE_CONFIG)
    
    if (!response.success) {
      throw new Error(response.message || '创建相册失败')
    }
    
    return response.data
  },

  // 更新相册
  async updateAlbum(id: number, albumData: any) {
    const response = await AlbumAPI.updateAlbum(id, albumData, UPDATE_CONFIG)
    
    if (!response.success) {
      throw new Error(response.message || '更新相册失败')
    }
    
    return response.data
  },

  // 删除相册
  async deleteAlbum(id: number) {
    const response = await AlbumAPI.deleteAlbum(id, DELETE_CONFIG)
    
    if (!response.success) {
      throw new Error(response.message || '删除相册失败')
    }
    
    return true
  }
}

/**
 * 天气相关的fetch替换函数
 */
export const weatherFetchReplacements = {
  // 根据城市获取天气
  async getWeatherByCity(city: string) {
    const config = {
      ...DEFAULT_FETCH_CONFIG,
      cacheTime: 10 * 60 * 1000, // 天气数据10分钟缓存
    }
    
    const response = await WeatherAPI.getWeatherByCity(city, config)
    
    if (!response.success) {
      throw new Error(response.message || '获取天气数据失败')
    }
    
    return {
      data: response.data,
      fromCache: response.fromCache,
      offline: response.offline
    }
  },

  // 根据坐标获取天气
  async getWeatherByCoords(lat: number, lon: number) {
    const config = {
      ...DEFAULT_FETCH_CONFIG,
      cacheTime: 10 * 60 * 1000, // 天气数据10分钟缓存
    }
    
    const response = await WeatherAPI.getWeatherByCoords(lat, lon, config)
    
    if (!response.success) {
      throw new Error(response.message || '获取天气数据失败')
    }
    
    return {
      data: response.data,
      fromCache: response.fromCache,
      offline: response.offline
    }
  }
}

/**
 * 通用的响应处理函数
 */
export const responseHandlers = {
  // 处理标准响应
  handleStandardResponse(response: any, errorMessage: string) {
    if (!response.success) {
      throw new Error(response.message || errorMessage)
    }
    
    return {
      data: response.data,
      fromCache: response.fromCache,
      offline: response.offline,
      source: response.fromCache ? '缓存' : '网络',
      cacheStatus: response.fromCache ? 'fresh' : 'miss'
    }
  },

  // 处理创建响应
  handleCreateResponse(response: any, errorMessage: string) {
    if (!response.success) {
      throw new Error(response.message || errorMessage)
    }
    
    return response.data
  },

  // 处理更新响应
  handleUpdateResponse(response: any, errorMessage: string) {
    if (!response.success) {
      throw new Error(response.message || errorMessage)
    }
    
    return response.data
  },

  // 处理删除响应
  handleDeleteResponse(response: any, errorMessage: string) {
    if (!response.success) {
      throw new Error(response.message || errorMessage)
    }
    
    return true
  }
}

/**
 * 迁移工具函数
 */
export const migrationUtils = {
  // 创建标准的GET请求替换
  createGetReplacement(apiCall: Function, defaultConfig = DEFAULT_FETCH_CONFIG) {
    return async (forceRefresh = false) => {
      const config = {
        ...defaultConfig,
        cacheStrategy: forceRefresh ? 'networkOnly' : 'networkFirst'
      } as const
      
      const response = await apiCall(config)
      return responseHandlers.handleStandardResponse(response, '请求失败')
    }
  },

  // 创建标准的POST请求替换
  createPostReplacement(apiCall: Function) {
    return async (data: any) => {
      const response = await apiCall(data, CREATE_CONFIG)
      return responseHandlers.handleCreateResponse(response, '创建失败')
    }
  },

  // 创建标准的PUT请求替换
  createPutReplacement(apiCall: Function) {
    return async (id: number, data: any) => {
      const response = await apiCall(id, data, UPDATE_CONFIG)
      return responseHandlers.handleUpdateResponse(response, '更新失败')
    }
  },

  // 创建标准的DELETE请求替换
  createDeleteReplacement(apiCall: Function) {
    return async (id: number) => {
      const response = await apiCall(id, DELETE_CONFIG)
      return responseHandlers.handleDeleteResponse(response, '删除失败')
    }
  }
}

// 不需要重复导出，已在定义时导出

// 默认导出
export default {
  user: userFetchReplacements,
  post: postFetchReplacements,
  comment: commentFetchReplacements,
  album: albumFetchReplacements,
  weather: weatherFetchReplacements,
  handlers: responseHandlers,
  utils: migrationUtils
}
