/**
 * POST /api/auth/register
 * Registers a new user with phone number, password, and OTP verification
 * 
 * Flow:
 * 1. Validate phone number and extract country code
 * 2. Verify OTP code
 * 3. Create new user with verified phone number
 */

import { prisma } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { validatePhoneNumber, verifyOTP } from '@/lib/otp'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phoneNumber, displayName, password, otpCode } = body

    // Validate input
    if (!phoneNumber || !displayName || !password || !otpCode) {
      return NextResponse.json(
        { error: 'Phone number, display name, password, and OTP code are required' },
        { status: 400 }
      )
    }

    // Validate phone number format and extract country code
    const validation = validatePhoneNumber(phoneNumber)
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    // Verify OTP first
    const verification = await verifyOTP(phoneNumber, otpCode, 'verification')
    if (!verification.valid) {
      return NextResponse.json(
        { error: verification.error },
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

    // Create new user with verified status and country code
    const user = await prisma.user.create({
      data: {
        phoneNumber,
        displayName,
        password: hashedPassword,
        isVerified: true, // Mark as verified since OTP was confirmed
        countryCode: validation.countryCode,
      },
    })

    return NextResponse.json(
      {
        userId: user.id,
        message: 'User registered successfully',
        verified: true
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
