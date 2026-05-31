'use client'

import { useState } from 'react'
import type { Mt5Account } from '@/lib/types'

interface Props {
  accounts: Mt5Account[]
}

const STATUS_COLOR = {
  connected:     'text-emerald-400 bg-emerald-900/30',
  connecting:    'text-yellow-400 bg-yellow-900/30',
  deploy_started:'text-blue-400 bg-blue-900/30',
  disconnected:  'text-gray-400 bg-gray-800',
  error:         'text-red-400 bg-red-900/30',
} as const

export default function Mt5Manager({ accounts: initialAccounts }: Props) {
  const [accounts, setAccounts] = useState<Mt5Account[]>(initialAccounts)
  const [showForm, setShowForm] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [form, setForm] = useState({
    account_number: '',
    broker_name: '',
    server_name: '',
    password: '',
    account_type: 'demo' as 'demo' | 'live',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function addAccount() {
    if (!form.account_number || !form.broker_name || !form.server_name || !form.password) {
      setError('All fields are required')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const res  = await fetch('/api/mt5/accounts', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          account_number: parseInt(form.account_number),
          broker_name:    form.broker_name,
          server_name:    form.server_name,
          password:       form.password,
          account_type:   form.account_type,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed to add account'); return }
      setAccounts((prev) => [data.account, ...prev])
      setShowForm(false)
      setForm({ account_number: '', broker_name: '', server_name: '', password: '', account_type: 'demo' })
    } finally {
      setSubmitting(false)
    }
  }

  async function deleteAccount(id: string) {
    setDeleting(id)
    try {
      await fetch(`/api/mt5/accounts?id=${id}`, { method: 'DELETE' })
      setAccounts((prev) => prev.filter((a) => a.id !== id))
    } finally {
      setDeleting(null)
    }
  }

  const inputClass = 'w-full rounded-xl bg-gray-800 border border-gray-700 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none'

  return (
    <div className="rounded-2xl bg-gray-900 border border-gray-800 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
        <h2 className="text-base font-semibold text-white">Connected Accounts</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs font-semibold text-white transition-colors"
        >
          + Add Account
        </button>
      </div>

      {showForm && (
        <div className="border-b border-gray-800 p-6 space-y-4 bg-gray-800/30">
          <p className="text-sm font-semibold text-white">Add MT5 Account</p>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Account Number</label>
              <input type="number" placeholder="12345678" value={form.account_number}
                onChange={(e) => setForm((f) => ({ ...f, account_number: e.target.value }))}
                className={inputClass} />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Account Type</label>
              <select value={form.account_type}
                onChange={(e) => setForm((f) => ({ ...f, account_type: e.target.value as 'demo' | 'live' }))}
                className={inputClass}>
                <option value="demo">Demo</option>
                <option value="live">Live</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Broker Name</label>
              <input type="text" placeholder="ICMarkets" value={form.broker_name}
                onChange={(e) => setForm((f) => ({ ...f, broker_name: e.target.value }))}
                className={inputClass} />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Server Name</label>
              <input type="text" placeholder="ICMarkets-Demo02" value={form.server_name}
                onChange={(e) => setForm((f) => ({ ...f, server_name: e.target.value }))}
                className={inputClass} />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-gray-400 mb-1">MT5 Password</label>
              <input type="password" placeholder="••••••••" value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                className={inputClass} />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={addAccount} disabled={submitting}
              className="rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition-colors disabled:opacity-50">
              {submitting ? 'Connecting…' : 'Connect Account'}
            </button>
            <button onClick={() => setShowForm(false)}
              className="rounded-xl bg-gray-700 hover:bg-gray-600 px-4 py-2 text-sm text-gray-300 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {accounts.length === 0 && !showForm ? (
        <div className="flex flex-col items-center justify-center py-14 text-gray-500">
          <div className="text-4xl mb-3">📈</div>
          <p className="text-sm">No MT5 accounts connected</p>
          <p className="text-xs mt-1">Add your first account to enable auto-trading</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-800">
          {accounts.map((acc) => {
            const statusKey = acc.sync_status as keyof typeof STATUS_COLOR
            const statusColor = STATUS_COLOR[statusKey] ?? STATUS_COLOR.disconnected
            return (
              <div key={acc.id} className="flex items-center justify-between p-5 hover:bg-gray-800/30 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`h-2.5 w-2.5 rounded-full ${acc.sync_status === 'connected' ? 'bg-emerald-400 animate-pulse' : acc.sync_status === 'error' ? 'bg-red-400' : 'bg-gray-500'}`} />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-white">{acc.broker_name}</p>
                      <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase ${acc.account_type === 'live' ? 'bg-amber-900/40 text-amber-300' : 'bg-gray-700 text-gray-400'}`}>
                        {acc.account_type}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">{acc.server_name} · #{acc.account_number}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {acc.balance != null && (
                    <div className="text-right">
                      <p className="text-sm font-semibold text-white">${acc.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                      <p className="text-[10px] text-gray-500">Balance</p>
                    </div>
                  )}
                  <span className={`rounded-lg px-2 py-1 text-[10px] font-semibold ${statusColor}`}>
                    {acc.sync_status}
                  </span>
                  <button
                    onClick={() => deleteAccount(acc.id)}
                    disabled={deleting === acc.id}
                    className="rounded-lg bg-red-900/20 hover:bg-red-900/40 px-2 py-1 text-[10px] text-red-400 transition-colors disabled:opacity-50"
                  >
                    {deleting === acc.id ? '…' : 'Remove'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
