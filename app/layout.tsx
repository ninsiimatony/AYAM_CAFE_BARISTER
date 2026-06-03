import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { ThemeProvider } from '@/contexts/ThemeContext'

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-inter',
})

export const viewport: Viewport = {
  themeColor: '#0a0f1e',
  colorScheme: 'dark',
}

export const metadata: Metadata = {
  title: {
    template: '%s — TONY ELITE AI',
    default: 'TONY ELITE AI — Institutional Forex Platform',
  },
  description: 'AI-powered Smart Money Concepts signals, risk management, and MT5 auto-execution for serious traders.',
  keywords: ['forex', 'trading', 'SMC', 'signals', 'gold', 'XAUUSD', 'institutional'],
  applicationName: 'TONY ELITE AI',
  authors: [{ name: 'Tony Elite AI' }],
  openGraph: {
    title: 'TONY ELITE AI — Institutional Forex Platform',
    description: 'AI-powered SMC signals, risk management, and MT5 auto-execution.',
    siteName: 'TONY ELITE AI',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <body className={inter.className}>
        <ThemeProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
