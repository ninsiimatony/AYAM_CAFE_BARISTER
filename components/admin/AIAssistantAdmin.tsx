'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Order, Reservation, AIConfig } from '@/lib/types'

type Tab = 'overview' | 'orders' | 'reservations' | 'settings'

const ORDER_STATUSES = ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'] as const
const RES_STATUSES   = ['pending', 'confirmed', 'cancelled', 'completed'] as const

const ORDER_BADGE: Record<string, string> = {
  pending:   'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400',
  confirmed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
  preparing: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400',
  ready:     'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
  delivered: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
  cancelled: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
}

const RES_BADGE: Record<string, string> = {
  pending:   'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400',
  confirmed: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
  cancelled: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  completed: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
}

const AI_MODELS = ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo']

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-UG', { day: 'numeric', month: 'short', year: 'numeric' })
}
function formatTime(t: string) {
  const [h, m] = t.split(':').map(Number)
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
}
function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-UG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}
function shortId(id: string) { return id.slice(0, 8).toUpperCase() }

export default function AIAssistantAdmin() {
  const [tab, setTab] = useState<Tab>('overview')
  const [orders, setOrders] = useState<Order[]>([])
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [aiConfig, setAiConfig] = useState<Partial<AIConfig>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [orderFilter, setOrderFilter] = useState<string>('all')
  const [resFilter, setResFilter] = useState<string>('all')

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [ordRes, resRes, cfgRes] = await Promise.all([
        fetch('/api/orders'),
        fetch('/api/reservations'),
        fetch('/api/admin/ai-config'),
      ])
      const [ord, res, cfg] = await Promise.all([ordRes.json(), resRes.json(), cfgRes.json()])
      setOrders(ord.orders ?? [])
      setReservations(res.reservations ?? [])
      setAiConfig(cfg.config ?? cfg ?? {})
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  async function updateOrderStatus(id: string, status: string) {
    setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status: status as Order['status'] } : o))
    await fetch('/api/orders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
  }

  async function updateResStatus(id: string, status: string) {
    setReservations((prev) => prev.map((r) => r.id === id ? { ...r, status: status as Reservation['status'] } : r))
    await fetch('/api/reservations', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
  }

  async function saveSettings() {
    setSaving(true)
    setSaveMsg('')
    try {
      const res = await fetch('/api/admin/ai-config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_prompt:        aiConfig.system_prompt,
          auto_reply_enabled:   aiConfig.auto_reply_enabled,
          model:                aiConfig.model,
          temperature:          aiConfig.temperature,
          max_tokens:           aiConfig.max_tokens,
        }),
      })
      setSaveMsg(res.ok ? 'Settings saved ✓' : 'Failed to save — check permissions')
    } finally {
      setSaving(false)
      setTimeout(() => setSaveMsg(''), 3000)
    }
  }

  // ── Derived stats ──────────────────────────────────────────────────────────
  const pendingOrders = orders.filter((o) => o.status === 'pending').length
  const todayRes = reservations.filter((r) => r.date === new Date().toISOString().slice(0, 10)).length
  const filteredOrders = orderFilter === 'all' ? orders : orders.filter((o) => o.status === orderFilter)
  const filteredRes = resFilter === 'all' ? reservations : reservations.filter((r) => r.status === resFilter)

  const TABS: { id: Tab; label: string; badge?: number }[] = [
    { id: 'overview',     label: 'Overview' },
    { id: 'orders',       label: 'Orders',       badge: pendingOrders || undefined },
    { id: 'reservations', label: 'Reservations', badge: todayRes || undefined },
    { id: 'settings',     label: 'AI Settings' },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-coffee-900 dark:text-cream-100">AI Assistant</h1>
          <p className="text-coffee-500 dark:text-coffee-400 mt-1">Manage orders, reservations, and AI configuration</p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-medium ${
            aiConfig.auto_reply_enabled
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400'
              : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-400'
          }`}>
            <span className={`h-1.5 w-1.5 rounded-full ${aiConfig.auto_reply_enabled ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`} />
            AI {aiConfig.auto_reply_enabled ? 'Active' : 'Paused'}
          </div>
          <button onClick={fetchAll} className="rounded-xl border border-coffee-200 dark:border-coffee-700 bg-white dark:bg-coffee-800 p-2 text-coffee-500 hover:text-coffee-800 dark:hover:text-cream-100 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      {/* Stat strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Orders',        value: orders.length,                 icon: '☕' },
          { label: 'Pending Orders',      value: pendingOrders,                 icon: '⏳' },
          { label: "Today's Reservations", value: todayRes,                     icon: '📅' },
          { label: 'Total Reservations',  value: reservations.length,           icon: '🪑' },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <span className="text-2xl">{s.icon}</span>
            <p className="text-2xl font-bold text-coffee-900 dark:text-cream-100 mt-1">{loading ? '…' : s.value}</p>
            <p className="text-xs text-coffee-500 dark:text-coffee-400">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 rounded-2xl bg-cream-100 dark:bg-coffee-900 p-1.5 w-fit">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`relative flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all ${
              tab === t.id
                ? 'bg-white dark:bg-coffee-800 text-coffee-900 dark:text-cream-100 shadow-sm'
                : 'text-coffee-500 dark:text-coffee-400 hover:text-coffee-700 dark:hover:text-cream-200'
            }`}
          >
            {t.label}
            {t.badge ? (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-coffee-600 text-[10px] font-bold text-white">
                {t.badge}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {/* ── Overview ───────────────────────────────────────────────────────── */}
      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent orders */}
          <div className="dashboard-card">
            <h2 className="font-semibold text-coffee-900 dark:text-cream-100 mb-4">Recent Orders</h2>
            {loading ? <p className="text-sm text-coffee-400">Loading…</p> : orders.length === 0 ? (
              <p className="text-sm text-coffee-400 text-center py-6">No orders yet</p>
            ) : (
              <div className="space-y-2">
                {orders.slice(0, 5).map((o) => (
                  <div key={o.id} className="flex items-center justify-between rounded-xl bg-cream-50 dark:bg-coffee-800 px-3 py-2.5">
                    <div>
                      <p className="text-sm font-medium text-coffee-900 dark:text-cream-100">
                        {o.items[0]?.name ?? 'Order'}{o.items.length > 1 ? ` +${o.items.length - 1}` : ''}
                      </p>
                      <p className="text-xs text-coffee-400">#{shortId(o.id)} · {formatDateTime(o.created_at)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ORDER_BADGE[o.status]}`}>
                        {o.status}
                      </span>
                      <span className="text-xs font-semibold text-coffee-700 dark:text-cream-300">
                        UGX {o.total.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming reservations */}
          <div className="dashboard-card">
            <h2 className="font-semibold text-coffee-900 dark:text-cream-100 mb-4">Upcoming Reservations</h2>
            {loading ? <p className="text-sm text-coffee-400">Loading…</p> : reservations.length === 0 ? (
              <p className="text-sm text-coffee-400 text-center py-6">No reservations yet</p>
            ) : (
              <div className="space-y-2">
                {reservations.filter((r) => r.status !== 'cancelled' && r.status !== 'completed').slice(0, 5).map((r) => (
                  <div key={r.id} className="flex items-center justify-between rounded-xl bg-cream-50 dark:bg-coffee-800 px-3 py-2.5">
                    <div>
                      <p className="text-sm font-medium text-coffee-900 dark:text-cream-100">{r.customer_name}</p>
                      <p className="text-xs text-coffee-400">
                        {r.party_size} guests · {formatDate(r.date)} {formatTime(r.time)}
                      </p>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${RES_BADGE[r.status]}`}>
                      {r.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Orders ─────────────────────────────────────────────────────────── */}
      {tab === 'orders' && (
        <div className="dashboard-card">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-coffee-900 dark:text-cream-100">All Orders</h2>
            <div className="flex gap-1.5 flex-wrap">
              {['all', ...ORDER_STATUSES].map((s) => (
                <button
                  key={s}
                  onClick={() => setOrderFilter(s)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    orderFilter === s
                      ? 'bg-coffee-600 text-white'
                      : 'bg-cream-100 dark:bg-coffee-800 text-coffee-600 dark:text-coffee-400 hover:bg-coffee-100 dark:hover:bg-coffee-700'
                  }`}
                >
                  {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <p className="text-sm text-coffee-400 text-center py-10">Loading…</p>
          ) : filteredOrders.length === 0 ? (
            <p className="text-sm text-coffee-400 text-center py-10">No orders match this filter</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-coffee-100 dark:border-coffee-800">
                    {['Ref', 'Items', 'Total', 'Status', 'Time', 'Action'].map((h) => (
                      <th key={h} className="pb-3 text-left font-medium text-coffee-500 dark:text-coffee-400 pr-4 whitespace-nowrap text-xs">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-coffee-50 dark:divide-coffee-800">
                  {filteredOrders.map((o) => (
                    <tr key={o.id} className="hover:bg-cream-50 dark:hover:bg-coffee-800/60 transition-colors">
                      <td className="py-3 pr-4 font-mono text-xs text-coffee-500 dark:text-coffee-400">#{shortId(o.id)}</td>
                      <td className="py-3 pr-4">
                        <p className="font-medium text-coffee-900 dark:text-cream-100">
                          {o.items[0]?.name ?? 'Item'}{o.items.length > 1 ? ` +${o.items.length - 1}` : ''}
                        </p>
                        <p className="text-xs text-coffee-400">{o.items.map(i => `${i.quantity}×${i.name}`).join(', ')}</p>
                      </td>
                      <td className="py-3 pr-4 font-semibold text-coffee-900 dark:text-cream-100 whitespace-nowrap">
                        UGX {o.total.toLocaleString()}
                      </td>
                      <td className="py-3 pr-4">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ORDER_BADGE[o.status]}`}>
                          {o.status}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-xs text-coffee-400 whitespace-nowrap">{formatDateTime(o.created_at)}</td>
                      <td className="py-3">
                        <select
                          value={o.status}
                          onChange={(e) => updateOrderStatus(o.id, e.target.value)}
                          className="rounded-lg border border-coffee-200 dark:border-coffee-700 bg-white dark:bg-coffee-800 px-2 py-1 text-xs text-coffee-700 dark:text-cream-200 focus:outline-none focus:ring-2 focus:ring-coffee-400"
                        >
                          {ORDER_STATUSES.map((s) => (
                            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Reservations ───────────────────────────────────────────────────── */}
      {tab === 'reservations' && (
        <div className="dashboard-card">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-coffee-900 dark:text-cream-100">All Reservations</h2>
            <div className="flex gap-1.5 flex-wrap">
              {['all', ...RES_STATUSES].map((s) => (
                <button
                  key={s}
                  onClick={() => setResFilter(s)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    resFilter === s
                      ? 'bg-coffee-600 text-white'
                      : 'bg-cream-100 dark:bg-coffee-800 text-coffee-600 dark:text-coffee-400 hover:bg-coffee-100 dark:hover:bg-coffee-700'
                  }`}
                >
                  {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <p className="text-sm text-coffee-400 text-center py-10">Loading…</p>
          ) : filteredRes.length === 0 ? (
            <p className="text-sm text-coffee-400 text-center py-10">No reservations match this filter</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-coffee-100 dark:border-coffee-800">
                    {['Ref', 'Guest', 'Party', 'Date & Time', 'Status', 'Notes', 'Action'].map((h) => (
                      <th key={h} className="pb-3 text-left font-medium text-coffee-500 dark:text-coffee-400 pr-4 whitespace-nowrap text-xs">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-coffee-50 dark:divide-coffee-800">
                  {filteredRes.map((r) => (
                    <tr key={r.id} className="hover:bg-cream-50 dark:hover:bg-coffee-800/60 transition-colors">
                      <td className="py-3 pr-4 font-mono text-xs text-coffee-500 dark:text-coffee-400">#{shortId(r.id)}</td>
                      <td className="py-3 pr-4">
                        <p className="font-medium text-coffee-900 dark:text-cream-100">{r.customer_name}</p>
                        {r.customer_phone && <p className="text-xs text-coffee-400">{r.customer_phone}</p>}
                      </td>
                      <td className="py-3 pr-4 text-center text-coffee-700 dark:text-cream-200 font-semibold">{r.party_size}</td>
                      <td className="py-3 pr-4 whitespace-nowrap">
                        <p className="text-sm text-coffee-800 dark:text-cream-200">{formatDate(r.date)}</p>
                        <p className="text-xs text-coffee-400">{formatTime(r.time)}</p>
                      </td>
                      <td className="py-3 pr-4">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${RES_BADGE[r.status]}`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-xs text-coffee-400 max-w-[120px] truncate">{r.notes ?? '—'}</td>
                      <td className="py-3">
                        <select
                          value={r.status}
                          onChange={(e) => updateResStatus(r.id, e.target.value)}
                          className="rounded-lg border border-coffee-200 dark:border-coffee-700 bg-white dark:bg-coffee-800 px-2 py-1 text-xs text-coffee-700 dark:text-cream-200 focus:outline-none focus:ring-2 focus:ring-coffee-400"
                        >
                          {RES_STATUSES.map((s) => (
                            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── AI Settings ────────────────────────────────────────────────────── */}
      {tab === 'settings' && (
        <div className="max-w-2xl space-y-6">
          {/* Auto-reply toggle */}
          <div className="dashboard-card">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-coffee-900 dark:text-cream-100">Auto-Reply</h3>
                <p className="text-sm text-coffee-500 dark:text-coffee-400 mt-0.5">
                  When off, customer messages are queued for staff reply
                </p>
              </div>
              <button
                onClick={() => setAiConfig((prev) => ({ ...prev, auto_reply_enabled: !prev.auto_reply_enabled }))}
                className={`relative h-7 w-12 rounded-full transition-colors ${aiConfig.auto_reply_enabled ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}
              >
                <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-md transition-transform ${aiConfig.auto_reply_enabled ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>

          {/* Model + params */}
          <div className="dashboard-card space-y-5">
            <h3 className="font-semibold text-coffee-900 dark:text-cream-100">Model Configuration</h3>

            <div>
              <label className="block text-xs font-medium text-coffee-500 dark:text-coffee-400 mb-1.5">Model</label>
              <select
                value={aiConfig.model ?? 'gpt-4o-mini'}
                onChange={(e) => setAiConfig((prev) => ({ ...prev, model: e.target.value }))}
                className="w-full rounded-xl border border-coffee-200 dark:border-coffee-700 bg-white dark:bg-coffee-800 px-3 py-2 text-sm text-coffee-900 dark:text-cream-100 focus:outline-none focus:ring-2 focus:ring-coffee-400"
              >
                {AI_MODELS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-coffee-500 dark:text-coffee-400 mb-1.5">
                Temperature — <span className="text-coffee-800 dark:text-cream-200 font-semibold">{aiConfig.temperature?.toFixed(1) ?? '0.7'}</span>
                <span className="text-coffee-400 ml-1">(0 = focused, 1 = creative)</span>
              </label>
              <input
                type="range" min="0" max="1" step="0.1"
                value={aiConfig.temperature ?? 0.7}
                onChange={(e) => setAiConfig((prev) => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                className="w-full accent-coffee-600"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-coffee-500 dark:text-coffee-400 mb-1.5">Max Response Tokens</label>
              <select
                value={aiConfig.max_tokens ?? 500}
                onChange={(e) => setAiConfig((prev) => ({ ...prev, max_tokens: parseInt(e.target.value) }))}
                className="w-full rounded-xl border border-coffee-200 dark:border-coffee-700 bg-white dark:bg-coffee-800 px-3 py-2 text-sm text-coffee-900 dark:text-cream-100 focus:outline-none focus:ring-2 focus:ring-coffee-400"
              >
                {[200, 300, 400, 500, 700, 1000].map((v) => <option key={v} value={v}>{v} tokens</option>)}
              </select>
            </div>
          </div>

          {/* System prompt */}
          <div className="dashboard-card">
            <h3 className="font-semibold text-coffee-900 dark:text-cream-100 mb-3">System Prompt</h3>
            <textarea
              rows={12}
              value={aiConfig.system_prompt ?? ''}
              onChange={(e) => setAiConfig((prev) => ({ ...prev, system_prompt: e.target.value }))}
              className="w-full rounded-xl border border-coffee-200 dark:border-coffee-700 bg-cream-50 dark:bg-coffee-800 px-4 py-3 text-sm text-coffee-900 dark:text-cream-100 font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-coffee-400 resize-y"
              placeholder="Enter the AI system prompt…"
            />
            <p className="text-xs text-coffee-400 mt-2">
              This instructs the AI on its persona, capabilities, and behaviour.
            </p>
          </div>

          {/* Save */}
          <div className="flex items-center gap-4">
            <button
              onClick={saveSettings}
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-coffee-gradient px-5 py-2.5 text-sm font-semibold text-white shadow-coffee hover:brightness-110 transition-all disabled:opacity-60"
            >
              {saving ? (
                <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />Saving…</>
              ) : 'Save Settings'}
            </button>
            {saveMsg && (
              <span className={`text-sm ${saveMsg.includes('✓') ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                {saveMsg}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
