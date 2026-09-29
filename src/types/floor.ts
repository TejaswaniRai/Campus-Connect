export type RoomStatus = 'occupied' | 'free' | 'maintenance' | 'extra'

export type Booking = {
  batchName: string
  timeSlot: string
  lectureName: string
  teacherName?: string
  courseName?: string
}

export type RoomSchedule = Record<string, {
  batchName?: string
  teacherName?: string
  courseName?: string
} | null>

export type Room = {
  roomNumber: string
  status: RoomStatus
  capacity?: number
  currentBooking?: Booking
  schedule?: RoomSchedule
}

export type Floor = {
  number: number
  rooms: Room[]
}
