<script setup>
import { ref, onMounted } from 'vue'

const deferredPrompt = ref(null)
const showInstallPrompt = ref(false)

onMounted(() => {
  // 监听 beforeinstallprompt 事件
  window.addEventListener('beforeinstallprompt', (e) => {
    // 阻止自动显示浏览器的安装提示
    // e.preventDefault()
    // 保存事件以便后续触发
    deferredPrompt.value = e
    // 显示我们的安装按钮
    showInstallPrompt.value = true
  })

  // 监听应用安装状态
  window.addEventListener('appinstalled', () => {
    console.log('应用已安装')
    showInstallPrompt.value = false
    deferredPrompt.value = null
  })
})

const installApp = async () => {
  if (deferredPrompt.value) {
    // 显示浏览器的安装提示
    deferredPrompt.value.prompt()
    // 等待用户选择
    const { outcome } = await deferredPrompt.value.userChoice
    console.log(`用户选择: ${outcome}`)
    // 无论用户选择什么，我们都不要再显示安装按钮
    showInstallPrompt.value = false
    deferredPrompt.value = null
  }
}

// 检查是否已经是PWA环境
const isRunningAsPWA = () => {
  return window.matchMedia('(display-mode: standalone)').matches || 
         window.navigator.standalone ||
         document.referrer.includes('android-app://')
}
</script>

<template>
  <div v-if="showInstallPrompt && !isRunningAsPWA()" class="install-prompt">
    <div class="install-content">
      <div class="install-icon">
        <img src="/pwa-192x192.png" alt="应用图标" width="48" height="48">
      </div>
      <div class="install-text">
        <h3>安装应用</h3>
        <p>添加到主屏幕，获得更好的体验</p>
      </div>
      <button class="install-button" @click="installApp">安装</button>
      <button class="install-close" @click="showInstallPrompt = false">×</button>
    </div>
  </div>
</template>

<style scoped>
.install-prompt {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  width: calc(100% - 40px);
  max-width: 500px;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  padding: 12px 16px;
  display: flex;
  align-items: center;
  animation: slide-up 0.3s ease-out;
}

.install-content {
  display: flex;
  align-items: center;
  width: 100%;
}

.install-icon {
  margin-right: 12px;
}

.install-icon img {
  border-radius: 12px;
}

.install-text {
  flex: 1;
}

.install-text h3 {
  margin: 0 0 4px 0;
  font-size: 16px;
  color: #2c3e50;
}

.install-text p {
  margin: 0;
  font-size: 14px;
  color: #7f8c8d;
}

.install-button {
  background: #42b983;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  margin-left: 12px;
  cursor: pointer;
  transition: background 0.2s;
}

.install-button:hover {
  background: #3aa876;
}

.install-close {
  background: none;
  border: none;
  font-size: 20px;
  color: #95a5a6;
  cursor: pointer;
  margin-left: 8px;
  padding: 0 8px;
}

@keyframes slide-up {
  from {
    opacity: 0;
    transform: translate(-50%, 20px);
  }
  to {
    opacity: 1;
    transform: translate(-50%, 0);
  }
}

@media (max-width: 480px) {
  .install-prompt {
    bottom: 10px;
    width: calc(100% - 20px);
  }
  
  .install-button {
    padding: 6px 12px;
  }
}
</style>