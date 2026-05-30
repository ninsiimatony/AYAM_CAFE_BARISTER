export interface MenuItem {
  id: string
  name: string
  category: 'Coffee' | 'Tea' | 'Cold Drinks' | 'Pastries' | 'Food'
  price: number // UGX
  description: string
  tags: string[]
  popular?: boolean
}

export const menu: MenuItem[] = [
  // ─── Coffee ───────────────────────────────────────────────────────────
  { id: 'esp',  name: 'Espresso',       category: 'Coffee', price: 7000,  description: 'Classic rich double shot',            tags: ['hot', 'strong', 'classic'] },
  { id: 'ame',  name: 'Americano',      category: 'Coffee', price: 7000,  description: 'Espresso topped with hot water',       tags: ['hot', 'mild', 'classic'] },
  { id: 'cap',  name: 'Cappuccino',     category: 'Coffee', price: 9000,  description: 'Espresso, steamed milk & velvety foam', tags: ['hot', 'classic', 'popular'], popular: true },
  { id: 'lat',  name: 'Latte',          category: 'Coffee', price: 10000, description: 'Espresso with lots of steamed milk',   tags: ['hot', 'mild', 'popular'], popular: true },
  { id: 'fw',   name: 'Flat White',     category: 'Coffee', price: 9000,  description: 'Double ristretto with silky microfoam', tags: ['hot', 'strong', 'smooth'] },
  { id: 'moc',  name: 'Mocha',          category: 'Coffee', price: 11000, description: 'Espresso, chocolate & steamed milk',   tags: ['hot', 'sweet', 'chocolate'], popular: true },
  { id: 'hch',  name: 'Hot Chocolate',  category: 'Coffee', price: 8000,  description: 'Rich Belgian chocolate blend',         tags: ['hot', 'sweet', 'no-caffeine'] },
  { id: 'cb',   name: 'Cold Brew',      category: 'Coffee', price: 12000, description: '12-hour slow-steeped cold coffee',     tags: ['cold', 'smooth', 'strong'], popular: true },
  { id: 'mac',  name: 'Macchiato',      category: 'Coffee', price: 8500,  description: 'Espresso marked with a dot of foam',   tags: ['hot', 'strong'] },
  // ─── Tea ──────────────────────────────────────────────────────────────
  { id: 'eb',   name: 'English Breakfast', category: 'Tea', price: 6000, description: 'Bold classic black tea',               tags: ['hot', 'classic'] },
  { id: 'gt',   name: 'Green Tea',      category: 'Tea',    price: 6000,  description: 'Light Japanese sencha',                tags: ['hot', 'healthy', 'no-caffeine'] },
  { id: 'cl',   name: 'Chai Latte',     category: 'Tea',    price: 8500,  description: 'Spiced masala tea with steamed milk',  tags: ['hot', 'spiced', 'popular'], popular: true },
  { id: 'ht',   name: 'Herbal Tea',     category: 'Tea',    price: 6000,  description: 'Rotating seasonal blend',              tags: ['hot', 'caffeine-free', 'healthy'] },
  // ─── Cold Drinks ──────────────────────────────────────────────────────
  { id: 'il',   name: 'Iced Latte',     category: 'Cold Drinks', price: 11000, description: 'Espresso & milk over ice',       tags: ['cold', 'popular'], popular: true },
  { id: 'frap', name: 'Frappuccino',    category: 'Cold Drinks', price: 13000, description: 'Blended iced coffee',            tags: ['cold', 'sweet', 'blended'] },
  { id: 'ms',   name: 'Mango Smoothie', category: 'Cold Drinks', price: 10000, description: 'Fresh mango blend',              tags: ['cold', 'fresh', 'healthy'] },
  { id: 'fj',   name: 'Fresh Juice',    category: 'Cold Drinks', price: 8000,  description: 'Daily seasonal fruits',          tags: ['cold', 'fresh', 'healthy'] },
  { id: 'sod',  name: 'Soda',           category: 'Cold Drinks', price: 4000,  description: 'Assorted canned sodas',          tags: ['cold'] },
  { id: 'wat',  name: 'Still Water',    category: 'Cold Drinks', price: 2000,  description: 'Chilled mineral water',          tags: ['cold'] },
  // ─── Pastries ─────────────────────────────────────────────────────────
  { id: 'cro',  name: 'Croissant',      category: 'Pastries', price: 8000,  description: 'Buttery, flaky pastry',            tags: ['baked', 'popular'], popular: true },
  { id: 'muf',  name: 'Muffin',         category: 'Pastries', price: 7000,  description: 'Blueberry or choc-chip',           tags: ['baked', 'sweet'] },
  { id: 'bb',   name: 'Banana Bread',   category: 'Pastries', price: 7500,  description: 'Moist homemade slice',             tags: ['baked', 'classic'] },
  { id: 'brow', name: 'Brownie',        category: 'Pastries', price: 8000,  description: 'Dense chocolate fudge square',     tags: ['baked', 'sweet', 'chocolate'] },
  { id: 'cc',   name: 'Cheesecake',     category: 'Pastries', price: 12000, description: 'New York style, daily flavour',    tags: ['cold', 'sweet', 'popular'] },
  // ─── Food ─────────────────────────────────────────────────────────────
  { id: 'avt',  name: 'Avocado Toast',  category: 'Food', price: 14000, description: 'Sourdough, smashed avo, poached egg', tags: ['breakfast', 'healthy', 'popular'], popular: true },
  { id: 'tj',   name: 'Toast & Jam',    category: 'Food', price: 6000,  description: 'Thick-cut toast with assorted jams',  tags: ['breakfast', 'light'] },
  { id: 'cw',   name: 'Chicken Wrap',   category: 'Food', price: 15000, description: 'Grilled chicken, salad, sweet chilli', tags: ['lunch', 'popular'], popular: true },
  { id: 'cs',   name: 'Club Sandwich',  category: 'Food', price: 16000, description: 'Triple-decker with fries',            tags: ['lunch', 'filling'] },
  { id: 'csa',  name: 'Caesar Salad',   category: 'Food', price: 15000, description: 'Romaine, croutons, parmesan',         tags: ['lunch', 'healthy'] },
]

export function getMenuByCategory(category?: string): MenuItem[] {
  if (!category || category === 'All') return menu
  return menu.filter((item) => item.category === category)
}

export function getPopularItems(): MenuItem[] {
  return menu.filter((item) => item.popular)
}

export function formatMenuForAI(category?: string): string {
  const items = getMenuByCategory(category)
  const grouped: Record<string, MenuItem[]> = {}
  for (const item of items) {
    if (!grouped[item.category]) grouped[item.category] = []
    grouped[item.category].push(item)
  }
  return Object.entries(grouped)
    .map(([cat, list]) => {
      const lines = list.map((i) => `  • ${i.name} — UGX ${i.price.toLocaleString()} (${i.description})`)
      return `**${cat}**\n${lines.join('\n')}`
    })
    .join('\n\n')
}
