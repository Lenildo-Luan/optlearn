import type { User } from "@supabase/supabase-js"
import type { AuthResponse, SignUpData } from "~/types/auth"

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

  const getCurrentUser = async () => {
    const { data: { user: currentUser } } = await $supabase.auth.getUser()
    user.value = currentUser
    return currentUser
  }

  return {
    user: readonly(user),
    loading: readonly(loading),
    signUp,
    signInWithOAuth,
    getCurrentUser
  }
}