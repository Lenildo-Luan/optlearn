<template>
  <div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
    <SignUpForm />
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'auth',
  auth: false // This page doesn't require authentication
})

// SEO Meta
useSeoMeta({
  title: 'Criar Conta - Developer Learning Platform',
  description: 'Crie sua conta e comece sua jornada de aprendizado em desenvolvimento. Cadastre-se com email ou usando Google/GitHub.',
  ogTitle: 'Criar Conta - Developer Learning Platform',
  ogDescription: 'Crie sua conta e comece sua jornada de aprendizado em desenvolvimento.',
  twitterCard: 'summary'
})

// Redirect if already authenticated
const { getCurrentUser } = useAuth()

onMounted(async () => {
  const user = await getCurrentUser()
  if (user) {
    await navigateTo('/dashboard')
  }
})
</script>