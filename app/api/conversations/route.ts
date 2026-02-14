/**
 * GET /api/conversations?userId=xxx
 * Fetches all conversations for a user, including participant info
 * 
 * POST /api/conversations
 * Creates or gets a conversation between two users
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

    // Fetch conversations where user is participant
    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [
          { participant1Id: userId },
          { participant2Id: userId },
        ],
      },
      orderBy: {
        lastMessageAt: 'desc',
      },
    })

    // For each conversation, fetch the other participant's info
    const conversationsWithParticipants = await Promise.all(
      conversations.map(async (conv) => {
        const otherParticipantId =
          conv.participant1Id === userId
            ? conv.participant2Id
            : conv.participant1Id

        const otherParticipant = await prisma.user.findUnique({
          where: { id: otherParticipantId },
          select: {
            id: true,
            displayName: true,
            phoneNumber: true,
            profileImage: true,
            isOnline: true,
            lastSeen: true,
          },
        })

        return {
          ...conv,
          otherParticipant,
        }
      })
    )

    return NextResponse.json(conversationsWithParticipants, { status: 200 })
  } catch (error) {
    console.error('Fetch conversations error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { participant1Id, participant2Id } = await request.json()

    // Validate input
    if (!participant1Id || !participant2Id) {
      return NextResponse.json(
        { error: 'Both participant IDs are required' },
        { status: 400 }
      )
    }

    // Ensure consistent ordering (smaller ID first)
    const [p1, p2] = [participant1Id, participant2Id].sort()

    // Check if conversation already exists
    let conversation = await prisma.conversation.findUnique({
      where: {
        participant1Id_participant2Id: {
          participant1Id: p1,
          participant2Id: p2,
        },
      },
    })

    // If not, create new conversation
    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          participant1Id: p1,
          participant2Id: p2,
        },
      })
    }

    return NextResponse.json(conversation, { status: 200 })
  } catch (error) {
    console.error('Create conversation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
