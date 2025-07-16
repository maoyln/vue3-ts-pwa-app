<script setup>
import { ref, onMounted } from 'vue'

const show = ref(false)
let registration = ref(null)

const updateApp = () => {
  if (registration.value && registration.value.waiting) {
    registration.value.waiting.postMessage({ type: 'SKIP_WAITING' })
  }
  show.value = false
}

onMounted(() => {
  document.addEventListener('swUpdated', (e) => {
    registration.value = e.detail
    show.value = true
  })

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    window.location.reload()
  })
})
</script>

<template>
  <div v-if="show" class="pwa-update-prompt">
    <div class="pwa-update-content">
      <h3>新版本可用!</h3>
      <p>点击更新按钮获取最新版本</p>
      <button @click="updateApp">立即更新</button>
    </div>
  </div>
</template>

<style scoped>
.pwa-update-prompt {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 9999;
  padding: 16px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  max-width: 320px;
}

.pwa-update-content h3 {
  margin-top: 0;
  color: #2c3e50;
}

.pwa-update-content button {
  padding: 8px 16px;
  background: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 8px;
}
</style>