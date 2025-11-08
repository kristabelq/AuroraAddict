# Aurora Addict - Chat System Product Requirements Document

## Document Information

**Document Version**: 1.0
**Last Updated**: October 29, 2025
**Status**: Draft - Awaiting Approval
**Author**: Product Team
**Stakeholders**: Platform Admin, Business Owners, Aurora Hunters Community

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Product Overview](#product-overview)
3. [Business Goals](#business-goals)
4. [User Personas](#user-personas)
5. [Functional Requirements](#functional-requirements)
6. [Non-Functional Requirements](#non-functional-requirements)
7. [User Interface Specifications](#user-interface-specifications)
8. [Technical Specifications](#technical-specifications)
9. [Business Model & Monetization](#business-model--monetization)
10. [Success Metrics](#success-metrics)
11. [Implementation Timeline](#implementation-timeline)
12. [Risks & Mitigation](#risks--mitigation)
13. [Future Enhancements](#future-enhancements)

---

## Executive Summary

The Aurora Addict Chat System is a location-based community messaging feature designed to connect two distinct user groups: travelers seeking aurora sighting opportunities and local residents/businesses in aurora-viewing regions. The system enables real-time communication, community building, and business-to-customer engagement through a hierarchical chat structure organized by geographic location.

**Key Objectives**:
- Foster community engagement between aurora hunters worldwide
- Provide real-time local aurora activity updates
- Create revenue stream through business chat subscriptions
- Support business growth in aurora tourism industry
- Enhance user retention through social features

**Target Launch**: Soft launch Q1 2026 with 5 Finland locations, full launch Q2 2026

**Revenue Potential**: €10,000-50,000 monthly recurring revenue (estimated 20-100 business subscriptions)

---

## Product Overview

### What We're Building

A dual-purpose chat system with two distinct chat types:

**1. Area Chats (Community)**
- Admin-created and managed
- Public and free for all users
- Organized by geographic location (city/region)
- Purpose: Community discussion, real-time sighting alerts, local tips

**2. Business Chats (Commercial)**
- Business-owned and managed
- Two chats per business per area (1 public + 1 private)
- Subscription-based (€59-79/month depending on category)
- Purpose: Customer engagement, promotions, VIP experiences

### What We're NOT Building

- Direct messaging between individual users
- Video/voice calls
- User-created chat groups
- Multi-country support at launch (Finland only initially)
- Integration with external chat platforms

### Core Principles

1. **Community First**: Area chats remain free and admin-controlled to preserve community integrity
2. **Business Enablement**: Businesses get tools to engage customers, not just broadcast
3. **Quality Over Quantity**: Strict moderation, spam prevention, and verification processes
4. **Local Focus**: Location-based discovery and relevant content
5. **Sustainable Revenue**: Premium features for businesses, free experience for community

---

## Business Goals

### Primary Goals

1. **Increase User Engagement**
   - Increase daily active users by 30%
   - Increase session duration by 50%
   - Reduce churn rate by 20%

2. **Generate Recurring Revenue**
   - Achieve €10,000 MRR within 6 months of full launch
   - Convert 20% of verified businesses to paying subscribers
   - Maintain <5% monthly churn rate

3. **Strengthen Community**
   - Connect travelers with local expertise
   - Create real-time aurora alert network
   - Build brand loyalty through community features

### Secondary Goals

1. **Support Aurora Tourism Businesses**
   - Provide direct customer access
   - Enable community building
   - Offer marketing channel alternative to social media

2. **Data & Insights**
   - Gather real-time aurora activity data from chat messages
   - Understand user travel patterns and preferences
   - Identify high-value locations for expansion

---

## User Personas

### Persona 1: Tourist Aurora Hunter

**Name**: Emma (32, Software Engineer from Germany)

**Background**:
- Planning first aurora trip to Lapland
- 5-day stay in Levi
- Limited knowledge of local conditions
- Active on social media

**Goals**:
- Get real-time updates on aurora activity
- Connect with locals for tips and advice
- Find best viewing locations
- Book last-minute tours if conditions are perfect

**Pain Points**:
- Doesn't know where to go or when
- Tourist forums are outdated
- Social media is too noisy
- Wants verified local information

**How Chat Helps**:
- Joins "Levi Aurora Community" chat for real-time updates
- Asks questions, gets immediate answers from locals
- Sees someone share a sighting → knows to go out NOW
- Discovers local tour operator through business chat

---

### Persona 2: Local Aurora Hunter

**Name**: Mikko (45, Photographer from Muonio, Finland)

**Background**:
- Lives in aurora zone year-round
- 10+ years photographing northern lights
- Knows best spots and conditions
- Wants to help community

**Goals**:
- Share sightings with community
- Help tourists find good locations
- Build reputation as local expert
- Connect with other photographers

**Pain Points**:
- Tourists ask same questions repeatedly
- No good platform for real-time community
- Wants to give back but time-limited

**How Chat Helps**:
- Active in "Muonio Aurora Community" chat
- Quickly shares when aurora starts
- Answers questions in batch
- Gets recognition as helpful community member
- Potential to convert engagement into paid photography tours

---

### Persona 3: Tour Operator/Business Owner

**Name**: Sanna (38, Owner of Aurora Safari Tours, Rovaniemi)

**Background**:
- Runs small tour company (5 guides)
- 50-100 tours per season
- Competes with larger operators
- Limited marketing budget

**Goals**:
- Direct access to potential customers
- Build loyal community
- Share tour availability and last-minute deals
- Differentiate from competitors
- Reduce reliance on booking platforms (high commissions)

**Pain Points**:
- High customer acquisition costs
- Social media algorithms limit reach
- Email marketing has low engagement
- Wants to build community, not just sell

**How Chat Helps**:
- Pays €79/month for public + private chats
- Public chat: Shares aurora forecasts, tour updates, educational content
- Private chat: VIP customers get priority booking, exclusive tips
- Direct customer engagement without platform commissions
- Verified badge builds trust

---

### Persona 4: Accommodation Owner

**Name**: Antti (52, Owner of Levin Iglut, Levi)

**Background**:
- 20 glass igloos
- €300-500/night
- 80% occupancy during season
- Strong reputation but wants more direct bookings

**Goals**:
- Engage guests before/during/after stay
- Provide concierge-style service
- Build community of repeat guests
- Reduce OTA commissions

**Pain Points**:
- Guests book through Booking.com (15% commission)
- Limited guest communication before arrival
- Wants to offer more value to justify premium pricing

**How Chat Helps**:
- Public chat: Showcases property, shares aurora alerts to followers
- Private chat: VIP community for past/future guests
  - "Aurora alert! Wake up calls available"
  - "Tonight's dinner special: reindeer stew"
  - Past guests share tips with new guests
- Builds loyalty → direct bookings → higher margins

---

## Functional Requirements

### FR-1: User Type System

**Priority**: P0 (Critical)

#### FR-1.1: User Account Types

**Requirements**:
- System SHALL support two distinct user types:
  - **Personal User** (default): Regular aurora hunter/enthusiast
  - **Business User**: Verified business entity

- Users SHALL be able to upgrade from Personal to Business through self-service flow

- Business account SHALL include additional fields:
  - Business name (required)
  - Business category (required): Accommodation, Tour Operator, Photography, Restaurant, Shop/Rental, Other
  - Website URL (optional)
  - Phone number (optional)
  - Business address (optional)
  - Verification documents (required for verification)

#### FR-1.2: Business Verification Process

**Self-Registration Flow**:
1. User clicks "Upgrade to Business Account" in settings
2. User fills out business verification form
3. User uploads verification documents (business license, registration, photos)
4. System creates verification request with status "pending"
5. Admin receives notification
6. Admin reviews request in `/admin/business-verifications`
7. Admin approves or rejects with optional message
8. User receives email notification
9. If approved: User account status changes to "verified"
10. Verified business can now purchase chat subscriptions

**Verification Status Values**:
- `unverified`: Default state for all users
- `pending`: Verification request submitted, awaiting admin review
- `verified`: Approved by admin, can purchase subscriptions
- `rejected`: Denied by admin, can resubmit with corrections

**Admin Requirements**:
- Admin SHALL be able to view all pending verification requests
- Admin SHALL be able to approve/reject requests with optional message
- Admin SHALL be able to see uploaded documents and business information
- System SHALL send email notification on approval/rejection
- System SHALL log all verification decisions with timestamp and admin ID

#### FR-1.3: Business Categories & Pricing

| Category | Icon | Monthly Price | Annual Price | Discount Rationale |
|----------|------|---------------|--------------|-------------------|
| 🏨 Accommodation | 🏨 | €79 | €699 | Full price - highest revenue potential |
| 🚐 Tour Operators | 🚐 | €79 | €699 | Full price - direct customer value |
| 🍽️ Restaurants | 🍽️ | €69 | €599 | 13% discount - lower ticket items |
| 📸 Photography | 📸 | €59 | €499 | 25% discount - support creators |
| 🏪 Shops & Rentals | 🏪 | €69 | €599 | 13% discount - seasonal business |
| 🎯 Other | 🎯 | €79 | €699 | Full price - default |

**Annual Discount**: 2 months free (12 months for price of 10)

---

### FR-2: Chat Group Structure

**Priority**: P0 (Critical)

#### FR-2.1: Chat Group Types

**Area Chats**:
- Created and managed by platform admin only
- Always public and free
- Named format: `"[Area Name] Aurora Community"` (e.g., "Levi Aurora Community")
- Purpose: General community discussion, real-time updates, local tips
- One per geographic area
- Cannot be owned by businesses
- Auto-verified with ✓ badge

**Business Public Chats**:
- Created automatically upon business subscription purchase
- Public (anyone can join)
- Named format: `"[Business Name]"` (e.g., "Levin Iglut")
- Display area badge: `📍 [Area], Finland`
- Owned by verified business user
- Includes verified badge (✓)
- Purpose: General customer engagement, promotions, aurora updates

**Business Private Chats**:
- Created automatically with public chat (paired)
- Private (requires approval to join)
- Named format: `"[Business Name] 🔒"` (e.g., "Levin Iglut 🔒")
- Display area badge: `📍 [Area], Finland`
- Owned by same business user as public chat
- Includes verified badge (✓)
- Purpose: VIP customers, exclusive offers, concierge service
- Optional member limit (e.g., 50 members max)

#### FR-2.2: Chat Group Attributes

**Required Fields**:
- `id`: Unique identifier
- `name`: Chat display name
- `groupType`: 'area' | 'business_public' | 'business_private'
- `visibility`: 'public' | 'private'
- `countryCode`: 'FI' (Finland only at launch)
- `countryName`: 'Finland'
- `areaName`: Geographic area (e.g., 'Levi', 'Muonio')
- `isActive`: Boolean (for soft deletion)

**Optional Fields**:
- `description`: Chat description (max 200 characters)
- `latitude` / `longitude`: Precise location coordinates
- `ownerId`: User ID of business owner (null for area chats)
- `businessCategory`: Category of business (null for area chats)
- `linkedChatId`: ID of paired chat (links public ↔ private)
- `avatarUrl`: Custom chat icon (business chats only)
- `memberLimit`: Max members (private business chats only)
- `requireApproval`: Boolean (true for private chats)
- `slowModeSeconds`: Rate limit between messages (null = disabled)

**Computed Fields**:
- `memberCount`: Total active members
- `messageCount`: Total messages sent
- `isVerified`: Boolean (true for admin-owned and verified business chats)

#### FR-2.3: Finland Geographic Areas (Launch)

**Soft Launch (5 areas)**:
1. **Levi** (67.8056, 24.8089) - Popular ski resort
2. **Muonio** (67.9526, 23.6825) - Prime aurora location
3. **Rovaniemi** (66.5039, 25.7294) - Arctic Circle capital
4. **Inari** (68.9063, 27.0283) - Remote wilderness
5. **Saariselkä** (68.4195, 27.4039) - Northern ski resort

**Full Launch (Additional 10 areas)**:
6. Ivalo (68.6574, 27.5477)
7. Utsjoki (69.9085, 27.0217)
8. Ylläs (67.5980, 24.1449)
9. Kittilä (67.6565, 24.9109)
10. Sodankylä (67.4170, 26.5959)
11. Luosto (67.1500, 26.9000)
12. Pyhä (67.0333, 27.1833)
13. Kilpisjärvi (69.0500, 20.7900)
14. Enontekiö (68.4167, 23.6500)
15. Kuusamo (65.9667, 29.1833)

**Expansion Considerations** (Post-launch):
- Norway: Tromsø, Alta, Lyngen Alps, Svalbard
- Sweden: Abisko, Kiruna, Jukkasjärvi
- Iceland: Reykjavik area, Akureyri, Vik
- Canada: Yellowknife, Whitehorse, Churchill
- USA: Fairbanks (Alaska)

---

### FR-3: Chat Membership & Access Control

**Priority**: P0 (Critical)

#### FR-3.1: Joining Public Chats

**User Flow**:
1. User discovers chat in "Discover" tab
2. User clicks "Join" button
3. System creates ChatMembership record with status "active"
4. User is immediately added to chat
5. User sees chat in "My Chats" tab
6. Chat memberCount increments by 1

**Requirements**:
- Public area chats: Instant join, no approval needed
- Public business chats: Instant join, no approval needed
- System SHALL prevent duplicate memberships
- System SHALL enforce member limits (if set)

#### FR-3.2: Joining Private Chats (Join Request System)

**User Flow**:
1. User discovers private business chat
2. User clicks "Request to Join" button
3. System shows optional message field: "Why do you want to join?"
4. User submits request
5. System creates ChatJoinRequest with status "pending"
6. Business owner receives notification (in-app badge + email)
7. Business owner reviews request in chat settings
8. Business owner sees:
   - User's profile photo, name, bio
   - Account creation date
   - Statistics: X sightings posted, Y hunts participated
   - User's optional message
9. Business owner approves or rejects with optional response message
10. System creates ChatMembership (if approved) or updates request status (if rejected)
11. User receives notification (in-app + email)

**Approval UI Requirements**:
- Business owner SHALL see pending join requests in:
  - Chat settings page (`/chats/[id]/requests`)
  - Notification badge on chat
  - Email digest (daily summary)
- Each request card SHALL display:
  - User avatar, name, bio
  - Account age (e.g., "Member since Jan 2024")
  - Activity stats (sightings, hunts)
  - User's message (if provided)
  - [Approve] and [Reject] buttons
- Approve flow:
  - Click "Approve"
  - Optional: Add welcome message
  - System creates membership and sends notification
- Reject flow:
  - Click "Reject"
  - Optional: Add reason (shown to user)
  - System updates request status and sends notification

**Notification Requirements**:
- User submits request → Business owner receives email within 5 minutes
- Request approved → User receives email + in-app notification immediately
- Request rejected → User receives email with reason (if provided)

#### FR-3.3: Leaving Chats

**User Flow**:
1. User opens chat menu (⋮)
2. User clicks "Leave Chat"
3. System shows confirmation dialog
4. User confirms
5. System deletes ChatMembership record
6. Chat removed from user's "My Chats"
7. Chat memberCount decrements by 1

**Special Cases**:
- Business owner leaving own chat: Prevented with error message
- Last member of private chat: Chat becomes empty but remains active

---

### FR-4: Messaging System

**Priority**: P0 (Critical)

#### FR-4.1: Message Types

| Type | Description | Use Case |
|------|-------------|----------|
| `text` | Plain text message | Normal conversation |
| `image` | Text + up to 3 images | Share aurora photos, location screenshots |
| `system` | Automated system message | User joined, slow mode enabled, etc. |
| `sighting_share` | Shared sighting with rich card | Share sighting from feed to chat |
| `hunt_share` | Shared hunt with rich card | Share hunt event to chat |

#### FR-4.2: Sending Messages

**User Flow**:
1. User types message in composer (max 1000 characters)
2. User optionally attaches images (max 3, max 5MB each)
3. User clicks Send button
4. System validates:
   - User is active member of chat
   - User is not banned or muted
   - Rate limits not exceeded
   - Slow mode not blocking (if enabled)
   - Message not empty
5. System processes message:
   - Runs profanity filter
   - Processes and uploads images (Sharp compression)
   - Creates ChatMessage record
   - Updates chat lastMessageAt timestamp
   - Increments chat messageCount
   - Resets sender's unread count to 0
6. Message appears in chat immediately (polling picks up within 5 seconds)

**Rate Limiting**:
- 10 messages per minute per user per chat
- 100 messages per hour per user per chat
- 20 images per hour per user per chat
- System SHALL show error: "Too many messages. Please wait before sending more."
- System SHALL track rate limits per user per chat in memory/cache

**Profanity Filter**:
- System SHALL use `bad-words` npm package
- System SHALL scan message content before saving
- If profanity detected:
  - `hasProfanity` flag set to true
  - `contentFiltered` saved with censored version (e.g., "f***")
  - Original content saved for moderation review
  - Filtered version displayed to users
- Custom word list SHALL be configurable by admin

**Image Processing**:
- Max 3 images per message
- Max 5MB per image
- Accepted formats: JPG, PNG, WebP
- System SHALL use Sharp to:
  - Resize to max 1920x1080 (maintain aspect ratio)
  - Compress to 85% quality JPEG
  - Strip EXIF data (privacy)
  - Generate URL path: `/uploads/chat-images/[chatId]/[messageId]-[index].jpg`
- Images displayed in grid layout (1 image: full width, 2 images: side-by-side, 3 images: 1 large + 2 small)

**Slow Mode**:
- If enabled by moderator (e.g., 30 seconds)
- System SHALL enforce minimum time between messages per user
- System SHALL show countdown: "You can send another message in 15 seconds"
- Does NOT apply to moderators or owners

#### FR-4.3: Real-Time Updates

**Polling Strategy** (Phase 1):
- Client polls `/api/chats/[id]/messages?since=[lastMessageId]` every 5 seconds
- Server returns new messages since last poll
- Client appends new messages to chat
- Client updates unread counts for other chats
- Polling pauses when tab not active (Page Visibility API)
- Polling resumes when tab becomes active

**Future Enhancement**: WebSockets (Phase 4)

#### FR-4.4: Message Display

**Message Component Requirements**:

**Own Messages** (right-aligned):
```
                           [Message Content]
                           [Images if any]
                           [Shared card if any]
                           10:45 AM
```

**Other Messages** (left-aligned):
```
[Avatar] Name • Badge         10:45 AM
[Message Content]
[Images if any]
[Shared card if any]
```

**User Badges**:
- 🏨 Business (if business user posting in own chat)
- 📍 Local (if user has posted sightings in that area)
- ✈️ Tourist (default for non-locals)

**System Messages** (centered, gray):
```
              --- Sarah joined the chat ---
              --- Slow mode enabled (30s) ---
```

**Deleted Messages**:
```
[Avatar] Name
[Message deleted by moderator]
```

**Pinned Messages**:
- Displayed at top of chat (sticky)
- Yellow highlight background
- 📌 Pin icon
- Show max 3 pinned messages
- Click "View all pinned" to see more

#### FR-4.5: Message Actions

**Available Actions**:
| Action | Who Can Perform | Requirement |
|--------|-----------------|-------------|
| Copy | Anyone | - |
| Delete | Message author OR moderator+ | Confirmation dialog |
| Pin | Moderator+ | Max 10 pinned messages per chat |
| Unpin | Moderator+ | - |
| Report | Anyone | Opens report modal |

**Delete Flow**:
1. Long-press (mobile) or right-click (desktop) message
2. Select "Delete" from menu
3. Confirmation dialog: "Delete this message?"
4. On confirm:
   - If own message: `isDeleted` = true, `deletedBy` = userId
   - If moderator deleting: `isDeleted` = true, `deletedBy` = moderatorId, optional `deletedReason`
5. Message content replaced with "[Message deleted]"
6. Log action in ModerationLog

**Pin Flow**:
1. Moderator right-clicks message
2. Select "Pin message"
3. Message moves to pinned section at top
4. `isPinned` = true, `pinnedBy` = moderatorId, `pinnedAt` = timestamp
5. Log action in ModerationLog

---

### FR-5: Shared Content (Sightings & Hunts)

**Priority**: P1 (High)

#### FR-5.1: Share Sighting to Chat

**User Flow**:
1. User viewing sighting detail page (`/sightings/[id]`)
2. User clicks "Share to Chat" button
3. Modal appears: "Share to..."
4. List of user's joined chats (area + business chats)
5. User selects one or more chats
6. Optional: Add message (e.g., "Check out what I saw tonight!")
7. User clicks "Share"
8. System creates ChatMessage for each selected chat:
   - `messageType` = 'sighting_share'
   - `sharedSightingId` = sightingId
   - `content` = user's optional message
9. Rich card appears in chat(s)

**Rich Card Display**:
```
┌─────────────────────────────────────────┐
│ [Avatar] Sarah shared a sighting        │
│ "Check out what I saw tonight!"         │
│                                          │
│ ┌────────────────────────────────────┐  │
│ │ [Sighting Main Image - Full Width] │  │
│ │                                    │  │
│ │ 📍 Muonio, Finland                 │  │
│ │ 🕐 2 hours ago                     │  │
│ │ ❤️ 12  💬 5                        │  │
│ │                                    │  │
│ │ "Amazing aurora display! KP 5"    │  │
│ │                                    │  │
│ │ [View Full Sighting] →             │  │
│ └────────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

**Card Requirements**:
- SHALL display first image from sighting
- SHALL show location, timestamp, like/comment counts
- SHALL show caption (truncated to 100 chars)
- SHALL link to full sighting page
- If sighting is deleted: Card shows "[Sighting no longer available]"

#### FR-5.2: Share Hunt to Chat

**User Flow**:
1. User viewing hunt detail page (`/hunts/[id]`)
2. User clicks "Share to Chat" button
3. Same modal flow as sightings
4. Rich card appears in chat(s)

**Rich Card Display**:
```
┌─────────────────────────────────────────┐
│ [Avatar] Mike shared a hunt             │
│ "Join me on this adventure!"            │
│                                          │
│ ┌────────────────────────────────────┐  │
│ │ 🎯 Northern Lights Safari          │  │
│ │                                    │  │
│ │ 📅 Dec 15-18, 2025                 │  │
│ │ 📍 Levi, Finland                   │  │
│ │ 👥 12/20 participants              │  │
│ │ 💰 €150                            │  │
│ │                                    │  │
│ │ [Join Hunt] →                      │  │
│ └────────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

**Card Requirements**:
- SHALL display hunt name, dates, location
- SHALL show participant count and capacity
- SHALL show price (if paid hunt)
- "Join Hunt" button SHALL work directly from chat
- If hunt is full: Button shows "Full" (disabled)
- If hunt is cancelled: Card shows "[Hunt cancelled]"

---

### FR-6: Moderation Tools

**Priority**: P0 (Critical)

#### FR-6.1: User Roles & Permissions

| Role | Area Chats | Business Public Chats | Business Private Chats |
|------|------------|----------------------|------------------------|
| **Platform Admin** | Full control | Full control | Full control |
| **Business Owner** | Member only | Full control | Full control |
| **Moderator** | N/A | Can moderate | Can moderate |
| **Member** | Basic access | Basic access | Basic access |

**Permission Matrix**:

| Action | Admin | Owner | Moderator | Member |
|--------|-------|-------|-----------|--------|
| Send message | ✅ | ✅ | ✅ | ✅ |
| Delete own message | ✅ | ✅ | ✅ | ✅ |
| Delete any message | ✅ | ✅ | ✅ | ❌ |
| Pin message | ✅ | ✅ | ✅ | ❌ |
| Mute user | ✅ | ✅ | ✅ | ❌ |
| Ban user | ✅ | ✅ | ❌ | ❌ |
| Enable slow mode | ✅ | ✅ | ❌ | ❌ |
| Promote to moderator | ✅ | ✅ | ❌ | ❌ |
| Delete chat group | ✅ | ❌ | ❌ | ❌ |
| View moderation logs | ✅ | ✅ | ✅ | ❌ |

#### FR-6.2: Mute User

**Purpose**: Temporarily prevent user from sending messages (for cooling off period)

**User Flow**:
1. Moderator opens member list or message menu
2. Moderator selects "Mute User"
3. Modal appears with duration options:
   - 10 minutes
   - 1 hour
   - 24 hours
   - 7 days
   - Custom (specify duration)
4. Optional: Add reason (visible to user)
5. Moderator clicks "Mute"
6. System updates ChatMembership:
   - `status` remains "active"
   - `mutedUntil` = timestamp
   - `mutedReason` = reason
7. User sees error when trying to send: "You are muted until [time] for: [reason]"
8. After duration expires, user can send messages again
9. Action logged in ModerationLog

**Unmute Flow**:
- Moderator can manually unmute before duration expires
- "Unmute User" option in member list
- Clears `mutedUntil` and `mutedReason`

#### FR-6.3: Ban User

**Purpose**: Permanently remove user from chat and prevent rejoining

**User Flow**:
1. Owner opens member list or message menu
2. Owner selects "Ban User"
3. Modal appears:
   - Reason field (required)
   - Checkbox: "Delete all messages from this user" (optional)
4. Owner clicks "Ban"
5. System updates ChatMembership:
   - `status` = "banned"
   - `bannedAt` = timestamp
   - `bannedBy` = ownerId
   - `banReason` = reason
6. Optionally deletes all user's messages in chat
7. User removed from chat (can see in "Left" section of My Chats)
8. User cannot rejoin chat
9. Action logged in ModerationLog

**Unban Flow**:
- Owner can unban user from member list
- User can request to rejoin (starts fresh join request)

#### FR-6.4: Slow Mode

**Purpose**: Prevent spam/flooding by limiting message frequency

**User Flow**:
1. Owner opens chat settings
2. Toggle "Slow Mode" switch
3. Select duration: Off, 10s, 30s, 60s, 120s
4. Click "Save"
5. System updates ChatGroup:
   - `slowModeSeconds` = selected duration
6. System message posted: "Slow mode enabled: 30s between messages"
7. All members see countdown when trying to send too quickly
8. Moderators and owner exempt from slow mode
9. Action logged in ModerationLog

**User Experience**:
- Send button disabled with countdown: "You can send another message in 15s"
- After countdown, button enabled
- Slow mode icon (🐌) shown in chat header

#### FR-6.5: Moderation Logs

**Purpose**: Audit trail of all moderation actions for accountability

**Log Entry Fields**:
- `id`: Unique identifier
- `chatGroupId`: Chat where action occurred
- `moderatorId`: User who performed action
- `targetUserId`: User who was moderated (if applicable)
- `targetMessageId`: Message that was moderated (if applicable)
- `action`: Type of action (delete_message, mute_user, ban_user, pin_message, slow_mode_enabled, etc.)
- `reason`: Why action was taken (if provided)
- `duration`: For mutes and slow mode (seconds)
- `createdAt`: Timestamp

**Logs Page** (`/chats/[id]/logs`):
- Table view with columns: Date, Moderator, Action, Target, Reason
- Filter by action type
- Filter by moderator
- Search by user name
- Pagination (50 per page)
- Export to CSV button (owner only)
- Only visible to moderators, owners, and admins

---

### FR-7: Business Subscription System

**Priority**: P0 (Critical)

#### FR-7.1: Subscription Purchase Flow

**Prerequisites**:
- User account upgraded to "Business"
- Verification status = "verified"

**User Flow**:
1. Business user navigates to `/business/subscriptions`
2. Clicks "Add New Area" button
3. Sees list of available areas (Finland locations)
4. Selects area (e.g., "Levi")
5. System checks: Does user already have subscription for this area?
   - If yes: Show error "You already own chats in Levi"
   - If no: Continue
6. Checkout page shows:
   - Area: Levi, Finland
   - Category: [User's category] (e.g., 🏨 Accommodation)
   - What's included:
     - 1 Public chat: "Levin Iglut"
     - 1 Private chat: "Levin Iglut 🔒"
     - Verified badge
     - Basic moderation tools
     - Pause up to 3 months/year
   - Pricing:
     - Monthly: €79/month (14-day free trial)
     - Annual: €699/year (save €249 - 2 months free!)
7. User selects billing period
8. Stripe Checkout embedded
9. User enters payment details
10. Stripe processes payment
11. Webhook received: `customer.subscription.created`
12. System processes subscription:
    - Creates BusinessChatSubscription record
    - Creates 2 ChatGroup records (public + private)
    - Links chats together (`linkedChatId`)
    - Sets business user as owner
    - Creates ChatMembership for owner (role: owner)
    - Sends confirmation email
13. User redirected to subscription dashboard
14. Success message: "Your chats are ready! Start engaging with your community."

#### FR-7.2: Chat Creation Logic

**Public Chat**:
```typescript
{
  name: "[Business Name]",
  description: "Connect with [Business Name] in [Area]",
  groupType: "business_public",
  visibility: "public",
  countryCode: "FI",
  countryName: "Finland",
  areaName: "[Area]",
  ownerId: businessUserId,
  businessCategory: user.businessCategory,
  isVerified: true,
  isActive: true,
}
```

**Private Chat**:
```typescript
{
  name: "[Business Name] 🔒",
  description: "VIP community for [Business Name] guests and members",
  groupType: "business_private",
  visibility: "private",
  countryCode: "FI",
  countryName: "Finland",
  areaName: "[Area]",
  ownerId: businessUserId,
  businessCategory: user.businessCategory,
  linkedChatId: publicChatId,
  requireApproval: true,
  isVerified: true,
  isActive: true,
}
```

#### FR-7.3: Subscription Lifecycle

**Status Flow**:
```
trialing (14 days)
    ↓ (first payment succeeds)
active
    ↓ (payment fails)
past_due (7-day grace period)
    ↓ (payment succeeds)
active
    ↓ (grace period expires)
expired (chats become read-only)
    ↓ (payment updated)
active

OR

active
    ↓ (user pauses)
paused
    ↓ (user resumes OR 3 months pass)
active

OR

active
    ↓ (user cancels)
cancelled (remains active until period ends)
    ↓ (period ends)
expired
```

**Trial Period** (14 days):
- Full access to all features
- No charge until trial ends
- Email reminder sent 3 days before trial ends
- Can cancel anytime during trial (no charge)

**Grace Period** (7 days after payment failure):
- Payment fails → status = `past_due`
- Email sent immediately: "Payment failed - please update"
- Chats remain fully functional
- Daily email reminders
- After 7 days with no payment → status = `expired`

**Expired State**:
- Chats become **read-only**:
  - Members can view message history
  - Members cannot send new messages
  - Chat appears in discovery with "Inactive" badge
- Owner can still access settings
- Owner sees banner: "Subscription expired. Reactivate to resume messaging."
- After 30 days expired: Chats hidden from discovery (but data preserved)

**Paused State**:
- User can pause subscription from dashboard
- Max 3 months per year (tracked in `pauseMonthsUsed`)
- During pause:
  - No charges
  - Chats remain active
  - All features still work
- When resume:
  - Billing resumes immediately
  - Next charge is full monthly/annual amount

#### FR-7.4: Subscription Management Dashboard

**Page**: `/business/subscriptions`

**Overview Section**:
- List of all active subscriptions
- Each subscription card shows:
  - Area name + country flag
  - Public chat name (click to open)
  - Private chat name (click to open)
  - Status badge (Trialing, Active, Paused, Past Due, Expired)
  - Member counts (e.g., "Public: 45 members, Private: 12 members")
  - Next billing date + amount
  - Actions: [Manage] [Pause] [Cancel]

**Manage Subscription Modal**:
- View details
- Update payment method
- Switch billing period (monthly ↔ annual)
- View invoices (download PDFs)
- Pause subscription
- Cancel subscription

**Pause Flow**:
1. Click "Pause"
2. Confirm dialog: "Pause [Area] chats?"
3. Select resume date (max 3 months out)
4. System checks: `pauseMonthsUsed + requested < 90 days`?
5. If valid: Update status to `paused`, cancel Stripe subscription with `pause_collection`
6. Email confirmation

**Cancel Flow**:
1. Click "Cancel"
2. Modal: "Are you sure?"
   - Warning: "Your chats will remain active until [date], then become read-only"
   - Optional: Feedback survey (why canceling?)
3. Confirm
4. System updates Stripe subscription: `cancel_at_period_end: true`
5. Status remains "active" but shows "Cancels on [date]"
6. Email confirmation

#### FR-7.5: Stripe Integration

**Webhook Events to Handle**:

| Event | Action |
|-------|--------|
| `customer.subscription.created` | Create subscription record, create chats, email confirmation |
| `customer.subscription.updated` | Update subscription status/dates |
| `customer.subscription.deleted` | Set status to expired, make chats read-only |
| `invoice.payment_succeeded` | Update subscription status to active, reset grace period |
| `invoice.payment_failed` | Set status to past_due, send payment failed email, start grace period |
| `customer.subscription.trial_will_end` | Send trial ending reminder (3 days before) |

**Stripe Product/Price Structure**:

```typescript
// Products (one per category)
Accommodation_Chat_Subscription
TourOperator_Chat_Subscription
Photography_Chat_Subscription
Restaurant_Chat_Subscription
Shop_Chat_Subscription
Other_Chat_Subscription

// Prices (per product)
Accommodation_Monthly: €79/month
Accommodation_Annual: €699/year
Photography_Monthly: €59/month
Photography_Annual: €499/year
// ... etc
```

**Metadata** (attached to subscription):
- `areaName`: "Levi"
- `businessUserId`: "cuid..."
- `publicChatId`: "cuid..."
- `privateChatId`: "cuid..."

---

### FR-8: Discovery & Navigation

**Priority**: P0 (Critical)

#### FR-8.1: Chat Navigation Structure

**Bottom Navigation Bar**:
- Home
- Intelligence
- Plan
- **Chats** ← NEW (with unread badge if > 0)
- Profile

**Chats Page** (`/chats`):
- Two tabs: [My Chats] [Discover]
- Search bar (both tabs)
- Default tab: My Chats

#### FR-8.2: My Chats Tab

**Purpose**: Show chats user has joined

**Display**:
- List of chat cards (sorted by last message time, most recent first)
- Each card shows:
  - Chat avatar (gradient for area chats, custom for business chats)
  - Chat name
  - Verified badge (if applicable)
  - Area badge (📍 Levi, Finland)
  - Last message preview (truncated to 50 chars)
  - Timestamp (relative: "2m ago", "1h ago", "3d ago")
  - Unread count badge (if > 0, shown as red circle with number)
- Click card → opens chat room

**Empty State**:
```
No chats yet

Join a chat from the Discover tab
to start connecting with the
aurora community!

[Discover Chats →]
```

**Search** (within My Chats):
- Filter by chat name
- Live filtering as user types
- Show "No results" if no matches

#### FR-8.3: Discover Tab

**Purpose**: Browse and join new chats

**Layout**:
- Search bar (by name, area, category)
- Filter dropdown: [All Categories] [🏨 Accommodation] [🚐 Tours] [📸 Photo] [🍽️ Restaurants] [🏪 Shops]
- Country header: "🇫🇮 Finland"
- Grouped by area (collapsible sections)

**Area Section**:
```
📍 Levi (5 chats)  [v]

  📍 Levi Aurora Community
  👥 234 members • Public
  [Joined ✓]

  🏨 Levin Iglut
  👥 89 members • Public • Verified ✓
  [Join]

  🏨 Levin Iglut 🔒
  👥 12 members • Private • Verified ✓
  [Request to Join]

  🚐 Aurora Safari Tours
  👥 156 members • Public • Verified ✓
  [Join]

  ... (show more)
```

**Chat Card** (in Discover):
- Avatar
- Chat name
- Verified badge
- Visibility badge (Public / Private / 🔒)
- Member count
- Description (if available)
- Action button:
  - [Joined ✓] if already member (click to open chat)
  - [Join] for public chats
  - [Request to Join] for private chats

**Search**:
- Search across: chat names, area names, business names
- Real-time filtering
- Show count: "5 results for 'safari'"

**Filter by Category**:
- Dropdown selection
- Filter applies immediately
- Show only business chats of that category
- Area chats always shown (unfiltered)

#### FR-8.4: Smart Recommendations

**Feature**: Contextual chat suggestions based on user activity

**Recommendation Triggers**:

1. **Location-based** (on Intelligence map page):
   - User zooms in on Levi area
   - Show floating banner: "💬 Join the Levi Aurora Community to connect with local hunters!"
   - Tap banner → opens chat

2. **Hunt-based** (viewing hunt detail):
   - Hunt location: Muonio
   - Show suggestion below hunt details: "Join the Muonio chat to discuss this hunt with locals"
   - [Join Chat] button

3. **Sighting-based** (viewing sighting):
   - Sighting location: Rovaniemi
   - Show: "See what others are saying about aurora in Rovaniemi →"
   - [Join Rovaniemi Chat] button

4. **Nearby Chats** (in Discover tab):
   - Section at top: "Chats Near You"
   - If user location available: Calculate distance to each area
   - Show closest 3 areas
   - "📍 Levi (12 km away) • 5 chats available"

**Privacy**:
- Location-based recommendations only with user permission
- Can dismiss recommendations
- Preference in settings: "Show chat recommendations" (default: on)

---

### FR-9: Admin Controls

**Priority**: P1 (High)

#### FR-9.1: Business Verification Admin

**Page**: `/admin/business-verifications`

**Requirements**:
- Only accessible by users with `userType: 'admin'` (manually set in database)
- Show list of pending verification requests
- Filter by status: [All] [Pending] [Verified] [Rejected]
- Sort by: Date submitted (newest first)

**Request Card**:
```
┌────────────────────────────────────────┐
│ 🏨 Levin Iglut                         │
│ Applied by: Antti Virtanen             │
│ Email: antti@leviniglu.fi              │
│ Applied: Oct 28, 2025 (2 days ago)    │
│                                        │
│ Category: 🏨 Accommodation             │
│ Website: https://leviniglu.fi          │
│ Phone: +358 40 123 4567                │
│ Address: Levintie 1, 99130 Levi       │
│                                        │
│ Documents:                             │
│ • business-license.pdf [View]          │
│ • property-photos.zip [View]           │
│                                        │
│ [View User Profile]                    │
│                                        │
│ [Approve]  [Reject]                    │
└────────────────────────────────────────┘
```

**Approve Flow**:
1. Admin reviews documents and profile
2. Clicks "Approve"
3. Optional: Add welcome message
4. System updates user:
   - `verificationStatus` = "verified"
   - `verifiedAt` = timestamp
   - `verifiedBy` = adminUserId
5. Email sent to business: "Congratulations! Your business is verified..."
6. Request removed from pending list

**Reject Flow**:
1. Admin clicks "Reject"
2. Modal: Reason required (will be sent to user)
3. System updates user:
   - `verificationStatus` = "rejected"
   - `rejectionReason` = reason
4. Email sent to business: "We couldn't verify your business because: [reason]. Please update and resubmit."
5. User can fix issues and resubmit

#### FR-9.2: Chat Management Admin

**Page**: `/admin/chats`

**Requirements**:
- List all chat groups (area + business)
- Columns: Name, Type, Area, Owner, Members, Messages, Status
- Search by name, area, or owner
- Filter by type: [All] [Area] [Business Public] [Business Private]
- Filter by status: [All] [Active] [Inactive]

**Actions**:
- Click chat name → open chat as admin
- [Create Area Chat] button → creates new area chat
- Row actions (⋮):
  - Deactivate chat (soft delete)
  - Reactivate chat
  - View analytics
  - Reassign ownership (business chats only)

**Create Area Chat Modal**:
- Area name (text input)
- Country: Finland (dropdown)
- Latitude/Longitude (optional, number inputs)
- Description (optional)
- [Create] button
- Creates chat with:
  - `groupType: 'area'`
  - `visibility: 'public'`
  - `isVerified: true`
  - `ownerId: null` (admin-owned)

**Analytics View**:
- Chat details
- Member count over time (graph)
- Messages per day (graph)
- Top contributors (list)
- Moderation actions (count)
- Export data (CSV)

#### FR-9.3: User Management Admin

**Page**: `/admin/users`

**Requirements**:
- Search by name, email, business name
- Filter by user type: [All] [Personal] [Business]
- Filter by verification status: [All] [Unverified] [Pending] [Verified] [Rejected]

**User Row**:
- Avatar, Name, Email
- User type badge
- Verification status
- Account created date
- Actions (⋮):
  - View profile
  - Force verify (skip verification process)
  - Ban from all chats
  - View chat memberships
  - View subscriptions

---

## Non-Functional Requirements

### NFR-1: Performance

**Priority**: P0 (Critical)

- Chat list SHALL load in < 1 second
- Chat messages SHALL load initial page in < 1.5 seconds
- Image upload and processing SHALL complete in < 5 seconds
- Polling for new messages SHALL complete in < 500ms
- Search results SHALL appear in < 1 second
- System SHALL support 1000+ concurrent users
- System SHALL support 100+ simultaneous chat rooms

### NFR-2: Scalability

**Priority**: P1 (High)

- Database SHALL efficiently handle:
  - 100,000+ users
  - 1,000+ chat groups
  - 1,000,000+ messages
- Message pagination: 50 messages per page
- Implement database indexing on:
  - `ChatMessage.chatGroupId + createdAt`
  - `ChatMembership.userId`
  - `ChatGroup.countryCode + areaName`
  - `User.verificationStatus`
- Consider message archival strategy after 100,000 messages per chat

### NFR-3: Security

**Priority**: P0 (Critical)

**Authentication & Authorization**:
- All API endpoints SHALL require valid session token
- System SHALL verify user permissions before any moderation action
- Business owners SHALL only access their own chat settings
- Admin endpoints SHALL be protected by admin role check

**Data Protection**:
- User passwords SHALL be hashed (handled by NextAuth)
- Image uploads SHALL be validated (file type, size, content)
- SQL injection prevention via Prisma parameterized queries
- XSS prevention via React's built-in escaping

**Rate Limiting**:
- API rate limits: 100 requests per minute per user
- Message rate limits: 10 messages per minute per chat
- Image upload limits: 20 per hour per user

**Privacy**:
- User location SHALL only be used with permission
- Deleted messages SHALL not be restorable by users
- Banned users SHALL not see private chat content
- GDPR compliance: Users can request data export/deletion

### NFR-4: Reliability

**Priority**: P0 (Critical)

- System uptime target: 99.5%
- Graceful degradation if external services fail (e.g., Stripe)
- Database backups: Daily automated backups, 30-day retention
- Error handling: All API endpoints return proper error codes and messages
- Logging: All moderation actions, subscription events, errors logged

### NFR-5: Usability

**Priority**: P0 (Critical)

- Mobile-first design (80% of users on mobile)
- Touch targets: Minimum 44x44px
- Accessible: WCAG 2.1 Level AA compliance (where feasible)
- Loading states: Show skeletons for all async operations
- Error messages: Clear, actionable, user-friendly
- Confirmation dialogs: For all destructive actions

### NFR-6: Internationalization (Future)

**Priority**: P2 (Low - Phase 2+)

- UI strings externalized (preparation for translation)
- Date/time formatting respects user locale
- Currency display formatted per region (€ vs $)
- Profanity filter SHALL support multiple languages

---

## User Interface Specifications

### UI-1: Design System

**Colors**:
- Aurora Green: `#00ff87` (primary actions, active states)
- Aurora Blue: `#00d9ff` (secondary actions, links)
- Background Dark: `#0a0e17` (main background)
- Card Background: `#1a1f2e` (elevated surfaces)
- Chat Bubble (own): `#2d5016` (dark green)
- Chat Bubble (other): `#1a1f2e` (dark gray)
- Verified Badge: `#00ff87` (green checkmark)

**Typography**:
- System fonts (Next.js default stack)
- Sizes: 12px (caption), 14px (body), 16px (body large), 18px (subtitle), 24px (title), 32px (large title)

**Spacing**:
- Base unit: 4px
- Common spacings: 8px, 12px, 16px, 24px, 32px

**Components**:
- Buttons: 40px height (mobile), rounded-lg (8px), font-medium
- Input fields: 48px height, rounded-lg, border on focus
- Cards: rounded-xl (12px), subtle shadow
- Avatars: 32px (small), 48px (medium), 64px (large), circular

### UI-2: Chat List Page (`/chats`)

**Layout**:
```
┌─────────────────────────────────────┐
│ 🔙  Chats                           │ ← Header (sticky)
│                                      │
│ [My Chats]  [Discover]              │ ← Tabs
│ ─────────   ·········               │
│                                      │
│ 🔍 Search chats...                  │ ← Search bar
│                                      │
│ ┌───────────────────────────────┐  │
│ │ [Avatar] Levi Aurora Com... [3]│  │ ← Chat card (unread badge)
│ │ Latest: "Aurora starting!"     │  │
│ │ 2m ago                         │  │
│ └───────────────────────────────┘  │
│                                      │
│ ┌───────────────────────────────┐  │
│ │ [Avatar] Levin Iglut ✓        │  │ ← Verified business chat
│ │ Latest: "Book now for..."     │  │
│ │ 1h ago                         │  │
│ └───────────────────────────────┘  │
│                                      │
│ ... (more chats)                    │
│                                      │
└─────────────────────────────────────┘
```

**Interactions**:
- Tap chat card → opens chat room
- Pull to refresh → fetches new messages
- Swipe left on chat → [Leave] [Mute] options

### UI-3: Chat Room Page (`/chats/[id]`)

**Layout**:
```
┌─────────────────────────────────────┐
│ 🔙  Levi Aurora Community  👥 45  ⋮ │ ← Header (sticky)
│     📍 Levi, Finland                │    (back, name, count, menu)
│ ────────────────────────────────────│
│                                      │
│ 📌 PINNED: KP Index at 5 tonight!  │ ← Pinned message (if any)
│                                      │
│ ─────── Oct 28, 2025 ───────       │ ← Date separator
│                                      │
│ [Avatar] Sarah 📍      10:45 AM    │ ← Other user message (left)
│ Just saw green lights starting!     │    (avatar, name, badge, time)
│ [Image: Aurora photo]                │
│                                      │
│                   [Content] 10:47 AM│ ← Own message (right)
│                                      │
│ [Avatar] Mike ✈️       10:48 AM    │ ← Tourist badge
│ Where is that exactly?              │
│                                      │
│ [Avatar] Sarah 📍      10:49 AM    │ ← Local badge
│ Head north on Road 79!              │
│                                      │
│ ... (more messages)                 │
│                                      │
│ ────────────────────────────────────│
│ [📷] [📍] [🎯]  Type a message...  │ ← Composer (sticky bottom)
│                                      │
└─────────────────────────────────────┘
```

**Composer Actions**:
- 📷 Camera icon → Upload images (max 3)
- 📍 Location icon → Share current location
- 🎯 Share icon → Share sighting or hunt

**Message Long-Press Menu**:
- Copy
- Delete (if own message or moderator)
- Pin (if moderator)
- Report (if not own message)

**Header Menu (⋮)**:
- Chat Info (members, description)
- Search Messages
- Mute Notifications
- Leave Chat
- (If moderator) Chat Settings
- (If moderator) Member List
- (If moderator) Moderation Logs

### UI-4: Discover Tab

**Layout**:
```
┌─────────────────────────────────────┐
│ 🔍 Search chats...                  │ ← Search bar
│                                      │
│ [All ▼] [🏨] [🚐] [📸] [🍽️] [🏪]   │ ← Category filters (horizontal scroll)
│                                      │
│ ━━━ Chats Near You ━━━              │ ← Nearby section (if location enabled)
│                                      │
│ 📍 Levi (12 km away)                │
│ 5 chats • [Browse →]                │
│                                      │
│ ━━━ 🇫🇮 Finland ━━━                 │ ← Country header
│                                      │
│ 📍 Levi (5 chats)  [v]              │ ← Area section (collapsible)
│                                      │
│   📍 Levi Aurora Community          │ ← Area chat (always first)
│   👥 234 members • Public           │
│   [Joined ✓]                        │
│                                      │
│   🏨 Levin Iglut ✓                  │ ← Business chat (verified badge)
│   👥 89 members • Public            │
│   [Join]                            │
│                                      │
│   🏨 Levin Iglut 🔒 ✓               │ ← Private chat
│   👥 12 members • Private           │
│   [Request to Join]                 │
│                                      │
│ 📍 Muonio (3 chats)  [>]            │ ← Collapsed section
│                                      │
│ 📍 Rovaniemi (6 chats)  [>]         │
│                                      │
│ ... (more areas)                    │
│                                      │
└─────────────────────────────────────┘
```

### UI-5: Join Request Review (Business Owner)

**Page**: `/chats/[id]/requests`

**Layout**:
```
┌─────────────────────────────────────┐
│ 🔙  Join Requests (3)               │ ← Header
│                                      │
│ ┌───────────────────────────────┐  │ ← Request card
│ │ [Avatar] Emma Schmidt          │  │
│ │ ✈️ Tourist • Member since Jan  │  │
│ │                                │  │
│ │ 📊 3 sightings • 2 hunts       │  │
│ │                                │  │
│ │ 💬 "I'm staying at Levin Iglut │  │
│ │     Dec 15-20 and would love   │  │
│ │     to join the VIP chat!"     │  │
│ │                                │  │
│ │ [View Profile]                 │  │
│ │                                │  │
│ │ [Approve]     [Reject]         │  │
│ └───────────────────────────────┘  │
│                                      │
│ ┌───────────────────────────────┐  │
│ │ [Avatar] John Smith            │  │
│ │ ... (next request)             │  │
│ └───────────────────────────────┘  │
│                                      │
└─────────────────────────────────────┘
```

**Approve Flow**:
- Tap "Approve"
- Optional modal: Add welcome message
- User immediately added to chat
- Email sent to user

**Reject Flow**:
- Tap "Reject"
- Modal: Add reason (optional, shown to user)
- Request status updated to "rejected"
- Email sent to user with reason

### UI-6: Business Subscription Dashboard

**Page**: `/business/subscriptions`

**Layout**:
```
┌─────────────────────────────────────┐
│ 🔙  My Subscriptions                │ ← Header
│                                      │
│ [+ Add New Area]                    │ ← CTA button
│                                      │
│ ┌───────────────────────────────┐  │ ← Subscription card
│ │ 📍 Levi, Finland               │  │
│ │ [Active]                       │  │    (status badge)
│ │                                │  │
│ │ Public Chat:                   │  │
│ │ 🏨 Levin Iglut (45 members)    │  │    (click to open)
│ │                                │  │
│ │ Private Chat:                  │  │
│ │ 🏨 Levin Iglut 🔒 (12 members) │  │
│ │                                │  │
│ │ Next billing: Nov 28, 2025     │  │
│ │ €79/month                      │  │
│ │                                │  │
│ │ [Manage] [Pause] [Cancel]     │  │    (actions)
│ └───────────────────────────────┘  │
│                                      │
│ ┌───────────────────────────────┐  │
│ │ 📍 Muonio, Finland  [Trialing] │  │    (trial status)
│ │ Trial ends: Nov 10, 2025       │  │
│ │ ... (details)                  │  │
│ └───────────────────────────────┘  │
│                                      │
└─────────────────────────────────────┘
```

### UI-7: Shared Sighting Card (in Chat)

```
┌─────────────────────────────────────┐
│ [Avatar] Sarah shared a sighting    │ ← Message header
│ "Check this out!"                   │    (optional text)
│                                      │
│ ┌────────────────────────────────┐ │ ← Rich card
│ │ [Sighting Image - Full Width]  │ │    (first image)
│ │                                │ │
│ │ ─────────────────────────────  │ │
│ │                                │ │
│ │ 📍 Muonio, Finland             │ │
│ │ 🕐 2 hours ago                 │ │
│ │ ❤️ 12  💬 5                    │ │    (engagement stats)
│ │                                │ │
│ │ "Amazing aurora display        │ │    (caption, truncated)
│ │  tonight! KP index at 5..."    │ │
│ │                                │ │
│ │ [View Full Sighting] →         │ │    (action button)
│ └────────────────────────────────┘ │
│                                      │
│ 10:45 AM                            │ ← Timestamp
└─────────────────────────────────────┘
```

**Interaction**:
- Tap card anywhere → navigates to `/sightings/[id]`
- Tap "View Full Sighting" → same action
- If sighting deleted: Card shows "[Sighting unavailable]" (grayed out)

---

## Technical Specifications

### Tech-1: Database Schema Summary

**Models**:
1. `User` - Extended with business fields and verification status
2. `ChatGroup` - Area and business chat groups
3. `ChatMembership` - User membership in chats
4. `ChatMessage` - Messages in chats
5. `ChatJoinRequest` - Pending requests for private chats
6. `ModerationLog` - Audit trail of moderation actions
7. `BusinessChatSubscription` - Stripe subscription management

**Key Relationships**:
- User → ChatGroup (1:many, owned chats)
- User → ChatMembership (1:many)
- ChatGroup → ChatMembership (1:many)
- ChatGroup → ChatMessage (1:many)
- ChatGroup → ChatJoinRequest (1:many)
- User → ChatMessage (1:many)
- ChatMessage → Sighting (many:1, optional)
- ChatMessage → Hunt (many:1, optional)
- ChatGroup → ChatGroup (1:1, linked public/private pair)

**Indexes**:
- `ChatMessage`: `(chatGroupId, createdAt)` - Fast message queries
- `ChatMembership`: `(userId)` - User's chats
- `ChatMembership`: `(chatGroupId, userId)` - Unique constraint
- `ChatGroup`: `(countryCode, areaName)` - Geographic queries
- `ChatGroup`: `(ownerId)` - Business owner's chats
- `User`: `(verificationStatus)` - Admin verification queue
- `ChatJoinRequest`: `(status)`, `(userId)` - Pending requests

### Tech-2: API Endpoints

**Chat Management**:
- `GET /api/chats/my-chats` - User's joined chats (with unread counts)
- `GET /api/chats/discover` - Browse all chats (with filters)
- `GET /api/chats/[id]` - Chat details (name, description, members, etc.)
- `POST /api/chats/[id]/join` - Join public chat
- `POST /api/chats/[id]/leave` - Leave chat
- `GET /api/chats/[id]/members` - List members (paginated)

**Messaging**:
- `GET /api/chats/[id]/messages` - Get messages (paginated, query: ?page=1&limit=50)
- `POST /api/chats/[id]/messages` - Send message
- `DELETE /api/chats/[id]/messages/[messageId]` - Delete message
- `POST /api/chats/[id]/messages/[messageId]/pin` - Pin message
- `DELETE /api/chats/[id]/messages/[messageId]/pin` - Unpin message

**Join Requests**:
- `POST /api/chats/[id]/join-request` - Request to join private chat
- `GET /api/chats/[id]/requests` - Get pending requests (owner only)
- `POST /api/chats/[id]/requests/[requestId]/approve` - Approve request
- `POST /api/chats/[id]/requests/[requestId]/reject` - Reject request

**Moderation**:
- `POST /api/chats/[id]/members/[userId]/mute` - Mute user
- `POST /api/chats/[id]/members/[userId]/unmute` - Unmute user
- `POST /api/chats/[id]/members/[userId]/ban` - Ban user
- `POST /api/chats/[id]/members/[userId]/unban` - Unban user
- `POST /api/chats/[id]/members/[userId]/promote` - Promote to moderator
- `PATCH /api/chats/[id]/settings` - Update chat settings (slow mode, etc.)
- `GET /api/chats/[id]/logs` - Get moderation logs (moderator only)

**Business Subscription**:
- `GET /api/business/subscriptions` - Get user's subscriptions
- `POST /api/business/subscriptions/create` - Purchase new subscription
- `POST /api/business/subscriptions/[id]/pause` - Pause subscription
- `POST /api/business/subscriptions/[id]/resume` - Resume subscription
- `POST /api/business/subscriptions/[id]/cancel` - Cancel subscription
- `POST /api/webhooks/stripe` - Stripe webhook handler

**Business Verification**:
- `POST /api/user/upgrade-to-business` - Submit business verification
- `POST /api/admin/verify-business/[userId]/approve` - Approve (admin only)
- `POST /api/admin/verify-business/[userId]/reject` - Reject (admin only)

**Admin**:
- `GET /api/admin/chats` - List all chats
- `POST /api/admin/chats/create` - Create area chat
- `PATCH /api/admin/chats/[id]/deactivate` - Deactivate chat
- `GET /api/admin/business-verifications` - Pending verifications
- `GET /api/admin/users` - List all users

### Tech-3: Image Processing

**Upload Flow**:
1. User selects images (max 3, max 5MB each)
2. Client validates file type (jpg, png, webp) and size
3. FormData sent to API endpoint
4. Server receives files as multipart/form-data
5. Sharp processes each image:
   ```typescript
   await sharp(buffer)
     .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true })
     .jpeg({ quality: 85 })
     .toFile(outputPath);
   ```
6. Files saved to: `/public/uploads/chat-images/[chatId]/[messageId]-[index].jpg`
7. URLs returned: `/uploads/chat-images/[chatId]/[messageId]-0.jpg`
8. URLs stored in `ChatMessage.images` array

**Display**:
- Single image: Full width (max 400px height)
- Two images: Side-by-side grid (50% width each)
- Three images: 1 large (top) + 2 small (bottom)
- Images are lazy-loaded
- Click image → lightbox view (full resolution)

### Tech-4: Real-Time Updates (Phase 1 - Polling)

**Client-Side Polling**:
```typescript
// Poll every 5 seconds when chat is open
useEffect(() => {
  const interval = setInterval(async () => {
    const response = await fetch(
      `/api/chats/${chatId}/messages?since=${lastMessageId}`
    );
    const newMessages = await response.json();

    if (newMessages.length > 0) {
      setMessages(prev => [...prev, ...newMessages]);
      setLastMessageId(newMessages[newMessages.length - 1].id);
    }
  }, 5000);

  return () => clearInterval(interval);
}, [chatId, lastMessageId]);
```

**Optimization**:
- Pause polling when tab not visible (Page Visibility API)
- Resume polling when tab becomes active
- Use `If-None-Match` header with ETag for efficient 304 responses

**Future**: Upgrade to WebSockets (Pusher/Ably) in Phase 4 for true real-time

### Tech-5: Profanity Filter

**Implementation**:
```bash
npm install bad-words
```

```typescript
import Filter from 'bad-words';

const filter = new Filter();

// Optional: Add custom words
filter.addWords('customBadWord', 'anotherOne');

export function filterProfanity(text: string) {
  const hasProfanity = filter.isProfane(text);
  const cleanText = filter.clean(text); // Replaces with asterisks

  return { hasProfanity, cleanText };
}
```

**Usage in API**:
```typescript
const { hasProfanity, cleanText } = filterProfanity(content);

await prisma.chatMessage.create({
  data: {
    content, // Original (for moderation review)
    contentFiltered: cleanText, // Displayed to users
    hasProfanity,
    // ... other fields
  },
});
```

**Display**:
- If `hasProfanity: true`, display `contentFiltered`
- Moderators can click "Show original" to see unfiltered content

### Tech-6: Rate Limiting

**In-Memory Implementation** (sufficient for Phase 1):
```typescript
// src/lib/chat/rateLimit.ts
const rateLimits = new Map<string, { count: number; resetAt: Date }>();

export function checkRateLimit(
  userId: string,
  chatId: string,
  limit: number = 10,
  windowMs: number = 60000 // 1 minute
): { allowed: boolean; reason?: string } {
  const key = `${userId}:${chatId}`;
  const now = Date.now();
  const record = rateLimits.get(key);

  if (!record || now > record.resetAt.getTime()) {
    // Reset window
    rateLimits.set(key, {
      count: 1,
      resetAt: new Date(now + windowMs),
    });
    return { allowed: true };
  }

  if (record.count >= limit) {
    return {
      allowed: false,
      reason: `Too many messages. Please wait ${Math.ceil((record.resetAt.getTime() - now) / 1000)}s.`,
    };
  }

  record.count++;
  return { allowed: true };
}
```

**Future**: Use Redis for distributed rate limiting if scaling across multiple servers

### Tech-7: Stripe Integration

**Setup**:
```bash
npm install stripe @stripe/stripe-js
```

**Create Products/Prices** (run once):
```typescript
// scripts/setup-stripe-products.ts
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Create product for Accommodation
const accommodationProduct = await stripe.products.create({
  name: 'Aurora Addict Chat - Accommodation',
  description: 'Public + Private chat ownership for accommodation businesses',
});

// Create monthly price
const monthlyPrice = await stripe.prices.create({
  product: accommodationProduct.id,
  unit_amount: 7900, // €79.00
  currency: 'eur',
  recurring: { interval: 'month' },
});

// Create annual price
const annualPrice = await stripe.prices.create({
  product: accommodationProduct.id,
  unit_amount: 69900, // €699.00
  currency: 'eur',
  recurring: { interval: 'year' },
});

// Repeat for other categories...
```

**Checkout Flow**:
```typescript
// Create Checkout Session
const session = await stripe.checkout.sessions.create({
  customer_email: user.email,
  mode: 'subscription',
  line_items: [
    {
      price: stripePriceId, // Based on category + billing period
      quantity: 1,
    },
  ],
  subscription_data: {
    trial_period_days: 14,
    metadata: {
      businessUserId: user.id,
      areaName: 'Levi',
      businessCategory: user.businessCategory,
    },
  },
  success_url: `${process.env.NEXTAUTH_URL}/business/subscriptions?success=true`,
  cancel_url: `${process.env.NEXTAUTH_URL}/business/subscribe/${areaName}?cancelled=true`,
});

return { url: session.url };
```

**Webhook Handler**:
```typescript
// pages/api/webhooks/stripe.ts
import { buffer } from 'micro';

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  const buf = await buffer(req);
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      buf,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case 'customer.subscription.created':
      await handleSubscriptionCreated(event.data.object);
      break;
    case 'invoice.payment_failed':
      await handlePaymentFailed(event.data.object);
      break;
    // ... other events
  }

  res.json({ received: true });
}
```

---

## Business Model & Monetization

### Revenue Streams

**Primary Revenue: Business Subscriptions**

**Projected Revenue** (Conservative Estimates):

| Scenario | Active Businesses | Avg Monthly Price | MRR | ARR |
|----------|-------------------|-------------------|-----|-----|
| **Launch (Month 3)** | 5 businesses | €70 | €350 | €4,200 |
| **Soft Launch (Month 6)** | 15 businesses | €72 | €1,080 | €12,960 |
| **Full Launch (Month 12)** | 40 businesses | €73 | €2,920 | €35,040 |
| **Mature (Year 2)** | 100 businesses | €74 | €7,400 | €88,800 |
| **Scale (Year 3)** | 250 businesses | €75 | €18,750 | €225,000 |

**Assumptions**:
- 5 areas at soft launch → 3 businesses per area = 15 total
- 15 areas at full launch → 2.5 businesses per area = 40 total (conservative)
- Finland has ~200 aurora tourism businesses (accommodation, tours, restaurants)
- Target 50% penetration over 3 years = 100 businesses
- Expansion to Norway, Sweden, Iceland could add 200+ more businesses
- Weighted average price considering category discounts: €70-75

**Secondary Revenue Opportunities** (Future):

1. **Featured Placement**: €20/month for top of discovery list
2. **Promoted Messages**: Highlight message in chat (€5 per promotion, max 1/day)
3. **Analytics Pro**: Advanced dashboard for businesses (€29/month add-on)
4. **API Access**: For larger tour operators to integrate (€199/month)
5. **Enterprise Tier**: Multiple areas bundled (€249/month for 5 areas)

### Costs

**Infrastructure** (Monthly):
- Vercel hosting: €20 (Hobby plan sufficient initially)
- Supabase PostgreSQL: €25 (Pro plan)
- Stripe fees: 2.9% + €0.25 per transaction ≈ €100-200 at scale
- Image storage: €10 (Cloudinary or S3)
- Email service (SendGrid): €15 (Essentials plan)
- **Total**: €170-270/month

**Development**:
- Initial development: 6-8 weeks (assumed in-house or contracted)
- Ongoing maintenance: 10-20 hours/month ≈ €500-1,000/month

**Customer Support**:
- Initially handled by founder
- At 100+ businesses: Consider part-time support (€500/month)

**Marketing**:
- Targeted outreach to businesses (low cost)
- Content marketing (blog, social media): €200/month
- Paid ads (optional): €500/month

**Total Monthly Costs** (at scale): €1,500-2,500

**Break-Even**: ~30 business subscriptions (€2,200 MRR)

### Pricing Strategy

**Why €79/month?**

✅ **Not too high**: Small businesses in Lapland have modest budgets
✅ **Not too low**: Premium positioning, avoid "cheap" perception
✅ **Comparable value**: Less than Facebook ads (€200-500/month for same reach)
✅ **ROI positive**: 1 booking from chat = €100-500 revenue for business

**Category Discounts Rationale**:
- **Photography** (€59): Support creators, lower revenue per customer
- **Restaurants** (€69): Seasonal, lower ticket items
- **Accommodation/Tours** (€79): Highest customer value, direct booking potential

**Annual Discount** (2 months free):
- Encourages long-term commitment
- Improves cash flow
- Reduces churn

**Trial Period** (14 days):
- Low barrier to entry
- Builds trust
- Allows businesses to test value before committing

---

## Success Metrics

### User Engagement Metrics

**Primary Metrics**:
- **Chat Adoption Rate**: % of active users who join at least 1 chat
  - Target: 40% within 3 months of launch
- **Daily Active Chat Users**: Users who send or read messages daily
  - Target: 20% of total DAU
- **Messages Per Day**: Total messages across all chats
  - Target: 500/day at soft launch, 2,000/day at full launch
- **Avg Chats Per User**: How many chats users join
  - Target: 2.5 chats per active chat user

**Engagement Quality**:
- **Response Rate**: % of questions that receive replies
  - Target: >80%
- **Response Time**: Median time to first reply
  - Target: <10 minutes during peak hours
- **Share Rate**: % of sightings/hunts shared to chat
  - Target: 15% of sightings shared

### Business Metrics

**Acquisition**:
- **Business Verification Requests**: Applications per month
  - Target: 20/month at full launch
- **Verification Approval Rate**: % of requests approved
  - Target: 70% (reject spam/unqualified)
- **Conversion Rate**: Verified → Subscribed
  - Target: 50% (half of verified businesses subscribe)

**Revenue**:
- **MRR (Monthly Recurring Revenue)**
  - Targets: €350 (Month 3), €1,080 (Month 6), €2,920 (Month 12)
- **Churn Rate**: % of subscriptions cancelled per month
  - Target: <5%
- **Lifetime Value (LTV)**: Average revenue per business
  - Target: €1,500+ (20+ months avg subscription)

**Engagement (Business Owners)**:
- **Messages Per Business**: Avg messages sent by businesses per week
  - Target: 10/week (shows active engagement, not spam)
- **Private Chat Join Requests**: Avg requests per private chat per month
  - Target: 5/month (shows demand)

### Operational Metrics

**Performance**:
- Chat load time: <1.5s (p95)
- Message send time: <1s (p95)
- Uptime: >99.5%

**Quality**:
- **Spam Rate**: % of messages flagged as spam/profanity
  - Target: <2%
- **Moderation Actions**: Bans, mutes per 1,000 messages
  - Target: <5 per 1,000
- **User Reports**: Reported messages per 1,000
  - Target: <10 per 1,000

**Support**:
- **Response Time**: Median time to respond to business support inquiries
  - Target: <24 hours
- **Resolution Time**: Median time to resolve issues
  - Target: <48 hours

### Tracking Implementation

**Analytics Tools**:
- Custom event tracking in database (chat_opened, message_sent, sighting_shared, etc.)
- Aggregate daily/weekly in cron job
- Dashboard at `/admin/analytics`

**Key Events to Track**:
- User joins chat
- User sends message
- User shares sighting/hunt to chat
- Business subscribes
- Business cancels
- Moderation action taken
- Join request submitted/approved/rejected

**Metrics Dashboard** (for internal use):
```
┌─────────────────────────────────────┐
│ Chat System Analytics                │
│                                      │
│ 📊 User Engagement                  │
│ • Active Chat Users: 1,234 (↑ 15%) │
│ • Messages Today: 567               │
│ • Chats per User: 2.3               │
│                                      │
│ 💰 Revenue                          │
│ • MRR: €2,920                       │
│ • Active Subscriptions: 40          │
│ • Churn Rate: 3.2%                  │
│                                      │
│ 🎯 Quality                          │
│ • Spam Rate: 1.3%                   │
│ • Moderation Actions: 12 this week  │
│                                      │
│ 📈 Growth                           │
│ • New Chats Joined: 89 this week    │
│ • New Subscriptions: 3 this month   │
│                                      │
└─────────────────────────────────────┘
```

---

## Implementation Timeline

### Phase 0: Preparation (Week 0)
**Duration**: 3-5 days

- [ ] PRD approval from stakeholders
- [ ] Design mockups finalized
- [ ] Database schema review
- [ ] Environment setup (Stripe test mode, dev database)
- [ ] Create project board with tasks

---

### Phase 1: Database & Core Infrastructure (Week 1)
**Duration**: 5-7 days

**Tasks**:
- [ ] Update User model with business fields
- [ ] Create ChatGroup, ChatMembership, ChatMessage models
- [ ] Create ChatJoinRequest, ModerationLog models
- [ ] Create BusinessChatSubscription model
- [ ] Run database migration
- [ ] Seed 5 Finland area chats (Levi, Muonio, Rovaniemi, Inari, Saariselkä)
- [ ] Build rate limiting utility
- [ ] Build profanity filter utility
- [ ] Build image processing utility (Sharp)

**Deliverables**:
- ✅ Database schema complete
- ✅ 5 area chats exist in database
- ✅ Utility functions tested

---

### Phase 2: User Type & Business Verification (Week 1-2)
**Duration**: 5-7 days

**Tasks**:
- [ ] Add "Upgrade to Business" button in user settings
- [ ] Build business verification form UI
- [ ] File upload for verification documents
- [ ] API: Submit business verification request
- [ ] Build admin verification queue page
- [ ] API: Approve/reject verification
- [ ] Email templates (verification submitted, approved, rejected)
- [ ] Business category badges UI component

**Deliverables**:
- ✅ Users can submit business verification
- ✅ Admins can approve/reject from dashboard
- ✅ Email notifications sent

---

### Phase 3: Core Chat UI (Week 2)
**Duration**: 5-7 days

**Tasks**:
- [ ] Add "Chats" icon to bottom navigation
- [ ] Build /chats page layout (My Chats / Discover tabs)
- [ ] Build ChatListItem component
- [ ] API: GET /api/chats/my-chats
- [ ] API: GET /api/chats/discover
- [ ] Build search functionality
- [ ] Build category filter UI
- [ ] Build "Chats Near You" section (geolocation)
- [ ] Build "Join" button functionality
- [ ] API: POST /api/chats/[id]/join
- [ ] Unread count calculation and display

**Deliverables**:
- ✅ Users can browse chats
- ✅ Users can search/filter chats
- ✅ Users can join public chats
- ✅ Unread counts displayed

---

### Phase 4: Chat Room & Messaging (Week 3)
**Duration**: 7-10 days

**Tasks**:
- [ ] Build /chats/[id] page layout
- [ ] Build ChatMessage component (text only first)
- [ ] Message composer UI
- [ ] API: GET /api/chats/[id]/messages (paginated)
- [ ] API: POST /api/chats/[id]/messages (text only)
- [ ] Rate limiting enforcement
- [ ] Profanity filter enforcement
- [ ] Polling for new messages (5-second interval)
- [ ] Auto-scroll to bottom
- [ ] Unread count reset on open
- [ ] Message timestamps (relative time)
- [ ] User badges (Local / Tourist / Business)
- [ ] System messages (user joined, etc.)
- [ ] Long-press menu (Copy, Delete)
- [ ] API: DELETE /api/chats/[id]/messages/[messageId]

**Deliverables**:
- ✅ Users can send/receive text messages
- ✅ Messages update in near-real-time (polling)
- ✅ Rate limiting prevents spam
- ✅ Profanity filtered automatically

---

### Phase 5: Image Messages (Week 3)
**Duration**: 3-5 days

**Tasks**:
- [ ] Add image upload button to composer
- [ ] Image selection UI (max 3)
- [ ] Image preview before sending
- [ ] Client-side validation (type, size)
- [ ] API: Handle multipart/form-data
- [ ] Sharp image processing
- [ ] Save images to /public/uploads/chat-images
- [ ] Display images in message (grid layout)
- [ ] Image lightbox viewer
- [ ] Lazy loading images

**Deliverables**:
- ✅ Users can send up to 3 images per message
- ✅ Images compressed and displayed properly

---

### Phase 6: Business Subscription & Stripe (Week 4)
**Duration**: 7-10 days

**Tasks**:
- [ ] Set up Stripe products/prices (script)
- [ ] Build /business/subscriptions dashboard
- [ ] Build /business/subscribe/[area] checkout page
- [ ] Stripe Checkout integration
- [ ] API: Create subscription
- [ ] Webhook handler setup
- [ ] Handle: subscription.created (create chats)
- [ ] Handle: payment_failed (grace period logic)
- [ ] Handle: subscription.deleted (make chats read-only)
- [ ] Email notifications (trial ending, payment failed, etc.)
- [ ] Pause subscription UI + API
- [ ] Cancel subscription UI + API
- [ ] Display subscription status badges
- [ ] Trial countdown display

**Deliverables**:
- ✅ Businesses can purchase subscriptions
- ✅ Two chats auto-created (public + private)
- ✅ Stripe webhooks handling all events
- ✅ Grace period and read-only logic working

---

### Phase 7: Private Chats & Join Requests (Week 4)
**Duration**: 5-7 days

**Tasks**:
- [ ] Build join request modal (user-facing)
- [ ] API: POST /api/chats/[id]/join-request
- [ ] Build /chats/[id]/requests page (business owner)
- [ ] JoinRequestCard component
- [ ] API: GET /api/chats/[id]/requests
- [ ] API: POST /api/chats/[id]/requests/[id]/approve
- [ ] API: POST /api/chats/[id]/requests/[id]/reject
- [ ] Email notifications (request submitted, approved, rejected)
- [ ] Notification badge on chat icon
- [ ] Request status display for users

**Deliverables**:
- ✅ Users can request to join private chats
- ✅ Business owners can approve/reject requests
- ✅ Notifications sent at each step

---

### Phase 8: Share Sightings to Chat (Week 5)
**Duration**: 3-5 days

**Tasks**:
- [ ] Add "Share to Chat" button on sighting detail page
- [ ] Build share modal (select chats)
- [ ] API: Create message with type='sighting_share'
- [ ] Build SharedSightingCard component
- [ ] Display rich card in chat
- [ ] Link to full sighting
- [ ] Handle deleted sightings gracefully

**Deliverables**:
- ✅ Users can share sightings to chats
- ✅ Rich cards display properly
- ✅ Cards link to sighting detail page

---

### Phase 9: Share Hunts to Chat (Week 5)
**Duration**: 3-5 days

**Tasks**:
- [ ] Add "Share to Chat" button on hunt detail page
- [ ] Reuse share modal from Phase 8
- [ ] API: Create message with type='hunt_share'
- [ ] Build SharedHuntCard component
- [ ] Display rich card with join button
- [ ] Join hunt directly from chat
- [ ] Handle full/cancelled hunts

**Deliverables**:
- ✅ Users can share hunts to chats
- ✅ Rich cards display with join functionality

---

### Phase 10: Moderation Tools (Week 5-6)
**Duration**: 5-7 days

**Tasks**:
- [ ] Build /chats/[id]/settings page (moderator only)
- [ ] Member list UI
- [ ] API: POST /api/chats/[id]/members/[userId]/mute
- [ ] Mute modal (duration selection)
- [ ] API: POST /api/chats/[id]/members/[userId]/ban
- [ ] Ban modal (reason required)
- [ ] Display muted/banned status to user
- [ ] Slow mode toggle UI
- [ ] API: Update slow mode setting
- [ ] Slow mode countdown in composer
- [ ] Pin message functionality
- [ ] Pinned messages section (top of chat)
- [ ] API: POST /api/chats/[id]/messages/[id]/pin
- [ ] ModerationLog creation for all actions
- [ ] Build /chats/[id]/logs page
- [ ] Export logs to CSV

**Deliverables**:
- ✅ Moderators can mute/ban users
- ✅ Slow mode functional
- ✅ Pin/unpin messages
- ✅ All actions logged

---

### Phase 11: Admin Controls (Week 6)
**Duration**: 5-7 days

**Tasks**:
- [ ] Build /admin layout with navigation
- [ ] Build /admin/business-verifications page
- [ ] Verification request card UI
- [ ] View uploaded documents
- [ ] Approve/reject actions
- [ ] Build /admin/chats page
- [ ] List all chats with filters
- [ ] Create area chat modal
- [ ] Deactivate/reactivate chat actions
- [ ] Build /admin/users page
- [ ] Search and filter users
- [ ] Force-verify business action
- [ ] View user's chat memberships

**Deliverables**:
- ✅ Admin can manage all verifications
- ✅ Admin can create/manage area chats
- ✅ Admin can view all users and chats

---

### Phase 12: Smart Recommendations (Week 6)
**Duration**: 2-3 days

**Tasks**:
- [ ] Context detection on Intelligence page (area zoomed)
- [ ] Floating banner UI with chat suggestion
- [ ] Context detection on hunt detail page
- [ ] Chat suggestion with join button
- [ ] Context detection on sighting detail page
- [ ] "Nearby Chats" section in Discover tab
- [ ] Geolocation permission handling
- [ ] Distance calculation to areas

**Deliverables**:
- ✅ Users see contextual chat recommendations
- ✅ Nearby chats displayed based on location

---

### Phase 13: Testing & Bug Fixes (Week 7)
**Duration**: 7 days

**Tasks**:
- [ ] End-to-end testing all user flows
- [ ] Test all moderation actions
- [ ] Test subscription lifecycle (trial, payment fail, etc.)
- [ ] Test rate limiting edge cases
- [ ] Test image upload edge cases
- [ ] Cross-browser testing (Chrome, Safari, Firefox)
- [ ] Mobile responsiveness testing (iOS, Android)
- [ ] Performance testing (load time, polling overhead)
- [ ] Security audit (SQL injection, XSS, CSRF)
- [ ] Fix all critical bugs
- [ ] Write documentation for business owners

**Deliverables**:
- ✅ All features tested and working
- ✅ Critical bugs fixed
- ✅ Documentation complete

---

### Phase 14: Soft Launch (Week 8)
**Duration**: Ongoing

**Tasks**:
- [ ] Deploy to production
- [ ] Create 5 area chats in production
- [ ] Invite 3 test businesses (free trial)
  - Levin Iglut (Levi) - Accommodation
  - Aurora Safari Tours (Muonio) - Tour Operator
  - Northern Lights Photography (Rovaniemi) - Photography
- [ ] Email announcement to users in those 5 areas
- [ ] In-app banner: "New! Join local aurora chats"
- [ ] Social media announcement
- [ ] Monitor for bugs/issues daily
- [ ] Gather feedback from test businesses
- [ ] Track metrics (messages/day, chats joined, etc.)
- [ ] Iterate based on feedback

**Duration**: 2-4 weeks

**Success Criteria**:
- 50+ users join chats
- 100+ messages per day
- 3 businesses actively using chats
- <3 critical bugs reported
- Positive feedback from businesses

---

### Phase 15: Full Launch (Week 12+)
**Duration**: Ongoing

**Tasks**:
- [ ] Create remaining 10 Finland area chats
- [ ] Open business applications publicly
- [ ] Marketing push:
  - Email all users
  - Social media campaign
  - Reach out to all Finland aurora businesses
  - PR outreach to travel blogs/media
- [ ] Monitor metrics daily
- [ ] Respond to business inquiries within 24h
- [ ] Weekly reviews of moderation logs
- [ ] Monthly review of metrics vs targets
- [ ] Plan expansion (Norway, Sweden, Iceland)

**Success Criteria** (6 months post-launch):
- 15+ paying business subscriptions (€1,080 MRR)
- 500+ active chat users
- 1,000+ messages per day
- <5% churn rate
- Positive sentiment from community

---

## Timeline Summary

| Phase | Duration | Milestone |
|-------|----------|-----------|
| **Preparation** | 3-5 days | PRD approved, ready to code |
| **Core Development** | 6 weeks | All features implemented |
| **Testing** | 1 week | Bug-free, production-ready |
| **Soft Launch** | 2-4 weeks | 5 areas, 3 test businesses |
| **Iteration** | 2 weeks | Feedback incorporated |
| **Full Launch** | Week 12+ | All 15 Finland areas, public |

**Total Time to Soft Launch**: 8-10 weeks
**Total Time to Full Launch**: 12-14 weeks

---

## Risks & Mitigation

### Risk 1: Low Adoption from Businesses

**Risk**: Businesses don't see value in paying €79/month for chats

**Likelihood**: Medium
**Impact**: High (no revenue)

**Mitigation**:
- Offer 14-day free trial (low barrier to entry)
- Soft launch with 3 free test businesses for feedback
- Showcase success stories ("Levin Iglut got 10 bookings from chat")
- Provide analytics dashboard showing ROI
- Be flexible on pricing based on market feedback
- Consider pilot program: First 10 businesses at 50% off (€39/month) for 6 months

**Success Indicator**: If <20% conversion rate after soft launch, revisit pricing/value prop

---

### Risk 2: Spam & Low-Quality Content

**Risk**: Chats filled with spam, promotions, low-value messages → users leave

**Likelihood**: Medium
**Impact**: High (user churn)

**Mitigation**:
- Profanity filter catches inappropriate content
- Rate limiting prevents flooding (10 msg/min)
- Slow mode available for high-traffic chats
- Moderators can mute/ban quickly
- Clear community guidelines posted in chats
- Admin monitoring during soft launch
- User reporting functionality

**Success Indicator**: <2% spam rate, <10 user reports per 1,000 messages

---

### Risk 3: Technical Performance Issues

**Risk**: Chat polling creates high server load, slow response times

**Likelihood**: Low (with proper optimization)
**Impact**: Medium (poor UX)

**Mitigation**:
- Polling pauses when tab inactive
- Database indexes on key queries
- Pagination for messages (50 per page)
- Image compression (Sharp)
- Monitor server metrics (Vercel analytics)
- Upgrade to WebSockets if polling becomes bottleneck
- CDN for images (Cloudinary)

**Success Indicator**: <1.5s chat load time (p95), <1s message send time

---

### Risk 4: Stripe Integration Issues

**Risk**: Webhook failures, subscription state mismatches, payment failures not handled

**Likelihood**: Low (Stripe is reliable)
**Impact**: High (revenue loss, broken chats)

**Mitigation**:
- Thorough testing in Stripe test mode
- Webhook signature verification
- Idempotency keys for all Stripe operations
- Manual fallback: Admin can manually fix subscription issues
- Monitor Stripe dashboard for failed webhooks
- Email alerts for any webhook failures
- Grace period (7 days) gives time to fix issues

**Success Indicator**: 100% webhook success rate, no manual interventions needed

---

### Risk 5: Not Enough Chat Activity

**Risk**: Chats are created but silent (no messages) → users lose interest

**Likelihood**: Medium (cold start problem)
**Impact**: Medium (low engagement)

**Mitigation**:
- Seed area chats with initial content:
  - Pin welcome message
  - Admin posts first message: "Welcome! Share your aurora sightings here"
- Encourage businesses to post regularly (not just promotions):
  - "KP index hitting 5 tonight!"
  - "Great aurora conditions right now"
- Smart recommendations drive users to relevant chats
- Share sightings to chat (content from feed flows in)
- Gamification: "Local Expert" badge for top contributors

**Success Indicator**: Avg 10+ messages per chat per day, <20% chats with 0 messages

---

### Risk 6: Competition

**Risk**: Existing platforms (Facebook Groups, WhatsApp, Discord) already serve this need

**Likelihood**: High (these platforms exist)
**Impact**: Medium (harder to gain traction)

**Mitigation**:
- **Differentiation**: Location-based, aurora-specific, integrated with sightings/hunts
- Facebook Groups are cluttered, hard to discover, not location-specific
- WhatsApp groups are invite-only, hard to find
- Discord is gamer-focused, not intuitive for older travelers
- **Unique Value**: Direct integration with Aurora Addict features (share sightings, join hunts from chat)
- **Verified Businesses**: Trust factor (✓ badge)
- **Better Discovery**: Smart recommendations, nearby chats
- **Focused Community**: Aurora-only, no off-topic noise

**Success Indicator**: User feedback mentions ease of use vs alternatives

---

### Risk 7: Regulatory/Legal Issues

**Risk**: GDPR compliance, content liability, business licensing requirements

**Likelihood**: Low (with proper safeguards)
**Impact**: High (legal issues)

**Mitigation**:
- **GDPR**: Privacy policy, data export/deletion on request, user consent for geolocation
- **Content Moderation**: Clear terms of service, moderators remove illegal content, profanity filter
- **Business Verification**: Manual review prevents fraudulent businesses
- **User Reports**: Allow users to flag problematic content
- **Disclaimers**: Platform is not liable for user-generated content (Terms of Service)
- Consult with legal advisor before full launch

**Success Indicator**: Zero legal issues, GDPR-compliant

---

### Risk 8: Seasonal Business

**Risk**: Aurora season is Oct-Mar; businesses cancel subscriptions Apr-Sep

**Likelihood**: High (seasonal nature)
**Impact**: Medium (revenue fluctuation)

**Mitigation**:
- **Pause Feature**: Allow businesses to pause (max 3 months/year)
  - Keeps them subscribed, no churn
  - Chats remain active during pause (flexible)
- **Annual Discount**: Incentivize annual subscriptions (2 months free)
  - Lock in revenue for full year
  - 30% take annual vs monthly
- **Summer Use Cases**: Promote summer content ideas:
  - "Planning your winter trip? Join now to connect with locals"
  - "Summer aurora (rare but possible)"
  - "Midnight sun tourism content"
- **Diversify Categories**: Restaurants, shops operate year-round

**Success Indicator**: <10% seasonal cancellations, >30% annual subscriptions

---

## Future Enhancements

### Phase 4+ (Post-Launch)

**Real-Time Messaging (WebSockets)**:
- Replace polling with Pusher/Ably for instant updates
- Typing indicators
- Online/offline status
- Read receipts

**Push Notifications**:
- New message notifications (even when app closed)
- Join request notifications for business owners
- Subscription payment notifications
- Aurora alert notifications from chats

**Message Reactions**:
- React with emoji (❤️, 👍, 🔥, 👀, 🙏)
- Show reaction counts
- Quick engagement without typing

**@Mentions**:
- Tag users in messages
- Notification when mentioned
- Useful for business owners addressing specific questions

**Advanced Search**:
- Search within chat messages
- Filter by date range
- Search by user
- Find pinned messages

**Chat Analytics for Businesses**:
- Messages per day graph
- Member growth chart
- Top contributors
- Peak activity times
- Engagement rate
- Export data (CSV)

**Voice Messages** (if demand exists):
- Record short voice clips
- Useful for quick updates while out hunting
- Max 30 seconds
- Transcription (accessibility)

**Translation** (for international users):
- Auto-translate messages to user's language
- "Translate to English" button
- Support Finnish, English, German, French initially

**Map Integration**:
- Click area on Intelligence map → see chats for that area
- Click chat → highlight area on map
- Show active chats as markers on map

**User Roles & Permissions**:
- "VIP Member" role for private chats
- "Guide" role with special badge
- Custom roles per business chat

**Scheduled Messages**:
- Business owners schedule messages
- Useful for promotions at specific times
- Timezone-aware

**Rich Media**:
- GIF support
- Video messages (short clips)
- Location sharing on map
- Poll creation (vote on aurora viewing spot)

**API for Businesses**:
- REST API to post messages programmatically
- Integration with booking systems
- Webhook for new messages
- Analytics API

**Multi-Country Expansion**:
- Replicate for Norway (Tromsø, Alta, etc.)
- Sweden (Abisko, Kiruna, etc.)
- Iceland (Reykjavik area, Vik, etc.)
- Canada (Yellowknife, Whitehorse, Churchill)
- USA (Fairbanks, Alaska)

---

## Appendices

### Appendix A: Sample Data

**Area Chats** (Soft Launch):
1. Levi Aurora Community
2. Muonio Aurora Community
3. Rovaniemi Aurora Community
4. Inari Aurora Community
5. Saariselkä Aurora Community

**Test Business Chats**:
1. Levin Iglut (Public + Private) - Levi
2. Aurora Safari Tours (Public + Private) - Muonio
3. Northern Lights Photography (Public + Private) - Rovaniemi

### Appendix B: Email Templates

**Business Verification Approved**:
```
Subject: Welcome to Aurora Addict Business! 🎉

Hi [Business Name],

Great news! Your business has been verified on Aurora Addict.

You can now:
✅ Purchase chat subscriptions for your areas
✅ Engage directly with aurora hunters
✅ Build your VIP community

Get started: [Link to /business/subscriptions]

Questions? Reply to this email.

Best,
Aurora Addict Team
```

**Business Verification Rejected**:
```
Subject: Aurora Addict Business Verification Update

Hi [Business Name],

We've reviewed your business verification request and need more information:

[Rejection Reason]

Please update your information and resubmit: [Link]

Questions? Reply to this email.

Best,
Aurora Addict Team
```

**Subscription Trial Ending**:
```
Subject: Your Aurora Addict trial ends in 3 days

Hi [Business Name],

Your 14-day free trial for the [Area] chats ends on [Date].

So far:
• [X] members in your public chat
• [Y] members in your private chat
• [Z] messages exchanged

Your first payment of €[Amount] will be processed on [Date].

To avoid interruption, ensure your payment method is up to date: [Link]

Questions? Reply to this email.

Best,
Aurora Addict Team
```

**Payment Failed**:
```
Subject: Action Required: Payment Failed for Aurora Addict

Hi [Business Name],

We couldn't process your payment for the [Area] chat subscription.

Your chats will remain active for 7 days (until [Date]). Please update your payment method to avoid interruption: [Link]

After [Date], your chats will become read-only until payment is resolved.

Questions? Reply to this email.

Best,
Aurora Addict Team
```

### Appendix C: Community Guidelines

**Posted in every area chat as pinned message**:

```
Welcome to [Area] Aurora Community! 🌌

This is a space to:
✅ Share real-time aurora sightings
✅ Ask questions about viewing conditions
✅ Connect with fellow aurora hunters
✅ Share tips and locations

Please:
❌ No spam or advertising (unless relevant aurora services)
❌ Be respectful and kind
❌ No off-topic discussions
❌ No profanity or harassment

Moderators may remove messages or mute users who violate guidelines.

Happy hunting! 🔦
```

### Appendix D: Business Best Practices Guide

**Sent to business owners upon subscription**:

```markdown
# Getting the Most Out of Your Aurora Addict Chats

## Public Chat Best Practices

✅ **Do**:
- Share aurora forecasts and real-time updates
- Post educational content (how to photograph auroras, best settings)
- Respond to questions quickly
- Share availability for tours/bookings (not pushy)
- Engage with community (like a helpful neighbor, not a salesperson)

❌ **Don't**:
- Spam promotions every day
- Ignore customer questions
- Post only sales messages
- Be overly promotional

**Example Good Posts**:
- "KP index hitting 6 tonight! Looks like a great show. We have 2 spots left on our 8pm tour if anyone wants to join!"
- "Just got back from the lake. Aurora is active! Here's a photo 📸"
- "Tip: The clearing on Road 79 has been best the last few nights. Low light pollution."

## Private Chat Best Practices

Your private chat is for VIP customers. Think of it as a concierge service.

✅ **Use it for**:
- Exclusive offers for loyal customers
- Priority booking notifications
- Personal aurora wake-up calls
- Behind-the-scenes content
- Building a loyal community

❌ **Don't**:
- Approve everyone (defeats the purpose)
- Post the exact same content as public chat
- Ignore members

## Growing Your Community

- Pin a welcome message in both chats
- Respond to join requests within 24 hours
- Share sightings and hunts from your customers
- Ask questions to spark conversation ("Where's everyone hunting tonight?")
- Host occasional giveaways or contests

Need help? Email support@auroraaddict.com
```

---

## Document Approval

**Prepared By**: Product Team
**Review Requested From**:
- [ ] Platform Admin (Kristabel)
- [ ] Technical Lead
- [ ] Business Development

**Approval Status**: ⏳ Pending

**Next Steps**: Upon approval, proceed to Phase 1 implementation

---

**End of Document**
