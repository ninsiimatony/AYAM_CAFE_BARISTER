import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

const PRO_ROUTES   = ['/dashboard/telegram', '/dashboard/analytics']
const ELITE_ROUTES = ['/dashboard/mt5']

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL  ?? ''
const supabaseKey  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
const isConfigured = supabaseUrl.startsWith('https://') && supabaseKey.length > 0

export async function middleware(request: NextRequest) {
  // If Supabase isn't configured, pass all requests straight through
  if (!isConfigured) return NextResponse.next()

  let supabaseResponse = NextResponse.next({ request })

  try {
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    })

    // Refresh the session — must be called before any route checks
    await supabase.auth.getUser()

    const { pathname } = request.nextUrl
    const needsPro   = PRO_ROUTES.some((r) => pathname.startsWith(r))
    const needsElite = ELITE_ROUTES.some((r) => pathname.startsWith(r))

    if (needsPro || needsElite) {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return NextResponse.redirect(new URL('/login', request.url))
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_tier')
        .eq('id', user.id)
        .single()

      const tier = (profile?.subscription_tier ?? 'free') as string
      const rank = ({ free: 0, pro: 1, elite: 2 } as Record<string, number>)[tier] ?? 0

      if (needsElite && rank < 2) {
        return NextResponse.redirect(new URL('/pricing?upgrade=elite', request.url))
      }
      if (needsPro && rank < 1) {
        return NextResponse.redirect(new URL('/pricing?upgrade=pro', request.url))
      }
    }
  } catch {
    // Middleware fails open — let the page itself handle auth errors
    return NextResponse.next()
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
