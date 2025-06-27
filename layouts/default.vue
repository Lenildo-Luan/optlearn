<!-- layouts/default.vue -->
<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Loading overlay durante inicialização -->
    <div
      v-if="isLoading && !isInitialized"
      class="fixed inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50"
    >
      <div class="text-center">
        <div class="animate-spin inline-block w-8 h-8 border-4 border-blue-500 border-r-transparent rounded-full mb-4"></div>
        <p class="text-gray-600">Carregando...</p>
      </div>
    </div>

    <nav class="bg-white shadow-sm border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex items-center">
            <NuxtLink to="/" class="text-xl font-bold text-gray-900">
              DevLearn Platform
            </NuxtLink>
          </div>
          
          <div class="flex items-center space-x-4">
            <template v-if="isAuthenticated && user">
              <div class="flex items-center space-x-3">
                <!-- Avatar placeholder -->
                <div class="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <span class="text-xs font-medium text-gray-700">
                    {{ getInitials(user.email || '') }}
                  </span>
                </div>
                
                <div class="flex flex-col">
                  <span class="text-sm font-medium text-gray-900">
                    {{ user.email }}
                  </span>
                  <span class="text-xs text-gray-500">
                    Online
                  </span>
                </div>
              </div>
              
              <BaseButton
                variant="outline"
                size="sm"
                :loading="signingOut"
                @click="handleSignOut"
              >
                Sair
              </BaseButton>
            </template>
            
            <template v-else-if="!isLoading">
              <NuxtLink to="/signin">
                <BaseButton variant="ghost" size="sm">
                  Entrar
                </BaseButton>
              </NuxtLink>
              <NuxtLink to="/signup">
                <BaseButton variant="primary" size="sm">
                  Criar Conta
                </BaseButton>
              </NuxtLink>
            </template>
          </div>
        </div>
      </div>
    </nav>
    
    <main>
      <slot />
    </main>

    <!-- Toast de notificações -->
    <BaseAlert
      v-if="notification.show"
      :type="notification.type"
      :title="notification.title"
      :message="notification.message"
      :show="notification.show"
      dismissible
      class="fixed top-4 right-4 z-40 max-w-sm"
      @dismiss="clearNotification"
    />
  </div>
</template>

<script setup lang="ts">
const { signOut } = useAuth()
import { useUser } from "~/composables/useUser"
const { user, isAuthenticated, isLoading, isInitialized } = useUser()
const router = useRouter()

const signingOut = ref(false)
const notification = reactive({
  show: false,
  type: 'info' as 'info' | 'success' | 'error' | 'warning',
  title: '',
  message: ''
})

const getInitials = (email: string): string => {
  return email.split('@')[0].charAt(0).toUpperCase()
}

const showNotification = (type: 'success' | 'error' | 'warning' | 'info', title: string, message?: string) => {
  notification.show = true
  notification.type = type
  notification.title = title
  notification.message = message || ''
}

const clearNotification = () => {
  notification.show = false
}

const handleSignOut = async () => {
  signingOut.value = true
  
  try {
    const response = await signOut()
    
    if (response.success) {
      showNotification('success', 'Logout realizado', 'Você foi desconectado com sucesso.')
    } else {
      showNotification('error', 'Erro ao sair', response.message)
    }
  } catch (error) {
    showNotification('error', 'Erro inesperado', 'Ocorreu um erro ao tentar sair.')
  } finally {
    signingOut.value = false
  }
}

// Escuta erros de rota para exibir notificações
router.onError((error) => {
  console.error('Erro de rota:', error)
  showNotification('error', 'Erro de navegação', 'Ocorreu um erro ao navegar.')
})

// Observa mudanças na query string para exibir mensagens
watch(() => router.currentRoute.value.query, (newQuery) => {
  if (newQuery.error) {
    let errorMessage = 'Ocorreu um erro inesperado.'
    
    switch (newQuery.error) {
      case 'session_error':
        errorMessage = 'Erro ao verificar sua sessão. Faça login novamente.'
        break
      case 'token_expired':
        errorMessage = 'Sua sessão expirou. Faça login novamente.'
        break
      case 'refresh_failed':
        errorMessage = 'Falha ao renovar sessão. Faça login novamente.'
        break
      case 'auth_callback_failed':
        errorMessage = 'Erro no processo de autenticação.'
        break
    }
    
    showNotification('error', 'Erro de autenticação', errorMessage)
    
    // Remove o parâmetro de erro da URL
    router.replace({ query: { ...newQuery, error: undefined } })
  }
}, { immediate: true })
</script>