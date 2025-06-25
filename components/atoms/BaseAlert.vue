<template>
  <div v-if="show" :class="alertClasses" role="alert">
    <div class="flex">
      <div class="flex-shrink-0">
        <component :is="iconComponent" class="h-5 w-5" />
      </div>
      <div class="ml-3">
        <p class="text-sm font-medium">
          {{ title }}
        </p>
        <p v-if="message" class="mt-1 text-sm">
          {{ message }}
        </p>
      </div>
      <div v-if="dismissible" class="ml-auto pl-3">
        <div class="-mx-1.5 -my-1.5">
          <button
            type="button"
            class="inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2"
            @click="dismiss"
          >
            <span class="sr-only">Dismiss</span>
            <XMarkIcon class="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  InformationCircleIcon, 
  XCircleIcon,
  XMarkIcon 
} from '@heroicons/vue/24/outline'

interface Props {
  type?: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  show?: boolean
  dismissible?: boolean
}

interface Emits {
  (e: 'dismiss'): void
}

const props = withDefaults(defineProps<Props>(), {
  type: 'info',
  show: true,
  dismissible: false
})

const emit = defineEmits<Emits>()

const alertClasses = computed(() => [
  'rounded-md p-4 mb-4',
  {
    'bg-green-50 text-green-800': props.type === 'success',
    'bg-red-50 text-red-800': props.type === 'error',
    'bg-yellow-50 text-yellow-800': props.type === 'warning',
    'bg-blue-50 text-blue-800': props.type === 'info'
  }
])

const iconComponent = computed(() => {
  switch (props.type) {
    case 'success': return CheckCircleIcon
    case 'error': return XCircleIcon
    case 'warning': return ExclamationTriangleIcon
    case 'info': return InformationCircleIcon
    default: return InformationCircleIcon
  }
})

const dismiss = () => {
  emit('dismiss')
}
</script>
