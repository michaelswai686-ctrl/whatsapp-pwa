/**
 * End-to-End Encryption Library
 * Uses Web Crypto API for secure client-side encryption
 */

const KEY_STORAGE_PREFIX = 'whatsapp_e2e_'
const KEY_PAIR_STORAGE_KEY = `${KEY_STORAGE_PREFIX}keypair_`

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer as ArrayBuffer
}

export async function generateKeyPair(): Promise<CryptoKeyPair> {
  return await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveKey']
  )
}

export async function exportKey(key: CryptoKey): Promise<string> {
  // Export as JWK format for key exchange
  // @ts-ignore - JWK export is not in all TypeScript definitions
  const exported = await crypto.subtle.exportKey('jwk', key)
  return JSON.stringify(exported)
}

export async function importKey(keyJson: string, algorithm: string, keyUsage: string[]): Promise<CryptoKey> {
  const keyData = JSON.parse(keyJson)
  let algo: any = {}

  if (algorithm === 'AES-GCM') {
    algo = { name: 'AES-GCM', length: 256 }
  } else if (algorithm === 'ECDH') {
    algo = { name: 'ECDH', namedCurve: 'P-256' }
  }

  // @ts-ignore - JWK import is not in all TypeScript definitions
  return await crypto.subtle.importKey('jwk', keyData, algo, true, keyUsage)
}

export async function deriveSharedKey(privateKey: CryptoKey, publicKey: CryptoKey): Promise<CryptoKey> {
  return await crypto.subtle.deriveKey(
    { name: 'ECDH', public: publicKey },
    privateKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

export async function encryptMessage(message: string, key: CryptoKey): Promise<{ ciphertext: string; iv: string }> {
  const encoder = new TextEncoder()
  const data = encoder.encode(message)
  const iv = crypto.getRandomValues(new Uint8Array(12))

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    data
  )

  return {
    ciphertext: arrayBufferToBase64(ciphertext as ArrayBuffer),
    iv: arrayBufferToBase64(iv as unknown as ArrayBuffer),
  }
}

export async function decryptMessage(ciphertext: string, iv: string, key: CryptoKey): Promise<string> {
  const ciphertextBuffer = base64ToArrayBuffer(ciphertext)
  const ivBuffer = base64ToArrayBuffer(iv)

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: new Uint8Array(ivBuffer) },
    key,
    ciphertextBuffer
  )

  const decoder = new TextDecoder()
  return decoder.decode(decrypted)
}

export function storeKeys(userId: string, publicKey: string, privateKey: string): void {
  localStorage.setItem(`${KEY_PAIR_STORAGE_KEY}${userId}`, JSON.stringify({ publicKey, privateKey }))
}

export function getStoredKeys(userId: string): { publicKey: string; privateKey: string } | null {
  const stored = localStorage.getItem(`${KEY_PAIR_STORAGE_KEY}${userId}`)
  if (!stored) return null
  try {
    return JSON.parse(stored)
  } catch {
    return null
  }
}

export async function getOrCreateKeyPair(userId: string): Promise<{ publicKey: CryptoKey; privateKey: CryptoKey }> {
  const stored = getStoredKeys(userId)
  
  if (stored) {
    const publicKey = await importKey(stored.publicKey, 'ECDH', ['deriveKey'])
    const privateKey = await importKey(stored.privateKey, 'ECDH', ['deriveKey'])
    return { publicKey, privateKey }
  }

  const keyPair = await generateKeyPair()
  const exportedPublicKey = await exportKey(keyPair.publicKey)
  const exportedPrivateKey = await exportKey(keyPair.privateKey)
  
  storeKeys(userId, exportedPublicKey, exportedPrivateKey)
  
  return { publicKey: keyPair.publicKey, privateKey: keyPair.privateKey }
}

export async function importRecipientPublicKey(publicKeyJson: string): Promise<CryptoKey> {
  return await importKey(publicKeyJson, 'ECDH', ['deriveKey'])
}

export async function encryptForRecipient(
  senderId: string,
  recipientPublicKeyJson: string,
  message: string
): Promise<{ encryptedContent: string; iv: string } | null> {
  try {
    const { privateKey, publicKey } = await getOrCreateKeyPair(senderId)
    const recipientPublicKey = await importRecipientPublicKey(recipientPublicKeyJson)
    const sharedKey = await deriveSharedKey(privateKey, recipientPublicKey)
    const encrypted = await encryptMessage(message, sharedKey)
    const senderPublicKeyExported = await exportKey(publicKey)
    
    return {
      encryptedContent: JSON.stringify({
        ciphertext: encrypted.ciphertext,
        senderPublicKey: senderPublicKeyExported,
      }),
      iv: encrypted.iv,
    }
  } catch (error) {
    console.error('Encryption error:', error)
    return null
  }
}

export async function decryptFromSender(
  recipientId: string,
  encryptedContent: string,
  iv: string
): Promise<string | null> {
  try {
    const parsed = JSON.parse(encryptedContent)
    const ciphertext = parsed.ciphertext
    const senderPublicKeyJson = parsed.senderPublicKey
    
    // Validate required parameters
    if (!ciphertext || !senderPublicKeyJson || !iv) {
      console.error('Decryption error: Missing required parameters')
      return null
    }
    
    const { privateKey } = await getOrCreateKeyPair(recipientId)
    const senderPublicKey = await importRecipientPublicKey(senderPublicKeyJson)
    const sharedKey = await deriveSharedKey(privateKey, senderPublicKey)
    const decrypted = await decryptMessage(ciphertext, iv, sharedKey)
    return decrypted
  } catch (error) {
    console.error('Decryption error:', error)
    return null
  }
}
