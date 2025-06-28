export default defineNuxtRouteMiddleware(async (to, from) => {
  // Only run on client side to avoid hydration issues
  if (process.server) return

  try {
    const { $supabase } = useNuxtApp()
    
    // Get current session
    const { data: { session }, error } = await $supabase.auth.getSession()
    
    if (error) {
      console.warn('Error checking session in guest middleware:', error.message)
      // If there's an error getting session, allow access (fail open)
      return
    }
    
    // If user is authenticated, redirect to dashboard
    if (session?.user) {
      console.log('User is authenticated, redirecting from guest page to dashboard')
      return navigateTo('/dashboard', { replace: true })
    }
    
    // User is not authenticated, allow access to guest pages
    return
    
  } catch (error) {
    console.error('Unexpected error in guest middleware:', error)
    // On unexpected error, allow access (fail open)
    return
  }
})