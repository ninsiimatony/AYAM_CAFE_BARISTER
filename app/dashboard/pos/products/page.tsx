'use client'

import { useState, useEffect } from 'react'
import type { POSProduct, POSCategory } from '@/lib/types'

function formatUGX(n: number) { return `UGX ${n.toLocaleString()}` }

export default function POSProductsPage() {
  const [products,   setProducts]   = useState<POSProduct[]>([])
  const [categories, setCategories] = useState<POSCategory[]>([])
  const [loading,    setLoading]    = useState(true)
  const [search,     setSearch]     = useState('')
  const [activeCat,  setActiveCat]  = useState('all')
  const [showForm,   setShowForm]   = useState(false)
  const [editing,    setEditing]    = useState<POSProduct | null>(null)
  const [saving,     setSaving]     = useState(false)
  const [form, setForm] = useState({ name: '', description: '', price: '', category_id: '', is_available: true })

  async function loadData() {
    setLoading(true)
    const [pRes, cRes] = await Promise.all([
      fetch('/api/pos/products'),
      fetch('/api/pos/categories'),
    ])
    const { data: prods } = await pRes.json()
    const { data: cats  } = await cRes.json()
    setProducts(prods  ?? [])
    setCategories(cats ?? [])
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  function openAdd() {
    setEditing(null)
    setForm({ name: '', description: '', price: '', category_id: categories[0]?.id ?? '', is_available: true })
    setShowForm(true)
  }

  function openEdit(p: POSProduct) {
    setEditing(p)
    setForm({ name: p.name, description: p.description ?? '', price: String(p.price), category_id: p.category_id ?? '', is_available: p.is_available })
    setShowForm(true)
  }

  async function handleSave() {
    if (!form.name || !form.price) return
    setSaving(true)
    const method = editing ? 'PUT' : 'POST'
    const body   = editing
      ? { id: editing.id, ...form, price: Number(form.price) }
      : { ...form, price: Number(form.price) }

    await fetch('/api/pos/products', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    setShowForm(false)
    setSaving(false)
    await loadData()
  }

  async function handleToggle(p: POSProduct) {
    await fetch('/api/pos/products', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: p.id, is_available: !p.is_available }),
    })
    await loadData()
  }

  const filtered = products.filter(p =>
    (activeCat === 'all' || p.category_id === activeCat) &&
    (!search || p.name.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-coffee-900 dark:text-cream-100">Product Catalog</h1>
          <p className="text-sm text-coffee-400">{products.length} products</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 rounded-xl bg-coffee-gradient px-4 py-2.5 text-sm font-semibold text-white shadow-coffee hover:opacity-90 transition-opacity"
        >
          <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
          </svg>
          Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="rounded-xl border border-coffee-100 dark:border-coffee-800 bg-white dark:bg-coffee-900 px-4 py-2 text-sm text-coffee-900 dark:text-cream-100 placeholder-coffee-400 focus:outline-none focus:ring-2 focus:ring-coffee-300"
        />
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setActiveCat('all')}
            className={`rounded-xl px-3 py-2 text-sm font-medium transition-all ${activeCat === 'all' ? 'bg-coffee-gradient text-white shadow-coffee' : 'bg-white dark:bg-coffee-900 border border-coffee-100 dark:border-coffee-800 text-coffee-600 dark:text-coffee-300'}`}
          >All</button>
          {categories.map(c => (
            <button
              key={c.id}
              onClick={() => setActiveCat(c.id)}
              className={`rounded-xl px-3 py-2 text-sm font-medium transition-all ${activeCat === c.id ? 'bg-coffee-gradient text-white shadow-coffee' : 'bg-white dark:bg-coffee-900 border border-coffee-100 dark:border-coffee-800 text-coffee-600 dark:text-coffee-300'}`}
            >
              {c.icon} {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Product table */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 rounded-xl bg-white dark:bg-coffee-900 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-coffee-100 dark:border-coffee-800 bg-white dark:bg-coffee-900">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-coffee-100 dark:border-coffee-800 bg-coffee-50 dark:bg-coffee-950">
                <th className="px-4 py-3 text-left text-xs font-semibold text-coffee-500 uppercase tracking-wide">Product</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-coffee-500 uppercase tracking-wide">Category</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-coffee-500 uppercase tracking-wide">Price</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-coffee-500 uppercase tracking-wide">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-coffee-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-coffee-50 dark:divide-coffee-800">
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-cream-50 dark:hover:bg-coffee-800/50 transition-colors">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-coffee-900 dark:text-cream-100">{p.name}</p>
                      <p className="text-xs text-coffee-400 truncate max-w-xs">{p.description}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-coffee-500 dark:text-coffee-400">
                    {p.pos_categories?.icon} {p.pos_categories?.name ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-coffee-700 dark:text-caramel-400">
                    {formatUGX(p.price)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleToggle(p)}
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${
                        p.is_available
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200'
                          : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200'
                      }`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${p.is_available ? 'bg-green-500' : 'bg-red-500'}`} />
                      {p.is_available ? 'Available' : 'Unavailable'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => openEdit(p)}
                      className="text-xs text-coffee-500 hover:text-coffee-800 dark:hover:text-cream-100 font-medium transition-colors"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-12 text-center text-coffee-400">
              <p>No products found</p>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-coffee-900 shadow-coffee-lg overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 bg-coffee-gradient text-white">
              <h2 className="font-bold">{editing ? 'Edit Product' : 'Add Product'}</h2>
              <button onClick={() => setShowForm(false)} className="text-cream-300 hover:text-white">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-coffee-600 dark:text-coffee-400">Name *</label>
                <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-coffee-100 dark:border-coffee-700 bg-white dark:bg-coffee-800 px-3 py-2 text-sm text-coffee-900 dark:text-cream-100 focus:outline-none focus:ring-2 focus:ring-coffee-300"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-coffee-600 dark:text-coffee-400">Description</label>
                <input type="text" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-coffee-100 dark:border-coffee-700 bg-white dark:bg-coffee-800 px-3 py-2 text-sm text-coffee-900 dark:text-cream-100 focus:outline-none focus:ring-2 focus:ring-coffee-300"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-coffee-600 dark:text-coffee-400">Price (UGX) *</label>
                  <input type="number" min="0" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-coffee-100 dark:border-coffee-700 bg-white dark:bg-coffee-800 px-3 py-2 text-sm text-coffee-900 dark:text-cream-100 focus:outline-none focus:ring-2 focus:ring-coffee-300"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-coffee-600 dark:text-coffee-400">Category</label>
                  <select value={form.category_id} onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-coffee-100 dark:border-coffee-700 bg-white dark:bg-coffee-800 px-3 py-2 text-sm text-coffee-900 dark:text-cream-100 focus:outline-none focus:ring-2 focus:ring-coffee-300"
                  >
                    <option value="">No category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="avail" checked={form.is_available} onChange={e => setForm(f => ({ ...f, is_available: e.target.checked }))}
                  className="rounded border-coffee-300"
                />
                <label htmlFor="avail" className="text-sm text-coffee-700 dark:text-coffee-300">Available for sale</label>
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => setShowForm(false)} className="flex-1 rounded-xl border border-coffee-200 dark:border-coffee-700 py-2.5 text-sm font-medium text-coffee-600 dark:text-coffee-400 hover:bg-coffee-50 dark:hover:bg-coffee-800 transition-colors">Cancel</button>
                <button onClick={handleSave} disabled={saving || !form.name || !form.price}
                  className="flex-1 rounded-xl bg-coffee-gradient py-2.5 text-sm font-semibold text-white shadow-coffee hover:opacity-90 disabled:opacity-50 transition-all"
                >
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
