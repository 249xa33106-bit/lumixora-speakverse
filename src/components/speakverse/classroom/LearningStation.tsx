'use client'
import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import type { Mesh } from 'three'
import type { StationId } from './ClassroomScene'

interface LearningStationProps {
  id: StationId
  position: [number, number, number]
  label: string
  color: string
  emoji: string
  isActive: boolean
  onClick: () => void
}

export function LearningStation({ id, position, label, color, emoji, isActive, onClick }: LearningStationProps) {
  const meshRef = useRef<Mesh>(null)
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)

  // Gentle bob animation
  useFrame((state) => {
    if (!meshRef.current) return
    const t = state.clock.elapsedTime
    meshRef.current.position.y = Math.sin(t * 1.2 + position[0]) * 0.08 + 0.6
    if (isActive || hovered || focused) {
      meshRef.current.rotation.y += 0.01
    }
  })

  const cleanLabel = label.replace('\n', ' ')

  return (
    <group
      position={position}
      onClick={(e) => { e.stopPropagation(); onClick() }}
      onPointerOver={() => { setHovered(true); document.body.style.cursor = 'pointer' }}
      onPointerOut={() => { setHovered(false); document.body.style.cursor = 'auto' }}
    >
      {/* Station pillar */}
      <mesh castShadow receiveShadow position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.08, 0.1, 0.8, 8]} />
        <meshStandardMaterial color={color} roughness={0.4} metalness={0.2} />
      </mesh>

      {/* Station orb */}
      <mesh ref={meshRef} castShadow position={[0, 0.6, 0]}>
        <sphereGeometry args={[0.35, 24, 24]} />
        <meshStandardMaterial
          color={isActive ? '#FFFFFF' : color}
          emissive={color}
          emissiveIntensity={isActive ? 0.9 : (hovered || focused) ? 0.6 : 0.25}
          roughness={0.2}
          metalness={0.4}
        />
      </mesh>

      {/* Interactive label with full keyboard and screen reader accessibility */}
      <Html
        position={[0, 1.25, 0]}
        center
        distanceFactor={8}
        occlude
      >
        <button
          type="button"
          tabIndex={0}
          role="button"
          aria-label={`${cleanLabel} station. Press Enter to select.`}
          aria-pressed={isActive}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              e.stopPropagation()
              onClick()
            }
          }}
          onClick={(e) => {
            e.stopPropagation()
            onClick()
          }}
          style={{
            background: isActive ? color : 'rgba(255, 255, 255, 0.96)',
            color: isActive ? '#FFFFFF' : '#17243A',
            border: `2px solid ${focused ? '#000000' : color}`,
            outline: focused ? `3px solid ${color}` : 'none',
            outlineOffset: '2px',
            borderRadius: '10px',
            padding: '6px 12px',
            fontSize: '12px',
            fontFamily: 'Inter, system-ui, sans-serif',
            fontWeight: 600,
            whiteSpace: 'pre-line',
            textAlign: 'center',
            cursor: 'pointer',
            userSelect: 'none',
            boxShadow: isActive
              ? `0 0 18px ${color}88`
              : focused
              ? `0 0 12px ${color}66`
              : '0 2px 8px rgba(0,0,0,0.12)',
            transform: hovered || focused ? 'scale(1.05)' : 'scale(1)',
            transition: 'all 0.2s ease',
            minWidth: '95px',
          }}
        >
          <div style={{ fontSize: '20px', marginBottom: '2px' }} aria-hidden="true">{emoji}</div>
          {label}
        </button>
      </Html>

      {/* Base platform */}
      <mesh receiveShadow position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.5, 0.55, 0.04, 16]} />
        <meshStandardMaterial color={isActive ? color : '#DFE5EE'} roughness={0.8} />
      </mesh>
    </group>
  )
}
