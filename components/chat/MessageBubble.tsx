import type { Message } from '@/lib/types'

interface MessageBubbleProps {
  message: Message
  customerName?: string | null
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const SENDER_STYLES = {
  customer: {
    wrapper: 'justify-end',
    bubble: 'bg-coffee-gradient text-white rounded-3xl rounded-br-md',
    label: 'text-right text-coffee-400',
    badge: null,
  },
  ai: {
    wrapper: 'justify-start',
    bubble: 'bg-white border border-coffee-100 text-coffee-900 rounded-3xl rounded-bl-md shadow-sm',
    label: 'text-left text-coffee-400',
    badge: (
      <span className="inline-flex items-center gap-1 rounded-full bg-coffee-100 px-2 py-0.5 text-xs font-semibold text-coffee-700">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
        </svg>
        AI
      </span>
    ),
  },
  staff: {
    wrapper: 'justify-start',
    bubble: 'bg-blue-50 border border-blue-200 text-blue-900 rounded-3xl rounded-bl-md shadow-sm',
    label: 'text-left text-coffee-400',
    badge: (
      <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
          <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
        </svg>
        Staff
      </span>
    ),
  },
}

export default function MessageBubble({ message, customerName }: MessageBubbleProps) {
  const style = SENDER_STYLES[message.sender_type]

  return (
    <div className={`flex ${style.wrapper} mb-3 animate-fade-in`}>
      <div className={`max-w-[78%] ${message.sender_type !== 'customer' ? 'flex flex-col items-start gap-1' : 'flex flex-col items-end gap-1'}`}>
        {/* Sender badge */}
        {style.badge && <div className="px-1">{style.badge}</div>}

        {/* Bubble */}
        <div className={`px-4 py-3 text-sm leading-relaxed ${style.bubble}`}>
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        </div>

        {/* Timestamp */}
        <p className={`text-xs px-1 ${style.label}`}>
          {message.sender_type === 'customer' && customerName
            ? `${customerName} · `
            : ''}
          {formatTime(message.created_at)}
        </p>
      </div>
    </div>
  )
}

// Animated typing indicator shown while waiting for AI
export function TypingIndicator() {
  return (
    <div className="flex justify-start mb-3">
      <div className="flex flex-col items-start gap-1">
        <span className="inline-flex items-center gap-1 rounded-full bg-coffee-100 px-2 py-0.5 text-xs font-semibold text-coffee-700">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
          </svg>
          AI
        </span>
        <div className="bg-white border border-coffee-100 rounded-3xl rounded-bl-md shadow-sm px-5 py-4">
          <div className="flex gap-1.5 items-center">
            <span className="h-2 w-2 rounded-full bg-coffee-400 animate-bounce [animation-delay:-0.3s]" />
            <span className="h-2 w-2 rounded-full bg-coffee-400 animate-bounce [animation-delay:-0.15s]" />
            <span className="h-2 w-2 rounded-full bg-coffee-400 animate-bounce" />
          </div>
        </div>
      </div>
    </div>
  )
}
