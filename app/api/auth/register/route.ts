/**
 * POST /api/auth/register
 * Registers a new user with phone number and password
 */

import { prisma } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phoneNumber, displayName, password } = body

    // Validate input
    if (!phoneNumber || !displayName || !password) {
      return NextResponse.json(
        { error: 'Phone number, display name, and password are required' },
        { status: 400 }
      )
    }

    // Validate phone number format
    if (!/^\+\d{10,15}$/.test(phoneNumber)) {
      return NextResponse.json(
        { error: 'Invalid phone number format. Use international format (e.g., +255123456789)' },
        { status: 400 }
      )
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
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

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create new user
    const user = await prisma.user.create({
      data: {
        phoneNumber,
        displayName,
        password: hashedPassword,
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
