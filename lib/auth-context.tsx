/**
 * Authentication Context
 * Manages user authentication state across the application
 * Provides user data and authentication methods to all components
 */

'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

interface User {
  id: string
  phoneNumber: string
  displayName: string
  profileImage?: string
  status?: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (phoneNumber: string) => Promise<void>
  register: (phoneNumber: string, displayName: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check if user is already logged in on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('whatsapp_user')
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (error) {
        console.error('Failed to parse stored user:', error)
        localStorage.removeItem('whatsapp_user')
      }
    }
    setIsLoading(false)
  }, [])

  const login = async (phoneNumber: string) => {
    console.log('[v0] auth-context: login called with', phoneNumber)
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber }),
      })

      console.log('[v0] auth-context: login response status', response.status)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('[v0] auth-context: login failed', errorData)
        throw new Error(errorData.error || 'Login failed')
      }

      const userData = await response.json()
      console.log('[v0] auth-context: login userData received', userData)
      
      // First save to localStorage to ensure persistence
      localStorage.setItem('whatsapp_user', JSON.stringify(userData))
      console.log('[v0] auth-context: saved user to localStorage')
      
      // Then update state
      setUser(userData)
      console.log('[v0] auth-context: setUser called')
    } catch (error) {
      console.error('[v0] auth-context: login error:', error)
      throw error
    }
  }

  const register = async (phoneNumber: string, displayName: string) => {
    console.log('[v0] auth-context: register called with', phoneNumber, displayName)
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, displayName }),
      })

      console.log('[v0] auth-context: register response status', response.status)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('[v0] auth-context: registration failed', errorData)
        throw new Error(errorData.error || 'Registration failed')
      }

      console.log('[v0] auth-context: registration successful, now logging in')
      // After registration, login the user
      await login(phoneNumber)
    } catch (error) {
      console.error('[v0] auth-context: registration error:', error)
      throw error
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('whatsapp_user')
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
