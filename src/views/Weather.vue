<template>
  <div class="weather">
    <div class="weather-header">
      <h1>
        <i class="weather-icon">🌤️</i>
        天气预报
      </h1>
      <p>实时天气信息</p>
    </div>

    <!-- 城市搜索 -->
    <div class="search-section">
      <div class="search-box">
        <input
          v-model="searchCity"
          @keyup.enter="searchWeather"
          placeholder="请输入城市名称（如：北京、上海）"
          class="search-input"
        />
        <button @click="searchWeather" :disabled="loading" class="search-btn">
          {{ loading ? '搜索中...' : '搜索' }}
        </button>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading">
      <div class="loading-spinner"></div>
      <p>正在获取天气信息...</p>
    </div>

    <!-- 错误信息 -->
    <div v-if="error" class="error">
      <div class="error-icon">⚠️</div>
      <p>{{ error }}</p>
      <button @click="retryWeather" class="retry-btn">重试</button>
    </div>

    <!-- 天气信息 -->
    <div v-if="weatherData && !loading" class="weather-content">
      <!-- 当前天气 -->
      <div class="current-weather">
        <div class="weather-main">
          <div class="temperature">
            <span class="temp-value">{{ Math.round(weatherData.main.temp) }}</span>
            <span class="temp-unit">°C</span>
          </div>
          <div class="weather-desc">
            <div class="desc-text">{{ getWeatherDesc(weatherData.weather[0].main) }}</div>
            <div class="city-name">{{ weatherData.name }}</div>
          </div>
        </div>
        <div class="weather-emoji">
          {{ getWeatherEmoji(weatherData.weather[0].main) }}
        </div>
      </div>

      <!-- 详细信息 -->
      <div class="weather-details">
        <div class="detail-item">
          <div class="detail-icon">🌡️</div>
          <div class="detail-content">
            <div class="detail-label">体感温度</div>
            <div class="detail-value">{{ Math.round(weatherData.main.feels_like) }}°C</div>
          </div>
        </div>
        
        <div class="detail-item">
          <div class="detail-icon">💧</div>
          <div class="detail-content">
            <div class="detail-label">湿度</div>
            <div class="detail-value">{{ weatherData.main.humidity }}%</div>
          </div>
        </div>
        
        <div class="detail-item">
          <div class="detail-icon">🌪️</div>
          <div class="detail-content">
            <div class="detail-label">风速</div>
            <div class="detail-value">{{ weatherData.wind?.speed || 0 }} m/s</div>
          </div>
        </div>
        
        <div class="detail-item">
          <div class="detail-icon">👁️</div>
          <div class="detail-content">
            <div class="detail-label">能见度</div>
            <div class="detail-value">{{ (weatherData.visibility / 1000).toFixed(1) }} km</div>
          </div>
        </div>
      </div>

      <!-- 更新时间 -->
      <div class="update-time">
        最后更新：{{ formatTime(weatherData.dt) }}
      </div>
    </div>

    <!-- 默认提示 -->
    <div v-if="!weatherData && !loading && !error" class="empty-state">
      <div class="empty-icon">🔍</div>
      <p>请输入城市名称查询天气信息</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

// 天气数据接口定义
interface WeatherData {
  name: string
  main: {
    temp: number
    feels_like: number
    humidity: number
  }
  weather: Array<{
    main: string
    description: string
  }>
  wind: {
    speed: number
  }
  visibility: number
  dt: number
}

// 响应式数据
const searchCity = ref('北京')
const weatherData = ref<WeatherData | null>(null)
const loading = ref(false)
const error = ref('')

// OpenWeatherMap API密钥 (这里使用免费的公共API)
const API_KEY = '895284fb2d2c50a520ea537456963d9c' // 这是一个示例密钥，实际使用请申请自己的密钥

// 获取天气信息
const getWeather = async (city: string) => {
  loading.value = true
  error.value = ''
  
  try {
    // 使用OpenWeatherMap API
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric&lang=zh_cn`
    )
    
    if (!response.ok) {
      throw new Error('城市未找到或网络错误')
    }
    
    const data = await response.json()
    weatherData.value = data
    
    // 保存到localStorage以便离线使用
    localStorage.setItem('lastWeatherData', JSON.stringify(data))
    localStorage.setItem('lastWeatherCity', city)
    
  } catch (err: any) {
    error.value = err.message || '获取天气信息失败'
    
    // 尝试从缓存获取数据
    const cachedData = localStorage.getItem('lastWeatherData')
    const cachedCity = localStorage.getItem('lastWeatherCity')
    
    if (cachedData && cachedCity === city) {
      weatherData.value = JSON.parse(cachedData)
      error.value = '网络连接失败，显示缓存数据'
    }
  } finally {
    loading.value = false
  }
}

// 搜索天气
const searchWeather = () => {
  if (searchCity.value.trim()) {
    getWeather(searchCity.value.trim())
  }
}

// 重试
const retryWeather = () => {
  if (searchCity.value.trim()) {
    getWeather(searchCity.value.trim())
  }
}

// 获取天气描述
const getWeatherDesc = (weather: string): string => {
  const weatherMap: { [key: string]: string } = {
    'Clear': '晴朗',
    'Clouds': '多云',
    'Rain': '雨天',
    'Drizzle': '小雨',
    'Thunderstorm': '雷雨',
    'Snow': '雪天',
    'Mist': '薄雾',
    'Fog': '雾',
    'Haze': '霾'
  }
  return weatherMap[weather] || weather
}

// 获取天气图标
const getWeatherEmoji = (weather: string): string => {
  const emojiMap: { [key: string]: string } = {
    'Clear': '☀️',
    'Clouds': '☁️',
    'Rain': '🌧️',
    'Drizzle': '🌦️',
    'Thunderstorm': '⛈️',
    'Snow': '🌨️',
    'Mist': '🌫️',
    'Fog': '🌫️',
    'Haze': '😶‍🌫️'
  }
  return emojiMap[weather] || '🌤️'
}

// 格式化时间
const formatTime = (timestamp: number): string => {
  return new Date(timestamp * 1000).toLocaleString('zh-CN')
}

// 监听Service Worker的API数据更新事件
const handleApiDataUpdated = (event: any) => {
  const { url } = event.detail
  if (url && url.includes('openweathermap.org')) {
    console.log('🔄 天气数据已在后台更新，重新获取...')
    // 重新获取当前城市的天气数据
    if (searchCity.value) {
      getWeather(searchCity.value)
    }
  }
}

// 组件挂载时加载默认城市天气
onMounted(() => {
  // 监听Service Worker的API数据更新
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data.type === 'API_DATA_UPDATED') {
        handleApiDataUpdated({ detail: event.data.payload })
      }
    })
  }
  
  // 尝试从缓存加载数据
  const cachedData = localStorage.getItem('lastWeatherData')
  if (cachedData) {
    weatherData.value = JSON.parse(cachedData)
  }
  
  // 获取最新数据
  getWeather(searchCity.value)
})
</script>

<style scoped>
.weather {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.weather-header {
  text-align: center;
  margin-bottom: 32px;
}

.weather-header h1 {
  font-size: 2.5rem;
  color: #1f2937;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.weather-icon {
  font-size: 3rem;
}

.weather-header p {
  color: #6b7280;
  font-size: 1.1rem;
}

.search-section {
  margin-bottom: 32px;
}

.search-box {
  display: flex;
  gap: 12px;
  max-width: 500px;
  margin: 0 auto;
}

.search-input {
  flex: 1;
  padding: 12px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s ease;
}

.search-input:focus {
  outline: none;
  border-color: #3b82f6;
}

.search-btn {
  padding: 12px 24px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s ease;
  min-width: 80px;
}

.search-btn:hover:not(:disabled) {
  background: #2563eb;
}

.search-btn:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #6b7280;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e5e7eb;
  border-left-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error {
  text-align: center;
  padding: 40px;
  color: #dc2626;
}

.error-icon {
  font-size: 3rem;
  margin-bottom: 16px;
}

.retry-btn {
  margin-top: 16px;
  padding: 8px 16px;
  background: #dc2626;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.retry-btn:hover {
  background: #b91c1c;
}

.weather-content {
  animation: fadeIn 0.5s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.current-weather {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
  padding: 40px 32px;
  border-radius: 16px;
  margin-bottom: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.weather-main {
  flex: 1;
}

.temperature {
  display: flex;
  align-items: baseline;
  margin-bottom: 16px;
}

.temp-value {
  font-size: 4rem;
  font-weight: 300;
}

.temp-unit {
  font-size: 2rem;
  opacity: 0.8;
  margin-left: 4px;
}

.desc-text {
  font-size: 1.25rem;
  margin-bottom: 4px;
}

.city-name {
  font-size: 1rem;
  opacity: 0.8;
}

.weather-emoji {
  font-size: 6rem;
}

.weather-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.detail-item {
  background: white;
  padding: 20px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.detail-icon {
  font-size: 2rem;
}

.detail-content {
  flex: 1;
}

.detail-label {
  color: #6b7280;
  font-size: 0.875rem;
  margin-bottom: 4px;
}

.detail-value {
  color: #1f2937;
  font-size: 1.125rem;
  font-weight: 600;
}

.update-time {
  text-align: center;
  color: #6b7280;
  font-size: 0.875rem;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #6b7280;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 16px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .weather-header h1 {
    font-size: 2rem;
  }
  
  .weather-icon {
    font-size: 2.5rem;
  }
  
  .search-box {
    flex-direction: column;
  }
  
  .current-weather {
    flex-direction: column;
    text-align: center;
    gap: 24px;
  }
  
  .weather-emoji {
    font-size: 4rem;
  }
  
  .temp-value {
    font-size: 3rem;
  }
  
  .weather-details {
    grid-template-columns: 1fr;
  }
}
</style>
