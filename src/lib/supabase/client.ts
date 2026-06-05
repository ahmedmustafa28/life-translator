import { createBrowserClient } from '@supabase/ssr'
import { getMockSupabaseClient } from './mock-client'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const isPlaceholder = !supabaseUrl || supabaseUrl.includes('placeholder') || supabaseUrl.includes('dummy')

  if (isPlaceholder) {
    return getMockSupabaseClient(true) as any
  }

  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy-key'
  
  return createBrowserClient(
    supabaseUrl,
    supabaseKey
  )
}
