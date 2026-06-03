# CLAUDE.md — TONY ELITE AI

## Project overview

**Repository name**: AYAM_CAFE_BARISTER (legacy name — the live product is "TONY ELITE AI")

This is an institutional Forex trading platform built with Next.js 14 (App Router), Supabase, Stripe, Anthropic Claude, and Telegram. It delivers AI-powered Smart Money Concepts (SMC) signals, a trade journal, risk calculator, MT5 account integration, and Stripe subscription gating. A legacy single-page café ordering UI (`ayam-menu.html`) coexists in the repo but is not part of the main Next.js app.

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router, TypeScript) |
| Database / Auth | Supabase (PostgreSQL + Auth + RLS) |
| Styling | Tailwind CSS v3, dark theme |
| Subscriptions | Stripe (Pro $29/mo, Elite $99/mo) |
| AI analysis | Anthropic Claude (`claude-opus-4-8`) |
| Telegram | Telegram Bot API (signal notifications, VIP channels) |
| MT5 integration | MetaAPI (Elite tier only) |
| Charts | Recharts |
| Animations | GSAP |
| Icons | Lucide React |
| Deployment | Vercel (primary), Cloudflare Pages (via `wrangler.toml`) |
| Legacy chatbot | OpenAI (café feature, can be omitted) |

---

## Directory structure

```
├── app/
│   ├── layout.tsx                        # Root layout — AuthProvider + ThemeProvider
│   ├── page.tsx                          # Landing page (GSAP spiral animation)
│   ├── login/page.tsx
│   ├── signup/page.tsx
│   ├── forgot-password/page.tsx
│   ├── reset-password/page.tsx
│   ├── auth/callback/route.ts            # OAuth exchange handler
│   ├── menu/                             # Café menu (legacy)
│   └── dashboard/
│       ├── page.tsx                      # Overview: KPIs + live signals
│       ├── admin/page.tsx                # Admin panel (admin only)
│       ├── admin/signals/new/            # Create signal form
│       ├── journal/                      # Trade journal CRUD
│       ├── risk/page.tsx                 # Risk calculator
│       └── profile/page.tsx
│
├── app/api/
│   ├── ai/analyze/route.ts               # SMC AI analysis (Anthropic)
│   ├── journal/route.ts + [id]/route.ts  # Journal CRUD
│   ├── price/route.ts                    # Live forex price feed
│   ├── signals/route.ts + [id]/route.ts  # Signal CRUD
│   ├── notifications/route.ts
│   ├── telegram/webhook/route.ts         # Telegram bot webhook
│   ├── telegram/link/route.ts            # Link user ↔ Telegram account
│   ├── mt5/accounts/route.ts             # MT5 account management
│   ├── menu/orders/route.ts              # Café menu orders (legacy)
│   ├── subscriptions/checkout/route.ts   # Stripe checkout session
│   ├── subscriptions/status/route.ts
│   ├── subscriptions/portal/route.ts     # Stripe billing portal
│   └── webhooks/stripe/route.ts          # Stripe webhook handler
│
├── components/
│   ├── auth/                             # AuthInput, AuthButton
│   ├── billing/                          # UpgradeGate, PricingCard, SubscriptionBanner
│   ├── charts/EquityCurve.tsx
│   ├── journal/                          # JournalEditor, JournalFeed
│   ├── mt5/Mt5Manager.tsx
│   ├── risk/RiskCalculator.tsx
│   ├── signals/                          # SignalCard, SignalFeed
│   ├── telegram/TelegramConnect.tsx
│   ├── ui/spiral-animation.tsx           # GSAP landing animation
│   ├── Navbar.tsx
│   ├── Sidebar.tsx
│   ├── MobileSidebar.tsx
│   ├── LivePrice.tsx                     # Real-time price ticker
│   ├── LoadingSpinner.tsx
│   └── RoleBadge.tsx
│
├── contexts/
│   ├── AuthContext.tsx                   # useAuth() hook + AuthProvider
│   ├── ThemeContext.tsx
│   └── CartContext.tsx                   # Legacy café cart
│
├── lib/
│   ├── types.ts                          # ALL TypeScript types + plan configs
│   ├── supabase/
│   │   ├── client.ts                     # Browser Supabase client
│   │   ├── server.ts                     # Server Supabase client (cookies)
│   │   ├── admin.ts                      # Service-role client (bypasses RLS)
│   │   └── middleware.ts                 # Session refresh helper
│   ├── anthropic.ts                      # Anthropic lazy singleton + AI analysis
│   ├── stripe.ts                         # Stripe lazy singleton + plan config
│   ├── telegram.ts                       # Telegram bot helpers
│   ├── smc-engine.ts                     # Pure-TS SMC analysis engine
│   ├── risk.ts                           # Risk calculation utilities
│   ├── mt5.ts                            # MetaAPI helpers
│   ├── demo-data.ts                      # Fallback demo signals/stats
│   └── menu-data.ts                      # Café menu items (legacy)
│
├── supabase/migrations/                  # 15 ordered SQL migration files
├── middleware.ts                         # Minimal Next.js middleware (no auth)
├── next.config.js
├── tailwind.config.ts
├── vercel.json
└── wrangler.toml                         # Cloudflare Pages config
```

---

## Authentication & authorization

### Auth enforcement pattern
Middleware (`middleware.ts`) is intentionally empty — no Supabase calls run at the Edge. Auth is enforced **inside server components** by calling `createClient()` and redirecting if no user is found:

```ts
const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()
if (!user) redirect('/login')
```

Never add auth logic to `middleware.ts`; it is unreliable on Vercel's Edge Runtime.

### Supabase client selection
| Context | Import | Notes |
|---|---|---|
| Server components / API routes | `lib/supabase/server.ts` | Cookie-based session |
| Client components | `lib/supabase/client.ts` | Browser singleton |
| Admin operations (bypass RLS) | `lib/supabase/admin.ts` | Service-role key, server-only |

Never import `admin.ts` in client components.

### Roles & subscription tiers
Two orthogonal access control systems:

**User roles** (`UserRole = 'admin' | 'staff' | 'customer'`):
- `admin` — full system access, can update any profile, create/delete signals
- `staff` (Analyst) — can publish signals
- `customer` (Trader) — standard access

Use `hasRole(userRole, requiredRole)` from `lib/types.ts` to compare roles. Role hierarchy: admin (3) > staff (2) > customer (1).

**Subscription tiers** (`SubscriptionTier = 'free' | 'pro' | 'elite'`):
- `free` — 3 signals/week, 50 journal entries, no Telegram/MT5
- `pro` ($29/mo) — unlimited pro+free signals, Telegram VIP Pro, full journal, analytics
- `elite` ($99/mo) — everything + elite signals, MT5 integration, AI analysis

Use `canAccessSignal(userTier, signalTier)` to check signal access. Tier hierarchy: elite (3) > pro (2) > free (1).

Gate premium features with `<UpgradeGate tier="pro">` or `<UpgradeGate tier="elite">` from `components/billing/`.

---

## Type system

All TypeScript types live in **`lib/types.ts`** — never duplicate them elsewhere. Key types:

- `Profile` — user record mirroring `public.profiles`
- `Signal` — trading signal with full SMC metadata
- `Trade` — individual trade record
- `JournalEntry` — trade journal entry with emotion tracking
- `TelegramAccount` — linked Telegram account
- `Mt5Account` — MetaAPI-linked MT5 account
- `PerformanceSnapshot` / `UserStats30d` / `SignalPerformance` — analytics views
- `PLAN_CONFIGS` — canonical tier feature definitions
- `SMC_PATTERN_LABELS` / `SESSION_TIMES` / `ALL_PAIRS` — display constants

**Legacy café types** at the bottom of `lib/types.ts` (`Message`, `Order`, `Reservation`, etc.) are kept for backwards compatibility. TODO: remove once all café pages are replaced.

---

## Database migrations

Run migrations in numerical order in the Supabase SQL Editor or via `supabase db push`:

| File | Description |
|---|---|
| `001_profiles.sql` | Profiles table, RLS, auto-create trigger |
| `002_messages.sql` | Chat messages |
| `003_ai_assistant.sql` | AI assistant config |
| `004_fix_profiles_security.sql` | Security policy fixes |
| `005_subscriptions.sql` | Stripe subscription records |
| `006_signals.sql` | Trading signals |
| `007_trades.sql` | Trade records |
| `008_journal.sql` | Journal entries |
| `009_telegram_accounts.sql` | Telegram account linking |
| `010_mt5_accounts.sql` | MT5 account records |
| `011_analytics.sql` | Performance snapshot views |
| `012_audit_logs.sql` | Audit trail |
| `013_production_fixes.sql` | Production patches |
| `014_fix_telegram_unique.sql` | Telegram unique constraint fix |
| `015_menu_orders.sql` | Café menu orders |

All tables have RLS enabled. Always respect existing policies when adding new ones.

---

## Environment variables

Copy `.env.local.example` to `.env.local`. Required variables:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=          # Server-only, never prefix NEXT_PUBLIC_

# Stripe
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRO_PRICE_ID=
STRIPE_ELITE_PRICE_ID=

# Anthropic
ANTHROPIC_API_KEY=                  # Required for AI signal analysis (Elite)

# Telegram
TELEGRAM_BOT_TOKEN=
TELEGRAM_BOT_USERNAME=              # Without @
TELEGRAM_VIP_PRO_CHANNEL_ID=        # Negative integer
TELEGRAM_VIP_ELITE_CHANNEL_ID=
TELEGRAM_WEBHOOK_SECRET=

# MetaAPI (MT5, Elite tier)
METAAPI_TOKEN=

# App
NEXT_PUBLIC_SITE_URL=               # No trailing slash

# Legacy (optional)
OPENAI_API_KEY=                     # Café chatbot only
```

---

## Key library patterns

### Lazy singletons
Both `lib/anthropic.ts` and `lib/stripe.ts` use lazy singletons to prevent build-time failures when env vars are absent. Do not access `process.env.*` at module level for these clients.

```ts
// Correct — from lib/stripe.ts
export function getStripe(): Stripe { ... }

// Incorrect — fails at build time
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
```

### SMC Engine (`lib/smc-engine.ts`)
Pure TypeScript, no external dependencies. Accepts an array of `Candle` objects and returns an `SMCAnalysis` with order blocks, fair value gaps, liquidity levels, confluence score, and entry/SL/TP levels.

### AI analysis (`lib/anthropic.ts`)
Calls `claude-opus-4-8` via `generateSignalAnalysis(smc, pair, timeframe)`. Returns `AISignalAnalysis` with narrative text, confidence score, and invalidation level. Used in the `/api/ai/analyze` route (Elite tier only).

---

## Development workflow

```bash
npm install          # Install dependencies
npm run dev          # Dev server at http://localhost:3000
npm run build        # Production build
npm run typecheck    # tsc --noEmit (run before committing)
npm run lint         # ESLint
npm run cf:build     # Cloudflare Pages build
npm run cf:deploy    # Deploy to Cloudflare Pages
```

Always run `npm run typecheck` before committing. Zero TypeScript errors required.

---

## UI conventions

- **Dark theme only**: background `#0a0f1e`, cards `#0d1520`, borders `white/[0.07]`
- **Tier colors**: free = gray-400, pro = blue-400, elite = amber-400
- **Direction colors**: buy/bullish = emerald-400, sell/bearish = red-400
- **Text scale**: use Tailwind's `text-[11px]`–`text-[22px]` for precise sizing
- **Spacing**: `space-y-5` between dashboard sections, `gap-3` for grids
- **Component structure**: keep server components at the page level; extract interactive pieces as `'use client'` components
- Demo data fallback: when no real data exists for a user, fall back to `DEMO_STATS` / `DEMO_SIGNALS` from `lib/demo-data.ts` and show a "Sample" badge

---

## API route conventions

- Always authenticate: `const { data: { user } } = await supabase.auth.getUser()`; return 401 if no user
- Authorize by role for write operations (check `profile.role`)
- Validate input at route entry; return 400 with a clear error message
- Cap list queries: `Math.min(parseInt(limit ?? '20'), 50)`
- Return consistent shapes: `{ data }` on success, `{ error: string }` on failure

---

## Admin operations

To promote a user to admin after first signup:

```sql
UPDATE public.profiles SET role = 'admin' WHERE email = 'your@email.com';
```

Only admins and staff (`role IN ('admin', 'staff')`) may create or update signals. This is enforced both in API routes and via Supabase RLS.

---

## Deployment

**Vercel** (primary):
1. Import the GitHub repo
2. Set all environment variables in Vercel dashboard
3. Update Supabase Auth → URL Configuration with the production domain
4. `vercel --prod` or push to `main`

**Cloudflare Pages** (alternative):
```bash
npm run cf:build
npm run cf:deploy
```

---

## Branch workflow

Active development branch: `claude/claude-md-docs-58qBq`

Always push to this branch:
```bash
git push -u origin claude/claude-md-docs-58qBq
```
