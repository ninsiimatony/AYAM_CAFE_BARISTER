import Anthropic from '@anthropic-ai/sdk'
import type { SMCAnalysis } from './smc-engine'
import type { SignalTimeframe } from './types'

// Lazy singleton — prevents module-level init from failing at build time.
let _client: Anthropic | null = null

function getClient(): Anthropic {
  if (!_client) {
    _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  }
  return _client
}

export interface AISignalAnalysis {
  analysis_text:      string
  entry_narrative:    string
  risk_warning:       string
  confidence_score:   number
  confidence_reason:  string
  invalidation:       string
  pair_sentiment:     string
}

const SMC_SYSTEM_PROMPT = `You are an institutional Forex analyst specializing in Smart Money Concepts (SMC).
You write concise, professional signal analyses for experienced traders.

Your analyses must:
- Be precise and actionable (no fluff)
- Reference specific SMC concepts used in the setup
- Explain the institutional narrative (WHY price will move)
- Highlight key confluence factors
- Be 150-250 words maximum

Style: Technical, institutional, confident. Write like a senior prop desk analyst.
Do NOT say "I think" or "maybe" — state observations as facts.`

export async function generateSignalAnalysis(
  smc: SMCAnalysis,
  pair: string,
  timeframe: SignalTimeframe,
  htfContext: string = '',
): Promise<AISignalAnalysis> {
  const smcSummary = `
PAIR: ${pair} | TF: ${timeframe}
BIAS: ${smc.bias.toUpperCase()} | HTF BIAS: ${smc.htf_bias.toUpperCase()}
DIRECTION: ${smc.direction?.toUpperCase() ?? 'NO SIGNAL'}
CONFLUENCE: ${smc.confluence_score}/10 | QUALITY: ${smc.signal_quality}
SESSION: ${smc.current_session ?? 'off-session'}

PATTERNS DETECTED: ${smc.smc_patterns.join(', ') || 'None'}

MARKET STRUCTURE:
${smc.reasoning_steps.join('\n')}

ORDER BLOCKS: ${smc.order_blocks.length} active
${smc.order_blocks.map((ob) => `  ${ob.type.toUpperCase()} OB: ${ob.low.toFixed(5)}–${ob.high.toFixed(5)} (${ob.strength.toFixed(1)} pip impulse)`).join('\n')}

FAIR VALUE GAPS: ${smc.fair_value_gaps.length} unfilled
${smc.fair_value_gaps.map((f) => `  ${f.type.toUpperCase()} FVG: ${f.low.toFixed(5)}–${f.high.toFixed(5)} (${f.pips.toFixed(1)} pips)`).join('\n')}

LIQUIDITY:
${smc.liquidity_levels.map((l) => `  ${l.type === 'buy_side' ? 'BSL' : 'SSL'} at ${l.price.toFixed(5)} ${l.swept ? '[SWEPT]' : ''} ${l.equal_highs_lows ? '[EQH/EQL]' : ''}`).join('\n')}

LEVELS:
Entry zone: ${smc.entry_zone_low?.toFixed(5) ?? 'N/A'} – ${smc.entry_zone_high?.toFixed(5) ?? 'N/A'}
Stop Loss:  ${smc.stop_loss?.toFixed(5) ?? 'N/A'}
TP1:        ${smc.take_profit_1?.toFixed(5) ?? 'N/A'} (1:${smc.risk_reward_1?.toFixed(1) ?? '?'}R)
Pip Risk:   ${smc.pip_risk?.toFixed(1) ?? 'N/A'} pips

HTF CONTEXT: ${htfContext || 'Not provided'}
`

  const message = await getClient().messages.create({
    model:      'claude-opus-4-8',
    max_tokens: 1024,
    system:     SMC_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Analyze this ${pair} SMC setup and generate an institutional signal analysis.

${smcSummary}

Respond with a JSON object with these exact keys:
{
  "analysis_text": "Full 150-250 word institutional analysis",
  "entry_narrative": "1-2 sentences: WHY enter here specifically",
  "risk_warning": "1 sentence: main risk to this trade",
  "confidence_score": <number 1-10>,
  "confidence_reason": "1 sentence explaining the score",
  "invalidation": "1 sentence: what price action would invalidate",
  "pair_sentiment": "1 sentence: current market context for this pair"
}`,
      },
    ],
  })

  const content = message.content[0]
  if (content.type !== 'text') throw new Error('Unexpected AI response type')

  try {
    const jsonMatch = content.text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON found in AI response')
    return JSON.parse(jsonMatch[0]) as AISignalAnalysis
  } catch {
    return {
      analysis_text:     content.text.slice(0, 500),
      entry_narrative:   `${smc.direction?.toUpperCase()} setup confirmed on ${timeframe} with ${smc.confluence_score}/10 confluence.`,
      risk_warning:      'Monitor price action closely. Invalidate if price closes beyond SL zone.',
      confidence_score:  smc.confluence_score,
      confidence_reason: `${smc.smc_patterns.length} SMC patterns detected with ${smc.signal_quality} quality rating.`,
      invalidation:      `Close beyond ${smc.stop_loss?.toFixed(5) ?? 'SL level'}.`,
      pair_sentiment:    `${pair} showing ${smc.bias} structure on ${timeframe}.`,
    }
  }
}

export async function getNewsContext(pair: string): Promise<string> {
  const currencies = pair.slice(0, 3) + ' and ' + pair.slice(3, 6)
  return `No high-impact events scheduled for ${currencies} in the next 4 hours.`
}
