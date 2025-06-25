export default defineNuxtRouteMiddleware((to, from) => {
  const { $supabase } = useNuxtApp()
  
  return new Promise(async (resolve) => {
    const { data: { session } } = await $supabase.auth.getSession()
    
    if (!session) {
      return navigateTo('/signin')
    }
    
    resolve()
  })
})