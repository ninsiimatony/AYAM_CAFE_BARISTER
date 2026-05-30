// ── Shared mock data & types for the cafe management dashboard ────────────────

export interface SaleRecord {
  date: string
  revenue: number
  orders: number
  avgOrder: number
}

export interface OrderItem {
  id: string
  items: string
  customer: string
  table: string | null
  barista: string
  status: 'Preparing' | 'Ready' | 'Delivered' | 'Cancelled'
  total: number
  paymentMethod: 'Cash' | 'Card' | 'Mobile Money'
  createdAt: string
}

export interface Customer {
  id: string
  name: string
  email: string
  phone: string
  totalOrders: number
  totalSpent: number
  lastVisit: string
  loyaltyPoints: number
  status: 'Active' | 'Inactive' | 'VIP'
}

export interface InventoryItem {
  id: string
  name: string
  category: string
  unit: string
  currentStock: number
  minStock: number
  maxStock: number
  unitCost: number
  supplier: string
  lastRestocked: string
}

export interface Employee {
  id: string
  name: string
  email: string
  phone: string
  role: 'Barista' | 'Cashier' | 'Supervisor' | 'Manager'
  shift: 'Morning' | 'Afternoon' | 'Evening'
  status: 'Active' | 'On Leave' | 'Off Duty'
  hireDate: string
  ordersToday: number
  rating: number
}

// ── Sales data (last 7 days) ──────────────────────────────────────────────────
export const salesData: SaleRecord[] = [
  { date: 'Mon', revenue: 312000, orders: 38, avgOrder: 8211 },
  { date: 'Tue', revenue: 287000, orders: 34, avgOrder: 8441 },
  { date: 'Wed', revenue: 395000, orders: 47, avgOrder: 8404 },
  { date: 'Thu', revenue: 421000, orders: 52, avgOrder: 8096 },
  { date: 'Fri', revenue: 518000, orders: 63, avgOrder: 8222 },
  { date: 'Sat', revenue: 672000, orders: 81, avgOrder: 8296 },
  { date: 'Sun', revenue: 489000, orders: 58, avgOrder: 8431 },
]

// ── Orders ────────────────────────────────────────────────────────────────────
export const mockOrders: OrderItem[] = [
  { id: '#1052', items: 'Cappuccino × 2 + Croissant', customer: 'Sarah K.', table: 'Table 3', barista: 'Ali Hassan', status: 'Preparing', total: 26000, paymentMethod: 'Card', createdAt: '2024-01-15T09:42:00Z' },
  { id: '#1051', items: 'Iced Latte + Brownie', customer: 'James M.', table: 'Takeaway', barista: 'Sara Nakato', status: 'Ready', total: 19000, paymentMethod: 'Mobile Money', createdAt: '2024-01-15T09:38:00Z' },
  { id: '#1050', items: 'Espresso × 3', customer: 'Walk-in', table: 'Table 7', barista: 'Ali Hassan', status: 'Delivered', total: 21000, paymentMethod: 'Cash', createdAt: '2024-01-15T09:30:00Z' },
  { id: '#1049', items: 'Flat White + Club Sandwich', customer: 'Grace A.', table: 'Table 1', barista: 'John Bosco', status: 'Delivered', total: 25000, paymentMethod: 'Card', createdAt: '2024-01-15T09:18:00Z' },
  { id: '#1048', items: 'Mocha × 2 + Cheesecake', customer: 'David O.', table: 'Table 5', barista: 'Sara Nakato', status: 'Delivered', total: 34000, paymentMethod: 'Cash', createdAt: '2024-01-15T09:05:00Z' },
  { id: '#1047', items: 'Americano + Muffin', customer: 'Aisha B.', table: 'Takeaway', barista: 'John Bosco', status: 'Cancelled', total: 14000, paymentMethod: 'Card', createdAt: '2024-01-15T08:52:00Z' },
  { id: '#1046', items: 'Cold Brew × 2', customer: 'Tom P.', table: 'Table 4', barista: 'Ali Hassan', status: 'Delivered', total: 24000, paymentMethod: 'Mobile Money', createdAt: '2024-01-15T08:40:00Z' },
  { id: '#1045', items: 'Chai Latte + Banana Bread', customer: 'Mary N.', table: 'Table 2', barista: 'Sara Nakato', status: 'Delivered', total: 16000, paymentMethod: 'Cash', createdAt: '2024-01-15T08:25:00Z' },
]

// ── Customers ─────────────────────────────────────────────────────────────────
export const mockCustomers: Customer[] = [
  { id: 'C001', name: 'Sarah Katende', email: 'sarah.k@email.com', phone: '+256 772 123456', totalOrders: 47, totalSpent: 892000, lastVisit: '2024-01-15', loyaltyPoints: 470, status: 'VIP' },
  { id: 'C002', name: 'James Mukasa', email: 'james.m@email.com', phone: '+256 700 234567', totalOrders: 23, totalSpent: 415000, lastVisit: '2024-01-14', loyaltyPoints: 230, status: 'Active' },
  { id: 'C003', name: 'Grace Achieng', email: 'grace.a@email.com', phone: '+256 755 345678', totalOrders: 61, totalSpent: 1240000, lastVisit: '2024-01-15', loyaltyPoints: 610, status: 'VIP' },
  { id: 'C004', name: 'David Ouma', email: 'david.o@email.com', phone: '+256 783 456789', totalOrders: 12, totalSpent: 198000, lastVisit: '2024-01-10', loyaltyPoints: 120, status: 'Active' },
  { id: 'C005', name: 'Aisha Babirye', email: 'aisha.b@email.com', phone: '+256 712 567890', totalOrders: 8, totalSpent: 124000, lastVisit: '2024-01-08', loyaltyPoints: 80, status: 'Active' },
  { id: 'C006', name: 'Tom Phiri', email: 'tom.p@email.com', phone: '+256 741 678901', totalOrders: 3, totalSpent: 42000, lastVisit: '2023-12-20', loyaltyPoints: 30, status: 'Inactive' },
  { id: 'C007', name: 'Mary Namukasa', email: 'mary.n@email.com', phone: '+256 776 789012', totalOrders: 29, totalSpent: 534000, lastVisit: '2024-01-13', loyaltyPoints: 290, status: 'Active' },
  { id: 'C008', name: 'Robert Kizza', email: 'robert.k@email.com', phone: '+256 703 890123', totalOrders: 54, totalSpent: 1089000, lastVisit: '2024-01-15', loyaltyPoints: 540, status: 'VIP' },
]

// ── Inventory ─────────────────────────────────────────────────────────────────
export const mockInventory: InventoryItem[] = [
  { id: 'I001', name: 'Arabica Coffee Beans', category: 'Coffee', unit: 'kg', currentStock: 12.5, minStock: 5, maxStock: 30, unitCost: 28000, supplier: 'Kyagalanyi Coffee', lastRestocked: '2024-01-12' },
  { id: 'I002', name: 'Whole Milk', category: 'Dairy', unit: 'L', currentStock: 28, minStock: 10, maxStock: 60, unitCost: 3500, supplier: 'Pearl Dairy', lastRestocked: '2024-01-14' },
  { id: 'I003', name: 'Oat Milk', category: 'Dairy', unit: 'L', currentStock: 4, minStock: 3, maxStock: 20, unitCost: 8000, supplier: 'Healthy Foods UG', lastRestocked: '2024-01-10' },
  { id: 'I004', name: 'Sugar', category: 'Sweeteners', unit: 'kg', currentStock: 18, minStock: 5, maxStock: 25, unitCost: 4000, supplier: 'Kakira Sugar', lastRestocked: '2024-01-08' },
  { id: 'I005', name: 'Vanilla Syrup', category: 'Syrups', unit: 'bottle', currentStock: 3, minStock: 2, maxStock: 12, unitCost: 22000, supplier: 'Monin Uganda', lastRestocked: '2024-01-05' },
  { id: 'I006', name: 'Croissants (frozen)', category: 'Bakery', unit: 'pcs', currentStock: 24, minStock: 10, maxStock: 50, unitCost: 4500, supplier: 'Capital Bakeries', lastRestocked: '2024-01-15' },
  { id: 'I007', name: 'Coffee Cups (12oz)', category: 'Packaging', unit: 'pcs', currentStock: 320, minStock: 100, maxStock: 500, unitCost: 600, supplier: 'Cup Solutions', lastRestocked: '2024-01-11' },
  { id: 'I008', name: 'Cocoa Powder', category: 'Coffee', unit: 'kg', currentStock: 1.8, minStock: 2, maxStock: 8, unitCost: 35000, supplier: 'Gourmet Foods UG', lastRestocked: '2024-01-07' },
]

// ── Employees ─────────────────────────────────────────────────────────────────
export const mockEmployees: Employee[] = [
  { id: 'E001', name: 'Ali Hassan', email: 'ali.h@ayamcafe.com', phone: '+256 772 100001', role: 'Barista', shift: 'Morning', status: 'Active', hireDate: '2022-03-15', ordersToday: 34, rating: 4.9 },
  { id: 'E002', name: 'Sara Nakato', email: 'sara.n@ayamcafe.com', phone: '+256 700 100002', role: 'Barista', shift: 'Morning', status: 'Active', hireDate: '2022-07-20', ordersToday: 28, rating: 4.7 },
  { id: 'E003', name: 'John Bosco', email: 'john.b@ayamcafe.com', phone: '+256 755 100003', role: 'Cashier', shift: 'Afternoon', status: 'Active', hireDate: '2023-01-10', ordersToday: 18, rating: 4.6 },
  { id: 'E004', name: 'Grace Tendo', email: 'grace.t@ayamcafe.com', phone: '+256 783 100004', role: 'Supervisor', shift: 'Morning', status: 'Active', hireDate: '2021-11-05', ordersToday: 12, rating: 4.8 },
  { id: 'E005', name: 'Peter Mugisha', email: 'peter.m@ayamcafe.com', phone: '+256 712 100005', role: 'Barista', shift: 'Evening', status: 'Active', hireDate: '2023-06-22', ordersToday: 0, rating: 4.5 },
  { id: 'E006', name: 'Faith Nambooze', email: 'faith.n@ayamcafe.com', phone: '+256 741 100006', role: 'Barista', shift: 'Afternoon', status: 'On Leave', hireDate: '2023-04-18', ordersToday: 0, rating: 4.4 },
  { id: 'E007', name: 'Denis Ssekandi', email: 'denis.s@ayamcafe.com', phone: '+256 776 100007', role: 'Manager', shift: 'Morning', status: 'Active', hireDate: '2020-09-01', ordersToday: 0, rating: 4.9 },
]

// ── Summary stats ─────────────────────────────────────────────────────────────
export const todayStats = {
  revenue: 184000,
  revenueChange: 12.4,
  orders: 24,
  ordersChange: 8.3,
  customers: 19,
  customersChange: 5.0,
  avgOrderValue: 7667,
  avgOrderChange: 3.8,
}

export function formatUGX(amount: number): string {
  return `UGX ${amount.toLocaleString()}`
}

export function stockLevel(item: InventoryItem): 'critical' | 'low' | 'good' {
  const ratio = item.currentStock / item.maxStock
  if (item.currentStock <= item.minStock) return 'critical'
  if (ratio < 0.35) return 'low'
  return 'good'
}
