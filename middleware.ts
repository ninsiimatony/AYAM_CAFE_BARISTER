import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// Routes that require at minimum a Pro subscription
const PRO_ROUTES   = ['/dashboard/telegram', '/dashboard/analytics']
// Routes that require an Elite subscription
const ELITE_ROUTES = ['/dashboard/mt5']

export async function middleware(request: NextRequest) {
  const response = await updateSession(request)
  const { pathname } = request.nextUrl

  // Skip subscription enforcement if Supabase is not configured
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  if (!supabaseUrl || supabaseUrl === 'https://placeholder.supabase.co') {
    return response
  }

  // Only enforce on guarded routes
  const needsPro   = PRO_ROUTES.some((r) => pathname.startsWith(r))
  const needsElite = ELITE_ROUTES.some((r) => pathname.startsWith(r))
  if (!needsPro && !needsElite) return response

  // Read tier from the session cookie (set by the auth callback / server)
  // We do a lightweight Supabase call here; use the existing refreshed response cookies
  try {
    const { createServerClient } = await import('@supabase/ssr')
    const supabase = createServerClient(
      supabaseUrl,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll: () => {},
        },
      },
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', user.id)
      .single()

    const tier = profile?.subscription_tier ?? 'free'
    const tierRank = { free: 0, pro: 1, elite: 2 } as const

    if (needsElite && tierRank[tier as keyof typeof tierRank] < 3) {
      return NextResponse.redirect(new URL('/pricing?upgrade=elite', request.url))
    }
    if (needsPro && tierRank[tier as keyof typeof tierRank] < 1) {
      return NextResponse.redirect(new URL('/pricing?upgrade=pro', request.url))
    }
  } catch {
    // If any error occurs, let the page handle it gracefully
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
