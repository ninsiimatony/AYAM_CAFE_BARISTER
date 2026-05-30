# Deployment Guide — Ayam Café Barister

## Stack
- **Frontend / API**: Next.js 14 (App Router) → Vercel
- **Database / Auth**: Supabase (Postgres + Auth + RLS)
- **AI**: OpenAI API (gpt-4o-mini)

---

## 1. Supabase Setup

### 1.1 Create a project
1. Sign in at [supabase.com](https://supabase.com) → **New project**
2. Choose a region close to Uganda (e.g. `eu-west-2` London or `us-east-1`)
3. Save your **database password** securely

### 1.2 Run migrations (in order)
Go to **SQL Editor** in your Supabase dashboard and run each file:

```
supabase/migrations/001_profiles.sql
supabase/migrations/002_messages.sql
supabase/migrations/003_ai_assistant.sql
```

Or use the Supabase CLI:
```bash
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

### 1.3 Configure Auth
In your Supabase project → **Authentication → URL Configuration**:
- **Site URL**: `https://your-app.vercel.app`
- **Redirect URLs**: add `https://your-app.vercel.app/auth/callback`

### 1.4 Get your API keys
Go to **Project Settings → API**:
- Copy `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
- Copy `anon / public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 1.5 Create the first admin user
1. Sign up at `/signup` with your email
2. In Supabase SQL Editor run:
```sql
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'your@email.com';
```

---

## 2. OpenAI Setup

1. Sign in at [platform.openai.com](https://platform.openai.com)
2. Go to **API Keys** → **Create new secret key**
3. Copy the key → `OPENAI_API_KEY`
4. Recommended: add a usage limit in your OpenAI account to cap monthly spend

> **Without `OPENAI_API_KEY`**: the chat still works but falls back to a static message. All other features (dashboard, orders, reservations) work normally.

---

## 3. Deploy to Vercel

### 3.1 Import the repository
1. Go to [vercel.com](https://vercel.com) → **Add New Project**
2. Import your GitHub repo (`ninsiimatony/AYAM_CAFE_BARISTER`)
3. Framework: **Next.js** (auto-detected)

### 3.2 Set environment variables
In Vercel → Project Settings → **Environment Variables**, add:

| Variable | Value | Required |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxx.supabase.co` | ✅ Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` | ✅ Yes |
| `NEXT_PUBLIC_SITE_URL` | `https://your-app.vercel.app` | ✅ Yes |
| `OPENAI_API_KEY` | `sk-proj-...` | ⚠️ Recommended |
| `NEXT_PUBLIC_OPENAI_CONFIGURED` | `true` | Optional |

> Set these for all environments: **Production**, **Preview**, **Development**

### 3.3 Deploy
Click **Deploy** — Vercel will build and deploy automatically.

After the first deployment, copy your Vercel URL and update:
- `NEXT_PUBLIC_SITE_URL` in Vercel env vars
- **Site URL** in Supabase Auth settings

---

## 4. Post-Deployment Checklist

- [ ] Visit `https://your-app.vercel.app` and sign up
- [ ] Promote yourself to admin via Supabase SQL (see 1.5)
- [ ] Test login → `/dashboard` redirects correctly
- [ ] Test chat: send a message to Barista Bot
- [ ] Test AI ordering: ask Barista Bot to place an order
- [ ] Test reservation: ask Barista Bot to book a table
- [ ] Visit `/dashboard/admin/ai-assistant` (admin) — verify orders/reservations show up
- [ ] Test dark mode toggle in the top navbar
- [ ] Verify email confirmation works (check Supabase Auth → Email Templates if needed)

---

## 5. Branch Deployed
Current feature branch: `claude/supabase-auth-system-chUx1`

Merge to `main` when ready to ship.

---

## 6. Ongoing

### Scale Supabase
- Free tier: 500 MB storage, 2 GB bandwidth/month
- Upgrade to Pro ($25/month) for production workloads

### OpenAI costs
- `gpt-4o-mini`: ~$0.15 per million input tokens, ~$0.60 per million output tokens
- A typical chat message costs < $0.001
- Set a **Usage limit** in your OpenAI account dashboard

### Custom domain
1. In Vercel → Project → **Domains** → add your domain
2. Update DNS records at your registrar
3. Update `NEXT_PUBLIC_SITE_URL` and Supabase redirect URLs
