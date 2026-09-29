import { motion } from 'framer-motion'
import { Clock, Users, AlertTriangle, Wrench } from 'lucide-react'
import { getCurrentTimeSlot } from '@/lib/schedule-store'

interface DashboardStatsProps {
  freeRooms: number
  bookedRooms: number
  maintenanceRooms?: number
}

export function DashboardStats({ freeRooms, bookedRooms, maintenanceRooms }: DashboardStatsProps) {
  const currentTimeSlot = getCurrentTimeSlot()

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="p-5 rounded-md border bg-card shadow-sm"
      >
        <div className="flex items-center space-x-4">
          <div className="p-3 rounded-md bg-emerald-50">
            <Users className="w-5 h-5 text-emerald-700" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Free rooms</p>
            <h3 className="text-2xl font-semibold">{freeRooms}</h3>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="p-5 rounded-md border bg-card shadow-sm"
      >
        <div className="flex items-center space-x-4">
          <div className="p-3 rounded-md bg-rose-50">
            <AlertTriangle className="w-5 h-5 text-rose-700" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Booked rooms</p>
            <h3 className="text-2xl font-semibold">{bookedRooms}</h3>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="p-5 rounded-md border bg-card shadow-sm"
      >
        <div className="flex items-center space-x-4">
          <div className="p-3 rounded-md bg-slate-100">
            <Clock className="w-5 h-5 text-slate-700" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Current slot</p>
            <h3 className="text-xl font-semibold">{currentTimeSlot}</h3>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15 }}
        className="p-5 rounded-md border bg-card shadow-sm"
      >
        <div className="flex items-center space-x-4">
          <div className="p-3 rounded-md bg-amber-50">
            <Wrench className="w-5 h-5 text-amber-700" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Maintenance</p>
            <h3 className="text-2xl font-semibold">{maintenanceRooms ?? 0}</h3>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
