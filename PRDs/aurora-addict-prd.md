# Product Requirements Document: Aurora Addict

**Version:** 1.1
**Last Updated:** October 10, 2025
**Product Owner:** Kristabel
**Status:** Phase 2 In Progress

---

## 1. Executive Summary

Aurora Addict is a web application designed for aurora enthusiasts worldwide to track, plan, and share Northern Lights sightings. The platform combines real-time aurora data, social features, and event planning capabilities to create a comprehensive community hub for aurora chasers.

### Vision
To become the leading platform for aurora chasers to connect, share experiences, and plan successful aurora hunting expeditions through data-driven insights and community engagement.

### Success Metrics
- Monthly Active Users (MAU)
- Number of sightings posted per month
- Number of hunts created and participated in
- User engagement rate (likes, comments, hunt joins)
- User retention rate (30-day, 90-day)

---

## 2. Problem Statement

Auvrora chasers face several challenges:
- **Scattered Information**: Aurora forecast data, weather conditions, and sighting reports exist across multiple platforms
- **Lack of Community**: No dedicated social platform for aurora enthusiasts to share real-time sightings
- **Planning Difficulties**: Organizing aurora hunting trips with others is complicated without a centralized platform
- **Timing Uncertainty**: Missing optimal viewing opportunities due to lack of timely, localized information

---

## 3. Target Users

### Primary Persona: The Dedicated Aurora Chaser
- **Demographics**: 25-45 years old, adventure travelers, photography enthusiasts
- **Behavior**: Actively plans trips around aurora forecasts, invests in photography equipment
- **Needs**: Real-time sighting alerts, reliable forecast data, community of like-minded individuals
- **Pain Points**: Missing optimal viewing times, traveling to locations with poor visibility

### Secondary Persona: The Casual Observer
- **Demographics**: 30-60 years old, lives in or visits northern latitudes
- **Behavior**: Opportunistic aurora viewing, shares experiences on social media
- **Needs**: Simple interface, easy sharing, notification of nearby sightings
- **Pain Points**: Not knowing when/where to look, lack of guidance

### Tertiary Persona: The Professional Guide
- **Demographics**: 25-50 years old, tour operators, photography instructors
- **Behavior**: Organizes aurora tours, builds reputation through successful sightings
- **Needs**: Event management tools, client engagement, credibility building
- **Pain Points**: Coordinating groups, weather unpredictability, client expectations

---

## 4. Product Overview

### Core Value Proposition
Aurora Addict provides a unified platform where users can access real-time aurora data, discover recent sightings through an interactive map, share their own experiences, and connect with other enthusiasts for planned aurora hunting events.

### Key Differentiators
1. **Real-time Sighting Map**: Color-coded pins showing recency of sightings (0-12 hours)
2. **Integrated Planning**: Create and join public/private aurora hunting events
3. **Social Feed**: Instagram-style sharing of aurora photos and videos
4. **Data Integration**: Kp index and cloud cover data in one place
5. **Free & Open**: Built on OpenStreetMap with no usage limits

---

## 5. Functional Requirements

### 5.1 Authentication & Onboarding

#### FR-1.1: Social Authentication
- **Description**: Users can sign up and log in using social identity providers
- **Supported Providers**: Google, Apple, Meta (Facebook)
- **Requirements**:
  - OAuth 2.0 integration
  - Automatic account creation on first login
  - Session persistence across visits
- **Priority**: P0 (Must Have)

#### FR-1.2: Onboarding Flow
- **Description**: First-time users complete a 3-step onboarding
- **Steps**:
  1. Welcome & platform introduction
  2. Feature overview (real-time updates)
  3. Planning capabilities explanation
- **Requirements**:
  - Maximum 3 steps
  - Skippable option
  - Never shown again after completion
- **Priority**: P0 (Must Have)

#### FR-1.3: Automatic Login
- **Description**: Returning users are automatically logged in
- **Requirements**:
  - Session token validation
  - Redirect to homepage if authenticated
  - Onboarding check (skip if completed)
- **Priority**: P0 (Must Have)

---

### 5.2 Homepage & Map

#### FR-2.1: Interactive Map
- **Description**: Leaflet-based map showing global aurora sightings and planned hunts
- **Requirements**:
  - Default center: User's location (auto-detected via geolocation)
  - Fallback center: Iceland (64.9631°N, 19.0208°W) if location denied
  - Zoom controls enabled
  - Scroll wheel zoom enabled
  - OpenStreetMap tile layer
- **Priority**: P0 (Must Have)
- **Status**: ✅ Complete

#### FR-2.2: Sighting Pins
- **Description**: Color-coded markers for recent sightings (last 12 hours)
- **Color Coding**:
  - Green: 0-4 hours old
  - Orange: 4-8 hours old
  - Red: 8-12 hours old
- **Pin Details**:
  - Click to view popup with image, location, user, timestamp
  - Circular markers with white border
  - Hover effect (scale 1.1x)
- **Priority**: P0 (Must Have)

#### FR-2.3: Hunt Location Pins
- **Description**: Markers for upcoming planned hunts
- **Requirements**:
  - Blue pin icon design
  - Click to view hunt details popup
  - Show name, location, date, participant count
  - "Join Hunt" button in popup
- **Priority**: P0 (Must Have)

#### FR-2.4: Location Controls
- **Description**: User location centering and search
- **Requirements**:
  - Location button (bottom-right) to center on user's GPS position
  - Address search bar (top overlay)
  - Map repositioning on search
- **Priority**: P1 (Should Have)

#### FR-2.5: Aurora Stats Display
- **Description**: Current Kp index and cloud cover percentage
- **Requirements**:
  - Two stat cards above map
  - Kp index with green accent color
  - Cloud cover percentage with blue accent color
  - Clickable to view detailed stats page
  - Auto-refresh every 5 minutes
- **Data Source**: NOAA Space Weather API
- **Priority**: P0 (Must Have)

---

### 5.3 Search Page

#### FR-3.1: Sighting Grid
- **Description**: Instagram-style 3-column grid of all sightings
- **Requirements**:
  - Masonry layout (equal height squares)
  - 1px gap between items
  - Most recent sightings first
  - Lazy loading (infinite scroll)
- **Priority**: P0 (Must Have)

#### FR-3.2: Search Functionality
- **Description**: Filter sightings by location
- **Requirements**:
  - Search bar (sticky at top)
  - Real-time filtering as user types
  - Case-insensitive matching
  - Search against location field
- **Priority**: P1 (Should Have)

#### FR-3.3: Hover Interaction
- **Description**: Show engagement stats on grid item hover
- **Requirements**:
  - Dark overlay on hover
  - Display like count with heart icon
  - Smooth fade-in transition
- **Priority**: P2 (Nice to Have)

---

### 5.4 Planner Page

#### FR-4.1: Hunt Creation
- **Description**: Form to create new aurora hunting events
- **Required Fields**:
  - Hunt name
  - Start date & time
  - End date & time
- **Optional Fields**:
  - Description
  - Location (address + lat/long)
  - Hide location (privacy toggle)
  - Public/Private visibility
  - Paid event (with price)
  - Capacity limit
- **Validation**:
  - End date must be after start date
  - Price required if paid event selected
- **Priority**: P0 (Must Have)

#### FR-4.2: Hunt Search
- **Description**: Search for existing hunts to join
- **Requirements**:
  - Search by location
  - Search by date range
  - Display upcoming public hunts
  - Show participant count
- **Priority**: P1 (Should Have)

#### FR-4.3: Hunt Management
- **Description**: Edit hunt details after creation
- **Requirements**:
  - Only creator can edit
  - All fields editable except creator
  - Changes reflect immediately on map
- **Priority**: P1 (Should Have)

#### FR-4.4: Participation
- **Description**: Join/leave hunts
- **Requirements**:
  - One-click "Join Hunt" from map or details page
  - Automatic capacity checking
  - Payment flow for paid events (future)
  - Participant list visible to all participants
  - Leave hunt functionality (cannot leave own hunt)
- **Priority**: P0 (Must Have)
- **Status**: ✅ Complete

#### FR-4.5: Hunt Details Page
- **Description**: Full details page for individual hunts
- **Requirements**:
  - Display all hunt information (name, description, dates, location)
  - Show creator information with avatar
  - List all confirmed participants with avatars and join times
  - Show pending participants for paid events
  - Interactive map showing hunt location
  - Privacy handling (hide location for private hunts until joined)
  - Join/Leave/Edit buttons based on user role
  - Capacity display and enforcement
- **Priority**: P0 (Must Have)
- **Status**: ✅ Complete

---

### 5.5 Feed Page

#### FR-5.1: Sighting Posts
- **Description**: Social feed of aurora sightings
- **Post Components**:
  - User profile picture and name
  - Location
  - Time posted (relative, e.g., "2 hours ago")
  - Image(s) or video(s)
  - Caption (optional)
  - Like count and button
  - Comment count and button
- **Sorting**: Newest first, then by proximity to user location
- **Priority**: P0 (Must Have)

#### FR-5.2: Like Functionality
- **Description**: Users can like/unlike sightings
- **Requirements**:
  - Heart icon (filled when liked, outline when not)
  - Like count updates in real-time
  - Toggle like/unlike on click
  - Optimistic UI update
- **Priority**: P0 (Must Have)

#### FR-5.3: Comment Functionality
- **Description**: Users can comment on sightings
- **Requirements**:
  - Expandable comment section
  - Text input with "Post" button
  - Enter key to submit
  - Comments sorted chronologically (oldest first)
  - Display commenter name, avatar, time
- **Priority**: P0 (Must Have)

#### FR-5.4: Post Creation
- **Description**: Create new sighting posts
- **Requirements**:
  - Upload images/videos
  - Extract GPS coordinates from image metadata
  - Auto-populate location from coordinates
  - Manual location override option
  - Caption input (optional)
- **Priority**: P1 (Should Have)

---

### 5.6 Profile Page

#### FR-6.1: Profile Display
- **Description**: User profile with stats and content grid
- **Profile Components**:
  - Profile picture
  - Name and email
  - Bio (editable)
  - Sighting count
  - Hunt count (created)
  - 3-column grid of user's sightings
- **Priority**: P0 (Must Have)

#### FR-6.2: Bio Editing
- **Description**: Users can update their bio
- **Requirements**:
  - In-place editing
  - "Edit" button toggles textarea
  - "Save" and "Cancel" buttons
  - Character limit: 500
- **Priority**: P1 (Should Have)

#### FR-6.3: Sign Out
- **Description**: Users can log out
- **Requirements**:
  - Sign out button in profile header
  - Clear session on sign out
  - Redirect to sign-in page
- **Priority**: P0 (Must Have)

---

### 5.7 Navigation

#### FR-7.1: Bottom Navigation Bar
- **Description**: Fixed bottom menu with 5 options
- **Menu Items**:
  1. Homepage (home icon)
  2. Search (search icon)
  3. Plan Hunt (plus icon, emphasized with gradient circle)
  4. Feed (grid icon)
  5. Profile (person icon)
- **Requirements**:
  - Active state highlighting (green accent)
  - Icons with labels (except emphasized button)
  - Sticky positioning at bottom
  - Visible on all authenticated pages
- **Priority**: P0 (Must Have)

---

## 6. Non-Functional Requirements

### 6.1 Performance
- **Page Load Time**: < 2 seconds on 3G connection
- **Time to Interactive**: < 3 seconds
- **Map Render Time**: < 1 second for 100 markers
- **API Response Time**: < 500ms for 95th percentile

### 6.2 Scalability
- **Concurrent Users**: Support 10,000 simultaneous users
- **Database**: Horizontal scaling via connection pooling
- **Image Storage**: CDN delivery for all media
- **Rate Limiting**: 100 requests/minute per user

### 6.3 Security
- **Authentication**: OAuth 2.0 with secure token storage
- **Data Encryption**: HTTPS for all traffic, encrypted database connections
- **Input Validation**: Server-side validation for all user inputs
- **CORS**: Restricted to approved domains
- **SQL Injection Prevention**: Parameterized queries via Prisma ORM

### 6.4 Accessibility
- **WCAG Compliance**: AA standard minimum
- **Keyboard Navigation**: Full keyboard accessibility
- **Screen Readers**: Semantic HTML and ARIA labels
- **Color Contrast**: 4.5:1 minimum ratio for text

### 6.5 Browser Support
- **Desktop**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Mobile**: iOS Safari 14+, Chrome Mobile 90+
- **Progressive Enhancement**: Core features work without JavaScript

### 6.6 Responsive Design
- **Mobile First**: Optimized for 375px width
- **Breakpoints**: 640px (sm), 768px (md), 1024px (lg), 1280px (xl)
- **Touch Optimization**: 44px minimum touch target size

---

## 7. Technical Architecture

### 7.1 Frontend Stack
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 3.4
- **Maps**: Leaflet 1.9 + React Leaflet 4.2
- **Map Tiles**: OpenStreetMap (free, unlimited)
- **State Management**: Zustand 4.5
- **Data Fetching**: SWR 2.2, native fetch API
- **Authentication**: NextAuth.js 4.24

### 7.2 Backend Stack
- **Runtime**: Node.js (via Next.js API routes)
- **Database**: PostgreSQL (Supabase hosted)
- **ORM**: Prisma 5.20
- **File Upload**: React Dropzone 14.2
- **Image Processing**: Sharp 0.33

### 7.3 External APIs
- **NOAA Space Weather**: Kp index data
- **Weather API**: Cloud cover percentage (TBD)
- **Geocoding**: OpenStreetMap Nominatim (free tier)

### 7.4 Hosting & Deployment
- **Platform**: Vercel
- **Database**: Supabase (PostgreSQL)
- **CDN**: Vercel Edge Network
- **Environment**: Preview + Production branches

---

## 8. Data Model

### 8.1 Core Entities

#### User
- `id`: String (cuid)
- `name`: String (nullable)
- `email`: String (unique, nullable)
- `emailVerified`: DateTime (nullable)
- `image`: String (nullable)
- `bio`: String (nullable, max 500 chars)
- `onboardingComplete`: Boolean (default: false)
- `createdAt`: DateTime
- `updatedAt`: DateTime

#### Sighting
- `id`: String (cuid)
- `userId`: String (foreign key)
- `caption`: String (nullable)
- `latitude`: Float
- `longitude`: Float
- `location`: String
- `images`: String[] (array of URLs)
- `videos`: String[] (array of URLs)
- `createdAt`: DateTime
- `updatedAt`: DateTime

#### Hunt
- `id`: String (cuid)
- `name`: String
- `description`: String (nullable)
- `userId`: String (foreign key, creator)
- `startDate`: DateTime
- `endDate`: DateTime
- `latitude`: Float (nullable)
- `longitude`: Float (nullable)
- `location`: String (nullable)
- `hideLocation`: Boolean (default: false)
- `isPublic`: Boolean (default: true)
- `isPaid`: Boolean (default: false)
- `price`: Float (nullable)
- `capacity`: Int (nullable)
- `createdAt`: DateTime
- `updatedAt`: DateTime

#### HuntParticipant
- `id`: String (cuid)
- `huntId`: String (foreign key)
- `userId`: String (foreign key)
- `status`: String (pending/confirmed/cancelled)
- `paidAt`: DateTime (nullable)
- `joinedAt`: DateTime

#### Comment
- `id`: String (cuid)
- `content`: String
- `userId`: String (foreign key)
- `sightingId`: String (foreign key)
- `createdAt`: DateTime
- `updatedAt`: DateTime

#### Like
- `id`: String (cuid)
- `userId`: String (foreign key)
- `sightingId`: String (foreign key)
- `createdAt`: DateTime
- Unique constraint: (userId, sightingId)

### 8.2 Relationships
- User → Sightings (1:many)
- User → Hunts (1:many, as creator)
- User → HuntParticipants (1:many)
- User → Comments (1:many)
- User → Likes (1:many)
- Sighting → Comments (1:many)
- Sighting → Likes (1:many)
- Hunt → HuntParticipants (1:many)

---

## 9. API Endpoints

### 9.1 Authentication
- `POST /api/auth/signin/google` - Google OAuth
- `POST /api/auth/signin/apple` - Apple OAuth
- `POST /api/auth/signin/facebook` - Meta OAuth
- `GET /api/auth/session` - Get current session
- `POST /api/auth/signout` - Sign out user

### 9.2 User
- `GET /api/user/profile` - Get user profile
- `PATCH /api/user/profile` - Update user profile
- `POST /api/user/complete-onboarding` - Mark onboarding complete

### 9.3 Sightings
- `GET /api/sightings/recent` - Get sightings from last 12 hours
- `GET /api/sightings/all` - Get all sightings (paginated)
- `GET /api/sightings/feed` - Get feed (sorted by time + location)
- `POST /api/sightings/create` - Create new sighting
- `POST /api/sightings/like` - Toggle like on sighting
- `GET /api/sightings/[id]/comments` - Get comments for sighting
- `POST /api/sightings/[id]/comments` - Add comment to sighting

### 9.4 Hunts
- `GET /api/hunts/upcoming` - Get upcoming public hunts ✅
- `POST /api/hunts/create` - Create new hunt ✅
- `GET /api/hunts/[id]` - Get hunt details with participants ✅
- `PATCH /api/hunts/[id]` - Update hunt details (pending)
- `POST /api/hunts/[id]/join` - Join a hunt ✅
- `DELETE /api/hunts/[id]/leave` - Leave a hunt ✅

### 9.5 Stats
- `GET /api/stats/current` - Get current Kp index and cloud cover
- `GET /api/stats/forecast` - Get 3-day aurora forecast

---

## 10. User Flows

### 10.1 First-Time User Flow
1. User visits `aurora-addict.vercel.app`
2. Redirected to `/auth/signin`
3. Clicks "Continue with Google"
4. Google OAuth consent screen
5. Redirect back to app at `/onboarding`
6. Step 1: Welcome message
7. Step 2: Feature overview
8. Step 3: Planning capabilities
9. "Get Started" → Redirect to `/` (homepage)
10. View map with sightings and stats

### 10.2 Returning User Flow
1. User visits `aurora-addict.vercel.app`
2. Session validated
3. Redirect to `/` (homepage)
4. View personalized map

### 10.3 Create Hunt Flow
1. User clicks "Plan Hunt" in bottom nav
2. View planning page with search and create options
3. Click "Create New Hunt"
4. Fill in hunt details form
5. Click "Create Hunt"
6. Redirect to homepage
7. See new hunt pin on map

### 10.4 Post Sighting Flow (Future)
1. User clicks "+" button (future feature)
2. Upload photo/video with GPS data
3. Auto-fill location from EXIF data
4. Add optional caption
5. Click "Post"
6. Sighting appears on map and feed

---

## 11. Design System

### 11.1 Color Palette
- **Background Dark**: `#0a0e17`
- **Surface Dark**: `#1a1f2e`
- **Aurora Green**: `#00ff87`
- **Aurora Blue**: `#00d9ff`
- **Aurora Purple**: `#b77aff`
- **Text Primary**: `#ffffff`
- **Text Secondary**: `#9ca3af` (gray-400)
- **Text Tertiary**: `#6b7280` (gray-500)

### 11.2 Typography
- **Font Family**: System fonts (-apple-system, BlinkMacSystemFont, Segoe UI, Roboto)
- **Headings**: Bold weight
- **Body**: Normal weight
- **Small Text**: 0.875rem (14px)
- **Extra Small**: 0.75rem (12px)

### 11.3 Spacing
- **Base Unit**: 4px (0.25rem)
- **Standard Gap**: 16px (1rem)
- **Large Gap**: 24px (1.5rem)

### 11.4 Border Radius
- **Small**: 8px (0.5rem)
- **Medium**: 12px (0.75rem)
- **Large**: 16px (1rem)
- **Full**: 9999px (rounded-full)

### 11.5 Shadows
- **Small**: `0 1px 2px rgba(0,0,0,0.05)`
- **Medium**: `0 4px 6px rgba(0,0,0,0.1)`
- **Large**: `0 10px 15px rgba(0,0,0,0.2)`

---

## 12. Future Enhancements

### Phase 2 (Q1 2026) - In Progress
- ✅ **Hunt Joining**: Join/leave hunts from map and details page
- ✅ **Hunt Details Page**: Full details with participant list and map
- ✅ **User Location Centering**: Map auto-centers to user's location
- 🔄 **Image Upload**: Direct photo/video upload from camera (in progress)
- **Hunt Editing**: Edit hunt details after creation
- **Public User Profiles**: View other users' profiles
- **Real-time Notifications**: Push alerts for nearby sightings
- **Advanced Filters**: Filter hunts by price, capacity, distance
- **User Following**: Follow other users to see their sightings first
- **Private Messaging**: DM other users

### Phase 3 (Q2 2026)
- **Payment Integration**: Stripe for paid hunt events
- **Mobile App**: React Native iOS/Android apps
- **Offline Mode**: View cached data when offline
- **AR Features**: Augmented reality aurora viewing guidance
- **Weather Alerts**: Automated alerts for ideal viewing conditions

### Phase 4 (Q3 2026)
- **AI Predictions**: Machine learning for aurora probability
- **Tour Operator Dashboard**: Analytics for professional guides
- **Gear Marketplace**: Buy/sell aurora photography equipment
- **Live Streaming**: Stream aurora sightings in real-time
- **Community Challenges**: Gamification and achievements

---

## 13. Success Criteria

### Launch (MVP)
- ✅ User authentication working
- ✅ Map displays sightings and hunts
- ✅ Users can create hunts
- ✅ Feed displays sightings
- ✅ Profile page functional
- ✅ Deployed to Vercel

### 3 Months Post-Launch
- 1,000+ registered users
- 100+ sightings posted
- 50+ hunts created
- 70% 30-day user retention
- < 2 second average page load

### 6 Months Post-Launch
- 10,000+ registered users
- 1,000+ sightings posted
- 500+ hunts created
- 60% 90-day user retention
- Featured in aurora/travel publications

### 12 Months Post-Launch
- 50,000+ registered users
- 10,000+ sightings posted
- 5,000+ hunts created
- Mobile app launched
- Revenue positive (paid hunts/ads)

---

## 14. Risks & Mitigations

### Technical Risks
| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Map performance with 1000+ markers | High | Medium | Implement marker clustering, lazy loading |
| Database connection limits | High | Medium | Use connection pooling (already implemented) |
| Image upload costs | Medium | High | Implement compression, use free CDN tier initially |
| Third-party API downtime | Medium | Low | Cache data, fallback to mock data |

### Business Risks
| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Low user adoption | High | Medium | Marketing campaign, influencer partnerships |
| Seasonal usage (winter only) | Medium | High | Add features for other atmospheric phenomena |
| Competition from established platforms | Medium | Medium | Focus on niche features (hunt planning) |
| Content moderation challenges | Medium | Low | Implement reporting system, automated filters |

---

## 15. Compliance & Legal

### 15.1 Data Privacy
- **GDPR Compliance**: User data export, deletion on request
- **CCPA Compliance**: California user rights honored
- **Cookie Policy**: Consent banner for analytics cookies
- **Privacy Policy**: Clearly state data collection and usage

### 15.2 Content Policy
- **User-Generated Content**: Users retain rights to uploaded media
- **Platform License**: Users grant platform license to display content
- **DMCA**: Process for copyright infringement claims
- **Prohibited Content**: Clear guidelines against harassment, spam

### 15.3 Terms of Service
- **Age Requirement**: 13+ (COPPA compliance)
- **Account Termination**: Reserve right to ban violators
- **Liability**: Limited liability for user-generated content
- **Dispute Resolution**: Arbitration clause

---

## 16. Analytics & Monitoring

### 16.1 Key Metrics
- **User Metrics**: DAU, MAU, retention cohorts
- **Engagement**: Likes/comments per user, time on site
- **Content**: Sightings per day, hunt creation rate
- **Performance**: Page load times, API response times, error rates

### 16.2 Tracking Implementation
- **Tool**: Vercel Analytics (built-in)
- **Events**: Page views, button clicks, form submissions
- **Funnels**: Sign-up flow, hunt creation, sighting posts

### 16.3 Error Monitoring
- **Tool**: Sentry (to be implemented)
- **Alerts**: Slack notifications for critical errors
- **Logging**: Server-side logging with Winston

---

## 17. Open Questions

1. **Image Storage**: Where to store uploaded images long-term? (Supabase Storage vs. Cloudinary vs. AWS S3)
2. **Moderation**: How to handle inappropriate content? Manual review vs. AI moderation?
3. **Monetization**: Freemium model? Ads? Premium features?
4. **Weather Data**: Which weather API provides best cloud cover data at reasonable cost?
5. **Internationalization**: Should we support multiple languages from launch?
6. **Time Zones**: How to display hunt times for users in different time zones?
7. **Search Optimization**: How to make hunt search more powerful? (tags, filters)

---

## 18. Appendix

### 18.1 References
- [NOAA Space Weather API Documentation](https://www.swpc.noaa.gov/products/apis-json)
- [OpenStreetMap Tile Usage Policy](https://operations.osmfoundation.org/policies/tiles/)
- [Leaflet Documentation](https://leafletjs.com/reference.html)
- [Next.js 15 Documentation](https://nextjs.org/docs)
- [Prisma Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization)

### 18.2 Glossary
- **Kp Index**: Planetary K-index, measure of geomagnetic activity (0-9 scale)
- **Aurora Oval**: Ring-shaped region around magnetic poles where auroras are visible
- **Aurora Borealis**: Northern Lights (Northern Hemisphere)
- **Aurora Australis**: Southern Lights (Southern Hemisphere)
- **Geomagnetic Storm**: Disturbance in Earth's magnetosphere that triggers auroras
- **Solar Wind**: Stream of charged particles from the Sun

---

**Document End**

*For questions or updates to this PRD, contact the product owner.*
