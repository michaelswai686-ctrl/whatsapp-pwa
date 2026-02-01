/**
 * POST /api/auth/login
 * Authenticates user with phone number
 * Returns user data and session token
 */

import { prisma } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber } = await request.json()

    // Validate input
    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      )
    }

    // Find user by phone number
    const user = await prisma.user.findUnique({
      where: { phoneNumber },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

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
    return NextResponse.json(
      {
        id: user.id,
        phoneNumber: user.phoneNumber,
        displayName: user.displayName,
        profileImage: user.profileImage,
        status: user.status,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
