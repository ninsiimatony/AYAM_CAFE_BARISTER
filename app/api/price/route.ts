import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const apiKey = process.env.TWELVE_DATA_API_KEY
  if (!apiKey) {
    return NextResponse.json({ symbol: 'XAUUSD', price: null, error: 'No API key' })
  }
  try {
    const res = await fetch(
      `https://api.twelvedata.com/price?symbol=XAU/USD&apikey=${apiKey}`,
      { next: { revalidate: 0 } }
    )
    const data = await res.json()
    return NextResponse.json({ symbol: 'XAUUSD', price: data.price ? parseFloat(data.price) : null })
  } catch {
    return NextResponse.json({ symbol: 'XAUUSD', price: null, error: 'Fetch failed' })
  }
}
