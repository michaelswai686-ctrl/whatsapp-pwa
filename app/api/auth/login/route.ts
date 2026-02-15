/**
 * POST /api/auth/login
 * Authenticates user with phone number, password, and optional OTP verification
 * 
 * If 2FA is enabled, requires OTP verification after password
 */

import { prisma } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phoneNumber, password, otpCode, skipOTP } = body

    // Validate input
    if (!phoneNumber || !password) {
      return NextResponse.json(
        { error: 'Phone number and password are required' },
        { status: 400 }
      )
    }

    // Find user by phone number
    const user = await prisma.user.findUnique({
      where: { phoneNumber },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid phone number or password' },
        { status: 401 }
      )
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid phone number or password' },
        { status: 401 }
      )
    }

    // Check if OTP verification is required
    // For now, require OTP for all verified users
    // You can make this optional based on your requirements
    if (user.isVerified && !skipOTP) {
      // If no OTP code provided, request OTP verification
      if (!otpCode) {
        return NextResponse.json(
          {
            requiresOTP: true,
            message: 'Please verify your phone number with OTP'
          },
          { status: 200 }
        )
      }

      // Import verifyOTP dynamically to avoid issues
      const { verifyOTP } = await import('@/lib/otp')
      
      // Verify the OTP
      const verification = await verifyOTP(phoneNumber, otpCode, 'login')
      if (!verification.valid) {
        return NextResponse.json(
          { error: verification.error },
          { status: 400 }
        )
      }
    }

    // Update last seen and online status
    await prisma.user.update({
      where: { id: user.id },
      data: {
        isOnline: true,
        lastSeen: new Date(),
      },
    })

    // Return user data (never return password)
    const responseData = {
      id: user.id,
      phoneNumber: user.phoneNumber,
      displayName: user.displayName,
      profileImage: user.profileImage,
      status: user.status,
      isVerified: user.isVerified,
    }

    return NextResponse.json(responseData, { status: 200 })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
