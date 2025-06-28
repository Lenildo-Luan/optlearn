<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Loading State -->
    <div v-if="authLoading" class="min-h-screen flex items-center justify-center">
      <div class="text-center">
        <div class="animate-spin inline-block w-8 h-8 border-4 border-blue-500 border-r-transparent rounded-full mb-4"></div>
        <p class="text-gray-600">Verificando autenticação...</p>
      </div>
    </div>

    <!-- Dashboard Content -->
    <div v-else-if="user" class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div class="px-4 py-6 sm:px-0">
        <!-- Welcome Header -->
        <div class="bg-white overflow-hidden shadow rounded-lg mb-6">
          <div class="px-4 py-5 sm:p-6">
            <div class="flex items-center justify-between">
              <div>
                <h1 class="text-3xl font-bold text-gray-900 mb-2">
                  Bem-vindo, {{ userDisplayName }}!
                </h1>
                <p class="text-gray-600">
                  Sua jornada de aprendizado aguarda por você.
                </p>
              </div>
              <div class="text-right">
                <p class="text-sm text-gray-500">Último acesso</p>
                <p class="text-sm font-medium text-gray-900">
                  {{ formatLastSignIn }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Quick Stats -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div class="bg-white overflow-hidden shadow rounded-lg">
            <div class="p-5">
              <div class="flex items-center">
                <div class="flex-shrink-0">
                  <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span class="text-blue-600 font-semibold">📊</span>
                  </div>
                </div>
                <div class="ml-5 w-0 flex-1">
                  <dl>
                    <dt class="text-sm font-medium text-gray-500 truncate">
                      Progresso Total
                    </dt>
                    <dd class="text-lg font-medium text-gray-900">
                      0%
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div class="bg-white overflow-hidden shadow rounded-lg">
            <div class="p-5">
              <div class="flex items-center">
                <div class="flex-shrink-0">
                  <div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span class="text-green-600 font-semibold">🏆</span>
                  </div>
                </div>
                <div class="ml-5 w-0 flex-1">
                  <dl>
                    <dt class="text-sm font-medium text-gray-500 truncate">
                      Badges Conquistadas
                    </dt>
                    <dd class="text-lg font-medium text-gray-900">
                      0
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div class="bg-white overflow-hidden shadow rounded-lg">
            <div class="p-5">
              <div class="flex items-center">
                <div class="flex-shrink-0">
                  <div class="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <span class="text-purple-600 font-semibold">⭐</span>
                  </div>
                </div>
                <div class="ml-5 w-0 flex-1">
                  <dl>
                    <dt class="text-sm font-medium text-gray-500 truncate">
                      Streak Atual
                    </dt>
                    <dd class="text-lg font-medium text-gray-900">
                      0 dias
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Learning Paths -->
        <div class="bg-white overflow-hidden shadow rounded-lg">
          <div class="px-4 py-5 sm:p-6">
            <h2 class="text-xl font-semibold text-gray-900 mb-6">
              Trilhas de Aprendizado
            </h2>
            
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div class="bg-blue-50 p-6 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer" @click="navigateToPath('roadmap')">
                <h3 class="text-lg font-semibold text-blue-900 mb-2">
                  🗺️ Roadmap de Aprendizado
                </h3>
                <p class="text-blue-700 mb-4">
                  Explore nosso skill tree interativo e desbloqueie novos conhecimentos.
                </p>
                <div class="flex items-center text-blue-600">
                  <span class="text-sm font-medium">Começar</span>
                  <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                  </svg>
                </div>
              </div>
              
              <div class="bg-green-50 p-6 rounded-lg hover:bg-green-100 transition-colors cursor-pointer" @click="navigateToPath('flashcards')">
                <h3 class="text-lg font-semibold text-green-900 mb-2">
                  🃏 Flashcards Inteligentes
                </h3>
                <p class="text-green-700 mb-4">
                  Sistema de repetição espaçada para fixar o aprendizado.
                </p>
                <div class="flex items-center text-green-600">
                  <span class="text-sm font-medium">Praticar</span>
                  <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                  </svg>
                </div>
              </div>
              
              <div class="bg-purple-50 p-6 rounded-lg hover:bg-purple-100 transition-colors cursor-pointer" @click="navigateToPath('playground')">
                <h3 class="text-lg font-semibold text-purple-900 mb-2">
                  💻 Execução de Código
                </h3>
                <p class="text-purple-700 mb-4">
                  Pratique programação diretamente na plataforma.
                </p>
                <div class="flex items-center text-purple-600">
                  <span class="text-sm font-medium">Programar</span>
                  <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                  </svg>
                </div>
              </div>
            </div>
            
            <div class="mt-8 text-center">
              <BaseButton
                variant="primary"
                size="lg"
                @click="handleStartLearning"
              >
                Começar Aprendizado
              </BaseButton>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Error State (fallback) -->
    <div v-else class="min-h-screen flex items-center justify-center">
      <div class="text-center">
        <h2 class="text-xl font-semibold text-gray-900 mb-2">
          Erro de Autenticação
        </h2>
        <p class="text-gray-600 mb-4">
          Não foi possível verificar sua autenticação.
        </p>
        <BaseButton
          variant="primary"
          @click="handleRetryAuth"
        >
          Tentar Novamente
        </BaseButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { User } from '@supabase/supabase-js'
import { useSessionManager } from '~/utils/sessionManager'

definePageMeta({
  middleware: 'auth'
})

useSeoMeta({
  title: 'Dashboard - Developer Learning Platform',
  description: 'Seu painel de controle para acompanhar o progresso de aprendizado.',
  robots: 'noindex' // Private page
})

// Composables
const { getCurrentUser } = useAuth()
const { $supabase } = useNuxtApp()
const router = useRouter()
const { sessionManager } = useSessionManager()

// Reactive state
const user = ref<User | null>(null)
const authLoading = ref(true)
const authError = ref<string | null>(null)

// Computed properties
const userDisplayName = computed(() => {
  if (!user.value) return ''
  
  // Try to get name from user metadata
  if (user.value.user_metadata?.full_name) {
    return user.value.user_metadata.full_name
  }
  
  // Fallback to email local part
  if (user.value.email) {
    return user.value.email.split('@')[0]
  }
  
  return 'Usuário'
})

const formatLastSignIn = computed(() => {
  if (!user.value?.last_sign_in_at) return 'Primeira vez'
  
  const date = new Date(user.value.last_sign_in_at)
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
})

// Methods
const checkAuthStatus = async () => {
  try {
    authLoading.value = true
    authError.value = null
    
    // Get current session
    const { data: { session }, error: sessionError } = await $supabase.auth.getSession()
    
    if (sessionError) {
      console.error('Session error:', sessionError)
      authError.value = sessionError.message
      await router.push('/signin?error=session_expired')
      return
    }
    
    if (!session) {
      console.warn('No active session found')
      await router.push('/signin?error=no_session')
      return
    }
    
    // Get user data
    const currentUser = await getCurrentUser()
    
    if (!currentUser) {
      console.warn('No user data found')
      await router.push('/signin?error=no_user')
      return
    }
    
    user.value = currentUser
  } catch (error) {
    console.error('Auth check error:', error)
    authError.value = 'Erro ao verificar autenticação'
    await router.push('/signin?error=auth_check_failed')
  } finally {
    authLoading.value = false
  }
}

const handleRetryAuth = async () => {
  await checkAuthStatus()
}

const handleStartLearning = () => {
  navigateToPath('roadmap')
}

const navigateToPath = (path: string) => {
  // For now, redirect to roadmap as placeholder
  // In the future, these would be actual route paths
  router.push(`/${path}`)
}

// Auth state monitoring
const setupAuthListener = () => {
  $supabase.auth.onAuthStateChange(async (event, session) => {
    console.log('Auth state changed:', event, session?.user?.email)
    
    switch (event) {
      case 'SIGNED_OUT':
        user.value = null
        await router.push('/signin')
        break
        
      case 'TOKEN_REFRESHED':
        // Update user data on token refresh
        if (session?.user) {
          user.value = session.user
        }
        break
        
      case 'SIGNED_IN':
        // Update user data on sign in
        if (session?.user) {
          user.value = session.user
        }
        break
        
      default:
        // Handle other events if needed
        break
    }
  })
}

// Lifecycle
onMounted(async () => {
  // Setup auth state listener
  setupAuthListener()
  
  // Check initial auth status
  await checkAuthStatus()

  user.value = await getCurrentUser()

   // Inicializar gerenciamento de sessão
  sessionManager.scheduleWarning = (session) => {
    sessionManager.scheduleWarning(session)
  }
})

// Cleanup
onBeforeUnmount(() => {
  // Supabase auth listener cleanup is handled automatically
})
</script>