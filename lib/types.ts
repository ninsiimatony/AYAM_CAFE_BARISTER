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
