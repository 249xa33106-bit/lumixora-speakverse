'use client'
import { Suspense, Component, ErrorInfo, ReactNode } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import { ClassroomRoom } from './ClassroomRoom'
import { LearningStation } from './LearningStation'

export type StationId = 'grammar' | 'conversation' | 'interview' | 'presentation' | 'listening'

interface ClassroomSceneProps {
  onStationClick: (station: StationId) => void
  activeStation: StationId | null
}

export const STATIONS: Array<{
  id: StationId
  position: [number, number, number]
  label: string
  color: string
  emoji: string
}> = [
  { id: 'grammar',      position: [-4, 0, -3], label: 'Grammar & Vocab',  color: '#2563EB', emoji: '📚' },
  { id: 'conversation', position: [0,  0, -3], label: 'Conversation',     color: '#0D9488', emoji: '💬' },
  { id: 'interview',    position: [4,  0, -3], label: 'Interview Room',   color: '#7C3AED', emoji: '🎯' },
  { id: 'presentation', position: [-2, 0,  2], label: 'Presentation',     color: '#D97706', emoji: '🎤' },
  { id: 'listening',    position: [2,  0,  2], label: 'Listening Lab',    color: '#059669', emoji: '🎧' },
]

interface EBState { hasError: boolean }
class CanvasErrorBoundary extends Component<{ children: ReactNode }, EBState> {
  state: EBState = { hasError: false }
  static getDerivedStateFromError(): EBState {
    return { hasError: true }
  }
  componentDidCatch(e: Error, info: ErrorInfo) {
    console.warn('[ClassroomScene] Three.js rendered fallback:', e.message, info)
  }
  render() {
    if (this.state.hasError) return null
    return this.props.children
  }
}

function FrontBoard() {
  return (
    <group position={[0, 2.2, -5.8]}>
      {/* Board backing frame */}
      <mesh>
        <boxGeometry args={[8.2, 2.6, 0.08]} />
        <meshStandardMaterial color="#334155" roughness={0.7} />
      </mesh>
      {/* Board surface */}
      <mesh position={[0, 0, 0.05]}>
        <planeGeometry args={[8, 2.4]} />
        <meshStandardMaterial color="#0F172A" roughness={0.4} />
      </mesh>
    </group>
  )
}

function ClassroomCanvas({ onStationClick, activeStation }: ClassroomSceneProps) {
  return (
    <Canvas
      dpr={[1, 1.25]}
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      style={{ background: '#0F172A' }}
    >
      <Suspense fallback={null}>
        <PerspectiveCamera makeDefault position={[0, 4.5, 8.5]} fov={55} />
        <OrbitControls
          target={[0, 0, 0]}
          maxPolarAngle={Math.PI / 2.2}
          minDistance={5}
          maxDistance={15}
          enablePan={false}
        />

        {/* Optimized lighting - no heavy shadows */}
        <ambientLight intensity={0.8} />
        <directionalLight position={[5, 10, 5]} intensity={1.0} />
        <directionalLight position={[-5, 8, -5]} intensity={0.4} />

        {/* Classroom 3D geometry */}
        <ClassroomRoom />

        {/* Fast GPU Learning Stations */}
        {STATIONS.map((station) => (
          <LearningStation
            key={station.id}
            {...station}
            isActive={activeStation === station.id}
            onClick={() => onStationClick(station.id)}
          />
        ))}

        {/* Front Board */}
        <FrontBoard />
      </Suspense>
    </Canvas>
  )
}

export function ClassroomScene({ onStationClick, activeStation }: ClassroomSceneProps) {
  return (
    <div
      className="w-full h-full relative"
      role="application"
      aria-label="3D interactive classroom"
    >
      <CanvasErrorBoundary>
        <ClassroomCanvas onStationClick={onStationClick} activeStation={activeStation} />
      </CanvasErrorBoundary>

      {/* Lightweight, zero-lag 2D interactive HUD Station Selector on top of 3D Canvas */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-[#090d1a]/85 backdrop-blur-md px-3 py-2 rounded-2xl border border-white/10 shadow-2xl overflow-x-auto max-w-[95vw]">
        {STATIONS.map((s) => {
          const isSel = activeStation === s.id
          return (
            <button
              key={s.id}
              onClick={() => onStationClick(s.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                isSel
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                  : 'bg-white/5 hover:bg-white/10 text-gray-300'
              }`}
            >
              <span>{s.emoji}</span>
              <span>{s.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
