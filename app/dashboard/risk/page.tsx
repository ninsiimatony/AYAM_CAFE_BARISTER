import { createClient } from '@/lib/supabase/server'
import { redirect }     from 'next/navigation'
import RiskCalculator   from '@/components/risk/RiskCalculator'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Risk Calculator — TONY ELITE AI' }

export default async function RiskPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('risk_per_trade_pct')
    .eq('id', user.id)
    .single()

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Risk Calculator</h1>
        <p className="text-sm text-gray-400 mt-0.5">Professional position sizing — never risk more than you plan</p>
      </div>
      <RiskCalculator defaultRiskPct={profile?.risk_per_trade_pct ?? 1} />
    </div>
  )
}
