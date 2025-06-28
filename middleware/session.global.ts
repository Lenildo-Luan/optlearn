export default defineNuxtRouteMiddleware(async (to, from) => {
  // Skip session check for auth-related routes and public routes
  const publicRoutes = ['/signin', '/signup', '/auth/callback', '/']
  const isPublicRoute = publicRoutes.includes(to.path)
  
  // Skip if navigating to a public route
  if (isPublicRoute) {
    return
  }

  const { $supabase } = useNuxtApp()
  
  try {
    // Get current session
    const { data: { session }, error: sessionError } = await $supabase.auth.getSession()
    
    if (sessionError) {
      console.error('Session error:', sessionError)
      await clearSessionAndRedirect()
      return
    }

    // No session found - redirect to login
    if (!session) {
      await clearSessionAndRedirect()
      return
    }

    // Check if session is expired or about to expire (5 minutes buffer)
    const now = Math.floor(Date.now() / 1000)
    const expiresAt = session.expires_at || 0
    const bufferTime = 5 * 60 // 5 minutes in seconds
    
    if (expiresAt <= now) {
      // Session is expired, try to refresh
      console.log('Session expired, attempting refresh...')
      await handleSessionRefresh()
      return
    }
    
    if (expiresAt <= (now + bufferTime)) {
      // Session expires soon, proactively refresh
      console.log('Session expires soon, proactively refreshing...')
      await handleSessionRefresh()
    }

  } catch (error) {
    console.error('Unexpected error in session middleware:', error)
    await clearSessionAndRedirect()
  }
})

/**
 * Handles session refresh attempt
 */
async function handleSessionRefresh() {
  const { $supabase } = useNuxtApp()
  
  try {
    const { data: { session }, error } = await $supabase.auth.refreshSession()
    
    if (error || !session) {
      console.error('Failed to refresh session:', error)
      await clearSessionAndRedirect()
      return
    }
    
    console.log('Session refreshed successfully')
    
    // Emit session refresh event for other components to react
    if (process.client) {
      window.dispatchEvent(new CustomEvent('session-refreshed', {
        detail: { session }
      }))
    }
    
  } catch (error) {
    console.error('Error refreshing session:', error)
    await clearSessionAndRedirect()
  }
}

/**
 * Clears session data and redirects to login
 */
async function clearSessionAndRedirect() {
  const { $supabase } = useNuxtApp()
  
  try {
    // Sign out from Supabase
    await $supabase.auth.signOut()
    
    // Clear any client-side storage if needed
    if (process.client) {
      // Emit session expired event
      window.dispatchEvent(new CustomEvent('session-expired'))
      
      // Clear any cached data
      localStorage.removeItem('user-preferences')
      sessionStorage.clear()
    }
    
  } catch (error) {
    console.error('Error during logout:', error)
  }
  
  // Redirect to signin page
  return navigateTo('/signin?reason=session_expired')
}