import { CartProvider } from '@/contexts/CartContext'

export const metadata = {
  title: 'AYAM Café — Menu',
  description: 'Order from our menu',
}

export default function MenuLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <div className="min-h-screen bg-stone-50">{children}</div>
    </CartProvider>
  )
}
