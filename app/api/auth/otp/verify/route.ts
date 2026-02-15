/**
 * POST /api/auth/otp/verify
 * Verifies an OTP code and marks the user as verified
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyOTP } from '@/lib/otp'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phoneNumber, code, purpose = 'verification' } = body

    // Validate input
    if (!phoneNumber || !code) {
      return NextResponse.json(
        { error: 'Phone number and OTP code are required' },
        { status: 400 }
      )
    }

    // Verify the OTP
    const verification = await verifyOTP(phoneNumber, code, purpose)
    
    if (!verification.valid) {
      return NextResponse.json(
        { error: verification.error },
        { status: 400 }
      )
    }

    // If verification purpose, mark user as verified
    if (purpose === 'verification' && verification.userId) {
      await prisma.user.update({
        where: { id: verification.userId },
        data: { isVerified: true }
      })
    }

    return NextResponse.json(
      {
        message: 'OTP verified successfully',
        verified: true
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Verify OTP error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
