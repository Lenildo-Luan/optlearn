import { useUser } from "~/composables/useUser"

// middleware/guest.ts
export default defineNuxtRouteMiddleware(async (to, from) => {
  const { $supabase } = useNuxtApp()
  const { user, isLoading, isInitialized, initializeUser } = useUser()

  // Inicializa o estado do usuário se necessário
  if (!isInitialized.value) {
    await initializeUser()
  }

  // Aguarda o carregamento se ainda estiver processando
  if (isLoading.value) {
    await new Promise<void>((resolve) => {
      const unwatch = watch(isLoading, (newValue) => {
        if (!newValue) {
          unwatch()
          resolve()
        }
      })
    })
  }

  // Verifica se há sessão ativa
  const { data: { session }, error } = await $supabase.auth.getSession()
  
  if (error) {
    console.error('Erro ao verificar sessão:', error)
    // Em caso de erro, permite acesso à página (assume não autenticado)
    return
  }

  if (session) {
    // Verifica se o token ainda é válido
    const now = Math.floor(Date.now() / 1000)
    const tokenExpiry = session.expires_at || 0

    if (tokenExpiry > now) {
      // Token válido, redireciona usuário autenticado
      const redirectTo = to.query.redirect as string
      
      if (redirectTo) {
        return navigateTo(decodeURIComponent(redirectTo))
      }
      
      return navigateTo('/dashboard')
    } else {
      // Token expirado, permite acesso à página de guest
      console.log('Token expirado, permitindo acesso como guest')
    }
  }
})