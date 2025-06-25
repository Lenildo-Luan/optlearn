<template>
  <button
    :type="type"
    :class="buttonClasses"
    :disabled="disabled || loading"
    @click="handleClick"
  >
    <div v-if="loading" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white">
      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    </div>
    <component v-if="icon && !loading" :is="icon" class="h-5 w-5 mr-2" />
    <slot />
  </button>
</template>

<script setup lang="ts">
interface Props {
  type?: 'button' | 'submit' | 'reset'
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  fullWidth?: boolean
  icon?: any
}

interface Emits {
  (e: 'click', event: MouseEvent): void
}

const props = withDefaults(defineProps<Props>(), {
  type: 'button',
  variant: 'primary',
  size: 'md',
  disabled: false,
  loading: false,
  fullWidth: false
})

const emit = defineEmits<Emits>()

const buttonClasses = computed(() => [
  'inline-flex items-center justify-center font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors',
  
  // Size classes
  {
    'px-3 py-2 text-sm': props.size === 'sm',
    'px-4 py-2 text-sm': props.size === 'md',
    'px-6 py-3 text-base': props.size === 'lg'
  },
  
  // Variant classes
  {
    'text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 disabled:bg-blue-300': props.variant === 'primary',
    'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 focus:ring-blue-500': props.variant === 'secondary',
    'text-blue-700 bg-transparent border border-blue-600 hover:bg-blue-50 focus:ring-blue-500': props.variant === 'outline',
    'text-gray-700 bg-transparent hover:bg-gray-100 focus:ring-gray-500': props.variant === 'ghost',
    'text-white bg-red-600 hover:bg-red-700 focus:ring-red-500 disabled:bg-red-300': props.variant === 'danger'
  },
  
  // Width classes
  {
    'w-full': props.fullWidth
  },
  
  // Disabled state
  {
    'opacity-50 cursor-not-allowed': props.disabled || props.loading
  }
])

const handleClick = (event: MouseEvent) => {
  if (!props.disabled && !props.loading) {
    emit('click', event)
  }
}
</script>
