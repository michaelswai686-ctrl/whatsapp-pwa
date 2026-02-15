/**
 * GET /api/users?phone=xxx
 * Search for a user by phone number
 * Used for adding contacts (separate from login)
 * 
 * GET /api/users?userId=xxx
 * Get user by ID (includes publicKey for E2E encryption)
 * 
 * POST /api/users
 * Update user's public key for E2E encryption
 * Body: { userId: string, publicKey: string }
 */

import { prisma } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
    try {
        const phone = request.nextUrl.searchParams.get('phone')
        const userId = request.nextUrl.searchParams.get('userId')

        // Search by phone number
        if (phone) {
            const user = await prisma.user.findUnique({
                where: { phoneNumber: phone },
                select: {
                    id: true,
                    phoneNumber: true,
                    displayName: true,
                    profileImage: true,
                    status: true,
                    isOnline: true,
                },
            })

            if (!user) {
                return NextResponse.json(
                    { error: 'User not found' },
                    { status: 404 }
                )
            }

            return NextResponse.json(user, { status: 200 })
        }
        
        // Get user by ID (includes publicKey for encryption)
        if (userId) {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    phoneNumber: true,
                    displayName: true,
                    profileImage: true,
                    status: true,
                    isOnline: true,
                    publicKey: true, // Include public key for E2E encryption
                },
            })

            if (!user) {
                return NextResponse.json(
                    { error: 'User not found' },
                    { status: 404 }
                )
            }

            return NextResponse.json(user, { status: 200 })
        }

        return NextResponse.json(
            { error: 'Phone number or user ID is required' },
            { status: 400 }
        )
    } catch (error) {
        console.error('User search error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest) {
    try {
        const { userId, publicKey } = await request.json()

        if (!userId || !publicKey) {
            return NextResponse.json(
                { error: 'User ID and public key are required' },
                { status: 400 }
            )
        }

        // Update user's public key
        const user = await prisma.user.update({
            where: { id: userId },
            data: { publicKey },
            select: {
                id: true,
                phoneNumber: true,
                displayName: true,
                publicKey: true,
            },
        })

        return NextResponse.json(user, { status: 200 })
    } catch (error) {
        console.error('Update public key error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
