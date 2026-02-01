# WhatsApp PWA - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Push to GitHub (2 minutes)

1. **Create GitHub Repository**:
   - Go to https://github.com/new
   - Repository name: `whatsapp-pwa`
   - Visibility: Public
   - Click "Create repository"

2. **Push Your Code**:
   ```bash
   cd /home/code/whatsapp-pwa
   git config user.email "michaelswai686@gmail.com"
   git config user.name "Michael Swai"
   git remote add origin https://github.com/michaelswai/whatsapp-pwa.git
   git branch -M main
   git push -u origin main
   ```
   
   **Note**: When prompted for password, use a Personal Access Token:
   - Go to https://github.com/settings/tokens
   - Click "Generate new token (classic)"
   - Select `repo` scope
   - Copy token and use as password

### Step 2: Deploy to Vercel (2 minutes)

1. **Go to Vercel**:
   - Visit https://vercel.com
   - Click "Log In" → "Continue with GitHub"
   - Authorize Vercel to access your GitHub

2. **Create New Project**:
   - Click "New Project"
   - Select `whatsapp-pwa` repository
   - Click "Import"

3. **Configure Environment Variables**:
   - Add `DATABASE_URL`: Your PostgreSQL connection string
   - Add `NEXTAUTH_SECRET`: Generate with `openssl rand -base64 32`
   - Add `NEXTAUTH_URL`: Your Vercel URL (e.g., `https://whatsapp-pwa.vercel.app`)
   - Click "Deploy"

### Step 3: Set Up Database (1 minute)

**Option A: Vercel Postgres** (Recommended - easiest)
- Go to https://vercel.com/dashboard/stores/postgres
- Create new database
- Copy connection string
- Add to Vercel environment variables as `DATABASE_URL`

**Option B: Supabase** (Free PostgreSQL)
- Go to https://supabase.com
- Create new project
- Copy connection string
- Add to Vercel environment variables

**Option C: Railway** (Simple setup)
- Go to https://railway.app
- Create PostgreSQL database
- Copy connection string
- Add to Vercel environment variables

### Step 4: Run Database Migrations

After setting up database, run migrations:

```bash
# Pull environment variables
vercel env pull .env.production.local

# Run migrations
npx prisma migrate deploy
```

### Step 5: Share Your App! 🎉

Your app is now live at: `https://whatsapp-pwa.vercel.app`

**Share the link with friends!** They can:
1. Open the link in their browser
2. Register with their phone number
3. Search for other users by phone number
4. Start messaging!

---

## 📱 Install as PWA

### On Mobile (iOS/Android)
1. Open the app in your browser
2. Tap the share button (bottom menu)
3. Select "Add to Home Screen"
4. App will be installed like a native app

### On Desktop (Chrome/Edge)
1. Open the app in your browser
2. Click the install icon in the address bar
3. Click "Install"
4. App will be installed

---

## 🧪 Test the App

### Create Test Users

1. **User 1**:
   - Phone: +255712345678
   - Name: Michael Swai
   - Register and login

2. **User 2**:
   - Phone: +255987654321
   - Name: Test User
   - Register and login

### Test Messaging Flow

1. **User 1 adds User 2**:
   - Go to "Contacts" tab
   - Enter: +255987654321
   - Click "+" button
   - User 2 appears in contacts

2. **User 1 sends message**:
   - Click on User 2 in contacts
   - Type message: "Hello!"
   - Click send button
   - Message appears in blue bubble

3. **User 2 receives message**:
   - Logout User 1
   - Login as User 2
   - Message appears in "Chats" tab
   - Click conversation to view message

4. **User 2 replies**:
   - Type reply: "Hi there!"
   - Click send button
   - Message appears in blue bubble

5. **User 1 receives reply**:
   - Logout User 2
   - Login as User 1
   - Reply appears in conversation

---

## 🔗 Important Links

- **Live App**: https://whatsapp-pwa.vercel.app
- **GitHub Repository**: https://github.com/michaelswai/whatsapp-pwa
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Database Setup**: See DEPLOYMENT.md for detailed instructions

---

## 📚 Documentation

- **README.md**: Complete project overview and features
- **DEPLOYMENT.md**: Detailed deployment guide with troubleshooting
- **GITHUB_SETUP.md**: Step-by-step GitHub setup instructions

---

## ❓ Troubleshooting

### App won't load
- Check Vercel deployment status
- Verify environment variables are set
- Check database connection

### Can't send messages
- Verify database is connected
- Check browser console for errors (F12)
- Ensure both users are registered

### PWA won't install
- Ensure app is served over HTTPS (Vercel does this automatically)
- Try in Chrome or Edge (best PWA support)
- Check manifest.json is valid

### Database connection error
- Verify DATABASE_URL is correct
- Check database is running
- Ensure firewall allows connections

---

## 🎯 Next Steps

1. ✅ Push to GitHub
2. ✅ Deploy to Vercel
3. ✅ Set up database
4. ✅ Test messaging
5. 🎉 Share with friends!

---

**Questions?** Check the documentation files or visit:
- Vercel Docs: https://vercel.com/docs
- Next.js Docs: https://nextjs.org/docs
- Prisma Docs: https://www.prisma.io/docs

**Happy messaging! 🚀**
