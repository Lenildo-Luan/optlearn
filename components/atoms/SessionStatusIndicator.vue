<template>
  <div class="flex items-center space-x-2">
    <div 
      :class="statusClasses" 
      class="w-2 h-2 rounded-full transition-colors duration-300"
    />
    <span :class="textClasses" class="text-xs font-medium">
      {{ statusText }}
    </span>
  </div>
</template>

<script setup lang="ts">
interface Props {
  status: 'active' | 'warning' | 'expired' | 'loading'
  expiresIn?: number // seconds
}

const props = withDefaults(defineProps<Props>(), {
  status: 'active'
})

const statusClasses = computed(() => {
  switch (props.status) {
    case 'active':
      return 'bg-green-500 animate-pulse'
    case 'warning':
      return 'bg-yellow-500 animate-pulse'
    case 'expired':
      return 'bg-red-500'
    case 'loading':
      return 'bg-gray-400 animate-spin'
    default:
      return 'bg-gray-400'
  }
})

const textClasses = computed(() => {
  switch (props.status) {
    case 'active':
      return 'text-green-700'
    case 'warning':
      return 'text-yellow-700'
    case 'expired':
      return 'text-red-700'
    case 'loading':
      return 'text-gray-600'
    default:
      return 'text-gray-600'
  }
})

const statusText = computed(() => {
  switch (props.status) {
    case 'active':
      return props.expiresIn ? `Ativa (${formatTime(props.expiresIn)})` : 'Ativa'
    case 'warning':
      return props.expiresIn ? `Expira em ${formatTime(props.expiresIn)}` : 'Expirando'
    case 'expired':
      return 'Expirada'
    case 'loading':
      return 'Verificando...'
    default:
      return 'Desconhecido'
  }
})

const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  
  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`
  }
  return `${remainingSeconds}s`
}
</script>