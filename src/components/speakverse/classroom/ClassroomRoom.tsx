'use client'

export function ClassroomRoom() {
  return (
    <group>
      {/* Floor */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[20, 16]} />
        <meshStandardMaterial color="#E8EDF5" roughness={0.9} />
      </mesh>

      {/* Floor tiles subtle grid */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[20, 16]} />
        <meshStandardMaterial color="#DDEAF5" roughness={0.95} transparent opacity={0.3} wireframe />
      </mesh>

      {/* Back wall */}
      <mesh receiveShadow position={[0, 3, -6]}>
        <boxGeometry args={[20, 8, 0.2]} />
        <meshStandardMaterial color="#F5F7FA" roughness={0.95} />
      </mesh>

      {/* Left wall */}
      <mesh receiveShadow position={[-10, 3, 0]}>
        <boxGeometry args={[0.2, 8, 16]} />
        <meshStandardMaterial color="#F0F4F9" roughness={0.95} />
      </mesh>

      {/* Right wall */}
      <mesh receiveShadow position={[10, 3, 0]}>
        <boxGeometry args={[0.2, 8, 16]} />
        <meshStandardMaterial color="#F0F4F9" roughness={0.95} />
      </mesh>

      {/* Ceiling */}
      <mesh position={[0, 6, 0]}>
        <boxGeometry args={[20, 0.2, 16]} />
        <meshStandardMaterial color="#FFFFFF" roughness={1} />
      </mesh>

      {/* Windows on left wall */}
      {[-3, 1, 5].map((z, i) => (
        <group key={i} position={[-9.8, 3.5, z]}>
          <mesh>
            <boxGeometry args={[0.1, 2.5, 1.8]} />
            <meshStandardMaterial color="#B8D4F0" transparent opacity={0.6} roughness={0.1} metalness={0.1} />
          </mesh>
          {/* Window frame */}
          <mesh>
            <boxGeometry args={[0.15, 2.7, 0.1]} />
            <meshStandardMaterial color="#FFFFFF" />
          </mesh>
        </group>
      ))}

      {/* Teacher desk at front */}
      <group position={[0, 0, -4.5]}>
        <mesh castShadow receiveShadow position={[0, 0.4, 0]}>
          <boxGeometry args={[2.5, 0.08, 1]} />
          <meshStandardMaterial color="#8B6914" roughness={0.7} />
        </mesh>
        {/* Desk legs */}
        {[[-1.1, -1.1], [-1.1, 1.1], [1.1, -1.1], [1.1, 1.1]].map(([x, z], i) => (
          <mesh key={i} castShadow position={[x * 0.5, 0.2, z * 0.4]}>
            <boxGeometry args={[0.06, 0.4, 0.06]} />
            <meshStandardMaterial color="#6B5010" roughness={0.8} />
          </mesh>
        ))}
      </group>

      {/* Student desks — 3 rows x 4 columns */}
      {Array.from({ length: 3 }, (_, row) =>
        Array.from({ length: 4 }, (_, col) => (
          <group key={`${row}-${col}`} position={[col * 2.2 - 3.3, 0, row * 2 - 0.5]}>
            <mesh castShadow receiveShadow position={[0, 0.35, 0]}>
              <boxGeometry args={[1.2, 0.06, 0.7]} />
              <meshStandardMaterial color="#C8A96E" roughness={0.75} />
            </mesh>
            {/* Legs */}
            {[[-0.5, -0.3], [-0.5, 0.3], [0.5, -0.3], [0.5, 0.3]].map(([lx, lz], i) => (
              <mesh key={i} castShadow position={[lx, 0.16, lz]}>
                <boxGeometry args={[0.04, 0.32, 0.04]} />
                <meshStandardMaterial color="#A0845A" roughness={0.8} />
              </mesh>
            ))}
            {/* Chair */}
            <mesh castShadow position={[0, 0.22, 0.55]}>
              <boxGeometry args={[1, 0.05, 0.7]} />
              <meshStandardMaterial color="#2458A6" roughness={0.6} />
            </mesh>
          </group>
        ))
      )}

      {/* Baseboard / floor trim */}
      <mesh position={[0, 0.05, -5.9]}>
        <boxGeometry args={[20, 0.12, 0.05]} />
        <meshStandardMaterial color="#DDE3EE" />
      </mesh>
    </group>
  )
}
