import { NextRequest, NextResponse } from 'next/server'
import { announcementsStore } from '@/lib/announcements-store'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const createAnnouncementSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  date: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid date format'
  }),
  teacherName: z.string().optional(),
  batchName: z.string().optional()
})

export async function GET() {
  try {
    const announcements = await announcementsStore.getAll()
    return NextResponse.json(announcements)
  } catch (error) {
    console.error('Error fetching announcements:', error)
    return NextResponse.json({ error: 'Failed to fetch announcements' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createAnnouncementSchema.parse(body)

    const announcement = await announcementsStore.add(validatedData)
    return NextResponse.json(announcement, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    console.error('Error creating announcement:', error)
    return NextResponse.json({ error: 'Failed to create announcement' }, { status: 500 })
  }
}
