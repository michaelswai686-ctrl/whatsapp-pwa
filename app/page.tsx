/**
 * Home Page
 * Redirects to chat or auth based on user state
 */

'use client'

import { useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'

export default function Home() {
  const { user, isLoading } = useAuth()

  useEffect(() => {
    console.log('[v0] home page: isLoading=', isLoading, 'user=', user)
    if (!isLoading) {
      if (user) {
        console.log('[v0] home page: User found, redirecting to chat')
        window.location.href = '/chat'
      } else {
        console.log('[v0] home page: No user, redirecting to auth')
        window.location.href = '/auth'
      }
    }
  }, [user, isLoading])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-slate-600">Loading...</p>
      </div>
    </div>
  )
}
