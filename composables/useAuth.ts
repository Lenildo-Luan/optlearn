// composables/useAuth.ts
import type { User } from "@supabase/supabase-js"
import type { AuthResponse, SignUpData } from "~/types/auth"
import { useUser } from "./useUser"

export const useAuth = () => {
  const { $supabase } = useNuxtApp()
  const { user, clearUser, refreshUser } = useUser()
  const loading = ref(false)
  const router = useRouter()

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

      // Atualiza o estado do usuário após signup bem-sucedido
      await refreshUser()

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
          message: 'Credenciais inválidas',
          error: error.message
        }
      }

      // Atualiza o estado do usuário após login bem-sucedido
      await refreshUser()

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

      // Limpa o estado do usuário
      clearUser()
      
      // Redireciona para home
      await router.push('/')

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

  const getCurrentUser = async (): Promise<User | null> => {
    try {
      const { data: { user: currentUser }, error } = await $supabase.auth.getUser()
      
      if (error) {
        console.error('Erro ao obter usuário atual:', error)
        return null
      }
      
      return currentUser
    } catch (error) {
      console.error('Erro inesperado ao obter usuário:', error)
      return null
    }
  }

  const refreshSession = async (): Promise<boolean> => {
    try {
      const { data, error } = await $supabase.auth.refreshSession()
      
      if (error || !data.session) {
        console.error('Erro ao renovar sessão:', error)
        return false
      }

      await refreshUser()
      return true
    } catch (error) {
      console.error('Erro inesperado ao renovar sessão:', error)
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