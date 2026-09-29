import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { lostAndFoundStore } from '@/lib/lost-and-found-store'

const claimSchema = z.object({
  claimantName: z.string().min(2),
  claimantContact: z.string().min(2),
  proof: z.string().min(10, 'Please provide enough ownership detail to review the claim')
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const claim = await lostAndFoundStore.addClaim(id, claimSchema.parse(await request.json()))
    if (!claim) return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    return NextResponse.json(claim, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    console.error('Error creating lost and found claim:', error)
    return NextResponse.json({ error: 'Failed to submit claim' }, { status: 500 })
  }
}
