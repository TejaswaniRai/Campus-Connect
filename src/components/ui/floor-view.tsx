'use client'

import React from 'react'
import { motion } from 'framer-motion'
// import { useRef, useEffect } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame } from '@react-three/fiber'
// import { extend } from '@react-three/fiber'
import { OrbitControls, Text } from '@react-three/drei'
import { ClassroomCard } from './classroom-card'
import { getCurrentTimeSlot, TIME_SLOTS } from '@/lib/schedule-store'

interface Room {
  roomNumber: string
  status: 'free' | 'occupied' | 'maintenance' | 'extra'
  capacity?: number
  currentBooking?: {
    batchName: string
    teacherName?: string
    courseName?: string
    lectureName: string
    timeSlot: string
  }
  schedule?: Record<string, {
    batchName?: string
    teacherName?: string
    courseName?: string
  } | null>
}

interface Floor {
  number: number
  rooms: Room[]
}

// 3D Floor Visualization with interactive selection and tooltip
const FloorModel = ({ rooms, onRoomSelect }: { rooms: Room[], onRoomSelect: (roomNumber: string) => void }) => {
  // const { viewport, camera } = useThree()
  const [hoveredRoom, setHoveredRoom] = React.useState<string | null>(null)
  // const [selectedRoom, setSelectedRoom] = React.useState<string | null>(null)
  const groupRef = React.useRef<THREE.Group>(null)

  // Animate pulsing effect for free rooms
  useFrame(() => {
    if (!groupRef.current) return
    groupRef.current.children.forEach((child) => {
      const mesh = child as THREE.Mesh
      if (mesh.userData.status === 'free') {
        const scale = 1 + 0.1 * Math.sin(Date.now() / 300)
        mesh.scale.set(scale, 1, scale)
      } else {
        mesh.scale.set(1, 1, 1)
      }
    })
  })

  const handlePointerOver = (event: unknown, roomNumber: string) => {
    if (event && typeof (event as Event).stopPropagation === 'function') {
      (event as Event).stopPropagation()
    }
    setHoveredRoom(roomNumber)
  }

  const handlePointerOut = (event: unknown) => {
    if (event && typeof (event as Event).stopPropagation === 'function') {
      (event as Event).stopPropagation()
    }
    setHoveredRoom(null)
  }

  const handleClick = (roomNumber: string) => {
    // setSelectedRoom(roomNumber)
    onRoomSelect(roomNumber)
  }

  return (
    <>
      <group ref={groupRef} position={[0, 0, 0]}>
        {/* Floor base */}
        <mesh position={[0, -0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[10, 10]} />
          <meshStandardMaterial color="#1a1a1a" />
        </mesh>

        {/* Rooms */}
        {rooms.map((room, index) => {
          const row = Math.floor(index / 3)
          const col = index % 3
          const x = (col - 1) * 3
          const z = (row - 1) * 3

          const baseColor = room.status === 'free'
            ? '#4ade80'
            : room.status === 'occupied'
              ? '#ef4444'
              : '#eab308'

          const isHovered = hoveredRoom === room.roomNumber
          // const isSelected = selectedRoom === room.roomNumber

          return (
            <group
              key={room.roomNumber}
              position={[x, 0, z]}
              onPointerOver={(e) => handlePointerOver(e, room.roomNumber)}
              onPointerOut={handlePointerOut}
              onClick={() => handleClick(room.roomNumber)}
              scale={1}
            >
              <mesh userData={{ status: room.status }}>
                <boxGeometry args={[2.5, 0.1, 2.5]} />
                <meshStandardMaterial
                  color={isHovered ? '#60a5fa' : baseColor}
                  transparent
                  opacity={isHovered ? 1 : 0.7}
                />
              </mesh>
              <Text
                position={[0, 0.5, 0]}
                fontSize={0.3}
                color={isHovered ? '#60a5fa' : 'white'}
                anchorX="center"
                anchorY="middle"
              >
                {room.roomNumber}
              </Text>
            </group>
          )
        })}
      </group>

      {/* Tooltip */}
      {hoveredRoom && (
        <HtmlTooltip room={rooms.find(r => r.roomNumber === hoveredRoom)!} />
      )}
    </>
  )
}

// Tooltip component for 3D rooms
const HtmlTooltip = ({ room }: { room: Room }) => {
  return (
    <div className="absolute top-10 left-10 p-2 bg-gray-900 bg-opacity-90 rounded shadow-lg text-white text-xs z-50 pointer-events-none">
      <p>Room: {room.roomNumber}</p>
      <p>Status: {room.status}</p>
      {room.currentBooking && (
        <>
          <p>Batch: {room.currentBooking.batchName}</p>
          <p>Lecture: {room.currentBooking.lectureName}</p>
          <p>Time: {room.currentBooking.timeSlot}</p>
        </>
      )}
    </div>
  )
}

interface FloorViewProps {
  floor: Floor
  onRoomClick?: (roomNumber: string) => void
  view?: '2d' | '3d'
}

export const FloorView = ({ floor, onRoomClick, view = '2d' }: FloorViewProps) => {
  const [selectedRoomNumber, setSelectedRoomNumber] = React.useState<string | null>(null)
  const currentSlot = getCurrentTimeSlot()

  const handleRoomSelect = (roomNumber: string) => {
    setSelectedRoomNumber(roomNumber)
    onRoomClick?.(roomNumber)
  }

  const selectedRoom = floor.rooms.find((room) => room.roomNumber === selectedRoomNumber)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-sm border border-slate-800 bg-slate-950 p-5 text-slate-100 relative shadow-xl"
    >
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-400">Schedule board</p>
          <h2 className="mt-1 text-2xl font-semibold text-slate-100">Floor {floor.number} room availability</h2>
          <p className="mt-1 text-sm text-slate-400">Select a room to inspect the full day timetable.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
          <span className="border-l-2 border-amber-400 pl-2">Now: {currentSlot}</span>
          <span><span className="mr-1 inline-block h-2 w-2 bg-emerald-400" />Available</span>
          <span><span className="mr-1 inline-block h-2 w-2 bg-rose-400" />Occupied</span>
          <span><span className="mr-1 inline-block h-2 w-2 bg-amber-400" />Maintenance</span>
        </div>
      </div>

      {view === '3d' ? (
        <div className="h-[500px] rounded-lg overflow-hidden relative">
          <Canvas
            camera={{ position: [0, 10, 10], fov: 50 }}
            className="w-full h-full"
          >
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} />
            <FloorModel rooms={floor.rooms} onRoomSelect={handleRoomSelect} />
            <OrbitControls enableZoom={false} />
          </Canvas>
        </div>
      ) : (
        selectedRoom ? (
          <div className="space-y-5">
            <button
              type="button"
              onClick={() => setSelectedRoomNumber(null)}
              className="text-sm font-medium text-emerald-700 hover:text-emerald-900"
            >
              Back to Floor {floor.number}
            </button>
            <div className="rounded-sm border border-slate-700 bg-slate-900 p-4">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <div>
                  <p className="text-sm text-slate-400">Room timetable</p>
                  <h3 className="text-2xl font-semibold text-slate-100">{selectedRoom.roomNumber}</h3>
                  <p className="mt-1 text-xs text-slate-400">Capacity {selectedRoom.capacity ?? 30} people</p>
                </div>
                <p className="text-sm text-slate-300">
                  {selectedRoom.status === 'maintenance' ? 'Maintenance window' : selectedRoom.status === 'occupied' ? 'Occupied during one or more slots' : 'Available all day'}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {TIME_SLOTS.map((slot) => {
                const booking = selectedRoom.schedule?.[slot]
                return (
                  <div key={slot} className={`relative rounded-sm border p-3 ${slot === currentSlot ? 'border-amber-400 ring-1 ring-amber-400/50' : 'border-slate-700'} ${booking ? 'bg-rose-950/50' : 'bg-slate-900'}`}>
                    {slot === currentSlot && <span className="absolute right-2 top-2 text-[10px] font-semibold uppercase tracking-wider text-amber-300">Now</span>}
                    <p className="text-xs font-semibold text-slate-400">{slot}</p>
                    <p className={`mt-2 font-medium ${booking ? 'text-rose-200' : 'text-emerald-300'}`}>{booking ? booking.courseName || 'Occupied' : 'Available'}</p>
                    {booking?.batchName && <p className="text-sm text-slate-400">{booking.batchName}</p>}
                    {booking?.teacherName && <p className="text-sm text-slate-400">{booking.teacherName}</p>}
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {floor.rooms.map((room) => (
              <ClassroomCard
                key={room.roomNumber}
                {...room}
                onClick={() => handleRoomSelect(room.roomNumber)}
              />
            ))}
          </div>
        )
      )}

      {/* Removed fixed position selected room tooltip as per user request */}
      {/* {selectedRoom && (
        <div className="absolute bottom-4 right-4 p-4 bg-gray-900 bg-opacity-90 rounded shadow-lg text-white text-sm z-50">
          Selected Room: {selectedRoom}
        </div>
      )} */}
    </motion.div>
  )
}
