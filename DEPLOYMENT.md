# WhatsApp PWA - Deployment Guide

## Quick Start: Deploy to Vercel in 3 Steps

### Step 1: Push Code to GitHub

Since the GitHub account uses OAuth (Google login), use these commands to push your code:

```bash
# Navigate to project directory
cd /home/code/whatsapp-pwa

# Configure git (if not already done)
git config user.email "michaelswai686@gmail.com"
git config user.name "Michael Swai"

# Create GitHub repository manually:
# 1. Go to https://github.com/new
# 2. Create repository named: whatsapp-pwa
# 3. Copy the repository URL

# Add remote and push (replace URL with your repository URL)
git remote add origin https://github.com/michaelswai/whatsapp-pwa.git
git branch -M main
git push -u origin main
```

**Alternative: Use GitHub CLI**
```bash
# Install GitHub CLI if not already installed
# Then authenticate and create repository
gh repo create whatsapp-pwa --public --source=. --remote=origin --push
```

### Step 2: Deploy to Vercel

**Option A: Using Vercel Dashboard (Recommended)**

1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click "New Project"
4. Select your `whatsapp-pwa` repository
5. Configure environment variables:
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `NEXTAUTH_SECRET`: Generate with: `openssl rand -base64 32`
   - `NEXTAUTH_URL`: Your Vercel deployment URL (e.g., `https://whatsapp-pwa.vercel.app`)
6. Click "Deploy"

**Option B: Using Vercel CLI**

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy from project directory
cd /home/code/whatsapp-pwa
vercel

# Follow prompts to:
# - Link to GitHub account
# - Select project settings
# - Configure environment variables
# - Deploy
```

### Step 3: Configure Database for Production

**Important**: The local PostgreSQL database won't work in production. You need a cloud database.

**Option 1: Vercel Postgres (Recommended)**
```bash
# Create Vercel Postgres database
vercel env add DATABASE_URL

# Paste your Vercel Postgres connection string
# Get it from: https://vercel.com/dashboard/stores/postgres
```

**Option 2: Supabase (Free PostgreSQL)**
1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Copy connection string
4. Add to Vercel environment variables

**Option 3: Railway (Simple PostgreSQL Hosting)**
1. Go to [railway.app](https://railway.app)
2. Create new PostgreSQL database
3. Copy connection string
4. Add to Vercel environment variables

## Environment Variables

Create `.env.local` for local development:

```bash
# Database (local development)
DATABASE_URL="postgresql://user:password@localhost:5432/whatsapp_pwa"

# NextAuth Configuration
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# App Configuration
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="WhatsApp PWA"
```

For production (set in Vercel dashboard):

```
DATABASE_URL=postgresql://user:password@host:5432/whatsapp_pwa
NEXTAUTH_SECRET=your-production-secret-key
NEXTAUTH_URL=https://your-app.vercel.app
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NEXT_PUBLIC_APP_NAME=WhatsApp PWA
```

## Database Migration for Production

After deploying to Vercel:

```bash
# Run migrations on production database
npx prisma migrate deploy

# Or if using Vercel Postgres:
vercel env pull .env.production.local
npx prisma migrate deploy --skip-generate
```

## PWA Installation

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

## Monitoring & Logs

**View deployment logs**:
```bash
vercel logs
```

**View real-time logs**:
```bash
vercel logs --follow
```

**Check deployment status**:
```bash
vercel status
```

## Custom Domain

1. Go to Vercel dashboard
2. Select your project
3. Go to "Settings" → "Domains"
4. Add your custom domain
5. Follow DNS configuration instructions

## Troubleshooting

### Database Connection Error

**Problem**: `Error: connect ECONNREFUSED`

**Solution**:
- Verify `DATABASE_URL` is correct
- Check database is running (if local)
- For production, ensure cloud database is accessible
- Check firewall/security group settings

### Build Fails

**Problem**: `Build failed`

**Solution**:
- Check build logs in Vercel dashboard
- Verify all environment variables are set
- Run `npm run build` locally to test
- Check for TypeScript errors: `npx tsc --noEmit`

### App Won't Load

**Problem**: Blank page or 500 error

**Solution**:
- Check browser console for errors (F12)
- Check Vercel logs: `vercel logs`
- Verify environment variables are set
- Check database connection

### PWA Won't Install

**Problem**: Install button doesn't appear

**Solution**:
- Ensure app is served over HTTPS (Vercel does this automatically)
- Check `public/manifest.json` is valid
- Check service worker is registered
- Try in Chrome/Edge (best PWA support)

## Performance Optimization

### Image Optimization

The app uses Next.js `<Image>` component which automatically optimizes images:
- Lazy loading
- Responsive sizing
- Format optimization (WebP, AVIF)
- Automatic srcset generation

### Database Optimization

Add indexes for frequently queried fields:

```prisma
model User {
  id        String   @id @default(cuid())
  phoneNumber String  @unique
  // Add index for faster lookups
  @@index([phoneNumber])
}

model Message {
  id            String   @id @default(cuid())
  conversationId String
  // Add index for conversation queries
  @@index([conversationId])
}
```

Then run migration:
```bash
npx prisma migrate dev --name add_indexes
```

### Caching

Enable caching in `vercel.json`:

```json
{
  "crons": [{
    "path": "/api/cron/cleanup",
    "schedule": "0 0 * * *"
  }]
}
```

## Continuous Deployment

Vercel automatically deploys when you push to GitHub:

1. Push code to GitHub: `git push origin main`
2. Vercel automatically builds and deploys
3. Check deployment status in Vercel dashboard
4. View live app at your Vercel URL

## Rollback

If deployment has issues:

```bash
# View deployment history
vercel list

# Rollback to previous deployment
vercel rollback
```

## Security Checklist

Before going to production:

- [ ] Set strong `NEXTAUTH_SECRET`
- [ ] Use HTTPS (Vercel does this automatically)
- [ ] Enable database encryption
- [ ] Set up database backups
- [ ] Configure CORS properly
- [ ] Add rate limiting to API routes
- [ ] Validate all user inputs
- [ ] Use environment variables for secrets
- [ ] Enable Vercel security features
- [ ] Set up monitoring and alerts

## Support

For issues or questions:
- Check [Vercel documentation](https://vercel.com/docs)
- Check [Next.js documentation](https://nextjs.org/docs)
- Check [Prisma documentation](https://www.prisma.io/docs)
- Open an issue on GitHub

---

**Happy deploying! 🚀**
