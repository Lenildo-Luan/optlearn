<template>
  <div class="min-h-screen bg-gray-50">
    <nav class="bg-white shadow-sm border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex items-center">
            <NuxtLink to="/" class="text-xl font-bold text-gray-900">
              DevLearn Platform
            </NuxtLink>
          </div>
          
          <div class="flex items-center space-x-4">
            <template v-if="user">
              <span class="text-sm text-gray-700">
                Olá, {{ user.email }}
              </span>
              <BaseButton
                variant="outline"
                size="sm"
                @click="handleSignOut"
              >
                Sair
              </BaseButton>
            </template>
            <template v-else>
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
  </div>
</template>

<script setup lang="ts">
const { getCurrentUser } = useAuth()
const { $supabase } = useNuxtApp()
const router = useRouter()

const user = ref(null)

const handleSignOut = async () => {
  await $supabase.auth.signOut()
  user.value = null
  await router.push('/')
}

onMounted(async () => {
  user.value = await getCurrentUser()
  
  // Listen for auth state changes
  $supabase.auth.onAuthStateChange((event, session) => {
    user.value = session?.user || null
  })
})
</script>