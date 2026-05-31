import { createBrowserClient } from '@supabase/ssr'

const FALLBACK_URL = 'https://placeholder.supabase.co'
const FALLBACK_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwIn0.placeholder'

export function createClient() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim()
  const key = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '').trim()
  return createBrowserClient(
    url.startsWith('https://') ? url : FALLBACK_URL,
    key.startsWith('eyJ')      ? key : FALLBACK_KEY,
  )
}
