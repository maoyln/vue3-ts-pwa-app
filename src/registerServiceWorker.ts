export default function register() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js', { scope: '/' })
        .then(registration => {
          console.log('SW registered: ', registration)
          
          // 监听更新
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed') {
                  if (navigator.serviceWorker.controller) {
                    // 新内容可用，显示更新提示
                    const event = new CustomEvent('swUpdated', { detail: registration })
                    document.dispatchEvent(event)
                  } else {
                    console.log('Content is cached for offline use.')
                  }
                }
              })
            }
          })
        })
        .catch(registrationError => {
          console.log('SW registration failed: ', registrationError)
        })
    })
  }
}

// 检查服务 worker 更新
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.ready.then(registration => {
    registration.update()
  })
}