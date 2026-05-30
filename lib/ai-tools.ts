import { formatMenuForAI } from './menu-data'

// ─── OpenAI tool definitions ─────────────────────────────────────────────────

export const AI_TOOLS = [
  {
    type: 'function' as const,
    function: {
      name: 'take_order',
      description:
        'Place a food/drink order for the customer. Call this ONLY after the customer has confirmed what they want and you have quoted the total.',
      parameters: {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name:       { type: 'string',  description: 'Menu item name' },
                quantity:   { type: 'integer', minimum: 1 },
                unit_price: { type: 'integer', description: 'Price per unit in UGX' },
                notes:      { type: 'string',  description: 'Special instructions (optional)' },
              },
              required: ['name', 'quantity', 'unit_price'],
            },
          },
          total: { type: 'integer', description: 'Total amount in UGX' },
          notes: { type: 'string',  description: 'General order notes (optional)' },
        },
        required: ['items', 'total'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'make_reservation',
      description:
        'Create a table reservation. Call this ONLY after confirming all required details with the customer.',
      parameters: {
        type: 'object',
        properties: {
          customer_name:  { type: 'string' },
          customer_phone: { type: 'string', description: 'Phone number (optional)' },
          party_size:     { type: 'integer', minimum: 1, maximum: 20 },
          date:           { type: 'string',  description: 'Date in YYYY-MM-DD format' },
          time:           { type: 'string',  description: 'Time in HH:MM 24-hour format' },
          notes:          { type: 'string',  description: 'Special requests or dietary needs (optional)' },
        },
        required: ['customer_name', 'party_size', 'date', 'time'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_menu',
      description: 'Retrieve the café menu items, optionally filtered by category.',
      parameters: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            enum: ['All', 'Coffee', 'Tea', 'Cold Drinks', 'Pastries', 'Food'],
          },
        },
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_faq',
      description: 'Get answers to frequently asked questions about the café.',
      parameters: {
        type: 'object',
        properties: {
          topic: {
            type: 'string',
            enum: ['hours', 'location', 'wifi', 'parking', 'dietary', 'loyalty', 'payment', 'events', 'policies'],
          },
        },
        required: ['topic'],
      },
    },
  },
] as const

// ─── Argument types ──────────────────────────────────────────────────────────

export interface TakeOrderArgs {
  items: Array<{ name: string; quantity: number; unit_price: number; notes?: string }>
  total: number
  notes?: string
}

export interface MakeReservationArgs {
  customer_name: string
  customer_phone?: string
  party_size: number
  date: string
  time: string
  notes?: string
}

export interface GetMenuArgs {
  category?: 'All' | 'Coffee' | 'Tea' | 'Cold Drinks' | 'Pastries' | 'Food'
}

export interface GetFaqArgs {
  topic: 'hours' | 'location' | 'wifi' | 'parking' | 'dietary' | 'loyalty' | 'payment' | 'events' | 'policies'
}

// ─── Pure tool handlers (no DB access) ──────────────────────────────────────

const FAQ: Record<GetFaqArgs['topic'], string> = {
  hours:
    'Ayam Café is open Monday–Friday 7:00 AM – 10:00 PM, Saturday 8:00 AM – 11:00 PM, and Sunday 9:00 AM – 8:00 PM.',
  location:
    'We are at Plot 45 Kampala Road, Central Business District, Kampala, Uganda — next to the main bus park.',
  wifi:
    'Free high-speed Wi-Fi (50 Mbps) for all customers. Network: AyamCafe_Guest | Password: coffee2024.',
  parking:
    'Complimentary parking for up to 2 hours with café validation. 20 spaces behind the building.',
  dietary:
    'We offer vegan, vegetarian, and gluten-free options. Please mention allergies when ordering — our kitchen handles nuts, dairy, and gluten.',
  loyalty:
    'Loyalty programme: earn 1 point per UGX 1,000 spent. Bronze 0–99 pts (birthday discount), Silver 100–499 pts (5% off + free birthday drink), Gold 500+ pts (10% off + priority service + free monthly pastry). Buy 9 drinks, get the 10th free!',
  payment:
    'We accept Cash, Visa/Mastercard, MTN Mobile Money, and Airtel Money. Minimum card/mobile-money transaction: UGX 5,000.',
  events:
    'Live acoustic music every Friday 7–10 PM. Sunday brunch specials 9 AM–2 PM. Private event bookings available for groups of 15+ — ask our staff.',
  policies:
    'No outside food or drinks. Well-behaved pets welcome on the terrace. Study/work tables limited to 2 hours during peak hours (12–2 PM weekdays). 10% service charge for groups of 8+.',
}

export function executeFaq(args: GetFaqArgs): string {
  return FAQ[args.topic] ?? "I don't have specific information on that. Please ask our staff directly."
}

export function executeGetMenu(args: GetMenuArgs): string {
  return formatMenuForAI(args.category)
}
