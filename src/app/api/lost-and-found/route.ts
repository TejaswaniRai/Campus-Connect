import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { lostAndFoundStore } from '@/lib/lost-and-found-store'

export const dynamic = 'force-dynamic'

const createItemSchema = z.object({
  type: z.enum(['lost', 'found']),
  title: z.string().min(2),
  description: z.string().min(2),
  category: z.string().min(2),
  location: z.string().min(2),
  dateTime: z.string().min(1),
  reportedBy: z.string().min(2),
  contact: z.string().min(2),
  foundByName: z.string().optional()
})

export async function GET() {
  return NextResponse.json(await lostAndFoundStore.getAll())
}

export async function POST(request: NextRequest) {
  try {
    const item = await lostAndFoundStore.add(createItemSchema.parse(await request.json()))
    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    console.error('Error creating lost and found item:', error)
    return NextResponse.json({ error: 'Failed to create lost and found report' }, { status: 500 })
  }
}
