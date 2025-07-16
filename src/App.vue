<script setup>
import HelloWorld from './components/HelloWorld.vue'
import PWAUpdatePrompt from './components/PWAUpdatePrompt.vue'
import InstallPrompt from './components/InstallPrompt.vue'
// import AfterInstallGuide from './components/AfterInstallGuide.vue'
</script>

<template>
  <div>
    这是一个小的应用pwa
  </div>
  <HelloWorld msg="Vite + Vue" />
  
  <PWAUpdatePrompt />
  <InstallPrompt />
  <!-- <AfterInstallGuide /> -->
</template>

<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
