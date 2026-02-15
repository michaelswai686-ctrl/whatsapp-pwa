/**
 * POST /api/auth/otp/send
 * Sends an OTP to the specified phone number
 * Validates phone number format and country code first
 */

import { NextRequest, NextResponse } from 'next/server'
import { validatePhoneNumber, createOTP, sendOTPViaSMS, canResendOTP } from '@/lib/otp'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phoneNumber, purpose = 'verification' } = body

    // Validate input
    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number is required' },
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

    // Check rate limiting
    const rateCheck = await canResendOTP(phoneNumber, purpose)
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: `Please wait ${rateCheck.remainingSeconds} seconds before requesting a new OTP` },
        { status: 429 }
      )
    }

    // For verification purpose, check if user exists
    let userId: string | null = null
    if (purpose === 'login' || purpose === 'reset') {
      const user = await prisma.user.findUnique({
        where: { phoneNumber }
      })
      if (!user) {
        return NextResponse.json(
          { error: 'No account found with this phone number' },
          { status: 404 }
        )
      }
      userId = user.id
    }

    // Create OTP
    const { otp, expires } = await createOTP(phoneNumber, userId, purpose)

    // Send OTP via SMS
    const smsResult = await sendOTPViaSMS(phoneNumber, otp)
    
    if (!smsResult.success) {
      return NextResponse.json(
        { error: smsResult.error || 'Failed to send OTP' },
        { status: 500 }
      )
    }

    // Return success (never return the actual OTP in production)
    return NextResponse.json(
      {
        message: 'OTP sent successfully',
        expires: expires.toISOString(),
        // In development/demo, you might want to return the OTP for testing
        // Remove this in production!
        ...(process.env.NODE_ENV === 'development' && { otp })
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Send OTP error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
