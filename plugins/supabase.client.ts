import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient, Session } from '@supabase/supabase-js'

interface ExtendedSupabaseClient extends SupabaseClient {
  _isRefreshing?: boolean
  _refreshPromise?: Promise<any>
}

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const router = useRouter()
  
  // Create Supabase client with enhanced auth configuration
  const supabase: ExtendedSupabaseClient = createClient(
    config.public.supabaseUrl,
    config.public.supabaseAnonKey,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        // Reduce token refresh buffer to 60 seconds (default is 600)
        refreshTokenBuffer: 60,
        // Attempt to refresh token 60 seconds before expiry
        expiryMargin: 60
      },
      global: {
        headers: {
          'X-Client-Info': 'nuxt-app'
        }
      }
    }
  )

  // Session state management
  const sessionState = reactive({
    isAuthenticated: false,
    user: null as any,
    expiresAt: null as number | null,
    isRefreshing: false,
    refreshAttempts: 0,
    maxRefreshAttempts: 3
  })

  // Session timeout warning (5 minutes before expiry)
  const SESSION_WARNING_TIME = 5 * 60 * 1000 // 5 minutes in milliseconds
  let sessionWarningTimer: NodeJS.Timeout | null = null
  let sessionCheckInterval: NodeJS.Timeout | null = null

  /**
   * Calculate time until session expires
   */
  const getTimeUntilExpiry = (expiresAt: number): number => {
    return Math.max(0, expiresAt * 1000 - Date.now())
  }

  /**
   * Check if session is about to expire
   */
  const isSessionNearExpiry = (expiresAt: number): boolean => {
    const timeUntilExpiry = getTimeUntilExpiry(expiresAt)
    return timeUntilExpiry <= SESSION_WARNING_TIME && timeUntilExpiry > 0
  }

  /**
   * Emit session warning event
   */
  const emitSessionWarning = (timeRemaining: number) => {
    const event = new CustomEvent('session-warning', {
      detail: { timeRemaining }
    })
    window.dispatchEvent(event)
  }

  /**
   * Emit session expired event
   */
  const emitSessionExpired = () => {
    const event = new CustomEvent('session-expired')
    window.dispatchEvent(event)
  }

  /**
   * Clear all session timers
   */
  const clearSessionTimers = () => {
    if (sessionWarningTimer) {
      clearTimeout(sessionWarningTimer)
      sessionWarningTimer = null
    }
    if (sessionCheckInterval) {
      clearInterval(sessionCheckInterval)
      sessionCheckInterval = null
    }
  }

  /**
   * Setup session monitoring timers
   */
  const setupSessionTimers = (expiresAt: number) => {
    clearSessionTimers()
    
    const timeUntilExpiry = getTimeUntilExpiry(expiresAt)
    const timeUntilWarning = Math.max(0, timeUntilExpiry - SESSION_WARNING_TIME)

    // Set timer for session warning
    if (timeUntilWarning > 0) {
      sessionWarningTimer = setTimeout(() => {
        emitSessionWarning(SESSION_WARNING_TIME)
      }, timeUntilWarning)
    } else if (timeUntilExpiry > 0) {
      // If we're already in warning period
      emitSessionWarning(timeUntilExpiry)
    }

    // Set interval to check session status every minute
    sessionCheckInterval = setInterval(() => {
      if (!sessionState.expiresAt) return

      const currentTimeUntilExpiry = getTimeUntilExpiry(sessionState.expiresAt)
      
      if (currentTimeUntilExpiry <= 0) {
        // Session has expired
        clearSessionTimers()
        handleSessionExpired()
      } else if (isSessionNearExpiry(sessionState.expiresAt)) {
        emitSessionWarning(currentTimeUntilExpiry)
      }
    }, 60000) // Check every minute
  }

  /**
   * Handle session expiration
   */
  const handleSessionExpired = async () => {
    console.warn('Session expired - logging out user')
    
    // Clear session state
    sessionState.isAuthenticated = false
    sessionState.user = null
    sessionState.expiresAt = null
    sessionState.refreshAttempts = 0
    
    clearSessionTimers()
    emitSessionExpired()
    
    // Sign out from Supabase
    await supabase.auth.signOut()
    
    // Redirect to login page if not already there
    const currentRoute = router.currentRoute.value
    if (currentRoute.path !== '/signin' && currentRoute.path !== '/signup') {
      await router.push({
        path: '/signin',
        query: { 
          reason: 'session_expired',
          redirect: currentRoute.fullPath 
        }
      })
    }
  }

  /**
   * Refresh session with retry logic
   */
  const refreshSession = async (forceRefresh = false): Promise<Session | null> => {
    // Prevent multiple simultaneous refresh attempts
    if (supabase._isRefreshing && !forceRefresh) {
      return supabase._refreshPromise
    }

    // Check if we've exceeded max refresh attempts
    if (sessionState.refreshAttempts >= sessionState.maxRefreshAttempts) {
      console.error('Max refresh attempts exceeded')
      await handleSessionExpired()
      return null
    }

    supabase._isRefreshing = true
    sessionState.isRefreshing = true
    sessionState.refreshAttempts++

    try {
      console.log(`Attempting to refresh session (attempt ${sessionState.refreshAttempts})`)
      
      const refreshPromise = supabase.auth.refreshSession()
      supabase._refreshPromise = refreshPromise
      
      const { data, error } = await refreshPromise
      
      if (error) {
        console.error('Failed to refresh session:', error.message)
        
        // If refresh fails due to invalid refresh token, handle as expired
        if (error.message.includes('refresh_token') || error.message.includes('Invalid')) {
          await handleSessionExpired()
          return null
        }
        
        throw error
      }

      if (data.session) {
        console.log('Session refreshed successfully')
        sessionState.refreshAttempts = 0 // Reset attempts on success
        return data.session
      }

      throw new Error('No session returned from refresh')
      
    } catch (error) {
      console.error('Session refresh error:', error)
      
      // If this was our last attempt, handle as expired
      if (sessionState.refreshAttempts >= sessionState.maxRefreshAttempts) {
        await handleSessionExpired()
      }
      
      return null
    } finally {
      supabase._isRefreshing = false
      sessionState.isRefreshing = false
      supabase._refreshPromise = undefined
    }
  }

  /**
   * Update session state
   */
  const updateSessionState = (session: Session | null) => {
    if (session) {
      sessionState.isAuthenticated = true
      sessionState.user = session.user
      sessionState.expiresAt = session.expires_at || null
      sessionState.refreshAttempts = 0
      
      if (session.expires_at) {
        setupSessionTimers(session.expires_at)
      }
    } else {
      sessionState.isAuthenticated = false
      sessionState.user = null
      sessionState.expiresAt = null
      clearSessionTimers()
    }
  }

  /**
   * HTTP Request Interceptor for automatic token refresh
   */
  const interceptRequest = async (url: string, options: any = {}) => {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (session && session.expires_at) {
      const timeUntilExpiry = getTimeUntilExpiry(session.expires_at)
      
      // If session expires in less than 2 minutes, refresh it
      if (timeUntilExpiry < 120000 && timeUntilExpiry > 0) {
        console.log('Session expiring soon, refreshing before request')
        await refreshSession()
      }
    }
    
    return { url, options }
  }

  /**
   * Setup auth state change listener
   */
  const setupAuthListener = () => {
    supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email)
      
      switch (event) {
        case 'SIGNED_IN':
          updateSessionState(session)
          break
          
        case 'SIGNED_OUT':
          updateSessionState(null)
          break
          
        case 'TOKEN_REFRESHED':
          console.log('Token refreshed successfully')
          updateSessionState(session)
          break
          
        case 'USER_UPDATED':
          if (session) {
            updateSessionState(session)
          }
          break
          
        default:
          break
      }
    })
  }

  /**
   * Initialize session state
   */
  const initializeSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('Error getting initial session:', error)
        return
      }
      
      if (session) {
        // Check if current session is still valid
        const timeUntilExpiry = session.expires_at ? getTimeUntilExpiry(session.expires_at) : 0
        
        if (timeUntilExpiry <= 0) {
          console.log('Initial session expired, attempting refresh')
          await refreshSession(true)
        } else {
          updateSessionState(session)
        }
      }
    } catch (error) {
      console.error('Failed to initialize session:', error)
    }
  }

  /**
   * Enhanced Supabase client with session management
   */
  const enhancedSupabase = {
    ...supabase,
    
    // Session management methods
    refreshSession,
    getSessionState: () => readonly(sessionState),
    isSessionValid: () => {
      if (!sessionState.expiresAt) return false
      return getTimeUntilExpiry(sessionState.expiresAt) > 0
    },
    getTimeUntilExpiry: () => {
      if (!sessionState.expiresAt) return 0
      return getTimeUntilExpiry(sessionState.expiresAt)
    },
    
    // HTTP interceptor
    interceptRequest,
    
    // Manual session validation
    validateSession: async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) return false
      
      if (session.expires_at) {
        const timeUntilExpiry = getTimeUntilExpiry(session.expires_at)
        if (timeUntilExpiry <= 0) {
          await refreshSession()
          return sessionState.isAuthenticated
        }
      }
      
      return true
    }
  }

  // Initialize when plugin loads
  if (process.client) {
    setupAuthListener()
    
    // Initialize session state after a short delay to ensure DOM is ready
    setTimeout(initializeSession, 100)
    
    // Setup global error handler for auth errors
    window.addEventListener('unhandledrejection', (event) => {
      if (event.reason?.message?.includes('JWT')) {
        console.log('JWT error detected, attempting session refresh')
        refreshSession()
      }
    })
    
    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
      clearSessionTimers()
    })
  }

  return {
    provide: {
      supabase: enhancedSupabase
    }
  }
})