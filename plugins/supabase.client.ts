// plugins/supabase.client.ts
import { createClient } from '@supabase/supabase-js'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  
  const supabase = createClient(
    config.public.supabaseUrl,
    config.public.supabaseAnonKey,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
        storage: {
          getItem: (key) => {
            if (typeof window !== 'undefined') {
              return window.localStorage.getItem(key)
            }
            return null
          },
          setItem: (key, value) => {
            if (typeof window !== 'undefined') {
              window.localStorage.setItem(key, value)
            }
          },
          removeItem: (key) => {
            if (typeof window !== 'undefined') {
              window.localStorage.removeItem(key)
            }
          }
        }
      },
      global: {
        headers: {
          'X-Client-Info': 'nuxt-supabase-client'
        }
      }
    }
  )

  // Configuração de logs de debug para Supabase (apenas em desenvolvimento)
  if (import.meta.dev) {
    const wrap = (fn: any, name: string) => async (...args: any[]) => {
      console.log(`[Supabase] Chamando ${name} com argumentos:`, args)
      const result = await fn(...args)
      if (result?.error) {
        console.error(`[Supabase] Erro em ${name}:`, result.error)
      }
      return result
    }

    // Exemplo: Wrapping o método auth.signInWithPassword
    supabase.auth.signInWithPassword = wrap(supabase.auth.signInWithPassword, 'auth.signInWithPassword')
    // Adicione outros métodos que você deseja logar aqui, seguindo o mesmo padrão
  }

  return {
    provide: {
      supabase
    }
  }
})