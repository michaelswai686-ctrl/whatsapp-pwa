-- WhatsApp PWA Database Setup
-- This script creates all necessary tables for the application

-- Create User table
CREATE TABLE IF NOT EXISTS "User" (
  "id" TEXT NOT NULL,
  "phoneNumber" VARCHAR(20) NOT NULL,
  "displayName" VARCHAR(255),
  "profileImage" TEXT,
  "status" VARCHAR(500) DEFAULT 'Hey there! I''m using WhatsApp.',
  "isOnline" BOOLEAN NOT NULL DEFAULT false,
  "lastSeen" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- Create unique index on phoneNumber
CREATE UNIQUE INDEX IF NOT EXISTS "User_phoneNumber_key" ON "User"("phoneNumber");

-- Create indexes for fast queries
CREATE INDEX IF NOT EXISTS "User_phoneNumber_idx" ON "User"("phoneNumber");
CREATE INDEX IF NOT EXISTS "User_isOnline_idx" ON "User"("isOnline");
CREATE INDEX IF NOT EXISTS "User_createdAt_idx" ON "User"("createdAt");
CREATE INDEX IF NOT EXISTS "User_lastSeen_idx" ON "User"("lastSeen");

-- Create Contact table
CREATE TABLE IF NOT EXISTS "Contact" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "contactId" TEXT NOT NULL,
  "nickname" VARCHAR(255),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Contact_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Contact_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Contact_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create unique constraint for contacts
CREATE UNIQUE INDEX IF NOT EXISTS "Contact_userId_contactId_key" ON "Contact"("userId", "contactId");

-- Create indexes for Contact
CREATE INDEX IF NOT EXISTS "Contact_userId_idx" ON "Contact"("userId");
CREATE INDEX IF NOT EXISTS "Contact_contactId_idx" ON "Contact"("contactId");
CREATE INDEX IF NOT EXISTS "Contact_createdAt_idx" ON "Contact"("createdAt");

-- Create Conversation table
CREATE TABLE IF NOT EXISTS "Conversation" (
  "id" TEXT NOT NULL,
  "participant1Id" TEXT NOT NULL,
  "participant2Id" TEXT NOT NULL,
  "lastMessage" TEXT,
  "lastMessageAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint for conversations
CREATE UNIQUE INDEX IF NOT EXISTS "Conversation_participant1Id_participant2Id_key" ON "Conversation"("participant1Id", "participant2Id");

-- Create indexes for Conversation
CREATE INDEX IF NOT EXISTS "Conversation_participant1Id_idx" ON "Conversation"("participant1Id");
CREATE INDEX IF NOT EXISTS "Conversation_participant2Id_idx" ON "Conversation"("participant2Id");
CREATE INDEX IF NOT EXISTS "Conversation_lastMessageAt_idx" ON "Conversation"("lastMessageAt");
CREATE INDEX IF NOT EXISTS "Conversation_updatedAt_idx" ON "Conversation"("updatedAt");

-- Create Message table
CREATE TABLE IF NOT EXISTS "Message" (
  "id" TEXT NOT NULL,
  "conversationId" TEXT NOT NULL,
  "senderId" TEXT NOT NULL,
  "receiverId" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "mediaUrl" TEXT,
  "mediaType" VARCHAR(50),
  "status" VARCHAR(20) NOT NULL DEFAULT 'sent',
  "isDeleted" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "readAt" TIMESTAMP(3),

  CONSTRAINT "Message_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Message_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create indexes for Message
CREATE INDEX IF NOT EXISTS "Message_conversationId_idx" ON "Message"("conversationId");
CREATE INDEX IF NOT EXISTS "Message_senderId_idx" ON "Message"("senderId");
CREATE INDEX IF NOT EXISTS "Message_receiverId_idx" ON "Message"("receiverId");
CREATE INDEX IF NOT EXISTS "Message_createdAt_idx" ON "Message"("createdAt");
CREATE INDEX IF NOT EXISTS "Message_status_idx" ON "Message"("status");
CREATE INDEX IF NOT EXISTS "Message_conversationId_createdAt_idx" ON "Message"("conversationId", "createdAt");

-- Create Session table
CREATE TABLE IF NOT EXISTS "Session" (
  "id" TEXT NOT NULL,
  "sessionToken" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "expires" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- Create unique index on sessionToken
CREATE UNIQUE INDEX IF NOT EXISTS "Session_sessionToken_key" ON "Session"("sessionToken");

-- Create indexes for Session
CREATE INDEX IF NOT EXISTS "Session_userId_idx" ON "Session"("userId");
CREATE INDEX IF NOT EXISTS "Session_expires_idx" ON "Session"("expires");

-- Create VerificationToken table
CREATE TABLE IF NOT EXISTS "VerificationToken" (
  "id" TEXT NOT NULL,
  "phone" VARCHAR(20) NOT NULL,
  "token" TEXT NOT NULL,
  "expires" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "VerificationToken_pkey" PRIMARY KEY ("id")
);

-- Create unique indexes for VerificationToken
CREATE UNIQUE INDEX IF NOT EXISTS "VerificationToken_phone_key" ON "VerificationToken"("phone");
CREATE UNIQUE INDEX IF NOT EXISTS "VerificationToken_token_key" ON "VerificationToken"("token");

-- Create indexes for VerificationToken
CREATE INDEX IF NOT EXISTS "VerificationToken_phone_idx" ON "VerificationToken"("phone");
CREATE INDEX IF NOT EXISTS "VerificationToken_expires_idx" ON "VerificationToken"("expires");
