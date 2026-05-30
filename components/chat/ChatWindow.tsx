'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import MessageBubble, { TypingIndicator } from './MessageBubble'
import MessageInput from './MessageInput'
import type { Message } from '@/lib/types'

const QUICK_ACTIONS = [
  { text: "What's on the menu?",      icon: '🍽️' },
  { text: "I'd like to place an order", icon: '☕' },
  { text: 'Make a reservation',        icon: '📅' },
  { text: 'What are your hours?',      icon: '🕐' },
  { text: "What's your WiFi password?", icon: '📶' },
  { text: 'What are your popular items?', icon: '⭐' },
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

  const fetchHistory = useCallback(async (convId?: string) => {
    setIsFetchingHistory(true)
    try {
      const params = convId ? `?conversationId=${convId}` : ''
      const res = await fetch(`/api/chat/history${params}`)
      if (res.ok) {
        const data = await res.json() as { messages?: Message[]; conversations?: { conversation_id: string }[] }
        setMessages(data.messages ?? [])
        if (!convId && (data.conversations?.length ?? 0) > 0) {
          setConversationId(data.conversations![0].conversation_id)
        }
      }
    } finally {
      setIsFetchingHistory(false)
    }
  }, [])

  useEffect(() => { fetchHistory(initialConvId) }, [initialConvId, fetchHistory])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: messages.length > 3 ? 'smooth' : 'auto' })
  }, [messages, isLoading])

  const sendMessage = async (text: string) => {
    setError(null)
    setIsLoading(true)

    const tempId = `temp-${Date.now()}`
    const tempMsg: Message = {
      id: tempId,
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

      const data = await res.json() as {
        error?: string
        customerMessage?: Message
        aiMessage?: Message | null
        conversationId?: string
        autoReplyDisabled?: boolean
      }

      if (!res.ok) {
        setError(data.error ?? 'Failed to send message')
        setMessages((prev) => prev.filter((m) => m.id !== tempId))
        return
      }

      const newMessages: Message[] = []
      if (data.customerMessage) newMessages.push(data.customerMessage)
      if (data.aiMessage) newMessages.push(data.aiMessage)
      if (data.autoReplyDisabled) setAutoReplyOff(true)

      setMessages((prev) => [...prev.filter((m) => m.id !== tempId), ...newMessages])

      if (data.conversationId && !conversationId) {
        setConversationId(data.conversationId)
        onConversationStart?.(data.conversationId)
      }
    } catch {
      setError('Network error. Please try again.')
      setMessages((prev) => prev.filter((m) => m.id !== tempId))
    } finally {
      setIsLoading(false)
    }
  }

  const isEmpty = !isFetchingHistory && messages.length === 0

  return (
    <div className="flex h-full flex-col rounded-2xl border border-coffee-100 dark:border-coffee-800 bg-cream-50 dark:bg-coffee-950 overflow-hidden shadow-coffee">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-coffee-100 dark:border-coffee-800 bg-white dark:bg-coffee-900 px-5 py-3.5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-coffee-gradient shadow-sm flex-shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-coffee-900 dark:text-cream-100 leading-none">Barista Bot ☕</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={`h-1.5 w-1.5 rounded-full ${autoReplyOff ? 'bg-yellow-400' : 'bg-green-400 animate-pulse'}`} />
            <p className="text-xs text-coffee-400 truncate">
              {autoReplyOff ? 'Staff will reply soon' : 'AI · orders · reservations · menu'}
            </p>
          </div>
        </div>
        <button
          onClick={() => { setMessages([]); setConversationId(undefined); setAutoReplyOff(false) }}
          className="text-xs text-coffee-400 hover:text-coffee-600 dark:hover:text-cream-200 transition-colors flex-shrink-0"
          title="Start new conversation"
        >
          New chat
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-0.5">
        {isFetchingHistory ? (
          <div className="flex justify-center py-10">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-coffee-200 border-t-coffee-600" />
          </div>
        ) : isEmpty ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-6 px-2">
            <div className="w-16 h-16 rounded-2xl bg-coffee-gradient flex items-center justify-center mb-4 shadow-coffee">
              <span className="text-3xl">☕</span>
            </div>
            <h3 className="font-bold text-coffee-900 dark:text-cream-100 mb-1">What can I help you with?</h3>
            <p className="text-sm text-coffee-400 mb-5 max-w-xs">
              I can take orders, make reservations, recommend menu items, and answer questions.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {QUICK_ACTIONS.map((a) => (
                <button
                  key={a.text}
                  onClick={() => sendMessage(a.text)}
                  disabled={isLoading}
                  className="flex items-center gap-1.5 rounded-full border border-coffee-200 dark:border-coffee-700 bg-white dark:bg-coffee-800 px-3 py-1.5 text-xs text-coffee-700 dark:text-cream-200 hover:bg-coffee-50 dark:hover:bg-coffee-700 hover:border-coffee-400 transition-colors"
                >
                  <span>{a.icon}</span>{a.text}
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
          <div className="mx-auto my-2 max-w-xs rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-2 text-center text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <MessageInput onSend={sendMessage} disabled={isLoading} placeholder="Ask about menu, place an order, or make a reservation…" />
    </div>
  )
}
