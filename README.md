# WhatsApp PWA - Modern Messaging App

A fully functional WhatsApp clone built as a Progressive Web App (PWA) with real-time 1-on-1 messaging and contact search functionality.

## 🚀 Features

### ✅ Core Features
- **User Authentication**: Register and login with phone numbers
- **1-on-1 Messaging**: Send and receive messages in real-time
- **Contact Search**: Search for registered users by phone number
- **Contact Management**: Add contacts and manage your contact list
- **Message History**: All messages are persisted in the database
- **Online Status**: See who's online or offline
- **Progressive Web App**: Install on your phone like a native app

### ✅ Technical Features
- **Real-time Updates**: Messages sync instantly between users
- **Offline Support**: Service worker enables offline functionality
- **Responsive Design**: Works on mobile, tablet, and desktop
- **Modern UI**: Professional design with blue gradient theme
- **Database**: PostgreSQL with Prisma ORM
- **API Routes**: Next.js API routes for backend logic

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Phone number based (localStorage)
- **Real-time**: Socket.io ready (can be added)
- **PWA**: Service Worker, Web Manifest
- **Deployment**: Vercel

## 📱 Installation & Setup

### Prerequisites
- Node.js 18+
- PostgreSQL database
- npm or yarn

### Local Development

1. **Clone the repository**
```bash
git clone https://github.com/michaelswai/whatsapp-pwa.git
cd whatsapp-pwa
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env.local
```

Update `.env.local` with your database credentials:
```
DATABASE_URL="postgresql://user:password@localhost:5432/whatsapp_pwa"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

4. **Create database**
```bash
createdb whatsapp_pwa
```

5. **Run migrations**
```bash
npx prisma migrate dev
```

6. **Start development server**
```bash
npm run dev
```

7. **Open in browser**
```
http://localhost:3000
```

## 🎯 How to Use

### Register a New Account
1. Go to the app
2. Click "Register" tab
3. Enter your phone number (e.g., +255712345678)
4. Enter your display name
5. Click "Register"

### Login
1. Go to the app
2. Click "Login" tab
3. Enter your phone number
4. Click "Login"

### Add a Contact
1. Go to "Contacts" tab
2. Enter the phone number of a registered user
3. Click the "+" button
4. Contact will be added to your list

### Send a Message
1. Click on a contact in the Contacts list
2. A conversation will open
3. Type your message in the input field
4. Click the send button (arrow icon)
5. Message will be sent and displayed

### Receive Messages
1. Messages from other users appear in your Chats list
2. Click on the conversation to view messages
3. Messages appear in gray bubbles on the left

## 📊 Database Schema

### Users Table
- `id`: Unique user identifier
- `phoneNumber`: User's phone number (unique)
- `displayName`: User's display name
- `profileImage`: User's profile picture URL
- `status`: User's status message
- `isOnline`: Online/offline status
- `lastSeen`: Last seen timestamp

### Conversations Table
- `id`: Unique conversation identifier
- `participant1Id`: First user ID
- `participant2Id`: Second user ID
- `lastMessage`: Last message content
- `lastMessageAt`: Last message timestamp

### Messages Table
- `id`: Unique message identifier
- `conversationId`: Conversation ID
- `senderId`: Sender user ID
- `receiverId`: Receiver user ID
- `content`: Message content
- `status`: Message status (sent, delivered, read)
- `createdAt`: Message timestamp

### Contacts Table
- `id`: Unique contact identifier
- `userId`: User ID
- `contactId`: Contact user ID
- `nickname`: Contact nickname (optional)

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Messages
- `GET /api/messages?conversationId=xxx` - Get messages for conversation
- `POST /api/messages` - Send new message

### Conversations
- `GET /api/conversations?userId=xxx` - Get user's conversations
- `POST /api/conversations` - Create or get conversation

### Contacts
- `GET /api/contacts?userId=xxx` - Get user's contacts
- `POST /api/contacts` - Add new contact

## 🚀 Deployment to Vercel

### Option 1: Using Vercel Dashboard
1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project"
4. Select your GitHub repository
5. Configure environment variables
6. Click "Deploy"

### Option 2: Using Vercel CLI
```bash
npm install -g vercel
vercel
```

### Environment Variables for Production
```
DATABASE_URL=your_production_database_url
NEXTAUTH_SECRET=your_production_secret
NEXTAUTH_URL=your_production_url
```

## 📱 Install as PWA

### On Mobile
1. Open the app in your browser
2. Tap the share button
3. Select "Add to Home Screen"
4. App will be installed like a native app

### On Desktop
1. Open the app in Chrome/Edge
2. Click the install icon in the address bar
3. Click "Install"
4. App will be installed

## 🔐 Security Notes

- Phone numbers are stored in plain text (consider hashing in production)
- Messages are not encrypted (add encryption for production)
- No rate limiting (add rate limiting for production)
- No input validation (add validation for production)

## 🚀 Future Enhancements

- [ ] End-to-end encryption
- [ ] Group messaging
- [ ] Voice/video calls
- [ ] Media sharing (images, videos, documents)
- [ ] Message search
- [ ] Typing indicators
- [ ] Read receipts
- [ ] User profiles
- [ ] Status updates
- [ ] Message reactions
- [ ] Message forwarding
- [ ] Message deletion
- [ ] User blocking

## 📝 License

MIT License - feel free to use this project for personal or commercial purposes.

## 👨‍💻 Author

Michael Swai - [GitHub](https://github.com/michaelswai)

## 📧 Contact

For questions or support, reach out to: michaelswai898@gmail.com

---

**Made with ❤️ by Michael Swai**
