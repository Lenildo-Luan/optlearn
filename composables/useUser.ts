// composables/useUser.ts
import type { User } from "@supabase/supabase-js"

// Estado global reativo do usuário
const user = ref<User | null>(null)
const loading = ref(true)
const initialized = ref(false)

export const useUser = () => {
  const { $supabase } = useNuxtApp()

  /**
   * Inicializa o estado do usuário e configura listeners
   */
  const initializeUser = async () => {
    if (initialized.value) return

    loading.value = true

    try {
      // Recupera a sessão atual
      const { data: { session }, error } = await $supabase.auth.getSession()
      
      if (error) {
        console.error('Erro ao recuperar sessão:', error)
        user.value = null
      } else {
        user.value = session?.user || null
      }

      // Configura listener para mudanças de estado de autenticação
      $supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth state changed:', event)
        
        switch (event) {
          case 'SIGNED_IN':
            user.value = session?.user || null
            break
          case 'SIGNED_OUT':
            user.value = null
            break
          case 'TOKEN_REFRESHED':
            user.value = session?.user || null
            break
          case 'USER_UPDATED':
            user.value = session?.user || null
            break
          default:
            user.value = session?.user || null
        }
      })

      initialized.value = true
    } catch (error) {
      console.error('Erro inesperado ao inicializar usuário:', error)
      user.value = null
    } finally {
      loading.value = false
    }
  }

  /**
   * Força a atualização do estado do usuário
   */
  const refreshUser = async () => {
    loading.value = true
    
    try {
      const { data: { user: currentUser }, error } = await $supabase.auth.getUser()
      
      if (error) {
        console.error('Erro ao atualizar usuário:', error)
        user.value = null
      } else {
        user.value = currentUser
      }
    } catch (error) {
      console.error('Erro inesperado ao atualizar usuário:', error)
      user.value = null
    } finally {
      loading.value = false
    }
  }

  /**
   * Limpa o estado do usuário (logout)
   */
  const clearUser = () => {
    user.value = null
  }

  /**
   * Verifica se o usuário está autenticado
   */
  const isAuthenticated = computed(() => !!user.value)

  /**
   * Verifica se o estado ainda está carregando
   */
  const isLoading = computed(() => loading.value)

  /**
   * Verifica se o sistema foi inicializado
   */
  const isInitialized = computed(() => initialized.value)

  return {
    user: readonly(user),
    isAuthenticated,
    isLoading,
    isInitialized,
    initializeUser,
    refreshUser,
    clearUser
  }
}