'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Film, Play, ExternalLink, Clapperboard, Rocket, Coffee,
  TrendingUp, Star, ChevronRight, Sparkles,
} from 'lucide-react'

const DESCRIPT_PROJECT_URL  = 'https://web.descript.com/e6e38f7a-ea59-4564-bfb7-2dca30c0d2b7'
const DESCRIPT_PROJECT_ID   = 'e6e38f7a-ea59-4564-bfb7-2dca30c0d2b7'
const DESCRIPT_COMPOSITION  = 'd488584a-d993-4cf6-8022-b1ef33914bc2'
const COMPOSITION_URL       = `${DESCRIPT_PROJECT_URL}/${DESCRIPT_COMPOSITION.slice(0, 5)}`

const SCENES = [
  {
    id: 1,
    title: 'Gorilla Green Screen',
    caption: 'Opening shot — our hero ape enters the stage',
    icon: Clapperboard,
    color: 'from-yellow-600/20 to-amber-600/10',
    border: 'border-yellow-500/20',
    iconColor: 'text-yellow-400',
    duration: '0:00 – 0:15',
    clip: '14.5s stock clip',
  },
  {
    id: 2,
    title: 'Barista Making Coffee',
    caption: 'Life before trading — crafting the perfect espresso',
    icon: Coffee,
    color: 'from-amber-700/20 to-orange-700/10',
    border: 'border-amber-500/20',
    iconColor: 'text-amber-400',
    duration: '0:15 – 0:28',
    clip: '12.6s stock clip',
  },
  {
    id: 3,
    title: 'Wall Street',
    caption: 'Stock index + Wall Street sign — the big leagues beckon',
    icon: TrendingUp,
    color: 'from-blue-700/20 to-indigo-700/10',
    border: 'border-blue-500/20',
    iconColor: 'text-blue-400',
    duration: '0:28 – 0:48',
    clip: '8.7s + 11.1s stock clips',
  },
  {
    id: 4,
    title: 'Crypto Rocket To The Moon 🚀',
    caption: 'Ape goes full degen — destination: moon',
    icon: Rocket,
    color: 'from-emerald-700/20 to-teal-700/10',
    border: 'border-emerald-500/20',
    iconColor: 'text-emerald-400',
    duration: '0:48 – 1:12',
    clip: '20s stock clip',
  },
]

const STATS = [
  { label: 'Scenes',    value: '4'       },
  { label: 'Duration',  value: '1:12'    },
  { label: 'Clips',     value: '5 video' },
  { label: 'To Moon',   value: 'YES 🚀'  },
]

export default function ApeMoviePage() {
  const [hovered, setHovered] = useState<number | null>(null)

  return (
    <div className="space-y-6 max-w-4xl">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-[11px] font-semibold text-gray-600 uppercase tracking-widest mb-1 flex items-center gap-1.5">
            <Film className="h-3 w-3" /> Ape Movie Builder
          </p>
          <h1 className="text-[22px] font-bold text-white tracking-tight flex items-center gap-2">
            🦍 APE MOVIE
            <span className="rounded-sm bg-yellow-500/10 border border-yellow-500/20 px-2 py-0.5 text-[10px] font-bold tracking-widest text-yellow-400 uppercase">
              Descript
            </span>
          </h1>
          <p className="text-[13px] text-gray-500 mt-1">
            A cinematic journey from barista ape to legendary trader.
          </p>
        </div>

        <a
          href={COMPOSITION_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20 hover:bg-yellow-500/20 px-4 py-2.5 text-[13px] font-semibold text-yellow-400 transition-all"
        >
          <Play className="h-4 w-4" />
          Open in Descript
          <ExternalLink className="h-3.5 w-3.5 opacity-60" />
        </a>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {STATS.map((s) => (
          <div key={s.label} className="rounded-xl bg-[#0d1520] border border-white/[0.07] p-4">
            <p className="text-[10px] font-semibold text-gray-700 uppercase tracking-widest mb-1">{s.label}</p>
            <p className="text-xl font-bold text-white tabular-nums">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Descript embed banner */}
      <div className="rounded-xl overflow-hidden border border-yellow-500/20 bg-gradient-to-br from-yellow-950/40 to-amber-950/20">
        <div className="flex items-center gap-3 px-5 py-3 border-b border-yellow-500/10">
          <Sparkles className="h-4 w-4 text-yellow-400" />
          <span className="text-[13px] font-semibold text-yellow-300">Your Ape Movie is live on Descript</span>
          <span className="ml-auto text-[11px] text-gray-600 font-mono truncate max-w-[200px]">
            {DESCRIPT_PROJECT_ID}
          </span>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-5 p-6">
          {/* Ape ASCII art / poster */}
          <div className="shrink-0 w-32 h-32 rounded-xl bg-black/40 border border-yellow-500/20 flex flex-col items-center justify-center select-none">
            <span className="text-5xl">🦍</span>
            <span className="text-[10px] text-yellow-400 font-bold mt-1 tracking-widest">APE MOVIE</span>
          </div>
          <div className="flex-1 space-y-2">
            <p className="text-sm text-gray-300 leading-relaxed">
              Your Ape Movie project has been created in Descript. Click{' '}
              <strong className="text-yellow-400">Open in Descript</strong> to view, edit, and export your movie.
              Add your own voiceover, trim clips, add captions, and publish when ready.
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              <a
                href={COMPOSITION_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-lg bg-yellow-500 hover:bg-yellow-400 px-4 py-2 text-[13px] font-bold text-black transition-colors"
              >
                <Play className="h-3.5 w-3.5" /> Watch &amp; Edit
              </a>
              <span className="text-[12px] text-gray-600">Powered by Descript AI</span>
            </div>
          </div>
        </div>
      </div>

      {/* Scene breakdown */}
      <div className="rounded-xl bg-[#0d1520] border border-white/[0.07] overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3.5 border-b border-white/[0.06]">
          <Clapperboard className="h-4 w-4 text-gray-500" />
          <h2 className="text-[13px] font-semibold text-white tracking-wide">Scene Breakdown</h2>
          <span className="ml-auto text-[11px] text-gray-600">{SCENES.length} scenes</span>
        </div>
        <div className="divide-y divide-white/[0.04]">
          {SCENES.map((scene) => {
            const Icon = scene.icon
            const isHov = hovered === scene.id
            return (
              <div
                key={scene.id}
                onMouseEnter={() => setHovered(scene.id)}
                onMouseLeave={() => setHovered(null)}
                className={`flex items-center gap-4 px-5 py-4 transition-colors cursor-default ${isHov ? 'bg-white/[0.03]' : ''}`}
              >
                <div className={`shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br ${scene.color} border ${scene.border} flex items-center justify-center`}>
                  <Icon className={`h-5 w-5 ${scene.iconColor}`} strokeWidth={1.75} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-gray-600 tabular-nums">#{scene.id}</span>
                    <p className="text-sm font-semibold text-white truncate">{scene.title}</p>
                  </div>
                  <p className="text-[12px] text-gray-500 mt-0.5 truncate">{scene.caption}</p>
                  <p className="text-[10px] text-gray-700 mt-0.5 font-mono">{scene.clip}</p>
                </div>
                <span className="shrink-0 text-[11px] font-mono text-gray-700">{scene.duration}</span>
                <ChevronRight className="shrink-0 h-4 w-4 text-gray-800" />
              </div>
            )
          })}
        </div>
      </div>

      {/* Credits */}
      <div className="rounded-xl bg-[#0d1520] border border-white/[0.07] p-5 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Star className="h-5 w-5 text-yellow-400" />
          <div>
            <p className="text-sm font-semibold text-white">Director: Claude AI</p>
            <p className="text-[12px] text-gray-500">Starring: One very ambitious ape</p>
          </div>
        </div>
        <Link href="/dashboard" className="text-[12px] text-blue-400 hover:text-blue-300 transition-colors">
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  )
}
