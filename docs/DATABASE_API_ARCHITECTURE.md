# Aurora Addict - Database & API Architecture Documentation

**Version**: 1.1
**Last Updated**: October 16, 2025
**Purpose**: Living document to track database schema, API endpoints, external integrations, and architectural decisions

---

## Table of Contents
1. [Database Schema](#database-schema)
2. [API Endpoints Registry](#api-endpoints-registry)
3. [External API Integrations](#external-api-integrations)
4. [Caching Strategy](#caching-strategy)
5. [Data Flow Patterns](#data-flow-patterns)
6. [Architecture Recommendations](#architecture-recommendations)
7. [Change Log](#change-log)

---

## Database Schema

### Core Models

#### User Model
**Table**: `User`
**Purpose**: Core user profile and authentication

| Field | Type | Default | Index | Notes |
|-------|------|---------|-------|-------|
| `id` | String (cuid) | auto | PK | Primary key |
| `name` | String? | null | - | Display name |
| `username` | String? | null | UNIQUE | Handle like @kristabelq |
| `email` | String? | null | UNIQUE | Email for auth |
| `emailVerified` | DateTime? | null | - | Email verification timestamp |
| `image` | String? | null | - | Profile image URL |
| `bio` | String? | null | - | User bio |
| `onboardingComplete` | Boolean | false | - | Onboarding status |
| `instagram` | String? | null | - | Instagram handle (no @) |
| `whatsappNumber` | String? | null | - | WhatsApp with country code |
| `publicEmail` | String? | null | - | Public contact email |
| `stripeAccountId` | String? | null | UNIQUE | Stripe Connect account ID |
| `stripeOnboarded` | Boolean | false | - | Stripe onboarding complete |
| `stripeOnboardedAt` | DateTime? | null | - | Stripe onboarding timestamp |
| **CACHED FIELDS** | | | | **Performance optimization** |
| `cachedSightingsCount` | Int | 0 | - | Total unique nights with sightings |
| `cachedHuntsCreatedCount` | Int | 0 | - | Total hunts created |
| `cachedHuntsJoinedCount` | Int | 0 | - | Total hunts joined |
| `cachedCompletedHuntsCount` | Int | 0 | - | Total COMPLETED hunts |
| `cachedSuccessRate` | Float | 0 | - | Avg success rate (completed hunts only) |
| `cachedLastUpdated` | DateTime | now() | - | Cache update timestamp |
| `createdAt` | DateTime | now() | - | Account creation |
| `updatedAt` | DateTime | auto | - | Last profile update |

**Relations**:
- `accounts[]` → Account (OAuth)
- `sessions[]` → Session (NextAuth)
- `sightings[]` → Sighting
- `hunts[]` → Hunt (created)
- `huntParticipants[]` → HuntParticipant
- `comments[]` → Comment
- `likes[]` → Like
- `following[]` → Follow (users they follow)
- `followers[]` → Follow (their followers)
- `cityBadges[]` → CityBadge

**Cache Update Triggers**:
- `cachedSightingsCount`: When sighting created
- `cachedHuntsCreatedCount`: When hunt created
- `cachedHuntsJoinedCount`: When hunt joined
- `cachedCompletedHuntsCount`: When hunt completes (cron job)
- `cachedSuccessRate`: When hunt completes OR sighting posted to completed hunt

---

#### Sighting Model
**Table**: `Sighting`
**Purpose**: Aurora sighting posts (images/videos with location)

| Field | Type | Default | Index | Notes |
|-------|------|---------|-------|-------|
| `id` | String (cuid) | auto | PK | Primary key |
| `userId` | String | - | YES | Author |
| `huntId` | String? | null | YES | Optional hunt link |
| `caption` | String? | null | - | Post caption |
| `latitude` | Float | - | YES (composite) | GPS latitude |
| `longitude` | Float | - | YES (composite) | GPS longitude |
| `location` | String | - | - | Location name |
| `images` | String[] | [] | - | Full-res image URLs (feed) |
| `thumbnails` | String[] | [] | - | 400x400 thumbnails (grid) |
| `videos` | String[] | [] | - | Video URLs |
| `sightingType` | String | "realtime" | - | "realtime" or "past" |
| `sightingDate` | DateTime? | null | YES | Actual sighting date/time |
| `sightingTime` | String? | null | - | Time component |
| `timezone` | String? | null | - | Sighting timezone |
| `createdAt` | DateTime | now() | YES (composite) | Post creation |
| `updatedAt` | DateTime | auto | - | Last update |

**Relations**:
- `user` → User
- `hunt` → Hunt?
- `comments[]` → Comment
- `likes[]` → Like

**Indexes**:
- `[createdAt]` - Timeline queries
- `[userId]` - User's sightings
- `[huntId]` - Hunt album queries
- `[sightingDate]` - Date-based queries
- `[latitude, longitude]` - Geo queries
- `[userId, createdAt]` - User timeline (composite)

---

#### Hunt Model
**Table**: `Hunt`
**Purpose**: Aurora hunting group events

| Field | Type | Default | Index | Notes |
|-------|------|---------|-------|-------|
| `id` | String (cuid) | auto | PK | Primary key |
| `name` | String | - | - | Hunt name |
| `description` | String? | null | - | Hunt description |
| `userId` | String | - | - | Creator |
| `coverImage` | String? | null | - | 16:9 cover (1600x900) |
| `additionalInfoUrl` | String? | null | - | Additional info link |
| `whatsappNumber` | String? | null | - | Contact WhatsApp |
| `startDate` | DateTime | - | YES | Hunt start |
| `endDate` | DateTime | - | - | Hunt end |
| `timezone` | String? | "UTC" | - | Meeting point timezone |
| `latitude` | Float? | null | YES (composite) | Meeting point lat |
| `longitude` | Float? | null | YES (composite) | Meeting point lng |
| `location` | String? | null | - | Location name |
| `hideLocation` | Boolean | false | - | Hide exact location |
| `isPublic` | Boolean | true | - | Public hunt |
| `hideFromPublic` | Boolean | false | - | Hide from listings |
| `isPaid` | Boolean | false | - | Paid hunt |
| `price` | Float? | null | - | Price amount |
| `capacity` | Int? | null | - | Max participants |
| `allowWaitlist` | Boolean | false | - | Allow waitlist |
| `cancellationPolicy` | String? | null | - | Cancellation policy |
| **CACHED FIELDS** | | | | **Performance optimization** |
| `cachedSuccessRate` | Float? | 0 | - | Success rate: (nights with sightings / total nights) × 100 |
| `cachedSightingsCount` | Int? | 0 | - | Count of unique nights with sightings |
| `cachedUniqueParticipants` | Int? | 0 | - | Count of unique users who posted sightings |
| `cachedStatsLastUpdated` | DateTime? | null | - | Cache update timestamp |
| `createdAt` | DateTime | now() | - | Creation timestamp |
| `updatedAt` | DateTime | auto | - | Last update |

**Relations**:
- `user` → User (creator)
- `participants[]` → HuntParticipant
- `sightings[]` → Sighting

**Indexes**:
- `[startDate]` - Upcoming hunts queries
- `[latitude, longitude]` - Geo queries

**Cached Fields** (for completed hunts):
- `cachedSuccessRate` - Pre-calculated success rate percentage
- `cachedSightingsCount` - Pre-counted unique nights with sightings
- `cachedUniqueParticipants` - Pre-counted unique participants
- `cachedStatsLastUpdated` - Timestamp of last cache update

**Cache Update Triggers**:
- When sighting posted to hunt → `onSightingPostedToHunt(huntId)`
- Future: Daily cron job for recently completed hunts

**Computed Fields** (API only):
- `huntLengthDays` - Days between start and end
- `participants` - Count of confirmed participants
- `waitlistCount` - Count of waitlisted participants
- `isUserParticipant` - Boolean if current user is participating

---

#### HuntParticipant Model
**Table**: `HuntParticipant`
**Purpose**: Many-to-many relationship for hunt participation

| Field | Type | Default | Index | Notes |
|-------|------|---------|-------|-------|
| `id` | String (cuid) | auto | PK | Primary key |
| `huntId` | String | - | - | Hunt reference |
| `userId` | String | - | - | User reference |
| `status` | String | "pending" | - | pending/confirmed/cancelled/waitlisted |
| `paymentStatus` | String? | "pending" | - | Payment tracking |
| `paidAt` | DateTime? | null | - | Payment timestamp |
| `joinedAt` | DateTime | now() | - | Join timestamp |
| `stripePaymentIntentId` | String? | null | UNIQUE | Stripe PaymentIntent ID |
| `stripeCheckoutSessionId` | String? | null | UNIQUE | Stripe Checkout Session ID |
| `paymentAmount` | Float? | null | - | Amount paid |
| `paymentCurrency` | String? | "usd" | - | Currency code |

**Relations**:
- `hunt` → Hunt
- `user` → User

**Unique Constraint**: `[huntId, userId]`

---

#### Comment, Like, Follow Models
**Table**: `Comment`, `Like`, `Follow`
**Purpose**: Social interactions

**Comment**:
- `id`, `content`, `userId`, `sightingId`, `createdAt`, `updatedAt`
- Index: `[sightingId]`

**Like**:
- `id`, `userId`, `sightingId`, `createdAt`
- Unique: `[userId, sightingId]`

**Follow**:
- `id`, `followerId`, `followingId`, `createdAt`
- Unique: `[followerId, followingId]`
- Indexes: `[followerId]`, `[followingId]`

---

#### CityBadge Model
**Table**: `CityBadge`
**Purpose**: Location-based achievement badges

| Field | Type | Notes |
|-------|------|-------|
| `id` | String (cuid) | Primary key |
| `userId` | String | User reference (indexed) |
| `city` | String | City name |
| `country` | String | Country name |
| `countryCode` | String | Flag emoji code (FI, SE, NO) |
| `latitude` | Float | City coordinates |
| `longitude` | Float | City coordinates |
| `earnedAt` | DateTime | Badge earn timestamp |

**Unique Constraint**: `[userId, city, country]`

---

## API Endpoints Registry

### Authentication
| Endpoint | Method | Purpose | Auth Required |
|----------|--------|---------|---------------|
| `/api/auth/[...nextauth]` | GET/POST | NextAuth handler | No |

### User Management
| Endpoint | Method | Purpose | Auth Required | Returns |
|----------|--------|---------|---------------|---------|
| `/api/user/profile` | GET | Get current user profile | Yes | User profile + stats + sightings (12) + huntsMissingSightings |
| `/api/user/profile` | PATCH | Update profile (bio, username, socials) | Yes | Updated user |
| `/api/user/profile/image` | POST | Upload profile image | Yes | Image URL |
| `/api/user/[userId]/profile` | GET | Get public user profile | No | Public profile + sightings |
| `/api/user/[userId]/follow` | POST | Follow user | Yes | Follow record |
| `/api/user/[userId]/badges` | GET | Get user badges | No | CityBadge[] |
| `/api/user/complete-onboarding` | POST | Complete onboarding | Yes | Updated user |
| `/api/users/[id]` | GET | Get user by ID | No | User data |
| `/api/users/[id]/follow` | POST/DELETE | Follow/unfollow user | Yes | Status |
| `/api/users/search` | GET | Search users | No | User[] |
| `/api/users/check-username` | GET | Check username availability | Yes | { available: boolean } |
| `/api/users/username` | POST | Update username | Yes | Updated user |
| `/api/users/following` | GET | Get users current user follows | Yes | User[] |
| `/api/users/followers` | GET | Get current user's followers | Yes | User[] |

**Profile API Data Flow**:
```
GET /api/user/profile
├─ Query: User + cached fields + sightings (12) + _count
├─ Compute: huntsMissingSightings (async, error-safe)
└─ Returns: {
     id, name, username, email, image, bio, socials,
     sightingsCount (cached),
     huntsCount (cached),
     huntsParticipatedCount (cached),
     completedHuntsCount (cached),
     averageSuccessRate (cached),
     followersCount, followingCount,
     huntsMissingSightings[],
     sightings[]
   }
```

---

### Sighting Management
| Endpoint | Method | Purpose | Auth Required | Returns |
|----------|--------|---------|---------------|---------|
| `/api/sightings/create` | POST | Create sighting | Yes | Created sighting |
| `/api/sightings/[id]` | GET | Get sighting details | No | Sighting + comments |
| `/api/sightings/[id]` | PATCH | Update sighting | Yes (owner) | Updated sighting |
| `/api/sightings/[id]` | DELETE | Delete sighting | Yes (owner) | Success status |
| `/api/sightings/[id]/comments` | GET | Get sighting comments | No | Comment[] |
| `/api/sightings/[id]/comments` | POST | Add comment | Yes | Created comment |
| `/api/sightings/feed` | GET | Get feed sightings (50) | Optional | Sighting[] + isLiked |
| `/api/sightings/all` | GET | Get all sightings | No | Sighting[] |
| `/api/sightings/recent` | GET | Get recent sightings | No | Sighting[] |
| `/api/sightings/like` | POST | Like/unlike sighting | Yes | Like status |
| `/api/sightings/locations` | GET | Get unique locations | No | Location[] |
| `/api/sightings/search` | GET | Search sightings | No | Sighting[] |
| `/api/sightings/filters` | GET | Get filter options | No | Filters metadata |

**Feed API Data Flow**:
```
GET /api/sightings/feed
├─ Query: Sighting + user + _count + likes (if auth)
├─ Order: createdAt DESC
├─ Limit: 50
└─ Returns: Sighting[] with isLiked computed
```

---

### Hunt Management
| Endpoint | Method | Purpose | Auth Required | Returns |
|----------|--------|---------|---------------|---------|
| `/api/hunts/create` | POST | Create hunt | Yes | Created hunt |
| `/api/hunts/[id]` | GET | Get hunt details | No | Hunt + participants + sightings |
| `/api/hunts/[id]` | PATCH | Update hunt | Yes (owner) | Updated hunt |
| `/api/hunts/[id]` | DELETE | Delete hunt | Yes (owner) | Success status |
| `/api/hunts/[id]/join` | POST | Join hunt | Yes | HuntParticipant |
| `/api/hunts/[id]/leave` | POST | Leave hunt | Yes | Success status |
| `/api/hunts/[id]/sightings` | GET | Get hunt sightings | No | Sighting[] |
| `/api/hunts/[id]/requests/[userId]` | PATCH | Approve/reject join request | Yes (owner) | Updated participant |
| `/api/hunts/[id]/payments/[userId]` | PATCH | Mark payment status | Yes (owner) | Updated participant |
| `/api/hunts/upcoming` | GET | Get upcoming hunts (50) | Optional | Hunt[] + computed fields |
| `/api/hunts/my-hunts` | GET | Get user's hunts | Yes | Hunt[] |
| `/api/hunts/chats` | GET | Get hunt chat info | Yes | Chat[] |

**Upcoming Hunts API Data Flow**:
```
GET /api/hunts/upcoming
├─ Query: Hunt (hideFromPublic=false) + user + participants + _count
├─ For each hunt (synchronous map):
│  ├─ If completed (endDate < now):
│  │  ├─ Calculate huntLengthDays
│  │  └─ Read cached stats (NO DATABASE QUERY):
│  │     ├─ successRate: hunt.cachedSuccessRate
│  │     ├─ sightingsCount: hunt.cachedSightingsCount
│  │     └─ uniqueParticipants: hunt.cachedUniqueParticipants
│  ├─ Compute waitlistCount (filter participants)
│  └─ Compute isUserParticipant (check userId in participants)
├─ Order: startDate ASC
├─ Limit: 50
└─ Returns: Hunt[] with cached stats + date strings
```

**✅ PERFORMANCE OPTIMIZED**: Hunt success rates are pre-cached in database. N+1 query pattern eliminated.

---

### Stripe Integration
| Endpoint | Method | Purpose | Auth Required |
|----------|--------|---------|---------------|
| `/api/stripe/connect-onboarding` | POST | Start Stripe Connect onboarding | Yes |
| `/api/stripe/create-checkout` | POST | Create checkout session | Yes |
| `/api/stripe/webhook` | POST | Handle Stripe webhooks | No (webhook) |

---

### Utility APIs
| Endpoint | Method | Purpose | Auth Required | Returns |
|----------|--------|---------|---------------|---------|
| `/api/stats/current` | GET | Get aurora stats | No | { kp, cloudCover, auroraForecast } (MOCK) |
| `/api/timezone` | GET | Get timezone info | No | Timezone data |
| `/api/geocode/reverse` | GET | Reverse geocode coords | No | Location data |
| `/api/light-pollution/[z]/[x]/[y]` | GET | Light pollution tile | No | Tile image |
| `/api/camera-proxy` | GET | Proxy webcam images | No | Image data |

---

## External API Integrations

### Third-Party Services

#### 1. **Stripe** (Payment Processing)
**Purpose**: Payment processing and Connect for hunt creators
**Environment Variables**:
- `STRIPE_SECRET_KEY` - Stripe API secret
- `STRIPE_WEBHOOK_SECRET` - Webhook signature verification
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Client-side key

**Endpoints Using**:
- `/api/stripe/*`
- Payment flows in hunt join

**Data Stored**:
- `User.stripeAccountId` - Connect account
- `HuntParticipant.stripePaymentIntentId` - Payment tracking
- `HuntParticipant.stripeCheckoutSessionId` - Checkout session

---

#### 2. **Mapbox** (Maps & Geocoding)
**Purpose**: Maps, location search, reverse geocoding
**Environment Variables**:
- `NEXT_PUBLIC_MAPBOX_TOKEN` - Mapbox API token

**Endpoints Using**:
- `/api/sightings/locations`
- `/api/geocode/reverse`

**Usage**: Map rendering, location autocomplete, coordinate conversion

---

#### 3. **NOAA / Aurora Forecast APIs** (Future)
**Purpose**: Real-time aurora forecast data
**Current Status**: MOCK DATA in `/api/stats/current`

**Planned Integration**:
- KP Index from NOAA
- Solar wind data
- Aurora forecast predictions
- Cloud cover from weather APIs

**Recommendation**: Create dedicated cache table for aurora forecast data

---

#### 4. **NextAuth / OAuth Providers**
**Purpose**: Authentication
**Environment Variables**:
- `NEXTAUTH_URL` - App URL
- `NEXTAUTH_SECRET` - JWT secret
- OAuth provider keys (Google, etc.)

**Data Stored**:
- `Account` - OAuth accounts
- `Session` - Active sessions

---

## Caching Strategy

### Current Implementation

#### Database-Level Caching (User Stats)
**Purpose**: Reduce expensive aggregation queries
**Location**: `User` model cached fields

| Cache Field | Update Trigger | Calculated From |
|-------------|---------------|-----------------|
| `cachedSightingsCount` | Sighting create | Count unique nights with sightings |
| `cachedHuntsCreatedCount` | Hunt create | Count hunts where userId = creator |
| `cachedHuntsJoinedCount` | Hunt join | Count hunt participants where status=confirmed |
| `cachedCompletedHuntsCount` | Hunt completion (cron) | Count hunts where endDate < now |
| `cachedSuccessRate` | Hunt completion OR sighting post | Average success rate of completed hunts |
| `cachedLastUpdated` | Any cache update | Current timestamp |

**Utility Functions**: `/src/lib/userStats.ts`
- `calculateHuntSuccessRate(hunt)` - Calculate single hunt success
- `recalculateUserSuccessRate(userId)` - Recalculate user stats
- `getCompletedHuntsMissingSightings(userId)` - Find hunts needing sightings
- `recalculateSuccessRatesForUsers(userIds)` - Batch recalculation

**Performance Improvement**:
- Profile loading: **900ms → 150-200ms (75%+ faster)**
- Reduced DB queries: **3-5 → 1 per request (70-80% reduction)**

---

### Database-Level Caching (Hunt Stats)
**Purpose**: Eliminate N+1 query pattern for hunt success rates
**Location**: `Hunt` model cached fields

| Cache Field | Update Trigger | Calculated From |
|-------------|---------------|-----------------|
| `cachedSuccessRate` | Sighting post to hunt | (unique nights with sightings / total hunt nights) × 100 |
| `cachedSightingsCount` | Sighting post to hunt | Count unique nights with sightings |
| `cachedUniqueParticipants` | Sighting post to hunt | Count unique users who posted sightings |
| `cachedStatsLastUpdated` | Any cache update | Current timestamp |

**Utility Functions**: `/src/lib/huntStats.ts`
- `calculateHuntSuccessRate(hunt)` - Calculate single hunt success
- `recalculateHuntSuccessRate(huntId)` - Recalculate and update cache
- `onSightingPostedToHunt(huntId)` - Trigger cache update (fire-and-forget)
- `getHuntStatistics(huntId)` - Get stats with cache fallback
- `getCompletedHuntsNeedingRecalculation()` - Find hunts needing updates

**Performance Improvement**:
- `/api/hunts/upcoming` response time: **2304ms → 159-294ms (75%+ faster)**
- Eliminated N+1 query pattern completely
- Scales well as completed hunts grow (O(1) instead of O(N))

---

### Recommended Future Caching

#### 1. **Aurora Forecast Cache** (FUTURE)
**Problem**: External API rate limits for aurora forecast data
**Impact**: Can't query on every page load

**Recommendation**: Create `AuroraForecast` model
```prisma
model AuroraForecast {
  id                String   @id @default(cuid())
  timestamp         DateTime @unique
  kpIndex           Float
  kpForecast3Hour   Float
  kpForecast6Hour   Float
  solarWindSpeed    Float?
  solarWindDensity  Float?
  bz                Float?   // Interplanetary magnetic field
  auroraOvalLatitude Float?
  createdAt         DateTime @default(now())

  @@index([timestamp])
}
```

**Update Strategy**:
- Cron job every 15 minutes
- Store last 24 hours of data
- API serves from cache, falls back to external if stale

---

#### 2. **Sighting Location Aggregates** (OPTIMIZATION)
**Problem**: `/api/sightings/locations` might become slow with many sightings
**Current**: Real-time aggregation query

**Recommendation**: Create `SightingLocation` aggregate table
```prisma
model SightingLocationAggregate {
  id              String   @id @default(cuid())
  location        String   @unique
  latitude        Float
  longitude       Float
  sightingsCount  Int      @default(1)
  lastSightingAt  DateTime
  updatedAt       DateTime @updatedAt

  @@index([location])
  @@index([sightingsCount])
}
```

**Update Trigger**: When sighting created, increment or create location record

---

## Data Flow Patterns

### Pattern 1: User Profile Loading (Current)
```
Client Request → /api/user/profile
    ↓
[Auth Check]
    ↓
Single DB Query:
  - User record
  - Cached stats (instant)
  - Last 12 sightings
  - Relation counts
    ↓
Async Compute (error-safe):
  - Completed hunts missing sightings
    ↓
Response:
  - Profile data
  - Cached stats
  - Sightings array
  - Reminder banner data
```

**Optimization**: ✅ Excellent - uses caching, single query, async non-blocking compute

---

### Pattern 2: Hunt Feed Loading (Current - OPTIMIZED ✅)
```
Client Request → /api/hunts/upcoming
    ↓
DB Query (50 hunts):
  - Hunt records
  - Creator data
  - Participants + status
  - Participant counts
    ↓
For EACH hunt (synchronous map):
  ├─ Calculate hunt length
  ├─ Read cached stats (instant) ← NO DATABASE QUERY
  └─ Compute waitlist/participant info
    ↓
Response: Hunt[] with cached stats
```

**Optimization**: ✅ Excellent - uses cached success rates, eliminates N+1 pattern, scales well

---

### Pattern 3: Sighting Feed Loading (Current)
```
Client Request → /api/sightings/feed
    ↓
Single DB Query:
  - 50 sightings (ordered by date)
  - User data
  - Like counts
  - Comment counts
  - User's like status (if auth)
    ↓
Transform:
  - Add isLiked field
  - Remove raw likes array
    ↓
Response: Sighting[] with computed isLiked
```

**Optimization**: ✅ Good - single query with includes, no N+1

---

## Architecture Recommendations

### Recommendation 1: Separate Aurora Forecast Service (FUTURE)

**Current State**: Mock data in `/api/stats/current`

**Proposed Architecture**:
```
External APIs (NOAA, Weather)
    ↓
Serverless Cron (every 15 min)
    ↓
AuroraForecast Table (cache)
    ↓
Internal API: /api/aurora/forecast
    ↓
Client Components
```

**Benefits**:
- ✅ Respect external API rate limits
- ✅ Instant response times
- ✅ Historical forecast data
- ✅ Can calculate forecast accuracy over time

**Implementation Priority**: MEDIUM (when real aurora data needed)

---

### Recommendation 2: Hunt Success Rate Caching ✅ COMPLETED

**Status**: ✅ Implemented on October 16, 2025

**Implementation**:
1. ✅ Added 4 cached fields to `Hunt` model
2. ✅ Created `/src/lib/huntStats.ts` with utility functions
3. ✅ Updated `/api/hunts/upcoming` to use cached stats
4. ✅ Added automatic cache update trigger in sighting creation
5. ✅ Backfilled 2 existing completed hunts

**Results**:
- ✅ Eliminated N+1 query pattern completely
- ✅ /api/hunts/upcoming response time: 2304ms → 159-294ms (75%+ faster)
- ✅ Scales well as completed hunts grow (O(1) instead of O(N))
- ✅ Fire-and-forget cache updates don't block API responses

**Files Created**:
- `/src/lib/huntStats.ts` - Hunt stats utility functions (278 lines)
- `/scripts/add-hunt-stats-columns.ts` - Migration script
- `/scripts/backfill-hunt-stats.ts` - Backfill script

**Files Modified**:
- `/prisma/schema.prisma` - Added 4 cached fields to Hunt model
- `/src/app/api/hunts/upcoming/route.ts` - Uses cached stats
- `/src/app/api/sightings/create/route.ts` - Triggers cache update

---

### Recommendation 3: API Response Caching with Next.js (FUTURE)

**Proposed**: Use Next.js route cache for public endpoints

**Candidates for Caching**:
- `/api/hunts/upcoming` - 5 min cache (revalidate on hunt update)
- `/api/sightings/feed` - 2 min cache (revalidate on sighting create)
- `/api/aurora/forecast` - 15 min cache (revalidate on data fetch)

**Implementation**:
```typescript
export const revalidate = 300; // 5 minutes

export async function GET() {
  // ... endpoint logic
}
```

**Benefits**:
- ✅ Reduced database load
- ✅ Faster response times
- ✅ Built-in to Next.js 15

**Implementation Priority**: LOW (database caching more impactful)

---

### Recommendation 4: Keep Current Separation of Concerns ✅

**Your Question**: "Think about whether it is a good option to keep hunts, profiles and api pulled data that we will store for future use independently and use api to call for the data to increase efficiency."

**Analysis**:

**Current Architecture** (Good ✅):
```
Database (Source of Truth)
    ↓
API Layer (/api/*) - Business logic, auth, data transformation
    ↓
Client Components - UI rendering, user interactions
```

**Why This Is Correct**:
1. ✅ **Single Source of Truth**: Database is authoritative
2. ✅ **Clear Boundaries**: Database → API → UI (unidirectional flow)
3. ✅ **Cacheable**: Can add caching at any layer
4. ✅ **Scalable**: Can add Redis, CDN, or API caching without refactoring
5. ✅ **Security**: API layer enforces auth and permissions
6. ✅ **Type Safety**: Prisma schema → TypeScript types → API → Client

**Do NOT**:
- ❌ Store duplicate data in separate "storage tables" for profiles/hunts
- ❌ Create separate databases for different features
- ❌ Bypass API layer to query database directly from client

**DO**:
- ✅ Add cached computed fields to existing models (already done for User)
- ✅ Add hunt success rate caching to Hunt model
- ✅ Create dedicated cache tables for EXTERNAL data (aurora forecast)
- ✅ Use API layer for all data access
- ✅ Add response caching at API level (Next.js revalidate)

**Rationale**: Your current architecture is solid. The performance improvements come from **smart caching within the existing structure**, not from separating data stores.

---

### Recommendation 5: Implement Cache Invalidation Strategy

**Problem**: Cached data can become stale

**Proposed Strategy**:

**Manual Invalidation** (for cached fields):
```typescript
// When sighting posted to completed hunt
await recalculateUserSuccessRate(userId);
await recalculateHuntSuccessRate(huntId);
```

**Scheduled Recalculation** (cron job):
```typescript
// Daily at 3 AM: Recalculate all completed hunts
// scripts/recalculate-stats.ts
async function dailyStatsRecalculation() {
  // Find hunts completed in last 7 days
  const recentlyCompleted = await prisma.hunt.findMany({
    where: {
      endDate: {
        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        lt: new Date()
      }
    }
  });

  // Recalculate hunt success rates
  for (const hunt of recentlyCompleted) {
    await recalculateHuntSuccessRate(hunt.id);
  }

  // Recalculate user stats for participants
  const userIds = [...new Set(recentlyCompleted.flatMap(h => h.participants.map(p => p.userId)))];
  await recalculateSuccessRatesForUsers(userIds);
}
```

**Admin Endpoint** (for debugging):
```typescript
// POST /api/admin/recalculate-stats
// Trigger manual recalculation for specific user/hunt
```

---

## Change Log

### October 16, 2025 - Initial Documentation
**Created By**: Architecture Review
**Changes**:
- Documented all database models and fields
- Mapped all API endpoints
- Identified external integrations
- Analyzed current caching strategy
- Provided architectural recommendations

**Key Findings**:
- ✅ User stats caching implemented successfully (75% performance improvement)
- ⚠️ Hunt success rate calculation needs caching (current bottleneck)
- ✅ Current architecture is sound - do not separate data stores
- 📋 Future: Implement aurora forecast caching when real API integrated

---

### October 15, 2025 - User Stats Caching System
**Implemented By**: Development Team
**Changes**:
- Added 6 cached fields to `User` model
- Created `/src/lib/userStats.ts` utility functions
- Updated `/api/user/profile` to use cached stats
- Added graceful degradation for backward compatibility
- Implemented `getCompletedHuntsMissingSightings()` for reminder banner

**Database Migrations**:
- `ALTER TABLE "User" ADD COLUMN "cachedCompletedHuntsCount" INTEGER`
- `ALTER TABLE "User" ADD COLUMN "cachedSuccessRate" DOUBLE PRECISION`
- `ALTER TABLE "User" ADD COLUMN "cachedLastUpdated" TIMESTAMP(3)`

**Performance Results**:
- Profile loading: 900ms → 150-200ms (75-78% improvement)
- Database queries: 3-5 → 1 per request (70-80% reduction)

---

### October 15, 2025 - Hunt Loading Fixes
**Fixed By**: Development Team
**Changes**:
- Added missing `cancellationPolicy` column to `Hunt` table
- Fixed duplicate `participants` field in `/api/hunts/upcoming`

**Database Migrations**:
- `ALTER TABLE "Hunt" ADD COLUMN "cancellationPolicy" TEXT`

**Issues Resolved**:
- Hunt endpoints returning 500 errors
- Prisma validation errors on hunt queries

---

### October 16, 2025 - Hunt Stats Caching System
**Implemented By**: Development Team
**Changes**:
- Added 4 cached fields to `Hunt` model
- Created `/src/lib/huntStats.ts` utility functions (278 lines)
- Updated `/api/hunts/upcoming` to use cached stats
- Added automatic cache update trigger in sighting creation
- Implemented migration and backfill scripts

**Database Migrations**:
- `ALTER TABLE "Hunt" ADD COLUMN "cachedSuccessRate" DOUBLE PRECISION DEFAULT 0`
- `ALTER TABLE "Hunt" ADD COLUMN "cachedSightingsCount" INTEGER DEFAULT 0`
- `ALTER TABLE "Hunt" ADD COLUMN "cachedUniqueParticipants" INTEGER DEFAULT 0`
- `ALTER TABLE "Hunt" ADD COLUMN "cachedStatsLastUpdated" TIMESTAMP(3)`

**Performance Results**:
- `/api/hunts/upcoming` response time: 2304ms → 159-294ms (75%+ improvement)
- Eliminated N+1 query pattern completely
- Changed from async `Promise.all()` to synchronous `.map()`
- Scales well as completed hunts grow (O(1) instead of O(N))

**Cache Update Triggers**:
- Automatic: When sighting posted to hunt (`onSightingPostedToHunt()`)
- Future: Daily cron job for recently completed hunts

---

## Next Steps

### Immediate (Next Sprint)
1. **Add Daily Cron Job** (MEDIUM PRIORITY)
   - Schedule daily recalculation for recently completed hunts
   - Implement serverless function or GitHub Actions workflow
   - Ensures cache stays fresh even without new sightings

2. **Monitor Cache Performance** (LOW PRIORITY)
   - Track cache hit rates
   - Monitor hunt stats update logs
   - Add metrics dashboard

### Future (Q1 2026)
1. **Aurora Forecast Integration**
   - Create AuroraForecast model
   - Integrate NOAA API
   - Implement 15-min refresh cron job
   - Update /api/stats/current to use cached data

2. **Location Aggregates** (if needed)
   - Monitor /api/sightings/locations performance
   - Implement SightingLocationAggregate if query becomes slow

3. **API Response Caching**
   - Add Next.js revalidate to public endpoints
   - Implement cache invalidation on mutations

---

**Document Maintenance**: Update this document whenever:
- Database schema changes (new models, fields, indexes)
- API endpoints added, modified, or removed
- External integrations added
- Caching strategy changes
- Performance issues identified or resolved

---

**End of Document**
