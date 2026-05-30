import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { DEFAULT_AI_CONFIG } from '@/lib/openai'
import type { Profile } from '@/lib/types'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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

    const body = await req.json()

    // Whitelist updatable fields
    const allowed = ['system_prompt', 'auto_reply_enabled', 'model', 'temperature', 'max_tokens']
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString(), updated_by: user.id }

    for (const key of allowed) {
      if (key in body) updates[key] = body[key]
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
