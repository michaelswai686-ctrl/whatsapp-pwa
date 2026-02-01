/**
 * POST /api/auth/register
 * Registers a new user with phone number
 * 
 * Request body:
 * - phoneNumber: string (e.g., "+255123456789")
 * - displayName: string
 * 
 * Response:
 * - userId: string
 * - message: string
 */

import { prisma } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, displayName } = await request.json()

    // Validate input
    if (!phoneNumber || !displayName) {
      return NextResponse.json(
        { error: 'Phone number and display name are required' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { phoneNumber },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this phone number already exists' },
        { status: 409 }
      )
    }

    // Create new user
    const user = await prisma.user.create({
      data: {
        phoneNumber,
        displayName,
      },
    })

    return NextResponse.json(
      {
        userId: user.id,
        message: 'User registered successfully',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
