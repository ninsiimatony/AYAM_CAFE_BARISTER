# Master Prompt Template — Ayam Café Barister

Use the sections below as copy-paste prompts when working with Claude Code (or any AI assistant) during feature development and deployment. Replace every `[PLACEHOLDER]` with your actual value.

---

## Project Context Block

Paste this at the top of any prompt to give the AI full project awareness.

```
## Project: Ayam Café Barister

Stack:
- Next.js 14 (App Router, TypeScript, strict mode)
- Supabase (Postgres + Auth + Row-Level Security)
- OpenAI gpt-4o-mini (Barista Bot AI chatbot)
- Tailwind CSS with café-themed color palette
- Deployed on Vercel

Key conventions:
- All pages live under app/ using the App Router file-system routing
- Server components by default; add "use client" only when needed
- Two Supabase clients: lib/supabase/client.ts (browser) and lib/supabase/server.ts (server)
- Roles: admin | staff | customer — enforced in middleware.ts and via RLS policies
- API routes live in app/api/** and are protected by role checks
- Types are centralised in lib/types.ts
- No comments unless the WHY is non-obvious
- No features beyond what is asked; no speculative abstractions

Environment variables required:
  NEXT_PUBLIC_SUPABASE_URL
  NEXT_PUBLIC_SUPABASE_ANON_KEY
  NEXT_PUBLIC_SITE_URL
  OPENAI_API_KEY
  NEXT_PUBLIC_OPENAI_CONFIGURED (optional)
```

---

## 1. Feature Development Prompts

### 1.1 New Feature

```
[PROJECT CONTEXT BLOCK]

Task: Build [FEATURE NAME]

What it should do:
- [BEHAVIOUR 1]
- [BEHAVIOUR 2]
- [BEHAVIOUR 3]

Affected area: [app/dashboard/... | app/api/... | components/...]
Who can access it: [admin | staff | customer | public]

Acceptance criteria:
- [ ] [CRITERION 1]
- [ ] [CRITERION 2]

Do not change anything outside of the files needed for this feature.
```

### 1.2 Bug Fix

```
[PROJECT CONTEXT BLOCK]

Bug: [SHORT DESCRIPTION]

Steps to reproduce:
1. [STEP 1]
2. [STEP 2]
3. [STEP 3]

Expected behaviour: [WHAT SHOULD HAPPEN]
Actual behaviour:   [WHAT ACTUALLY HAPPENS]

Likely files involved:
- [FILE PATH 1]
- [FILE PATH 2]

Fix only the root cause. Do not refactor surrounding code.
```

### 1.3 New API Route

```
[PROJECT CONTEXT BLOCK]

Create a new API route at: app/api/[ROUTE PATH]/route.ts

Method: [GET | POST | PUT | DELETE | PATCH]
Auth required: [yes — role: admin | staff | customer | no]

Request shape:
[Paste JSON or TypeScript type]

Response shape (success):
[Paste JSON or TypeScript type]

Error responses:
- 400 if [CONDITION]
- 401 if unauthenticated
- 403 if wrong role
- 500 on unexpected error

Business logic:
- [STEP 1]
- [STEP 2]

Use the server-side Supabase client from lib/supabase/server.ts.
Validate role via the profiles table before any data operation.
```

### 1.4 New UI Component

```
[PROJECT CONTEXT BLOCK]

Create a React component at: components/[FOLDER]/[ComponentName].tsx

Props:
[Paste TypeScript interface]

Behaviour:
- [BEHAVIOUR 1]
- [BEHAVIOUR 2]

Styling: Tailwind CSS only. Follow the existing café colour palette defined in tailwind.config.ts.
Dark mode: support dark: variants wherever colour or background is set.
Do not add "use client" unless the component needs browser APIs or event handlers.
```

### 1.5 Database Migration

```
[PROJECT CONTEXT BLOCK]

Create a new Supabase migration file at:
supabase/migrations/[NNN]_[descriptive_name].sql

Schema change:
[Describe the table/column/index changes]

RLS policies needed:
- SELECT: [who can read]
- INSERT: [who can insert]
- UPDATE: [who can update]
- DELETE: [who can delete]

Write idempotent SQL (use IF NOT EXISTS / IF EXISTS guards).
Mirror any new columns as TypeScript types in lib/types.ts.
```

### 1.6 Auth / RBAC Change

```
[PROJECT CONTEXT BLOCK]

Change: [DESCRIBE THE AUTH OR ROLE CHANGE]

Current behaviour: [CURRENT]
Required behaviour: [REQUIRED]

Touch points:
- middleware.ts — route protection
- app/api/** — server-side role checks
- supabase/migrations — RLS policy update (if needed)
- lib/types.ts — Role type (if a new role is added)

Verify that no existing role loses access it currently has unless that is the explicit goal.
```

---

## 2. Code Quality Prompts

### 2.1 Code Review

```
[PROJECT CONTEXT BLOCK]

Review the diff on branch [BRANCH NAME] for:
1. Correctness — logic bugs, off-by-one errors, unhandled promise rejections
2. Security — SQL injection, missing auth checks, exposed secrets, XSS
3. Type safety — any use of `any`, missing null checks
4. Adherence to project conventions above

Report findings as a numbered list. For each finding: file:line, severity (high/medium/low), and a one-line fix suggestion.
Do not suggest style changes unrelated to correctness or security.
```

### 2.2 Refactor Request

```
[PROJECT CONTEXT BLOCK]

Refactor: [FILE OR FUNCTION]

Goal: [E.G. reduce duplication | improve readability | split a large file]

Constraints:
- Do not change observable behaviour
- Do not add new abstractions beyond what the refactor requires
- Keep TypeScript types strict (no `any`)
- All existing tests must still pass after the refactor
```

---

## 3. Pre-Deployment Checklist Prompt

Run this before every production deploy.

```
[PROJECT CONTEXT BLOCK]

I am about to deploy branch [BRANCH NAME] to production (Vercel + Supabase).
Perform a pre-deployment audit:

1. Build check — does `next build` complete without errors or warnings?
2. Type check — does `tsc --noEmit` pass?
3. Env vars — are all required variables listed in .env.local.example present in Vercel?
4. Database — are there new migration files that haven't been applied to the production Supabase project?
5. Auth — are Supabase redirect URLs updated to match the production domain?
6. Security — are there any hardcoded secrets, tokens, or test credentials in the diff?
7. Breaking changes — does this change any API route signature or database schema in a backwards-incompatible way?

Report a PASS / FAIL / WARNING for each item with a one-line explanation.
```

---

## 4. Deployment Prompts

### 4.1 Supabase Migration Deployment

```
I need to apply new migrations to my Supabase production project.

Migrations to apply (in order):
- supabase/migrations/[NNN]_[name].sql

Steps to confirm before running:
1. Are there any destructive statements (DROP, TRUNCATE, column removal)?
2. Will any existing RLS policies conflict with the new ones?
3. Is the migration idempotent if run twice?

After confirming, generate the exact Supabase CLI commands to apply them:
  supabase link --project-ref [PROJECT_REF]
  supabase db push
```

### 4.2 Vercel Environment Variables Audit

```
[PROJECT CONTEXT BLOCK]

List all environment variables the application reads (search for process.env and NEXT_PUBLIC_ across the codebase).
For each variable, state:
- Name
- Where it is used (file:line)
- Whether it is required or optional
- Whether it is exposed to the browser (NEXT_PUBLIC_) or server-only

Output as a markdown table.
```

### 4.3 Full Deployment Walkthrough

```
[PROJECT CONTEXT BLOCK]

Walk me through deploying this application from scratch to production.

Assume:
- A fresh Supabase project (no tables yet)
- A fresh Vercel project linked to the GitHub repo
- I have: Supabase project URL, anon key, and an OpenAI API key

Give me numbered steps. For each step, include the exact command or UI action.
Stop and flag any step that requires a decision (e.g. region, plan tier).
```

### 4.4 Post-Deployment Smoke Test

```
Production URL: [https://your-app.vercel.app]

Run a smoke test by checking these flows in order:

[ ] 1. Landing page loads (no JS errors in console)
[ ] 2. /signup — create a new account with a test email
[ ] 3. Confirm email (check inbox) and log in
[ ] 4. /dashboard — loads the overview panel
[ ] 5. Barista Bot — send "hello" and get a response
[ ] 6. Barista Bot — order a coffee and verify it appears in /dashboard/orders
[ ] 7. Barista Bot — book a table and verify in /dashboard/admin/ai-assistant (as admin)
[ ] 8. Admin panel — promote test user to staff, verify role change takes effect
[ ] 9. Dark mode toggle — switches theme and persists on reload
[ ] 10. Log out — redirects to /auth/login

For any failed step, note the error message and the likely file causing it.
```

---

## 5. Debugging Prompts

### 5.1 Build Error

```
[PROJECT CONTEXT BLOCK]

`next build` is failing with this error:

[PASTE FULL ERROR OUTPUT]

Find the root cause and provide the minimal code change to fix it.
Do not change files unrelated to the error.
```

### 5.2 Supabase RLS Error

```
[PROJECT CONTEXT BLOCK]

A Supabase query is returning 0 rows or a permission error even though the user is authenticated.

Query:
[PASTE THE SUPABASE QUERY]

User role: [admin | staff | customer]
Table: [TABLE NAME]
Operation: [SELECT | INSERT | UPDATE | DELETE]

Relevant RLS policies (paste from Supabase SQL Editor → Table → RLS):
[PASTE POLICIES]

Diagnose which policy is blocking the query and provide the corrected SQL policy.
```

### 5.3 Auth Redirect Loop

```
[PROJECT CONTEXT BLOCK]

Users are stuck in a redirect loop after logging in.

Symptoms: [DESCRIBE WHAT HAPPENS]

Check these in order:
1. middleware.ts — matcher config and redirect logic
2. NEXT_PUBLIC_SITE_URL — does it match the actual domain exactly?
3. Supabase Auth → URL Configuration — Site URL and Redirect URLs
4. app/auth/callback/route.ts — is it exchanging the code correctly?

Identify which of these is misconfigured and provide the fix.
```

### 5.4 OpenAI / Barista Bot Error

```
[PROJECT CONTEXT BLOCK]

The Barista Bot is returning an error or fallback message instead of an AI response.

Error seen by the user: [PASTE ERROR OR BEHAVIOUR]

Check:
1. OPENAI_API_KEY — is it set in Vercel env vars and non-expired?
2. app/api/chat/route.ts — is the API call correct?
3. OpenAI usage dashboard — is the account over its quota or spending limit?
4. Browser network tab — what does the /api/chat response body say?

Diagnose and fix.
```

---

## 6. Quick-Reference Snippets

### Add a protected page (admin only)

```tsx
// app/dashboard/admin/[new-page]/page.tsx
import { createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function NewAdminPage() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/dashboard");

  return <main>{/* page content */}</main>;
}
```

### Add a protected API route

```ts
// app/api/[route]/route.ts
import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!["admin", "staff"].includes(profile?.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // ... business logic
}
```

### New Supabase migration skeleton

```sql
-- supabase/migrations/NNN_description.sql

-- ── Table ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.[table_name] (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── RLS ─────────────────────────────────────────────────────────────────────
ALTER TABLE public.[table_name] ENABLE ROW LEVEL SECURITY;

CREATE POLICY "[table_name]_select_own"
  ON public.[table_name] FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "[table_name]_insert_own"
  ON public.[table_name] FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ── Indexes ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS [table_name]_user_id_idx ON public.[table_name](user_id);
```

---

## 7. Branch & Commit Convention

```
Feature:  feat/[short-description]
Bug fix:  fix/[short-description]
Hotfix:   hotfix/[short-description]
Chore:    chore/[short-description]

Commit format:
  <type>: <imperative-present-tense summary under 72 chars>

Types: feat | fix | chore | refactor | docs | test
Example: feat: add reservation cancellation endpoint
```

---

## 8. Environment Variable Reference

| Variable | Required | Exposed to browser | Description |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Yes | Supabase public anon key |
| `NEXT_PUBLIC_SITE_URL` | Yes | Yes | Full production URL (no trailing slash) |
| `OPENAI_API_KEY` | Recommended | No | OpenAI secret key for Barista Bot |
| `NEXT_PUBLIC_OPENAI_CONFIGURED` | No | Yes | Shows "configured" badge in admin panel |

> Never commit `.env.local` to git. The `.env.local.example` file is the only env file tracked.
