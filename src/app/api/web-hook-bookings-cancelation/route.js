import { sanityAdminClient } from '@/lib/sanityAdmin'
import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'



export async function POST(req) {
  try {
    // Handle CORS headers
    const headers = new Headers()
    headers.set('Access-Control-Allow-Origin', '*')
    headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
    headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    // Verify Authorization header
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - Missing token' },
        { status: 403, headers }
      )
    }

    // Verify JWT
    const token = authHeader.split(' ')[1]
    try {
      jwt.verify(token, process.env.SIGNATURE_KEY)
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 403, headers }
      )
    }


    const operation = req.headers.get('sanity-operation')

    const sanityProjectId = req.headers.get('sanity-project-id')
    if (sanityProjectId !== process.env.NEXT_PUBLIC_SANITY_PROJECT_ID) {
      return NextResponse.json(
        { error: 'Unauthorized project/dataset' },
        { status: 403, headers }
      )
    }

    // Process booking data
    const booking = await req.json()
    const { room, bookedPeriod, status, _id } = booking;
    const roomId = room?._ref;

    if( _id.includes('draft')){
      return NextResponse.json(
        { error: 'Make to a published booking' },
        { status: 200, headers }
      )
    }

    if (!booking || !roomId || !bookedPeriod) {
      return NextResponse.json(
        { error: 'Invalid booking data' },
        { status: 400, headers }
      )
    }

    // Fetch and update Sanity document
    const roomData = await sanityAdminClient.getDocument(roomId)
    if (!roomData) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404, headers }
      )
    }

    let updatedBookedPeriods = roomData.bookedPeriods || []

    if (status === 'cancelled' || operation === 'delete') {
      updatedBookedPeriods = updatedBookedPeriods.filter(
        period => period._key.split('__^^__')[0] !== _id
      )
      await sanityAdminClient
      .patch(roomId)
      .set({ bookedPeriods: updatedBookedPeriods })
      .commit()
    }



    return NextResponse.json(
      { message: 'Room updated successfully' },
      { status: 200, headers }
    )

  } catch (error) {
    console.error('Booking Update Error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

export async function OPTIONS() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  })
}