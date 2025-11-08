# Quick Start Guide

Get Aurora Addict running locally in minutes!

## 1. Install Dependencies

Due to npm cache permissions, you may need to fix permissions first:

```bash
# Fix npm permissions (macOS/Linux)
sudo chown -R $(whoami) ~/.npm

# Install dependencies
npm install
```

## 2. Set Up Environment Variables

Copy the example environment file:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your credentials. For development, you can use these minimal settings:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/aurora_addict"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="development-secret-change-in-production"
NEXT_PUBLIC_MAPBOX_TOKEN="your-mapbox-token"

# Add at least one OAuth provider
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

## 3. Set Up Local Database

### Option A: Use Docker (Easiest)

```bash
docker run --name aurora-postgres -e POSTGRES_PASSWORD=password -e POSTGRES_DB=aurora_addict -p 5432:5432 -d postgres:15
```

### Option B: Install PostgreSQL Locally

Install PostgreSQL, then:

```bash
createdb aurora_addict
```

## 4. Initialize Database Schema

```bash
npx prisma generate
npx prisma db push
```

## 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Next Steps

1. Sign in with OAuth provider
2. Complete onboarding (3 steps)
3. Explore the app features:
   - **Browse the Sightings Feed** (default homepage with 3 tabs)
     - Live Feed: Instagram-style social feed
     - Gallery: Grid view of all sighting images
     - Live Cameras: Real-time aurora camera feeds
   - **Visit Intelligence Hub** (via navigation menu)
     - View interactive map with aurora probability overlay
     - Check KP index, solar wind, and space weather data
     - Monitor CME alerts and solar flares
   - Create a hunt (free or paid)
   - Share a sighting with photos
   - Update your profile

## Common Issues

### "Module not found" errors
```bash
rm -rf node_modules package-lock.json
npm install
```

### Database connection errors
- Ensure PostgreSQL is running
- Check DATABASE_URL is correct
- Verify database exists

### OAuth errors
- Check OAuth credentials are correct
- Verify redirect URIs: `http://localhost:3000/api/auth/callback/{provider}`
- For Google: Enable Google+ API in Cloud Console

### Map not loading
- Verify NEXT_PUBLIC_MAPBOX_TOKEN is set
- Check token is valid at mapbox.com
- Token must have public scopes

## Development Tips

### Reset Database
```bash
npx prisma db push --force-reset
```

### View Database
```bash
npx prisma studio
```

### Generate Prisma Client (after schema changes)
```bash
npx prisma generate
```

### Check TypeScript errors
```bash
npm run build
```

## Ready to Deploy?

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions to Vercel.
