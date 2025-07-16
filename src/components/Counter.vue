<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  initialValue?: number
}

const props = withDefaults(defineProps<Props>(), {
  initialValue: 0
})

const count = ref(props.initialValue)

const increment = () => {
  count.value++
}
</script>

<template>
  <div>
    <p>Count: {{ count }}</p>
    <button @click="increment">Increment</button>
  </div>
</template>

<style scoped>
button {
  padding: 0.5rem 1rem;
  background: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
</style>