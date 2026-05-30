# ☕ Ayam Café Barister

A complete café management system built with **Next.js 14**, **Supabase Auth**, and **Tailwind CSS**. Features a beautiful cafe-themed UI with role-based access control, real-time order tracking, and staff management.

## Features

- **Authentication** — Email/password + Google OAuth, email verification, password reset
- **Role-Based Access** — Three roles: `admin`, `staff`, `customer` with route guards
- **Protected Dashboard** — Role-aware sidebar, overview stats, recent orders
- **Admin Panel** — User management, system info (admin only)
- **Staff Management** — Team view, shift overview (admin + staff)
- **Order Management** — Live order tracking with status filters (all roles)
- **Profile Page** — Update name, change password, account details
- **Beautiful UI** — Warm cafe-themed palette, smooth animations, responsive design

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Auth | Supabase Auth (`@supabase/ssr`) |
| Database | Supabase PostgreSQL |
| Styling | Tailwind CSS |
| Deployment | Vercel / any Node.js host |

## Getting Started

### 1. Clone the repository

```bash
git clone <repo-url>
cd AYAM_CAFE_BARISTER
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **Settings → API** and copy:
   - Project URL
   - `anon` public key

### 4. Configure environment variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 5. Run the database migration

In your Supabase project → **SQL Editor**, paste and run:

```
supabase/migrations/001_profiles.sql
```

This creates:
- `profiles` table with `id`, `email`, `full_name`, `avatar_url`, `role`, timestamps
- Row Level Security policies
- Trigger to auto-create profile on signup

### 6. Configure Supabase Auth settings

In **Authentication → URL Configuration**:
- **Site URL**: `http://localhost:3000`
- **Redirect URLs**: `http://localhost:3000/**`

For Google OAuth (optional):
1. Create OAuth credentials in Google Cloud Console
2. Add them in Supabase → **Authentication → Providers → Google**

### 7. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
├── app/
│   ├── page.tsx                    # Landing page
│   ├── login/page.tsx              # Login form
│   ├── signup/page.tsx             # Registration with role picker
│   ├── forgot-password/page.tsx    # Password reset request
│   ├── reset-password/page.tsx     # New password form
│   ├── auth/callback/route.ts      # OAuth callback handler
│   └── dashboard/
│       ├── layout.tsx              # Protected layout (Navbar + Sidebar)
│       ├── page.tsx                # Overview dashboard
│       ├── admin/page.tsx          # Admin panel (admin only)
│       ├── staff/page.tsx          # Staff management (admin + staff)
│       ├── orders/page.tsx         # Order tracking (all roles)
│       └── profile/page.tsx        # User profile
├── components/
│   ├── auth/AuthInput.tsx          # Reusable form input
│   ├── auth/AuthButton.tsx         # Reusable submit button
│   ├── Navbar.tsx                  # Top navigation bar
│   ├── Sidebar.tsx                 # Dashboard sidebar
│   ├── RoleBadge.tsx               # Role indicator pill
│   └── LoadingSpinner.tsx          # Loading indicator
├── contexts/AuthContext.tsx        # Auth state + useAuth hook
├── lib/
│   ├── types.ts                    # Types, role config, hasRole()
│   └── supabase/
│       ├── client.ts               # Browser Supabase client
│       ├── server.ts               # Server Supabase client
│       └── middleware.ts           # Session refresh + route guards
├── middleware.ts                   # Next.js middleware entry
└── supabase/migrations/
    └── 001_profiles.sql            # DB schema + RLS policies
```

## Role Permissions

| Feature | Customer | Staff | Admin |
|---------|----------|-------|-------|
| Dashboard Overview | ✅ | ✅ | ✅ |
| Orders | ✅ | ✅ | ✅ |
| Profile | ✅ | ✅ | ✅ |
| Staff Management | ❌ | ✅ | ✅ |
| Admin Panel | ❌ | ❌ | ✅ |

## Auth Flow

```
Signup → Email verification → Profile auto-created via DB trigger → Dashboard
Login  → Session cookie set by middleware → Dashboard
Forgot Password → Email link → /reset-password → updateUser()
Google OAuth → /auth/callback → exchangeCodeForSession → Dashboard
```

## Deployment

### Vercel

```bash
vercel --prod
```

Add env vars in the Vercel dashboard and update Supabase redirect URLs to your production domain.

## Scripts

```bash
npm run dev       # Development server
npm run build     # Production build
npm run typecheck # TypeScript check
npm run lint      # ESLint
```

## License

MIT
