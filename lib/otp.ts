/**
 * OTP (One-Time Password) Utilities
 * Handles OTP generation, validation, and SMS sending
 */

import { prisma } from '@/lib/db'
import twilio from 'twilio'

// Configuration
const OTP_LENGTH = 6
const OTP_EXPIRY_MINUTES = 10
const MAX_ATTEMPTS = 5
const RESEND_COOLDOWN_SECONDS = 60

// Country codes with country name for validation
export const COUNTRIES = [
  { code: '+1', name: 'United States/Canada', pattern: /^\+1\d{10}$/ },
  { code: '+44', name: 'United Kingdom', pattern: /^\+44\d{10}$/ },
  { code: '+255', name: 'Tanzania', pattern: /^\+255\d{9}$/ },
  { code: '+254', name: 'Kenya', pattern: /^\+254\d{9}$/ },
  { code: '+256', name: 'Uganda', pattern: /^\+256\d{9}$/ },
  { code: '+250', name: 'Rwanda', pattern: /^\+250\d{9}$/ },
  { code: '+263', name: 'Zimbabwe', pattern: /^\+263\d{9}$/ },
  { code: '+260', name: 'Zambia', pattern: /^\+260\d{9}$/ },
  { code: '+263', name: 'Zimbabwe', pattern: /^\+263\d{9}$/ },
  { code: '+27', name: 'South Africa', pattern: /^\+27\d{9}$/ },
  { code: '+234', name: 'Nigeria', pattern: /^\+234\d{10}$/ },
  { code: '+233', name: 'Ghana', pattern: /^\+233\d{9}$/ },
  { code: '+225', name: 'Ivory Coast', pattern: /^\+225\d{10}$/ },
  { code: '+221', name: 'Senegal', pattern: /^\+221\d{9}$/ },
  { code: '+216', name: 'Tunisia', pattern: /^\+216\d{8}$/ },
  { code: '+20', name: 'Egypt', pattern: /^\+20\d{10}$/ },
  { code: '+91', name: 'India', pattern: /^\+91\d{10}$/ },
  { code: '+88', name: 'Bangladesh', pattern: /^\+88\d{11}$/ },
  { code: '+92', name: 'Pakistan', pattern: /^\+92\d{10}$/ },
  { code: '+62', name: 'Indonesia', pattern: /^\+62\d{10,12}$/ },
  { code: '+60', name: 'Malaysia', pattern: /^\+60\d{9,10}$/ },
  { code: '+65', name: 'Singapore', pattern: /^\+65\d{8}$/ },
  { code: '+66', name: 'Thailand', pattern: /^\+66\d{9}$/ },
  { code: '+84', name: 'Vietnam', pattern: /^\+84\d{9,10}$/ },
  { code: '+81', name: 'Japan', pattern: /^\+81\d{10}$/ },
  { code: '+82', name: 'South Korea', pattern: /^\+82\d{10}$/ },
  { code: '+86', name: 'China', pattern: /^\+86\d{11}$/ },
  { code: '+39', name: 'Italy', pattern: /^\+39\d{10}$/ },
  { code: '+49', name: 'Germany', pattern: /^\+49\d{10,11}$/ },
  { code: '+33', name: 'France', pattern: /^\+33\d{9}$/ },
  { code: '+34', name: 'Spain', pattern: /^\+34\d{9}$/ },
  { code: '+31', name: 'Netherlands', pattern: /^\+31\d{9}$/ },
  { code: '+32', name: 'Belgium', pattern: /^\+32\d{9}$/ },
  { code: '+41', name: 'Switzerland', pattern: /^\+41\d{9}$/ },
  { code: '+43', name: 'Austria', pattern: /^\+43\d{10}$/ },
  { code: '+46', name: 'Sweden', pattern: /^\+46\d{9}$/ },
  { code: '+47', name: 'Norway', pattern: /^\+47\d{8}$/ },
  { code: '+45', name: 'Denmark', pattern: /^\+45\d{8}$/ },
  { code: '+358', name: 'Finland', pattern: /^\+358\d{9,10}$/ },
  { code: '+48', name: 'Poland', pattern: /^\+48\d{9}$/ },
  { code: '+420', name: 'Czech Republic', pattern: /^\+420\d{9}$/ },
  { code: '+36', name: 'Hungary', pattern: /^\+36\d{9}$/ },
  { code: '+40', name: 'Romania', pattern: /^\+40\d{9}$/ },
  { code: '+55', name: 'Brazil', pattern: /^\+55\d{10,11}$/ },
  { code: '+54', name: 'Argentina', pattern: /^\+54\d{10}$/ },
  { code: '+56', name: 'Chile', pattern: /^\+56\d{9}$/ },
  { code: '+51', name: 'Peru', pattern: /^\+51\d{9}$/ },
  { code: '+57', name: 'Colombia', pattern: /^\+57\d{10}$/ },
  { code: '+58', name: 'Venezuela', pattern: /^\+58\d{10}$/ },
  { code: '+593', name: 'Ecuador', pattern: /^\+593\d{9}$/ },
  { code: '+509', name: 'Haiti', pattern: /^\+509\d{8}$/ },
  { code: '+52', name: 'Mexico', pattern: /^\+52\d{10,11}$/ },
  { code: '+1', name: 'Jamaica', pattern: /^\+1\d{10}$/ },
  { code: '+1', name: 'Trinidad and Tobago', pattern: /^\+1\d{10}$/ },
  { code: '+1', name: 'Barbados', pattern: /^\+1\d{10}$/ },
  { code: '+1', name: 'Bahamas', pattern: /^\+1\d{10}$/ },
  { code: '+1', name: 'Belize', pattern: /^\+1\d{10}$/ },
  { code: '+502', name: 'Guatemala', pattern: /^\+502\d{8}$/ },
  { code: '+503', name: 'El Salvador', pattern: /^\+503\d{8}$/ },
  { code: '+504', name: 'Honduras', pattern: /^\+504\d{8}$/ },
  { code: '+505', name: 'Nicaragua', pattern: /^\+505\d{8}$/ },
  { code: '+506', name: 'Costa Rica', pattern: /^\+506\d{8}$/ },
  { code: '+507', name: 'Panama', pattern: /^\+507\d{8}$/ },
]

/**
 * Generate a random OTP code
 */
export function generateOTP(): string {
  let otp = ''
  for (let i = 0; i < OTP_LENGTH; i++) {
    otp += Math.floor(Math.random() * 10).toString()
  }
  return otp
}

/**
 * Validate phone number format and extract country code
 */
export function validatePhoneNumber(phone: string): { valid: boolean; countryCode?: string; error?: string } {
  // Remove any spaces or dashes
  const cleanPhone = phone.replace(/[\s-]/g, '')
  
  // Check if it starts with +
  if (!cleanPhone.startsWith('+')) {
    return { valid: false, error: 'Phone number must start with country code (e.g., +1, +44)' }
  }
  
  // Find matching country
  for (const country of COUNTRIES) {
    if (cleanPhone.startsWith(country.code)) {
      if (country.pattern.test(cleanPhone)) {
        return { valid: true, countryCode: country.code }
      }
    }
  }
  
  // Default validation: should be 10-15 digits after +
  const phonePattern = /^\+\d{10,15}$/
  if (phonePattern.test(cleanPhone)) {
    // Try to extract country code
    const countryCode = '+' + cleanPhone.slice(1, 3)
    return { valid: true, countryCode }
  }
  
  return { 
    valid: false, 
    error: 'Invalid phone number format. Please use international format (e.g., +255123456789)' 
  }
}

/**
 * Create a new OTP record
 */
export async function createOTP(
  phone: string, 
  userId: string | null, 
  purpose: 'verification' | 'login' | 'reset'
): Promise<{ otp: string; expires: Date }> {
  // Delete any existing unused OTPs for this phone and purpose
  await prisma.otpRecord.deleteMany({
    where: {
      phone,
      purpose,
      isUsed: false,
      expires: { gt: new Date() }
    }
  })

  const otp = generateOTP()
  const expires = new Date()
  expires.setMinutes(expires.getMinutes() + OTP_EXPIRY_MINUTES)

  await prisma.otpRecord.create({
    data: {
      phone,
      userId,
      code: otp,
      purpose,
      expires,
      attempts: 0,
      isUsed: false
    }
  })

  return { otp, expires }
}

/**
 * Verify an OTP code
 */
export async function verifyOTP(
  phone: string, 
  code: string, 
  purpose: 'verification' | 'login' | 'reset'
): Promise<{ valid: boolean; error?: string; userId?: string }> {
  // Find the OTP record
  const otpRecord = await prisma.otpRecord.findFirst({
    where: {
      phone,
      purpose,
      isUsed: false,
      expires: { gt: new Date() }
    },
    orderBy: { createdAt: 'desc' }
  })

  if (!otpRecord) {
    return { valid: false, error: 'No valid OTP found. Please request a new one.' }
  }

  // Check attempts
  if (otpRecord.attempts >= MAX_ATTEMPTS) {
    await prisma.otpRecord.update({
      where: { id: otpRecord.id },
      data: { isUsed: true }
    })
    return { valid: false, error: 'Too many failed attempts. Please request a new OTP.' }
  }

  // Increment attempts
  await prisma.otpRecord.update({
    where: { id: otpRecord.id },
    data: { attempts: { increment: 1 } }
  })

  // Verify code
  if (otpRecord.code !== code) {
    return { valid: false, error: 'Invalid OTP code. Please try again.' }
  }

  // Mark as used
  await prisma.otpRecord.update({
    where: { id: otpRecord.id },
    data: { isUsed: true }
  })

  return { valid: true, userId: otpRecord.userId || undefined }
}

/**
 * Check if user can resend OTP (rate limiting)
 */
export async function canResendOTP(phone: string, purpose: string): Promise<{ allowed: boolean; remainingSeconds?: number }> {
  const latestOtp = await prisma.otpRecord.findFirst({
    where: {
      phone,
      purpose,
      isUsed: false,
      expires: { gt: new Date() }
    },
    orderBy: { createdAt: 'desc' }
  })

  if (!latestOtp) {
    return { allowed: true }
  }

  const timeSinceCreation = (Date.now() - latestOtp.createdAt.getTime()) / 1000
  
  if (timeSinceCreation < RESEND_COOLDOWN_SECONDS) {
    const remainingSeconds = Math.ceil(RESEND_COOLDOWN_SECONDS - timeSinceCreation)
    return { allowed: false, remainingSeconds }
  }

  return { allowed: true }
}

/**
 * Send OTP via SMS using Twilio
 */
export async function sendOTPViaSMS(phone: string, otp: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Get Twilio credentials from environment variables
    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER

    // Check if Twilio is configured
    if (!accountSid || !authToken || !twilioPhoneNumber) {
      // Fallback to demo mode (log to console) if Twilio is not configured
      console.log(`📱 SMS to ${phone}: Your verification code is ${otp}`)
      console.log('⚠️ Twilio not configured - SMS logged to console only')
      console.log('   Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER env vars to send real SMS')
      
      // In demo mode, still return success so the flow continues
      return { success: true }
    }

    // Initialize Twilio client
    const client = twilio(accountSid, authToken)

    // Send SMS via Twilio
    await client.messages.create({
      body: `Your WhatsApp PWA verification code is: ${otp}. This code expires in ${OTP_EXPIRY_MINUTES} minutes.`,
      from: twilioPhoneNumber,
      to: phone
    })

    console.log(`✅ SMS sent successfully to ${phone}`)
    return { success: true }
  } catch (error) {
    console.error('Failed to send SMS via Twilio:', error)
    return { success: false, error: 'Failed to send OTP. Please try again.' }
  }
}

/**
 * Clean up expired OTP records
 */
export async function cleanupExpiredOTPs(): Promise<number> {
  const result = await prisma.otpRecord.deleteMany({
    where: {
      expires: { lt: new Date() }
    }
  })
  return result.count
}
