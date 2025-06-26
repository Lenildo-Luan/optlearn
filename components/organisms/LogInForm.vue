<template>
  <div class="max-w-md mx-auto">
    <div class="bg-white py-8 px-6 shadow rounded-lg sm:px-10">
      <div class="mb-6 text-center">
        <h2 class="text-3xl font-bold text-gray-900">
          Entrar na conta
        </h2>
        <p class="mt-2 text-sm text-gray-600">
          Continue sua jornada de aprendizado
        </p>
      </div>

      <!-- OAuth Buttons -->
      <OAuthButtons
        :loading="loading"
        @google-signin="handleGoogleSignIn"
        @github-signin="handleGithubSignIn"
      />

      <div class="mt-6">
        <div class="relative">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-gray-300" />
          </div>
          <div class="relative flex justify-center text-sm">
            <span class="px-2 bg-white text-gray-500">Ou continue com</span>
          </div>
        </div>
      </div>

      <!-- Email/Password Form -->
      <form class="mt-6 space-y-4" @submit.prevent="handleSubmit">
        <FormField
          field-id="email"
          label="Email"
          type="email"
          placeholder="seu@email.com"
          :model-value="formData.email"
          :error="errors.email"
          :disabled="loading"
          required
          @update:model-value="updateField('email', $event)"
          @blur="validateField('email')"
        />

        <FormField
          field-id="password"
          label="Senha"
          type="password"
          placeholder="Sua senha"
          :model-value="formData.password"
          :error="errors.password"
          :disabled="loading"
          required
          @update:model-value="updateField('password', $event)"
          @blur="validateField('password')"
        />

        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              v-model="formData.rememberMe"
              :disabled="loading"
              class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label for="remember-me" class="ml-2 block text-sm text-gray-900">
              Lembrar de mim
            </label>
          </div>

          <div class="text-sm">
            <NuxtLink
              to="/forgot-password"
              class="font-medium text-blue-600 hover:text-blue-500"
            >
              Esqueceu a senha?
            </NuxtLink>
          </div>
        </div>

        <BaseButton
          type="submit"
          variant="primary"
          size="lg"
          full-width
          :loading="loading"
          :disabled="!isFormValid"
        >
          Entrar
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
          Não tem uma conta?
          <NuxtLink
            to="/signup"
            class="font-medium text-blue-600 hover:text-blue-500"
          >
            Criar conta
          </NuxtLink>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SignInData, ValidationErrors } from '~/types/auth'

interface AlertMessage {
  show: boolean
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
}

const { signIn, signInWithOAuth, loading } = useAuth()
const router = useRouter()
const route = useRoute()

const formData = reactive<SignInData>({
  email: '',
  password: '',
  rememberMe: false
})

const errors = reactive<ValidationErrors>({})

const alertMessage = reactive<AlertMessage>({
  show: false,
  type: 'info',
  title: ''
})

const isFormValid = computed(() => {
  return formData.email &&
         formData.password &&
         !errors.email &&
         !errors.password
})

// Check for error messages from URL params
onMounted(() => {
  const errorParam = route.query.error
  if (errorParam === 'auth_callback_failed') {
    showAlert('error', 'Erro na autenticação', 'Ocorreu um problema durante o login. Tente novamente.')
  } else if (errorParam === 'unexpected') {
    showAlert('error', 'Erro inesperado', 'Algo deu errado. Tente fazer login novamente.')
  }
})

const updateField = (field: keyof SignInData, value: string | boolean) => {
  formData[field] = value as never
  // Only clear error if the field is in errors
  if (field === 'email' || field === 'password') {
    if (errors[field]) {
      errors[field] = undefined
    }
  }
}

const validateField = (field: 'email' | 'password') => {
  switch (field) {
    case 'email':
      if (!formData.email) {
        errors.email = 'Email é obrigatório'
      } else if (!isValidEmail(formData.email)) {
        errors.email = 'Digite um email válido'
      } else {
        errors.email = undefined
      }
      break

    case 'password':
      if (!formData.password) {
        errors.password = 'Senha é obrigatória'
      } else {
        errors.password = undefined
      }
      break
  }
}

const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

const validateForm = (): boolean => {
  validateField('email')
  validateField('password')
  
  return !errors.email && !errors.password
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
  if (!validateForm()) {
    return
  }

  const response = await signIn(formData)
  
  if (response.success) {
    showAlert('success', 'Login realizado!', 'Redirecionando...')
    
    // Redirect after successful login
    setTimeout(() => {
      const redirectTo = route.query.redirect as string || '/dashboard'
      router.push(redirectTo)
    }, 1500)
  } else {
    let errorTitle = 'Erro no login'
    let errorMessage = response.message
    
    // Handle specific Supabase errors
    if (response.error?.includes('Invalid login credentials')) {
      errorTitle = 'Credenciais inválidas'
      errorMessage = 'Email ou senha incorretos. Verifique seus dados e tente novamente.'
    } else if (response.error?.includes('Email not confirmed')) {
      errorTitle = 'Email não confirmado'
      errorMessage = 'Verifique sua caixa de entrada e confirme seu email antes de fazer login.'
    } else if (response.error?.includes('Too many requests')) {
      errorTitle = 'Muitas tentativas'
      errorMessage = 'Aguarde alguns minutos antes de tentar novamente.'
    }
    
    showAlert('error', errorTitle, errorMessage)
  }
}

const handleGoogleSignIn = async () => {
  const response = await signInWithOAuth('google')
  
  if (!response.success) {
    showAlert('error', 'Erro no login', response.message)
  }
}

const handleGithubSignIn = async () => {
  const response = await signInWithOAuth('github')
  
  if (!response.success) {
    showAlert('error', 'Erro no login', response.message)
  }
}
</script>