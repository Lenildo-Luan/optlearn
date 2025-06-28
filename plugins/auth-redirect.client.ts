export default defineNuxtPlugin(() => {
  const { $supabase } = useNuxtApp()
  const router = useRouter()
  const route = useRoute()

  // Lista de rotas que requerem autenticação
  const protectedRoutes = [
    '/dashboard',
    '/profile',
    '/settings',
    '/roadmap',
    '/lessons'
  ]

  // Lista de rotas que são apenas para usuários não autenticados
  const guestOnlyRoutes = [
    '/signin',
    '/signup',
    '/forgot-password',
    '/reset-password'
  ]

  // Lista de rotas públicas (não requerem verificação)
  const publicRoutes = [
    '/',
    '/about',
    '/contact',
    '/terms',
    '/privacy',
    '/auth/callback'
  ]

  // Função para verificar se uma rota é protegida
  const isProtectedRoute = (path: string): boolean => {
    return protectedRoutes.some(route => path.startsWith(route))
  }

  // Função para verificar se uma rota é apenas para guests
  const isGuestOnlyRoute = (path: string): boolean => {
    return guestOnlyRoutes.some(route => path.startsWith(route))
  }

  // Função para verificar se uma rota é pública
  const isPublicRoute = (path: string): boolean => {
    return publicRoutes.some(route => path === route || path.startsWith(route))
  }

  // Função para realizar redirect baseado no estado de auth
  const handleAuthRedirect = async (session: any, currentPath: string) => {
    // Se tem sessão ativa
    if (session?.user) {
      // Se está em rota de guest only, redireciona para dashboard
      if (isGuestOnlyRoute(currentPath)) {
        console.log('🔄 Usuário autenticado acessando rota de guest, redirecionando para dashboard')
        await router.push('/dashboard')
        return
      }
    } 
    // Se não tem sessão ativa
    else {
      // Se está em rota protegida, redireciona para login
      if (isProtectedRoute(currentPath)) {
        console.log('🔄 Usuário não autenticado acessando rota protegida, redirecionando para login')
        
        // Salva a rota atual para redirect após login
        const redirectTo = encodeURIComponent(currentPath)
        await router.push(`/signin?redirect=${redirectTo}`)
        return
      }
    }
  }

  // Configurar listener para mudanças no estado de autenticação
  let isInitialized = false

  const setupAuthListener = () => {
    $supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔐 Auth state changed:', event, session?.user?.email || 'No user')
      
      const currentPath = route.path

      // Ignorar rotas públicas
      if (isPublicRoute(currentPath)) {
        return
      }

      // Aguardar um tick para garantir que o router está pronto
      await nextTick()

      // Lidar com diferentes eventos de autenticação
      switch (event) {
        case 'SIGNED_IN':
          console.log('✅ Usuário logado:', session?.user?.email)
          
          // Verificar se há redirect pendente
          const urlParams = new URLSearchParams(window.location.search)
          const redirectTo = urlParams.get('redirect')
          
          if (redirectTo && isProtectedRoute(decodeURIComponent(redirectTo))) {
            await router.push(decodeURIComponent(redirectTo))
          } else if (isGuestOnlyRoute(currentPath)) {
            await router.push('/dashboard')
          }
          break

        case 'SIGNED_OUT':
          console.log('🚪 Usuário deslogado')
          
          // Se estava em rota protegida, redireciona para login
          if (isProtectedRoute(currentPath)) {
            await router.push('/signin')
          }
          break

        case 'TOKEN_REFRESHED':
          console.log('🔄 Token renovado')
          // Não fazer nada, apenas manter a sessão ativa
          break

        case 'USER_UPDATED':
          console.log('👤 Dados do usuário atualizados')
          // Não fazer nada específico
          break

        case 'PASSWORD_RECOVERY':
          console.log('🔑 Recuperação de senha iniciada')
          // Redirecionar para página de reset se necessário
          break
      }

      // Verificação adicional para garantir consistência
      if (isInitialized) {
        await handleAuthRedirect(session, currentPath)
      }
    })

    // Marcar como inicializado após primeira verificação
    isInitialized = true
  }

  // Verificação inicial da sessão
  const initializeAuth = async () => {
    try {
      const { data: { session }, error } = await $supabase.auth.getSession()
      
      if (error) {
        console.error('❌ Erro ao obter sessão:', error)
        return
      }

      const currentPath = route.path
      
      console.log('🔍 Verificação inicial de auth:', {
        hasSession: !!session,
        currentPath,
        isProtected: isProtectedRoute(currentPath),
        isGuestOnly: isGuestOnlyRoute(currentPath),
        isPublic: isPublicRoute(currentPath)
      })

      // Ignorar verificação para rotas públicas
      if (isPublicRoute(currentPath)) {
        setupAuthListener()
        return
      }

      // Realizar redirect inicial se necessário
      await handleAuthRedirect(session, currentPath)
      
      // Configurar listener após verificação inicial
      setupAuthListener()
      
    } catch (error) {
      console.error('❌ Erro na inicialização de auth:', error)
      setupAuthListener() // Configurar listener mesmo em caso de erro
    }
  }

  // Executar apenas no lado do cliente
  if (import.meta.client) {
    // Aguardar o router estar pronto
    router.isReady().then(() => {
      initializeAuth()
    })

    // Listener adicional para mudanças de rota
    router.beforeEach(async (to, from) => {
      // Ignorar rotas públicas
      if (isPublicRoute(to.path)) {
        return true
      }

      try {
        const { data: { session } } = await $supabase.auth.getSession()
        
        // Verificar se precisa redirecionar
        if (!session && isProtectedRoute(to.path)) {
          console.log('🚫 Acesso negado a rota protegida:', to.path)
          const redirectTo = encodeURIComponent(to.fullPath)
          return `/signin?redirect=${redirectTo}`
        }
        
        if (session && isGuestOnlyRoute(to.path)) {
          console.log('🚫 Usuário autenticado tentando acessar rota de guest:', to.path)
          return '/dashboard'
        }
        
        return true
      } catch (error) {
        console.error('❌ Erro na verificação de rota:', error)
        return true // Permitir navegação em caso de erro
      }
    })
  }

  // Disponibilizar funções utilitárias
  return {
    provide: {
      authGuard: {
        isProtectedRoute,
        isGuestOnlyRoute,
        isPublicRoute,
        handleAuthRedirect
      }
    }
  }
})