<script setup lang="ts">
import { ref, watch } from 'vue'

interface Props {
  message: string | null
  type?: 'error' | 'success'
  duration?: number
}

const props = withDefaults(defineProps<Props>(), {
  type: 'error',
  duration: 5000
})

const emit = defineEmits<{
  dismiss: []
}>()

const visible = ref(false)
let timer: ReturnType<typeof setTimeout> | null = null

watch(
  () => props.message,
  (msg) => {
    if (msg) {
      visible.value = true
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => dismiss(), props.duration)
    } else {
      visible.value = false
    }
  }
)

const dismiss = () => {
  visible.value = false
  if (timer) {
    clearTimeout(timer)
    timer = null
  }
  emit('dismiss')
}
</script>

<template>
  <Teleport to="body">
    <Transition name="toast">
      <div v-if="visible && message" class="toast" :class="type" role="alert" aria-live="assertive">
        <span class="toast-message">{{ message }}</span>
        <button class="toast-close" aria-label="Dismiss notification" @click="dismiss">×</button>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.toast {
  position: fixed;
  top: 1.5rem;
  right: 1.5rem;
  z-index: 9999;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  border-radius: 8px;
  max-width: 400px;
  min-width: 200px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
  font-size: 0.95rem;
  line-height: 1.4;
}

.toast.error {
  background-color: rgba(25, 8, 8, 0.97);
  border: 1px solid rgba(255, 68, 68, 0.6);
  color: #ff8080;
}

.toast.success {
  background-color: rgba(8, 25, 8, 0.97);
  border: 1px solid rgba(68, 200, 68, 0.6);
  color: #80ff80;
}

.toast-message {
  flex: 1;
  word-break: break-word;
}

.toast-close {
  background: none;
  border: none;
  color: inherit;
  font-size: 1.4rem;
  line-height: 1;
  cursor: pointer;
  padding: 0;
  opacity: 0.6;
  transition: opacity 0.2s;
  flex-shrink: 0;
  margin-top: -0.1rem;
}

.toast-close:hover {
  opacity: 1;
}

.toast-enter-active,
.toast-leave-active {
  transition:
    opacity 0.3s ease,
    transform 0.3s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(calc(100% + 1.5rem));
}

@media (max-width: 480px) {
  .toast {
    top: 1rem;
    right: 1rem;
    left: 1rem;
    max-width: none;
  }
}
</style>
