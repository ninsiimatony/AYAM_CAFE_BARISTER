import type { Profile, Subscription } from '@/lib/types'
import { PLAN_CONFIGS } from '@/lib/types'
import BillingPortalButton from './BillingPortalButton'

interface Props {
  profile:      Profile
  subscription: Subscription | null
}

export default function CurrentPlanCard({ profile, subscription }: Props) {
  const tier = profile.subscription_tier
  const plan = PLAN_CONFIGS[tier]

  const statusConfig = {
    active:   { label: 'Active',       color: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' },
    trialing: { label: 'Trial',        color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
    past_due: { label: 'Payment Due',  color: 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300' },
    cancelled:{ label: 'Cancelled',    color: 'bg-gray-100 text-gray-500 dark:bg-[#111d2e] dark:text-gray-400' },
    paused:   { label: 'Paused',       color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' },
    incomplete:{ label: 'Incomplete',  color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' },
    incomplete_expired:{ label: 'Expired', color: 'bg-gray-100 text-gray-500' },
    unpaid:   { label: 'Unpaid',       color: 'bg-red-100 text-red-600' },
  } as const

  const status   = subscription?.status ?? 'active'
  const statusCfg = statusConfig[status as keyof typeof statusConfig] ?? statusConfig.active

  const periodEnd = subscription?.current_period_end
    ? new Date(subscription.current_period_end).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
      })
    : null

  const trialEnd = subscription?.trial_end
    ? new Date(subscription.trial_end).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
      })
    : null

  const trialDaysLeft = subscription?.trial_end
    ? Math.ceil((new Date(subscription.trial_end).getTime() - Date.now()) / 86_400_000)
    : null

  const tierBorder = { free: 'border-gray-200', pro: 'border-blue-400', elite: 'border-amber-400' }
  const tierIcon   = { free: '🔓', pro: '⚡', elite: '👑' }

  return (
    <div className={`rounded-2xl border-2 ${tierBorder[tier]} bg-white dark:bg-[#0d1520] p-6`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">{tierIcon[tier]}</span>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{plan.name} Plan</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusCfg.color}`}>
              {statusCfg.label}
            </span>
            {subscription?.cancel_at_period_end && (
              <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
                Cancels at period end
              </span>
            )}
          </div>
        </div>
        <div className="text-right">
          <p className="text-3xl font-extrabold text-gray-900 dark:text-white">
            {plan.price === 0 ? 'Free' : `$${plan.price}`}
          </p>
          {plan.price > 0 && <p className="text-xs text-gray-400">/month</p>}
        </div>
      </div>

      {/* Billing info */}
      <div className="grid grid-cols-2 gap-4 rounded-xl bg-gray-50 dark:bg-[#111d2e] p-4 mb-5">
        {status === 'trialing' && trialEnd && (
          <>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Trial ends</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{trialEnd}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Days remaining</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {trialDaysLeft !== null && trialDaysLeft > 0 ? `${trialDaysLeft} days` : 'Expires today'}
              </p>
            </div>
          </>
        )}
        {periodEnd && status !== 'trialing' && (
          <>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">
                {subscription?.cancel_at_period_end ? 'Access until' : 'Next billing'}
              </p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{periodEnd}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Billing cycle</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Monthly</p>
            </div>
          </>
        )}
        {!subscription && (
          <div className="col-span-2">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Free plan — upgrade anytime to unlock premium signals.
            </p>
          </div>
        )}
      </div>

      {/* Included features */}
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Included</p>
        <ul className="grid grid-cols-1 gap-1.5">
          {plan.features.slice(0, 4).map((f) => (
            <li key={f} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <svg className="h-3.5 w-3.5 shrink-0 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              {f}
            </li>
          ))}
        </ul>
      </div>

      {/* Actions */}
      {plan.price > 0 && subscription && (
        <BillingPortalButton label="Manage Billing & Cancel" />
      )}
    </div>
  )
}
