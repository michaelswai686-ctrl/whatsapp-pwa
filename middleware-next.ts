/**
 * Next.js Middleware for Rate Limiting
 * Protects API routes from abuse
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// In-memory rate limit store (for edge runtime)
// Note: For production, use Vercel KV or Redis
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

const WINDOW_MS = 60 * 1000 // 1 minute
const MAX_REQUESTS = 100 // 100 requests per minute per IP

export function middleware(request: NextRequest) {
  // Only apply to API routes
  if (!request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // Skip rate limiting for health checks
  if (request.nextUrl.pathname === '/api/health') {
    return NextResponse.next()
  }

  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
  const key = `ratelimit:${ip}`
  const now = Date.now()

  let record = rateLimitMap.get(key)

  if (!record || record.resetTime < now) {
    // New window
    record = {
      count: 1,
      resetTime: now + WINDOW_MS,
    }
    rateLimitMap.set(key, record)
  } else {
    record.count++
  }

  // Check if rate limit exceeded
  if (record.count > MAX_REQUESTS) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': String(MAX_REQUESTS),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.ceil(record.resetTime / 1000)),
          'Retry-After': String(Math.ceil((record.resetTime - now) / 1000)),
        },
      }
    )
  }

  // Add rate limit headers to response
  const response = NextResponse.next()
  response.headers.set('X-RateLimit-Limit', String(MAX_REQUESTS))
  response.headers.set('X-RateLimit-Remaining', String(MAX_REQUESTS - record.count))
  response.headers.set('X-RateLimit-Reset', String(Math.ceil(record.resetTime / 1000)))

  return response
}

export const config = {
  matcher: '/api/:path*',
}
