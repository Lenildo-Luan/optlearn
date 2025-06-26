import type { User } from "@supabase/supabase-js"
import type { AuthResponse, SignUpData, SignInData } from "~/types/auth"

export const useAuth = () => {
  const { $supabase } = useNuxtApp()
  const user = ref<User | null>(null)
  const loading = ref(false)

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

  const signIn = async (data: SignInData): Promise<AuthResponse> => {
    loading.value = true
    
    try {
      const { data: authData, error } = await $supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password
      })

      if (error) {
        return {
          success: false,
          message: 'Erro ao fazer login',
          error: error.message
        }
      }

      if (authData.user) {
        user.value = authData.user
        
        // Store remember me preference
        if (data.rememberMe) {
          localStorage.setItem('rememberMe', 'true')
        } else {
          localStorage.removeItem('rememberMe')
        }
        
        return {
          success: true,
          message: 'Login realizado com sucesso!'
        }
      }

      return {
        success: false,
        message: 'Erro no login'
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
      
      user.value = null
      localStorage.removeItem('rememberMe')
      
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

  const getCurrentUser = async () => {
    const { data: { user: currentUser } } = await $supabase.auth.getUser()
    user.value = currentUser
    return currentUser
  }

  const refreshSession = async () => {
    try {
      const { data, error } = await $supabase.auth.refreshSession()
      if (error) {
        console.error('Error refreshing session:', error)
        return false
      }
      if (data.user) {
        user.value = data.user
      }
      return true
    } catch (error) {
      console.error('Error refreshing session:', error)
      return false
    }
  }

  return {
    user: readonly(user),
    loading: readonly(loading),
    signUp,
    signIn,
    signInWithOAuth,
    signOut,
    getCurrentUser,
    refreshSession
  }
}