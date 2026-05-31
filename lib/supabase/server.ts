import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Safe fallbacks that pass @supabase/ssr format validation but make no real API calls.
// Auth calls with these will return { user: null } which triggers redirect('/login').
const FALLBACK_URL = 'https://placeholder.supabase.co'
const FALLBACK_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwIn0.placeholder'

export async function createClient() {
  const cookieStore = await cookies()

  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

  // Trim whitespace that can sneak in via Vercel env var editor
  const url = rawUrl.trim()
  const key = rawKey.trim()

  // Only use real credentials if they look valid — avoids @supabase/ssr throwing
  const safeUrl = url.startsWith('https://') ? url : FALLBACK_URL
  const safeKey = key.startsWith('eyJ')      ? key : FALLBACK_KEY

  return createServerClient(safeUrl, safeKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // Called from a Server Component render — cookies can't be mutated here.
        }
      },
    },
  })
}
