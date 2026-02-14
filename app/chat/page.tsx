/**
 * Chat Page
 * Main messaging interface with conversation list and chat window
 * Features: real contact names, message polling, mobile responsive, auto-scroll
 */

'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Send, LogOut, Plus, Search, MoreVertical, MessageSquare, ArrowLeft, Users } from 'lucide-react'

interface OtherParticipant {
  id: string
  displayName: string | null
  phoneNumber: string
  profileImage?: string | null
  isOnline: boolean
  lastSeen?: string | null
}

interface Conversation {
  id: string
  participant1Id: string
  participant2Id: string
  lastMessage?: string
  lastMessageAt?: string
  otherParticipant?: OtherParticipant | null
}

interface Message {
  id: string
  content: string
  senderId: string
  receiverId: string
  status: string
  createdAt: string
  sender: {
    id: string
    displayName: string
    profileImage?: string
  }
}

interface Contact {
  id: string
  contact: {
    id: string
    phoneNumber: string
    displayName: string
    profileImage?: string
    status?: string
    isOnline: boolean
  }
}

export default function ChatPage() {
  const router = useRouter()
  const { user, isLoading, logout } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [messageInput, setMessageInput] = useState('')
  const [pageLoading, setPageLoading] = useState(true)
  const [newContactPhone, setNewContactPhone] = useState('')
  const [showMobileChat, setShowMobileChat] = useState(false)
  const [contactError, setContactError] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when messages change
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!isLoading && !user) {
      window.location.href = '/auth'
    } else if (!isLoading && user) {
      setPageLoading(false)
    }
  }, [user, isLoading, router])

  // Fetch conversations on mount
  useEffect(() => {
    if (user && !pageLoading) {
      fetchConversations()
      fetchContacts()
    }
  }, [user, pageLoading])

  // Message polling - check for new messages every 3 seconds
  useEffect(() => {
    if (!selectedConversation || !user) return

    fetchMessages()
    const interval = setInterval(() => {
      fetchMessages()
    }, 3000)

    return () => clearInterval(interval)
  }, [selectedConversation?.id])

  // Conversation list polling - refresh every 5 seconds
  useEffect(() => {
    if (!user || pageLoading) return

    const interval = setInterval(() => {
      fetchConversations()
    }, 5000)

    return () => clearInterval(interval)
  }, [user, pageLoading])

  const fetchConversations = async () => {
    try {
      const response = await fetch(`/api/conversations?userId=${user?.id}`)
      if (response.ok) {
        const data = await response.json()
        setConversations(data)
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error)
    }
  }

  const fetchContacts = async () => {
    try {
      const response = await fetch(`/api/contacts?userId=${user?.id}`)
      if (response.ok) {
        const data = await response.json()
        setContacts(data)
      }
    } catch (error) {
      console.error('Failed to fetch contacts:', error)
    }
  }

  const fetchMessages = async () => {
    if (!selectedConversation) return

    try {
      const response = await fetch(
        `/api/messages?conversationId=${selectedConversation.id}`
      )
      if (response.ok) {
        const data = await response.json()
        setMessages(data)
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!messageInput.trim() || !selectedConversation || !user) return

    const receiverId =
      selectedConversation.participant1Id === user.id
        ? selectedConversation.participant2Id
        : selectedConversation.participant1Id

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: selectedConversation.id,
          senderId: user.id,
          receiverId,
          content: messageInput,
        }),
      })

      if (response.ok) {
        const newMessage = await response.json()
        setMessages((prev) => [...prev, newMessage])
        setMessageInput('')
        fetchConversations()
      }
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  const handleStartConversation = async (contactId: string) => {
    if (!user) return

    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participant1Id: user.id,
          participant2Id: contactId,
        }),
      })

      if (response.ok) {
        const conversation = await response.json()
        await fetchConversations()
        // Find the conversation with participant data
        const convResponse = await fetch(`/api/conversations?userId=${user.id}`)
        if (convResponse.ok) {
          const convs = await convResponse.json()
          const fullConv = convs.find((c: Conversation) => c.id === conversation.id)
          if (fullConv) {
            setSelectedConversation(fullConv)
            setShowMobileChat(true)
          }
        }
      }
    } catch (error) {
      console.error('Failed to start conversation:', error)
    }
  }

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newContactPhone.trim() || !user) return
    setContactError('')

    try {
      // Use the dedicated user search endpoint (not login)
      const searchResponse = await fetch(`/api/users?phone=${encodeURIComponent(newContactPhone)}`)

      if (!searchResponse.ok) {
        setContactError('User not found with that phone number')
        return
      }

      const contactUser = await searchResponse.json()

      if (contactUser.id === user.id) {
        setContactError("You can't add yourself as a contact")
        return
      }

      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          contactId: contactUser.id,
        }),
      })

      if (response.ok) {
        setNewContactPhone('')
        setContactError('')
        fetchContacts()
      } else {
        const error = await response.json()
        setContactError(error.error || 'Failed to add contact')
      }
    } catch (error) {
      console.error('Failed to add contact:', error)
      setContactError('Error adding contact')
    }
  }

  const getConversationDisplayName = (conv: Conversation) => {
    return conv.otherParticipant?.displayName || conv.otherParticipant?.phoneNumber || 'Unknown'
  }

  const getConversationInitial = (conv: Conversation) => {
    const name = conv.otherParticipant?.displayName
    return name ? name[0].toUpperCase() : '?'
  }

  const getConversationOnlineStatus = (conv: Conversation) => {
    return conv.otherParticipant?.isOnline || false
  }

  const handleSelectConversation = (conv: Conversation) => {
    setSelectedConversation(conv)
    setShowMobileChat(true)
  }

  const handleBackToList = () => {
    setShowMobileChat(false)
    setSelectedConversation(null)
  }

  if (isLoading || pageLoading) {
    return (
      <div className="h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="h-screen bg-slate-50 flex">
      {/* Sidebar - hidden on mobile when chat is open */}
      <div className={`w-full md:w-80 bg-white border-r border-slate-200 flex flex-col ${showMobileChat ? 'hidden md:flex' : 'flex'}`}>
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Messages</h1>
            <p className="text-xs text-slate-500">{user.displayName}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              logout()
              router.push('/auth')
            }}
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </Button>
        </div>

        {/* Tabs */}
        <div className="p-4 space-y-4 flex-1 overflow-hidden flex flex-col">
          <Tabs defaultValue="chats" className="w-full flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="chats">Chats</TabsTrigger>
              <TabsTrigger value="contacts">Contacts</TabsTrigger>
            </TabsList>

            {/* Chats Tab */}
            <TabsContent value="chats" className="mt-4 flex-1 overflow-auto">
              {conversations.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p className="font-medium">No conversations yet</p>
                  <p className="text-sm mt-1">Add a contact and start chatting!</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {conversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => handleSelectConversation(conv)}
                      className={`w-full p-3 rounded-lg text-left transition-colors ${selectedConversation?.id === conv.id
                          ? 'bg-blue-50 border border-blue-200'
                          : 'hover:bg-slate-50'
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar>
                            <AvatarFallback className="bg-blue-100 text-blue-700">
                              {getConversationInitial(conv)}
                            </AvatarFallback>
                          </Avatar>
                          {getConversationOnlineStatus(conv) && (
                            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-900 truncate">
                            {getConversationDisplayName(conv)}
                          </p>
                          <p className="text-sm text-slate-500 truncate">
                            {conv.lastMessage || 'No messages yet'}
                          </p>
                        </div>
                        {conv.lastMessageAt && (
                          <span className="text-xs text-slate-400 shrink-0">
                            {new Date(conv.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Contacts Tab */}
            <TabsContent value="contacts" className="mt-4 flex-1 overflow-auto">
              <form onSubmit={handleAddContact} className="mb-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Phone number (+255...)"
                    value={newContactPhone}
                    onChange={(e) => {
                      setNewContactPhone(e.target.value)
                      setContactError('')
                    }}
                    className="text-sm"
                  />
                  <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700 shrink-0">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {contactError && (
                  <p className="text-xs text-red-500 mt-1">{contactError}</p>
                )}
              </form>

              {contacts.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p className="font-medium">No contacts yet</p>
                  <p className="text-sm mt-1">Add a contact by their phone number</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {contacts.map((contact) => (
                    <button
                      key={contact.id}
                      onClick={() =>
                        handleStartConversation(contact.contact.id)
                      }
                      className="w-full p-3 rounded-lg text-left hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar>
                            <AvatarFallback className="bg-emerald-100 text-emerald-700">
                              {contact.contact.displayName?.[0]?.toUpperCase() || '?'}
                            </AvatarFallback>
                          </Avatar>
                          {contact.contact.isOnline && (
                            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-900 truncate">
                            {contact.contact.displayName}
                          </p>
                          <p className="text-xs text-slate-500">
                            {contact.contact.phoneNumber}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Chat Area */}
      <div className={`flex-1 flex flex-col bg-white ${showMobileChat ? 'flex' : 'hidden md:flex'}`}>
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-slate-200 flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBackToList}
                className="md:hidden"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="relative">
                <Avatar>
                  <AvatarFallback className="bg-blue-100 text-blue-700">
                    {getConversationInitial(selectedConversation)}
                  </AvatarFallback>
                </Avatar>
                {getConversationOnlineStatus(selectedConversation) && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                )}
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-slate-900">
                  {getConversationDisplayName(selectedConversation)}
                </h2>
                <p className="text-sm text-slate-500">
                  {getConversationOnlineStatus(selectedConversation) ? 'Online' : 'Offline'}
                </p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-3">
                {messages.length === 0 && (
                  <div className="text-center text-slate-400 mt-8">
                    <p>No messages yet. Say hello! 👋</p>
                  </div>
                )}
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.senderId === user.id
                        ? 'justify-end'
                        : 'justify-start'
                      }`}
                  >
                    <div
                      className={`max-w-[75%] sm:max-w-xs px-4 py-2 rounded-2xl ${msg.senderId === user.id
                          ? 'bg-blue-600 text-white rounded-br-md'
                          : 'bg-slate-100 text-slate-900 rounded-bl-md'
                        }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                      <p
                        className={`text-[10px] mt-1 ${msg.senderId === user.id
                            ? 'text-blue-200'
                            : 'text-slate-400'
                          }`}
                      >
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Message Input */}
            <form
              onSubmit={handleSendMessage}
              className="p-4 border-t border-slate-200 flex gap-2"
            >
              <Input
                placeholder="Type a message..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                className="flex-1"
                autoFocus
              />
              <Button
                type="submit"
                disabled={!messageInput.trim()}
                className="bg-blue-600 hover:bg-blue-700 shrink-0"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-500">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <p className="text-lg font-medium">Select a conversation</p>
              <p className="text-sm text-slate-400 mt-1">Choose from your chats or start a new one</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
