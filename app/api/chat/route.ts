import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getOpenAIClient, CAFE_SYSTEM_PROMPT, DEFAULT_AI_CONFIG } from '@/lib/openai'
import type { AIConfig } from '@/lib/types'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const message: string = body.message?.trim()
    const conversationId: string = body.conversationId ?? crypto.randomUUID()

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Save the customer's message
    const { data: customerMsg, error: insertErr } = await supabase
      .from('messages')
      .insert({
        customer_id: user.id,
        conversation_id: conversationId,
        content: message,
        sender_type: 'customer',
      })
      .select()
      .single()

    if (insertErr) {
      console.error('Failed to save customer message:', insertErr)
      return NextResponse.json({ error: 'Failed to save message' }, { status: 500 })
    }

    // Fetch AI config
    const { data: rawConfig } = await supabase
      .from('ai_config')
      .select('*')
      .eq('id', 1)
      .single()

    const aiConfig = (rawConfig as AIConfig | null) ?? DEFAULT_AI_CONFIG

    // If auto-reply is disabled, return early
    if (!aiConfig.auto_reply_enabled) {
      return NextResponse.json({
        customerMessage: customerMsg,
        aiMessage: null,
        conversationId,
        autoReplyDisabled: true,
      })
    }

    // Check that OpenAI key is available
    if (!process.env.OPENAI_API_KEY) {
      const fallback = {
        customer_id: user.id,
        conversation_id: conversationId,
        content: "Thank you for your message! Our team will get back to you shortly. ☕",
        sender_type: 'ai',
        metadata: { fallback: true },
      }
      const { data: fallbackMsg } = await supabase.from('messages').insert(fallback).select().single()
      return NextResponse.json({
        customerMessage: customerMsg,
        aiMessage: fallbackMsg,
        conversationId,
        fallback: true,
      })
    }

    // Fetch conversation history for context (last 12 messages)
    const { data: history } = await supabase
      .from('messages')
      .select('content, sender_type')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(12)

    // Build OpenAI messages array
    const openaiMessages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
      { role: 'system', content: aiConfig.system_prompt ?? CAFE_SYSTEM_PROMPT },
      ...(history ?? []).map((m) => ({
        role: m.sender_type === 'customer' ? 'user' as const : 'assistant' as const,
        content: m.content,
      })),
    ]

    // Call OpenAI
    const openai = getOpenAIClient()
    const completion = await openai.chat.completions.create({
      model: aiConfig.model ?? DEFAULT_AI_CONFIG.model,
      messages: openaiMessages,
      max_tokens: aiConfig.max_tokens ?? DEFAULT_AI_CONFIG.max_tokens,
      temperature: aiConfig.temperature ?? DEFAULT_AI_CONFIG.temperature,
    })

    const aiContent =
      completion.choices[0]?.message?.content?.trim() ??
      "I'm sorry, I couldn't generate a response right now. Please try again or contact our staff. 🙏"

    // Save AI reply
    const { data: aiMsg } = await supabase
      .from('messages')
      .insert({
        customer_id: user.id,
        conversation_id: conversationId,
        content: aiContent,
        sender_type: 'ai',
        metadata: {
          model: completion.model,
          prompt_tokens: completion.usage?.prompt_tokens,
          completion_tokens: completion.usage?.completion_tokens,
          total_tokens: completion.usage?.total_tokens,
        },
      })
      .select()
      .single()

    return NextResponse.json({
      customerMessage: customerMsg,
      aiMessage: aiMsg,
      conversationId,
    })
  } catch (err: unknown) {
    console.error('Chat API error:', err)
    const message = err instanceof Error ? err.message : 'Unexpected error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
