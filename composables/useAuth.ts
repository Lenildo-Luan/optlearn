import type { User, Session } from "@supabase/supabase-js"
import type { AuthResponse, SignUpData } from "~/types/auth"

interface AuthState {
  user: User | null
  session: Session | null
  isAuthenticated: boolean
  isLoading: boolean
  isInitialized: boolean
}

export const useAuth = () => {
  const { $supabase } = useNuxtApp()
  const router = useRouter()
  
  // Estado reativo centralizado
  const authState = reactive<AuthState>({
    user: null,
    session: null,
    isAuthenticated: false,
    isLoading: true,
    isInitialized: false
  })

  // Estado de loading para operações específicas
  const loading = ref(false)

  /**
   * Verifica o estado atual de autenticação
   * @returns Promise<boolean> - true se autenticado, false caso contrário
   */
  const checkAuthState = async (): Promise<boolean> => {
    try {
      authState.isLoading = true
      
      const { data: { session }, error } = await $supabase.auth.getSession()
      
      if (error) {
        console.error('Erro ao verificar sessão:', error)
        updateAuthState(null, null)
        return false
      }

      if (session?.user) {
        updateAuthState(session.user, session)
        return true
      } else {
        updateAuthState(null, null)
        return false
      }
    } catch (error) {
      console.error('Erro inesperado ao verificar auth:', error)
      updateAuthState(null, null)
      return false
    } finally {
      authState.isLoading = false
      authState.isInitialized = true
    }
  }

  /**
   * Atualiza o estado de autenticação de forma reativa
   */
  const updateAuthState = (user: User | null, session: Session | null) => {
    authState.user = user
    authState.session = session
    authState.isAuthenticated = !!user && !!session
  }

  /**
   * Inicializa o listener de mudanças de autenticação
   */
  const initAuthListener = () => {
    $supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email)
      
      switch (event) {
        case 'SIGNED_IN':
          updateAuthState(session?.user || null, session)
          break
          
        case 'SIGNED_OUT':
          updateAuthState(null, null)
          // Auto-redirect para página de login quando deslogado
          await router.push('/signin')
          break
          
        case 'TOKEN_REFRESHED':
          updateAuthState(session?.user || null, session)
          break
          
        case 'USER_UPDATED':
          updateAuthState(session?.user || null, session)
          break
          
        default:
          // Para eventos como 'INITIAL_SESSION', só atualiza se necessário
          if (session) {
            updateAuthState(session.user, session)
          } else {
            updateAuthState(null, null)
          }
      }
    })
  }

  /**
   * Força um refresh do token de autenticação
   */
  const refreshSession = async (): Promise<boolean> => {
    try {
      const { data, error } = await $supabase.auth.refreshSession()
      
      if (error || !data.session) {
        updateAuthState(null, null)
        return false
      }
      
      updateAuthState(data.session.user, data.session)
      return true
    } catch (error) {
      console.error('Erro ao renovar sessão:', error)
      updateAuthState(null, null)
      return false
    }
  }

  /**
   * Verifica se o usuário tem permissão para acessar uma rota
   */
  const canAccess = (requireAuth = true): boolean => {
    if (!authState.isInitialized) {
      return false // Ainda carregando
    }
    
    return requireAuth ? authState.isAuthenticated : !authState.isAuthenticated
  }

  /**
   * Redireciona baseado no estado de autenticação
   */
  const redirectBasedOnAuth = async (
    authenticatedRoute = '/dashboard',
    unauthenticatedRoute = '/signin'
  ) => {
    if (!authState.isInitialized) {
      await checkAuthState()
    }
    
    if (authState.isAuthenticated) {
      await router.push(authenticatedRoute)
    } else {
      await router.push(unauthenticatedRoute)
    }
  }

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
        return {
          success: false,
          message: 'Erro ao criar conta',
          error: error.message
        }
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

  const signIn = async (email: string, password: string): Promise<AuthResponse> => {
    loading.value = true
    
    try {
      const { data, error } = await $supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        return {
          success: false,
          message: 'Erro ao fazer login',
          error: error.message
        }
      }

      if (data.user) {
        return {
          success: true,
          message: 'Login realizado com sucesso!'
        }
      }

      return {
        success: false,
        message: 'Erro inesperado no login'
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
        return {
          success: false,
          message: `Erro ao fazer login com ${provider}`,
          error: error.message
        }
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

  const signOut = async (): Promise<AuthResponse> => {
    loading.value = true
    
    try {
      const { error } = await $supabase.auth.signOut()
      
      if (error) {
        return {
          success: false,
          message: 'Erro ao fazer logout',
          error: error.message
        }
      }

      return {
        success: true,
        message: 'Logout realizado com sucesso!'
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
   * Método legacy para compatibilidade
   * @deprecated Use checkAuthState() instead
   */
  const getCurrentUser = async () => {
    await checkAuthState()
    return authState.user
  }

  // Computed properties para facilitar o uso
  const user = computed(() => authState.user)
  const session = computed(() => authState.session)
  const isAuthenticated = computed(() => authState.isAuthenticated)
  const isLoading = computed(() => authState.isLoading)
  const isInitialized = computed(() => authState.isInitialized)

  return {
    // Estado reativo
    user: readonly(user),
    session: readonly(session),
    isAuthenticated: readonly(isAuthenticated),
    isLoading: readonly(isLoading),
    isInitialized: readonly(isInitialized),
    loading: readonly(loading),
    
    // Métodos principais
    checkAuthState,
    initAuthListener,
    refreshSession,
    canAccess,
    redirectBasedOnAuth,
    
    // Métodos de autenticação
    signUp,
    signIn,
    signInWithOAuth,
    signOut,
    
    // Compatibilidade
    getCurrentUser
  }
}