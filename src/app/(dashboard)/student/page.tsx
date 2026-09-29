'use client'


import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { format } from 'date-fns'
import { FloorView } from '@/components/ui/floor-view'
import { ScheduleCalendar } from '@/components/ui/schedule-calendar'
import { getRoomCapacity, isMaintenanceSchedule } from '@/lib/room-config'
import type { Floor, RoomStatus } from '@/types/floor'

interface BookingDetails {
  batchName: string
  teacherName?: string
  courseName?: string
  date?: string
}

interface RoomSchedule {
  [timeSlot: string]: BookingDetails | null
}

interface DailySchedule {
  [roomNumber: string]: RoomSchedule
}

// Function to fetch schedule data
async function fetchSchedule(date: string): Promise<DailySchedule> {
  const response = await fetch(`/api/schedule?date=${date}`)
  if (!response.ok) throw new Error('Failed to fetch schedule')
  return response.json()
}

// Function to transform API data into floor data
function transformScheduleData(schedule: DailySchedule): Floor[] {
  const floors = Array.from({ length: 5 }, (_, i) => i + 1).map(floorNumber => {
    const rooms = Array.from({ length: 6 }, (_, j) => {
      const roomNumber = `CSE-${floorNumber}${(j + 1).toString().padStart(2, '0')}`
      const roomSchedule = schedule[roomNumber] || {}

      const hasBookings = Object.values(roomSchedule).some(Boolean)
        const isMaintenance = isMaintenanceSchedule(roomSchedule)
      
      return {
        roomNumber,
          status: (isMaintenance ? 'maintenance' : hasBookings ? 'occupied' : 'free') as RoomStatus,
          capacity: getRoomCapacity(roomNumber),
        schedule: roomSchedule,
        currentBooking: hasBookings
            ? {
                batchName: 'View daily schedule',
                timeSlot: '',
                lectureName: 'Room timetable'
              }
            : undefined
      }
    }).filter((room) => !['CSE-103', 'CSE-104', 'CSE-203'].includes(room.roomNumber))

    return {
      number: floorNumber,
      rooms
    }
  })

  return floors
}

export default function StudentDashboard() {
  const [selectedDate, setSelectedDate] = useState(() => new Date())
  const formattedDate = format(selectedDate, 'yyyy-MM-dd')
  const [facultySearch, setFacultySearch] = useState('')
  const [facultyDepartment, setFacultyDepartment] = useState('')
  const [selectedFloor, setSelectedFloor] = useState(1)

  // Fetch schedule data with React Query
  const { data: scheduleData, error } = useQuery({
    queryKey: ['schedule', formattedDate],
    queryFn: () => fetchSchedule(formattedDate),
    refetchInterval: 5000 // Refetch every 5 seconds
  })

  if (error) {
    return (
      <div className="p-6 text-white">
        Error loading schedule: {error.message}
      </div>
    )
  }

  if (!scheduleData) {
    return (
      <div className="p-6 text-white">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
          className="text-center"
        >
          Loading...
        </motion.div>
      </div>
    )
  }

  const floors = transformScheduleData(scheduleData)
  const selectedFloorData = floors.find((floor) => floor.number === selectedFloor) || floors[0]

  return (
    <div className="min-h-screen bg-background">
      {/* Faculty Search (moved to top) */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-card rounded-md border p-4 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Faculty</h2>
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <input
              value={facultySearch}
              onChange={(e) => setFacultySearch(e.target.value)}
              placeholder="Search by name or email"
              className="h-11 flex-1 rounded-md border border-slate-300 bg-white px-3 text-foreground shadow-sm outline-none placeholder:text-slate-500 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            />
            <select
              value={facultyDepartment}
              onChange={(e) => setFacultyDepartment(e.target.value)}
              className="h-11 rounded-md border border-slate-300 bg-white px-3 text-foreground shadow-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            >
              <option value="">All Departments</option>
              <option value="CSE">CSE</option>
              <option value="CSE-AI">CSE-AI</option>
              <option value="CS-DS">CS-DS</option>
            </select>
          </div>
          <StudentFacultyResults search={facultySearch} department={facultyDepartment} />
        </div>
      </div>

      {/* Date Picker */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center space-x-4">
          <ScheduleCalendar
            date={selectedDate}
            onSelect={(date) => setSelectedDate(date)}
          />
          <p className="text-muted-foreground">
            Viewing schedule for {format(selectedDate, 'MMMM d, yyyy')}
          </p>
        </div>
      </div>

      {/* View Toggle */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-end mb-6">
          <div className="bg-card rounded-md p-1 border">
            <button
              className="px-4 py-2 rounded text-sm bg-accent text-accent-foreground cursor-default"
            >
              2D View
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-2 text-sm font-medium">Room availability</span>
            {floors.map((floor) => (
              <button
                key={floor.number}
                type="button"
                onClick={() => setSelectedFloor(floor.number)}
                className={`rounded-md border px-4 py-2 text-sm font-medium transition-colors ${selectedFloor === floor.number ? 'border-primary bg-emerald-50 text-emerald-800' : 'bg-white text-muted-foreground hover:bg-slate-50'}`}
              >
                Floor {floor.number}
              </button>
            ))}
          </div>
          {selectedFloorData && (
            <FloorView
              floor={selectedFloorData}
              view="2d"
            />
          )}
        </div>
      </div>
    </div>
  )
}

function StudentFacultyResults({ search, department }: { search: string; department: string }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['faculty', { search, department }],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (department) params.set('department', department)
      const res = await fetch(`/api/faculty?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch faculty')
      return res.json() as Promise<Array<{
        id: string
        name: string
        email: string
        phone: string
      }>>
    }
  })

  if (!search.trim()) {
    return <p className="text-white/60">Type a teacher name or email to search.</p>
  }
  if (isLoading) return <p className="text-white/70">Loading...</p>
  if (error) return <p className="text-red-400">Error loading faculty.</p>

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {(data || []).map((f) => (
        <div key={f.id} className="p-4 rounded-lg border border-white/10 bg-white/5 text-white">
          <h3 className="text-lg font-semibold">{f.name}</h3>
          <div className="mt-2 space-y-1 text-sm text-white/80">
            <p><strong>Email:</strong> {f.email}</p>
            <p><strong>Phone:</strong> {f.phone}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
