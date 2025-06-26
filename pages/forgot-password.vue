<template>
  <div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
    <div class="max-w-md mx-auto">
      <div class="bg-white py-8 px-6 shadow rounded-lg sm:px-10">
        <div class="mb-6 text-center">
          <h2 class="text-3xl font-bold text-gray-900">
            Recuperar senha
          </h2>
          <p class="mt-2 text-sm text-gray-600">
            Digite seu email para receber instruções de recuperação
          </p>
        </div>

        <form class="space-y-4" @submit.prevent="handleSubmit">
          <FormField
            field-id="email"
            label="Email"
            type="email"
            placeholder="seu@email.com"
            :model-value="email"
            :error="emailError"
            :disabled="loading"
            required
            @update:model-value="updateEmail"
            @blur="validateEmail"
          />

          <BaseButton
            type="submit"
            variant="primary"
            size="lg"
            full-width
            :loading="loading"
            :disabled="!isFormValid"
          >
            Enviar instruções
          </BaseButton>
        </form>

        <!-- Alert Messages -->
        <BaseAlert
          v-if="alertMessage.show"
          :type="alertMessage.type"
          :title="alertMessage.title"
          :message="alertMessage.message"
          :show="alertMessage.show"
          dismissible
          @dismiss="clearAlert"
        />

        <div class="mt-6 text-center">
          <p class="text-sm text-gray-600">
            Lembrou da senha?
            <NuxtLink
              to="/signin"
              class="font-medium text-blue-600 hover:text-blue-500"
            >
              Voltar ao login
            </NuxtLink>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'auth',
  middleware: 'guest'
})

// SEO Meta
useSeoMeta({
  title: 'Recuperar Senha - Developer Learning Platform',
  description: 'Esqueceu sua senha? Digite seu email para receber instruções de recuperação de senha.',
  robots: 'noindex' // Don't index password recovery pages
})

interface AlertMessage {
  show: boolean
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
}

const { $supabase } = useNuxtApp()

const email = ref('')
const emailError = ref('')
const loading = ref(false)

const alertMessage = reactive<AlertMessage>({
  show: false,
  type: 'info',
  title: ''
})

const isFormValid = computed(() => {
  return email.value && !emailError.value
})

const updateEmail = (value: string) => {
  email.value = value
  if (emailError.value) {
    emailError.value = ''
  }
}

const validateEmail = () => {
  if (!email.value) {
    emailError.value = 'Email é obrigatório'
  } else if (!isValidEmail(email.value)) {
    emailError.value = 'Digite um email válido'
  } else {
    emailError.value = ''
  }
}

const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

const showAlert = (type: AlertMessage['type'], title: string, message?: string) => {
  alertMessage.show = true
  alertMessage.type = type
  alertMessage.title = title
  alertMessage.message = message
}

const clearAlert = () => {
  alertMessage.show = false
}

const handleSubmit = async () => {
  validateEmail()
  
  if (!isFormValid.value) {
    return
  }

  loading.value = true

  try {
    const { error } = await $supabase.auth.resetPasswordForEmail(email.value, {
      redirectTo: `${window.location.origin}/auth/reset-password`
    })

    if (error) {
      let errorTitle = 'Erro ao enviar email'
      let errorMessage = 'Não foi possível enviar as instruções de recuperação.'
      
      if (error.message.includes('User not found')) {
        errorTitle = 'Email não encontrado'
        errorMessage = 'Não encontramos uma conta com este email. Verifique o endereço digitado.'
      } else if (error.message.includes('rate limit')) {
        errorTitle = 'Muitas tentativas'
        errorMessage = 'Aguarde alguns minutos antes de tentar novamente.'
      }
      
      showAlert('error', errorTitle, errorMessage)
    } else {
      showAlert(
        'success',
        'Email enviado!',
        'Verifique sua caixa de entrada para instruções de recuperação de senha.'
      )
      
      // Clear form after successful submission
      email.value = ''
    }
  } catch (error: any) {
    showAlert('error', 'Erro inesperado', 'Algo deu errado. Tente novamente.')
  } finally {
    loading.value = false
  }
}
</script>