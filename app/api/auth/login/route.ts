/**
 * POST /api/auth/login
 * Authenticates user with phone number
 * Returns user data and session token
 */

import { prisma } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  console.log('[v0] /api/auth/login: Request received')
  try {
    const body = await request.json()
    const { phoneNumber } = body
    console.log('[v0] /api/auth/login: phoneNumber=', phoneNumber)

    // Validate input
    if (!phoneNumber) {
      console.log('[v0] /api/auth/login: Missing phone number')
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      )
    }

    // Find user by phone number
    console.log('[v0] /api/auth/login: Finding user...')
    const user = await prisma.user.findUnique({
      where: { phoneNumber },
    })

    if (!user) {
      console.log('[v0] /api/auth/login: User not found')
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    console.log('[v0] /api/auth/login: User found, id=', user.id)

    // Update last seen and online status
    await prisma.user.update({
      where: { id: user.id },
      data: {
        isOnline: true,
        lastSeen: new Date(),
      },
    })

    // Return user data with 'id' field (not 'userId')
    // This matches the User interface in auth-context.tsx
    const responseData = {
      id: user.id,
      phoneNumber: user.phoneNumber,
      displayName: user.displayName,
      profileImage: user.profileImage,
      status: user.status,
    }
    
    console.log('[v0] /api/auth/login: Returning user data')
    return NextResponse.json(responseData, { status: 200 })
  } catch (error) {
    console.error('[v0] /api/auth/login: Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
