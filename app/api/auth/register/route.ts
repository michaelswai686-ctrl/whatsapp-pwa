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
  console.log('[v0] /api/auth/register: Request received')
  try {
    const body = await request.json()
    const { phoneNumber, displayName } = body
    console.log('[v0] /api/auth/register: phoneNumber=', phoneNumber, 'displayName=', displayName)

    // Validate input
    if (!phoneNumber || !displayName) {
      console.log('[v0] /api/auth/register: Missing required fields')
      return NextResponse.json(
        { error: 'Phone number and display name are required' },
        { status: 400 }
      )
    }

    // Check if user already exists
    console.log('[v0] /api/auth/register: Checking if user exists...')
    const existingUser = await prisma.user.findUnique({
      where: { phoneNumber },
    })

    if (existingUser) {
      console.log('[v0] /api/auth/register: User already exists')
      return NextResponse.json(
        { error: 'User with this phone number already exists' },
        { status: 409 }
      )
    }

    // Create new user
    console.log('[v0] /api/auth/register: Creating new user...')
    const user = await prisma.user.create({
      data: {
        phoneNumber,
        displayName,
      },
    })

    console.log('[v0] /api/auth/register: User created, id=', user.id)
    return NextResponse.json(
      {
        userId: user.id,
        message: 'User registered successfully',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[v0] /api/auth/register: Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
