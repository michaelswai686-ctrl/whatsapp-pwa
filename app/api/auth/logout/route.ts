/**
 * POST /api/auth/logout
 * Updates user online status to offline on logout
 * This is critical for showing accurate online status to other users
 */

import { prisma } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId } = body

    // Validate input
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Update user's online status to offline
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        isOnline: false,
        lastSeen: new Date(),
      },
      select: {
        id: true,
        phoneNumber: true,
        isOnline: true,
      },
    })

    return NextResponse.json(
      { message: 'Logged out successfully', user },
      { status: 200 }
    )
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
