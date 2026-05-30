'use client'

import { useState, useRef, useEffect } from 'react'

interface MessageInputProps {
  onSend: (message: string) => void
  disabled?: boolean
  placeholder?: string
}

export default function MessageInput({ onSend, disabled = false, placeholder = 'Type your message…' }: MessageInputProps) {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 140) + 'px'
  }, [value])

  const handleSend = () => {
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setValue('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const charLimit = 500
  const nearLimit = value.length > charLimit * 0.85

  return (
    <div className="border-t border-coffee-100 bg-white px-4 py-3">
      <div className="flex items-end gap-2 rounded-2xl border border-coffee-200 bg-cream-50 px-4 py-2 focus-within:border-coffee-400 focus-within:ring-2 focus-within:ring-coffee-100 transition-all">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value.slice(0, charLimit))}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          rows={1}
          className="flex-1 resize-none bg-transparent text-sm text-coffee-900 placeholder-coffee-300 outline-none py-1 disabled:opacity-50"
        />
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          {nearLimit && (
            <span className={`text-xs ${value.length >= charLimit ? 'text-red-500' : 'text-coffee-400'}`}>
              {value.length}/{charLimit}
            </span>
          )}
          <button
            onClick={handleSend}
            disabled={!value.trim() || disabled}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-coffee-gradient text-white shadow-coffee transition-all hover:brightness-110 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          </button>
        </div>
      </div>
      <p className="mt-1.5 text-center text-xs text-coffee-300">
        Press <kbd className="rounded bg-coffee-100 px-1 py-0.5 text-coffee-500 font-mono">Enter</kbd> to send · <kbd className="rounded bg-coffee-100 px-1 py-0.5 text-coffee-500 font-mono">Shift+Enter</kbd> for new line
      </p>
    </div>
  )
}
