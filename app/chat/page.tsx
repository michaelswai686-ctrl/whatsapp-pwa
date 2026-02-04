/**
 * Chat Page
 * Main messaging interface with conversation list and chat window
 * Modern professional design with real-time messaging
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Send, LogOut, Plus, Search, MoreVertical, MessageSquare } from 'lucide-react'

interface Conversation {
  id: string
  participant1Id: string
  participant2Id: string
  lastMessage?: string
  lastMessageAt?: string
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

  // Redirect to auth if not logged in (after auth context has loaded)
  useEffect(() => {
    console.log('[v0] chat page: isLoading=', isLoading, 'user=', user)
    // Wait for auth context to finish loading before checking user
    if (!isLoading && !user) {
      console.log('[v0] chat page: No user found, redirecting to auth')
      // Use window.location for consistent navigation
      window.location.href = '/auth'
    } else if (!isLoading && user) {
      console.log('[v0] chat page: User found:', user.id, user.displayName)
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

  // Fetch conversations
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

  // Fetch contacts
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

  // Fetch messages for selected conversation
  useEffect(() => {
    if (selectedConversation) {
      fetchMessages()
    }
  }, [selectedConversation])

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

  // Send message
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
        setMessages([...messages, newMessage])
        setMessageInput('')
        fetchConversations() // Refresh conversations list
      }
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  // Start new conversation
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
        setSelectedConversation(conversation)
        fetchConversations()
      }
    } catch (error) {
      console.error('Failed to start conversation:', error)
    }
  }

  // Add new contact
  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newContactPhone.trim() || !user) return

    try {
      // First, find user by phone number
      const loginResponse = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: newContactPhone }),
      })

      if (!loginResponse.ok) {
        alert('User not found')
        return
      }

      const contactUser = await loginResponse.json()

      // Add contact - use contactUser.id (not userId)
      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          contactId: contactUser.id, // Fixed: use .id instead of .userId
        }),
      })

      if (response.ok) {
        setNewContactPhone('')
        fetchContacts()
        alert('Contact added successfully!')
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to add contact')
      }
    } catch (error) {
      console.error('Failed to add contact:', error)
      alert('Error adding contact')
    }
  }

  // Show loading state while auth context is loading
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
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-slate-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">Messages</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              logout()
              router.push('/auth')
            }}
          >
            <LogOut className="w-5 h-5" />
          </Button>
        </div>

        {/* Search and tabs */}
        <div className="p-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search conversations..."
              className="pl-10"
            />
          </div>

          <Tabs defaultValue="chats" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="chats">Chats</TabsTrigger>
              <TabsTrigger value="contacts">Contacts</TabsTrigger>
            </TabsList>

            {/* Chats Tab */}
            <TabsContent value="chats" className="mt-4">
              <ScrollArea className="h-96">
                {conversations.length === 0 ? (
                  <div className="p-4 text-center text-slate-500">
                    No conversations yet
                  </div>
                ) : (
                  <div className="space-y-2">
                    {conversations.map((conv) => (
                      <button
                        key={conv.id}
                        onClick={() => setSelectedConversation(conv)}
                        className={`w-full p-3 rounded-lg text-left transition-colors ${
                          selectedConversation?.id === conv.id
                            ? 'bg-blue-50 border border-blue-200'
                            : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>
                              {conv.participant1Id === user.id ? 'C' : 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-slate-900 truncate">
                              Contact
                            </p>
                            <p className="text-sm text-slate-600 truncate">
                              {conv.lastMessage || 'No messages yet'}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            {/* Contacts Tab */}
            <TabsContent value="contacts" className="mt-4">
              <form onSubmit={handleAddContact} className="mb-4 flex gap-2">
                <Input
                  placeholder="Add contact by phone..."
                  value={newContactPhone}
                  onChange={(e) => setNewContactPhone(e.target.value)}
                  className="text-sm"
                />
                <Button type="submit" size="sm" className="bg-blue-600">
                  <Plus className="w-4 h-4" />
                </Button>
              </form>

              <ScrollArea className="h-80">
                {contacts.length === 0 ? (
                  <div className="p-4 text-center text-slate-500">
                    No contacts yet
                  </div>
                ) : (
                  <div className="space-y-2">
                    {contacts.map((contact) => (
                      <button
                        key={contact.id}
                        onClick={() =>
                          handleStartConversation(contact.contact.id)
                        }
                        className="w-full p-3 rounded-lg text-left hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>
                              {contact.contact.displayName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-slate-900 truncate">
                              {contact.contact.displayName}
                            </p>
                            <p className="text-xs text-slate-500">
                              {contact.contact.isOnline
                                ? 'Online'
                                : 'Offline'}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Contact
                </h2>
                <p className="text-sm text-slate-500">Online</p>
              </div>
              <Button variant="ghost" size="icon">
                <MoreVertical className="w-5 h-5" />
              </Button>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${
                      msg.senderId === user.id
                        ? 'justify-end'
                        : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-xs px-4 py-2 rounded-lg ${
                        msg.senderId === user.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-900'
                      }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                      <p
                        className={`text-xs mt-1 ${
                          msg.senderId === user.id
                            ? 'text-blue-100'
                            : 'text-slate-500'
                        }`}
                      >
                        {new Date(msg.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

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
              />
              <Button
                type="submit"
                disabled={!messageInput.trim()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-500">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <p>Select a conversation to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
