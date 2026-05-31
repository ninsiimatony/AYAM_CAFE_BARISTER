import { type NextRequest, NextResponse } from 'next/server'

// Middleware is intentionally kept minimal — no Supabase calls.
// @supabase/ssr is not reliable in Vercel's Edge Runtime.
// Auth enforcement is handled by server components in app/dashboard/layout.tsx.
export function middleware(_request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
