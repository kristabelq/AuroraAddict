# Aurora Addict - Step-by-Step Implementation Guide

## Table of Contents
1. [Project Setup](#project-setup)
2. [Phase 1: Core Infrastructure](#phase-1-core-infrastructure)
3. [Phase 2: Authentication & User Management](#phase-2-authentication--user-management)
4. [Phase 3: Sightings Feed (Default Landing Page)](#phase-3-sightings-feed-default-landing-page)
5. [Phase 4: Intelligence Hub & Aurora Forecasting](#phase-4-intelligence-hub--aurora-forecasting)
6. [Phase 5: Interactive Map](#phase-5-interactive-map)
7. [Phase 6: Sighting Management](#phase-6-sighting-management)
8. [Phase 7: Advanced Search & Filtering](#phase-7-advanced-search--filtering)
9. [Phase 8: Hunt Planning](#phase-8-hunt-planning)
10. [Phase 9: Aurora Accommodations](#phase-9-aurora-accommodations) 🆕
11. [Testing & Deployment](#testing--deployment)

---

## Project Setup

### 1. Initialize Next.js Project
```bash
npx create-next-app@latest aurora-addict --typescript --tailwind --app --src-dir
cd aurora-addict
```

### 2. Install Core Dependencies
```bash
# UI & Styling
npm install react-hot-toast
npm install leaflet react-leaflet react-leaflet-cluster
npm install @types/leaflet

# Forms & File Upload
npm install react-dropzone
npm install exifr

# Date Handling (v3.x for latest API)
npm install date-fns date-fns-tz

# Image Processing
npm install sharp

# Database & Authentication
npm install @prisma/client
npm install -D prisma
npm install next-auth
npm install @auth/prisma-adapter

# Payment Processing
npm install stripe @stripe/stripe-js

# Additional Dependencies
npm install suncalc
```

**⚠️ Important Notes for Next.js 15.5.5+**:
- All dynamic route params are now Promises
- Use `React.use()` to unwrap params in client components
- Update TypeScript to handle nullable types properly

**Example - Dynamic Route with Next.js 15**:
```typescript
// src/app/(main)/hunts/[id]/page.tsx
"use client";

import { use } from "react";
import { useEffect, useState } from "react";

export default function HuntDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Unwrap the Promise using React.use()
  const { id: huntId } = use(params);
  const [hunt, setHunt] = useState(null);

  useEffect(() => {
    // Now you can use huntId safely
    fetchHunt(huntId);
  }, [huntId]);

  const fetchHunt = async (id: string) => {
    const response = await fetch(`/api/hunts/${id}`);
    const data = await response.json();
    setHunt(data);
  };

  return <div>{/* Hunt details */}</div>;
}
```

### 3. Initialize Prisma
```bash
npx prisma init
```

### 4. Configure Environment Variables
Create `.env.local`:
```env
DATABASE_URL="postgresql://..."
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

### 5. Configure Tailwind
Update `tailwind.config.ts`:
```typescript
export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'aurora-green': '#00ff87',
        'aurora-blue': '#00d9ff',
      },
    },
  },
}
```

---

## Phase 1: Core Infrastructure

### Step 1.1: Database Schema Setup

**File**: `prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id                String    @id @default(cuid())
  name              String?
  email             String?   @unique
  emailVerified     DateTime?
  image             String?
  bio               String?
  onboardingComplete Boolean  @default(false)

  // Business fields 🆕
  userType          String    @default("individual") // "individual" or "business"
  businessName      String?
  businessCountry   String    @default("Finland")
  businessCity      String?
  businessServices  String[]  @default([])
  businessDescription String?
  businessWebsite   String?
  businessCategory  String?
  businessEmail     String?
  businessLicenseUrl String?
  idDocumentUrl     String?

  // Location fields 🆕
  latitude          Float?
  longitude         Float?

  // Verification fields 🆕
  verificationStatus String   @default("unverified") // "unverified", "pending", "verified"
  verificationSubmittedAt DateTime?

  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  accounts          Account[]
  sessions          Session[]
  sightings         Sighting[]
  hunts             Hunt[]
  huntParticipants  HuntParticipant[]
  comments          Comment[]
  likes             Like[]
  roomTypes         RoomType[] 🆕

  @@index([latitude, longitude])
}

model Sighting {
  id            String   @id @default(cuid())
  userId        String
  caption       String?
  latitude      Float
  longitude     Float
  location      String
  images        String[]
  videos        String[]
  sightingType  String   @default("realtime")
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  comments    Comment[]
  likes       Like[]

  @@index([createdAt])
  @@index([latitude, longitude])
}

model Hunt {
  id          String   @id @default(cuid())
  name        String
  description String?
  userId      String
  startDate   DateTime
  endDate     DateTime
  latitude    Float?
  longitude   Float?
  location    String?
  hideLocation Boolean @default(false)
  isPublic    Boolean  @default(true)
  isPaid      Boolean  @default(false)
  price       Float?
  capacity    Int?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  participants HuntParticipant[]

  @@index([startDate])
  @@index([latitude, longitude])
}

model HuntParticipant {
  id        String   @id @default(cuid())
  huntId    String
  userId    String
  status    String   @default("pending")
  paidAt    DateTime?
  joinedAt  DateTime @default(now())

  hunt      Hunt     @relation(fields: [huntId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([huntId, userId])
}

model Comment {
  id         String   @id @default(cuid())
  content    String
  userId     String
  sightingId String
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  sighting   Sighting @relation(fields: [sightingId], references: [id], onDelete: Cascade)

  @@index([sightingId])
}

model Like {
  id         String   @id @default(cuid())
  userId     String
  sightingId String
  createdAt  DateTime @default(now())

  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  sighting   Sighting @relation(fields: [sightingId], references: [id], onDelete: Cascade)

  @@unique([userId, sightingId])
}

// Accommodation Room Types 🆕
model RoomType {
  id            String   @id @default(cuid())
  userId        String
  name          String
  description   String?
  capacity      Int      @default(2)
  priceFrom     Float?
  currency      String   @default("EUR")
  amenities     String[]
  images        String[]
  coverImage    String?
  isActive      Boolean  @default(true)
  displayOrder  Int      @default(0)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([isActive])
}

// NextAuth models
model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}
```

**Generate and push schema**:
```bash
npx prisma generate
npx prisma db push
```

### Step 1.2: Prisma Client Setup

**File**: `src/lib/prisma.ts`
```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

### Step 1.3: App Layout

**File**: `src/app/layout.tsx`
```typescript
import type { Metadata } from "next";
import "./globals.css";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "Aurora Addict - Plan Your Aurora Hunt",
  description: "Join aurora chasers worldwide to track, plan, and share northern lights sightings",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>
          {children}
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#1a1f2e',
                color: '#fff',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              },
              success: {
                iconTheme: {
                  primary: '#00ff87',
                  secondary: '#1a1f2e',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ff3b30',
                  secondary: '#1a1f2e',
                },
              },
            }}
          />
        </SessionProvider>
      </body>
    </html>
  );
}
```

---

## Phase 2: Authentication & User Management

### Step 2.1: NextAuth Configuration

**File**: `src/lib/auth.ts`
```typescript
import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    session: async ({ session, user }) => {
      if (session?.user) {
        session.user.id = user.id;
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { onboardingComplete: true },
        });
        session.user.onboardingComplete = dbUser?.onboardingComplete || false;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
};
```

**File**: `src/app/api/auth/[...nextauth]/route.ts`
```typescript
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
```

### Step 2.2: Session Provider

**File**: `src/components/providers/SessionProvider.tsx`
```typescript
"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";

export function SessionProvider({ children }: { children: React.ReactNode }) {
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>;
}
```

### Step 2.3: Sign In Page

**File**: `src/app/auth/signin/page.tsx`
```typescript
"use client";

import { signIn } from "next-auth/react";

export default function SignIn() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-purple-950/20 to-black flex items-center justify-center">
      <div className="text-center max-w-md px-4">
        <h1 className="text-4xl font-bold text-white mb-4">Welcome to Aurora Addict</h1>
        <p className="text-gray-400 mb-8">Track, plan, and share your aurora experiences</p>
        <button
          onClick={() => signIn("google", { callbackUrl: "/" })}
          className="w-full bg-white text-black font-medium py-3 px-6 rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center gap-3"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24">
            {/* Google icon SVG path */}
          </svg>
          Continue with Google
        </button>
      </div>
    </div>
  );
}
```

### Step 2.4: Onboarding Flow

**File**: `src/app/onboarding/page.tsx`
```typescript
"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function OnboardingPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [bio, setBio] = useState("");

  const handleComplete = async () => {
    await fetch("/api/user/complete-onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bio }),
    });
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-purple-950/20 to-black p-4">
      {/* Onboarding form UI */}
    </div>
  );
}
```

**File**: `src/app/api/user/complete-onboarding/route.ts`
```typescript
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { bio } = await req.json();

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      bio,
      onboardingComplete: true,
    },
  });

  return NextResponse.json({ success: true });
}
```

---

## Phase 3: Sightings Feed (Default Landing Page)

**Note**: The homepage (`/`) now displays the Sightings Feed with three tabs (Gallery, Live Feed, Live Cameras). The Intelligence Hub with Aurora forecasting is accessible via the navigation menu.

### Step 3.1: Homepage - Sightings Feed

**File**: `src/app/(main)/page.tsx`
```typescript
import FeedPage from "./feed/page";

export default function Homepage() {
  return <FeedPage />;
}
```

**File**: `src/app/(main)/feed/page.tsx` (simplified example)
```typescript
"use client";

import { useState, useEffect } from "react";

type TabType = "gallery" | "live-feed" | "cameras";

export default function FeedPage() {
  const [activeTab, setActiveTab] = useState<TabType>("live-feed"); // Default to Live Feed
  const [sightings, setSightings] = useState([]);

  useEffect(() => {
    fetchSightings();
  }, []);

  const fetchSightings = async () => {
    const response = await fetch("/api/sightings");
    const data = await response.json();
    setSightings(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-purple-950/20 to-black pb-24">
      {/* Tab Navigation */}
      <div className="flex border-b border-white/10">
        <button
          onClick={() => setActiveTab("gallery")}
          className={activeTab === "gallery" ? "active" : ""}
        >
          Gallery
        </button>
        <button
          onClick={() => setActiveTab("live-feed")}
          className={activeTab === "live-feed" ? "active" : ""}
        >
          Live Feed
        </button>
        <button
          onClick={() => setActiveTab("cameras")}
          className={activeTab === "cameras" ? "active" : ""}
        >
          Live Cameras
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "live-feed" && (
        <div>
          {/* Instagram-style feed with posts, likes, comments */}
          {sightings.map((sighting) => (
            <div key={sighting.id}>{/* Post component */}</div>
          ))}
        </div>
      )}

      {activeTab === "gallery" && (
        <div className="grid grid-cols-3 gap-1">
          {/* Grid layout of all sighting images */}
        </div>
      )}

      {activeTab === "cameras" && (
        <div>
          {/* Real-time aurora camera feeds */}
        </div>
      )}
    </div>
  );
}
```

---

## Phase 4: Intelligence Hub & Aurora Forecasting

**Note**: This is now accessed via the navigation menu, not the default homepage.

### Step 4.1: Intelligence Hub with KP Index

**File**: `src/app/(main)/intelligence/page.tsx`
```typescript
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

const AuroraMap = dynamic(() => import("@/components/map/AuroraMap"), {
  ssr: false,
});

export default function IntelligencePage() {
  const router = useRouter();
  const [currentKp, setCurrentKp] = useState<string>("0.00");
  const [loadingKp, setLoadingKp] = useState(true);

  useEffect(() => {
    fetchCurrentKp();
  }, []);

  const fetchCurrentKp = async () => {
    try {
      const response = await fetch(
        "https://services.swpc.noaa.gov/products/noaa-planetary-k-index-forecast.json"
      );
      const data = await response.json();
      const formattedData = data.slice(1);
      const latestObserved = formattedData
        .filter((row: string[]) => row[2] === "observed")
        .pop();

      if (latestObserved) {
        setCurrentKp(latestObserved[1]);
      }
      setLoadingKp(false);
    } catch (error) {
      setLoadingKp(false);
    }
  };

  const getKpColor = (kp: number) => {
    if (kp >= 5) return "#ff0000";
    if (kp >= 4) return "#ffaa00";
    if (kp >= 3) return "#ffff00";
    return "#00ff00";
  };

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col">
      {/* KP Index Card */}
      <div className="bg-[#1a1f2e]/95 backdrop-blur-lg border-b border-white/10 p-4">
        <div
          onClick={() => router.push("/forecast")}
          className="bg-gradient-to-br from-purple-900/40 to-blue-900/40 rounded-2xl p-6 cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-gray-400 text-sm mb-1">Current KP Index</div>
              <div
                className="text-5xl font-bold"
                style={{ color: getKpColor(parseFloat(currentKp)) }}
              >
                {parseFloat(currentKp).toFixed(1)}
              </div>
            </div>
            <div className="text-xs text-gray-400">View Forecast</div>
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <AuroraMap />
      </div>
    </div>
  );
}
```

### Step 4.2: Detailed Forecast Page

**File**: `src/app/(main)/forecast/page.tsx`
```typescript
"use client";

import { useState, useEffect } from "react";
import SyncedAuroraPlayers from "@/components/forecast/SyncedAuroraPlayers";

export default function ForecastPage() {
  const [kpData, setKpData] = useState([]);
  const [currentKp, setCurrentKp] = useState<string>("0.00");

  useEffect(() => {
    fetchKpData();
  }, []);

  const fetchKpData = async () => {
    const response = await fetch(
      "https://services.swpc.noaa.gov/products/noaa-planetary-k-index-forecast.json"
    );
    const data = await response.json();
    const formattedData = data.slice(1).map((row: string[]) => ({
      time_tag: row[0],
      kp: row[1],
      observed: row[2],
      noaa_scale: row[3],
    }));
    setKpData(formattedData);

    const latestObserved = formattedData
      .filter((d) => d.observed === "observed")
      .pop();
    if (latestObserved) {
      setCurrentKp(latestObserved.kp);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-purple-950/20 to-black pb-24">
      {/* Current KP Display */}
      {/* Aurora Animations */}
      <SyncedAuroraPlayers />
      {/* KP Understanding Info */}
      {/* Upcoming Hours Chart */}
      {/* Long-term Forecast Chart */}
    </div>
  );
}
```

### Step 4.3: Synchronized Aurora Animation Player

**File**: `src/components/forecast/SyncedAuroraPlayers.tsx`
```typescript
"use client";

import { useState, useEffect, useRef } from "react";

export default function SyncedAuroraPlayers() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [northFrames, setNorthFrames] = useState([]);
  const [southFrames, setSouthFrames] = useState([]);

  const fetchFramesForHemisphere = async (hemisphere: "north" | "south") => {
    const response = await fetch(
      `https://services.swpc.noaa.gov/images/animations/ovation/${hemisphere}/`
    );
    const html = await response.text();
    // Parse HTML and extract frame URLs
    // Sort by timestamp
    return frames;
  };

  useEffect(() => {
    if (isPlaying && northFrames.length > 0) {
      const interval = setInterval(() => {
        setCurrentFrame((prev) => (prev + 1) % northFrames.length);
      }, 200);
      return () => clearInterval(interval);
    }
  }, [isPlaying, northFrames.length]);

  return (
    <div>
      {/* Time display */}
      {/* Image displays for both hemispheres */}
      {/* Play/pause control */}
      {/* Timeline slider */}
    </div>
  );
}
```

---

---

## Phase 5: Interactive Map

### Step 5.1: Aurora Map Component

**File**: `src/components/map/AuroraMap.tsx`
```typescript
"use client";

import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Rectangle } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";

export default function AuroraMap() {
  const [sightings, setSightings] = useState([]);
  const [hunts, setHunts] = useState([]);
  const [auroraData, setAuroraData] = useState(null);
  const [overlayMode, setOverlayMode] = useState("all");

  useEffect(() => {
    fetchSightings();
    fetchHunts();
    fetchAuroraData();
  }, []);

  const fetchAuroraData = async () => {
    const response = await fetch(
      "https://services.swpc.noaa.gov/json/ovation_aurora_latest.json"
    );
    const data = await response.json();
    setAuroraData(data);
  };

  return (
    <MapContainer center={[64.9631, -19.0208]} zoom={5}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      {/* Aurora overlay */}
      {auroraData && auroraData.coordinates.map((coord, index) => (
        <Rectangle key={index} bounds={...} pathOptions={{...}} />
      ))}

      {/* Sighting markers */}
      <MarkerClusterGroup>
        {sightings.map((sighting) => (
          <Marker key={sighting.id} position={[...]}>
            <Popup>{/* Sighting info */}</Popup>
          </Marker>
        ))}
      </MarkerClusterGroup>

      {/* Hunt markers */}
    </MapContainer>
  );
}
```

---

## Phase 6: Sighting Management

### Step 6.1: Create Sighting Page

**File**: `src/app/(main)/sightings/new/page.tsx`
```typescript
"use client";

import { useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import exifr from "exifr";
import LocationAutocomplete from "@/components/forms/LocationAutocomplete";

export default function NewSightingPage() {
  const [sightingType, setSightingType] = useState<"realtime" | "past">("realtime");
  const [images, setImages] = useState([]);
  const [isMobile, setIsMobile] = useState(false);
  const [sightingDate, setSightingDate] = useState("");
  const [sightingTime, setSightingTime] = useState("");

  useEffect(() => {
    setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
  }, []);

  const onDrop = async (acceptedFiles) => {
    // Extract EXIF data
    // Create previews
    // Add to images array
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    maxFiles: sightingType === "past" ? 10 : 5,
  });

  return (
    <form onSubmit={handleSubmit}>
      {/* Sighting Type Selection */}
      {/* Mobile warning for real-time */}
      {/* Image upload */}
      {/* Date/time for past sightings */}
      {/* Caption */}
      {/* Location */}
    </form>
  );
}
```

### Step 6.2: Create Sighting API

**File**: `src/app/api/sightings/create/route.ts`
```typescript
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import sharp from "sharp";
import { writeFile, mkdir } from "fs/promises";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const imageFiles = formData.getAll("images");
  const sightingType = formData.get("sightingType");

  // Process images with Sharp
  const imageUrls = [];
  for (const file of imageFiles) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = `${session.user.id}-${Date.now()}.jpg`;

    await sharp(buffer)
      .resize(1920, 1080, { fit: "inside" })
      .jpeg({ quality: 85 })
      .toFile(`public/uploads/sightings/${filename}`);

    imageUrls.push(`/uploads/sightings/${filename}`);
  }

  // Create sighting in database
  const sighting = await prisma.sighting.create({
    data: {
      userId: session.user.id,
      caption: formData.get("caption"),
      location: formData.get("location"),
      latitude: parseFloat(formData.get("latitude")),
      longitude: parseFloat(formData.get("longitude")),
      sightingType,
      images: imageUrls,
    },
  });

  return NextResponse.json({ success: true, sighting });
}
```

### Step 6.3: Location Autocomplete Component

**File**: `src/components/forms/LocationAutocomplete.tsx`
```typescript
"use client";

import { useState, useEffect } from "react";

export default function LocationAutocomplete({ value, onChange }) {
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    if (value.length < 3) return;

    const timeout = setTimeout(async () => {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${value}`,
        { headers: { "User-Agent": "AuroraAddict/1.0" } }
      );
      const data = await response.json();
      setSuggestions(data);
    }, 500);

    return () => clearTimeout(timeout);
  }, [value]);

  return (
    <div className="relative">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value, "", "")}
      />
      {suggestions.length > 0 && (
        <div className="absolute z-20 bg-gray-800 rounded-lg">
          {suggestions.map((s) => (
            <button
              key={s.place_id}
              onClick={() => onChange(s.display_name, s.lat, s.lon)}
            >
              {s.display_name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## Phase 7: Advanced Search & Filtering

### Step 7.1: Search Page with Filters

**File**: `src/app/(main)/search/page.tsx`
```typescript
"use client";

import { useState, useEffect } from "react";

export default function SearchPage() {
  const [sightings, setSightings] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    // Haversine formula
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const filteredSightings = sightings
    .filter((s) => {
      // Text search
      const matchesSearch = s.location
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

      // Month filter
      const sightingDate = new Date(s.createdAt);
      const matchesMonth =
        !selectedMonth || sightingDate.getMonth() + 1 === parseInt(selectedMonth);

      // Year filter
      const matchesYear =
        !selectedYear || sightingDate.getFullYear() === parseInt(selectedYear);

      return matchesSearch && matchesMonth && matchesYear;
    })
    .map((s) => {
      // Calculate distance
      if (selectedLocation) {
        const distance = calculateDistance(
          selectedLocation.lat,
          selectedLocation.lng,
          s.latitude,
          s.longitude
        );
        return { ...s, distance };
      }
      return s;
    })
    .filter((s) => {
      // 400km radius filter
      if (selectedLocation && s.distance) {
        return s.distance <= 400;
      }
      return true;
    })
    .sort((a, b) => {
      // Sort by distance or date
      if (selectedLocation && a.distance && b.distance) {
        return a.distance - b.distance;
      }
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

  return (
    <div>
      {/* Search bar */}
      {/* Filter button */}
      {/* Filter panel */}
      {/* Results grid */}
    </div>
  );
}
```

---

## Phase 8: Hunt Planning

### Step 8.1: Create Hunt Page

**File**: `src/app/(main)/plan/page.tsx`
```typescript
"use client";

import { useState } from "react";
import LocationAutocomplete from "@/components/forms/LocationAutocomplete";

export default function PlanHuntPage() {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    startDate: "",
    endDate: "",
    location: "",
    latitude: null,
    longitude: null,
    isPublic: true,
    hideLocation: false,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await fetch("/api/hunts/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Hunt details form */}
    </form>
  );
}
```

### Step 8.2: Create Hunt API

**File**: `src/app/api/hunts/create/route.ts`
```typescript
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await req.json();

  const hunt = await prisma.hunt.create({
    data: {
      ...data,
      userId: session.user.id,
    },
  });

  return NextResponse.json({ success: true, hunt });
}
```

---

## Phase 9: Aurora Accommodations 🆕

This phase implements a comprehensive accommodation discovery system for aurora-viewing properties worldwide, with real-time aurora metrics and actual success rates based on user sighting data.

### Step 9.1: Geomagnetic Coordinate Library

**File**: `src/lib/geomagneticCoordinates.ts`

```typescript
// IGRF (International Geomagnetic Reference Field) model
// Simplified coefficients for 2025 epoch
export function toGeomagneticCoordinates(lat: number, lon: number) {
  // Convert geographic to geomagnetic coordinates
  // Using dipole approximation with 2025 magnetic pole position
  const geomagneticPoleLatitude = 86.5; // North geomagnetic pole 2025
  const geomagneticPoleLongitude = -166.6; // North geomagnetic pole 2025

  // Convert to radians
  const latRad = (lat * Math.PI) / 180;
  const lonRad = (lon * Math.PI) / 180;
  const poleLatRad = (geomagneticPoleLatitude * Math.PI) / 180;
  const poleLonRad = (geomagneticPoleLongitude * Math.PI) / 180;

  // Calculate geomagnetic latitude using spherical trigonometry
  const geomagneticLat =
    Math.asin(
      Math.sin(poleLatRad) * Math.sin(latRad) +
        Math.cos(poleLatRad) * Math.cos(latRad) * Math.cos(lonRad - poleLonRad)
    ) *
    (180 / Math.PI);

  return {
    geomagneticLat,
    geographicLat: lat,
    geographicLon: lon,
  };
}

export function getAuroralOvalLatitude(kp: number): number {
  // Equatorward edge of auroral oval
  // Formula: 67° - 2.5 * Kp
  return 67 - 2.5 * kp;
}
```

### Step 9.2: Accommodation Seed Script

**File**: `prisma/seed-accommodations.ts`

```typescript
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding accommodations...");

  // Example: Kakslauttanen Arctic Resort
  const kakslauttanen = await prisma.user.create({
    data: {
      email: "booking@kakslauttanen.fi",
      name: "Kakslauttanen Arctic Resort",
      userType: "business",
      businessName: "Kakslauttanen Arctic Resort",
      businessCountry: "Finland",
      businessCity: "Saariselkä",
      businessServices: ["accommodation"],
      businessDescription:
        "Original glass igloos in the heart of Finnish Lapland with unobstructed aurora views.",
      businessWebsite: "https://www.kakslauttanen.fi",
      businessCategory: "Luxury Resort",
      verificationStatus: "verified",
      latitude: 68.4145,
      longitude: 27.5815,
      roomTypes: {
        create: [
          {
            name: "Glass Igloo",
            description: "Iconic glass igloo with thermal glass ceiling for aurora viewing",
            capacity: 2,
            priceFrom: 550,
            currency: "EUR",
            amenities: [
              "Glass Dome",
              "360° Aurora View",
              "Heated Floor",
              "Private Sauna",
              "Aurora Alarm",
            ],
            images: ["/accommodations/kakslauttanen-1.jpg"],
            coverImage: "/accommodations/kakslauttanen-1.jpg",
            isActive: true,
            displayOrder: 1,
          },
          {
            name: "Kelo-Glass Igloo",
            description: "Log cabin with glass igloo bedroom section",
            capacity: 4,
            priceFrom: 750,
            currency: "EUR",
            amenities: [
              "Glass Dome Bedroom",
              "Private Sauna",
              "Fireplace",
              "Kitchen",
              "Aurora Alarm",
            ],
            images: ["/accommodations/kakslauttanen-2.jpg"],
            coverImage: "/accommodations/kakslauttanen-2.jpg",
            isActive: true,
            displayOrder: 2,
          },
        ],
      },
    },
  });

  // Add 60+ more properties from Finland, Norway, Sweden, Iceland, Alaska, Canada, Greenland
  // (See full seed script in project files)

  console.log("✅ Successfully seeded 63 accommodations");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

**Run seed script**:
```bash
npx tsx prisma/seed-accommodations.ts
```

### Step 9.3: Accommodations API Route

**File**: `src/app/api/accommodations/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import {
  toGeomagneticCoordinates,
  getAuroralOvalLatitude,
} from "@/lib/geomagneticCoordinates";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const country = searchParams.get("country");
    const minKp = searchParams.get("minKp")
      ? parseFloat(searchParams.get("minKp")!)
      : null;
    const features = searchParams.get("features")?.split(",") || [];

    // Build where clause
    const where: any = {
      userType: "business",
      businessServices: {
        has: "accommodation",
      },
      verificationStatus: "verified",
      latitude: { not: null },
      longitude: { not: null },
    };

    if (country && country !== "all") {
      where.businessCountry = country;
    }

    // Fetch accommodations with room types
    const accommodations = await prisma.user.findMany({
      where,
      include: {
        roomTypes: {
          where: { isActive: true },
          orderBy: { displayOrder: "asc" },
        },
      },
      orderBy: [
        { businessCountry: "asc" },
        { businessCity: "asc" },
        { businessName: "asc" },
      ],
    });

    // Fetch sightings for actual success rate calculation
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const allSightings = await prisma.sighting.findMany({
      where: {
        createdAt: { gte: oneYearAgo },
      },
      select: {
        latitude: true,
        longitude: true,
        createdAt: true,
      },
    });

    // Calculate aurora metrics for each accommodation
    const accommodationsWithMetrics = accommodations
      .map((accommodation) => {
        if (!accommodation.latitude || !accommodation.longitude) {
          return null;
        }

        // Convert to geomagnetic coordinates
        const { geomagneticLat } = toGeomagneticCoordinates(
          accommodation.latitude,
          accommodation.longitude
        );

        // Calculate minimum Kp needed
        const minKpForVisibility = Math.max(
          0,
          Math.ceil((67 - geomagneticLat) / 2.5)
        );

        // Calculate actual success rate from real sightings (100km radius)
        const radiusInDegrees = 1.0;
        const nearbySightings = allSightings.filter((sighting) => {
          const latDiff = Math.abs(sighting.latitude - accommodation.latitude);
          const lonDiff = Math.abs(
            sighting.longitude - accommodation.longitude
          );
          const distance = Math.sqrt(latDiff * latDiff + lonDiff * lonDiff);
          return distance <= radiusInDegrees;
        });

        const uniqueDays = new Set(
          nearbySightings.map((s) => s.createdAt.toISOString().split("T")[0])
        );
        const daysWithSightings = uniqueDays.size;
        const actualSuccessRate = Math.round((daysWithSightings / 365) * 100);

        // Estimated percentage based on geomagnetic latitude
        let estimatedSightingPercentage = 0;
        if (geomagneticLat >= 65) {
          estimatedSightingPercentage = 70 + (geomagneticLat - 65) * 4;
        } else if (geomagneticLat >= 62) {
          estimatedSightingPercentage = 40 + (geomagneticLat - 62) * 6.67;
        } else if (geomagneticLat >= 58) {
          estimatedSightingPercentage = 20 + (geomagneticLat - 58) * 5;
        } else if (geomagneticLat >= 50) {
          estimatedSightingPercentage = 5 + (geomagneticLat - 50) * 1.875;
        } else {
          estimatedSightingPercentage = Math.max(1, geomagneticLat / 10);
        }

        // Quality rating
        let auroraQuality: "Excellent" | "Very Good" | "Good" | "Fair" | "Limited" =
          "Limited";
        if (geomagneticLat >= 65) auroraQuality = "Excellent";
        else if (geomagneticLat >= 62) auroraQuality = "Very Good";
        else if (geomagneticLat >= 58) auroraQuality = "Good";
        else if (geomagneticLat >= 50) auroraQuality = "Fair";

        // Feature filtering
        const roomTypeAmenities = accommodation.roomTypes.flatMap(
          (rt) => rt.amenities
        );
        const hasRequestedFeatures =
          features.length === 0 ||
          features.every((feature) =>
            roomTypeAmenities.some((amenity) =>
              amenity.toLowerCase().includes(feature.toLowerCase())
            )
          );

        if (!hasRequestedFeatures) return null;
        if (minKp !== null && minKpForVisibility > minKp) return null;

        return {
          id: accommodation.id,
          businessName: accommodation.businessName,
          city: accommodation.businessCity,
          country: accommodation.businessCountry,
          latitude: accommodation.latitude,
          longitude: accommodation.longitude,
          description: accommodation.businessDescription,
          website: accommodation.businessWebsite,
          geomagneticLat: Math.round(geomagneticLat * 100) / 100,
          minKpRequired: minKpForVisibility,
          estimatedSightingPercentage: Math.round(estimatedSightingPercentage),
          actualSuccessRate,
          daysWithSightings,
          hasSightingData: daysWithSightings > 0,
          auroraQuality,
          roomTypes: accommodation.roomTypes.map((rt) => ({
            id: rt.id,
            name: rt.name,
            description: rt.description,
            capacity: rt.capacity,
            priceFrom: rt.priceFrom,
            currency: rt.currency,
            amenities: rt.amenities,
            images: rt.images,
            coverImage: rt.coverImage,
          })),
        };
      })
      .filter((a) => a !== null);

    return NextResponse.json({
      accommodations: accommodationsWithMetrics,
      countries: [
        ...new Set(accommodations.map((a) => a.businessCountry)),
      ].sort(),
      total: accommodationsWithMetrics.length,
    });
  } catch (error) {
    console.error("Error fetching accommodations:", error);
    return NextResponse.json(
      { error: "Failed to fetch accommodations" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
```

### Step 9.4: Accommodations Page

**File**: `src/app/(main)/accommodations/page.tsx`

```typescript
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

type Accommodation = {
  id: string;
  businessName: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  description: string;
  website: string;
  geomagneticLat: number;
  minKpRequired: number;
  estimatedSightingPercentage: number;
  actualSuccessRate: number;
  daysWithSightings: number;
  hasSightingData: boolean;
  auroraQuality: string;
  roomTypes: RoomType[];
};

export default function AccommodationsPage() {
  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const [countries, setCountries] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedCountry, setSelectedCountry] = useState("all");
  const [maxKp, setMaxKp] = useState<number | null>(null);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);

  useEffect(() => {
    fetchAccommodations();
  }, [selectedCountry, maxKp, selectedFeatures]);

  const fetchAccommodations = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (selectedCountry !== "all") params.append("country", selectedCountry);
    if (maxKp !== null) params.append("minKp", maxKp.toString());
    if (selectedFeatures.length > 0)
      params.append("features", selectedFeatures.join(","));

    const response = await fetch(`/api/accommodations?${params}`);
    const data = await response.json();

    setAccommodations(data.accommodations);
    setCountries(data.countries);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-purple-950/20 to-black pb-24 pt-6 px-4">
      <h1 className="text-3xl font-bold text-white mb-2">
        Aurora Accommodations
      </h1>
      <p className="text-gray-400 mb-6">
        Find the perfect place to witness the northern lights
      </p>

      {/* Filters */}
      <div className="bg-[#1a1f2e] rounded-xl p-4 mb-6">
        {/* Country selector */}
        {/* Max Kp slider */}
        {/* Feature checkboxes (Glass Igloo, Private Sauna, Hot Tub) */}
      </div>

      {/* Results grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accommodations.map((acc) => (
          <div
            key={acc.id}
            className="bg-[#1a1f2e] rounded-xl overflow-hidden"
          >
            {/* Cover image */}
            {/* Business name and location */}
            {/* Aurora metrics (estimated %, actual success rate) */}
            {/* Room type carousel */}
            {/* Website link */}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Step 9.5: Add Navigation Card to Intelligence Page

**File**: `src/app/(main)/intelligence/page.tsx` (update)

Add this card to the "Aurora Intel" or "Expert Intel" tab:

```typescript
{/* Accommodations Card */}
<div
  onClick={() => router.push("/accommodations")}
  className="bg-gradient-to-br from-emerald-900/40 to-teal-900/40 rounded-2xl p-6 cursor-pointer hover:scale-105 transition-transform"
>
  <div className="flex items-start gap-4">
    <div className="text-4xl">🏔️</div>
    <div className="flex-1">
      <h3 className="text-white font-bold text-lg mb-2">
        Aurora Accommodations
      </h3>
      <p className="text-gray-300 text-sm mb-3">
        Discover glass igloos, aurora cabins, and specialty lodges worldwide
      </p>
      <div className="text-xs text-teal-400">
        80+ Properties • Real Success Rates
      </div>
    </div>
  </div>
</div>
```

### Step 9.6: Database Migration

Update your schema and sync to database:

```bash
# Update schema
npx prisma db push

# Seed accommodations
npx tsx prisma/seed-accommodations.ts

# Restart dev server
npm run dev
```

### Implementation Checklist

- [ ] Add geomagnetic coordinate conversion library
- [ ] Update User schema with business and location fields
- [ ] Create RoomType model
- [ ] Implement accommodations API route
- [ ] Create seed script with 60+ properties
- [ ] Build accommodations page with filters
- [ ] Add navigation card to Intelligence page
- [ ] Test aurora metric calculations
- [ ] Test actual success rate calculations from sightings
- [ ] Verify all filters work correctly

---

## Testing & Deployment

### Testing Checklist
- [ ] Authentication flow (sign in/out)
- [ ] Onboarding completion
- [ ] KP Index data fetching
- [ ] Aurora overlay rendering
- [ ] Sighting creation (real-time and past)
- [ ] Image upload and processing
- [ ] Location autocomplete
- [ ] Search and filtering
- [ ] Hunt creation and joining
- [ ] Map interactions

### Deployment Steps

1. **Set up production database**
```bash
# Update DATABASE_URL in production environment
npx prisma generate
npx prisma db push
```

2. **Build application**
```bash
npm run build
```

3. **Deploy to Vercel**
```bash
npm install -g vercel
vercel --prod
```

4. **Configure environment variables in Vercel**
- `DATABASE_URL`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

---

## Maintenance & Updates

### Regular Tasks
- Monitor NOAA API uptime
- Check database performance
- Review error logs
- Update dependencies monthly
- Backup database weekly

### Future Improvements
- Add push notifications
- Implement CDN for images
- Add unit tests
- Set up CI/CD pipeline
- Implement rate limiting
- Add caching layer

---

**Document Version**: 1.2
**Last Updated**: November 6, 2025
**Estimated Implementation Time**: 5-7 weeks for full-stack developer

**Recent Updates**:
- Added Phase 9: Aurora Accommodations implementation 🆕
  - Geomagnetic coordinate conversion library
  - 80+ verified accommodations database
  - Real-time aurora metrics with actual success rates
  - User schema updates for business accounts
  - RoomType model for accommodation room types
  - Comprehensive API route with filtering capabilities
- Updated default landing page to Sightings Feed (Phase 3)
- Renumbered phases to reflect new structure
- Added Next.js 15.5.5 dynamic route examples
- Updated dependencies (date-fns-tz v3.x, Stripe, suncalc)
- Added comprehensive Next.js 15 compatibility notes
