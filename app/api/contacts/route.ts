/**
 * GET /api/contacts?userId=xxx
 * Fetches all contacts for a user
 * 
 * POST /api/contacts
 * Adds a contact to user's contact list
 * Request body:
 * - userId: string
 * - contactId: string
 * - nickname?: string
 */

import { prisma } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Fetch user's contacts
    const contacts = await prisma.contact.findMany({
      where: { userId },
      include: {
        contact: {
          select: {
            id: true,
            phoneNumber: true,
            displayName: true,
            profileImage: true,
            status: true,
            isOnline: true,
            lastSeen: true,
          },
        },
      },
    })

    return NextResponse.json(contacts, { status: 200 })
  } catch (error) {
    console.error('Fetch contacts error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, contactId, nickname } = await request.json()

    // Validate input
    if (!userId || !contactId) {
      return NextResponse.json(
        { error: 'User ID and Contact ID are required' },
        { status: 400 }
      )
    }

    // Check if contact already exists
    const existingContact = await prisma.contact.findUnique({
      where: {
        userId_contactId: {
          userId,
          contactId,
        },
      },
    })

    if (existingContact) {
      return NextResponse.json(
        { error: 'Contact already exists' },
        { status: 409 }
      )
    }

    // Create contact
    const contact = await prisma.contact.create({
      data: {
        userId,
        contactId,
        nickname,
      },
      include: {
        contact: {
          select: {
            id: true,
            phoneNumber: true,
            displayName: true,
            profileImage: true,
            status: true,
            isOnline: true,
          },
        },
      },
    })

    return NextResponse.json(contact, { status: 201 })
  } catch (error) {
    console.error('Create contact error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
