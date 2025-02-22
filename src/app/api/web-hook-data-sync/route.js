import { adminAccessDb as db } from '@/lib/firebase-admin'
import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

export async function POST(req) {
  try {
    // Handle CORS headers
    const headers = new Headers()
    headers.set('Access-Control-Allow-Origin', '*')
    headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
    headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    // Handle preflight request
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers })
    }

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

    // Validate Sanity headers
    const sanityProjectId = req.headers.get('sanity-project-id')
    if (sanityProjectId !== process.env.NEXT_PUBLIC_SANITY_PROJECT_ID) {
      return NextResponse.json(
        { error: 'Unauthorized project/dataset' },
        { status: 403, headers }
      )
    }

    // Process webhook data
    const data = await req.json()
    const operation = req.headers.get('sanity-operation')
    const id = req.headers.get('sanity-document-id')
    const { _type } = data

    if (!operation || !_type || !id) {
      return NextResponse.json(
        { 
          error: 'Missing required fields',
          required: ['sanity-operation (header)', '_type (body)', '_id (header)']
        },
        { status: 400, headers }
      )
    }

    // Prepare document data
    const { _id, _createdAt, _updatedAt, _rev, ...documentData } = data
    const documentPayload = {
      ...documentData,
      status: id.includes('draft') ? 'draft' : 'published',
      sanityMetadata: {
        _type,
        _id,
        createdAt: _createdAt,
        updatedAt: _updatedAt,
        revision: _rev
      }
    }

    // Handle operations
    switch (operation.toLowerCase()) {
      case 'create':
      case 'update':
        await db.collection(_type).doc(id).set(documentPayload, { merge: true })
        break
      case 'delete':
        await db.collection(_type).doc(id).delete()
        break
      default:
        return NextResponse.json(
          { error: `Invalid operation: ${operation}` },
          { status: 400, headers }
        )
    }

    return NextResponse.json(
      {
        success: true,
        operation,
        documentId: id,
        collection: _type,
        timestamp: new Date().toISOString()
      },
      { status: 200, headers }
    )

  } catch (error) {
    console.error('Webhook Processing Error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error', message: error.message },
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