"use client"

import React, { useState, useMemo } from 'react'
import { useMutation, useQueryClient, useQueries } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { CalendarPlus } from 'lucide-react'
import { TIME_SLOTS } from '@/lib/schedule-store'
import { getRoomCapacity, isMaintenanceSchedule } from '@/lib/room-config'
import { BookingModal } from '@/components/ui/booking-modal'
import { useToast } from '@/components/ui/use-toast'
import { DashboardStats } from '@/components/ui/dashboard-stats'
import { FloorView } from '@/components/ui/floor-view'
import type { Room, Floor } from '@/types/floor'

// Fetch schedule data
async function fetchSchedule(date?: string) {
  const url = date 
    ? `/api/schedule?date=${date}`
    : '/api/schedule'
  const response = await fetch(url)
  if (!response.ok) throw new Error('Failed to fetch schedule')
  return response.json()
}

interface BookingRequest {
  roomNumber: string
  timeSlot: string
  batchName: string
  date: string
  teacherName?: string
  courseName?: string
}

async function bookClassroom({ roomNumber, timeSlot, batchName, date, teacherName, courseName }: BookingRequest) {
  if (!date || (typeof date !== 'string' && !(date as Date).toISOString)) {
    throw new Error('Invalid date value provided for booking')
  }
  const dateString = typeof date === 'string' ? date : (date as Date).toISOString()
  const response = await fetch('/api/schedule', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ roomNumber, timeSlot, batchName, date: dateString, teacherName, courseName })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to book classroom')
  }

  return response.json()
}

interface BookingDetails {
  batchName: string;
  teacherName?: string;
  courseName?: string;
}

// interface DailySchedule {
//   [roomNumber: string]: {
//     [timeSlot in typeof TIME_SLOTS[number]]?: BookingDetails | null;
//   };
// }

// Remove unused interface
// interface Schedule extends DailySchedule {
//   dates: {
//     [date: string]: DailySchedule;
//   };
// }

export default function AdminDashboard() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState('')
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedFloor, setSelectedFloor] = useState(1)

  // Set selectedDate on client to avoid hydration mismatch
  React.useEffect(() => {
    if (selectedDate === null) {
      setSelectedDate(new Date())
    }
  }, [selectedDate])

  // Helper to get next 7 weekdays dates as strings YYYY-MM-DD
  const getNextWeekdays = () => {
    const dates: string[] = []
    let date = new Date()
    while (dates.length < 7) {
      const day = date.getDay()
      if (day !== 0 && day !== 6) {
        dates.push(date.toISOString().split('T')[0])
      }
      date = new Date(date.getTime() + 24 * 60 * 60 * 1000)
    }
    return dates
  }

  const nextWeekdays = getNextWeekdays()

  // Fetch schedules for next 7 weekdays
  const schedulesQueries = useQueries({
    queries: nextWeekdays.map(dateStr => ({
      queryKey: ['schedule', dateStr],
      queryFn: () => fetchSchedule(dateStr),
      staleTime: 1000 * 60 * 5 // 5 minutes cache
    }))
  })

  // Aggregate upcoming bookings from multiple dates
  const upcomingBookings = useMemo(() => {
    const bookings: {
      room: string
      time: string
      batch: string
      date: string
    }[] = []

    schedulesQueries.forEach((query, idx) => {
      if (query.data) {
        const dateStr = nextWeekdays[idx]
        const rooms = Object.entries(query.data as Record<string, Record<string, BookingDetails | null>>)
        rooms.forEach(([roomNumber, roomSchedule]) => {
          Object.entries(roomSchedule).forEach(([timeSlot, booking]) => {
            if (booking) {
              bookings.push({
                room: roomNumber,
                time: timeSlot,
                batch: (booking as BookingDetails).batchName,
                date: dateStr
              })
            }
          })
        })
      }
    })

    // Sort bookings by date and time slot
    bookings.sort((a, b) => {
      if (a.date === b.date) {
        return TIME_SLOTS.indexOf(a.time as typeof TIME_SLOTS[number]) - TIME_SLOTS.indexOf(b.time as typeof TIME_SLOTS[number])
      }
      return a.date.localeCompare(b.date)
    })

    return bookings.slice(0, 10) // Limit to 10 upcoming bookings
  }, [schedulesQueries, nextWeekdays])

  // Use selectedDate schedule for floorData
  const selectedDateStr = selectedDate ? selectedDate.toISOString().split('T')[0] : ''
  const selectedIndex = nextWeekdays.indexOf(selectedDateStr)
  const selectedSchedule = selectedIndex !== -1 ? schedulesQueries[selectedIndex]?.data : undefined

  const floorData: Floor[] = useMemo(() => {
    if (!selectedSchedule) return []

    return Array.from({ length: 5 }, (_, floor) => {
      const rooms = Array.from({ length: 6 }, (_, room) => {
        const roomNumber = `CSE-${floor + 1}${(room + 1).toString().padStart(2, '0')}`
        const roomSchedule = selectedSchedule[roomNumber] || {}

        const hasBookings = Object.values(roomSchedule).some(Boolean)
        const isMaintenance = isMaintenanceSchedule(roomSchedule)

        return {
          roomNumber,
          status: isMaintenance ? 'maintenance' : hasBookings ? 'occupied' : 'free' as Room['status'],
          capacity: getRoomCapacity(roomNumber),
          schedule: roomSchedule,
          currentBooking: hasBookings
              ? {
                  batchName: 'View daily schedule',
                  teacherName: undefined,
                  courseName: undefined,
                  timeSlot: '',
                  lectureName: 'Room timetable'
                }
              : undefined
        }
      }).filter((room) => !['CSE-103', 'CSE-104', 'CSE-203'].includes(room.roomNumber))

      return {
        number: floor + 1,
        rooms
      }
    })
  }, [selectedSchedule])

  // Calculate dashboard stats
  const stats = useMemo(() => {
    if (!floorData.length) return null

    const rooms = floorData.flatMap(floor => floor.rooms)
    const freeRooms = rooms.filter(room => room.status === 'free').length
    const bookedRooms = rooms.filter(room => room.status === 'occupied').length
    const maintenanceRooms = rooms.filter(room => room.status === 'maintenance').length

    return { freeRooms, bookedRooms, maintenanceRooms, upcomingBookings }
  }, [floorData, upcomingBookings])

  // Handler to update selectedDate when clicking on upcoming booking
  // const handleUpcomingBookingClick = (date: string) => {
  //   setSelectedDate(new Date(date))
  // }

  // Mutation for booking
  const bookMutation = useMutation({
    mutationFn: bookClassroom,
    onSuccess: () => {
      // Invalidate all schedule queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['schedule'] })
      toast({
        title: 'Success',
        description: 'Classroom booked successfully'
      })
      setIsBookingModalOpen(false)
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      })
    }
  })

const handleBookingSubmit = (data: { roomNumber: string; timeSlot: string; batchName: string; date: string | Date; teacherName?: string; courseName?: string }) => {
    const bookingData = {
      ...data,
      date: typeof data.date === 'string' ? data.date : (data.date as Date).toISOString().split('T')[0] // Convert Date to YYYY-MM-DD string if Date object
    }
    bookMutation.mutate(bookingData)
  }

  const handleRoomClick = (roomNumber: string) => setSelectedRoom(roomNumber)

  if (!selectedSchedule || !stats || !selectedDate) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-950 to-purple-950 p-6">
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
          className="text-center text-white"
        >
          Loading...
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="p-6 max-w-7xl mx-auto space-y-8">
        {/* Date Picker */}
        <div className="flex justify-center">
          <div className="bg-card rounded-md p-4 border shadow-sm max-w-xs">
            <input
              type="date"
              className="w-full p-2 rounded bg-white text-black"
              value={selectedDate ? selectedDate.toISOString().split('T')[0] : ''}
              min={typeof window !== 'undefined' ? new Date().toISOString().split('T')[0] : ''}
              onChange={(e) => {
                const date = new Date(e.target.value)
                if (date.getDay() !== 0 && date.getDay() !== 6) {
                  setSelectedDate(date)
                }
              }}
              disabled={selectedDate === null}
            />
            <p className="text-xs text-muted-foreground mt-1">Select a date (weekdays only)</p>
          </div>
        </div>

        {/* Dashboard Stats */}
          <DashboardStats freeRooms={stats?.freeRooms} bookedRooms={stats?.bookedRooms} maintenanceRooms={stats?.maintenanceRooms} />

        {/* Book a Classroom Button */}
        <div className="flex justify-center mt-4">
          <button
            onClick={() => setIsBookingModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-sm bg-amber-400 px-5 py-3 font-semibold text-slate-950 shadow-lg shadow-amber-400/20 transition-colors hover:bg-amber-300"
          >
            <CalendarPlus className="h-4 w-4" />
            Book a room
          </button>
        </div>

        {/* Upcoming Bookings removed as regular classes drive availability */}

        {/* Floor Plans */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-2 text-sm font-medium">Room availability</span>
            {floorData.map((floor) => (
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
          {floorData[selectedFloor - 1] && (
            <FloorView
              floor={floorData[selectedFloor - 1]}
              onRoomClick={handleRoomClick}
              view="2d"
            />
          )}
        </div>


        {/* Booking Modal */}
        <BookingModal
          isOpen={isBookingModalOpen}
          onClose={() => setIsBookingModalOpen(false)}
          onSubmit={handleBookingSubmit}
          selectedRoom={selectedRoom}
          isPending={bookMutation.isPending}
        />
      </div>
    </div>
  )
}
