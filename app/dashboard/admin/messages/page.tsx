'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { hasRole } from '@/lib/types'
import MessageBubble from '@/components/chat/MessageBubble'
import type { Message, Conversation, AIConfig } from '@/lib/types'

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function AdminMessagesPage() {
  const { role } = useAuth()

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [replyText, setReplyText] = useState('')
  const [sending, setSending] = useState(false)
  const [loadingConvs, setLoadingConvs] = useState(true)
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [aiConfig, setAiConfig] = useState<AIConfig | null>(null)
  const [editingPrompt, setEditingPrompt] = useState(false)
  const [promptDraft, setPromptDraft] = useState('')
  const [savingConfig, setSavingConfig] = useState(false)
  const [configMsg, setConfigMsg] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'inbox' | 'config'>('inbox')
  const bottomRef = useRef<HTMLDivElement>(null)

  // ── Fetch conversations ──────────────────────────────────────────────────
  const fetchConversations = useCallback(async () => {
    setLoadingConvs(true)
    const res = await fetch('/api/admin/messages')
    if (res.ok) {
      const { conversations: convs } = await res.json()
      setConversations(convs ?? [])
    }
    setLoadingConvs(false)
  }, [])

  // ── Fetch messages for selected conversation ─────────────────────────────
  const fetchMessages = useCallback(async (conv: Conversation) => {
    setLoadingMsgs(true)
    const res = await fetch(`/api/admin/messages?conversationId=${conv.conversation_id}`)
    if (res.ok) {
      const { messages: msgs } = await res.json()
      setMessages(msgs ?? [])
      // Refresh conversation list to clear unread badge
      setConversations((prev) =>
        prev.map((c) =>
          c.conversation_id === conv.conversation_id ? { ...c, unread_count: 0 } : c
        )
      )
    }
    setLoadingMsgs(false)
  }, [])

  // ── Fetch AI config ──────────────────────────────────────────────────────
  const fetchConfig = useCallback(async () => {
    const res = await fetch('/api/admin/ai-config')
    if (res.ok) {
      const { config } = await res.json()
      setAiConfig(config)
      setPromptDraft(config?.system_prompt ?? '')
    }
  }, [])

  useEffect(() => {
    fetchConversations()
    fetchConfig()
  }, [fetchConversations, fetchConfig])

  useEffect(() => {
    if (selectedConv) fetchMessages(selectedConv)
  }, [selectedConv, fetchMessages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ── Send manual reply ────────────────────────────────────────────────────
  const sendReply = async () => {
    if (!replyText.trim() || !selectedConv || sending) return
    setSending(true)

    const res = await fetch('/api/admin/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversationId: selectedConv.conversation_id,
        customerId: selectedConv.customer_id,
        content: replyText.trim(),
      }),
    })

    if (res.ok) {
      const { message } = await res.json()
      setMessages((prev) => [...prev, message])
      setReplyText('')
    }
    setSending(false)
  }

  // ── Save AI config ───────────────────────────────────────────────────────
  const saveConfig = async (patch: Partial<AIConfig>) => {
    setSavingConfig(true)
    setConfigMsg(null)

    const res = await fetch('/api/admin/ai-config', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })

    const data = await res.json()
    if (res.ok) {
      setAiConfig(data.config)
      setEditingPrompt(false)
      setConfigMsg('Saved successfully!')
    } else {
      setConfigMsg(data.error ?? 'Save failed')
    }
    setSavingConfig(false)
    setTimeout(() => setConfigMsg(null), 3000)
  }

  if (!hasRole(role, 'staff')) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-5xl mb-4">🔒</div>
        <h1 className="text-xl font-bold text-coffee-900">Access Restricted</h1>
        <p className="text-coffee-500 mt-2">Admin or Staff role required.</p>
      </div>
    )
  }

  const totalUnread = conversations.reduce((s, c) => s + (c.unread_count ?? 0), 0)

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] animate-fade-in">
      {/* Page header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-coffee-900">Messages</h1>
          <p className="text-coffee-500 mt-0.5 text-sm">Customer conversations + AI configuration</p>
        </div>
        <div className="flex gap-2">
          {(['inbox', 'config'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                activeTab === tab
                  ? 'bg-coffee-gradient text-white shadow-coffee'
                  : 'bg-white border border-coffee-200 text-coffee-600 hover:bg-coffee-50'
              }`}
            >
              {tab === 'inbox' ? 'Inbox' : 'AI Config'}
              {tab === 'inbox' && totalUnread > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white text-xs font-bold">
                  {totalUnread > 9 ? '9+' : totalUnread}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'inbox' ? (
        <div className="flex-1 min-h-0 flex gap-4">
          {/* Conversation list */}
          <aside className="w-72 flex-shrink-0 flex flex-col rounded-2xl border border-coffee-100 bg-white overflow-hidden">
            <div className="border-b border-coffee-100 px-4 py-3">
              <h2 className="font-semibold text-coffee-900 text-sm">
                All Conversations
                {totalUnread > 0 && (
                  <span className="ml-2 rounded-full bg-red-500 text-white text-xs px-1.5 py-0.5">
                    {totalUnread}
                  </span>
                )}
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto">
              {loadingConvs ? (
                <div className="flex justify-center py-8">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-coffee-200 border-t-coffee-600" />
                </div>
              ) : conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                  <div className="text-3xl mb-2">💬</div>
                  <p className="text-sm text-coffee-400">No conversations yet</p>
                </div>
              ) : (
                conversations.map((conv) => (
                  <button
                    key={conv.conversation_id}
                    onClick={() => setSelectedConv(conv)}
                    className={`w-full text-left px-4 py-3 border-b border-coffee-50 hover:bg-coffee-50 transition-colors ${
                      selectedConv?.conversation_id === conv.conversation_id
                        ? 'bg-coffee-50 border-l-2 border-l-coffee-500'
                        : ''
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-coffee-gradient text-white text-xs font-bold flex-shrink-0">
                          {(conv.customer_name ?? conv.customer_email)?.[0]?.toUpperCase() ?? '?'}
                        </div>
                        <span className="text-sm font-medium text-coffee-900 truncate max-w-[100px]">
                          {conv.customer_name ?? conv.customer_email.split('@')[0]}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {conv.unread_count > 0 && (
                          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-coffee-600 text-white text-xs font-bold">
                            {conv.unread_count}
                          </span>
                        )}
                        <span className="text-xs text-coffee-400">{timeAgo(conv.last_message_at)}</span>
                      </div>
                    </div>
                    <p className="text-xs text-coffee-400 truncate pl-9">{conv.last_message}</p>
                  </button>
                ))
              )}
            </div>
            <div className="border-t border-coffee-100 px-4 py-2">
              <button
                onClick={fetchConversations}
                className="w-full rounded-lg py-1.5 text-xs font-medium text-coffee-500 hover:bg-coffee-50 transition-colors"
              >
                ↻ Refresh
              </button>
            </div>
          </aside>

          {/* Message thread */}
          <div className="flex-1 min-w-0 flex flex-col rounded-2xl border border-coffee-100 bg-white overflow-hidden">
            {!selectedConv ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <div className="text-5xl mb-4">💬</div>
                <h3 className="font-semibold text-coffee-800 mb-1">Select a conversation</h3>
                <p className="text-sm text-coffee-400">Choose a customer chat from the list to view and reply</p>
              </div>
            ) : (
              <>
                {/* Thread header */}
                <div className="flex items-center gap-3 border-b border-coffee-100 px-5 py-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-coffee-gradient text-white text-sm font-bold">
                    {(selectedConv.customer_name ?? selectedConv.customer_email)?.[0]?.toUpperCase() ?? '?'}
                  </div>
                  <div>
                    <p className="font-semibold text-coffee-900 text-sm">
                      {selectedConv.customer_name ?? 'Unknown'}
                    </p>
                    <p className="text-xs text-coffee-400">{selectedConv.customer_email} · {selectedConv.message_count} messages</p>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-4 py-4">
                  {loadingMsgs ? (
                    <div className="flex justify-center py-8">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-coffee-200 border-t-coffee-600" />
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <MessageBubble key={msg.id} message={msg} />
                    ))
                  )}
                  <div ref={bottomRef} />
                </div>

                {/* Staff reply input */}
                <div className="border-t border-coffee-100 px-4 py-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && sendReply()}
                      placeholder="Send a staff reply…"
                      className="flex-1 rounded-xl border border-coffee-200 bg-cream-50 px-4 py-2.5 text-sm text-coffee-900 placeholder-coffee-300 outline-none focus:border-coffee-400 focus:ring-2 focus:ring-coffee-100 transition-all"
                    />
                    <button
                      onClick={sendReply}
                      disabled={!replyText.trim() || sending}
                      className="flex items-center gap-2 rounded-xl bg-coffee-gradient px-4 py-2.5 text-sm font-semibold text-white shadow-coffee hover:brightness-110 transition-all disabled:opacity-40"
                    >
                      {sending ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                        </svg>
                      )}
                      Send
                    </button>
                  </div>
                  <p className="mt-1.5 text-xs text-coffee-400">
                    This reply will be sent as <strong>Staff</strong> and is visible to the customer.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        /* AI Config Tab */
        <div className="flex-1 overflow-y-auto space-y-5">
          {/* Auto-reply toggle */}
          <div className="dashboard-card flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-coffee-900">Auto-Reply</h2>
              <p className="text-sm text-coffee-500 mt-0.5">
                When enabled, Barista Bot instantly replies to all customer messages using OpenAI.
              </p>
            </div>
            <button
              onClick={() => saveConfig({ auto_reply_enabled: !aiConfig?.auto_reply_enabled } as Partial<AIConfig>)}
              className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${
                aiConfig?.auto_reply_enabled ? 'bg-coffee-600' : 'bg-coffee-200'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 mt-1 ${
                  aiConfig?.auto_reply_enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Model settings */}
          <div className="dashboard-card space-y-4">
            <h2 className="font-semibold text-coffee-900">Model Settings</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-medium text-coffee-600 block mb-1.5">Model</label>
                <select
                  value={aiConfig?.model ?? 'gpt-4o-mini'}
                  onChange={(e) => saveConfig({ model: e.target.value } as Partial<AIConfig>)}
                  className="w-full rounded-xl border border-coffee-200 bg-white px-3 py-2 text-sm text-coffee-900 outline-none focus:border-coffee-400 focus:ring-2 focus:ring-coffee-100"
                >
                  <option value="gpt-4o-mini">gpt-4o-mini (fast)</option>
                  <option value="gpt-4o">gpt-4o (powerful)</option>
                  <option value="gpt-3.5-turbo">gpt-3.5-turbo (legacy)</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-coffee-600 block mb-1.5">
                  Temperature <span className="text-coffee-400">({aiConfig?.temperature ?? 0.7})</span>
                </label>
                <input
                  type="range"
                  min="0" max="1" step="0.1"
                  value={aiConfig?.temperature ?? 0.7}
                  onChange={(e) => saveConfig({ temperature: parseFloat(e.target.value) } as Partial<AIConfig>)}
                  className="w-full accent-coffee-600"
                />
                <div className="flex justify-between text-xs text-coffee-400 mt-0.5">
                  <span>Precise</span><span>Creative</span>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-coffee-600 block mb-1.5">Max Tokens</label>
                <select
                  value={aiConfig?.max_tokens ?? 400}
                  onChange={(e) => saveConfig({ max_tokens: parseInt(e.target.value) } as Partial<AIConfig>)}
                  className="w-full rounded-xl border border-coffee-200 bg-white px-3 py-2 text-sm text-coffee-900 outline-none focus:border-coffee-400 focus:ring-2 focus:ring-coffee-100"
                >
                  {[200, 300, 400, 500, 600, 800].map((v) => (
                    <option key={v} value={v}>{v} tokens (~{Math.floor(v * 0.75)} words)</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* System Prompt */}
          <div className="dashboard-card space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-coffee-900">System Prompt</h2>
                <p className="text-sm text-coffee-500 mt-0.5">
                  This is the AI&apos;s persona and knowledge base. Customise it to fit your café.
                </p>
              </div>
              {!editingPrompt && (
                <button
                  onClick={() => { setEditingPrompt(true); setPromptDraft(aiConfig?.system_prompt ?? '') }}
                  className="rounded-xl border border-coffee-200 px-4 py-2 text-sm font-medium text-coffee-700 hover:bg-coffee-50 transition-colors"
                >
                  Edit
                </button>
              )}
            </div>

            {editingPrompt ? (
              <div className="space-y-3">
                <textarea
                  value={promptDraft}
                  onChange={(e) => setPromptDraft(e.target.value)}
                  rows={14}
                  className="w-full rounded-xl border border-coffee-200 bg-cream-50 px-4 py-3 text-sm text-coffee-900 font-mono outline-none focus:border-coffee-400 focus:ring-2 focus:ring-coffee-100 resize-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => saveConfig({ system_prompt: promptDraft } as Partial<AIConfig>)}
                    disabled={savingConfig}
                    className="flex items-center gap-2 rounded-xl bg-coffee-gradient px-5 py-2 text-sm font-semibold text-white shadow-coffee hover:brightness-110 disabled:opacity-60 transition-all"
                  >
                    {savingConfig && <div className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />}
                    Save Prompt
                  </button>
                  <button
                    onClick={() => setEditingPrompt(false)}
                    className="rounded-xl border border-coffee-200 px-5 py-2 text-sm font-medium text-coffee-600 hover:bg-coffee-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <pre className="rounded-xl bg-cream-50 border border-coffee-100 px-4 py-3 text-xs text-coffee-600 font-mono whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto">
                {aiConfig?.system_prompt ?? 'Loading…'}
              </pre>
            )}

            {configMsg && (
              <p className={`text-sm font-medium ${configMsg.includes('failed') || configMsg.includes('error') ? 'text-red-600' : 'text-green-600'}`}>
                {configMsg}
              </p>
            )}
          </div>

          {/* API status */}
          <div className="dashboard-card">
            <h2 className="font-semibold text-coffee-900 mb-4">API Status</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                {
                  label: 'OpenAI API Key',
                  value: process.env.NEXT_PUBLIC_OPENAI_CONFIGURED === 'true' ? 'Configured ✓' : 'Set OPENAI_API_KEY in .env.local',
                  ok: process.env.NEXT_PUBLIC_OPENAI_CONFIGURED === 'true',
                },
                { label: 'Current Model', value: aiConfig?.model ?? '—', ok: true },
                { label: 'Auto-Reply', value: aiConfig?.auto_reply_enabled ? 'Enabled' : 'Disabled', ok: !!aiConfig?.auto_reply_enabled },
                { label: 'Last Updated', value: aiConfig?.updated_at ? new Date(aiConfig.updated_at).toLocaleString() : '—', ok: true },
              ].map((item) => (
                <div key={item.label} className="flex items-start gap-3 rounded-xl bg-cream-50 px-4 py-3">
                  <div className={`mt-0.5 h-2 w-2 flex-shrink-0 rounded-full ${item.ok ? 'bg-green-400' : 'bg-yellow-400'}`} />
                  <div>
                    <p className="text-xs font-medium text-coffee-500">{item.label}</p>
                    <p className="text-sm font-semibold text-coffee-800">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
