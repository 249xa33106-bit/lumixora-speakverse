'use client'
import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
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

export function LearningStation({ position, color, isActive, onClick }: LearningStationProps) {
  const meshRef = useRef<Mesh>(null)
  const [hovered, setHovered] = useState(false)

  // Smooth bob animation with capped frame rates
  useFrame((state) => {
    if (!meshRef.current) return
    const t = state.clock.elapsedTime
    meshRef.current.position.y = Math.sin(t * 1.5 + position[0]) * 0.08 + 0.65
    if (isActive || hovered) {
      meshRef.current.rotation.y += 0.02
    }
  })

  return (
    <group
      position={position}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      onPointerOver={() => {
        setHovered(true)
        if (typeof document !== 'undefined') document.body.style.cursor = 'pointer'
      }}
      onPointerOut={() => {
        setHovered(false)
        if (typeof document !== 'undefined') document.body.style.cursor = 'auto'
      }}
    >
      {/* Base platform */}
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.55, 0.6, 0.05, 16]} />
        <meshStandardMaterial color={isActive ? color : '#CBD5E1'} roughness={0.6} />
      </mesh>

      {/* Station pillar */}
      <mesh position={[0, 0.35, 0]}>
        <cylinderGeometry args={[0.07, 0.09, 0.7, 12]} />
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.2} />
      </mesh>

      {/* Station orb */}
      <mesh ref={meshRef} position={[0, 0.65, 0]}>
        <sphereGeometry args={[0.32, 18, 18]} />
        <meshStandardMaterial
          color={isActive ? '#FFFFFF' : color}
          emissive={color}
          emissiveIntensity={isActive ? 1.0 : hovered ? 0.7 : 0.3}
          roughness={0.2}
          metalness={0.3}
        />
      </mesh>

      {/* Pulsing ring indicator */}
      {isActive && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
          <ringGeometry args={[0.65, 0.75, 24]} />
          <meshBasicMaterial color={color} />
        </mesh>
      )}
    </group>
  )
}
