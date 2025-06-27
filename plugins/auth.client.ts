import { useUser } from "~/composables/useUser"

// plugins/auth.client.ts
export default defineNuxtPlugin(async () => {
  const { initializeUser } = useUser()
  
  // Inicializa o estado do usuário apenas no cliente
  if (process.client) {
    await initializeUser()
  }
})