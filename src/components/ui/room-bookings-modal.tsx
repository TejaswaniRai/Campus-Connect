'use client'

import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { TIME_SLOTS } from '@/lib/schedule-store'

interface BookingItem {
  batchName?: string
  teacherName?: string
  courseName?: string
  timeSlot?: string
  lectureName?: string
}

interface RoomBookingsModalProps {
  isOpen: boolean
  onClose: () => void
  roomNumber: string | null
  roomSchedule: Record<string, { batchName?: string; teacherName?: string; courseName?: string } | null> | null
}

export function RoomBookingsModal({ isOpen, onClose, roomNumber, roomSchedule }: RoomBookingsModalProps) {
  const bookings: BookingItem[] = React.useMemo(() => {
    if (!roomSchedule || !roomNumber) return []
    const items: BookingItem[] = []
    Object.entries(roomSchedule).forEach(([slot, booking]) => {
      if (booking) {
        const isLab = (booking.courseName || '').toLowerCase().includes('lab')
        items.push({
          batchName: booking.batchName,
          teacherName: booking.teacherName,
          courseName: booking.courseName,
          lectureName: isLab ? 'Lab' : 'Lecture',
          timeSlot: slot
        })
      }
    })
    // Sort by TIME_SLOTS order
    items.sort((a, b) => (TIME_SLOTS as readonly string[]).indexOf(a.timeSlot || '') - (TIME_SLOTS as readonly string[]).indexOf(b.timeSlot || ''))
    return items
  }, [roomSchedule, roomNumber])

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="bg-white/10 backdrop-blur-xl border-white/20 text-white">
        <DialogHeader>
          <DialogTitle>Room - {roomNumber}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          {bookings.length === 0 && (
            <p className="text-white/70">No bookings for this date.</p>
          )}
          {bookings.map((b, idx) => (
            <div key={idx} className="p-3 rounded-lg border border-white/10 bg-white/5">
              {b.batchName && <p className="font-medium">{b.batchName}</p>}
              {b.teacherName && <p className="text-white/80">{b.teacherName}</p>}
              {b.courseName && <p className="text-white/80">{b.courseName}</p>}
              {b.lectureName && <p className="text-white/70">{b.lectureName}</p>}
              {b.timeSlot && <p className="text-xs text-white/60">{b.timeSlot}</p>}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}


