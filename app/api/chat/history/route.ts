import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const conversationId = searchParams.get('conversationId')
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100)

    let query = supabase
      .from('messages')
      .select('*')
      .eq('customer_id', user.id)
      .order('created_at', { ascending: true })
      .limit(limit)

    if (conversationId) {
      query = query.eq('conversation_id', conversationId)
    }

    const { data: messages, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get distinct conversation IDs for this user (for conversation list)
    const { data: conversations } = await supabase
      .from('messages')
      .select('conversation_id, created_at')
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false })

    const uniqueConversations = conversations
      ? Array.from(new Map(conversations.map((c) => [c.conversation_id, c])).values())
      : []

    return NextResponse.json({
      messages: messages ?? [],
      conversations: uniqueConversations,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unexpected error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
