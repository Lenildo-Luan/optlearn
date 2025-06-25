<template>
  <div class="max-w-md mx-auto">
    <div class="bg-white py-8 px-6 shadow rounded-lg sm:px-10">
      <div class="mb-6 text-center">
        <h2 class="text-3xl font-bold text-gray-900">
          Criar conta
        </h2>
        <p class="mt-2 text-sm text-gray-600">
          Comece sua jornada de aprendizado
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
          placeholder="Senha segura"
          :model-value="formData.password"
          :error="errors.password"
          :disabled="loading"
          hint="Mínimo 8 caracteres"
          required
          @update:model-value="updateField('password', $event)"
          @blur="validateField('password')"
        />

        <FormField
          field-id="confirmPassword"
          label="Confirmar senha"
          type="password"
          placeholder="Confirme sua senha"
          :model-value="formData.confirmPassword"
          :error="errors.confirmPassword"
          :disabled="loading"
          required
          @update:model-value="updateField('confirmPassword', $event)"
          @blur="validateField('confirmPassword')"
        />

        <BaseButton
          type="submit"
          variant="primary"
          size="lg"
          full-width
          :loading="loading"
          :disabled="!isFormValid"
        >
          Criar conta
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
          Já tem uma conta?
          <NuxtLink
            to="/signin"
            class="font-medium text-blue-600 hover:text-blue-500"
          >
            Fazer login
          </NuxtLink>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SignUpData, ValidationErrors } from '~/types/auth'

interface AlertMessage {
  show: boolean
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
}

const { signUp, signInWithOAuth, loading } = useAuth()
const router = useRouter()

const formData = reactive<SignUpData>({
  email: '',
  password: '',
  confirmPassword: ''
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
         formData.confirmPassword &&
         !errors.email &&
         !errors.password &&
         !errors.confirmPassword
})

const updateField = (field: keyof SignUpData, value: string) => {
  formData[field] = value
  // Clear error when user starts typing
  if (errors[field]) {
    errors[field] = undefined
  }
}

const validateField = (field: keyof ValidationErrors) => {
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
      } else if (!isStrongPassword(formData.password)) {
        errors.password = 'Senha deve ter pelo menos 8 caracteres, incluindo maiúscula, minúscula e número'
      } else {
        errors.password = undefined
      }
      break
    
    case 'confirmPassword':
      if (!formData.confirmPassword) {
        errors.confirmPassword = 'Confirmação de senha é obrigatória'
      } else if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Senhas não coincidem'
      } else {
        errors.confirmPassword = undefined
      }
      break
  }
}

const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

const isStrongPassword = (password: string): boolean => {
  const minLength = password.length >= 8
  const hasUpper = /[A-Z]/.test(password)
  const hasLower = /[a-z]/.test(password)
  const hasNumber = /\d/.test(password)
  
  return minLength && hasUpper && hasLower && hasNumber
}

const validateForm = (): boolean => {
  validateField('email')
  validateField('password')
  validateField('confirmPassword')
  
  return !errors.email && !errors.password && !errors.confirmPassword
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

  const response = await signUp(formData)
  
  if (response.success) {
    showAlert('success', response.message)
    
    // Redirect after successful signup
    setTimeout(() => {
      router.push('/dashboard')
    }, 2000)
  } else {
    let errorTitle = 'Erro ao criar conta'
    let errorMessage = response.message
    
    // Handle specific Supabase errors
    if (response.error?.includes('User already registered')) {
      errorTitle = 'Email já cadastrado'
      errorMessage = 'Este email já está sendo usado. Tente fazer login ou use outro email.'
    } else if (response.error?.includes('Password should be at least')) {
      errorTitle = 'Senha muito fraca'
      errorMessage = 'A senha deve ter pelo menos 6 caracteres.'
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