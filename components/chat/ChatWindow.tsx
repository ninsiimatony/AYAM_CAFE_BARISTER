'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import MessageBubble, { TypingIndicator } from './MessageBubble'
import MessageInput from './MessageInput'
import type { Message } from '@/lib/types'

const SUGGESTED_QUESTIONS = [
  "What's on your menu?",
  "What are your opening hours?",
  "How do I track my order?",
  "Do you have WiFi?",
  "What's your cancellation policy?",
]

interface ChatWindowProps {
  conversationId?: string
  onConversationStart?: (id: string) => void
}

export default function ChatWindow({ conversationId: initialConvId, onConversationStart }: ChatWindowProps) {
  const { profile } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [conversationId, setConversationId] = useState<string | undefined>(initialConvId)
  const [isLoading, setIsLoading] = useState(false)
  const [isFetchingHistory, setIsFetchingHistory] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [autoReplyOff, setAutoReplyOff] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Fetch conversation history on mount
  const fetchHistory = useCallback(async (convId?: string) => {
    setIsFetchingHistory(true)
    try {
      const params = convId ? `?conversationId=${convId}` : ''
      const res = await fetch(`/api/chat/history${params}`)
      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages ?? [])

        // If no conversationId passed, use the most recent conversation
        if (!convId && data.conversations?.length > 0) {
          setConversationId(data.conversations[0].conversation_id)
        }
      }
    } finally {
      setIsFetchingHistory(false)
    }
  }, [])

  useEffect(() => {
    fetchHistory(initialConvId)
  }, [initialConvId, fetchHistory])

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: messages.length > 3 ? 'smooth' : 'auto' })
  }, [messages, isLoading])

  const sendMessage = async (text: string) => {
    setError(null)
    setIsLoading(true)

    // Optimistically add customer message
    const tempMsg: Message = {
      id: `temp-${Date.now()}`,
      customer_id: '',
      conversation_id: conversationId ?? '',
      content: text,
      sender_type: 'customer',
      staff_id: null,
      is_read: true,
      metadata: null,
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, tempMsg])

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, conversationId }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Failed to send message')
        setMessages((prev) => prev.filter((m) => m.id !== tempMsg.id))
        return
      }

      // Replace temp message + append AI reply
      const newMessages: Message[] = []
      if (data.customerMessage) newMessages.push(data.customerMessage)
      if (data.aiMessage) newMessages.push(data.aiMessage)
      if (data.autoReplyDisabled) setAutoReplyOff(true)

      setMessages((prev) => [
        ...prev.filter((m) => m.id !== tempMsg.id),
        ...newMessages,
      ])

      if (data.conversationId && !conversationId) {
        setConversationId(data.conversationId)
        onConversationStart?.(data.conversationId)
      }
    } catch {
      setError('Network error. Please try again.')
      setMessages((prev) => prev.filter((m) => m.id !== tempMsg.id))
    } finally {
      setIsLoading(false)
    }
  }

  const isEmpty = !isFetchingHistory && messages.length === 0

  return (
    <div className="flex h-full flex-col rounded-2xl border border-coffee-100 bg-cream-50 overflow-hidden shadow-coffee">
      {/* Chat Header */}
      <div className="flex items-center gap-3 border-b border-coffee-100 bg-white px-5 py-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-coffee-gradient shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
          </svg>
        </div>
        <div>
          <p className="font-semibold text-coffee-900">Barista Bot ☕</p>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
            <p className="text-xs text-coffee-400">
              {autoReplyOff ? 'Auto-reply disabled — awaiting staff' : 'AI-powered · typically replies instantly'}
            </p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto px-4 py-4"
      >
        {isFetchingHistory ? (
          <div className="flex justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-coffee-200 border-t-coffee-600" />
          </div>
        ) : isEmpty ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <div className="text-5xl mb-4">☕</div>
            <h3 className="font-semibold text-coffee-800 mb-1">How can we help you today?</h3>
            <p className="text-sm text-coffee-400 mb-6 max-w-xs">
              Ask about our menu, orders, café hours, or anything else!
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="rounded-full border border-coffee-200 bg-white px-3 py-1.5 text-xs text-coffee-700 hover:bg-coffee-50 hover:border-coffee-400 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                customerName={msg.sender_type === 'customer' ? profile?.full_name : undefined}
              />
            ))}
            {isLoading && <TypingIndicator />}
          </>
        )}

        {error && (
          <div className="mx-auto my-2 max-w-xs rounded-xl bg-red-50 border border-red-200 px-4 py-2 text-center text-sm text-red-600">
            {error}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <MessageInput
        onSend={sendMessage}
        disabled={isLoading}
        placeholder="Ask about our menu, orders, hours…"
      />
    </div>
  )
}
