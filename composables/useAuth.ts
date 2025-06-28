import type { User, Session } from "@supabase/supabase-js"
import type { AuthResponse, SignUpData } from "~/types/auth"

interface SessionStatus {
  isValid: boolean
  expiresAt: number | null
  timeRemaining: number
  willExpireSoon: boolean
}

export const useAuth = () => {
  const { $supabase } = useNuxtApp()
  const router = useRouter()
  
  // Reactive state
  const user = ref<User | null>(null)
  const session = ref<Session | null>(null)
  const loading = ref(false)
  const sessionStatus = ref<SessionStatus>({
    isValid: false,
    expiresAt: null,
    timeRemaining: 0,
    willExpireSoon: false
  })

  // Configuration constants
  const SESSION_CHECK_INTERVAL = 60000 // Check every minute
  const WARNING_THRESHOLD = 5 * 60 * 1000 // Warn 5 minutes before expiration
  const REFRESH_THRESHOLD = 10 * 60 * 1000 // Refresh 10 minutes before expiration

  let sessionCheckInterval: NodeJS.Timeout | null = null
  let refreshTimeout: NodeJS.Timeout | null = null

  /**
   * Initialize auth state and start session monitoring
   */
  const initialize = async () => {
    try {
      // Get current session
      const { data: { session: currentSession } } = await $supabase.auth.getSession()
      
      if (currentSession) {
        session.value = currentSession
        user.value = currentSession.user
        updateSessionStatus(currentSession)
        startSessionMonitoring()
      }

      // Listen for auth state changes
      $supabase.auth.onAuthStateChange(async (event, newSession) => {
        session.value = newSession
        user.value = newSession?.user || null

        switch (event) {
          case 'SIGNED_IN':
            if (newSession) {
              updateSessionStatus(newSession)
              startSessionMonitoring()
            }
            break
          
          case 'SIGNED_OUT':
            stopSessionMonitoring()
            resetSessionStatus()
            break
          
          case 'TOKEN_REFRESHED':
            if (newSession) {
              updateSessionStatus(newSession)
            }
            break
          
          case 'USER_UPDATED':
            // Handle user profile updates
            break
        }
      })
    } catch (error) {
      console.error('Failed to initialize auth:', error)
    }
  }

  /**
   * Update session status based on current session
   */
  const updateSessionStatus = (currentSession: Session) => {
    const now = Date.now()
    const expiresAt = currentSession.expires_at ? currentSession.expires_at * 1000 : null
    
    if (expiresAt) {
      const timeRemaining = expiresAt - now
      
      sessionStatus.value = {
        isValid: timeRemaining > 0,
        expiresAt,
        timeRemaining: Math.max(0, timeRemaining),
        willExpireSoon: timeRemaining <= WARNING_THRESHOLD && timeRemaining > 0
      }
    } else {
      sessionStatus.value = {
        isValid: true,
        expiresAt: null,
        timeRemaining: 0,
        willExpireSoon: false
      }
    }
  }

  /**
   * Reset session status
   */
  const resetSessionStatus = () => {
    sessionStatus.value = {
      isValid: false,
      expiresAt: null,
      timeRemaining: 0,
      willExpireSoon: false
    }
  }

  /**
   * Start monitoring session expiration
   */
  const startSessionMonitoring = () => {
    stopSessionMonitoring() // Clear existing intervals

    sessionCheckInterval = setInterval(() => {
      if (session.value) {
        updateSessionStatus(session.value)
        
        // Auto-refresh if needed
        if (sessionStatus.value.timeRemaining <= REFRESH_THRESHOLD && 
            sessionStatus.value.timeRemaining > 0) {
          refreshSession()
        }
        
        // Auto-logout if expired
        if (!sessionStatus.value.isValid) {
          signOut(true) // Auto logout
        }
      }
    }, SESSION_CHECK_INTERVAL)
  }

  /**
   * Stop session monitoring
   */
  const stopSessionMonitoring = () => {
    if (sessionCheckInterval) {
      clearInterval(sessionCheckInterval)
      sessionCheckInterval = null
    }
    if (refreshTimeout) {
      clearTimeout(refreshTimeout)
      refreshTimeout = null
    }
  }

  const checkSession = async (): Promise<boolean> => {
    try {
      const { data: { session }, error } = await $supabase.auth.getSession()
      return !error && !!session
    } catch {
      return false
    }
  }

  const refreshSession = async (): Promise<{ success: boolean }> => {
    loading.value = true
    try {
      const { data: { session }, error } = await $supabase.auth.refreshSession()
      if (error || !session) return { success: false }
      
      user.value = session.user
      return { success: true }
    } catch {
      return { success: false }
    } finally {
      loading.value = false
    }
  }

  /**
   * Check if current session is valid
   */
  const isSessionValid = async (): Promise<boolean> => {
    try {
      const { data: { session: currentSession }, error } = await $supabase.auth.getSession()
      
      if (error || !currentSession) {
        return false
      }

      const now = Date.now()
      const expiresAt = currentSession.expires_at ? currentSession.expires_at * 1000 : null
      
      return !expiresAt || expiresAt > now
    } catch (error) {
      console.error('Error checking session validity:', error)
      return false
    }
  }

  /**
   * Sign up new user
   */
  const signUp = async (data: SignUpData): Promise<AuthResponse> => {
    loading.value = true
    
    try {
      const { data: authData, error } = await $supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) {
        return handleAuthError(error, 'Erro ao criar conta')
      }

      if (authData.user && !authData.session) {
        return {
          success: true,
          message: 'Conta criada! Verifique seu email para confirmar o cadastro.'
        }
      }

      return {
        success: true,
        message: 'Conta criada com sucesso!'
      }
    } catch (error: any) {
      return {
        success: false,
        message: 'Erro inesperado',
        error: error.message
      }
    } finally {
      loading.value = false
    }
  }

  /**
   * Sign in with OAuth provider
   */
  const signInWithOAuth = async (provider: 'google' | 'github'): Promise<AuthResponse> => {
    loading.value = true
    
    try {
      const { data, error } = await $supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) {
        return handleAuthError(error, `Erro ao fazer login com ${provider}`)
      }

      return {
        success: true,
        message: `Redirecionando para ${provider}...`
      }
    } catch (error: any) {
      return {
        success: false,
        message: 'Erro inesperado',
        error: error.message
      }
    } finally {
      loading.value = false
    }
  }

  /**
   * Sign in with email and password
   */
  const signIn = async (email: string, password: string): Promise<AuthResponse> => {
    loading.value = true
    
    try {
      const { data, error } = await $supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        return handleAuthError(error, 'Erro ao fazer login')
      }

      if (data.session) {
        session.value = data.session
        user.value = data.session.user
        updateSessionStatus(data.session)
        startSessionMonitoring()
      }

      return {
        success: true,
        message: 'Login realizado com sucesso!'
      }
    } catch (error: any) {
      return {
        success: false,
        message: 'Erro inesperado',
        error: error.message
      }
    } finally {
      loading.value = false
    }
  }

  /**
   * Sign out user (manual or automatic)
   */
  const signOut = async (isAutoLogout = false): Promise<AuthResponse> => {
    try {
      stopSessionMonitoring()
      
      const { error } = await $supabase.auth.signOut()
      
      if (error) {
        console.error('Sign out error:', error)
      }

      // Clear local state regardless of API response
      session.value = null
      user.value = null
      resetSessionStatus()

      // Redirect to home or login page
      await router.push('/')

      return {
        success: true,
        message: isAutoLogout 
          ? 'Sessão expirada. Você foi desconectado automaticamente.'
          : 'Logout realizado com sucesso!'
      }
    } catch (error: any) {
      console.error('Unexpected error during sign out:', error)
      
      // Force local cleanup even if API call fails
      session.value = null
      user.value = null
      resetSessionStatus()
      await router.push('/')
      
      return {
        success: false,
        message: 'Erro ao fazer logout, mas você foi desconectado localmente',
        error: error.message
      }
    }
  }

  /**
   * Get current user
   */
  const getCurrentUser = async (): Promise<User | null> => {
    try {
      const { data: { user: currentUser } } = await $supabase.auth.getUser()
      user.value = currentUser
      return currentUser
    } catch (error) {
      console.error('Error getting current user:', error)
      return null
    }
  }

  /**
   * Handle authentication errors with specific messages
   */
  const handleAuthError = (error: any, defaultMessage: string): AuthResponse => {
    let message = defaultMessage
    
    // Handle specific Supabase error codes
    switch (error.message) {
      case 'Invalid login credentials':
        message = 'Email ou senha incorretos'
        break
      case 'Email not confirmed':
        message = 'Por favor, confirme seu email antes de fazer login'
        break
      case 'User already registered':
        message = 'Este email já está cadastrado'
        break
      case 'Password should be at least 6 characters':
        message = 'A senha deve ter pelo menos 6 caracteres'
        break
      case 'Unable to validate email address: invalid format':
        message = 'Formato de email inválido'
        break
      case 'Signup disabled':
        message = 'Cadastro temporariamente desabilitado'
        break
    }

    return {
      success: false,
      message,
      error: error.message
    }
  }

  /**
   * Handle HTTP errors (401/403) - for use in HTTP interceptors
   */
  const handleHttpAuthError = async (status: number): Promise<boolean> => {
    if (status === 401 || status === 403) {
      // Try to refresh session first
      const refreshResult = await refreshSession()
      
      if (refreshResult.success) {
        return true // Session refreshed, retry request
      } else {
        // Refresh failed, sign out user
        await signOut(true)
        return false // Don't retry request
      }
    }
    
    return false
  }

  /**
   * Format time remaining for display
   */
  const formatTimeRemaining = (milliseconds: number): string => {
    const minutes = Math.floor(milliseconds / 60000)
    const seconds = Math.floor((milliseconds % 60000) / 1000)
    
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`
    }
    return `${seconds}s`
  }


  // Cleanup on unmount
  onUnmounted(() => {
    stopSessionMonitoring()
  })

  // Initialize when composable is used
  onMounted(() => {
    initialize()
  })

  return {
    // State (readonly)
    user: readonly(user),
    session: readonly(session),
    loading: readonly(loading),
    sessionStatus: readonly(sessionStatus),
    
    // Auth methods
    signUp,
    signIn,
    signInWithOAuth,
    signOut,
    getCurrentUser,   

    // Session management
    refreshSession,
    isSessionValid,
    initialize,
    checkSession, 
    
    // Utilities
    handleHttpAuthError,
    formatTimeRemaining
  }
}