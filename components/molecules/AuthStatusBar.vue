<template>
  <div class="flex items-center space-x-4">
    <template v-if="user">
      <!-- User Info -->
      <div class="flex items-center space-x-2">
        <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
          <span class="text-xs font-medium text-blue-800">
            {{ userInitials }}
          </span>
        </div>
        <div class="hidden sm:block">
          <span class="text-sm text-gray-700">
            {{ user.email }}
          </span>
        </div>
      </div>

      <!-- Session Status Indicator -->
      <div class="hidden md:block">
        <SessionStatusIndicator
          :status="sessionStatus"
          :expires-in="sessionExpiresIn"
        />
      </div>

      <!-- Actions -->
      <div class="flex items-center space-x-2">
        <BaseButton
          variant="ghost"
          size="sm"
          :loading="refreshing"
          @click="handleRefreshSession"
          class="hidden lg:inline-flex"
        >
          <svg class="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Renovar
        </BaseButton>
        
        <BaseButton
          variant="outline"
          size="sm"
          :disabled="refreshing"
          @click="handleSignOut"
        >
          Sair
        </BaseButton>
      </div>
    </template>

    <template v-else>
      <!-- Guest Actions -->
      <div class="flex items-center space-x-2">
        <NuxtLink to="/signin">
          <BaseButton variant="ghost" size="sm">
            Entrar
          </BaseButton>
        </NuxtLink>
        
        <NuxtLink to="/signup">
          <BaseButton variant="primary" size="sm">
            Criar Conta
          </BaseButton>
        </NuxtLink>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
interface Props {
  user: any
  sessionStatus: 'active' | 'warning' | 'expired' | 'loading'
  sessionExpiresIn?: number
  refreshing?: boolean
}

interface Emits {
  (e: 'sign-out'): void
  (e: 'refresh-session'): void
}

const props = withDefaults(defineProps<Props>(), {
  refreshing: false
})

const emit = defineEmits<Emits>()

const userInitials = computed(() => {
  if (!props.user?.email) return '?'
  
  const email = props.user.email
  const parts = email.split('@')[0].split('.')
  
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  
  return email.substring(0, 2).toUpperCase()
})

const handleSignOut = () => {
  emit('sign-out')
}

const handleRefreshSession = () => {
  emit('refresh-session')
}
</script>