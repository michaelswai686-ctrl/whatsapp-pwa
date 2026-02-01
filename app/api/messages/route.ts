/**
 * GET /api/messages?conversationId=xxx
 * Fetches all messages for a conversation
 * 
 * POST /api/messages
 * Creates a new message
 * Request body:
 * - conversationId: string
 * - senderId: string
 * - receiverId: string
 * - content: string
 * - mediaUrl?: string
 * - mediaType?: string
 */

import { prisma } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const conversationId = request.nextUrl.searchParams.get('conversationId')

    if (!conversationId) {
      return NextResponse.json(
        { error: 'Conversation ID is required' },
        { status: 400 }
      )
    }

    // Fetch messages for conversation
    const messages = await prisma.message.findMany({
      where: {
        conversationId,
        isDeleted: false,
      },
      include: {
        sender: {
          select: {
            id: true,
            displayName: true,
            profileImage: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    })

    return NextResponse.json(messages, { status: 200 })
  } catch (error) {
    console.error('Fetch messages error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { conversationId, senderId, receiverId, content, mediaUrl, mediaType } =
      await request.json()

    // Validate input
    if (!conversationId || !senderId || !receiverId || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId,
        receiverId,
        content,
        mediaUrl,
        mediaType,
        status: 'sent',
      },
      include: {
        sender: {
          select: {
            id: true,
            displayName: true,
            profileImage: true,
          },
        },
      },
    })

    // Update conversation last message
    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessage: content,
        lastMessageAt: new Date(),
      },
    })

    return NextResponse.json(message, { status: 201 })
  } catch (error) {
    console.error('Create message error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
