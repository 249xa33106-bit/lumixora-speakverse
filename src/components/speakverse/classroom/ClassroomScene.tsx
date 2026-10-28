'use client'
import { Suspense, Component, ErrorInfo, ReactNode } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, Html } from '@react-three/drei'
import { ClassroomRoom } from './ClassroomRoom'
import { LearningStation } from './LearningStation'

export type StationId = 'grammar' | 'conversation' | 'interview' | 'presentation' | 'listening'

interface ClassroomSceneProps {
  onStationClick: (station: StationId) => void
  activeStation: StationId | null
}

// Station positions in the 3D world
const STATIONS: Array<{
  id: StationId
  position: [number, number, number]
  label: string
  color: string
  emoji: string
}> = [
  { id: 'grammar',      position: [-4, 0, -3], label: 'Grammar &\nVocabulary',  color: '#2458A6', emoji: '📚' },
  { id: 'conversation', position: [0,  0, -3], label: 'Conversation\nCorner',    color: '#167D72', emoji: '💬' },
  { id: 'interview',    position: [4,  0, -3], label: 'Interview\nRoom',         color: '#7C3AED', emoji: '🎯' },
  { id: 'presentation', position: [-2, 0,  2], label: 'Presentation\nStage',     color: '#9A6216', emoji: '🎤' },
  { id: 'listening',    position: [2,  0,  2], label: 'Listening\nStation',      color: '#18765A', emoji: '🎧' },
]

// ── Error Boundary so any Three.js error falls back gracefully ──────────────
interface EBState { hasError: boolean; error?: string }
class CanvasErrorBoundary extends Component<{ children: ReactNode; onError: (msg: string) => void }, EBState> {
  state: EBState = { hasError: false }
  static getDerivedStateFromError(e: Error): EBState {
    return { hasError: true, error: e.message }
  }
  componentDidCatch(e: Error, info: ErrorInfo) {
    console.error('[ClassroomScene] Three.js error:', e, info)
    this.props.onError(e.message)
  }
  render() {
    if (this.state.hasError) return null
    return this.props.children
  }
}

// ── Board sign rendered as HTML-in-3D (avoids troika font worker issues) ────
function FrontBoard() {
  return (
    <group position={[0, 2, -5.8]}>
      {/* Board backing */}
      <mesh receiveShadow>
        <boxGeometry args={[8, 2.5, 0.1]} />
        <meshStandardMaterial color="#1E3A5F" roughness={0.8} />
      </mesh>
      {/* HTML overlay — no font worker needed */}
      <Html
        position={[0, 0, 0.12]}
        center
        distanceFactor={10}
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        <div style={{
          textAlign: 'center',
          fontFamily: 'Inter, system-ui, sans-serif',
          lineHeight: 1.3,
          width: '280px',
        }}>
          <div style={{ color: '#FFFFFF', fontSize: '14px', fontWeight: 700 }}>
            SpeakVerse™ — English Learning Lab
          </div>
          <div style={{ color: '#A0C4FF', fontSize: '10px', marginTop: '4px' }}>
            Click a glowing station below to begin
          </div>
        </div>
      </Html>
    </group>
  )
}

// ── Main classroom canvas ───────────────────────────────────────────────────
function ClassroomCanvas({ onStationClick, activeStation }: ClassroomSceneProps) {
  return (
    <Canvas
      shadows
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      style={{ background: '#EEF2F8' }}
      onCreated={({ gl }) => {
        // Handle WebGL context loss gracefully
        gl.domElement.addEventListener('webglcontextlost', (e) => {
          e.preventDefault()
          console.warn('[ClassroomScene] WebGL context lost')
        })
      }}
    >
      <Suspense fallback={null}>
        <PerspectiveCamera makeDefault position={[0, 5, 9]} fov={55} />
        <OrbitControls
          target={[0, 0, 0]}
          maxPolarAngle={Math.PI / 2.2}
          minDistance={5}
          maxDistance={16}
          enablePan={false}
        />

        {/* Lighting — natural, soft, classroom feel */}
        <ambientLight intensity={0.7} />
        <directionalLight
          position={[5, 10, 5]}
          intensity={1.2}
          castShadow
          shadow-mapSize={[1024, 1024]}
          shadow-camera-far={30}
        />
        <directionalLight position={[-5, 8, -5]} intensity={0.4} />
        {/* Window light simulation */}
        <pointLight position={[-8, 4, 0]} intensity={0.5} color="#FFF9F0" />
        <pointLight position={[8, 4, 0]}  intensity={0.5} color="#FFF9F0" />

        {/* Classroom structure */}
        <ClassroomRoom />

        {/* Interactive learning stations */}
        {STATIONS.map((station) => (
          <LearningStation
            key={station.id}
            {...station}
            isActive={activeStation === station.id}
            onClick={() => onStationClick(station.id)}
          />
        ))}

        {/* Front board — HTML overlay, no troika font worker */}
        <FrontBoard />
      </Suspense>
    </Canvas>
  )
}

// ── Public export — wrapped in Error Boundary ───────────────────────────────
export function ClassroomScene({ onStationClick, activeStation }: ClassroomSceneProps) {
  function handleError(msg: string) {
    console.error('[ClassroomScene] Falling back due to:', msg)
  }

  return (
    <div
      className="w-full h-full"
      role="application"
      aria-label="3D interactive classroom — use Tab to navigate stations, Enter to select"
    >
      <CanvasErrorBoundary onError={handleError}>
        <ClassroomCanvas onStationClick={onStationClick} activeStation={activeStation} />
      </CanvasErrorBoundary>
    </div>
  )
}
