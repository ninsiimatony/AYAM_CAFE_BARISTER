export type UserRole = 'admin' | 'staff' | 'customer'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: UserRole
  created_at: string
  updated_at: string
}

export interface RoleConfig {
  label: string
  color: string
  bgColor: string
  description: string
}

export const ROLE_CONFIGS: Record<UserRole, RoleConfig> = {
  admin: {
    label: 'Admin',
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    description: 'Full system access',
  },
  staff: {
    label: 'Staff',
    color: 'text-coffee-700',
    bgColor: 'bg-coffee-100',
    description: 'Staff management access',
  },
  customer: {
    label: 'Customer',
    color: 'text-caramel-600',
    bgColor: 'bg-caramel-300/30',
    description: 'Order and profile access',
  },
}

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  admin: 3,
  staff: 2,
  customer: 1,
}

export function hasRole(userRole: UserRole | null, requiredRole: UserRole): boolean {
  if (!userRole) return false
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole]
}

// ─── Chat / Auto-Reply Types ──────────────────────────────────────────────────

export type SenderType = 'customer' | 'ai' | 'staff'

export interface OrderItemLine {
  name: string
  quantity: number
  unit_price: number
  subtotal: number
  notes?: string
}

export interface OrderMetadata {
  type: 'order'
  order_id: string
  items: OrderItemLine[]
  total: number
  status: string
  notes?: string
}

export interface ReservationMetadata {
  type: 'reservation'
  reservation_id: string
  customer_name: string
  party_size: number
  date: string
  time: string
  status: string
  notes?: string
}

export type ChatMetadata = OrderMetadata | ReservationMetadata | Record<string, unknown>

export interface Message {
  id: string
  customer_id: string
  conversation_id: string
  content: string
  sender_type: SenderType
  staff_id: string | null
  is_read: boolean
  metadata: ChatMetadata | null
  created_at: string
}

// ─── Orders & Reservations ────────────────────────────────────────────────────

export interface Order {
  id: string
  customer_id: string
  conversation_id: string
  items: OrderItemLine[]
  total: number
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled'
  payment_method: string | null
  notes: string | null
  created_at: string
  updated_at: string
  profiles?: { full_name: string | null; email: string } | null
}

export interface Reservation {
  id: string
  customer_id: string | null
  conversation_id: string | null
  customer_name: string
  customer_phone: string | null
  party_size: number
  date: string
  time: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  notes: string | null
  created_at: string
  updated_at: string
}

export interface MessageWithProfile extends Message {
  customer?: Pick<Profile, 'id' | 'full_name' | 'email' | 'role'>
  staff?: Pick<Profile, 'id' | 'full_name' | 'email'>
}

export interface Conversation {
  conversation_id: string
  customer_id: string
  customer_name: string | null
  customer_email: string
  last_message: string
  last_message_at: string
  message_count: number
  unread_count: number
  messages?: Message[]
}

export interface AIConfig {
  id: number
  system_prompt: string
  auto_reply_enabled: boolean
  model: string
  temperature: number
  max_tokens: number
  updated_at: string
  updated_by: string | null
}
