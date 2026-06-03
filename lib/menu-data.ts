export interface MenuItem {
  id: string
  name: string
  nameAr: string
  price: number // OMR
  category: string
  badge?: 'Signature' | 'Popular' | 'Best Seller' | 'Special' | null
  emoji: string
}

export interface MenuCategory {
  id: string
  name: string
  nameAr: string
  emoji: string
  shortLabel: string
}

export const MENU_CATEGORIES: MenuCategory[] = [
  { id: 'hot-coffee',  name: 'Hot Coffee',       nameAr: 'القهوة الساخنة',   emoji: '☕', shortLabel: 'Hot' },
  { id: 'ice-frappe',  name: 'Ice & Frappe',      nameAr: 'القهوة الباردة',   emoji: '🧋', shortLabel: 'Iced' },
  { id: 'tea',         name: 'Tea',               nameAr: 'شاي',              emoji: '🍵', shortLabel: 'Tea' },
  { id: 'iced-drinks', name: 'Iced Tea & Drinks', nameAr: 'مشروبات باردة',    emoji: '🥤', shortLabel: 'Drinks' },
  { id: 'mojito',      name: 'Mojito',            nameAr: 'موهيتو',           emoji: '🍃', shortLabel: 'Mojito' },
  { id: 'pastries',    name: 'Pastries',          nameAr: 'خبز وكرواسون',     emoji: '🥐', shortLabel: 'Pastries' },
  { id: 'cakes',       name: 'Cakes & Desserts',  nameAr: 'الحلويات',         emoji: '🎂', shortLabel: 'Cakes' },
  { id: 'cookies',     name: 'Cookies',           nameAr: 'كوكيز',            emoji: '🍪', shortLabel: 'Cookies' },
]

export const MENU_ITEMS: MenuItem[] = [
  // ── Hot Coffee ─────────────────────────────────────────────
  { id: 'hc-espresso',    name: 'Espresso',       nameAr: 'إسبريسو',       price: 0.800, category: 'hot-coffee',  emoji: '☕' },
  { id: 'hc-americano',   name: 'Americano',      nameAr: 'أمريكانو',      price: 0.800, category: 'hot-coffee',  emoji: '☕' },
  { id: 'hc-cappuccino',  name: 'Cappuccino',     nameAr: 'كابتشينو',      price: 1.000, category: 'hot-coffee',  emoji: '☕', badge: 'Popular' },
  { id: 'hc-latte',       name: 'Latte',          nameAr: 'لاتيه',          price: 1.000, category: 'hot-coffee',  emoji: '☕' },
  { id: 'hc-flatwhite',   name: 'Flat White',     nameAr: 'فلات وايت',     price: 1.100, category: 'hot-coffee',  emoji: '☕' },
  { id: 'hc-cortado',     name: 'Cortado',        nameAr: 'كورتادو',        price: 0.900, category: 'hot-coffee',  emoji: '☕' },
  { id: 'hc-mocha',       name: 'Mocha',          nameAr: 'موكا',           price: 1.100, category: 'hot-coffee',  emoji: '☕' },
  { id: 'hc-v60',         name: 'V60 Pour Over',  nameAr: 'في 60',         price: 1.200, category: 'hot-coffee',  emoji: '☕', badge: 'Signature' },
  { id: 'hc-turkish',     name: 'Turkish Coffee', nameAr: 'قهوة تركية',    price: 0.700, category: 'hot-coffee',  emoji: '☕' },

  // ── Ice & Frappe ────────────────────────────────────────────
  { id: 'if-icelatte',    name: 'Iced Latte',     nameAr: 'لاتيه مثلج',    price: 1.100, category: 'ice-frappe',  emoji: '🧋' },
  { id: 'if-coldbrew',    name: 'Cold Brew',      nameAr: 'كولد برو',      price: 1.200, category: 'ice-frappe',  emoji: '🧋', badge: 'Special' },
  { id: 'if-icemocha',    name: 'Iced Mocha',     nameAr: 'موكا مثلج',     price: 1.200, category: 'ice-frappe',  emoji: '🧋' },
  { id: 'if-vanilla',     name: 'Vanilla Frappe', nameAr: 'فرابيه فانيليا', price: 1.300, category: 'ice-frappe',  emoji: '🧋' },
  { id: 'if-caramel',     name: 'Caramel Frappe', nameAr: 'فرابيه كراميل', price: 1.300, category: 'ice-frappe',  emoji: '🧋', badge: 'Best Seller' },
  { id: 'if-matcha',      name: 'Matcha Frappe',  nameAr: 'فرابيه ماتشا',  price: 1.400, category: 'ice-frappe',  emoji: '🧋', badge: 'Signature' },

  // ── Tea ────────────────────────────────────────────────────
  { id: 't-karak',        name: 'Karak Chai',     nameAr: 'شاي كرك',       price: 0.500, category: 'tea',         emoji: '🍵', badge: 'Popular' },
  { id: 't-masala',       name: 'Masala Tea',     nameAr: 'شاي مسالة',     price: 0.600, category: 'tea',         emoji: '🍵' },
  { id: 't-green',        name: 'Green Tea',      nameAr: 'شاي أخضر',      price: 0.600, category: 'tea',         emoji: '🍵' },
  { id: 't-earlgrey',     name: 'Earl Grey',      nameAr: 'إيرل غري',      price: 0.600, category: 'tea',         emoji: '🍵' },
  { id: 't-chamomile',    name: 'Chamomile',      nameAr: 'بابونج',         price: 0.700, category: 'tea',         emoji: '🍵' },

  // ── Iced Tea & Drinks ──────────────────────────────────────
  { id: 'id-mintlemon',   name: 'Mint Lemonade',  nameAr: 'ليمون نعناع',   price: 0.800, category: 'iced-drinks', emoji: '🥤', badge: 'Popular' },
  { id: 'id-orange',      name: 'Orange Juice',   nameAr: 'عصير برتقال',   price: 0.700, category: 'iced-drinks', emoji: '🥤' },
  { id: 'id-watermelon',  name: 'Watermelon',     nameAr: 'عصير بطيخ',     price: 0.800, category: 'iced-drinks', emoji: '🥤' },
  { id: 'id-mango',       name: 'Mango Juice',    nameAr: 'عصير مانجو',    price: 0.700, category: 'iced-drinks', emoji: '🥤' },
  { id: 'id-passion',     name: 'Passion Fruit',  nameAr: 'فاكهة الرمان',  price: 0.900, category: 'iced-drinks', emoji: '🥤', badge: 'Special' },

  // ── Mojito ─────────────────────────────────────────────────
  { id: 'mo-classic',     name: 'Classic Mojito', nameAr: 'موهيتو كلاسيك', price: 1.000, category: 'mojito',      emoji: '🍃' },
  { id: 'mo-strawberry',  name: 'Strawberry',     nameAr: 'فراولة',         price: 1.100, category: 'mojito',      emoji: '🍃' },
  { id: 'mo-mintlemon',   name: 'Mint & Lemon',   nameAr: 'نعناع وليمون',  price: 1.000, category: 'mojito',      emoji: '🍃', badge: 'Popular' },
  { id: 'mo-blueberry',   name: 'Blueberry',      nameAr: 'توت أزرق',      price: 1.200, category: 'mojito',      emoji: '🍃', badge: 'Special' },

  // ── Pastries ───────────────────────────────────────────────
  { id: 'pa-plain',       name: 'Butter Croissant', nameAr: 'كرواسون زبدة',  price: 0.700, category: 'pastries',    emoji: '🥐', badge: 'Popular' },
  { id: 'pa-almond',      name: 'Almond Croissant', nameAr: 'كرواسون لوز',   price: 0.900, category: 'pastries',    emoji: '🥐', badge: 'Best Seller' },
  { id: 'pa-cheese',      name: 'Cheese Toast',     nameAr: 'توست بالجبن',   price: 0.600, category: 'pastries',    emoji: '🍞' },
  { id: 'pa-avocado',     name: 'Avocado Toast',    nameAr: 'توست أفوكادو',  price: 1.200, category: 'pastries',    emoji: '🥑', badge: 'Special' },
  { id: 'pa-club',        name: 'Club Sandwich',    nameAr: 'ساندويش كلوب',  price: 1.500, category: 'pastries',    emoji: '🥪' },
  { id: 'pa-waffles',     name: 'Waffles',          nameAr: 'وافل',           price: 1.300, category: 'pastries',    emoji: '🧇', badge: 'Signature' },

  // ── Cakes & Desserts ───────────────────────────────────────
  { id: 'ca-cheesecake',  name: 'Cheesecake',        nameAr: 'تشيزكيك',       price: 1.200, category: 'cakes',       emoji: '🎂', badge: 'Signature' },
  { id: 'ca-lavacake',    name: 'Lava Cake',         nameAr: 'كيك لافا',      price: 1.300, category: 'cakes',       emoji: '🎂' },
  { id: 'ca-tiramisu',    name: 'Tiramisu',          nameAr: 'تيراميسو',      price: 1.200, category: 'cakes',       emoji: '🎂' },
  { id: 'ca-lotus',       name: 'Lotus Cake',        nameAr: 'كيك لوتس',      price: 1.400, category: 'cakes',       emoji: '🎂', badge: 'Best Seller' },
  { id: 'ca-kunafa',      name: 'Kunafa',            nameAr: 'كنافة',          price: 1.000, category: 'cakes',       emoji: '🍮', badge: 'Popular' },

  // ── Cookies ────────────────────────────────────────────────
  { id: 'ck-chocchip',    name: 'Chocolate Chip',    nameAr: 'شوكولاتة شيب',  price: 0.400, category: 'cookies',     emoji: '🍪' },
  { id: 'ck-cinnamon',    name: 'Cinnamon',          nameAr: 'قرفة',           price: 0.400, category: 'cookies',     emoji: '🍪' },
  { id: 'ck-pistachio',   name: 'Pistachio',         nameAr: 'فستق',           price: 0.500, category: 'cookies',     emoji: '🍪', badge: 'Signature' },
  { id: 'ck-oat',         name: 'Oat & Raisin',      nameAr: 'شوفان وزبيب',   price: 0.400, category: 'cookies',     emoji: '🍪' },
]

export const BADGE_STYLES: Record<NonNullable<MenuItem['badge']>, string> = {
  'Signature':   'bg-amber-100 text-amber-800 border border-amber-200',
  'Popular':     'bg-green-100 text-green-800 border border-green-200',
  'Best Seller': 'bg-blue-100 text-blue-800 border border-blue-200',
  'Special':     'bg-rose-100 text-rose-800 border border-rose-200',
}

export function formatPrice(price: number): string {
  return price.toFixed(3) + ' OMR'
}
