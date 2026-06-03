'use client'

import { useState } from 'react'
import {
  Search, Star, Play, Clock, ChevronRight, Film,
  Flame, Tv, Laugh, Swords, Ghost, Heart,
} from 'lucide-react'

const GENRES = [
  { label: 'All',      icon: Film  },
  { label: 'Trending', icon: Flame },
  { label: 'Action',   icon: Swords },
  { label: 'Comedy',   icon: Laugh },
  { label: 'Horror',   icon: Ghost },
  { label: 'Romance',  icon: Heart },
  { label: 'Series',   icon: Tv    },
]

const MOVIES = [
  {
    id: 1,
    title: 'Inception',
    year: 2010,
    rating: 8.8,
    duration: '2h 28m',
    genre: ['Action'],
    description: 'A thief who steals corporate secrets through dream-sharing technology is given the inverse task of planting an idea.',
    poster: '🌀',
    color: 'from-blue-900/60 to-indigo-900/40',
    badge: 'HD',
    badgeColor: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  },
  {
    id: 2,
    title: 'The Dark Knight',
    year: 2008,
    rating: 9.0,
    duration: '2h 32m',
    genre: ['Action'],
    description: 'Batman faces the Joker, a criminal mastermind who plunges Gotham City into anarchy.',
    poster: '🦇',
    color: 'from-gray-900/60 to-zinc-900/40',
    badge: '4K',
    badgeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  },
  {
    id: 3,
    title: 'Interstellar',
    year: 2014,
    rating: 8.6,
    duration: '2h 49m',
    genre: ['Action'],
    description: "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival.",
    poster: '🪐',
    color: 'from-purple-900/60 to-violet-900/40',
    badge: 'IMAX',
    badgeColor: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  },
  {
    id: 4,
    title: 'The Grand Budapest Hotel',
    year: 2014,
    rating: 8.1,
    duration: '1h 39m',
    genre: ['Comedy'],
    description: 'The adventures of a legendary hotel concierge and his protégé — a young lobby boy.',
    poster: '🏨',
    color: 'from-pink-900/60 to-rose-900/40',
    badge: 'HD',
    badgeColor: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  },
  {
    id: 5,
    title: 'Get Out',
    year: 2017,
    rating: 7.7,
    duration: '1h 44m',
    genre: ['Horror'],
    description: "A young African-American visits his white girlfriend's parents for the weekend, where his senses tell him something is off.",
    poster: '👁️',
    color: 'from-red-900/60 to-rose-950/40',
    badge: 'HD',
    badgeColor: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  },
  {
    id: 6,
    title: 'La La Land',
    year: 2016,
    rating: 8.0,
    duration: '2h 8m',
    genre: ['Romance'],
    description: 'While navigating their careers in Los Angeles, a pianist and an actress fall in love — while attempting to reconcile their aspirations.',
    poster: '🎭',
    color: 'from-yellow-900/60 to-amber-900/40',
    badge: 'HD',
    badgeColor: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  },
  {
    id: 7,
    title: 'Breaking Bad',
    year: 2008,
    rating: 9.5,
    duration: '5 Seasons',
    genre: ['Series'],
    description: 'A high school chemistry teacher turned methamphetamine producer partners with a former student.',
    poster: '⚗️',
    color: 'from-green-900/60 to-emerald-900/40',
    badge: 'SERIES',
    badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  },
  {
    id: 8,
    title: 'Parasite',
    year: 2019,
    rating: 8.6,
    duration: '2h 12m',
    genre: ['Comedy'],
    description: 'Greed and class discrimination threaten the newly formed symbiotic relationship between the wealthy Park family and the destitute Kim clan.',
    poster: '🏠',
    color: 'from-teal-900/60 to-cyan-900/40',
    badge: '4K',
    badgeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  },
]

const FEATURED = MOVIES[1]

export default function MoviesPage() {
  const [search, setSearch]       = useState('')
  const [activeGenre, setGenre]   = useState('All')
  const [watching, setWatching]   = useState<number | null>(null)

  const filtered = MOVIES.filter((m) => {
    const matchSearch = m.title.toLowerCase().includes(search.toLowerCase())
    const matchGenre  = activeGenre === 'All' || activeGenre === 'Trending'
      ? true
      : m.genre.includes(activeGenre)
    return matchSearch && matchGenre
  })

  return (
    <div className="space-y-6 max-w-5xl">

      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-[11px] font-semibold text-gray-600 uppercase tracking-widest mb-1">Entertainment</p>
          <h1 className="text-[22px] font-bold text-white tracking-tight">Movies & Series</h1>
        </div>
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-600" />
          <input
            type="text"
            placeholder="Search movies…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-[#0d1520] border border-white/[0.08] rounded-lg pl-8 pr-4 py-2 text-[13px] text-white placeholder-gray-700 focus:outline-none focus:border-blue-500/40 w-52"
          />
        </div>
      </div>

      {/* Featured */}
      <div className={`relative rounded-2xl overflow-hidden border border-white/[0.07] bg-gradient-to-r ${FEATURED.color} p-6`}>
        <div className="flex items-start gap-5 flex-wrap">
          <div className="shrink-0 w-20 h-28 rounded-xl bg-black/30 border border-white/10 flex items-center justify-center text-5xl select-none">
            {FEATURED.poster}
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">Featured Pick</span>
            <h2 className="text-2xl font-black text-white mt-0.5">{FEATURED.title}</h2>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <span className="flex items-center gap-1 text-yellow-400 text-sm font-bold">
                <Star className="h-3.5 w-3.5 fill-yellow-400" />{FEATURED.rating}
              </span>
              <span className="text-gray-500 text-xs">{FEATURED.year}</span>
              <span className="flex items-center gap-1 text-gray-500 text-xs">
                <Clock className="h-3 w-3" />{FEATURED.duration}
              </span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${FEATURED.badgeColor}`}>
                {FEATURED.badge}
              </span>
            </div>
            <p className="text-[13px] text-gray-400 mt-2 leading-relaxed max-w-lg">{FEATURED.description}</p>
            <button
              onClick={() => setWatching(FEATURED.id)}
              className="mt-3 flex items-center gap-2 bg-white text-black font-bold text-[13px] px-5 py-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Play className="h-3.5 w-3.5 fill-black" /> Watch Now
            </button>
          </div>
        </div>
      </div>

      {/* Genre tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        {GENRES.map(({ label, icon: Icon }) => (
          <button
            key={label}
            onClick={() => setGenre(label)}
            className={`shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${
              activeGenre === label
                ? 'bg-blue-600 text-white'
                : 'bg-white/[0.04] text-gray-500 hover:bg-white/[0.07] hover:text-gray-300 border border-white/[0.06]'
            }`}
          >
            <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
            {label}
          </button>
        ))}
      </div>

      {/* Movie grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {filtered.map((movie) => (
          <div
            key={movie.id}
            className="group rounded-xl bg-[#0d1520] border border-white/[0.07] overflow-hidden hover:border-white/[0.14] transition-all"
          >
            {/* Poster */}
            <div className={`relative h-36 bg-gradient-to-br ${movie.color} flex items-center justify-center text-5xl select-none`}>
              {movie.poster}
              <span className={`absolute top-2 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded border ${movie.badgeColor}`}>
                {movie.badge}
              </span>
              {/* Hover overlay */}
              <button
                onClick={() => setWatching(movie.id)}
                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                <span className="flex items-center gap-2 bg-white text-black font-bold text-[12px] px-4 py-1.5 rounded-lg">
                  <Play className="h-3 w-3 fill-black" /> Play
                </span>
              </button>
            </div>
            {/* Info */}
            <div className="p-3">
              <div className="flex items-start justify-between gap-2">
                <p className="text-[13px] font-semibold text-white leading-tight truncate">{movie.title}</p>
                <span className="shrink-0 flex items-center gap-0.5 text-yellow-400 text-[11px] font-bold">
                  <Star className="h-3 w-3 fill-yellow-400" />{movie.rating}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-600">
                <span>{movie.year}</span>
                <span>·</span>
                <Clock className="h-2.5 w-2.5" />
                <span>{movie.duration}</span>
              </div>
              <p className="text-[11px] text-gray-700 mt-1.5 line-clamp-2 leading-relaxed">{movie.description}</p>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
            <Film className="h-10 w-10 text-gray-800 mb-3" />
            <p className="text-sm font-semibold text-gray-600">No movies found</p>
            <p className="text-xs text-gray-700 mt-1">Try a different search or genre</p>
          </div>
        )}
      </div>

      {/* Now Playing modal */}
      {watching !== null && (() => {
        const m = MOVIES.find((x) => x.id === watching)!
        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => setWatching(null)}
          >
            <div
              className="w-full max-w-lg rounded-2xl bg-[#0d1520] border border-white/[0.1] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className={`h-48 bg-gradient-to-br ${m.color} flex items-center justify-center text-7xl select-none`}>
                {m.poster}
              </div>
              <div className="p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-black text-white">{m.title}</h3>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1 text-yellow-400 font-bold">
                        <Star className="h-3 w-3 fill-yellow-400" />{m.rating}
                      </span>
                      <span>{m.year}</span>
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{m.duration}</span>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded border ${m.badgeColor}`}>{m.badge}</span>
                </div>
                <p className="text-[13px] text-gray-400 mt-3 leading-relaxed">{m.description}</p>
                {/* Fake progress bar */}
                <div className="mt-5">
                  <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full w-1/3 bg-blue-500 rounded-full" />
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-700 mt-1">
                    <span>44:12</span><span>{m.duration}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-4">
                  <button className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-[13px] py-2.5 rounded-lg transition-colors">
                    <Play className="h-4 w-4 fill-white" /> Resume
                  </button>
                  <button
                    onClick={() => setWatching(null)}
                    className="px-4 py-2.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-gray-400 text-[13px] font-semibold transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
