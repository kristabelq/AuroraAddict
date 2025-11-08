# Product Design Review (PDR)
## Accommodation Room Types & Affiliate Monetization

**Version:** 1.0
**Date:** 2025-10-29
**Status:** Draft - Pending Implementation
**Owner:** Aurora Addict Platform
**Related:** [Affiliate Research Document](./ACCOMMODATION_AFFILIATE_RESEARCH.md)

---

## Executive Summary

Enable accommodation businesses to create and manage their own room types (room descriptions, photos, pricing, amenities) while maintaining platform control over monetization through affiliate link injection.

### Goals
- **Business Goal:** Allow accommodation businesses to showcase their offerings, increasing engagement and bookings
- **Monetization Goal:** Earn 4-8% commission on bookings via affiliate links
- **User Goal:** Provide travelers with detailed accommodation information and easy booking options

### Key Decisions
1. ✅ Businesses create/edit room types themselves
2. ✅ Businesses can provide their Booking.com/Airbnb URLs
3. ✅ Platform automatically injects affiliate parameters
4. ❌ Businesses CANNOT edit final affiliate links shown to users

### Success Metrics
- 80% of accommodation businesses add at least 2 room types within first month
- 20% CTR (click-through rate) on booking buttons
- 5% conversion rate (clicks → actual bookings)
- €1,500/month in affiliate commissions from accommodations

---

## Table of Contents

1. [User Stories](#user-stories)
2. [Database Schema](#database-schema)
3. [Affiliate Link Injection](#affiliate-link-injection-mechanism)
4. [API Endpoints](#api-endpoints)
5. [Frontend Implementation](#frontend-implementation)
6. [Security & Validation](#security--validation)
7. [Edge Cases](#edge-cases--solutions)
8. [Analytics & Reporting](#analytics--reporting)
9. [Implementation Timeline](#implementation-timeline)
10. [Open Questions](#open-questions--decisions-needed)
11. [Success Criteria](#success-criteria)
12. [Risks & Mitigation](#risks--mitigation)

---

## User Stories

### As an Accommodation Business Owner
```
✓ I want to add room types with photos, so travelers can see my offerings
✓ I want to edit room details (name, capacity, price, amenities), so info stays current
✓ I want to provide my Booking.com URL, so travelers can book directly
✓ I want to see how many people view my rooms, so I can measure ROI
```

### As a Platform Admin (You)
```
✓ I want to verify affiliate parameters are injected, so I earn commissions
✓ I want to track affiliate clicks, so I can measure revenue
✓ I want to validate booking URLs, so businesses don't add broken links
✓ I want to approve room types (optional), so quality is maintained
```

### As a Traveler
```
✓ I want to see all room options, so I can choose the best fit
✓ I want to see prices and amenities, so I can compare
✓ I want to book with one click, so the process is seamless
✓ I want to trust the booking links, so I feel secure
```

---

## Database Schema

### RoomType Model

```prisma
model RoomType {
  id                String   @id @default(cuid())
  businessId        String   // FK to User (where userType = 'business')
  business          User     @relation(fields: [businessId], references: [id], onDelete: Cascade)

  // Business-editable fields
  name              String   // "Glass Igloo", "Aurora Cabin"
  description       String?  @db.Text
  capacity          Int      // Number of guests
  priceFrom         Float?   // Starting price per night (optional)
  currency          String   @default("EUR")

  // Images
  images            String[] // URLs to room photos (max 10)
  coverImage        String?  // Primary image

  // Amenities
  amenities         String[] // ["Private Sauna", "Heated Glass Roof", "WiFi"]

  // Booking URLs (business provides, we inject affiliate params)
  bookingComUrl     String?  // Original URL from business
  agodaUrl          String?  // Original URL from business
  directBookingUrl  String?  // Business's own booking system

  // Platform-controlled (businesses CANNOT edit)
  affiliateLinks    Json?    // Final URLs with our affiliate codes
  /*
    {
      "booking": "https://booking.com/...?aid=YOUR_ID",
      "agoda": "https://agoda.com/...?cid=YOUR_ID",
      "direct": "https://business.com/book"
    }
  */

  // Status
  isActive          Boolean  @default(true)
  approvalStatus    String   @default("approved") // 'pending' | 'approved' | 'rejected'
  rejectionReason   String?

  // Ordering
  displayOrder      Int      @default(0) // For sorting rooms

  // Analytics
  viewCount         Int      @default(0)
  clickCount        Int      @default(0)

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([businessId, isActive])
  @@index([approvalStatus])
}

model AffiliateClick {
  id                String   @id @default(cuid())

  // What was clicked
  businessId        String
  roomTypeId        String?  // Optional: specific room
  platform          String   // 'booking' | 'agoda' | 'direct'
  destinationUrl    String   // The affiliate URL

  // Who clicked
  userId            String?  // If logged in
  sessionId         String?  // Anonymous tracking

  // Context
  sourceUrl         String?  // Where they came from
  deviceType        String?  // 'mobile' | 'desktop'

  // Conversion tracking (updated via webhook if available)
  converted         Boolean  @default(false)
  conversionValue   Float?
  conversionDate    DateTime?

  clickedAt         DateTime @default(now())

  @@index([businessId, clickedAt])
  @@index([platform])
  @@index([roomTypeId])
}
```

---

## Affiliate Link Injection Mechanism

### URL Parsing & Injection Logic

```typescript
// /lib/affiliate-injector.ts

interface AffiliateConfig {
  platform: 'booking' | 'agoda' | 'expedia';
  affiliateId: string;
  paramName: string; // 'aid' for Booking, 'cid' for Agoda
}

const AFFILIATE_CONFIGS: Record<string, AffiliateConfig> = {
  booking: {
    platform: 'booking',
    affiliateId: process.env.BOOKING_AFFILIATE_ID!,
    paramName: 'aid'
  },
  agoda: {
    platform: 'agoda',
    affiliateId: process.env.AGODA_AFFILIATE_ID!,
    paramName: 'cid'
  },
  expedia: {
    platform: 'expedia',
    affiliateId: process.env.EXPEDIA_AFFILIATE_ID!,
    paramName: 'AFFID'
  }
};

/**
 * Inject affiliate parameters into booking URL
 * Handles existing parameters, preserves business's tracking codes
 */
export function injectAffiliateParams(
  originalUrl: string,
  platform: 'booking' | 'agoda' | 'expedia'
): string | null {
  try {
    const config = AFFILIATE_CONFIGS[platform];
    if (!config) return null;

    const url = new URL(originalUrl);

    // Validate domain
    if (!isValidDomain(url.hostname, platform)) {
      throw new Error(`Invalid domain for ${platform}`);
    }

    // Check if affiliate param already exists
    if (url.searchParams.has(config.paramName)) {
      // Remove existing affiliate param (prevent business from using their own)
      url.searchParams.delete(config.paramName);
    }

    // Inject our affiliate ID
    url.searchParams.set(config.paramName, config.affiliateId);

    // Add tracking parameter (optional)
    url.searchParams.set('label', 'aurora-addict');

    return url.toString();
  } catch (error) {
    console.error('Failed to inject affiliate params:', error);
    return null;
  }
}

/**
 * Validate URL domain matches platform
 */
function isValidDomain(hostname: string, platform: string): boolean {
  const validDomains: Record<string, string[]> = {
    booking: ['booking.com', 'www.booking.com'],
    agoda: ['agoda.com', 'www.agoda.com', 'agoda.fi'],
    expedia: ['expedia.com', 'www.expedia.com', 'expedia.fi']
  };

  return validDomains[platform]?.some(domain =>
    hostname === domain || hostname.endsWith(`.${domain}`)
  ) || false;
}

/**
 * Extract platform from URL
 */
export function detectPlatform(url: string): 'booking' | 'agoda' | 'expedia' | 'direct' {
  try {
    const hostname = new URL(url).hostname.toLowerCase();

    if (hostname.includes('booking.com')) return 'booking';
    if (hostname.includes('agoda.com')) return 'agoda';
    if (hostname.includes('expedia.com')) return 'expedia';

    return 'direct';
  } catch {
    return 'direct';
  }
}
```

---

## API Endpoints

### Room Type Management (Business Users)

**POST /api/business/room-types**
```typescript
// Create new room type
Request Body:
{
  "name": "Glass Igloo",
  "description": "Luxury igloo with heated glass roof",
  "capacity": 2,
  "priceFrom": 299,
  "amenities": ["Heated Glass Roof", "Private Bathroom", "WiFi"],
  "images": ["url1", "url2"],
  "bookingComUrl": "https://www.booking.com/hotel/fi/arctic-glass-igloo.html",
  "agodaUrl": "https://www.agoda.com/rooms/12345678",
  "directBookingUrl": "https://arcticigloo.com/book"
}

Response:
{
  "id": "clxxx",
  "affiliateLinks": {
    "booking": "https://www.booking.com/hotel/fi/arctic-glass-igloo.html?aid=YOUR_ID&label=aurora-addict",
    "agoda": "https://www.agoda.com/rooms/12345678?cid=YOUR_ID",
    "direct": "https://arcticigloo.com/book"
  },
  "approvalStatus": "approved"
}
```

**PUT /api/business/room-types/[id]**
- Update existing room type
- Affiliate links are re-processed on every update

**DELETE /api/business/room-types/[id]**
- Soft delete (set isActive = false)

**GET /api/business/room-types**
- List all room types for authenticated business

---

### Public Endpoints

**GET /api/businesses/[id]**
```typescript
// Enhanced to include room types
Response:
{
  // ... existing business data
  "roomTypes": [
    {
      "id": "clxxx",
      "name": "Glass Igloo",
      "description": "...",
      "capacity": 2,
      "priceFrom": 299,
      "currency": "EUR",
      "images": [...],
      "amenities": [...],
      // NOTE: Original URLs NOT exposed, only affiliate links
      "bookingOptions": [
        { "platform": "booking", "label": "Booking.com" },
        { "platform": "agoda", "label": "Agoda" },
        { "platform": "direct", "label": "Book Direct" }
      ]
    }
  ]
}
```

**POST /api/affiliate/track**
```typescript
// Track affiliate click (called from frontend)
Request Body:
{
  "businessId": "clxxx",
  "roomTypeId": "clxxx",
  "platform": "booking"
}

Response:
{
  "url": "https://www.booking.com/...?aid=YOUR_ID"
}
// Frontend opens URL in new tab
```

---

## Frontend Implementation

### Business Dashboard - Room Type Manager

**Route:** `/business/profile/rooms`

Key features:
- Grid view of all room types
- Add/Edit room type modal
- Image uploader (max 10 images)
- Amenity selector (multi-select)
- URL input with validation
- Analytics (views, clicks per room)

### Public Business Profile - Room Display

**Route:** `/businesses/[id]`

Key features:
- Room type cards with cover image
- Price badge ("From €299/night")
- Capacity and amenities display
- Booking buttons (Booking.com, Agoda, Direct)
- Click tracking on booking buttons
- Responsive grid layout

---

## Two-Page Architecture (APPROVED APPROACH)

### Overview

Instead of displaying all room types directly on the business profile page, we use a **two-page progressive disclosure** pattern:

1. **Page 1: Business Overview** (`/businesses/[id]`) - Quick preview with CTA
2. **Page 2: Dedicated Category Page** (`/businesses/[id]/rooms`) - Full details

### Why This Approach?

| Aspect | Single Page | Two-Page Approach ✅ |
|--------|-------------|---------------------|
| **Load Speed** | Slow (loads everything) | Fast (loads on demand) |
| **Mobile UX** | Long scrolling | Better navigation |
| **Scalability** | Gets cluttered | Easy to add features |
| **Deep Linking** | Limited | Full support |
| **Analytics** | Basic | Detailed funnel |
| **Maintenance** | Complex single file | Modular, clean |

### User Flow

```
📍 Discover Page
  ↓ (Click business card)
📄 Business Profile Overview (/businesses/[id])
   - Business info, stats, location
   - Category preview with CTA button
   - Community chats access
  ↓ (Click "View Rooms" button)
📋 Rooms Page (/businesses/[id]/rooms)
   - All room types with photos
   - Detailed amenities
   - Booking buttons with affiliate links
```

### Page 1: Business Overview (`/businesses/[id]`)

**Purpose:** Quick overview + easy chat access

**What to show:**
```
┌─────────────────────────────────────┐
│ ← Back to Discover                  │
├─────────────────────────────────────┤
│ 🏨 Arctic Glass Igloo Hotel ✓       │
│ Accommodation • Levi, Finland       │
│ "Experience Northern Lights..."     │
├─────────────────────────────────────┤
│ [Stats: 12 Hunts | 8 Completed]    │
├─────────────────────────────────────┤
│ 🏠 Accommodation Preview             │
│ "2 Glass Igloos, 3 Aurora Cabins"  │
│ From €299/night                     │
│                                     │
│ [View All Rooms →]  ← CTA BUTTON   │
├─────────────────────────────────────┤
│ Community Chats                     │
│ • Public Chat  [Join]               │
│ • Private Chat [Request Access]     │
└─────────────────────────────────────┘
```

**Key elements:**
- Business header (name, category, location, verified badge)
- Quick stats
- **Category preview card** (shows 2-3 room highlights)
- **Primary CTA button** ("View All Rooms")
- Community chats (main engagement driver)

**Implementation:**
```typescript
// /app/(main)/businesses/[id]/page.tsx
export default function BusinessProfile() {
  const categoryPath = getCategoryPath(business.businessCategory);

  return (
    <div>
      <BusinessHeader business={business} />
      <BusinessStats business={business} />

      {/* Category Preview Card */}
      {categoryPath && (
        <CategoryPreviewCard
          category={business.businessCategory}
          preview={business.categoryPreview}
          ctaPath={`/businesses/${business.id}/${categoryPath}`}
        />
      )}

      {/* Community Chats */}
      <CommunityChats
        publicChat={business.publicChat}
        privateChat={business.privateChat}
      />
    </div>
  );
}
```

---

### Page 2: Rooms Page (`/businesses/[id]/rooms`)

**Purpose:** Detailed room browsing and booking

**What to show:**
```
┌─────────────────────────────────────┐
│ ← Back to Profile                   │
├─────────────────────────────────────┤
│ 🏨 Arctic Glass Igloo Hotel         │
│ Room Types & Booking                │
├─────────────────────────────────────┤
│ ┌──────────┐  Glass Igloo Deluxe   │
│ │  [Photo] │  👥 2 guests           │
│ │          │  🛏️ King bed            │
│ └──────────┘  ☕ Breakfast included  │
│               🔥 Heated glass roof   │
│               📶 WiFi                │
│               From €349/night       │
│               [Book on Booking.com →]│
│               [Book on Agoda →]     │
│               [Book Direct →]       │
├─────────────────────────────────────┤
│ ┌──────────┐  Aurora Cabin          │
│ │  [Photo] │  👥 4 guests           │
│ │          │  🛏️ 2 bedrooms         │
│ └──────────┘  🔥 Fireplace           │
│               From €499/night       │
│               [Book on Booking.com →]│
│               [Book Direct →]       │
└─────────────────────────────────────┘
```

**Implementation:**
```typescript
// /app/(main)/businesses/[id]/rooms/page.tsx
export default function BusinessRoomsPage() {
  return (
    <div>
      <PageHeader
        title={`${business.businessName} - Rooms`}
        backUrl={`/businesses/${business.id}`}
      />

      <RoomTypesList
        roomTypes={roomTypes}
        businessId={business.id}
      />
    </div>
  );
}
```

---

### File Structure

```
/app/(main)/businesses/[id]/
  ├── page.tsx              # Main business overview
  ├── rooms/
  │   └── page.tsx          # Accommodation rooms (THIS PDR)
  ├── menu/
  │   └── page.tsx          # Restaurant menu (Future)
  ├── tours/
  │   └── page.tsx          # Tour operator tours (Future)
  ├── gallery/
  │   └── page.tsx          # Photography portfolio (Future)
  └── shop/
      └── page.tsx          # Shop products (Future)
```

---

### Category Preview Card Component

**Component for Page 1:**

```typescript
// /components/business/CategoryPreviewCard.tsx
interface CategoryPreviewCardProps {
  category: string;
  preview: {
    count: number;
    minPrice?: number;
    highlights?: string[];
  };
  ctaPath: string;
}

export default function CategoryPreviewCard({
  category,
  preview,
  ctaPath
}: CategoryPreviewCardProps) {
  const config = {
    accommodation: {
      icon: '🏨',
      title: 'Accommodation',
      cta: 'View All Rooms',
      getPreviewText: (p) => `${p.count} room types available`
    },
    restaurant: {
      icon: '🍽️',
      title: 'Menu & Reviews',
      cta: 'See Menu',
      getPreviewText: (p) => `${p.cuisine} • ${p.priceRange}`
    },
    tour_operator: {
      icon: '🚐',
      title: 'Tours & Experiences',
      cta: 'Browse Tours',
      getPreviewText: (p) => `${p.count} tours available`
    },
    photography: {
      icon: '📸',
      title: 'Photography',
      cta: 'View Portfolio',
      getPreviewText: (p) => `${p.count} photos in gallery`
    },
    shop: {
      icon: '🏪',
      title: 'Shop',
      cta: 'Browse Products',
      getPreviewText: (p) => `${p.count} products available`
    }
  };

  const { icon, title, cta, getPreviewText } = config[category];

  return (
    <div className="bg-white/5 rounded-lg p-6 border border-white/10">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <span className="text-2xl">{icon}</span>
            {title}
          </h3>
          <p className="text-gray-400 mt-2">
            {getPreviewText(preview)}
          </p>
          {preview.minPrice && (
            <p className="text-aurora-green font-semibold mt-2">
              From €{preview.minPrice}/night
            </p>
          )}
        </div>
        <button
          onClick={() => router.push(ctaPath)}
          className="px-6 py-3 bg-aurora-green text-black font-semibold rounded-lg hover:bg-aurora-green/80 transition-colors flex items-center gap-2"
        >
          {cta}
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
```

---

### Routing Helper

```typescript
// /lib/business-category-config.ts
export function getCategoryPath(category: string): string | null {
  const paths: Record<string, string> = {
    accommodation: 'rooms',
    restaurant: 'menu',
    tour_operator: 'tours',
    photography: 'gallery',
    shop: 'shop',
  };
  return paths[category] || null;
}

export function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    accommodation: 'Room Types',
    restaurant: 'Menu',
    tour_operator: 'Tours',
    photography: 'Portfolio',
    shop: 'Products',
  };
  return labels[category] || 'Details';
}
```

---

### Benefits Summary

**Performance:**
- Main profile loads fast (< 1s)
- Room details load only when needed
- Better for mobile connections

**UX:**
- Clear information hierarchy
- Focused user journey
- Less overwhelming

**Scalability:**
- Easy to add room comparison tools
- Can add availability calendar
- Room for rich features

**Analytics:**
- Track preview → detail conversion
- Measure engagement per category
- Optimize CTAs based on data

**SEO:**
- Better structured URLs
- More indexed pages
- Targeted keywords per page

---

### Migration Path

**Phase 1:** Keep existing single-page approach
**Phase 2:** Add `/rooms` route alongside
**Phase 3:** Update main profile to show preview + CTA
**Phase 4:** Remove full room list from main profile

This allows gradual migration without breaking existing functionality.

---

## Security & Validation

### URL Validation Rules
1. ✅ Must be valid URL format
2. ✅ Must use HTTPS (or HTTP for direct booking)
3. ✅ Domain must match platform (booking.com for Booking.com URLs)
4. ✅ No JavaScript or data: URLs
5. ✅ Remove any existing affiliate parameters from business

### Permission Checks
```typescript
// Middleware: Only business users can create room types
// Middleware: Business can only edit their own room types
// Middleware: Users cannot access raw affiliate links via API

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check user is business type
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { userType: true, businessCategory: true }
  });

  if (user?.userType !== 'business') {
    return NextResponse.json({ error: "Only businesses can add room types" }, { status: 403 });
  }

  if (user?.businessCategory !== 'accommodation') {
    return NextResponse.json({ error: "Only accommodation businesses can add room types" }, { status: 403 });
  }

  // Proceed...
}
```

### Rate Limiting
```typescript
// Prevent abuse: Max 20 room types per business
const roomCount = await prisma.roomType.count({
  where: { businessId: session.user.id, isActive: true }
});

if (roomCount >= 20) {
  return NextResponse.json(
    { error: "Maximum 20 room types allowed" },
    { status: 400 }
  );
}
```

---

## Edge Cases & Solutions

| Edge Case | Solution |
|-----------|----------|
| Business provides affiliate URL with their own ID | Strip existing affiliate params, inject ours |
| Business changes booking URL frequently | Allow updates, auto-reprocess affiliate links |
| Booking.com property not found | Validate URL returns 200 status (optional) |
| Business doesn't have Booking.com listing | Allow null, only show available platforms |
| Business provides wrong platform URL | Detect platform from domain, show error if mismatch |
| Affiliate link expires/changes | Store original URL, regenerate affiliate links periodically |
| Business tries to bypass system | Never expose affiliate links in API, only return via /track endpoint |

---

## Analytics & Reporting

### Business Dashboard Metrics
```typescript
// Show to business owners
{
  "roomTypes": [
    {
      "name": "Glass Igloo",
      "views": 1234,      // Profile page views
      "clicks": 156,      // Booking button clicks
      "ctr": 12.6,        // Click-through rate
      "topPlatform": "booking" // Which platform gets most clicks
    }
  ],
  "totalViews": 5678,
  "totalClicks": 456,
  "averageCtr": 8.0
}
```

### Platform Admin Metrics
```typescript
// Show to you (platform owner)
{
  "totalRoomTypes": 124,
  "activeBusinesses": 35,
  "affiliateClicks": {
    "booking": 2345,
    "agoda": 678,
    "direct": 234
  },
  "estimatedCommissions": {
    "booking": "€2,345 (based on 5% avg)",
    "agoda": "€678 (based on 6% avg)",
    "total": "€3,023"
  },
  "topPerformingRooms": [...]
}
```

---

## Implementation Timeline

### Week 1: Database & Backend
- [ ] Add RoomType and AffiliateClick models to schema
- [ ] Run migrations
- [ ] Implement affiliate injection logic
- [ ] Create API endpoints (CRUD for room types)
- [ ] Write URL validation functions
- [ ] Add permission checks

### Week 2: Business Dashboard
- [ ] Build room type manager UI
- [ ] Create room type editor modal
- [ ] Implement image upload for room photos
- [ ] Add amenity selector component
- [ ] Build analytics view (views/clicks per room)

### Week 3: Public Profile Enhancement
- [ ] Add room types section to business profile
- [ ] Implement booking button UI
- [ ] Add affiliate click tracking (frontend)
- [ ] Test affiliate link injection
- [ ] Responsive design for mobile

### Week 4: Testing & Polish
- [ ] Test with real Booking.com/Agoda URLs
- [ ] Verify affiliate parameters persist
- [ ] Load testing (high traffic scenarios)
- [ ] Security audit (permission checks)
- [ ] Documentation for businesses

---

## Open Questions & Decisions Needed

### Approval Workflow
**Question:** Should new room types require admin approval before going live?

**Options:**
- **A. Auto-approve:** Faster onboarding, trust businesses
- **B. Manual approval:** Quality control, prevent spam/inappropriate content

**Recommendation:** Start with auto-approve, add approval queue later if quality issues arise

### Image Storage
**Question:** Where should room photos be stored?

**Options:**
- **A. Businesses upload to their own storage** (provide URL)
- **B. We host images** (upload to Supabase Storage or S3)

**Recommendation:** Option B - Better control, consistent loading, prevents broken links

### Pricing Display
**Question:** Should we show actual live prices from Booking.com?

**Options:**
- **A. Static "From €X" price** (business sets manually)
- **B. Dynamic pricing via API** (requires Booking.com API integration)

**Recommendation:** Start with A (simple), explore B later for premium tier

---

## Success Criteria

### Launch Criteria (Must Have)
- [ ] 5 accommodation businesses onboarded with 2+ room types each
- [ ] All affiliate links validated and working
- [ ] Zero security vulnerabilities (permission checks pass)
- [ ] Mobile responsive design
- [ ] Click tracking functional
- [ ] Page load time < 2 seconds

### 30-Day Post-Launch Metrics
- [ ] 80% of accommodation businesses add at least 1 room type
- [ ] Average 2.5 room types per business
- [ ] 15%+ CTR on booking buttons
- [ ] €500+ in tracked affiliate clicks (estimated commissions)
- [ ] < 5% error rate on URL submissions

### 90-Day Maturity Metrics
- [ ] 20+ accommodation businesses with room types
- [ ] 50+ total room types in system
- [ ] €1,500/month in affiliate commissions
- [ ] 3%+ conversion rate (clicks → bookings)
- [ ] 90%+ satisfaction from business survey

---

## Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Businesses provide invalid URLs | High | Real-time URL validation, show error messages |
| Affiliate programs reject our account | Critical | Apply to multiple networks, read ToS carefully |
| Businesses try to use their own affiliate codes | Medium | Strip all affiliate params, validate in backend |
| Low conversion rates | High | A/B test button placement, optimize CTA copy |
| Booking.com changes URL structure | Medium | Monitor, update injection logic, store original URLs |
| Privacy concerns (tracking users) | Low | Disclose affiliate relationship, comply with GDPR |

---

## Future Enhancements (V2)

1. **Dynamic Pricing API Integration**
   - Show real-time availability and prices from Booking.com
   - Requires Booking.com Affiliate API access

2. **Room Comparison Tool**
   - Users can compare multiple room types side-by-side
   - Filter by price, capacity, amenities

3. **Seasonal Pricing**
   - Businesses set different prices for summer/winter
   - Show "Best Time to Visit" recommendations

4. **Booking Calendar Integration**
   - Embed availability calendar
   - Show "Sold Out" vs "Available" dates

5. **Review Aggregation**
   - Pull reviews from Booking.com/Agoda
   - Display average rating per room type

---

## Appendix

### Sample Room Type Data
```json
{
  "name": "Glass Igloo Deluxe",
  "description": "Experience the Northern Lights from your bed in our heated glass igloo. Perfect for couples seeking a romantic arctic adventure.",
  "capacity": 2,
  "priceFrom": 349,
  "currency": "EUR",
  "images": [
    "https://storage.aurora.com/rooms/igloo-1.jpg",
    "https://storage.aurora.com/rooms/igloo-2.jpg"
  ],
  "amenities": [
    "Heated Glass Roof",
    "Northern Lights Guarantee",
    "Private Bathroom",
    "King Size Bed",
    "WiFi",
    "Breakfast Included"
  ],
  "bookingComUrl": "https://www.booking.com/hotel/fi/arctic-glass-igloo-levi.html",
  "agodaUrl": "https://www.agoda.com/rooms/45678901"
}
```

---

## Approval & Sign-off

**For Review By:** Product Team, Engineering Lead, Business Lead

**Approved By:**
- [ ] Product Lead: _________________ Date: _______
- [ ] Engineering Lead: _____________ Date: _______
- [ ] Business Lead: ________________ Date: _______

**Status:** Draft - Awaiting Approval

---

**END OF PDR**

Last Updated: October 29, 2025
