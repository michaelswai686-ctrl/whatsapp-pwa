/**
 * GET /api/users?phone=xxx
 * Search for a user by phone number
 * Used for adding contacts (separate from login)
 */

import { prisma } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
    try {
        const phone = request.nextUrl.searchParams.get('phone')

        if (!phone) {
            return NextResponse.json(
                { error: 'Phone number is required' },
                { status: 400 }
            )
        }

        // Find user by phone number
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
    } catch (error) {
        console.error('User search error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
