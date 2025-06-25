<template>
  <div class="relative">
    <input
      :id="id"
      :type="type"
      :placeholder="placeholder"
      :value="modelValue"
      :class="inputClasses"
      :disabled="disabled"
      @input="handleInput"
      @blur="handleBlur"
      @focus="handleFocus"
    />
    <div
      v-if="icon"
      class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
    >
      <component :is="icon" class="h-5 w-5 text-gray-400" />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  id?: string
  type?: 'text' | 'email' | 'password'
  placeholder?: string
  modelValue?: string
  disabled?: boolean
  error?: boolean
  icon?: any
}

interface Emits {
  (e: 'update:modelValue', value: string): void
  (e: 'blur'): void
  (e: 'focus'): void
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  disabled: false,
  error: false
})

const emit = defineEmits<Emits>()

const inputClasses = computed(() => [
  'block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-0 sm:text-sm transition-colors',
  props.icon ? 'pl-10' : '',
  props.error
    ? 'border-red-300 text-red-900 focus:ring-red-500 focus:border-red-500'
    : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500',
  props.disabled ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white'
])

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
}

const handleBlur = () => {
  emit('blur')
}

const handleFocus = () => {
  emit('focus')
}
</script>