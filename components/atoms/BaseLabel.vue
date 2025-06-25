<template>
  <label
    :for="forId"
    :class="labelClasses"
  >
    {{ text }}
    <span v-if="required" class="text-red-500 ml-1">*</span>
  </label>
</template>

<script setup lang="ts">
interface Props {
  forId?: string
  text: string
  required?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<Props>(), {
  required: false,
  size: 'md'
})

const labelClasses = computed(() => [
  'block font-medium text-gray-700',
  {
    'text-sm': props.size === 'sm',
    'text-sm': props.size === 'md',
    'text-base': props.size === 'lg'
  }
])
</script>