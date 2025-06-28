export default defineNuxtRouteMiddleware(async (to, from) => {
  // Evita execução no servidor para evitar problemas de hidratação
  if (process.server) return

  const { $supabase } = useNuxtApp()
  
  try {
    // Obtém a sessão atual de forma síncrona
    const { data: { session }, error } = await $supabase.auth.getSession()
    
    // Se houver erro na verificação da sessão
    if (error) {
      console.error('Erro ao verificar sessão:', error)
      return navigateTo('/signin?error=session_check_failed')
    }
    
    // Se não há sessão ativa, redireciona para login
    if (!session) {
      // Preserva a rota de destino para redirecionamento após login
      const redirectTo = to.fullPath !== '/signin' ? to.fullPath : undefined
      const loginUrl = redirectTo 
        ? `/signin?redirect=${encodeURIComponent(redirectTo)}`
        : '/signin'
      
      return navigateTo(loginUrl)
    }
    
    // Verifica se a sessão não expirou
    const now = Math.floor(Date.now() / 1000)
    if (session.expires_at && session.expires_at < now) {
      // Sessão expirada, força logout e redireciona
      await $supabase.auth.signOut()
      return navigateTo('/signin?error=session_expired')
    }
    
    // Usuário autenticado com sessão válida, permite acesso
    return
    
  } catch (error) {
    console.error('Erro inesperado no middleware de auth:', error)
    return navigateTo('/signin?error=unexpected')
  }
})