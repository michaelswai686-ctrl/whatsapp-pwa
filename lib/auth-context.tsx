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
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber }),
      })

      if (!response.ok) {
        throw new Error('Login failed')
      }

      const userData = await response.json()
      setUser(userData)
      localStorage.setItem('whatsapp_user', JSON.stringify(userData))
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  }

  const register = async (phoneNumber: string, displayName: string) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, displayName }),
      })

      if (!response.ok) {
        throw new Error('Registration failed')
      }

      // After registration, login the user
      await login(phoneNumber)
    } catch (error) {
      console.error('Registration error:', error)
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
