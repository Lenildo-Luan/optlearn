<template>
  <div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
    <SignInForm />
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'auth',
  middleware: 'guest' // Redirect if already authenticated
})

// SEO Meta
useSeoMeta({
  title: 'Entrar - Developer Learning Platform',
  description: 'Faça login na sua conta e continue sua jornada de aprendizado em desenvolvimento. Entre com email/senha ou usando Google/GitHub.',
  ogTitle: 'Entrar - Developer Learning Platform',
  ogDescription: 'Faça login na sua conta e continue sua jornada de aprendizado em desenvolvimento.',
  twitterCard: 'summary'
})

// Handle redirect if already authenticated
const { getCurrentUser } = useAuth()

onMounted(async () => {
  const user = await getCurrentUser()
  if (user) {
    await navigateTo('/dashboard')
  }
})
</script>