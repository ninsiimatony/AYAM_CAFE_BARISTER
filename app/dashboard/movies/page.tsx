'use client'

import { useState } from 'react'
import { Play, Plus, Search, Home, Sparkles, Download, Star, ChevronRight } from 'lucide-react'

/* ─── Data ─────────────────────────────────────────── */
const FEATURED = {
  label:    'A CINEPHILE ORIGINAL SERIES',
  title:    'The Last Marshal',
  meta:     ['2024', '18+', '4 SEASONS'],
  bg:       'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,.7) 60%, #000 100%), linear-gradient(135deg,#0d0d0d 0%,#1a0a00 40%,#0d1a0d 100%)',
  overlay:  '#ff6b00',
}

const TRENDING = [
  { id: 1,  title: 'Neon Divide',       year: 2024, rating: 8.4, bg: 'linear-gradient(135deg,#1a1a2e,#16213e)',      label: 'SERIES'  },
  { id: 2,  title: 'Deep Orbit',        year: 2024, rating: 7.9, bg: 'linear-gradient(135deg,#0d2137,#0a3d62)',      label: 'FILM'    },
  { id: 3,  title: 'Crimson Tide II',   year: 2023, rating: 8.1, bg: 'linear-gradient(135deg,#2d0010,#5c0020)',      label: 'FILM'    },
  { id: 4,  title: 'Velocity',          year: 2024, rating: 7.6, bg: 'linear-gradient(135deg,#1a2800,#2d4600)',      label: 'SERIES'  },
  { id: 5,  title: 'Ghost Signal',      year: 2023, rating: 8.7, bg: 'linear-gradient(135deg,#1a0030,#2d0050)',      label: 'FILM'    },
  { id: 6,  title: 'Last Sunrise',      year: 2024, rating: 9.1, bg: 'linear-gradient(135deg,#2d1a00,#4a2c00)',      label: 'SERIES'  },
]

const CONTINUE = [
  { id: 7,  title: 'The Reckoning',     progress: 68, ep: 'S2 E4',  bg: 'linear-gradient(135deg,#200a00,#3d1500)' },
  { id: 8,  title: 'Parallel Lines',    progress: 32, ep: 'S1 E7',  bg: 'linear-gradient(135deg,#001a2d,#002d4a)' },
  { id: 9,  title: 'Night Protocol',    progress: 85, ep: 'S3 E1',  bg: 'linear-gradient(135deg,#1a001a,#2d002d)' },
]

const ORIGINALS = [
  { id: 10, title: 'Steel Horizon',     year: 2024, bg: 'linear-gradient(135deg,#0a0a1a,#1a1a3d)' },
  { id: 11, title: 'The Sovereign',     year: 2023, bg: 'linear-gradient(135deg,#1a0a00,#3d1a00)' },
  { id: 12, title: 'Echo Chamber',      year: 2024, bg: 'linear-gradient(135deg,#001a1a,#003d3d)' },
  { id: 13, title: 'Blackout Season',   year: 2023, bg: 'linear-gradient(135deg,#0d0d0d,#1a1a1a)' },
]

/* ─── Component ─────────────────────────────────────── */
export default function MoviesPage() {
  const [tab, setTab]         = useState<'home'|'new'|'search'|'download'>('home')
  const [query, setQuery]     = useState('')
  const [playing, setPlaying] = useState(false)

  return (
    /* Full-bleed dark container that overrides dashboard padding */
    <div className="fixed inset-0 md:left-64 top-0 bg-black overflow-y-auto z-10 flex flex-col">

      {/* ── Hero ─────────────────────────────────────────── */}
      {tab === 'home' && (
        <div
          className="relative flex-shrink-0"
          style={{ minHeight: '520px', background: FEATURED.bg }}
        >
          {/* Cinematic rain/city overlay */}
          <div className="absolute inset-0 opacity-30"
            style={{ background: 'radial-gradient(ellipse at 30% 40%, rgba(255,100,0,.18) 0%, transparent 60%), radial-gradient(ellipse at 70% 60%, rgba(0,80,200,.12) 0%, transparent 50%)' }}
          />

          {/* Top bar */}
          <div className="relative flex items-center justify-between px-5 pt-5 pb-2">
            <span className="text-2xl font-black italic tracking-tight" style={{ color: '#f5c518' }}>
              Cinephile
            </span>
            <div className="flex items-center gap-3">
              <button className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                <Search className="h-4 w-4 text-white" />
              </button>
              <button className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-[12px] font-bold text-white">
                N
              </button>
            </div>
          </div>

          {/* Hero content */}
          <div className="relative px-5 mt-24 pb-8">
            <p className="text-[10px] font-bold tracking-[.2em] text-gray-400 mb-2">{FEATURED.label}</p>
            <h1 className="text-[46px] font-black leading-none text-white tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>
              {FEATURED.title.split(' ').map((w, i) => (
                <span key={i} className="block">{w}</span>
              ))}
            </h1>
            <div className="flex items-center gap-2 mt-3">
              {FEATURED.meta.map((m) => (
                <span key={m} className="text-[12px] text-gray-400 font-medium">
                  {m}
                </span>
              )).reduce<React.ReactNode[]>((acc, el, i) => {
                if (i > 0) acc.push(<span key={`dot${i}`} className="text-gray-700">·</span>)
                acc.push(el)
                return acc
              }, [])}
            </div>
            <div className="flex items-center gap-3 mt-5">
              <button
                onClick={() => setPlaying(true)}
                className="flex items-center gap-2 bg-white text-black font-bold text-[14px] px-8 py-3 rounded-sm hover:bg-gray-200 transition-colors"
              >
                <Play className="h-4 w-4 fill-black" /> PLAY
              </button>
              <button className="w-12 h-12 rounded-sm border border-white/40 flex items-center justify-center hover:bg-white/10 transition-colors">
                <Plus className="h-5 w-5 text-white" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Search tab ───────────────────────────────────── */}
      {tab === 'search' && (
        <div className="px-5 pt-6 pb-4">
          <p className="text-[11px] font-bold text-gray-600 uppercase tracking-widest mb-3">Search</p>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600" />
            <input
              autoFocus
              type="text"
              placeholder="Movies, series, genres…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-[#111] border border-white/10 rounded-lg pl-9 pr-4 py-3 text-[14px] text-white placeholder-gray-700 focus:outline-none focus:border-yellow-500/40"
            />
          </div>
        </div>
      )}

      {/* ── Scrollable content ───────────────────────────── */}
      <div className="flex-1 px-5 pb-24 space-y-7 mt-2">

        {/* Trending Now */}
        {(tab === 'home' || tab === 'new') && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                {tab === 'new' ? 'New Releases' : 'Trending Now'}
              </p>
              <button className="flex items-center gap-0.5 text-[11px] text-gray-600 hover:text-gray-400 transition-colors">
                See all <ChevronRight className="h-3 w-3" />
              </button>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-5 px-5">
              {TRENDING.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setPlaying(true)}
                  className="shrink-0 w-32 rounded-lg overflow-hidden group"
                >
                  <div
                    className="h-20 w-full relative group-hover:brightness-110 transition-all"
                    style={{ background: m.bg }}
                  >
                    <span className="absolute top-1.5 left-1.5 text-[8px] font-bold px-1 py-0.5 rounded bg-black/50 text-gray-400 tracking-wider">
                      {m.label}
                    </span>
                    <span className="absolute bottom-1.5 right-1.5 flex items-center gap-0.5 text-[9px] font-bold text-yellow-400">
                      <Star className="h-2.5 w-2.5 fill-yellow-400" />{m.rating}
                    </span>
                  </div>
                  <div className="bg-[#111] px-2 py-1.5">
                    <p className="text-[11px] font-semibold text-white truncate text-left">{m.title}</p>
                    <p className="text-[10px] text-gray-700 text-left">{m.year}</p>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Continue Watching */}
        {tab === 'home' && (
          <section>
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3">Continue Watching</p>
            <div className="space-y-2.5">
              {CONTINUE.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setPlaying(true)}
                  className="w-full flex items-center gap-3 rounded-xl bg-[#111] border border-white/[0.06] px-4 py-3 hover:border-white/[0.12] transition-all text-left"
                >
                  <div className="shrink-0 w-12 h-12 rounded-lg" style={{ background: m.bg }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-white truncate">{m.title}</p>
                    <p className="text-[11px] text-gray-600 mt-0.5">{m.ep}</p>
                    <div className="mt-1.5 h-0.5 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-yellow-500 rounded-full" style={{ width: `${m.progress}%` }} />
                    </div>
                  </div>
                  <Play className="shrink-0 h-4 w-4 fill-white text-white opacity-40" />
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Cinephile Originals */}
        {(tab === 'home' || tab === 'new') && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Cinephile Originals</p>
              <button className="flex items-center gap-0.5 text-[11px] text-gray-600 hover:text-gray-400 transition-colors">
                See all <ChevronRight className="h-3 w-3" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {ORIGINALS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setPlaying(true)}
                  className="rounded-xl overflow-hidden group text-left"
                >
                  <div
                    className="h-24 w-full group-hover:brightness-110 transition-all flex items-end p-2"
                    style={{ background: m.bg }}
                  >
                    <span className="text-[8px] font-black text-yellow-400 italic tracking-wider">ORIGINAL</span>
                  </div>
                  <div className="bg-[#111] px-3 py-2">
                    <p className="text-[12px] font-semibold text-white truncate">{m.title}</p>
                    <p className="text-[10px] text-gray-700">{m.year}</p>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Downloads tab */}
        {tab === 'download' && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Download className="h-12 w-12 text-gray-800 mb-4" />
            <p className="text-sm font-semibold text-gray-500">No downloads yet</p>
            <p className="text-xs text-gray-700 mt-1">Save movies to watch offline</p>
          </div>
        )}

        {/* Search results */}
        {tab === 'search' && (
          <div className="grid grid-cols-2 gap-3">
            {[...TRENDING, ...ORIGINALS]
              .filter((m) => !query || m.title.toLowerCase().includes(query.toLowerCase()))
              .map((m) => (
                <button
                  key={m.id}
                  onClick={() => setPlaying(true)}
                  className="rounded-xl overflow-hidden group text-left"
                >
                  <div
                    className="h-20 w-full group-hover:brightness-110 transition-all"
                    style={{ background: m.bg }}
                  />
                  <div className="bg-[#111] px-3 py-2">
                    <p className="text-[12px] font-semibold text-white truncate">{m.title}</p>
                    <p className="text-[10px] text-gray-700">{m.year}</p>
                  </div>
                </button>
              ))}
          </div>
        )}
      </div>

      {/* ── Bottom nav ───────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 md:left-64 bg-black/90 backdrop-blur border-t border-white/[0.06] flex items-center justify-around py-3 z-20">
        {([
          { id: 'home',     label: 'HOME',     Icon: Home     },
          { id: 'new',      label: 'NEW',      Icon: Sparkles },
          { id: 'search',   label: 'SEARCH',   Icon: Search   },
          { id: 'download', label: 'DOWNLOAD', Icon: Download },
        ] as const).map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex flex-col items-center gap-1 transition-colors ${
              tab === id ? 'text-yellow-400' : 'text-gray-700 hover:text-gray-500'
            }`}
          >
            <Icon className="h-5 w-5" strokeWidth={tab === id ? 2 : 1.5} />
            <span className="text-[9px] font-bold tracking-widest">{label}</span>
          </button>
        ))}
      </div>

      {/* ── Now Playing modal ─────────────────────────────── */}
      {playing && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-6"
          onClick={() => setPlaying(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl overflow-hidden bg-[#111] border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="h-48 w-full flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#0d0d0d,#1a0a00,#0a001a)' }}
            >
              <div className="flex flex-col items-center gap-2">
                <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center">
                  <Play className="h-7 w-7 fill-white text-white ml-1" />
                </div>
                <span className="text-[11px] text-gray-500">Now Playing</span>
              </div>
            </div>
            <div className="p-5">
              <p className="text-lg font-black text-white" style={{ fontFamily: 'Georgia, serif' }}>
                The Last Marshal
              </p>
              <p className="text-[12px] text-gray-500 mt-0.5">S1 E1 · The Beginning</p>
              <div className="mt-3 h-1 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full w-1/4 bg-yellow-500 rounded-full" />
              </div>
              <div className="flex justify-between text-[10px] text-gray-700 mt-1">
                <span>12:42</span><span>48:00</span>
              </div>
              <button
                onClick={() => setPlaying(false)}
                className="mt-4 w-full py-2.5 rounded-lg bg-white/[0.06] text-gray-400 text-[13px] font-semibold hover:bg-white/[0.1] transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
