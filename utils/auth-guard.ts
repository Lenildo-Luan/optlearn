import type { User } from "@supabase/supabase-js"
import type { RouteLocationNormalized } from "vue-router"

export interface AuthGuardOptions {
  redirectTo?: string
  requireAuth?: boolean
  allowedRoles?: string[]
  onSuccess?: (user: User) => void
  onFailure?: (error?: string) => void
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  session: any
}

/**
 * Verifica o estado atual de autenticação
 */
export const checkAuthState = async (): Promise<AuthState> => {
  try {
    const { $supabase } = useNuxtApp()
    
    const { data: { session }, error } = await $supabase.auth.getSession()
    
    if (error) {
      console.error('Auth state check error:', error)
      return {
        user: null,
        isAuthenticated: false,
        isLoading: false,
        session: null
      }
    }

    return {
      user: session?.user || null,
      isAuthenticated: !!session?.user,
      isLoading: false,
      session
    }
  } catch (error) {
    console.error('Unexpected error checking auth state:', error)
    return {
      user: null,
      isAuthenticated: false,
      isLoading: false,
      session: null
    }
  }
}

/**
 * Verifica se o usuário tem as permissões necessárias
 */
export const hasRequiredPermissions = (
  user: User | null, 
  requiredRoles?: string[]
): boolean => {
  if (!user || !requiredRoles || requiredRoles.length === 0) {
    return true
  }

  // Assumindo que roles estão no user metadata
  const userRoles = user.user_metadata?.roles || []
  
  return requiredRoles.some(role => userRoles.includes(role))
}

/**
 * Redireciona para uma rota específica
 */
export const redirectTo = async (
  path: string, 
  options: { replace?: boolean; external?: boolean } = {}
): Promise<void> => {
  try {
    if (options.external) {
      await navigateTo(path, { external: true })
    } else {
      await navigateTo(path, { replace: options.replace || false })
    }
  } catch (error) {
    console.error('Redirect error:', error)
    // Fallback para window.location se navigateTo falhar
    if (process.client) {
      if (options.replace) {
        window.location.replace(path)
      } else {
        window.location.href = path
      }
    }
  }
}

/**
 * Guard para rotas que requerem autenticação
 */
export const requireAuthGuard = async (
  to: RouteLocationNormalized,
  options: AuthGuardOptions = {}
): Promise<boolean> => {
  const {
    redirectTo: redirectPath = '/signin',
    allowedRoles,
    onSuccess,
    onFailure
  } = options

  try {
    const authState = await checkAuthState()

    if (!authState.isAuthenticated) {
      await redirectTo(`${redirectPath}?redirect=${encodeURIComponent(to.fullPath)}`)
      onFailure?.('User not authenticated')
      return false
    }

    if (!hasRequiredPermissions(authState.user, allowedRoles)) {
      await redirectTo('/unauthorized')
      onFailure?.('Insufficient permissions')
      return false
    }

    onSuccess?.(authState.user!)
    return true
  } catch (error) {
    console.error('Auth guard error:', error)
    await redirectTo(redirectPath)
    onFailure?.('Auth guard error')
    return false
  }
}

/**
 * Guard para rotas que requerem usuário desautenticado (guest)
 */
export const requireGuestGuard = async (
  to: RouteLocationNormalized,
  options: AuthGuardOptions = {}
): Promise<boolean> => {
  const {
    redirectTo: redirectPath = '/dashboard',
    onSuccess,
    onFailure
  } = options

  try {
    const authState = await checkAuthState()

    if (authState.isAuthenticated) {
      // Se tem redirect query param, usar ele; senão usar o padrão
      const redirectQuery = to.query.redirect as string
      const finalRedirectPath = redirectQuery && isValidRedirectPath(redirectQuery) 
        ? redirectQuery 
        : redirectPath

      await redirectTo(finalRedirectPath)
      onFailure?.('User already authenticated')
      return false
    }

    onSuccess?.(null)
    return true
  } catch (error) {
    console.error('Guest guard error:', error)
    onFailure?.('Guest guard error')
    return true // Em caso de erro, permite acesso (fail open para guest)
  }
}

/**
 * Valida se um path de redirect é seguro
 */
export const isValidRedirectPath = (path: string): boolean => {
  try {
    // Não permite URLs externas
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return false
    }

    // Não permite paths perigosos
    const dangerousPaths = ['/auth/callback', '/api/']
    if (dangerousPaths.some(dangerous => path.startsWith(dangerous))) {
      return false
    }

    // Deve começar com /
    if (!path.startsWith('/')) {
      return false
    }

    // Validação básica de URL
    new URL(path, 'http://localhost')
    return true
  } catch {
    return false
  }
}

/**
 * Cria um middleware personalizado de autenticação
 */
export const createAuthMiddleware = (options: AuthGuardOptions = {}) => {
  return defineNuxtRouteMiddleware(async (to) => {
    const { requireAuth = true } = options

    if (requireAuth) {
      const canAccess = await requireAuthGuard(to, options)
      if (!canAccess) {
        return abortNavigation('Authentication required')
      }
    } else {
      const canAccess = await requireGuestGuard(to, options)
      if (!canAccess) {
        return abortNavigation('Already authenticated')
      }
    }
  })
}

/**
 * Hook para monitorar mudanças de autenticação
 */
export const useAuthStateMonitor = () => {
  const authState = ref<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    session: null
  })

  const { $supabase } = useNuxtApp()

  const updateAuthState = async () => {
    const newState = await checkAuthState()
    authState.value = newState
  }

  const startMonitoring = () => {
    // Verificação inicial
    updateAuthState()

    // Monitor de mudanças
    const { data: authListener } = $supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event)
        
        authState.value = {
          user: session?.user || null,
          isAuthenticated: !!session?.user,
          isLoading: false,
          session
        }

        // Auto-redirect baseado no evento
        if (event === 'SIGNED_OUT') {
          await redirectTo('/signin')
        }
      }
    )

    // Cleanup function
    return () => {
      authListener?.subscription?.unsubscribe()
    }
  }

  return {
    authState: readonly(authState),
    updateAuthState,
    startMonitoring
  }
}

/**
 * Utilitário para criar guards condicionais
 */
export const createConditionalGuard = (
  condition: (to: RouteLocationNormalized, authState: AuthState) => boolean,
  onSuccess: (to: RouteLocationNormalized, authState: AuthState) => void | Promise<void>,
  onFailure: (to: RouteLocationNormalized, authState: AuthState) => void | Promise<void>
) => {
  return async (to: RouteLocationNormalized) => {
    const authState = await checkAuthState()
    
    if (condition(to, authState)) {
      await onSuccess(to, authState)
      return true
    } else {
      await onFailure(to, authState)
      return false
    }
  }
}

/**
 * Guarda para rotas administrativas
 */
export const adminGuard = (to: RouteLocationNormalized) => {
  return createConditionalGuard(
    (_, authState) => {
      return authState.isAuthenticated && 
             hasRequiredPermissions(authState.user, ['admin'])
    },
    () => {
      console.log('Admin access granted')
    },
    async () => {
      await redirectTo('/unauthorized')
    }
  )(to)
}

/**
 * Utilitário para extrair redirect path dos query params
 */
export const getRedirectPath = (
  to: RouteLocationNormalized, 
  defaultPath: string = '/'
): string => {
  const redirectQuery = to.query.redirect as string
  
  if (redirectQuery && isValidRedirectPath(redirectQuery)) {
    return redirectQuery
  }
  
  return defaultPath
}

/**
 * Limpa informações sensíveis antes do logout
 */
export const cleanupBeforeLogout = async (): Promise<void> => {
  try {
    // Limpar localStorage se necessário
    if (process.client) {
      // Exemplo: localStorage.removeItem('user-preferences')
      
      // Limpar sessionStorage
      sessionStorage.clear()
    }
    
    // Outras limpezas necessárias
    console.log('Cleanup completed before logout')
  } catch (error) {
    console.error('Error during cleanup:', error)
  }
}

export default {
  checkAuthState,
  hasRequiredPermissions,
  redirectTo,
  requireAuthGuard,
  requireGuestGuard,
  isValidRedirectPath,
  createAuthMiddleware,
  useAuthStateMonitor,
  createConditionalGuard,
  adminGuard,
  getRedirectPath,
  cleanupBeforeLogout
}