/**
 * @Author: maoyl maoyl@glodon.com
 * @Date: 2025-08-24 12:45:00
 * @LastEditors: maoyl maoyl@glodon.com
 * @LastEditTime: 2025-08-24 12:45:00
 * @FilePath: /my-vue3-ts-pwa-app/src/api/index.ts
 * @Description: API服务层 - 统一的接口管理
 */

import http from '../utils/http'
import type { HttpRequestConfig, HttpResponse } from '../utils/http'

// API基础配置
export const API_CONFIG = {
  BASE_URL: 'https://jsonplaceholder.typicode.com',
  WEATHER_URL: 'https://api.openweathermap.org/data/2.5',
  NEWS_URL: 'https://newsapi.org/v2',
  TIMEOUT: 10000,
  CACHE_TIME: 5 * 60 * 1000, // 5分钟缓存
}

// 通用数据类型
export interface User {
  id: number
  name: string
  username: string
  email: string
  address: {
    street: string
    suite: string
    city: string
    zipcode: string
    geo: {
      lat: string
      lng: string
    }
  }
  phone: string
  website: string
  company: {
    name: string
    catchPhrase: string
    bs: string
  }
}

export interface Post {
  id: number
  userId: number
  title: string
  body: string
  createdAt?: Date
}

export interface Comment {
  id: number
  postId: number
  name: string
  email: string
  body: string
}

export interface Album {
  id: number
  userId: number
  title: string
}

export interface Photo {
  id: number
  albumId: number
  title: string
  url: string
  thumbnailUrl: string
}

export interface WeatherData {
  coord: {
    lon: number
    lat: number
  }
  weather: Array<{
    id: number
    main: string
    description: string
    icon: string
  }>
  base: string
  main: {
    temp: number
    feels_like: number
    temp_min: number
    temp_max: number
    pressure: number
    humidity: number
  }
  visibility: number
  wind: {
    speed: number
    deg: number
  }
  clouds: {
    all: number
  }
  dt: number
  sys: {
    type: number
    id: number
    country: string
    sunrise: number
    sunset: number
  }
  timezone: number
  id: number
  name: string
  cod: number
}

// 用户相关API
export class UserAPI {
  // 获取用户列表
  static async getUsers(config?: HttpRequestConfig): Promise<HttpResponse<User[]>> {
    return http.get<User[]>('/users', {
      useCache: true,
      cacheTime: API_CONFIG.CACHE_TIME,
      cacheStrategy: 'networkFirst',
      offlineSupport: true,
      ...config
    })
  }

  // 获取单个用户
  static async getUser(id: number, config?: HttpRequestConfig): Promise<HttpResponse<User>> {
    return http.get<User>(`/users/${id}`, {
      useCache: true,
      cacheTime: API_CONFIG.CACHE_TIME,
      cacheStrategy: 'networkFirst',
      offlineSupport: true,
      ...config
    })
  }

  // 创建用户
  static async createUser(userData: Partial<User>, config?: HttpRequestConfig): Promise<HttpResponse<User>> {
    return http.post<User>('/users', userData, {
      showLoading: true,
      retry: true,
      retryCount: 2,
      ...config
    })
  }

  // 更新用户
  static async updateUser(id: number, userData: Partial<User>, config?: HttpRequestConfig): Promise<HttpResponse<User>> {
    return http.put<User>(`/users/${id}`, userData, {
      showLoading: true,
      retry: true,
      retryCount: 2,
      ...config
    })
  }

  // 删除用户
  static async deleteUser(id: number, config?: HttpRequestConfig): Promise<HttpResponse<void>> {
    return http.delete<void>(`/users/${id}`, {
      showLoading: true,
      retry: true,
      retryCount: 2,
      ...config
    })
  }
}

// 文章相关API
export class PostAPI {
  // 获取文章列表
  static async getPosts(config?: HttpRequestConfig): Promise<HttpResponse<Post[]>> {
    return http.get<Post[]>('/posts', {
      useCache: true,
      cacheTime: API_CONFIG.CACHE_TIME,
      cacheStrategy: 'networkFirst',
      offlineSupport: true,
      ...config
    })
  }

  // 获取单个文章
  static async getPost(id: number, config?: HttpRequestConfig): Promise<HttpResponse<Post>> {
    return http.get<Post>(`/posts/${id}`, {
      useCache: true,
      cacheTime: API_CONFIG.CACHE_TIME,
      cacheStrategy: 'networkFirst',
      offlineSupport: true,
      ...config
    })
  }

  // 获取用户的文章
  static async getUserPosts(userId: number, config?: HttpRequestConfig): Promise<HttpResponse<Post[]>> {
    return http.get<Post[]>(`/users/${userId}/posts`, {
      useCache: true,
      cacheTime: API_CONFIG.CACHE_TIME,
      cacheStrategy: 'networkFirst',
      offlineSupport: true,
      ...config
    })
  }

  // 创建文章
  static async createPost(postData: Partial<Post>, config?: HttpRequestConfig): Promise<HttpResponse<Post>> {
    return http.post<Post>('/posts', postData, {
      showLoading: true,
      retry: true,
      retryCount: 2,
      ...config
    })
  }

  // 更新文章
  static async updatePost(id: number, postData: Partial<Post>, config?: HttpRequestConfig): Promise<HttpResponse<Post>> {
    return http.put<Post>(`/posts/${id}`, postData, {
      showLoading: true,
      retry: true,
      retryCount: 2,
      ...config
    })
  }

  // 删除文章
  static async deletePost(id: number, config?: HttpRequestConfig): Promise<HttpResponse<void>> {
    return http.delete<void>(`/posts/${id}`, {
      showLoading: true,
      retry: true,
      retryCount: 2,
      ...config
    })
  }
}

// 评论相关API
export class CommentAPI {
  // 获取评论列表
  static async getComments(config?: HttpRequestConfig): Promise<HttpResponse<Comment[]>> {
    return http.get<Comment[]>('/comments', {
      useCache: true,
      cacheTime: API_CONFIG.CACHE_TIME,
      cacheStrategy: 'networkFirst',
      offlineSupport: true,
      ...config
    })
  }

  // 获取单个评论
  static async getComment(id: number, config?: HttpRequestConfig): Promise<HttpResponse<Comment>> {
    return http.get<Comment>(`/comments/${id}`, {
      useCache: true,
      cacheTime: API_CONFIG.CACHE_TIME,
      cacheStrategy: 'networkFirst',
      offlineSupport: true,
      ...config
    })
  }

  // 获取文章的评论
  static async getPostComments(postId: number, config?: HttpRequestConfig): Promise<HttpResponse<Comment[]>> {
    return http.get<Comment[]>(`/posts/${postId}/comments`, {
      useCache: true,
      cacheTime: API_CONFIG.CACHE_TIME,
      cacheStrategy: 'networkFirst',
      offlineSupport: true,
      ...config
    })
  }

  // 创建评论
  static async createComment(commentData: Partial<Comment>, config?: HttpRequestConfig): Promise<HttpResponse<Comment>> {
    return http.post<Comment>('/comments', commentData, {
      showLoading: true,
      retry: true,
      retryCount: 2,
      ...config
    })
  }

  // 更新评论
  static async updateComment(id: number, commentData: Partial<Comment>, config?: HttpRequestConfig): Promise<HttpResponse<Comment>> {
    return http.put<Comment>(`/comments/${id}`, commentData, {
      showLoading: true,
      retry: true,
      retryCount: 2,
      ...config
    })
  }

  // 删除评论
  static async deleteComment(id: number, config?: HttpRequestConfig): Promise<HttpResponse<void>> {
    return http.delete<void>(`/comments/${id}`, {
      showLoading: true,
      retry: true,
      retryCount: 2,
      ...config
    })
  }
}

// 相册相关API
export class AlbumAPI {
  // 获取相册列表
  static async getAlbums(config?: HttpRequestConfig): Promise<HttpResponse<Album[]>> {
    return http.get<Album[]>('/albums', {
      useCache: true,
      cacheTime: API_CONFIG.CACHE_TIME,
      cacheStrategy: 'networkFirst',
      offlineSupport: true,
      ...config
    })
  }

  // 获取单个相册
  static async getAlbum(id: number, config?: HttpRequestConfig): Promise<HttpResponse<Album>> {
    return http.get<Album>(`/albums/${id}`, {
      useCache: true,
      cacheTime: API_CONFIG.CACHE_TIME,
      cacheStrategy: 'networkFirst',
      offlineSupport: true,
      ...config
    })
  }

  // 获取用户的相册
  static async getUserAlbums(userId: number, config?: HttpRequestConfig): Promise<HttpResponse<Album[]>> {
    return http.get<Album[]>(`/users/${userId}/albums`, {
      useCache: true,
      cacheTime: API_CONFIG.CACHE_TIME,
      cacheStrategy: 'networkFirst',
      offlineSupport: true,
      ...config
    })
  }

  // 获取相册的照片
  static async getAlbumPhotos(albumId: number, config?: HttpRequestConfig): Promise<HttpResponse<Photo[]>> {
    return http.get<Photo[]>(`/albums/${albumId}/photos`, {
      useCache: true,
      cacheTime: API_CONFIG.CACHE_TIME * 2, // 照片缓存时间更长
      cacheStrategy: 'networkFirst',
      offlineSupport: true,
      ...config
    })
  }

  // 创建相册
  static async createAlbum(albumData: Partial<Album>, config?: HttpRequestConfig): Promise<HttpResponse<Album>> {
    return http.post<Album>('/albums', albumData, {
      showLoading: true,
      retry: true,
      retryCount: 2,
      ...config
    })
  }

  // 更新相册
  static async updateAlbum(id: number, albumData: Partial<Album>, config?: HttpRequestConfig): Promise<HttpResponse<Album>> {
    return http.put<Album>(`/albums/${id}`, albumData, {
      showLoading: true,
      retry: true,
      retryCount: 2,
      ...config
    })
  }

  // 删除相册
  static async deleteAlbum(id: number, config?: HttpRequestConfig): Promise<HttpResponse<void>> {
    return http.delete<void>(`/albums/${id}`, {
      showLoading: true,
      retry: true,
      retryCount: 2,
      ...config
    })
  }
}

// 天气相关API
export class WeatherAPI {
  private static readonly API_KEY = import.meta.env.VITE_WEATHER_API_KEY || 'your_api_key_here'

  // 根据城市名获取天气
  static async getWeatherByCity(city: string, config?: HttpRequestConfig): Promise<HttpResponse<WeatherData>> {
    return http.get<WeatherData>(`${API_CONFIG.WEATHER_URL}/weather`, {
      params: {
        q: city,
        appid: this.API_KEY,
        units: 'metric',
        lang: 'zh_cn'
      },
      useCache: true,
      cacheTime: 10 * 60 * 1000, // 10分钟缓存
      cacheStrategy: 'networkFirst',
      offlineSupport: true,
      baseURL: '', // 覆盖默认baseURL
      ...config
    })
  }

  // 根据坐标获取天气
  static async getWeatherByCoords(lat: number, lon: number, config?: HttpRequestConfig): Promise<HttpResponse<WeatherData>> {
    return http.get<WeatherData>(`${API_CONFIG.WEATHER_URL}/weather`, {
      params: {
        lat,
        lon,
        appid: this.API_KEY,
        units: 'metric',
        lang: 'zh_cn'
      },
      useCache: true,
      cacheTime: 10 * 60 * 1000, // 10分钟缓存
      cacheStrategy: 'networkFirst',
      offlineSupport: true,
      baseURL: '', // 覆盖默认baseURL
      ...config
    })
  }
}

// 新闻相关API
export class NewsAPI {
  private static readonly API_KEY = import.meta.env.VITE_NEWS_API_KEY || 'your_api_key_here'

  // 获取头条新闻
  static async getTopHeadlines(country: string = 'cn', config?: HttpRequestConfig): Promise<HttpResponse<any>> {
    return http.get<any>(`${API_CONFIG.NEWS_URL}/top-headlines`, {
      params: {
        country,
        apiKey: this.API_KEY,
        pageSize: 20
      },
      useCache: true,
      cacheTime: 15 * 60 * 1000, // 15分钟缓存
      cacheStrategy: 'networkFirst',
      offlineSupport: true,
      baseURL: '', // 覆盖默认baseURL
      ...config
    })
  }

  // 搜索新闻
  static async searchNews(query: string, config?: HttpRequestConfig): Promise<HttpResponse<any>> {
    return http.get<any>(`${API_CONFIG.NEWS_URL}/everything`, {
      params: {
        q: query,
        apiKey: this.API_KEY,
        sortBy: 'publishedAt',
        pageSize: 20,
        language: 'zh'
      },
      useCache: true,
      cacheTime: 30 * 60 * 1000, // 30分钟缓存
      cacheStrategy: 'networkFirst',
      offlineSupport: true,
      baseURL: '', // 覆盖默认baseURL
      ...config
    })
  }
}

// 批量请求工具
export class BatchAPI {
  // 并行请求多个接口
  static async parallel<T extends Record<string, Promise<any>>>(requests: T): Promise<{
    [K in keyof T]: T[K] extends Promise<infer U> ? U : never
  }> {
    const keys = Object.keys(requests)
    const promises = Object.values(requests)

    try {
      const results = await Promise.allSettled(promises)
      const response: any = {}

      results.forEach((result, index) => {
        const key = keys[index]
        if (result.status === 'fulfilled') {
          response[key] = result.value
        } else {
          console.error(`批量请求失败 [${key}]:`, result.reason)
          response[key] = null
        }
      })

      return response
    } catch (error) {
      console.error('批量请求异常:', error)
      throw error
    }
  }

  // 串行请求（有依赖关系的请求）
  static async series<T>(requests: Array<() => Promise<T>>): Promise<T[]> {
    const results: T[] = []

    for (const request of requests) {
      try {
        const result = await request()
        results.push(result)
      } catch (error) {
        console.error('串行请求失败:', error)
        throw error
      }
    }

    return results
  }
}

// 不需要重复导出，类已经在定义时导出了

// 默认导出
export default {
  User: UserAPI,
  Post: PostAPI,
  Comment: CommentAPI,
  Album: AlbumAPI,
  Weather: WeatherAPI,
  News: NewsAPI,
  Batch: BatchAPI
}
