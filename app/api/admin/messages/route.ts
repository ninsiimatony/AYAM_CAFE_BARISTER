import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/lib/types'

// GET  — list all conversations (admin/staff)
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Role guard
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = (profile as Pick<Profile, 'role'> | null)?.role
    if (role !== 'admin' && role !== 'staff') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const conversationId = searchParams.get('conversationId')

    if (conversationId) {
      // Return full message thread for one conversation
      const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })

      // Mark customer messages as read
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .eq('sender_type', 'customer')
        .eq('is_read', false)

      return NextResponse.json({ messages: messages ?? [] })
    }

    // Return conversation summaries — one entry per conversation_id, latest message
    const { data: allMessages, error } = await supabase
      .from('messages')
      .select('conversation_id, customer_id, content, sender_type, is_read, created_at')
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Get unique conversation IDs and find the latest message for each
    const seen = new Set<string>()
    const latestByConv: typeof allMessages = []
    for (const msg of allMessages ?? []) {
      if (!seen.has(msg.conversation_id)) {
        seen.add(msg.conversation_id)
        latestByConv.push(msg)
      }
    }

    // Fetch customer profiles for all unique customer IDs
    const customerIds = Array.from(new Set(latestByConv.map((m) => m.customer_id)))
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, email, role')
      .in('id', customerIds)

    type ProfileRow = Pick<Profile, 'id' | 'full_name' | 'email' | 'role'>
    const profileMap = new Map((profiles ?? []).map((p: ProfileRow) => [p.id, p]))

    // Count unread per conversation
    const unreadMap = new Map<string, number>()
    for (const msg of allMessages ?? []) {
      if (msg.sender_type === 'customer' && !msg.is_read) {
        unreadMap.set(msg.conversation_id, (unreadMap.get(msg.conversation_id) ?? 0) + 1)
      }
    }

    const msgCountMap = new Map<string, number>()
    for (const msg of allMessages ?? []) {
      msgCountMap.set(msg.conversation_id, (msgCountMap.get(msg.conversation_id) ?? 0) + 1)
    }

    const conversations = latestByConv.map((msg) => {
      const customer = profileMap.get(msg.customer_id)
      return {
        conversation_id: msg.conversation_id,
        customer_id: msg.customer_id,
        customer_name: customer?.full_name ?? null,
        customer_email: customer?.email ?? 'Unknown',
        last_message: msg.content,
        last_message_at: msg.created_at,
        message_count: msgCountMap.get(msg.conversation_id) ?? 1,
        unread_count: unreadMap.get(msg.conversation_id) ?? 0,
      }
    })

    return NextResponse.json({ conversations })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unexpected error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// POST — staff sends a manual reply into a conversation
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = (profile as Pick<Profile, 'role'> | null)?.role
    if (role !== 'admin' && role !== 'staff') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { conversationId, customerId, content } = await req.json()

    if (!conversationId || !customerId || !content?.trim()) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        customer_id: customerId,
        conversation_id: conversationId,
        content: content.trim(),
        sender_type: 'staff',
        staff_id: user.id,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ message })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unexpected error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
