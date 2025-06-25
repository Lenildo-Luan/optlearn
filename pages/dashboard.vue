<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div class="px-4 py-6 sm:px-0">
        <div class="bg-white overflow-hidden shadow rounded-lg">
          <div class="px-4 py-5 sm:p-6">
            <h1 class="text-3xl font-bold text-gray-900 mb-4">
              Bem-vindo à Developer Learning Platform!
            </h1>
            <p class="text-gray-600 mb-6">
              Sua conta foi criada com sucesso. Aqui você começará sua jornada de aprendizado gamificada.
            </p>
            
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div class="bg-blue-50 p-6 rounded-lg">
                <h3 class="text-lg font-semibold text-blue-900 mb-2">
                  🗺️ Roadmap de Aprendizado
                </h3>
                <p class="text-blue-700">
                  Explore nosso skill tree interativo e desbloqueie novos conhecimentos.
                </p>
              </div>
              
              <div class="bg-green-50 p-6 rounded-lg">
                <h3 class="text-lg font-semibold text-green-900 mb-2">
                  🃏 Flashcards Inteligentes
                </h3>
                <p class="text-green-700">
                  Sistema de repetição espaçada para fixar o aprendizado.
                </p>
              </div>
              
              <div class="bg-purple-50 p-6 rounded-lg">
                <h3 class="text-lg font-semibold text-purple-900 mb-2">
                  💻 Execução de Código
                </h3>
                <p class="text-purple-700">
                  Pratique programação diretamente na plataforma.
                </p>
              </div>
            </div>
            
            <div class="mt-8">
              <BaseButton
                variant="primary"
                size="lg"
                @click="handleStartLearning"
              >
                Começar Aprendizado
              </BaseButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

useSeoMeta({
  title: 'Dashboard - Developer Learning Platform',
  description: 'Seu painel de controle para acompanhar o progresso de aprendizado.',
  robots: 'noindex' // Private page
})

const { getCurrentUser } = useAuth()
const user = ref(null)

const handleStartLearning = () => {
  // Navigate to roadmap or first lesson
  navigateTo('/roadmap')
}

onMounted(async () => {
  user.value = await getCurrentUser()
})
</script>