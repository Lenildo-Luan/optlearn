<template>
  <div class="min-h-screen bg-gray-50">
    <nav class="bg-white shadow-sm border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex items-center">
            <NuxtLink to="/" class="text-xl font-bold text-gray-900">
              DevLearn Platform
            </NuxtLink>
          </div>
          
          <div class="flex items-center space-x-4">
            <template v-if="isAuthLoading">
              <!-- Loading state -->
              <div class="animate-pulse">
                <div class="h-8 w-20 bg-gray-200 rounded"></div>
              </div>
            </template>
            <template v-else-if="user">
              <span class="text-sm text-gray-700">
                Olá, {{ user.email }}
              </span>
              <BaseButton
                variant="outline"
                size="sm"
                :loading="isSigningOut"
                @click="handleSignOut"
              >
                Sair
              </BaseButton>
            </template>
            <template v-else>
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
            </template>
          </div>
        </div>
      </div>
    </nav>
    
    <main>
      <slot />
    </main>

    <!-- Alert for session expiration -->
    <BaseAlert
      v-if="sessionAlert.show"
      :type="sessionAlert.type"
      :title="sessionAlert.title"
      :message="sessionAlert.message"
      :show="sessionAlert.show"
      dismissible
      @dismiss="clearSessionAlert"
    />
  </div>
</template>

<script setup lang="ts">
import type { User } from "@supabase/supabase-js"

interface SessionAlert {
  show: boolean
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
}

const { getCurrentUser } = useAuth()
const { $supabase } = useNuxtApp()
const router = useRouter()
const route = useRoute()

// Reactive state
const user = ref<User | null>(null)
const isAuthLoading = ref(true)
const isSigningOut = ref(false)
const authCheckInterval = ref<NodeJS.Timeout | null>(null)

// Session alert state
const sessionAlert = reactive<SessionAlert>({
  show: false,
  type: 'warning',
  title: '',
  message: ''
})

// Protected routes that require authentication
const protectedRoutes = ['/dashboard', '/profile', '/roadmap', '/settings']

// Check if current route is protected
const isProtectedRoute = computed(() => {
  return protectedRoutes.some(route => router.currentRoute.value.path.startsWith(route))
})

// Initialize auth state
const initializeAuth = async () => {
  try {
    isAuthLoading.value = true
    
    // Get current session
    const { data: { session } } = await $supabase.auth.getSession()
    user.value = session?.user || null
    
    // If on protected route and no user, redirect to signin
    if (isProtectedRoute.value && !user.value) {
      showSessionAlert('warning', 'Sessão expirada', 'Faça login novamente para continuar.')
      await router.push(`/signin?redirect=${encodeURIComponent(route.fullPath)}`)
    }
  } catch (error) {
    console.error('Error initializing auth:', error)
    user.value = null
    
    if (isProtectedRoute.value) {
      await router.push('/signin')
    }
  } finally {
    isAuthLoading.value = false
  }
}

// Handle auth state changes
const handleAuthStateChange = (event: string, session: any) => {
  const newUser = session?.user || null
  const wasAuthenticated = !!user.value
  const isNowAuthenticated = !!newUser
  
  user.value = newUser
  
  // Handle session expiration
  if (wasAuthenticated && !isNowAuthenticated) {
    handleSessionExpired()
  }
  
  // Handle successful sign in
  if (!wasAuthenticated && isNowAuthenticated) {
    handleSuccessfulSignIn()
  }
  
  // Handle sign out
  if (event === 'SIGNED_OUT') {
    handleSignedOut()
  }
}

// Handle session expiration
const handleSessionExpired = async () => {
  if (isProtectedRoute.value) {
    showSessionAlert('warning', 'Sessão expirada', 'Sua sessão expirou. Faça login novamente.')
    
    // Wait a moment before redirecting so user can see the alert
    setTimeout(async () => {
      await router.push(`/signin?redirect=${encodeURIComponent(route.fullPath)}`)
    }, 2000)
  }
}

// Handle successful sign in
const handleSuccessfulSignIn = () => {
  clearSessionAlert()
  
  // Check if there's a redirect parameter
  const redirectTo = route.query.redirect as string
  if (redirectTo) {
    router.push(redirectTo)
  }
}

// Handle sign out
const handleSignedOut = () => {
  clearSessionAlert()
  
  // If user was on a protected route, redirect to home
  if (isProtectedRoute.value) {
    router.push('/')
  }
}

// Periodic session validation
const startSessionValidation = () => {
  // Check session validity every 5 minutes
  authCheckInterval.value = setInterval(async () => {
    try {
      const { data: { session }, error } = await $supabase.auth.getSession()
      
      if (error) {
        console.error('Session validation error:', error)
        return
      }
      
      // If we think we have a user but session is null
      if (user.value && !session) {
        handleSessionExpired()
      }
      
      // Update user state
      user.value = session?.user || null
    } catch (error) {
      console.error('Error during session validation:', error)
    }
  }, 5 * 60 * 1000) // 5 minutes
}

// Stop session validation
const stopSessionValidation = () => {
  if (authCheckInterval.value) {
    clearInterval(authCheckInterval.value)
    authCheckInterval.value = null
  }
}

// Session alert helpers
const showSessionAlert = (type: SessionAlert['type'], title: string, message?: string) => {
  sessionAlert.show = true
  sessionAlert.type = type
  sessionAlert.title = title
  sessionAlert.message = message
}

const clearSessionAlert = () => {
  sessionAlert.show = false
}

// Handle sign out
const handleSignOut = async () => {
  try {
    isSigningOut.value = true
    
    const { error } = await $supabase.auth.signOut()
    
    if (error) {
      console.error('Sign out error:', error)
      showSessionAlert('error', 'Erro ao sair', 'Não foi possível fazer logout. Tente novamente.')
      return
    }
    
    // Clear user state
    user.value = null
    
    // Show success message
    showSessionAlert('success', 'Logout realizado', 'Você foi desconectado com sucesso.')
    
    // Redirect to home after a brief delay
    setTimeout(() => {
      router.push('/')
    }, 1500)
    
  } catch (error) {
    console.error('Unexpected sign out error:', error)
    showSessionAlert('error', 'Erro inesperado', 'Ocorreu um erro durante o logout.')
  } finally {
    isSigningOut.value = false
  }
}

// Watch for route changes to check protection
watch(() => route.path, async (newPath) => {
  const isNewRouteProtected = protectedRoutes.some(protectedRoute => 
    newPath.startsWith(protectedRoute)
  )
  
  if (isNewRouteProtected && !user.value && !isAuthLoading.value) {
    showSessionAlert('warning', 'Acesso restrito', 'Você precisa estar logado para acessar esta página.')
    await router.push(`/signin?redirect=${encodeURIComponent(newPath)}`)
  }
})

// Lifecycle
onMounted(async () => {
  // Initialize auth state
  await initializeAuth()
  
  // Set up auth state listener
  const { data: { subscription } } = $supabase.auth.onAuthStateChange(handleAuthStateChange)
  
  // Start periodic session validation
  startSessionValidation()
  
  // Cleanup on unmount
  onUnmounted(() => {
    subscription?.unsubscribe()
    stopSessionValidation()
  })
})

// Cleanup on unmount
onUnmounted(() => {
  stopSessionValidation()
})
</script>