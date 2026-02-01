# GitHub Setup Instructions

Since your GitHub account uses OAuth (Google login), follow these steps to push your code:

## Step 1: Create GitHub Repository

1. Go to https://github.com/new
2. Create a new repository with these settings:
   - **Repository name**: `whatsapp-pwa`
   - **Description**: "WhatsApp PWA - Modern messaging app with 1-on-1 messaging and contact search"
   - **Visibility**: Public (so people can see it)
   - **Initialize repository**: Leave unchecked (we already have code)
3. Click "Create repository"

## Step 2: Copy Repository URL

After creating the repository, you'll see a page with:
```
https://github.com/michaelswai/whatsapp-pwa.git
```

Copy this URL (it will be different based on your username).

## Step 3: Push Code to GitHub

Run these commands in your terminal:

```bash
cd /home/code/whatsapp-pwa

# Configure git (if not already done)
git config user.email "michaelswai686@gmail.com"
git config user.name "Michael Swai"

# Add remote (replace URL with your repository URL from Step 2)
git remote add origin https://github.com/michaelswai/whatsapp-pwa.git

# Set main branch
git branch -M main

# Push code to GitHub
git push -u origin main
```

**Note**: When prompted for authentication, use:
- **Username**: Your GitHub username (michaelswai)
- **Password**: Use a Personal Access Token (see below)

## Step 4: Create Personal Access Token (if needed)

If you get authentication errors:

1. Go to https://github.com/settings/tokens
2. Click "Generate new token" → "Generate new token (classic)"
3. Give it a name: "WhatsApp PWA Deployment"
4. Select scopes:
   - ✅ `repo` (full control of private repositories)
   - ✅ `workflow` (update GitHub Action workflows)
5. Click "Generate token"
6. **Copy the token** (you won't see it again!)
7. Use this token as your password when pushing

## Step 5: Verify Push

After pushing, verify on GitHub:
1. Go to https://github.com/michaelswai/whatsapp-pwa
2. You should see all your code files
3. Check the commit history

## Troubleshooting

**Error: "fatal: unable to access"**
- Make sure you're using a Personal Access Token (not your password)
- Token must have `repo` scope

**Error: "remote origin already exists"**
- Run: `git remote remove origin`
- Then add the remote again

**Error: "Permission denied"**
- Check your GitHub username and token
- Make sure token hasn't expired

## Next: Deploy to Vercel

Once code is on GitHub, deploy to Vercel:

1. Go to https://vercel.com
2. Click "New Project"
3. Select your `whatsapp-pwa` repository
4. Configure environment variables (see DEPLOYMENT.md)
5. Click "Deploy"

---

**Questions?** Check DEPLOYMENT.md for complete deployment guide.
