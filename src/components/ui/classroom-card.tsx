'use client'

import React from 'react'
import { motion } from 'framer-motion'

interface ClassroomCardProps {
  roomNumber: string
  status: 'free' | 'occupied' | 'maintenance' | 'extra'
  capacity?: number
  currentBooking?: {
    batchName: string
    lectureName: string
    timeSlot: string
    teacherName?: string
    courseName?: string
  }
  onClick?: () => void
}

export const ClassroomCard = ({ roomNumber, status, capacity, currentBooking, onClick }: ClassroomCardProps) => {
  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ y: -2 }}
      className="relative overflow-hidden rounded-sm border border-slate-700 bg-slate-900 p-4 text-slate-100 cursor-pointer group shadow-sm hover:border-amber-400 hover:shadow-lg transition-all"
      onClick={onClick}
    >
      <div className="absolute inset-y-0 left-0 w-1 bg-emerald-400 opacity-70 group-hover:opacity-100 transition-opacity" />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold tracking-tight">{roomNumber}</h3>
          <span className={`text-xs font-medium ${status === 'maintenance' ? 'text-amber-300' : status === 'occupied' ? 'text-rose-300' : 'text-emerald-300'}`}>
            {status === 'maintenance' ? 'Maintenance' : status === 'occupied' ? 'Occupied' : 'Available'}
          </span>
        </div>

        <p className="text-xs text-slate-400">Capacity {capacity ?? 30} &middot; Tap to view timetable</p>
        
        {currentBooking && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 space-y-1 text-sm text-slate-300"
          >
            <p>{currentBooking.batchName}</p>
            <p>{currentBooking.teacherName}</p>
            <p>{currentBooking.courseName}</p>
            <p>{currentBooking.lectureName}</p>
            {currentBooking.timeSlot && (
              <p className="text-xs">{currentBooking.timeSlot}</p>
            )}
          </motion.div>
        )}
      </div>

    </motion.div>
  )
}
