<template>
  <div class="flex items-center space-x-2">
    <div class="relative w-8 h-8">
      <svg 
        class="w-8 h-8 transform -rotate-90" 
        viewBox="0 0 36 36"
      >
        <path
          class="text-gray-200"
          stroke="currentColor"
          stroke-width="3"
          fill="none"
          d="M18 2.0845
            a 15.9155 15.9155 0 0 1 0 31.831
            a 15.9155 15.9155 0 0 1 0 -31.831"
        />
        <path
          :class="circleColorClass"
          stroke="currentColor"
          stroke-width="3"
          stroke-linecap="round"
          fill="none"
          :stroke-dasharray="circumference"
          :stroke-dashoffset="strokeDashoffset"
          d="M18 2.0845
            a 15.9155 15.9155 0 0 1 0 31.831
            a 15.9155 15.9155 0 0 1 0 -31.831"
          class="transition-all duration-1000 ease-linear"
        />
      </svg>
      <div class="absolute inset-0 flex items-center justify-center">
        <span :class="timeColorClass" class="text-xs font-bold">
          {{ formattedTime }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  totalSeconds: number
  remainingSeconds: number
  variant?: 'normal' | 'warning' | 'danger'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'normal'
})

const circumference = 2 * Math.PI * 15.9155

const strokeDashoffset = computed(() => {
  const progress = props.remainingSeconds / props.totalSeconds
  return circumference * (1 - progress)
})

const circleColorClass = computed(() => {
  switch (props.variant) {
    case 'warning':
      return 'text-yellow-500'
    case 'danger':
      return 'text-red-500'
    default:
      return 'text-blue-500'
  }
})

const timeColorClass = computed(() => {
  switch (props.variant) {
    case 'warning':
      return 'text-yellow-700'
    case 'danger':
      return 'text-red-700'
    default:
      return 'text-blue-700'
  }
})

const formattedTime = computed(() => {
  const minutes = Math.floor(props.remainingSeconds / 60)
  const seconds = props.remainingSeconds % 60
  
  if (minutes > 0) {
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }
  return seconds.toString()
})
</script>