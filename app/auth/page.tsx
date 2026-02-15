/**
 * Authentication Page
 * Handles user login and registration with phone + password + OTP verification
 * Modern professional design with clean UI
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { MessageSquare, Loader2, Eye, EyeOff, Phone, ShieldCheck, Timer, AlertCircle } from 'lucide-react'
import { COUNTRIES } from '@/lib/otp'

type AuthStep = 'phone' | 'otp' | 'details'

export default function AuthPage() {
  const router = useRouter()
  const { login, register } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Auth flow state
  const [authStep, setAuthStep] = useState<AuthStep>('phone')
  const [selectedCountry, setSelectedCountry] = useState<typeof COUNTRIES[0] | null>(null)
  const [showCountryDropdown, setShowCountryDropdown] = useState(false)

  // Phone number state
  const [phoneNumber, setPhoneNumber] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [otpExpires, setOtpExpires] = useState<Date | null>(null)
  const [countdown, setCountdown] = useState(0)

  // Login form state
  const [loginPhone, setLoginPhone] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [showLoginPassword, setShowLoginPassword] = useState(false)
  const [loginOtp, setLoginOtp] = useState('')
  const [requiresLoginOtp, setRequiresLoginOtp] = useState(false)

  // Register form state
  const [registerPhone, setRegisterPhone] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [registerPassword, setRegisterPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showRegisterPassword, setShowRegisterPassword] = useState(false)

  // Countdown timer for resend OTP
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  // Handle country selection
  const handleCountrySelect = (country: typeof COUNTRIES[0]) => {
    setSelectedCountry(country)
    setPhoneNumber(country.code)
    setShowCountryDropdown(false)
  }

  // Send OTP to phone number
  const handleSendOTP = async (purpose: 'verification' | 'login' = 'verification') => {
    setError('')
    setIsLoading(true)

    try {
      const fullPhone = selectedCountry?.code 
        ? phoneNumber.startsWith(selectedCountry.code) 
          ? phoneNumber 
          : selectedCountry.code + phoneNumber.replace(/^\+/, '')
        : phoneNumber

      const response = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phoneNumber: fullPhone, 
          purpose 
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send OTP')
      }

      setOtpSent(true)
      setOtpExpires(new Date(data.expires))
      setCountdown(60)
      setSuccess(`OTP sent to ${fullPhone}`)
      
      // For development, show the OTP
      if (data.otp) {
        console.log('📱 OTP for testing:', data.otp)
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to send OTP'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  // Verify OTP
  const handleVerifyOTP = async (): Promise<boolean> => {
    setError('')
    setIsLoading(true)

    try {
      const fullPhone = selectedCountry?.code 
        ? phoneNumber.startsWith(selectedCountry.code) 
          ? phoneNumber 
          : selectedCountry.code + phoneNumber.replace(/^\+/, '')
        : phoneNumber

      const response = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phoneNumber: fullPhone, 
          code: otpCode,
          purpose: 'verification'
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Invalid OTP')
      }

      setSuccess('Phone number verified!')
      return true
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Verification failed'
      setError(message)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  // Handle registration with OTP
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validate passwords match
    if (registerPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (registerPassword.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    // Verify OTP first
    const isVerified = await handleVerifyOTP()
    if (!isVerified) return

    setIsLoading(true)

    try {
      const fullPhone = selectedCountry?.code 
        ? registerPhone.startsWith(selectedCountry.code) 
          ? registerPhone 
          : selectedCountry.code + registerPhone.replace(/^\+/, '')
        : registerPhone

      await register(fullPhone, displayName, registerPassword)
      window.location.href = '/chat'
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to register. Please try again.'
      setError(message)
      setIsLoading(false)
    }
  }

  // Handle login with OTP
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (requiresLoginOtp) {
      // Verify OTP for login
      setIsLoading(true)
      try {
        const fullPhone = selectedCountry?.code 
          ? loginPhone.startsWith(selectedCountry.code) 
            ? loginPhone 
            : selectedCountry.code + loginPhone.replace(/^\+/, '')
          : loginPhone

        // First verify OTP, then login
        const otpResponse = await fetch('/api/auth/otp/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            phoneNumber: fullPhone, 
            code: loginOtp,
            purpose: 'login'
          }),
        })

        const otpData = await otpResponse.json()

        if (!otpResponse.ok) {
          throw new Error(otpData.error || 'Invalid OTP')
        }

        // Now login with OTP verification
        await login(fullPhone, loginPassword)
        window.location.href = '/chat'
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Login failed'
        setError(message)
        setIsLoading(false)
      }
      return
    }

    setIsLoading(true)

    try {
      const fullPhone = selectedCountry?.code 
        ? loginPhone.startsWith(selectedCountry.code) 
          ? loginPhone 
          : selectedCountry.code + loginPhone.replace(/^\+/, '')
        : loginPhone

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: fullPhone, password: loginPassword }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Login failed')
      }

      // Check if OTP is required
      if (data.requiresOTP) {
        setRequiresLoginOtp(true)
        // Send OTP for login
        await fetch('/api/auth/otp/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            phoneNumber: fullPhone, 
            purpose: 'login'
          }),
        })
        setCountdown(60)
        setError('')
        setIsLoading(false)
        return
      }

      localStorage.setItem('whatsapp_user', JSON.stringify(data))
      window.location.href = '/chat'
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to login. Please check your credentials.'
      setError(message)
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <div className="p-8">
          {/* Header */}
          <div className="flex items-center justify-center mb-8">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-full">
              <MessageSquare className="w-8 h-8 text-white" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-center mb-2 text-slate-900">
            WhatsApp
          </h1>
          <p className="text-center text-slate-600 mb-8">
            Connect with anyone, anywhere
          </p>

          {/* Error/Success messages */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}
          
          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 flex-shrink-0" />
              {success}
            </div>
          )}

          {/* Tabs for Login/Register */}
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>

            {/* Login Tab */}
            <TabsContent value="login">
              {!requiresLoginOtp ? (
                <form onSubmit={handleLogin} className="space-y-4">
                  {/* Country selector */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Country & Phone
                    </label>
                    <div className="relative">
                      <div className="flex gap-2">
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                            className="flex items-center gap-2 px-3 py-2 border rounded-lg hover:bg-slate-50"
                          >
                            <span>{selectedCountry?.code || '+'}</span>
                          </button>
                          {showCountryDropdown && (
                            <div className="absolute z-10 mt-1 w-64 max-h-60 overflow-auto bg-white border rounded-lg shadow-lg">
                              {COUNTRIES.slice(0, 20).map((country) => (
                                <button
                                  key={country.code}
                                  type="button"
                                  onClick={() => handleCountrySelect(country)}
                                  className="w-full px-4 py-2 text-left hover:bg-slate-50 flex justify-between"
                                >
                                  <span>{country.name}</span>
                                  <span className="text-slate-500">{country.code}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        <Input
                          type="tel"
                          placeholder="123456789"
                          value={loginPhone}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '')
                            setLoginPhone(selectedCountry?.code ? selectedCountry.code + value : value)
                          }}
                          disabled={isLoading}
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <Input
                        type={showLoginPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        disabled={isLoading}
                        className="w-full pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading || !loginPhone.trim() || !loginPassword.trim()}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Logging in...
                      </>
                    ) : (
                      'Login'
                    )}
                  </Button>
                </form>
              ) : (
                /* Login with OTP */
                <div className="space-y-4">
                  <div className="text-center mb-4">
                    <ShieldCheck className="w-12 h-12 mx-auto text-blue-600 mb-2" />
                    <h3 className="font-semibold">Two-Factor Authentication</h3>
                    <p className="text-sm text-slate-600">
                      Enter the 6-digit code sent to your phone
                    </p>
                  </div>

                  <div className="flex justify-center">
                    <InputOTP
                      value={loginOtp}
                      onChange={(value) => setLoginOtp(value)}
                      maxLength={6}
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>

                  <div className="flex items-center justify-center gap-2 text-sm text-slate-600">
                    <Timer className="w-4 h-4" />
                    {countdown > 0 ? (
                      <span>Resend code in {countdown}s</span>
                    ) : (
                      <button
                        onClick={async () => {
                          const fullPhone = selectedCountry?.code 
                            ? loginPhone.startsWith(selectedCountry.code) 
                              ? loginPhone 
                              : selectedCountry.code + loginPhone.replace(/^\+/, '')
                            : loginPhone
                          await fetch('/api/auth/otp/send', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ phoneNumber: fullPhone, purpose: 'login' }),
                          })
                          setCountdown(60)
                        }}
                        className="text-blue-600 hover:underline"
                      >
                        Resend code
                      </button>
                    )}
                  </div>

                  <Button
                    onClick={handleLogin}
                    disabled={isLoading || loginOtp.length !== 6}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      'Verify & Login'
                    )}
                  </Button>

                  <Button
                    variant="ghost"
                    onClick={() => {
                      setRequiresLoginOtp(false)
                      setLoginOtp('')
                    }}
                    className="w-full"
                  >
                    Back to login
                  </Button>
                </div>
              )}
            </TabsContent>

            {/* Register Tab */}
            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4">
                {/* Step 1: Phone Number */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Country
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                      className="w-full flex items-center justify-between px-4 py-2 border rounded-lg hover:bg-slate-50"
                    >
                      <span>
                        {selectedCountry 
                          ? `${selectedCountry.name} (${selectedCountry.code})`
                          : 'Select your country'}
                      </span>
                      <Phone className="w-4 h-4 text-slate-400" />
                    </button>
                    {showCountryDropdown && (
                      <div className="absolute z-10 mt-1 w-full max-h-60 overflow-auto bg-white border rounded-lg shadow-lg">
                        {COUNTRIES.map((country) => (
                          <button
                            key={country.code}
                            type="button"
                            onClick={() => handleCountrySelect(country)}
                            className="w-full px-4 py-2 text-left hover:bg-slate-50 flex justify-between"
                          >
                            <span>{country.name}</span>
                            <span className="text-slate-500">{country.code}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Phone Number
                  </label>
                  <Input
                    type="tel"
                    placeholder={selectedCountry ? `e.g. ${selectedCountry.code.replace('+', '')}123456789` : 'Select country first'}
                    value={registerPhone}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '')
                      const prefix = selectedCountry?.code.replace('+', '') || ''
                      setRegisterPhone(prefix + value)
                    }}
                    disabled={isLoading || !selectedCountry}
                    className="w-full"
                  />
                </div>

                {/* Send OTP Button */}
                {!otpSent ? (
                  <Button
                    type="button"
                    onClick={() => handleSendOTP('verification')}
                    disabled={isLoading || !registerPhone.trim() || !selectedCountry}
                    variant="outline"
                    className="w-full"
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Send Verification Code
                  </Button>
                ) : (
                  /* OTP Verification */
                  <div className="space-y-4 p-4 bg-slate-50 rounded-lg">
                    <div className="text-center">
                      <ShieldCheck className="w-8 h-8 mx-auto text-green-600 mb-2" />
                      <p className="text-sm text-slate-600">
                        Enter the 6-digit code sent to your phone
                      </p>
                    </div>

                    <div className="flex justify-center">
                      <InputOTP
                        value={otpCode}
                        onChange={(value) => setOtpCode(value)}
                        maxLength={6}
                      >
                        <InputOTPGroup>
                          <InputOTPSlot index={0} />
                          <InputOTPSlot index={1} />
                          <InputOTPSlot index={2} />
                          <InputOTPSlot index={3} />
                          <InputOTPSlot index={4} />
                          <InputOTPSlot index={5} />
                        </InputOTPGroup>
                      </InputOTP>
                    </div>

                    <div className="flex items-center justify-center gap-2 text-sm text-slate-600">
                      <Timer className="w-4 h-4" />
                      {countdown > 0 ? (
                        <span>Resend code in {countdown}s</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSendOTP('verification')}
                          className="text-blue-600 hover:underline"
                        >
                          Resend code
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Step 2: Account Details (after OTP verified) */}
                {otpSent && otpCode.length === 6 && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Display Name
                      </label>
                      <Input
                        type="text"
                        placeholder="Your Name"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        disabled={isLoading}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Password
                      </label>
                      <div className="relative">
                        <Input
                          type={showRegisterPassword ? 'text' : 'password'}
                          placeholder="At least 6 characters"
                          value={registerPassword}
                          onChange={(e) => setRegisterPassword(e.target.value)}
                          disabled={isLoading}
                          className="w-full pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showRegisterPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Confirm Password
                      </label>
                      <Input
                        type="password"
                        placeholder="Confirm your password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        disabled={isLoading}
                        className="w-full"
                      />
                    </div>
                  </>
                )}

                <Button
                  type="submit"
                  disabled={isLoading || !otpSent || otpCode.length !== 6 || !displayName.trim() || !registerPassword.trim() || !confirmPassword.trim()}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Registering...
                    </>
                  ) : (
                    'Register'
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          {/* Security message */}
          <p className="text-center text-xs text-slate-500 mt-6">
            Your messages are end-to-end encrypted
          </p>
        </div>
      </Card>
    </div>
  )
}
