import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getMockSupabaseClient } from './mock-client'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const isPlaceholder = !supabaseUrl || supabaseUrl.includes('placeholder') || supabaseUrl.includes('dummy')

  if (isPlaceholder) {
    return getMockSupabaseClient(false) as any
  }

  const cookieStore = cookies()
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy-key'

  return createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: any[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Ignore
          }
        },
      },
    }
  )
}
