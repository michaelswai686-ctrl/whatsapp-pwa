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
 * - content: string (plaintext for backward compatibility)
 * - encryptedContent?: string (encrypted message content)
 * - isEncrypted?: boolean (whether message is encrypted)
 * - iv?: string (initialization vector for decryption)
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
    const { 
      conversationId, 
      senderId, 
      receiverId, 
      content, 
      encryptedContent,
      isEncrypted,
      iv,
      mediaUrl, 
      mediaType 
    } = await request.json()

    // Validate input - accept either content or encryptedContent
    if (!conversationId || !senderId || !receiverId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Must have either plaintext content or encrypted content
    if (!content && !encryptedContent) {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      )
    }

    // Create message with encryption fields
    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId,
        receiverId,
        content: content || '', // Keep content field for backward compatibility
        encryptedContent: encryptedContent || null, // Store encrypted content
        isEncrypted: isEncrypted || false, // Mark if message is encrypted
        iv: iv || null, // Store IV for decryption
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

    // Update conversation last message (use plaintext or a placeholder for encrypted)
    const lastMessagePreview = isEncrypted ? '🔒 Encrypted message' : (content || '[Encrypted]')
    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessage: lastMessagePreview,
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
