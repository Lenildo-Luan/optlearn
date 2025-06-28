/**
 * Enhanced auth middleware for routes that require guaranteed authentication
 * Use this for sensitive routes like dashboard, profile, etc.
 */
export default defineNuxtRouteMiddleware(async (to, from) => {
  const { $supabase } = useNuxtApp()
  
  try {
    // Double-check session validity for protected routes
    const { data: { session }, error } = await $supabase.auth.getSession()
    
    if (error) {
      console.error('Auth middleware error:', error)
      return navigateTo('/signin?reason=auth_error')
    }
    
    if (!session) {
      return navigateTo('/signin?reason=not_authenticated')
    }
    
    // Verify the session is still valid with the server
    const { data: { user }, error: userError } = await $supabase.auth.getUser()
    
    if (userError || !user) {
      console.error('User verification failed:', userError)
      await $supabase.auth.signOut()
      return navigateTo('/signin?reason=user_verification_failed')
    }
    
    // Check if user email is confirmed (optional, based on your requirements)
    if (!user.email_confirmed_at) {
      return navigateTo('/auth/verify-email?email=' + encodeURIComponent(user.email || ''))
    }
    
    // Session is valid, user can proceed
    console.log('Auth middleware: User authenticated successfully')
    
  } catch (error) {
    console.error('Unexpected error in auth middleware:', error)
    return navigateTo('/signin?reason=unexpected_error')
  }
})