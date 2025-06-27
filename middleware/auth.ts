import { useUser } from "~/composables/useUser"

// middleware/auth.ts
export default defineNuxtRouteMiddleware(async (to, from) => {
  const { $supabase } = useNuxtApp()
  const { user, isLoading, isInitialized, initializeUser } = useUser()

  // Inicializa o estado do usuário se necessário
  if (!isInitialized.value) {
    await initializeUser()
  }

  // Aguarda o carregamento se ainda estiver processando
  if (isLoading.value) {
    // Aguarda até o loading terminar
    await new Promise<void>((resolve) => {
      const unwatch = watch(isLoading, (newValue) => {
        if (!newValue) {
          unwatch()
          resolve()
        }
      })
    })
  }

  // Verifica se há sessão válida
  const { data: { session }, error } = await $supabase.auth.getSession()
  
  if (error) {
    console.error('Erro ao verificar sessão:', error)
    return navigateTo('/signin?error=session_error')
  }

  if (!session) {
    // Salva a rota tentada para redirecionamento após login
    const intendedRoute = to.fullPath
    return navigateTo(`/signin?redirect=${encodeURIComponent(intendedRoute)}`)
  }

  // Verifica se o token não expirou
  const now = Math.floor(Date.now() / 1000)
  const tokenExpiry = session.expires_at || 0

  if (tokenExpiry <= now) {
    console.warn('Token expirado, tentando renovar...')
    
    try {
      const { data, error: refreshError } = await $supabase.auth.refreshSession()
      
      if (refreshError || !data.session) {
        console.error('Erro ao renovar token:', refreshError)
        return navigateTo('/signin?error=token_expired')
      }
    } catch (refreshError) {
      console.error('Erro inesperado ao renovar token:', refreshError)
      return navigateTo('/signin?error=refresh_failed')
    }
  }
})