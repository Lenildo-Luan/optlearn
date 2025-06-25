<template>
  <div class="space-y-1">
    <BaseLabel
      v-if="label"
      :for-id="fieldId"
      :text="label"
      :required="required"
    />
    <BaseInput
      :id="fieldId"
      :type="type"
      :placeholder="placeholder"
      :model-value="modelValue"
      :error="!!error"
      :disabled="disabled"
      :icon="icon"
      @update:model-value="handleInput"
      @blur="handleBlur"
      @focus="handleFocus"
    />
    <p v-if="error" class="text-sm text-red-600">
      {{ error }}
    </p>
    <p v-else-if="hint" class="text-sm text-gray-500">
      {{ hint }}
    </p>
  </div>
</template>

<script setup lang="ts">
interface Props {
  fieldId?: string
  label?: string
  type?: 'text' | 'email' | 'password'
  placeholder?: string
  modelValue?: string
  error?: string
  hint?: string
  required?: boolean
  disabled?: boolean
  icon?: any
}

interface Emits {
  (e: 'update:modelValue', value: string): void
  (e: 'blur'): void
  (e: 'focus'): void
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  required: false,
  disabled: false
})

const emit = defineEmits<Emits>()

const fieldId = computed(() => props.fieldId || `field-${Math.random().toString(36).substr(2, 9)}`)

const handleInput = (value: string) => {
  emit('update:modelValue', value)
}

const handleBlur = () => {
  emit('blur')
}

const handleFocus = () => {
  emit('focus')
}
</script>