# Aurora Intel

A professional aurora hunting platform connecting tour operators, accommodations, and aurora chasers with real-time intelligence, business insights, and a comprehensive marketplace for aurora tourism.

## Features

### Authentication
- Social login support (Google, Apple, Meta)
- 3-step onboarding flow for new users
- Automatic login for returning users

### Sightings Feed (Default Homepage)
The homepage displays a three-tab interface for browsing aurora sightings:
- **Live Feed Tab** (default): Instagram-style social feed with posts, likes, and comments
- **Gallery Tab**: Grid layout of all sighting images with advanced search and filtering
- **Live Cameras Tab**: Real-time aurora camera feeds from around the world (auto-refreshing every 60s)

Features:
- Instagram/Facebook-style post interactions
- Like and comment functionality
- Edit/delete options for own posts
- Real-time engagement metrics
- Location and time metadata
- Multi-image posts (swipeable gallery)

### Intelligence Hub
Accessible via navigation menu, providing real-time aurora forecasting:
- Interactive map powered by Leaflet with multiple data layers
- Real-time aurora probability overlay (NOAA OVATION model)
- Cloud cover, light pollution, and day/night zone layers
- Sighting markers (color-coded by recency: green 0-4h, orange 4-8h, red 8-12h)
- Planned hunt pins with join functionality
- Current KP index, solar wind, and space weather data
- CME alerts, solar flares, and coronal hole monitoring
- Detailed aurora forecast with synchronized hemisphere animations
- Moon phase tracking

### Search Page
- Instagram-style grid of aurora sightings
- Advanced search and filtering by location, date, and month
- Location-based search with 400km radius
- Distance sorting (Haversine formula)
- Filter button with active state indicator

### Planner Page
- Create public or private aurora hunting events
- Search existing hunts by date and location
- Hunt details include:
  - Name, description, dates, location
  - Public/private visibility
  - Free or paid events (Stripe integration)
  - Capacity limits
  - Location hiding option
  - Cancellation policies

### Profile Page
- Instagram-style profile layout
- Sightings and hunts statistics
- Bio editing
- Grid view of user's sightings

## Tech Stack

- **Framework**: Next.js 15.5.5 with App Router
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with Google OAuth
- **Maps**: React Leaflet
- **Image Processing**: Sharp + exifr for EXIF extraction
- **Date Handling**: date-fns v3.x, date-fns-tz v3.x
- **Payments**: Stripe (API version 2025-09-30.clover)
- **File Upload**: react-dropzone
- **Notifications**: react-hot-toast
- **External APIs**: NOAA (KP Index, Aurora, Solar Wind, X-rays), NASA DONKI (CME, HSS), OpenStreetMap Nominatim
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (Supabase recommended)
- Google OAuth credentials
- NASA API key (for DONKI CME/HSS data)
- Stripe account (for paid hunts, optional)

### Environment Variables

Create a `.env.local` file based on `.env.local.example`:

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/aurora_addict"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# OAuth Providers
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# External APIs
NASA_API_KEY="your-nasa-api-key"

# Stripe (optional, for paid hunts)
STRIPE_SECRET_KEY="your-stripe-secret-key"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="your-stripe-publishable-key"
```

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up the database:
```bash
npx prisma generate
npx prisma db push
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000)

## Deployment to Vercel

1. Push your code to GitHub

2. Import the project in Vercel

3. Add environment variables in Vercel dashboard

4. Deploy!

The app will be automatically deployed on every push to the main branch.

## Database Schema

The application uses the following main models:
- **User**: User accounts and profiles
- **Sighting**: Aurora sighting posts
- **Hunt**: Planned aurora hunting events
- **HuntParticipant**: Event participants
- **Comment**: Comments on sightings
- **Like**: Likes on sightings

## API Routes

- `/api/auth/[...nextauth]` - Authentication endpoints
- `/api/user/profile` - User profile management
- `/api/sightings/*` - Sighting CRUD operations
- `/api/hunts/*` - Hunt CRUD operations
- `/api/stats/current` - Current aurora stats (Kp index, cloud cover)

## Recent Updates (v1.1)

- ✅ Sightings Feed as default landing page
- ✅ Next.js 15.5.5 compatibility (dynamic route params as Promises)
- ✅ TypeScript strict mode compliance
- ✅ Real-time aurora forecast integration (NOAA OVATION model)
- ✅ Image upload with EXIF GPS extraction
- ✅ Advanced search filters (location, date, distance)
- ✅ CME alerts and solar flare monitoring (NASA DONKI)
- ✅ Synchronized aurora hemisphere animations
- ✅ Live camera feeds from global aurora locations
- ✅ Stripe payment integration for paid hunts

## Future Enhancements

- Push notifications for high KP alerts
- Weather integration (advanced cloud cover forecasting)
- Time-lapse creation tools
- Social features (follow users, direct messages)
- Mobile app (React Native)
- Aurora photography tips and camera settings recommendations

## Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

## License

MIT
