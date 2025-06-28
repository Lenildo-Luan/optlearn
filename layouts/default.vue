<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Navigation Bar -->
    <nav class="bg-white shadow-sm border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <!-- Logo -->
          <div class="flex items-center">
            <NuxtLink to="/" class="text-xl font-bold text-gray-900">
              DevLearn Platform
            </NuxtLink>
          </div>
          
          <!-- Auth Status Bar -->
          <AuthStatusBar
            :user="user"
            :session-status="sessionStatus"
            :session-expires-in="sessionExpiresIn"
            :refreshing="refreshingSession"
            @sign-out="handleSignOut"
            @refresh-session="handleRefreshSession"
          />
        </div>
      </div>
    </nav>
    
    <!-- Session Warning Banner (appears when session is expiring soon) -->
    <div
      v-if="showSessionBanner"
      class="bg-yellow-50 border-b border-yellow-200"
    >
      <div class="max-w-7xl mx-auto py-2 px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <svg class="h-5 w-5 text-yellow-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
            <p class="text-sm text-yellow-800">
              Sua sessão expira em {{ formatTime(sessionExpiresIn) }}
            </p>
          </div>
          <div class="flex items-center space-x-2">
            <BaseButton
              variant="outline"
              size="sm"
              :loading="refreshingSession"
              @click="handleRefreshSession"
            >
              Renovar Sessão
            </BaseButton>
            <button
              @click="dismissSessionBanner"
              class="text-yellow-400 hover:text-yellow-500"
            >
              <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Main Content -->
    <main>
      <slot />
    </main>
    
    <!-- Session Warning Modal -->
    <SessionWarningModal
      :show="showSessionModal"
      :remaining-seconds="modalCountdown"
      :initial-seconds="60"
      @extend="handleExtendSession"
      @logout="handleForceLogout"
    />
    
    <!-- Loading Overlay (during session refresh) -->
    <div
      v-if="refreshingSession"
      class="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-40"
    >
      <div class="bg-white rounded-lg p-6 shadow-lg">
        <div class="flex items-center space-x-3">
          <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span class="text-gray-700">Renovando sessão...</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { User } from '@supabase/supabase-js'

const { getCurrentUser } = useAuth()
const { $supabase } = useNuxtApp()
const router = useRouter()

// Reactive state
const user = ref<User | null>(null)
const sessionStatus = ref<'active' | 'warning' | 'expired' | 'loading'>('loading')
const sessionExpiresIn = ref(0)
const refreshingSession = ref(false)
const showSessionModal = ref(false)
const showSessionBanner = ref(false)
const modalCountdown = ref(60)
const bannerDismissed = ref(false)

// Session monitoring
let sessionCheckInterval: NodeJS.Timeout | null = null
let modalCountdownInterval: NodeJS.Timeout | null = null

const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  
  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`
  }
  return `${remainingSeconds}s`
}

const checkSessionStatus = async () => {
  try {
    const { data: { session }, error } = await $supabase.auth.getSession()
    
    if (error || !session) {
      sessionStatus.value = 'expired'
      user.value = null
      return
    }
    
    const expiresAt = new Date(session.expires_at! * 1000)
    const now = new Date()
    const timeUntilExpiry = Math.floor((expiresAt.getTime() - now.getTime()) / 1000)
    
    sessionExpiresIn.value = Math.max(0, timeUntilExpiry)
    
    if (timeUntilExpiry <= 0) {
      sessionStatus.value = 'expired'
      await handleSessionExpired()
    } else if (timeUntilExpiry <= 300) { // 5 minutes
      sessionStatus.value = 'warning'
      
      // Show banner if not dismissed and more than 2 minutes left
      if (!bannerDismissed.value && timeUntilExpiry > 120) {
        showSessionBanner.value = true
      }
      
      // Show modal if less than 1 minute left
      if (timeUntilExpiry <= 60 && !showSessionModal.value) {
        showSessionModal.value = true
        modalCountdown.value = timeUntilExpiry
        startModalCountdown()
      }
    } else {
      sessionStatus.value = 'active'
      showSessionBanner.value = false
      bannerDismissed.value = false
    }
  } catch (error) {
    console.error('Error checking session status:', error)
    sessionStatus.value = 'expired'
  }
}

const startModalCountdown = () => {
  if (modalCountdownInterval) {
    clearInterval(modalCountdownInterval)
  }
  
  modalCountdownInterval = setInterval(() => {
    modalCountdown.value -= 1
    if (modalCountdown.value <= 0) {
      clearInterval(modalCountdownInterval!)
      handleForceLogout()
    }
  }, 1000)
}

const handleSessionExpired = async () => {
  showSessionModal.value = false
  if (modalCountdownInterval) {
    clearInterval(modalCountdownInterval)
  }
  
  await $supabase.auth.signOut()
  user.value = null
  
  // Show notification
  if (process.client) {
    alert('Sua sessão expirou. Você será redirecionado para a página de login.')
  }
  
  await router.push('/signin?reason=session_expired')
}

const handleRefreshSession = async () => {
  if (refreshingSession.value) return
  
  refreshingSession.value = true
  
  try {
    const { data, error } = await $supabase.auth.refreshSession()
    
    if (error) {
      throw error
    }
    
    if (data.session) {
      user.value = data.session.user
      sessionStatus.value = 'active'
      showSessionModal.value = false
      showSessionBanner.value = false
      bannerDismissed.value = false
      
      if (modalCountdownInterval) {
        clearInterval(modalCountdownInterval)
      }
      
      // Update session expiry time
      await checkSessionStatus()
    }
  } catch (error) {
    console.error('Error refreshing session:', error)
    await handleSessionExpired()
  } finally {
    refreshingSession.value = false
  }
}

const handleExtendSession = async () => {
  await handleRefreshSession()
}

const handleSignOut = async () => {
  if (sessionCheckInterval) {
    clearInterval(sessionCheckInterval)
  }
  if (modalCountdownInterval) {
    clearInterval(modalCountdownInterval)
  }
  
  await $supabase.auth.signOut()
  user.value = null
  sessionStatus.value = 'expired'
  showSessionModal.value = false
  showSessionBanner.value = false
  
  await router.push('/')
}

const handleForceLogout = async () => {
  await handleSignOut()
  
  if (process.client) {
    alert('Sua sessão expirou automaticamente.')
  }
}

const dismissSessionBanner = () => {
  showSessionBanner.value = false
  bannerDismissed.value = true
}

// Lifecycle
onMounted(async () => {
  // Get initial user
  user.value = await getCurrentUser()
  
  // Start session monitoring
  await checkSessionStatus()
  sessionCheckInterval = setInterval(checkSessionStatus, 30000) // Check every 30 seconds
  
  // Listen for auth state changes
  $supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_OUT') {
      user.value = null
      sessionStatus.value = 'expired'
      showSessionModal.value = false
      showSessionBanner.value = false
    } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
      user.value = session?.user || null
      await checkSessionStatus()
    }
  })
})

onUnmounted(() => {
  if (sessionCheckInterval) {
    clearInterval(sessionCheckInterval)
  }
  if (modalCountdownInterval) {
    clearInterval(modalCountdownInterval)
  }
})
</script>