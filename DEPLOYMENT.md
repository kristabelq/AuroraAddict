# Deployment Guide

This guide will walk you through deploying Aurora Addict to Vercel.

## Prerequisites

1. A Vercel account (sign up at https://vercel.com)
2. A PostgreSQL database (recommended: Supabase, Neon, or Railway)
3. OAuth credentials for social login providers
4. A Mapbox account and access token

## Step 1: Set Up OAuth Providers

### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Go to Credentials → Create Credentials → OAuth 2.0 Client ID
5. Set authorized redirect URI: `https://your-domain.vercel.app/api/auth/callback/google`
6. Save Client ID and Client Secret

### Meta (Facebook) OAuth
1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Create a new app
3. Add Facebook Login product
4. Set Valid OAuth Redirect URI: `https://your-domain.vercel.app/api/auth/callback/facebook`
5. Save App ID and App Secret

### Apple OAuth
1. Go to [Apple Developer](https://developer.apple.com/)
2. Create a new Service ID
3. Configure Sign in with Apple
4. Set Return URLs: `https://your-domain.vercel.app/api/auth/callback/apple`
5. Generate a private key and save all credentials

## Step 2: Set Up Database

### Option A: Supabase (Recommended)
1. Create account at [Supabase](https://supabase.com)
2. Create a new project
3. Go to Settings → Database
4. Copy the connection string (use "Connection pooling" for production)

### Option B: Neon
1. Create account at [Neon](https://neon.tech)
2. Create a new project
3. Copy the connection string

### Option C: Railway
1. Create account at [Railway](https://railway.app)
2. Create a new PostgreSQL database
3. Copy the connection string

## Step 3: Get Mapbox Token

1. Sign up at [Mapbox](https://www.mapbox.com/)
2. Go to Account → Access tokens
3. Create a new token with public scopes
4. Copy the token

## Step 4: Deploy to Vercel

### Option A: Deploy via GitHub

1. Push your code to GitHub:
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/aurora-addict.git
git push -u origin main
```

2. Go to [Vercel Dashboard](https://vercel.com/dashboard)
3. Click "New Project"
4. Import your GitHub repository
5. Configure environment variables (see below)
6. Click "Deploy"

### Option B: Deploy via Vercel CLI

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy:
```bash
vercel
```

4. Add environment variables via Vercel dashboard

## Step 5: Configure Environment Variables in Vercel

Go to your project in Vercel Dashboard → Settings → Environment Variables

Add the following variables:

```
# Database
DATABASE_URL=your-postgresql-connection-string

# NextAuth
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=generate-a-random-secret-here

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Meta OAuth
FACEBOOK_CLIENT_ID=your-facebook-app-id
FACEBOOK_CLIENT_SECRET=your-facebook-app-secret

# Apple OAuth
APPLE_ID=your-apple-service-id
APPLE_TEAM_ID=your-apple-team-id
APPLE_PRIVATE_KEY=your-apple-private-key
APPLE_KEY_ID=your-apple-key-id

# Mapbox
NEXT_PUBLIC_MAPBOX_TOKEN=your-mapbox-token
```

To generate NEXTAUTH_SECRET:
```bash
openssl rand -base64 32
```

## Step 6: Initialize Database

After deployment, you need to initialize the database schema:

1. Install Vercel CLI if you haven't:
```bash
npm i -g vercel
```

2. Pull environment variables:
```bash
vercel env pull .env.local
```

3. Generate Prisma client and push schema:
```bash
npx prisma generate
npx prisma db push
```

## Step 7: Update OAuth Redirect URIs

Update all OAuth provider redirect URIs with your actual Vercel URL:
- Google: `https://your-app.vercel.app/api/auth/callback/google`
- Meta: `https://your-app.vercel.app/api/auth/callback/facebook`
- Apple: `https://your-app.vercel.app/api/auth/callback/apple`

## Step 8: Test Your Deployment

1. Visit your deployed app
2. Test social login with all providers
3. Complete the onboarding flow
4. Test all main features

## Troubleshooting

### Build Errors

If you encounter build errors:
1. Check Vercel build logs
2. Ensure all environment variables are set
3. Verify DATABASE_URL is correct
4. Try running `npm run build` locally

### OAuth Issues

If OAuth login fails:
1. Verify redirect URIs match exactly
2. Check that credentials are correct in Vercel
3. Ensure OAuth apps are in production mode (not testing)

### Database Connection Issues

If database connection fails:
1. Verify DATABASE_URL format
2. Check database is accessible publicly
3. Use connection pooling URL for production
4. Ensure IP allowlist includes Vercel IPs (if applicable)

### Map Not Loading

If Mapbox map doesn't load:
1. Verify NEXT_PUBLIC_MAPBOX_TOKEN is set
2. Check token has public scopes
3. Verify token is valid and not expired

## Maintenance

### Updating the App

1. Push changes to GitHub
2. Vercel will automatically redeploy
3. For database schema changes:
   ```bash
   npx prisma db push
   ```

### Monitoring

Monitor your app via:
- Vercel Analytics Dashboard
- Vercel Logs
- Database dashboard (Supabase/Neon/Railway)

## Custom Domain (Optional)

1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions
4. Update NEXTAUTH_URL and OAuth redirect URIs

## Security Checklist

- [ ] All environment variables are set in Vercel
- [ ] NEXTAUTH_SECRET is a strong random string
- [ ] OAuth apps are in production mode
- [ ] Database has strong password
- [ ] SSL is enabled (automatic with Vercel)
- [ ] Rate limiting is configured (optional but recommended)

## Support

For issues:
1. Check Vercel deployment logs
2. Review database logs
3. Test locally with same environment variables
4. Check OAuth provider dashboards for errors

Congratulations! Your Aurora Addict app should now be live!
