'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Send, LogOut, Plus, MessageSquare, ArrowLeft, Users, Lock } from 'lucide-react'

interface Message {
  id: string
  content: string
  senderId: string
  receiverId: string
  status: string
  createdAt: string
  isEncrypted?: boolean
  encryptedContent?: string
  iv?: string  // IV is needed for decryption
  decryptedContent?: string
}

export default function ChatPage() {
  const router = useRouter()
  const { user, isLoading, logout } = useAuth()
  const [conversations, setConversations] = useState<any[]>([])
  const [contacts, setContacts] = useState<any[]>([])
  const [selectedConversation, setSelectedConversation] = useState<any>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [messageInput, setMessageInput] = useState('')
  const [pageLoading, setPageLoading] = useState(true)
  const [newContactPhone, setNewContactPhone] = useState('')
  const [showMobileChat, setShowMobileChat] = useState(false)
  const [contactError, setContactError] = useState('')
  const [isEncryptionReady, setIsEncryptionReady] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [recipientPublicKey, setRecipientPublicKey] = useState<string | null>(null)
  const [isChatEncrypted, setIsChatEncrypted] = useState(false)

  const initializeEncryption = async () => {
    if (!user) return
    try {
      const { getOrCreateKeyPair, exportKey } = await import('@/lib/encryption')
      const keyPair = await getOrCreateKeyPair(user.id)
      const publicKeyJson = await exportKey(keyPair.publicKey)
      await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, publicKey: publicKeyJson })
      })
      setIsEncryptionReady(true)
    } catch (error) {
      console.error('Encryption init failed:', error)
    }
  }

  const fetchRecipientPublicKey = async () => {
    if (!selectedConversation || !user) return
    const recipientId = selectedConversation.participant1Id === user.id
      ? selectedConversation.participant2Id
      : selectedConversation.participant1Id
    try {
      const response = await fetch(`/api/users?userId=${recipientId}`)
      if (response.ok) {
        const userData = await response.json()
        if (userData.publicKey) {
          setRecipientPublicKey(userData.publicKey)
          setIsChatEncrypted(true)
        } else {
          setRecipientPublicKey(null)
          setIsChatEncrypted(false)
        }
      }
    } catch (error) {
      setIsChatEncrypted(false)
    }
  }

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => { scrollToBottom() }, [messages, scrollToBottom])

  useEffect(() => {
    if (!isLoading && !user) { window.location.href = '/auth' }
    else if (!isLoading && user) { setPageLoading(false) }
  }, [user, isLoading, router])

  useEffect(() => {
    if (user && !pageLoading) {
      fetchConversations()
      fetchContacts()
      initializeEncryption()
    }
  }, [user, pageLoading])

  useEffect(() => {
    if (selectedConversation && user) { fetchRecipientPublicKey() }
  }, [selectedConversation?.id, user?.id])

  useEffect(() => {
    if (!selectedConversation || !user) return
    fetchMessages()
    const interval = setInterval(() => fetchMessages(), 3000)
    return () => clearInterval(interval)
  }, [selectedConversation?.id])

  useEffect(() => {
    if (!user || pageLoading) return
    const interval = setInterval(() => fetchConversations(), 5000)
    return () => clearInterval(interval)
  }, [user, pageLoading])

  const decryptMessages = async () => {
    if (!user) return
    try {
      const { decryptFromSender } = await import('@/lib/encryption')
      const decrypted = await Promise.all(
        messages.map(async (msg) => {
          if (msg.isEncrypted && msg.senderId !== user.id && msg.encryptedContent && msg.iv) {
            try {
              const text = await decryptFromSender(user.id, msg.encryptedContent, msg.iv)
              return { ...msg, decryptedContent: text || '[Decryption failed]' }
            } catch { return { ...msg, decryptedContent: '[Unable to decrypt]' } }
          }
          return msg
        })
      )
      setMessages(decrypted)
    } catch (error) { console.error('Decrypt error:', error) }
  }

  useEffect(() => {
    if (messages.length > 0 && user && isEncryptionReady) { decryptMessages() }
  }, [messages, user, isEncryptionReady])

  const fetchConversations = async () => {
    if (!user) return
    try {
      const res = await fetch(`/api/conversations?userId=${user.id}`)
      if (res.ok) setConversations(await res.json())
    } catch (e) { console.error(e) }
  }

  const fetchContacts = async () => {
    if (!user) return
    try {
      const res = await fetch(`/api/contacts?userId=${user.id}`)
      if (res.ok) setContacts(await res.json())
    } catch (e) { console.error(e) }
  }

  const fetchMessages = async () => {
    if (!selectedConversation) return
    try {
      const res = await fetch(`/api/messages?conversationId=${selectedConversation.id}`)
      if (res.ok) setMessages(await res.json())
    } catch (e) { console.error(e) }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!messageInput.trim() || !selectedConversation || !user) return
    const receiverId = selectedConversation.participant1Id === user.id
      ? selectedConversation.participant2Id
      : selectedConversation.participant1Id

    try {
      let messageData: any = { conversationId: selectedConversation.id, senderId: user.id, receiverId, content: messageInput }
      if (recipientPublicKey && isEncryptionReady && isChatEncrypted) {
        try {
          const { encryptForRecipient } = await import('@/lib/encryption')
          const encrypted = await encryptForRecipient(user.id, recipientPublicKey, messageInput)
          if (encrypted) {
            messageData = { 
              conversationId: selectedConversation.id, 
              senderId: user.id, 
              receiverId, 
              content: '', 
              isEncrypted: true, 
              encryptedContent: encrypted.encryptedContent,
              iv: encrypted.iv  // Include IV for decryption
            }
          }
        } catch { console.error('Encryption failed') }
      }
      const res = await fetch('/api/messages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(messageData) })
      if (res.ok) { const newMsg = await res.json(); setMessages(prev => [...prev, newMsg]); setMessageInput(''); fetchConversations() }
    } catch (e) { console.error(e) }
  }

  const handleStartConversation = async (contactId: string) => {
    if (!user) return
    try {
      const res = await fetch('/api/conversations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ participant1Id: user.id, participant2Id: contactId }) })
      if (res.ok) {
        const conv = await res.json()
        await fetchConversations()
        const r = await fetch(`/api/conversations?userId=${user.id}`)
        if (r.ok) {
          const cs = await r.json()
          const full = cs.find((c: any) => c.id === conv.id)
          if (full) { setSelectedConversation(full); setShowMobileChat(true) }
        }
      }
    } catch (e) { console.error(e) }
  }

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newContactPhone.trim() || !user) return
    setContactError('')
    try {
      const sr = await fetch(`/api/users?phone=${encodeURIComponent(newContactPhone)}`)
      if (!sr.ok) { setContactError('User not found'); return }
      const cu = await sr.json()
      if (cu.id === user.id) { setContactError("Can't add yourself"); return }
      const res = await fetch('/api/contacts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id, contactId: cu.id }) })
      if (res.ok) { setNewContactPhone(''); fetchContacts() }
      else { const err = await res.json(); setContactError(err.error || 'Failed') }
    } catch { setContactError('Error') }
  }

  const getName = (conv: any) => conv.otherParticipant?.displayName || conv.otherParticipant?.phoneNumber || 'Unknown'
  const getInit = (conv: any) => conv.otherParticipant?.displayName?.[0]?.toUpperCase() || '?'
  const isOnline = (conv: any) => conv.otherParticipant?.isOnline || false
  const getContent = (msg: Message) => msg.decryptedContent || (msg.isEncrypted ? '🔒 Encrypted' : msg.content)

  if (isLoading || pageLoading) return (
    <div className="h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div><p>Loading...</p></div>
    </div>
  )
  if (!user) return null

  return (
    <div className="h-screen bg-slate-50 flex">
      <div className={`w-full md:w-80 bg-white border-r flex flex-col ${showMobileChat ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b flex justify-between items-center">
          <div><h1 className="text-xl font-bold">Messages</h1><p className="text-xs text-slate-500">{user.displayName}</p></div>
          <Button variant="ghost" size="icon" onClick={() => { logout(); router.push('/auth') }}><LogOut className="w-5 h-5" /></Button>
        </div>
        <div className="p-4 flex-1 overflow-hidden flex flex-col">
          <Tabs defaultValue="chats" className="flex-1 flex flex-col">
            <TabsList className="grid grid-cols-2"><TabsTrigger value="chats">Chats</TabsTrigger><TabsTrigger value="contacts">Contacts</TabsTrigger></TabsList>
            <TabsContent value="chats" className="mt-4 flex-1 overflow-auto">
              {conversations.length === 0 ? <div className="p-8 text-center text-slate-500"><MessageSquare className="w-12 h-12 mx-auto mb-3" /><p>No conversations</p></div> :
              <div className="space-y-1">{conversations.map(conv => (
                <button key={conv.id} onClick={() => { setSelectedConversation(conv); setShowMobileChat(true) }} className={`w-full p-3 rounded-lg text-left ${selectedConversation?.id === conv.id ? 'bg-blue-50' : 'hover:bg-slate-50'}`}>
                  <div className="flex items-center gap-3">
                    <Avatar><AvatarFallback>{getInit(conv)}</AvatarFallback></Avatar>
                    <div className="flex-1 min-w-0"><p className="font-medium truncate">{getName(conv)}</p><p className="text-sm text-slate-500 truncate">{conv.lastMessage || 'No messages'}</p></div>
                  </div>
                </button>
              ))}</div>}
            </TabsContent>
            <TabsContent value="contacts" className="mt-4 flex-1 overflow-auto">
              <form onSubmit={handleAddContact} className="mb-4 flex gap-2">
                <Input placeholder="Phone number" value={newContactPhone} onChange={e => { setNewContactPhone(e.target.value); setContactError('') }} className="text-sm" />
                <Button type="submit" size="sm" className="bg-blue-600"><Plus className="w-4 h-4" /></Button>
              </form>
              {contactError && <p className="text-xs text-red-500 mb-2">{contactError}</p>}
              {contacts.map(c => (
                <button key={c.id} onClick={() => handleStartConversation(c.contact.id)} className="w-full p-3 rounded-lg text-left hover:bg-slate-50">
                  <div className="flex items-center gap-3">
                    <Avatar><AvatarFallback>{c.contact.displayName?.[0]?.toUpperCase() || '?'}</AvatarFallback></Avatar>
                    <div><p className="font-medium">{c.contact.displayName}</p><p className="text-xs text-slate-500">{c.contact.phoneNumber}</p></div>
                  </div>
                </button>
              ))}
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <div className={`flex-1 flex flex-col bg-white ${showMobileChat ? 'flex' : 'hidden md:flex'}`}>
        {selectedConversation ? (
          <>
            <div className="p-4 border-b flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => { setShowMobileChat(false); setSelectedConversation(null) }} className="md:hidden"><ArrowLeft className="w-5 h-5" /></Button>
              <Avatar><AvatarFallback>{getInit(selectedConversation)}</AvatarFallback></Avatar>
              <div className="flex-1">
                <h2 className="text-lg font-semibold">{getName(selectedConversation)}</h2>
                <p className="text-sm text-slate-500 flex items-center gap-1">{isOnline(selectedConversation) ? 'Online' : 'Offline'}{isChatEncrypted && <Lock className="w-3 h-3 text-green-600" />}</p>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-3">
                {messages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.senderId === user.id ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] px-4 py-2 rounded-2xl ${msg.senderId === user.id ? 'bg-blue-600 text-white' : 'bg-slate-100'}`}>
                      <div className="flex items-center gap-1 mb-1">{msg.isEncrypted && <Lock className={`w-3 h-3 ${msg.senderId === user.id ? 'text-blue-200' : 'text-slate-400'}`} />}</div>
                      <p className="text-sm">{getContent(msg)}</p>
                      <p className={`text-[10px] mt-1 ${msg.senderId === user.id ? 'text-blue-200' : 'text-slate-400'}`}>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>
            <form onSubmit={handleSendMessage} className="p-4 border-t flex gap-2">
              <Input placeholder={isChatEncrypted ? "Type encrypted..." : "Type a message..."} value={messageInput} onChange={e => setMessageInput(e.target.value)} className="flex-1" autoFocus />
              <Button type="submit" disabled={!messageInput.trim()} className="bg-blue-600"><Send className="w-4 h-4" /></Button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-500">
            <div className="text-center"><MessageSquare className="w-16 h-16 mx-auto mb-4 text-slate-300" /><p>Select a conversation</p></div>
          </div>
        )}
      </div>
    </div>
  )
}
