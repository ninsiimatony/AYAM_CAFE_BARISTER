import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getOpenAIClient, CAFE_SYSTEM_PROMPT, DEFAULT_AI_CONFIG } from '@/lib/openai'
import { AI_TOOLS, executeGetMenu, executeFaq } from '@/lib/ai-tools'
import type { TakeOrderArgs, MakeReservationArgs, GetMenuArgs, GetFaqArgs } from '@/lib/ai-tools'
import type { AIConfig, ChatMetadata, OrderItemLine } from '@/lib/types'
import type {
  ChatCompletionMessageParam,
  ChatCompletionToolMessageParam,
  ChatCompletionAssistantMessageParam,
} from 'openai/resources/chat/completions'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const message: string = (body.message ?? '').trim()
    if (!message) return NextResponse.json({ error: 'Message is required' }, { status: 400 })

    const conversationId: string = body.conversationId ?? crypto.randomUUID()

    // ── Save customer message ──────────────────────────────────────────
    const { data: customerMsg, error: insertErr } = await supabase
      .from('messages')
      .insert({ customer_id: user.id, conversation_id: conversationId, content: message, sender_type: 'customer' })
      .select()
      .single()

    if (insertErr) {
      console.error('Failed to save customer message:', insertErr)
      return NextResponse.json({ error: 'Failed to save message' }, { status: 500 })
    }

    // ── Load AI config ─────────────────────────────────────────────────
    const { data: rawConfig } = await supabase.from('ai_config').select('*').eq('id', 1).single()
    const aiConfig = (rawConfig as AIConfig | null) ?? DEFAULT_AI_CONFIG

    if (!aiConfig.auto_reply_enabled) {
      return NextResponse.json({ customerMessage: customerMsg, aiMessage: null, conversationId, autoReplyDisabled: true })
    }

    if (!process.env.OPENAI_API_KEY) {
      const { data: fallbackMsg } = await supabase
        .from('messages')
        .insert({ customer_id: user.id, conversation_id: conversationId, content: 'Thank you for your message! Our team will get back to you shortly. ☕', sender_type: 'ai', metadata: { fallback: true } })
        .select()
        .single()
      return NextResponse.json({ customerMessage: customerMsg, aiMessage: fallbackMsg, conversationId, fallback: true })
    }

    // ── Build conversation history ─────────────────────────────────────
    const { data: history } = await supabase
      .from('messages')
      .select('content, sender_type')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(16)

    const messages: ChatCompletionMessageParam[] = [
      { role: 'system', content: aiConfig.system_prompt ?? CAFE_SYSTEM_PROMPT },
      ...(history ?? []).map((m) => ({
        role: (m.sender_type === 'customer' ? 'user' : 'assistant') as 'user' | 'assistant',
        content: m.content,
      })),
    ]

    // ── First OpenAI call (with tools) ─────────────────────────────────
    const openai = getOpenAIClient()
    const model = aiConfig.model ?? DEFAULT_AI_CONFIG.model
    const temperature = aiConfig.temperature ?? DEFAULT_AI_CONFIG.temperature
    const maxTokens = aiConfig.max_tokens ?? DEFAULT_AI_CONFIG.max_tokens

    const firstRes = await openai.chat.completions.create({
      model,
      messages,
      tools: AI_TOOLS as unknown as Parameters<typeof openai.chat.completions.create>[0]['tools'],
      tool_choice: 'auto',
      temperature,
      max_tokens: maxTokens,
    })

    const firstChoice = firstRes.choices[0]
    let aiContent: string
    let metadata: ChatMetadata | null = null

    // ── Handle tool calls ──────────────────────────────────────────────
    if (firstChoice.finish_reason === 'tool_calls' && firstChoice.message.tool_calls?.length) {
      const toolResults: ChatCompletionToolMessageParam[] = []

      for (const toolCall of firstChoice.message.tool_calls) {
        if (!('function' in toolCall)) continue
        const fnToolCall = toolCall as { id: string; function: { name: string; arguments: string } }
        const fnName = fnToolCall.function.name
        const fnArgs = JSON.parse(fnToolCall.function.arguments) as Record<string, unknown>
        let result: string

        if (fnName === 'take_order') {
          const args = fnArgs as unknown as TakeOrderArgs
          const items: OrderItemLine[] = args.items.map((i) => ({
            name: i.name,
            quantity: i.quantity,
            unit_price: i.unit_price,
            subtotal: i.quantity * i.unit_price,
            ...(i.notes ? { notes: i.notes } : {}),
          }))

          const { data: order, error: orderErr } = await supabase
            .from('orders')
            .insert({ customer_id: user.id, conversation_id: conversationId, items, total: args.total, notes: args.notes ?? null, status: 'pending' })
            .select()
            .single()

          if (orderErr) {
            result = JSON.stringify({ success: false, error: 'Failed to save order' })
          } else {
            metadata = { type: 'order', order_id: order.id, items, total: args.total, status: 'pending', notes: args.notes }
            result = JSON.stringify({ success: true, order_id: order.id, total_ugx: args.total })
          }

        } else if (fnName === 'make_reservation') {
          const args = fnArgs as unknown as MakeReservationArgs

          const { data: res, error: resErr } = await supabase
            .from('reservations')
            .insert({ customer_id: user.id, conversation_id: conversationId, customer_name: args.customer_name, customer_phone: args.customer_phone ?? null, party_size: args.party_size, date: args.date, time: args.time, notes: args.notes ?? null, status: 'pending' })
            .select()
            .single()

          if (resErr) {
            result = JSON.stringify({ success: false, error: 'Failed to save reservation' })
          } else {
            metadata = { type: 'reservation', reservation_id: res.id, customer_name: args.customer_name, party_size: args.party_size, date: args.date, time: args.time, status: 'pending', notes: args.notes }
            result = JSON.stringify({ success: true, reservation_id: res.id })
          }

        } else if (fnName === 'get_menu') {
          result = executeGetMenu(fnArgs as unknown as GetMenuArgs)
        } else if (fnName === 'get_faq') {
          result = executeFaq(fnArgs as unknown as GetFaqArgs)
        } else {
          result = JSON.stringify({ error: 'Unknown tool' })
        }

        toolResults.push({ role: 'tool', tool_call_id: fnToolCall.id, content: result })
      }

      // ── Second call for final response ────────────────────────────────
      const assistantMsg: ChatCompletionAssistantMessageParam = {
        role: 'assistant',
        content: firstChoice.message.content ?? null,
        tool_calls: firstChoice.message.tool_calls,
      }

      const secondRes = await openai.chat.completions.create({
        model,
        messages: [...messages, assistantMsg, ...toolResults],
        temperature,
        max_tokens: maxTokens,
      })

      aiContent = secondRes.choices[0]?.message?.content?.trim() ?? "I'm sorry, something went wrong. Please try again or contact our staff. 🙏"

    } else {
      aiContent = firstChoice.message.content?.trim() ?? "I'm sorry, I couldn't generate a response right now. Please try again. 🙏"
    }

    // ── Save AI reply ──────────────────────────────────────────────────
    const { data: aiMsg } = await supabase
      .from('messages')
      .insert({
        customer_id: user.id,
        conversation_id: conversationId,
        content: aiContent,
        sender_type: 'ai',
        metadata: metadata ?? { model: firstRes.model, total_tokens: firstRes.usage?.total_tokens },
      })
      .select()
      .single()

    return NextResponse.json({ customerMessage: customerMsg, aiMessage: aiMsg, conversationId })

  } catch (err: unknown) {
    console.error('Chat API error:', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unexpected error' }, { status: 500 })
  }
}
