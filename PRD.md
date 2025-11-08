# Aurora Addict - Product Requirements Document

## Product Overview

**Aurora Addict** is a social platform for aurora enthusiasts to track, plan, and share northern lights experiences. The app combines real-time aurora forecasting data with social networking features to help users plan aurora hunting trips and connect with the global aurora chasing community.

## Target Users

- Aurora photographers and enthusiasts
- Travelers planning trips to see the northern/southern lights
- Local guides and tour operators
- Nature and astronomy lovers

## Core Features

### 1. Authentication & Onboarding

#### User Authentication
- Google OAuth integration via NextAuth.js
- Secure session management
- Protected routes requiring authentication

#### Onboarding Flow
- Profile setup (name, bio, profile photo)
- Location preferences
- Experience level selection
- Welcome tutorial

### 2. Sightings Feed (Default Landing Page) 🆕

#### Homepage
- Default landing page (`/`) displays the Sightings Feed
- Three-tab interface: Gallery, Live Feed, and Live Cameras
- **Live Feed Tab** (default):
  - Instagram-style social feed
  - User posts with photos, captions, and location
  - Like and comment functionality
  - Edit/delete options for own posts
  - Real-time engagement metrics
- **Gallery Tab**:
  - Grid layout of all sighting images
  - Advanced search and filtering
  - Modal view with full image details
- **Live Cameras Tab**:
  - Real-time aurora camera feeds from around the world
  - Auto-refreshing every 60 seconds
  - Cameras from Norway, Sweden, Finland, Alaska, Canada
  - Status indicators and location information

### 3. Intelligence Hub (Real-Time Aurora Forecasting & Space Weather)

#### Access
- Accessible via navigation menu
- Centralized hub for all aurora and space weather data

#### Three Intelligence Tabs

**Map Intel Tab**:
- Interactive Leaflet map with real-time data layers
- Current conditions bar (KP Index, Solar Wind Bz, Wind Speed, Density)
- Toggle controls for multiple overlay layers:
  - **Aurora Probability Layer**: NOAA OVATION model data showing aurora chances
    - Color-coded grid cells by probability
    - Red: 50%+, Orange: 30-49%, Green: 10-29%, Grey: 1-9%
  - **Cloud Cover Layer**: Real-time cloud coverage data
  - **Light Pollution Layer**: Pre-generated grid showing light pollution levels
  - **Day/Night Zones**: Twilight visualization (day/night/civil/nautical/astronomical)
    - Non-overlapping 5×5 degree tiles
    - Color-coded by twilight stage
  - **Hunt Markers**: Upcoming planned hunts with participant count
  - **Sighting Markers**: Recent aurora sightings from community
- Layer ordering (bottom to top): Cloud Cover → Light Pollution → Day/Night → Aurora Probability
- Performance optimizations:
  - Lazy initialization of light pollution grid
  - Single-cell rendering for aurora layer (reduced from 16 subdivisions)
  - Cached twilight zone calculations

**Cosmic Intel Tab**:
- **Moon Phase Card**:
  - Current moon phase with emoji visualization
  - Illumination percentage
  - Clickable → navigates to detailed moon phase page
- **KP Index Card**:
  - Current KP with color-coded display
  - Activity level (Low/Moderate/High)
  - Clickable → navigates to detailed forecast page
- **Solar Wind Card**:
  - Bz component with color-coded status
  - Wind speed and density measurements
  - Status indicators (Excellent/Good/Fair/Poor)
  - Clickable → navigates to solar wind detail page
- **CME Alerts Card** 🆕:
  - Real-time Coronal Mass Ejection monitoring
  - CME type (None Active/Partial Earth-directed/Full Halo)
  - Speed and estimated arrival time
  - Color-coded by impact severity
  - Action triggers: Speed >700 km/s = Plan hunt
  - Data from NASA DONKI API
- **Solar Flares Card** 🆕:
  - Current solar flare classification (X/M/C/B/A class)
  - Intensity measurement
  - Color-coded by severity (X=red, M=orange, C=yellow)
  - Aurora probability estimate
  - Clickable → navigates to detailed solar flares page
  - Data from NOAA GOES satellites
- **Coronal Holes Card** 🆕:
  - High Speed Stream (HSS) monitoring
  - Coronal hole size estimation
  - Arrival time forecast
  - Predictable ~27-day cycle tracking
  - Typically produces Kp 4-6 activity
  - Data from NASA DONKI API
- **Info Card**: Educational explanations for all metrics

**Expert Intel Tab**:
- **HD Light Pollution Map** (Featured):
  - Large prominent card with gradient background
  - External link to lightpollutionmap.app
  - Opens in new tab for full interactive experience
- **Placeholder Cards** (Coming Soon):
  - Solar Activity Analysis
  - Magnetometer Data
  - Historical Analysis
  - Aurora Oval Prediction

#### Detailed Forecast Page
- **Current KP Index**: Large display with activity status
- **30-Minute Aurora Forecast**:
  - Synchronized animations for Northern and Southern hemispheres
  - Time-tagged image frames from NOAA OVATION model
  - Play/pause controls
  - Timeline slider for manual navigation
  - Local time and UTC time display with timezone conversion
  - Frame counter showing current position
- **KP Index Charts**:
  - Upcoming hours forecast (next 6 hours, bar chart)
  - Long-term forecast (next 6 days, bar chart)
  - Y-axis showing KP values (0-8)
  - Color-coded bars matching activity levels
- **Understanding KP Index**: Educational info box explaining KP levels

#### Solar Flares Detail Page 🆕
- **Current Solar Activity Section**:
  - Large display of current flare class and intensity
  - Time since detection
  - X-ray flux measurement
  - Aurora probability calculation based on flare strength
  - Color-coded by severity
- **Solar Flare Classification Guide**:
  - Visual guide for all classes (X, M, C, B, A)
  - Power scale explanation (each class 10× stronger than previous)
  - Impact descriptions for each class
- **Recent Significant Flares History**:
  - C-class and above flares from last 7 days
  - Up to 20 most recent events
  - Timestamp, class, intensity, and flux for each
- **Educational Info Box**:
  - Connection between solar flares and auroras
  - CME launch probability
  - Data source information
- **Auto-refresh**: Updates every 5 minutes
- Data from NOAA GOES X-ray monitoring satellites

### 4. Interactive Aurora Map

#### Real-Time Aurora Probability Overlay
- NOAA OVATION model data integration
- Color-coded grid overlay (1-degree squares):
  - Red: 50%+ chance
  - Orange: 30-49% chance
  - Green: 10-29% chance
  - Dark grey: 1-9% chance
- Filters out equatorial regions (below ±50° latitude)
- No grid lines for clean visualization
- Toggle between "Probabilities" and "All" views

#### Sighting Markers
- Recent sightings from last 12 hours
- Time-based color coding:
  - Green: Within 4 hours
  - Orange: 4-8 hours ago
  - Red: 8-12 hours ago
- Clustering for dense areas
- Popup with image, location, user, and timestamp

#### Hunt Markers
- Upcoming planned hunts
- Blue location pin icons
- Participant count display
- Quick join functionality
- Navigation to hunt details

#### Map Controls
- Location centering button
- Zoom controls
- Overlay mode selector

### 5. Sighting Management

#### Share Sighting Feature

**Sighting Type Selection** (moved to top of form):
- **Real-time Sighting**:
  - Mobile-only camera activation
  - Desktop users see warning message
  - Direct camera capture (up to 5 images)
  - GPS extraction from photos
- **Past Sighting**:
  - Upload up to 10 images
  - Date and time picker (max: today)
  - Instagram-style multi-photo post
  - Swipeable gallery view

**Form Fields**:
- Photos with drag-and-drop upload
- GPS indicator for photos with location data
- Caption (optional, 500 character limit)
- Location with autocomplete (OpenStreetMap Nominatim)
- Current location button
- Coordinate display

**Image Processing**:
- Automatic GPS extraction from EXIF data
- Image compression and resizing (max 1920x1080)
- JPEG optimization (85% quality)
- Preview with remove option

#### Sighting Feed
- Reverse chronological display
- Grid layout for photos
- Like and comment functionality
- User profiles
- Location information
- Timestamp display

### 6. Advanced Search & Filtering

#### Text Search
- Search by location name
- Real-time filtering

#### Location-Based Search
- Location autocomplete using OpenStreetMap
- Distance calculation using Haversine formula
- Results sorted by distance (nearest first)
- 400km radius limit
- Clear visual feedback showing active location filter

#### Time Filters
- Month selector (all 12 months)
- Year selector (dynamically populated from available sightings)
- Combine multiple filters

#### Filter UI
- Expandable filter panel
- Filter button with active state indicator (turns green when filters applied)
- Clear all filters option
- Dropdown suggestions for locations
- Visual confirmation of active filters

### 7. Hunt Planning & Management

#### Create Hunt
- Name and description
- Date range (start/end)
- Location with map integration
- Privacy settings (public/private)
- Location visibility toggle
- Capacity limit (optional)
- Paid event option with price

#### Hunt Management
- Edit hunt details
- View participant list
- Cancel/delete hunt
- Share hunt link
- Export participant list

#### Join Hunt
- One-click join from map or hunt page
- Confirmation toast notification
- Real-time participant count updates
- Status tracking (pending/confirmed/cancelled)

### 8. Aurora Accommodations 🆕

#### Purpose
Help users find and book ideal accommodations for aurora viewing, featuring glass igloos, aurora cabins, and specialty lodges with aurora viewing facilities worldwide.

#### Accommodation Database
- **80+ Properties** across aurora viewing regions:
  - Finland (35+ locations): Rovaniemi, Saariselkä, Levi, Inari, Ruka, Kemi
  - Norway (12 locations): Tromsø, Alta, Lyngen, Senja, Lofoten, Kirkenes
  - Sweden (6 locations): Jokkmokk, Jukkasjärvi, Kiruna, Harads
  - Iceland (10 locations): Reykjavík, Golden Circle, Hella, South Iceland
  - Alaska (5 locations): Fairbanks, Brooks Range
  - Canada (1 location): Blachford Lake Lodge, Northwest Territories
  - Greenland (1 location): Hotel Arctic, Ilulissat

#### Real-Time Aurora Metrics
Each accommodation displays comprehensive aurora viewing potential:
- **Minimum Kp Required**: Calculated from geomagnetic latitude
  - Formula: `Kp = (67 - geomagneticLat) / 2.5`
  - Lower = better (less aurora activity needed to see auroras)
- **Estimated Sighting Percentage**: Theoretical calculation based on geomagnetic latitude
  - 65°+ geomagnetic: 70-90% (Excellent)
  - 62-65°: 40-60% (Very Good)
  - 58-62°: 20-35% (Good)
  - 50-58°: 5-15% (Fair)
  - <50°: <5% (Limited)
- **Actual Success Rate** 🆕: Based on real user sighting posts
  - Searches 100km radius around accommodation
  - Counts unique days with sightings in past 365 days
  - Formula: `(days with sightings / 365) × 100`
  - Shows "No data yet" if no nearby sightings posted
- **Aurora Quality Rating**: Excellent / Very Good / Good / Fair / Limited
- **Days with Sightings**: Number of unique days with posts in past year
- **Geomagnetic Latitude**: Scientific coordinate for aurora prediction

#### Room Types & Amenities
Each property features multiple room types with detailed information:
- Room name and description
- Capacity (guests per room)
- Price from (base rate in local currency)
- Amenities array (glass dome, aurora alarm, heated floors, etc.)
- Multiple room images with cover image
- Display order for featured rooms

#### Featured Amenities
- Glass Igloos / Glass Domes
- 360° Aurora View Rooms
- Aurora Alarm Systems
- Aurora Cabins
- Private Saunas
- Hot Tubs / Jacuzzis
- Heated Glass Roofs
- Reindeer Experiences
- Northern Lights Photography Workshops

#### Search & Filters
- **Country Filter**: All countries, or select specific country
- **Max Kp Filter**: Filter by maximum Kp required (0-9)
  - Lower Kp = better (see auroras even during weak activity)
- **Feature Filters**:
  - Glass Igloo
  - Private Sauna
  - Hot Tub
- Active filter indicators (green highlight when filters applied)
- Reset filters option

#### Accommodation Display
- **Card Layout**: Grid of accommodation cards
- **Cover Image**: Featured room type image
- **Location**: City, country with flag
- **Metrics Display**:
  - Estimated Sighting % (purple box, theory-based)
  - Actual Success Rate (green box, real data from users)
  - Minimum Kp Required
  - Aurora Quality badge
  - Geomagnetic coordinates
- **Room Type Carousel**: Swipeable gallery of available rooms
- **Quick Stats**:
  - Total room types
  - Has glass igloo (yes/no)
  - Has aurora cabin (yes/no)
  - Has private sauna (yes/no)
  - Has hot tub (yes/no)
- **Website Link**: External link to accommodation website
- **Description**: Business description with highlights

#### Access
- Navigation link from Intelligence page (emerald/teal card with 🏔️ icon)
- Direct URL: `/accommodations`
- Prominent placement in Aurora Intel tab

#### Technical Implementation
- Geomagnetic coordinate conversion using IGRF model
- Haversine distance calculation for nearby sightings
- Real-time sighting data aggregation
- Responsive grid layout
- Lazy image loading
- External link handling

### 9. Social Feed

#### Feed Display
- Mixed content (sightings and hunts)
- Engagement metrics (likes, comments)
- User avatars and names
- Time-based sorting

#### Interactions
- Like sightings
- Comment on posts
- Share to external platforms
- Follow users

### 10. User Profiles

#### Profile Page
- Profile photo and bio
- Statistics (sightings, hunts, followers)
- Activity timeline
- Settings access

#### Profile Settings
- Edit personal information
- Privacy controls
- Notification preferences
- Account management

## Technical Architecture

### Frontend Stack
- **Framework**: Next.js 15.5.5 (App Router) 🔄
  - Fully compatible with Next.js 15 breaking changes
  - Dynamic route params handled as Promises with React.use()
  - All dynamic routes updated for Next.js 15 compatibility
- **Language**: TypeScript (strict mode)
  - All type errors resolved
  - Proper null/undefined handling
  - Type-safe API responses
- **Styling**: Tailwind CSS
- **Map Library**: React Leaflet
- **Authentication**: NextAuth.js
- **Form Handling**: React Hook Form
- **File Upload**: react-dropzone
- **Image Processing**: Sharp
- **EXIF Extraction**: exifr
- **Date Handling**: date-fns v3.x, date-fns-tz v3.x 🔄
  - Updated to latest API (toZonedTime, fromZonedTime)
  - Timezone-aware photo validation
- **Notifications**: react-hot-toast
- **Payment Processing**: Stripe (API version 2025-09-30.clover) 🔄

### Backend Stack
- **Runtime**: Node.js
- **Database**: PostgreSQL (Supabase)
- **ORM**: Prisma
- **API Routes**: Next.js API Routes
- **File Storage**: Local filesystem (/public/uploads)
- **Image Processing**: Sharp

### External APIs
- **NOAA KP Index**: `https://services.swpc.noaa.gov/products/noaa-planetary-k-index-forecast.json`
- **NOAA Aurora Overlay**: `https://services.swpc.noaa.gov/json/ovation_aurora_latest.json`
- **NOAA Image Frames**: `https://services.swpc.noaa.gov/images/animations/ovation/{hemisphere}/`
- **NOAA Solar Wind (Magnetic)**: `https://services.swpc.noaa.gov/products/solar-wind/mag-1-day.json`
- **NOAA Solar Wind (Plasma)**: `https://services.swpc.noaa.gov/products/solar-wind/plasma-1-day.json`
- **NOAA GOES X-ray Data** 🆕: `https://services.swpc.noaa.gov/json/goes/primary/xrays-7-day.json`
- **NASA DONKI CME API** 🆕: `https://api.nasa.gov/DONKI/CME?startDate={date}&endDate={date}&api_key={key}`
- **NASA DONKI HSS API** 🆕: `https://api.nasa.gov/DONKI/HSS?startDate={date}&endDate={date}&api_key={key}`
- **OpenStreetMap Nominatim**: Location geocoding and autocomplete
- **Light Pollution Map** 🆕: `https://lightpollutionmap.app/` (external link)
- **Accommodations API** 🆕: `/api/accommodations?country={country}&minKp={kp}&features={features}` (internal API)

### Database Schema

#### User Table
- Authentication fields (email, name, image)
- Profile fields (bio, onboarding status)
- Business fields (businessName, businessCountry, businessCity, businessServices, businessDescription, businessWebsite, businessCategory)
- Location fields (latitude, longitude) 🆕
- Verification fields (userType, verificationStatus, verificationSubmittedAt, businessEmail, businessDescription, businessLicenseUrl, idDocumentUrl)
- Timestamps (created, updated)

#### Sighting Table
- User reference
- Caption (optional)
- Location (name, latitude, longitude)
- Images array (URLs)
- Sighting type (realtime/past)
- Timestamps (created, updated)

#### Hunt Table
- Creator reference
- Name, description
- Date range (start, end)
- Location (name, latitude, longitude, visibility)
- Settings (public, paid, price, capacity)
- Timestamps (created, updated)

#### HuntParticipant Table
- Hunt and user references
- Status (pending, confirmed, cancelled)
- Payment tracking
- Join timestamp

#### RoomType Table 🆕
- User reference (business owner)
- Room details (name, description, capacity)
- Pricing (priceFrom, currency)
- Media (images array, coverImage)
- Amenities array (glass dome, sauna, aurora alarm, etc.)
- Display settings (isActive, displayOrder)
- Timestamps (created, updated)

#### Comment & Like Tables
- Standard social engagement tables
- Reference to sightings
- User references
- Timestamps

## Design System

### Color Palette
- **Aurora Green**: `#00ff87` - Primary actions, active states
- **Aurora Blue**: `#00d9ff` - Secondary actions, links
- **Background Dark**: `#0a0e17` - Main background
- **Card Background**: `#1a1f2e` - Elevated surfaces
- **KP Colors**:
  - Red: `#ff0000` (KP 5+)
  - Orange: `#ffaa00` (KP 4-5)
  - Yellow: `#ffff00` (KP 3-4)
  - Green: `#00ff00` (KP 0-3)

### Typography
- **System Fonts**: Default Next.js font stack
- **Sizes**: Responsive scaling using Tailwind utilities

### Layout
- **Max Width**: 1024px (max-w-screen-lg)
- **Mobile-First**: Responsive design with breakpoints
- **Bottom Navigation**: Fixed navigation bar on mobile

## User Flows

### First-Time User Flow
1. Land on app → Redirect to sign in
2. Sign in with Google
3. Onboarding flow (profile setup)
4. Arrive at homepage with tutorial

### View Aurora Forecast Flow
1. Tap KP Index card on homepage
2. View current KP status
3. Watch synchronized aurora animations
4. Review upcoming hours forecast
5. Check long-term forecast
6. Read KP Index explanation

### Share Real-Time Sighting Flow (Mobile)
1. Tap Plan button → Share Sighting
2. Select "Real-time" sighting type
3. Tap to open camera
4. Take photo
5. GPS automatically extracted
6. Add caption (optional)
7. Confirm/search location
8. Post sighting

### Share Past Sighting Flow
1. Tap Plan button → Share Sighting
2. Select "Past Sighting" type
3. Upload up to 10 photos
4. Select date and time of sighting
5. Add caption (optional)
6. Search and confirm location
7. Post sighting

### Search by Location Flow
1. Go to Search page
2. Tap filter button
3. Enter location in search field
4. Select from autocomplete suggestions
5. View results sorted by distance
6. See only sightings within 400km radius

### Plan Hunt Flow
1. Tap Plan button
2. Fill in hunt details
3. Set location on map
4. Configure privacy settings
5. Create hunt
6. Share with community

## Success Metrics

### User Engagement
- Daily active users (DAU)
- Sightings posted per day
- Hunts created per week
- Map interactions per session

### Content Quality
- Sightings with GPS data percentage
- Average images per sighting
- Comments per sighting
- Hunt participation rate

### Feature Adoption
- Forecast page views
- Filter usage rate
- Real-time vs past sighting ratio
- Location search usage

## Future Enhancements

### Phase 2 Features
- Push notifications for high KP alerts
- Weather integration (cloud cover)
- Camera settings recommendations
- Aurora photography tips
- Time-lapse creation tools

### Phase 3 Features
- Premium membership tier
- Advanced photo editing tools
- Aurora prediction AI
- Integration with camera apps
- Gear recommendations

### Phase 4 Features
- Tour operator partnerships
- Accommodation booking
- Travel planning tools
- Community meetups
- Aurora photography contests

## Technical Debt & Known Issues

### Recently Resolved ✅
- ✅ Next.js 15 compatibility (all dynamic routes updated)
- ✅ TypeScript strict type checking (all errors fixed)
- ✅ date-fns-tz v3 migration (deprecated functions updated)
- ✅ Stripe API version update (latest API version)
- ✅ Hunt capacity null/undefined handling

### Current Limitations
- Local file storage (should migrate to cloud storage)
- No image CDN (performance optimization needed)
- Database migrations require manual intervention in production
- Limited automated testing suite
- No error tracking service integration

### Security Considerations
- CSRF protection via NextAuth
- SQL injection prevention via Prisma
- XSS protection via React
- File upload size limits (implicit via Sharp)
- Rate limiting not implemented

### Performance Optimizations Needed
- Image lazy loading
- Infinite scroll for feed
- Map marker virtualization
- API response caching
- Static generation for public pages

## Deployment

### Environment Variables Required
```
DATABASE_URL=postgresql://...
NEXTAUTH_URL=https://...
NEXTAUTH_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

### Build Process
```bash
npm install
npx prisma generate
npx prisma db push
npm run build
npm start
```

### Hosting Recommendations
- **Frontend**: Vercel (optimal for Next.js)
- **Database**: Supabase or Railway
- **File Storage**: AWS S3 or Cloudinary (future)

## Support & Maintenance

### Regular Updates Needed
- NOAA API endpoint monitoring
- OpenStreetMap rate limit management
- Database backup schedule
- Security patch updates

### User Support
- In-app help documentation
- FAQ page
- Contact form
- Bug report system

---

**Document Version**: 1.2
**Last Updated**: November 6, 2025
**Status**: Production Ready
**Recent Updates**:
- Added Aurora Accommodations feature (80+ properties across 7 countries)
- Real-time aurora metrics with actual success rates from user sightings
- Room types and amenities database
- Geomagnetic coordinate calculations for aurora visibility
- Updated default landing page to Sightings Feed
- Next.js 15.5.5 full compatibility
- TypeScript strict mode compliance
- Latest dependency versions (date-fns-tz v3, Stripe API 2025-09-30)
