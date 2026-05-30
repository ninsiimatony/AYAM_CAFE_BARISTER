import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Welcome — Ayam Café Barister',
}

const features = [
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
    title: 'Order Management',
    desc: 'Track every order from brew to delivery with real-time updates.',
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    title: 'Staff Management',
    desc: 'Schedule shifts, track performance, and manage your barista team.',
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    title: 'Analytics & Reports',
    desc: 'Insightful dashboards to track sales, trends, and performance.',
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
    title: 'Role-Based Access',
    desc: 'Granular permissions for admins, staff, and customers.',
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-cream-100">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-coffee-100/60 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-coffee-gradient shadow-coffee">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-cream-100" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2 21v-2h2V7c0-.55.196-1.021.588-1.413A1.925 1.925 0 0 1 6 5h12c.55 0 1.021.196 1.413.587C19.804 5.98 20 6.45 20 7v2h2v4h-2v6h2v2H2Zm4-2h10v-6H6v6Zm0-8h10V7H6v4Zm12 2h1v-2h-1v2Z"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-coffee-900 leading-none">Ayam Café</p>
              <p className="text-xs text-coffee-400 leading-none mt-0.5">Barister</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden sm:inline-flex items-center rounded-xl px-4 py-2 text-sm font-medium text-coffee-700 hover:bg-coffee-50 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center rounded-xl bg-coffee-gradient px-4 py-2 text-sm font-semibold text-white shadow-coffee hover:shadow-coffee-lg hover:brightness-110 transition-all"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-coffee-gradient">
        <div className="absolute inset-0 bg-hero-pattern opacity-20" />
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-caramel-400/20 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-coffee-700/30 blur-3xl" />

        <div className="relative mx-auto max-w-6xl px-4 py-24 sm:px-6 sm:py-32 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-cream-200 mb-8 border border-white/20">
            <span className="h-2 w-2 rounded-full bg-caramel-300 animate-pulse" />
            Now serving your café management needs
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
            Your Perfect Cup,
            <br />
            <span className="text-caramel-300">Every Time</span>
          </h1>

          <p className="mx-auto max-w-2xl text-lg text-cream-300 mb-10 leading-relaxed">
            A complete café management platform for baristas, staff, and owners.
            Manage orders, track performance, and delight your customers — all in one place.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-8 py-4 text-base font-semibold text-coffee-800 shadow-lg hover:bg-cream-50 hover:shadow-xl transition-all active:scale-[0.98]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
              </svg>
              Create Free Account
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-white/30 px-8 py-4 text-base font-semibold text-white hover:bg-white/10 transition-all active:scale-[0.98]"
            >
              Sign In
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto">
            {[
              { value: '3', label: 'User Roles' },
              { value: '5+', label: 'Dashboard Pages' },
              { value: '∞', label: 'Possibilities' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl font-bold text-white">{stat.value}</p>
                <p className="text-sm text-cream-300 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-coffee-900 mb-4">
            Everything You Need
          </h2>
          <p className="text-coffee-500 max-w-xl mx-auto">
            Powerful tools designed specifically for café management, from the first bean to the last sip.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-2xl bg-white border border-coffee-100 p-6 shadow-sm hover:shadow-coffee hover:-translate-y-1 transition-all duration-300"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-coffee-50 text-coffee-600 group-hover:bg-coffee-gradient group-hover:text-white transition-all duration-300 mb-4">
                {feature.icon}
              </div>
              <h3 className="font-semibold text-coffee-900 mb-2">{feature.title}</h3>
              <p className="text-sm text-coffee-500 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-cream-200 border-y border-coffee-100">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-coffee-900 mb-4">
            Ready to Brew Something Great?
          </h2>
          <p className="text-coffee-500 mb-8 max-w-xl mx-auto">
            Join the growing community of café owners and baristas using our platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-2xl bg-coffee-gradient px-8 py-3.5 text-sm font-semibold text-white shadow-coffee hover:shadow-coffee-lg hover:brightness-110 transition-all"
            >
              Start for Free
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-2xl border-2 border-coffee-300 px-8 py-3.5 text-sm font-semibold text-coffee-700 hover:bg-coffee-50 transition-all"
            >
              Sign In to Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-coffee-900 text-cream-300">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-coffee-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-cream-100" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M2 21v-2h2V7c0-.55.196-1.021.588-1.413A1.925 1.925 0 0 1 6 5h12c.55 0 1.021.196 1.413.587C19.804 5.98 20 6.45 20 7v2h2v4h-2v6h2v2H2Zm4-2h10v-6H6v6Zm0-8h10V7H6v4Zm12 2h1v-2h-1v2Z"/>
                </svg>
              </div>
              <span className="text-sm text-cream-400">Ayam Café Barister © 2024</span>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <Link href="/login" className="text-cream-400 hover:text-cream-200 transition-colors">Sign In</Link>
              <Link href="/signup" className="text-cream-400 hover:text-cream-200 transition-colors">Sign Up</Link>
              <Link href="/forgot-password" className="text-cream-400 hover:text-cream-200 transition-colors">Reset Password</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
