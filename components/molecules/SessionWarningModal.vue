<template>
  <div
    v-if="show"
    class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
    @click="handleBackdropClick"
  >
    <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
      <div class="mt-3 text-center">
        <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
          <svg class="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        
        <h3 class="text-lg font-medium text-gray-900 mb-2">
          {{ title }}
        </h3>
        
        <div class="mt-2 px-7 py-3">
          <p class="text-sm text-gray-500 mb-4">
            {{ message }}
          </p>
          
          <div class="flex justify-center mb-4">
            <CountdownTimer
              :total-seconds="initialSeconds"
              :remaining-seconds="remainingSeconds"
              :variant="countdownVariant"
            />
          </div>
        </div>
        
        <div class="flex justify-center space-x-3 pt-4">
          <BaseButton
            variant="primary"
            size="sm"
            :loading="extending"
            @click="handleExtend"
          >
            Continuar Logado
          </BaseButton>
          
          <BaseButton
            variant="outline"
            size="sm"
            :disabled="extending"
            @click="handleLogout"
          >
            Fazer Logout
          </BaseButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  show: boolean
  title?: string
  message?: string
  remainingSeconds: number
  initialSeconds?: number
  allowBackdropClose?: boolean
}

interface Emits {
  (e: 'extend'): void
  (e: 'logout'): void
  (e: 'close'): void
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Sessão Expirando',
  message: 'Sua sessão está prestes a expirar. Deseja continuar logado?',
  initialSeconds: 60,
  allowBackdropClose: false
})

const emit = defineEmits<Emits>()

const extending = ref(false)

const countdownVariant = computed(() => {
  if (props.remainingSeconds <= 10) return 'danger'
  if (props.remainingSeconds <= 30) return 'warning'
  return 'normal'
})

const handleExtend = async () => {
  extending.value = true
  emit('extend')
  // Reset loading state after a delay
  setTimeout(() => {
    extending.value = false
  }, 2000)
}

const handleLogout = () => {
  emit('logout')
}

const handleBackdropClick = (event: MouseEvent) => {
  if (props.allowBackdropClose && event.target === event.currentTarget) {
    emit('close')
  }
}

// Auto logout when countdown reaches 0
watch(() => props.remainingSeconds, (newValue) => {
  if (newValue <= 0) {
    handleLogout()
  }
})
</script>