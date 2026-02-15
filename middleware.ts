/**
 * Rate Limiting Middleware
 * Simple in-memory rate limiter for API routes
 * Note: For production, use Redis or similar distributed cache
 */

// Simple in-memory rate limit store
// In production, use Redis for distributed rate limiting
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetTime < now) {
      rateLimitStore.delete(key)
    }
  }
}, 60000) // Clean up every minute

export interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
}

const defaultConfig: RateLimitConfig = {
  windowMs: 60000, // 1 minute
  maxRequests: 100, // 100 requests per minute
}

export function checkRateLimit(identifier: string, config: RateLimitConfig = defaultConfig): boolean {
  const now = Date.now()
  const key = identifier
  
  const record = rateLimitStore.get(key)
  
  if (!record || record.resetTime < now) {
    // New window
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + config.windowMs,
    })
    return true
  }
  
  if (record.count >= config.maxRequests) {
    // Rate limit exceeded
    return false
  }
  
  // Increment counter
  record.count++
  return true
}

export function getRateLimitHeaders(identifier: string): Record<string, string> {
  const record = rateLimitStore.get(identifier)
  const now = Date.now()
  
  if (!record) {
    return {
      'X-RateLimit-Limit': String(defaultConfig.maxRequests),
      'X-RateLimit-Remaining': String(defaultConfig.maxRequests),
      'X-RateLimit-Reset': String(Math.ceil((now + defaultConfig.windowMs) / 1000)),
    }
  }
  
  const remaining = Math.max(0, defaultConfig.maxRequests - record.count)
  const reset = Math.ceil(record.resetTime / 1000)
  
  return {
    'X-RateLimit-Limit': String(defaultConfig.maxRequests),
    'X-RateLimit-Remaining': String(remaining),
    'X-RateLimit-Reset': String(reset),
  }
}
