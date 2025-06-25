<template>
  <div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
    <div class="sm:mx-auto sm:w-full sm:max-w-md">
      <div class="bg-white py-8 px-6 shadow rounded-lg sm:px-10 text-center">
        <div class="animate-spin inline-block w-8 h-8 border-4 border-blue-500 border-r-transparent rounded-full mb-4"></div>
        <h2 class="text-xl font-semibold text-gray-900 mb-2">
          Processando autenticação...
        </h2>
        <p class="text-gray-600">
          Aguarde enquanto confirmamos sua conta.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'auth'
})

const { $supabase } = useNuxtApp()
const router = useRouter()

onMounted(async () => {
  try {
    // Handle the auth callback
    const { data, error } = await $supabase.auth.getSession()
    
    if (error) {
      console.error('Auth callback error:', error)
      await router.push('/signup?error=auth_callback_failed')
      return
    }

    if (data.session) {
      // Successfully authenticated
      await router.push('/dashboard')
    } else {
      // No session found, redirect to signup
      await router.push('/signup')
    }
  } catch (error) {
    console.error('Unexpected error in auth callback:', error)
    await router.push('/signup?error=unexpected')
  }
})
</script>