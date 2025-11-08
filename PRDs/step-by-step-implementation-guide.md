# Aurora Addict: Step-by-Step Implementation Guide

**Version:** 1.2
**Last Updated:** October 14, 2025
**Based on:** Aurora Addict PRD v1.0
**Purpose:** Detailed implementation roadmap with actionable steps

---

## Table of Contents

1. [Phase 0: Foundation & Setup](#phase-0-foundation--setup)
2. [Phase 1: MVP Core Features](#phase-1-mvp-core-features)
3. [Phase 2: Social Features](#phase-2-social-features)
4. [Phase 3: Enhancement & Polish](#phase-3-enhancement--polish)
5. [Phase 4: Launch Preparation](#phase-4-launch-preparation)
6. [Post-Launch: Iteration & Growth](#post-launch-iteration--growth)

---

## Phase 0: Foundation & Setup

**Timeline:** Week 1
**Status:** ✅ COMPLETED
**Goal:** Establish project infrastructure and development environment

### Step 0.1: Project Initialization ✅
- [x] Initialize Next.js 15 project with TypeScript
- [x] Configure Tailwind CSS
- [x] Set up ESLint and Prettier
- [x] Create folder structure (`/src/app`, `/src/components`, `/src/lib`)
- [x] Install core dependencies (React, Next.js, TypeScript)

**Deliverables:**
- Working Next.js development server
- Basic folder structure
- Package.json with dependencies

---

### Step 0.2: Database Setup ✅
- [x] Create Supabase project
- [x] Configure PostgreSQL database
- [x] Install Prisma ORM
- [x] Create `prisma/schema.prisma`
- [x] Define database models (User, Sighting, Hunt, etc.)
- [x] Run `prisma generate` and `prisma db push`
- [x] Verify database tables created

**Deliverables:**
- Live Supabase database
- Prisma schema file
- Database connection established

---

### Step 0.3: Authentication Setup ✅
- [x] Install NextAuth.js
- [x] Configure Google OAuth provider
- [x] Configure Apple OAuth provider (credentials needed)
- [x] Configure Meta OAuth provider (credentials needed)
- [x] Create `/api/auth/[...nextauth]/route.ts`
- [x] Set up session management
- [x] Test Google login flow

**Deliverables:**
- Working OAuth with at least one provider (Google)
- Session persistence
- User account creation on first login

---

### Step 0.4: Environment Configuration ✅
- [x] Create `.env.local.example` file
- [x] Create `.env.local` with actual credentials
- [x] Add environment variables:
  - DATABASE_URL
  - NEXTAUTH_URL
  - NEXTAUTH_SECRET
  - OAuth credentials (Google, Apple, Meta)
  - NASA_API_KEY (for DONKI API: NIXvIqoTvk1qIplmptffaH4sQYgTnlDD6bH4kIYM)
- [x] Verify `.env.local` in `.gitignore`

**Deliverables:**
- Environment variables documented
- Local environment working
- Secrets secured

**External APIs Used:**
- **NOAA Space Weather Prediction Center** (Free, no key required):
  - KP Index Forecast: `https://services.swpc.noaa.gov/products/noaa-planetary-k-index-forecast.json`
  - Aurora OVATION Model: `https://services.swpc.noaa.gov/json/ovation_aurora_latest.json`
  - Aurora Animation Frames: `https://services.swpc.noaa.gov/images/animations/ovation/{hemisphere}/`
  - Solar Wind Magnetic: `https://services.swpc.noaa.gov/products/solar-wind/mag-1-day.json`
  - Solar Wind Plasma: `https://services.swpc.noaa.gov/products/solar-wind/plasma-1-day.json`
  - GOES X-ray Data: `https://services.swpc.noaa.gov/json/goes/primary/xrays-7-day.json`
- **NASA DONKI API** (Free, key required):
  - CME Data: `https://api.nasa.gov/DONKI/CME?startDate={date}&endDate={date}&api_key={key}`
  - HSS/Coronal Holes: `https://api.nasa.gov/DONKI/HSS?startDate={date}&endDate={date}&api_key={key}`
- **OpenStreetMap Nominatim** (Free, no key required):
  - Location geocoding and autocomplete
- **Light Pollution Map** (External link):
  - HD Map: `https://lightpollutionmap.app/`

---

### Step 0.5: Map Integration ✅
- [x] Research map options (Mapbox vs. Leaflet)
- [x] Choose Leaflet + OpenStreetMap (free)
- [x] Install `leaflet` and `react-leaflet`
- [x] Install `@types/leaflet`
- [x] Create basic map component
- [x] Test map rendering
- [x] Add Leaflet CSS to globals

**Deliverables:**
- Working map component
- No API key required
- Map displays correctly

---

## Phase 1: MVP Core Features

**Timeline:** Weeks 2-4
**Status:** ✅ COMPLETED
**Goal:** Build minimum viable product with essential features

### Step 1.1: Onboarding Flow ✅
**Priority:** P0 (Must Have)
**Estimated Time:** 4 hours

#### Tasks:
- [x] Create `/onboarding` page
- [x] Design 3-step onboarding UI
  - Step 1: Welcome message
  - Step 2: Feature overview (map + stats)
  - Step 3: Planning capabilities
- [x] Add progress indicators (dots)
- [x] Implement "Next" and "Skip" buttons
- [x] Create API endpoint: `POST /api/user/complete-onboarding`
- [x] Update User model field: `onboardingComplete`
- [x] Redirect logic: if onboarding incomplete → `/onboarding`

**Testing Checklist:**
- [ ] New user sees onboarding
- [ ] Can click through all 3 steps
- [ ] Skip button works
- [ ] Onboarding marked complete in database
- [ ] Returning user skips onboarding

**Deliverables:**
- Functional onboarding flow
- Database flag updated
- User redirected to homepage after completion

---

### Step 1.2: Homepage Redirect & Intelligence Hub ✅
**Priority:** P0 (Must Have)
**Estimated Time:** 8 hours

#### Tasks:
- [x] Create `/(main)/page.tsx` (homepage) with redirect to Intelligence Hub
- [x] Homepage redirects authenticated users to `/intelligence`
- [x] Onboarding redirect for new users
- [x] Authentication redirect for unauthenticated users
- [x] Create Intelligence Hub (`/intelligence/page.tsx`) with three tabs:
  - Map Intel Tab: Interactive map with data layers
  - Cosmic Intel Tab: Space weather cards
  - Expert Intel Tab: Advanced resources
- [x] Test responsive layout (mobile + desktop)

**Testing Checklist:**
- [x] Homepage redirects to /intelligence correctly
- [x] Authenticated users land on Intelligence Hub
- [x] New users redirected to onboarding
- [x] Tab navigation works smoothly
- [x] Mobile layout works

**Deliverables:**
- Homepage redirect functionality
- Intelligence Hub with three tabs
- Seamless navigation flow

---

### Step 1.3: Sighting Markers on Map ✅
**Priority:** P0 (Must Have)
**Estimated Time:** 6 hours

#### Tasks:
- [x] Create API: `GET /api/sightings/recent` (last 12 hours)
- [x] Implement color-coded markers:
  - Green: 0-4 hours
  - Orange: 4-8 hours
  - Red: 8-12 hours
- [x] Create custom Leaflet marker icons
- [x] Add marker click → popup with:
  - Image
  - Location
  - User name
  - Timestamp
- [x] Fetch sightings on map load
- [x] Handle empty state (no sightings)

**Testing Checklist:**
- [ ] Markers display with correct colors
- [ ] Popup shows on marker click
- [ ] Timestamp formats correctly
- [ ] Works with 0, 1, 100+ markers
- [ ] No console errors

**Deliverables:**
- Color-coded sighting markers
- Clickable popups
- API endpoint working

---

### Step 1.4: Hunt Markers on Map ✅
**Priority:** P0 (Must Have)
**Estimated Time:** 4 hours

#### Tasks:
- [x] Create API: `GET /api/hunts/upcoming`
- [x] Design hunt marker icon (blue pin)
- [x] Add hunt markers to map
- [x] Add hunt popup with:
  - Hunt name
  - Location
  - Start date
  - Participant count
  - "Join Hunt" button (UI only for now)
- [x] Fetch hunts on map load

**Testing Checklist:**
- [ ] Hunt markers display
- [ ] Distinct from sighting markers
- [ ] Popup shows hunt details
- [ ] Join button visible (not functional yet)

**Deliverables:**
- Hunt markers on map
- Hunt popups
- API endpoint working

---

### Step 1.5: Bottom Navigation ✅
**Priority:** P0 (Must Have)
**Estimated Time:** 3 hours

#### Tasks:
- [x] Create `BottomNav` component
- [x] Design 5-button layout:
  - Homepage
  - Search
  - Plan Hunt (emphasized with gradient)
  - Feed
  - Profile
- [x] Add icons (SVG)
- [x] Implement active state highlighting
- [x] Make navigation sticky at bottom
- [x] Add to `/(main)/layout.tsx`
- [x] Test on all pages

**Testing Checklist:**
- [ ] Navigation visible on all pages
- [ ] Active state highlights correctly
- [ ] Clicks navigate to correct pages
- [ ] Plan Hunt button stands out
- [ ] Mobile layout works

**Deliverables:**
- Working bottom navigation
- All pages accessible
- Visual hierarchy clear

---

### Step 1.6: Search Page (Grid View) ✅
**Priority:** P0 (Must Have)
**Estimated Time:** 5 hours

#### Tasks:
- [x] Create `/(main)/search/page.tsx`
- [x] Create API: `GET /api/sightings/all`
- [x] Design 3-column grid layout
- [x] Display sighting thumbnails
- [x] Add search bar (sticky at top)
- [x] Implement filter by location
- [x] Add hover effect (show likes count)
- [x] Handle empty state

**Testing Checklist:**
- [ ] Grid displays correctly
- [ ] Search filters results
- [ ] Hover effect works
- [ ] Images load correctly
- [ ] Mobile shows 2 columns

**Deliverables:**
- Instagram-style grid
- Search functionality
- API endpoint working

---

### Step 1.7: Planner Page (Create Hunt) ✅
**Priority:** P0 (Must Have)
**Estimated Time:** 8 hours

#### Tasks:
- [x] Create `/(main)/plan/page.tsx`
- [x] Design hunt creation form with fields:
  - Name (required)
  - Description
  - Start date/time (required)
  - End date/time (required)
  - Location (address + lat/long)
  - Hide location toggle
  - Public/Private toggle
  - Paid event toggle (+ price input)
  - Capacity
- [x] Add form validation
- [x] Create API: `POST /api/hunts/create`
- [x] Auto-add creator as participant
- [x] Redirect to homepage after creation
- [x] Add "Search Existing Hunts" option (UI only)

**Testing Checklist:**
- [ ] Form validates required fields
- [ ] End date must be after start date
- [ ] Hunt created in database
- [ ] Creator added as participant
- [ ] Hunt appears on map
- [ ] Paid event shows price field

**Deliverables:**
- Hunt creation form
- Working API endpoint
- Validation logic

---

### Step 1.8: Feed Page (Sighting Posts) ✅
**Priority:** P0 (Must Have)
**Estimated Time:** 10 hours

#### Tasks:
- [x] Create `/(main)/feed/page.tsx`
- [x] Create API: `GET /api/sightings/feed`
- [x] Design post card layout:
  - User avatar + name
  - Location
  - Time posted (relative)
  - Image(s)
  - Caption
  - Like button + count
  - Comment button + count
- [x] Sort by: time (newest first) + proximity
- [x] Implement like functionality:
  - API: `POST /api/sightings/like`
  - Toggle like/unlike
  - Update count optimistically
- [x] Implement comment functionality:
  - API: `GET /api/sightings/[id]/comments`
  - API: `POST /api/sightings/[id]/comments`
  - Expandable comment section
  - Comment input + submit
- [x] Handle empty state (no sightings)

**Testing Checklist:**
- [ ] Feed displays posts
- [ ] Like button toggles correctly
- [ ] Like count updates
- [ ] Comments expand/collapse
- [ ] Can post comments
- [ ] Comments display in order
- [ ] Relative time formats correctly

**Deliverables:**
- Working feed page
- Like/unlike functionality
- Comment system
- Three API endpoints

---

### Step 1.9: Profile Page ✅
**Priority:** P0 (Must Have)
**Estimated Time:** 6 hours

#### Tasks:
- [x] Create `/(main)/profile/page.tsx`
- [x] Create API: `GET /api/user/profile`
- [x] Display:
  - Profile picture
  - Name
  - Email
  - Bio (editable)
  - Sighting count
  - Hunt count
  - 3-column grid of user's sightings
- [x] Implement bio editing:
  - "Edit" button
  - Textarea for input
  - "Save" and "Cancel" buttons
  - API: `PATCH /api/user/profile`
- [x] Add "Sign Out" button
- [x] Handle sign out (clear session, redirect)

**Testing Checklist:**
- [ ] Profile loads correctly
- [ ] Stats display accurately
- [ ] Bio editing works
- [ ] Changes save to database
- [ ] Sightings grid displays
- [ ] Sign out redirects to login

**Deliverables:**
- Profile page
- Bio editing
- Sign out functionality
- Two API endpoints

---

## Phase 2: Social Features

**Timeline:** Weeks 5-6
**Status:** 🚧 IN PROGRESS
**Goal:** Enhance social engagement and content creation

### Recent Updates (Oct 10, 2025):
- ✅ **User Location Centering**: Map automatically centers on user's geolocation on first load (falls back to Iceland if denied)
- ✅ **Join Hunt from Map**: "Join Hunt" button in map popup now functional with capacity checking and real-time updates
- ✅ **Leave Hunt**: Users can leave hunts with confirmation dialog (creators cannot leave their own hunts)
- ✅ **Hunt Details Page**: Full details page with participant list, avatars, map, and role-based actions (Join/Leave/Edit)
- ✅ **Privacy Controls**: Private hunt locations hidden from non-participants, 403 errors for unauthorized access
- ✅ **Navigation Fix**: Bottom navigation no longer hidden behind map (changed homepage height calculation)
- ✅ **View Details Link**: Added "View Details" button to hunt map popups for easy navigation to full page
- 🔄 **Currently Working On**: Sighting upload functionality with image upload and EXIF GPS extraction

### Step 2.1: Create Sighting (Post Upload)
**Priority:** P1 (Should Have)
**Estimated Time:** 12 hours
**Status:** 🔄 IN PROGRESS

#### Tasks:
- [ ] Add "Create Post" button/FAB (floating action button)
- [ ] Create `/sightings/new` page
- [ ] Implement image upload with `react-dropzone`
- [ ] Extract EXIF GPS data from images (use exifr library)
- [ ] Auto-populate location from coordinates (reverse geocoding)
- [ ] Allow manual location override
- [ ] Add caption input
- [ ] Compress images with `sharp`
- [ ] Store images (decide: Supabase Storage vs. Cloudinary)
- [ ] Create API: `POST /api/sightings/create`
- [ ] Handle multiple images (carousel in feed)
- [ ] Add video upload support (optional)

**Testing Checklist:**
- [ ] Image upload works
- [ ] GPS extraction works from EXIF data
- [ ] Location auto-fills from coordinates
- [ ] Can override location manually
- [ ] Images compressed before upload
- [ ] Post appears in feed immediately
- [ ] Post appears on map at correct location
- [ ] Multiple images display in carousel

**Deliverables:**
- Image upload functionality
- Sighting creation form
- API endpoint (POST /api/sightings/create)
- Storage solution implemented

---

### Step 2.2: Join Hunt Functionality ✅
**Priority:** P0 (Must Have)
**Estimated Time:** 4 hours
**Status:** ✅ COMPLETED

#### Tasks:
- [x] Create API: `POST /api/hunts/[id]/join`
- [x] Implement join logic:
  - Check capacity
  - Add HuntParticipant record
  - Set status to "pending" or "confirmed" based on paid/free
- [x] Update hunt popup "Join Hunt" button to be functional
- [x] Add success feedback (alert notification)
- [x] Update participant count in real-time by refetching hunts
- [x] Create API: `DELETE /api/hunts/[id]/leave`
- [x] Add "Leave Hunt" option for participants (with confirmation)
- [x] Prevent creator from leaving own hunt
- [x] Add "View Details" button alongside Join button in popup

**Testing Checklist:**
- [x] Join button works from map popup
- [x] Capacity enforced
- [x] User added to participants
- [x] Count updates on map
- [x] Can leave hunt
- [x] Can't join if at capacity
- [x] Can't leave own hunt

**Deliverables:**
- ✅ Join hunt functionality
- ✅ Leave hunt functionality
- ✅ Two API endpoints (/api/hunts/[id]/join, /api/hunts/[id]/leave)

---

### Step 2.3: Hunt Details Page ✅
**Priority:** P1 (Should Have)
**Estimated Time:** 6 hours
**Status:** ✅ COMPLETED

#### Tasks:
- [x] Create `/hunts/[id]/page.tsx`
- [x] Display full hunt details:
  - Name, description, dates (formatted with start/end times)
  - Location with interactive Leaflet map
  - Creator info with avatar
  - Participant list with avatars, names, and join times
  - Separate pending participants section for paid events
  - Join/Leave/Edit buttons based on user role
  - Status badges (Private, Paid, Capacity)
- [x] Create API: `GET /api/hunts/[id]`
- [x] Add link from map popup to details page ("View Details" button)
- [x] Handle private hunts:
  - Hide location for non-participants
  - Return 403 for private hunts when not participant/creator
- [x] Add isUserParticipant and isCreator flags to API response
- [x] Show capacity display (X/Y spots)
- [x] Disable join button when hunt is full

**Testing Checklist:**
- [x] Details page loads correctly
- [x] All information displays properly
- [x] Join/Leave works from page
- [x] Edit button only for creator
- [x] Private hunts show limited info to non-participants
- [x] Participant avatars and times display
- [x] Map shows hunt location (unless hidden)
- [x] Confirmation dialog for leaving hunt

**Deliverables:**
- ✅ Hunt details page (/(main)/hunts/[id]/page.tsx)
- ✅ API endpoint (GET /api/hunts/[id])
- ✅ Privacy controls implemented
- ✅ Participant list with avatars
- ✅ Interactive map on details page

---

### Step 2.4: Edit Hunt
**Priority:** P1 (Should Have)
**Estimated Time:** 5 hours

#### Tasks:
- [ ] Create `/hunts/[id]/edit` page
- [ ] Pre-populate form with existing data
- [ ] Create API: `PATCH /api/hunts/[id]`
- [ ] Restrict access to creator only
- [ ] Allow editing all fields except creator
- [ ] Update hunt on map after save
- [ ] Add confirmation dialog for major changes

**Testing Checklist:**
- [ ] Only creator can access edit page
- [ ] Form pre-fills with data
- [ ] Changes save to database
- [ ] Map updates after save
- [ ] Non-creator gets 403 error

**Deliverables:**
- Edit hunt page
- API endpoint
- Access control

---

### Step 2.5: Sighting Details Page
**Priority:** P2 (Nice to Have)
**Estimated Time:** 4 hours

#### Tasks:
- [ ] Create `/sightings/[id]/page.tsx`
- [ ] Display full-size image(s)
- [ ] Show all details (location, user, time, caption)
- [ ] Show all comments (not collapsed)
- [ ] Add map showing sighting location
- [ ] Link from search grid and feed
- [ ] Add share button (future: social sharing)

**Testing Checklist:**
- [ ] Page loads correctly
- [ ] Images display full-size
- [ ] Comments all visible
- [ ] Map shows correct location
- [ ] Can navigate from search/feed

**Deliverables:**
- Sighting details page
- Full-size image viewer

---

### Step 2.6: User Profile (Other Users)
**Priority:** P1 (Should Have)
**Estimated Time:** 3 hours

#### Tasks:
- [ ] Create `/users/[id]/page.tsx`
- [ ] Display public profile:
  - Avatar, name, bio
  - Sighting count, hunt count
  - Sighting grid
- [ ] Create API: `GET /api/users/[id]`
- [ ] Add link from feed posts (click username)
- [ ] Add link from hunt participants
- [ ] Show "Edit Profile" only on own profile

**Testing Checklist:**
- [ ] Can view other users' profiles
- [ ] Public info displays correctly
- [ ] Grid shows their sightings only
- [ ] Links work from feed/hunts
- [ ] Edit button only on own profile

**Deliverables:**
- Public user profile page
- API endpoint

---

## Phase 3: Enhancement & Polish

**Timeline:** Weeks 7-8
**Status:** 🚧 IN PROGRESS
**Goal:** Improve UX, performance, and add nice-to-have features

### Recent Updates (Oct 14, 2025):
- ✅ **Intelligence Hub Completed**: Three-tab interface with Map Intel, Cosmic Intel, and Expert Intel
- ✅ **Space Weather Integration**: Real-time data from NOAA and NASA DONKI APIs
- ✅ **CME & Solar Flare Monitoring**: Live tracking with detailed analysis pages
- ✅ **Coronal Hole Tracking**: HSS monitoring with predictable 27-day cycles
- ✅ **Aurora Forecast Animations**: Synchronized 30-minute forecasts for both hemispheres
- ✅ **Performance Optimizations**: Reduced map layer rendering overhead
- ✅ **Homepage Redirect**: Default landing now redirects to Intelligence Hub

### Step 3.1: Real-Time Aurora & Space Weather Data Integration ✅
**Priority:** P1 (Should Have)
**Estimated Time:** 16 hours
**Status:** ✅ COMPLETED

#### Tasks:
- [x] Research NOAA Space Weather API and NASA DONKI API
- [x] Integrate NOAA APIs for:
  - KP Index data
  - Solar Wind (magnetic & plasma)
  - GOES X-ray data for solar flares
  - Aurora OVATION model overlay
  - 30-minute aurora forecast animations
- [x] Integrate NASA DONKI API for:
  - CME (Coronal Mass Ejection) data
  - HSS (High Speed Stream) / Coronal Hole data
- [x] Create comprehensive Intelligence Hub with three tabs:
  - **Map Intel Tab**: Interactive map with multiple data layers
  - **Cosmic Intel Tab**: Space weather monitoring cards
  - **Expert Intel Tab**: Advanced resources
- [x] Implement Map Intel features:
  - Aurora Probability Layer (NOAA OVATION)
  - Cloud Cover Layer
  - Light Pollution Layer
  - Day/Night Twilight Zones
  - Hunt Markers & Sighting Markers
  - Current conditions bar (KP, Bz, Wind Speed, Density)
- [x] Implement Cosmic Intel cards:
  - Moon Phase Card with navigation
  - KP Index Card with activity levels
  - Solar Wind Card with Bz/speed/density
  - CME Alerts Card with NASA data
  - Solar Flares Card with classification
  - Coronal Holes Card with HSS monitoring
  - Info Card with educational content
- [x] Implement Expert Intel tab:
  - HD Light Pollution Map (external link)
  - Placeholder cards for future features
- [x] Create detailed forecast page (`/forecast/page.tsx`):
  - Current KP Index display
  - 30-minute synchronized aurora animations
  - Timeline slider and playback controls
  - Upcoming hours forecast chart (6 hours)
  - Long-term forecast chart (6 days)
- [x] Create Solar Flares detail page (`/solar-flares/page.tsx`):
  - Current solar activity with flare class (X/M/C/B/A)
  - Aurora probability calculations
  - Classification guide
  - Recent significant flares history (7 days, C-class+)
  - Auto-refresh every 5 minutes
- [x] Add Light Pollution Map page (`/intelligence/light-pollution-map/page.tsx`):
  - Embedded map with aurora visibility layer
  - Back navigation to Expert Intel
- [x] Implement data fetching with error handling
- [x] Add API key management (NASA API key: NIXvIqoTvk1qIplmptffaH4sQYgTnlDD6bH4kIYM)
- [x] Handle API failures gracefully with fallback states
- [x] Performance optimizations:
  - Lazy initialization of light pollution grid
  - Single-cell rendering for aurora layer
  - Cached twilight zone calculations
  - Reduced subdivisions for better performance

**Testing Checklist:**
- [x] Real KP index displays in Cosmic Intel
- [x] All data cards show current information
- [x] CME and HSS data fetch successfully
- [x] Solar flares page updates every 5 minutes
- [x] Map layers toggle correctly
- [x] Aurora animations play smoothly
- [x] Error handling works when APIs fail
- [x] Navigation between detail pages works
- [x] Mobile and desktop layouts work

**Deliverables:**
- ✅ Complete Intelligence Hub with three tabs
- ✅ Real-time space weather data from NOAA & NASA
- ✅ Detailed forecast page with animations
- ✅ Solar flares detail page
- ✅ Light pollution map integration
- ✅ Seven Cosmic Intel monitoring cards
- ✅ Interactive map with five data layers
- ✅ Comprehensive error handling

---

### Step 3.2: Search & Filter Enhancements
**Priority:** P2 (Nice to Have)
**Estimated Time:** 6 hours

#### Tasks:
- [ ] Add filters to hunt search:
  - Date range picker
  - Distance from user (requires geolocation)
  - Free/Paid toggle
  - Public/Private toggle
- [ ] Implement search on `/search` page:
  - By user name
  - By location
  - By date range
- [ ] Add sort options:
  - Most recent
  - Most liked
  - Nearest
- [ ] Add pagination (infinite scroll)
- [ ] Optimize database queries with indexes

**Testing Checklist:**
- [ ] Filters work independently
- [ ] Filters combine correctly
- [ ] Sort options work
- [ ] Pagination loads more results
- [ ] Performance acceptable with 1000+ records

**Deliverables:**
- Advanced filtering
- Sort options
- Pagination
- Query optimization

---

### Step 3.3: Notifications System (Basic)
**Priority:** P2 (Nice to Have)
**Estimated Time:** 10 hours

#### Tasks:
- [ ] Create Notification model in Prisma:
  - id, userId, type, message, read, createdAt
- [ ] Create API: `GET /api/notifications`
- [ ] Create API: `PATCH /api/notifications/[id]/read`
- [ ] Add notification bell icon to header
- [ ] Show unread count badge
- [ ] Display notification dropdown
- [ ] Send notifications for:
  - Hunt joined
  - Comment on your sighting
  - Like on your sighting
  - Hunt reminder (24h before)
- [ ] Implement notification creation triggers
- [ ] Add "Mark all as read" button

**Testing Checklist:**
- [ ] Notifications created on events
- [ ] Unread count displays
- [ ] Dropdown shows recent notifications
- [ ] Can mark individual as read
- [ ] Can mark all as read
- [ ] Old notifications auto-delete (30 days)

**Deliverables:**
- Notification system
- Database model
- UI components
- Event triggers

---

### Step 3.4: Location Search & Geocoding
**Priority:** P1 (Should Have)
**Estimated Time:** 6 hours

#### Tasks:
- [ ] Integrate OpenStreetMap Nominatim API
- [ ] Create service: `/lib/services/geocoding.ts`
- [ ] Implement search on homepage:
  - User types address
  - Dropdown shows suggestions
  - Click centers map
- [ ] Implement reverse geocoding:
  - Convert lat/long to address
  - Auto-fill location in hunt/sighting forms
- [ ] Add geolocation button (already has UI)
- [ ] Cache geocoding results (reduce API calls)

**Testing Checklist:**
- [ ] Address search returns results
- [ ] Clicking result centers map
- [ ] Reverse geocoding works
- [ ] Geolocation button centers on user
- [ ] Handles API rate limits gracefully

**Deliverables:**
- Address search
- Geocoding service
- Map centering functionality

---

### Step 3.5: Performance Optimization
**Priority:** P1 (Should Have)
**Estimated Time:** 8 hours

#### Tasks:
- [ ] Implement image optimization:
  - Next.js Image component everywhere
  - WebP format conversion
  - Responsive image sizes
  - Lazy loading
- [ ] Optimize database queries:
  - Add indexes on frequently queried fields
  - Use SELECT only needed fields
  - Implement query result caching
- [ ] Code splitting:
  - Dynamic imports for heavy components
  - Route-based code splitting
- [ ] Implement marker clustering on map (>100 markers)
- [ ] Add loading skeletons (instead of spinners)
- [ ] Optimize bundle size:
  - Analyze with `next/bundle-analyzer`
  - Remove unused dependencies
  - Tree-shake libraries

**Testing Checklist:**
- [ ] Lighthouse score >90 on all pages
- [ ] Images load progressively
- [ ] No layout shift (CLS < 0.1)
- [ ] Time to Interactive < 3s on 3G
- [ ] Bundle size < 200KB (gzipped)

**Deliverables:**
- Optimized images
- Faster queries
- Better code splitting
- Improved Core Web Vitals

---

### Step 3.6: Accessibility (A11y)
**Priority:** P1 (Should Have)
**Estimated Time:** 6 hours

#### Tasks:
- [ ] Run accessibility audit (Lighthouse, axe DevTools)
- [ ] Add ARIA labels to all interactive elements
- [ ] Ensure keyboard navigation works:
  - Tab through all elements
  - Enter/Space to activate
  - Escape to close modals
- [ ] Add skip-to-content link
- [ ] Ensure color contrast meets WCAG AA:
  - Text: 4.5:1 minimum
  - Large text: 3:1 minimum
- [ ] Add alt text to all images
- [ ] Make map markers keyboard accessible
- [ ] Test with screen reader (VoiceOver/NVDA)
- [ ] Add focus indicators (not just outline: none)

**Testing Checklist:**
- [ ] Lighthouse A11y score >90
- [ ] Can navigate entire app with keyboard
- [ ] Screen reader announces everything correctly
- [ ] Color contrast passes
- [ ] Focus indicators visible
- [ ] No keyboard traps

**Deliverables:**
- WCAG AA compliance
- Keyboard navigation
- Screen reader support

---

### Step 3.7: Error Handling & Empty States
**Priority:** P1 (Should Have)
**Estimated Time:** 4 hours

#### Tasks:
- [ ] Create error boundary component
- [ ] Design error pages:
  - 404 (Not Found)
  - 500 (Server Error)
  - Network error
- [ ] Add empty states:
  - No sightings on map
  - No hunts on map
  - Empty feed
  - Empty search results
  - Empty profile (no sightings)
- [ ] Add error toasts for failed actions
- [ ] Add loading states for all async operations
- [ ] Handle offline state (show cached data)

**Testing Checklist:**
- [ ] 404 page shows for invalid routes
- [ ] 500 page shows for server errors
- [ ] Empty states guide users (CTA buttons)
- [ ] Errors don't crash app
- [ ] Loading states prevent multiple clicks
- [ ] Offline mode shows appropriate message

**Deliverables:**
- Error pages
- Empty state designs
- Error boundaries
- Loading states

---

### Step 3.8: Mobile Responsiveness
**Priority:** P0 (Must Have)
**Estimated Time:** 6 hours

#### Tasks:
- [ ] Test all pages on mobile devices:
  - iPhone SE (375px)
  - iPhone 14 Pro (393px)
  - iPad (768px)
  - Desktop (1280px+)
- [ ] Fix layout issues:
  - Map height on mobile
  - Bottom nav doesn't overlap content
  - Forms fit on small screens
  - Images don't overflow
- [ ] Optimize touch targets (min 44x44px)
- [ ] Test map interactions on touch:
  - Pinch to zoom
  - Drag to pan
  - Tap markers
- [ ] Optimize font sizes for mobile
- [ ] Test bottom nav on notch devices (iPhone 14)

**Testing Checklist:**
- [ ] All pages usable on 375px width
- [ ] No horizontal scroll
- [ ] Touch targets large enough
- [ ] Map works on touch devices
- [ ] Bottom nav visible but not intrusive
- [ ] Forms submit on mobile

**Deliverables:**
- Mobile-optimized layouts
- Touch-friendly interactions
- Responsive typography

---

## Phase 4: Launch Preparation

**Timeline:** Week 9
**Status:** 🔜 NOT STARTED
**Goal:** Prepare for production launch

### Step 4.1: Vercel Deployment Setup
**Priority:** P0 (Must Have)
**Estimated Time:** 3 hours

#### Tasks:
- [ ] Create Vercel account (if not exists)
- [ ] Connect GitHub repository
- [ ] Configure environment variables in Vercel:
  - DATABASE_URL (use Supabase pooling URL)
  - NEXTAUTH_URL (production URL)
  - NEXTAUTH_SECRET (generate new for production)
  - OAuth credentials (production, not dev)
  - NOAA_API_KEY
- [ ] Set up preview deployments (auto on PR)
- [ ] Configure production branch (main)
- [ ] Test deployment
- [ ] Verify all features work in production

**Testing Checklist:**
- [ ] Production site loads
- [ ] Database connects
- [ ] Login works
- [ ] Map displays
- [ ] All features functional
- [ ] No console errors

**Deliverables:**
- Live production site
- Automatic deployments
- Preview environments

---

### Step 4.2: Update OAuth Redirect URIs
**Priority:** P0 (Must Have)
**Estimated Time:** 1 hour

#### Tasks:
- [ ] Update Google OAuth:
  - Add `https://your-domain.vercel.app/api/auth/callback/google`
  - Keep localhost for dev
- [ ] Update Apple OAuth:
  - Add production redirect URI
- [ ] Update Meta OAuth:
  - Add production redirect URI
  - Set app to "Live" mode (out of dev mode)
- [ ] Test login on production

**Testing Checklist:**
- [ ] Google login works on production
- [ ] Apple login works (if configured)
- [ ] Meta login works (if configured)
- [ ] Redirects back to app correctly

**Deliverables:**
- Updated OAuth configs
- Working production login

---

### Step 4.3: Content Moderation Setup
**Priority:** P1 (Should Have)
**Estimated Time:** 4 hours

#### Tasks:
- [ ] Create admin role in User model
- [ ] Create `/admin` page (only for admins)
- [ ] Add "Report" button to sightings/comments
- [ ] Create Report model:
  - id, reporterId, contentId, contentType, reason, status
- [ ] Create API: `POST /api/reports/create`
- [ ] Create admin interface to:
  - View reports
  - Delete content
  - Ban users
- [ ] Add content guidelines page (`/guidelines`)
- [ ] Add Terms of Service page (`/terms`)
- [ ] Add Privacy Policy page (`/privacy`)

**Testing Checklist:**
- [ ] Non-admins can't access admin page
- [ ] Report button submits reports
- [ ] Admin can view reports
- [ ] Admin can delete content
- [ ] Deleted content removed from all views

**Deliverables:**
- Reporting system
- Admin dashboard
- Legal pages

---

### Step 4.4: Analytics Setup
**Priority:** P1 (Should Have)
**Estimated Time:** 2 hours

#### Tasks:
- [ ] Enable Vercel Analytics (built-in)
- [ ] Add custom event tracking:
  - Hunt created
  - Sighting posted
  - Hunt joined
  - Like/comment actions
- [ ] Set up Google Analytics (optional)
- [ ] Configure conversion goals:
  - User sign-up
  - First hunt created
  - First sighting posted
- [ ] Create analytics dashboard bookmarks

**Testing Checklist:**
- [ ] Events fire correctly
- [ ] Data appears in Vercel dashboard
- [ ] Can track user flows
- [ ] No PII logged

**Deliverables:**
- Analytics configured
- Event tracking
- Dashboard access

---

### Step 4.5: SEO Optimization
**Priority:** P1 (Should Have)
**Estimated Time:** 4 hours

#### Tasks:
- [ ] Create `robots.txt`
- [ ] Create `sitemap.xml` (dynamic with hunts/sightings)
- [ ] Add OpenGraph meta tags to all pages
- [ ] Add Twitter Card meta tags
- [ ] Create `manifest.json` for PWA
- [ ] Add structured data (JSON-LD):
  - Organization
  - Event (for hunts)
  - ImageObject (for sightings)
- [ ] Optimize page titles and descriptions
- [ ] Add canonical URLs
- [ ] Test with Google Search Console

**Testing Checklist:**
- [ ] Sitemap generates correctly
- [ ] OG tags show preview on social media
- [ ] Google can crawl site
- [ ] Structured data validates
- [ ] Appears in search results

**Deliverables:**
- SEO-optimized pages
- Social sharing previews
- Search engine indexing

---

### Step 4.6: Performance Testing
**Priority:** P0 (Must Have)
**Estimated Time:** 4 hours

#### Tasks:
- [ ] Run Lighthouse on all pages
- [ ] Optimize based on Lighthouse suggestions
- [ ] Test with slow 3G network throttling
- [ ] Load test with 100 concurrent users
- [ ] Test database with 10,000+ records
- [ ] Profile server-side rendering performance
- [ ] Check bundle sizes
- [ ] Optimize critical rendering path

**Testing Checklist:**
- [ ] Lighthouse scores >90 on all metrics
- [ ] Pages usable on slow connections
- [ ] No crashes under load
- [ ] Database queries remain fast
- [ ] Time to First Byte < 600ms
- [ ] First Contentful Paint < 1.5s

**Deliverables:**
- Performance report
- Optimizations applied
- Load test results

---

### Step 4.7: Security Audit
**Priority:** P0 (Must Have)
**Estimated Time:** 4 hours

#### Tasks:
- [ ] Review all API endpoints for auth checks
- [ ] Ensure no sensitive data in client-side code
- [ ] Add rate limiting to API routes
- [ ] Implement CSRF protection (NextAuth handles)
- [ ] Add input sanitization for user content
- [ ] Check for SQL injection vulnerabilities
- [ ] Verify HTTPS everywhere
- [ ] Add security headers:
  - Content-Security-Policy
  - X-Frame-Options
  - X-Content-Type-Options
- [ ] Run security scan (npm audit, Snyk)
- [ ] Set up Dependabot for dependency updates

**Testing Checklist:**
- [ ] Can't access others' data without auth
- [ ] Rate limiting prevents abuse
- [ ] No XSS vulnerabilities
- [ ] No CSRF vulnerabilities
- [ ] All dependencies up to date
- [ ] Security headers present

**Deliverables:**
- Security audit report
- Vulnerabilities fixed
- Security headers configured

---

### Step 4.8: Documentation
**Priority:** P1 (Should Have)
**Estimated Time:** 3 hours

#### Tasks:
- [ ] Update README.md with:
  - Project description
  - Setup instructions
  - Environment variables
  - Deployment guide
- [ ] Create CONTRIBUTING.md
- [ ] Document API endpoints (OpenAPI/Swagger)
- [ ] Create user guide:
  - How to post sighting
  - How to create hunt
  - How to join hunt
- [ ] Add code comments to complex logic
- [ ] Create developer onboarding doc

**Testing Checklist:**
- [ ] New developer can set up locally from README
- [ ] All features documented
- [ ] API docs accurate
- [ ] Code comments helpful

**Deliverables:**
- Updated README
- User guide
- API documentation
- Developer docs

---

## Phase 5: Launch & Growth

**Timeline:** Week 10+
**Status:** 🔜 NOT STARTED
**Goal:** Launch to public and iterate based on feedback

### Step 5.1: Soft Launch (Beta)
**Estimated Time:** 1 week

#### Tasks:
- [ ] Recruit 20-50 beta testers
- [ ] Send beta invites
- [ ] Create feedback form
- [ ] Monitor for critical bugs
- [ ] Daily check-ins with beta users
- [ ] Fix critical issues immediately
- [ ] Collect feature requests
- [ ] Iterate based on feedback

**Success Metrics:**
- [ ] 10+ active beta users
- [ ] No critical bugs reported
- [ ] Positive feedback (>4/5 stars)
- [ ] Users creating hunts/sightings

---

### Step 5.2: Public Launch
**Estimated Time:** Launch day

#### Tasks:
- [ ] Announce on social media:
  - Twitter/X
  - Reddit (r/aurora, r/space)
  - Facebook aurora groups
- [ ] Submit to Product Hunt
- [ ] Submit to Hacker News (Show HN)
- [ ] Email aurora-related blogs/sites
- [ ] Create launch video/demo
- [ ] Monitor for traffic spikes
- [ ] Be ready for hotfixes
- [ ] Engage with early users

**Success Metrics:**
- [ ] 100+ sign-ups on launch day
- [ ] 10+ hunts created
- [ ] 20+ sightings posted
- [ ] Featured on Product Hunt
- [ ] Press coverage

---

### Step 5.3: Post-Launch Iteration
**Estimated Time:** Ongoing

#### Tasks:
- [ ] Weekly analytics review
- [ ] Prioritize bug fixes
- [ ] Plan feature roadmap based on usage
- [ ] A/B test key flows
- [ ] Optimize conversion funnels
- [ ] Engage with community
- [ ] Release regular updates
- [ ] Monitor costs (database, hosting)

**Success Metrics:**
- [ ] 70% 30-day retention
- [ ] <5% crash rate
- [ ] Positive app store reviews (when app launched)
- [ ] Growing user base

---

## Appendix A: Development Checklist

### Before Each Commit
- [ ] Code passes TypeScript type checking
- [ ] No ESLint errors
- [ ] Formatted with Prettier
- [ ] Manual testing of changed features
- [ ] No console errors in browser
- [ ] Responsive design tested

### Before Each PR
- [ ] All tests pass
- [ ] New features have tests
- [ ] Documentation updated
- [ ] PR description explains changes
- [ ] Screenshots for UI changes
- [ ] Reviewed own code

### Before Each Deploy
- [ ] Staging environment tested
- [ ] Database migrations run successfully
- [ ] Environment variables updated
- [ ] No breaking changes without migration plan
- [ ] Rollback plan ready
- [ ] Monitoring alerts configured

---

## Appendix B: Priority Definitions

- **P0 (Must Have):** Critical for MVP. Blocks launch if not done.
- **P1 (Should Have):** Important for good UX. Should be in initial launch.
- **P2 (Nice to Have):** Enhances experience. Can be post-launch.
- **P3 (Future):** Great ideas for later. Not in scope for v1.

---

## Appendix C: Estimated Timeline

| Phase | Duration | Cumulative |
|-------|----------|------------|
| Phase 0: Foundation | 1 week | 1 week |
| Phase 1: MVP | 3 weeks | 4 weeks |
| Phase 2: Social Features | 2 weeks | 6 weeks |
| Phase 3: Polish | 2 weeks | 8 weeks |
| Phase 4: Launch Prep | 1 week | 9 weeks |
| **Total to Launch** | **9 weeks** | - |

**Note:** Timeline assumes 1 full-time developer. Adjust based on team size and complexity.

---

## Appendix D: Success Criteria per Phase

### Phase 0 ✅
- [x] Dev environment working
- [x] Database connected
- [x] Authentication working
- [x] Map displaying

### Phase 1 (MVP) ✅
- [x] Users can sign up and onboard
- [x] Map shows sightings and hunts
- [x] Map centers on user's location automatically
- [x] Users can create hunts
- [x] Feed displays sightings with likes/comments
- [x] Profile page functional
- [ ] App deployed to Vercel (ready, pending deployment)

### Phase 2 (Social) 🚧
- [ ] Users can post sightings with images (in progress)
- [x] Users can join hunts from map and details page
- [x] Users can leave hunts
- [x] Hunt details page works with full information
- [x] Privacy controls for private hunts
- [ ] Hunt editing functionality
- [ ] Can view other users' profiles

### Phase 3 (Polish)
- [ ] Real-time aurora data integrated
- [ ] Performance optimized (Lighthouse >90)
- [ ] Fully accessible (WCAG AA)
- [ ] No critical bugs

### Phase 4 (Launch)
- [ ] Production deployment stable
- [ ] Security audit passed
- [ ] Analytics configured
- [ ] Legal pages live
- [ ] Documentation complete

---

**Document End**

*This is a living document. Update as features are completed and priorities shift.*
