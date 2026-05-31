import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { DEFAULT_AI_CONFIG } from '@/lib/openai'
import type { Profile } from '@/lib/types'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if ((profile as { role?: string } | null)?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden — admin only' }, { status: 403 })
    }

    const { data, error } = await supabase
      .from('ai_config')
      .select('*')
      .eq('id', 1)
      .single()

    if (error || !data) {
      return NextResponse.json({ config: DEFAULT_AI_CONFIG })
    }

    // Sanitize: never expose sensitive fields
    return NextResponse.json({ config: data })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unexpected error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Admin only
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = (profile as Pick<Profile, 'role'> | null)?.role
    if (role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden — admin only' }, { status: 403 })
    }

    const body = await req.json() as Record<string, unknown>

    const ALLOWED_MODELS = ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo']
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString(), updated_by: user.id }

    if ('system_prompt' in body) {
      if (typeof body.system_prompt !== 'string' || body.system_prompt.length > 8000) {
        return NextResponse.json({ error: 'system_prompt must be a string ≤ 8000 chars' }, { status: 400 })
      }
      updates.system_prompt = body.system_prompt.trim()
    }
    if ('auto_reply_enabled' in body) {
      updates.auto_reply_enabled = Boolean(body.auto_reply_enabled)
    }
    if ('model' in body) {
      if (!ALLOWED_MODELS.includes(body.model as string)) {
        return NextResponse.json({ error: `model must be one of: ${ALLOWED_MODELS.join(', ')}` }, { status: 400 })
      }
      updates.model = body.model
    }
    if ('temperature' in body) {
      const t = Number(body.temperature)
      if (isNaN(t) || t < 0 || t > 2) {
        return NextResponse.json({ error: 'temperature must be between 0 and 2' }, { status: 400 })
      }
      updates.temperature = t
    }
    if ('max_tokens' in body) {
      const mt = Number(body.max_tokens)
      if (!Number.isInteger(mt) || mt < 50 || mt > 4096) {
        return NextResponse.json({ error: 'max_tokens must be an integer between 50 and 4096' }, { status: 400 })
      }
      updates.max_tokens = mt
    }

    const { data, error } = await supabase
      .from('ai_config')
      .update(updates)
      .eq('id', 1)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ config: data })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unexpected error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
