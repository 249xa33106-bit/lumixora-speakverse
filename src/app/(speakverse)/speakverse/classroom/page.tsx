'use client'
import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { isWebGLSupported, prefersReducedMotion } from '@/lib/webgl-detect'
import { ClassroomFallback } from '@/components/speakverse/classroom/ClassroomFallback'
import { ActivityPanel } from '@/components/speakverse/classroom/ActivityPanel'
import { ClassroomLoader } from '@/components/speakverse/classroom/ClassroomLoader'
import type { StationId } from '@/components/speakverse/classroom/ClassroomScene'
import { ArrowLeft, Maximize2, Minimize2 } from 'lucide-react'
import Link from 'next/link'

// Lazy-load the 3D scene — only runs on client, skips SSR
const ClassroomScene = dynamic(
  () => import('@/components/speakverse/classroom/ClassroomScene').then(m => m.ClassroomScene),
  { ssr: false, loading: () => <ClassroomLoader /> }
)

export default function ClassroomPage() {
  const [webGLOk, setWebGLOk] = useState(false)
  const [, setReducedMotion] = useState(false)
  const [activeStation, setActiveStation] = useState<StationId | null>(null)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    setWebGLOk(isWebGLSupported())
    setReducedMotion(prefersReducedMotion())
  }, [])

  function handleStationClick(station: StationId) {
    setActiveStation(prev => prev === station ? null : station)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] -mx-4 -my-6">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-sv-surface border-b border-sv-border shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href="/speakverse/home"
            className="flex items-center gap-1.5 text-sm text-sv-text-secondary hover:text-sv-text transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Dashboard
          </Link>
          <span className="text-sv-border">|</span>
          <h1 className="font-semibold text-sv-text text-sm">3D Learning Classroom</h1>
          {activeStation && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-sv-primary capitalize">
              {activeStation} active
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!webGLOk && (
            <span className="text-xs text-sv-warning">WebGL unavailable — using 2D mode</span>
          )}
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-sv-text-secondary cursor-pointer"
            aria-label={expanded ? 'Exit full screen' : 'Expand classroom'}
          >
            {expanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Main area */}
      <div className="flex flex-1 overflow-hidden">
        {/* 3D Scene or 2D fallback */}
        <div className={`relative transition-all duration-300 ${ activeStation && !expanded ? 'flex-1' : 'w-full' }`}>
          {webGLOk ? (
            <ClassroomScene
              onStationClick={handleStationClick}
              activeStation={activeStation}
            />
          ) : (
            <div className="p-6">
              <ClassroomFallback onStationClick={handleStationClick} activeStation={activeStation} />
            </div>
          )}

          {/* Keyboard nav hint */}
          {!activeStation && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-3 py-1.5 rounded-full pointer-events-none">
              Click a glowing station to begin · Drag to rotate · Scroll to zoom
            </div>
          )}
        </div>

        {/* Activity Panel — slides in */}
        {activeStation && (
          <div
            className={`bg-sv-surface border-l border-sv-border flex flex-col transition-all duration-300 ${
              expanded ? 'w-full absolute inset-0 z-10' : 'w-80 lg:w-96'
            }`}
          >
            <ActivityPanel station={activeStation} onClose={() => setActiveStation(null)} />
          </div>
        )}
      </div>
    </div>
  )
}
