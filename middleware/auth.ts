export default defineNuxtRouteMiddleware((to, from) => {
  const { $supabase } = useNuxtApp()
  
  return new Promise(async (resolve) => {
    const { data: { session } } = await $supabase.auth.getSession()
    
    if (!session) {
      // Store the intended destination for redirect after login
      const redirectPath = to.fullPath !== '/signin' ? to.fullPath : '/dashboard'
      return navigateTo(`/signin?redirect=${encodeURIComponent(redirectPath)}`)
    }
    
    resolve()
  })
})