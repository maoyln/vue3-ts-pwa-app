<script setup>
import { ref, onMounted } from 'vue'

const showGuide = ref(false)

onMounted(() => {
  // 检查是否是新安装的PWA
  if (window.matchMedia('(display-mode: standalone)').matches) {
    const isFirstRun = !localStorage.getItem('pwaInstalled')
    if (isFirstRun) {
      showGuide.value = true
      localStorage.setItem('pwaInstalled', 'true')
    }
  }
})
</script>

<template>
  <div v-if="showGuide" class="pwa-guide">
    <div class="guide-content">
      <h3>🎉 应用已安装!</h3>
      <p>您现在可以像使用普通应用一样使用本应用</p>
      <ul>
        <li>点击图标直接打开</li>
        <li>支持离线使用</li>
        <li>自动更新</li>
      </ul>
      <button @click="showGuide = false">我知道了</button>
    </div>
  </div>
</template>

<style scoped>
.pwa-guide {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  z-index: 10000;
  display: flex;
  justify-content: center;
  align-items: center;
}

.guide-content {
  background: white;
  padding: 24px;
  border-radius: 12px;
  max-width: 400px;
  text-align: center;
}

.guide-content h3 {
  color: #42b983;
  margin-top: 0;
}

.guide-content button {
  background: #42b983;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  margin-top: 16px;
  cursor: pointer;
}
</style>