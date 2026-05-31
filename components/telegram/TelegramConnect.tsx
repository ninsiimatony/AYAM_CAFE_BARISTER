'use client'

import { useState } from 'react'
import type { TelegramAccount, SubscriptionTier } from '@/lib/types'

interface Props {
  account: TelegramAccount | null
  tier: SubscriptionTier
}

export default function TelegramConnect({ account, tier }: Props) {
  const [loading, setLoading] = useState(false)
  const [token,   setToken]   = useState<string | null>(null)
  const [botUrl,  setBotUrl]  = useState<string | null>(null)
  const [copied,  setCopied]  = useState(false)

  async function generateLink() {
    setLoading(true)
    try {
      const res  = await fetch('/api/telegram/link', { method: 'POST' })
      const data = await res.json()
      if (data.token) { setToken(data.token); setBotUrl(data.bot_url) }
    } finally {
      setLoading(false)
    }
  }

  async function copyToken() {
    if (!token) return
    await navigator.clipboard.writeText(token)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (account?.is_verified) {
    return (
      <div className="rounded-2xl bg-[#0d1520] border border-white/[0.07] p-6 space-y-4">
        {/* Connected status */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-xl">
            ✈
          </div>
          <div>
            <p className="font-semibold text-white">
              {account.telegram_first_name
                ? `${account.telegram_first_name}${account.telegram_last_name ? ' ' + account.telegram_last_name : ''}`
                : `User ${account.telegram_user_id}`}
            </p>
            <p className="text-xs text-emerald-400">Connected · Verified</p>
          </div>
        </div>

        {/* Channel access */}
        <div className="grid grid-cols-2 gap-3">
          <div className={`rounded-xl p-3 border ${account.pro_channel_member ? 'border-blue-700/50 bg-blue-900/20' : 'border-white/[0.09] bg-white/[0.04]'}`}>
            <p className="text-xs text-gray-400 mb-0.5">Pro Channel</p>
            <p className={`text-sm font-semibold ${account.pro_channel_member ? 'text-blue-300' : 'text-gray-500'}`}>
              {account.pro_channel_member ? '✓ Joined' : '✗ Not joined'}
            </p>
          </div>
          <div className={`rounded-xl p-3 border ${account.elite_channel_member ? 'border-amber-700/50 bg-amber-900/20' : 'border-white/[0.09] bg-white/[0.04]'}`}>
            <p className="text-xs text-gray-400 mb-0.5">Elite Channel</p>
            <p className={`text-sm font-semibold ${account.elite_channel_member ? 'text-amber-300' : 'text-gray-500'}`}>
              {account.elite_channel_member ? '✓ Joined' : (tier === 'elite' ? 'Invite pending' : '✗ Not eligible')}
            </p>
          </div>
        </div>

        {/* Notification prefs */}
        <div className="rounded-xl bg-white/[0.05] p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Notifications Active</p>
          <div className="flex flex-wrap gap-2">
            {account.signal_notifications && <Badge label="Signal Alerts" />}
            {account.tp_sl_updates        && <Badge label="TP / SL Updates" />}
            {account.news_alerts          && <Badge label="News Events" />}
          </div>
        </div>

        <p className="text-xs text-gray-500">
          Verified {account.verified_at ? new Date(account.verified_at).toLocaleDateString() : ''}
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl bg-[#0d1520] border border-white/[0.07] p-6 space-y-5">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-full bg-[#111d2e] flex items-center justify-center text-xl shrink-0">✈</div>
        <div>
          <p className="font-semibold text-white">Connect Telegram</p>
          <p className="text-xs text-gray-400 mt-0.5">Link your Telegram account to get instant signal alerts</p>
        </div>
      </div>

      {!token ? (
        <div className="space-y-3">
          <div className="rounded-xl bg-white/[0.05] p-4 text-sm text-gray-300 space-y-2">
            <p className="font-medium text-white text-xs uppercase tracking-wider mb-2">How to connect</p>
            <p className="text-xs text-gray-400">1. Click "Generate Link Token" below</p>
            <p className="text-xs text-gray-400">2. Open the Tony AI bot in Telegram</p>
            <p className="text-xs text-gray-400">3. Send the token via /link command</p>
            <p className="text-xs text-gray-400">4. Bot will send you channel invite links</p>
          </div>
          <button
            onClick={generateLink}
            disabled={loading}
            className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 py-3 text-sm font-semibold text-white transition-colors disabled:opacity-50"
          >
            {loading ? 'Generating…' : 'Generate Link Token'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-xl bg-emerald-900/20 border border-emerald-800/40 p-4">
            <p className="text-xs text-emerald-400 font-medium mb-2">Token generated — expires in 15 minutes</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded-lg bg-[#111d2e] px-3 py-2 text-sm font-mono text-white break-all">{token}</code>
              <button
                onClick={copyToken}
                className="shrink-0 rounded-lg bg-gray-700 hover:bg-gray-600 px-3 py-2 text-xs text-gray-300 transition-colors"
              >
                {copied ? '✓' : 'Copy'}
              </button>
            </div>
          </div>

          {botUrl && (
            <a
              href={botUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full rounded-xl bg-[#2AABEE] hover:bg-[#229ED9] py-3 text-sm font-semibold text-white transition-colors"
            >
              <span>Open Tony AI Bot in Telegram</span>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          )}

          <p className="text-xs text-gray-500 text-center">
            In the bot, send: <code className="text-gray-300">/link {token}</code>
          </p>
        </div>
      )}
    </div>
  )
}

function Badge({ label }: { label: string }) {
  return (
    <span className="rounded-md bg-gray-700 px-2 py-0.5 text-[10px] font-medium text-gray-300">{label}</span>
  )
}
