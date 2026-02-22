# Supabase Client Setup

This directory contains Supabase client utilities for the Aurora Intel application.

## Files

- **client.ts** - Client-side Supabase client (use in Client Components)
- **server.ts** - Server-side Supabase client (use in Server Components, Server Actions, and Route Handlers)
- **middleware.ts** - Middleware helper for session management (optional)

## Current Setup

Your app is currently using:
- **Database**: Supabase PostgreSQL via Prisma ORM
- **Authentication**: NextAuth.js
- **Supabase Client**: Available for direct Supabase features (Storage, Realtime, etc.)

## Usage Examples

### Client Component (Browser)

```typescript
'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export default function MyComponent() {
  const supabase = createClient()
  const [data, setData] = useState(null)

  useEffect(() => {
    async function fetchData() {
      // Use Supabase client for realtime, storage, or direct queries
      const { data } = await supabase.from('your_table').select()
      setData(data)
    }
    fetchData()
  }, [])

  return <div>{/* Your component */}</div>
}
```

### Server Component

```typescript
import { createClient } from '@/lib/supabase/server'

export default async function ServerComponent() {
  const supabase = await createClient()

  // Use Supabase for server-side operations
  const { data } = await supabase.from('your_table').select()

  return <div>{/* Your component */}</div>
}
```

### Server Action

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'

export async function myServerAction() {
  const supabase = await createClient()

  // Perform server-side operations
  const { data, error } = await supabase
    .from('your_table')
    .insert({ column: 'value' })

  return { data, error }
}
```

### Route Handler (API Route)

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = await createClient()

  const { data, error } = await supabase.from('your_table').select()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}
```

## Supabase Features Available

With these clients, you can use:

1. **Supabase Storage** - File uploads and downloads
2. **Realtime** - Subscribe to database changes
3. **Direct Queries** - Alternative to Prisma for specific use cases
4. **Supabase Auth** - If you decide to migrate from NextAuth

## Authentication Notes

Currently, you're using **NextAuth** for authentication. Your Supabase clients will work with NextAuth sessions automatically. If you want to migrate to Supabase Auth in the future, you'll need to:

1. Update middleware.ts to use the Supabase session refresh
2. Migrate authentication logic from NextAuth to Supabase Auth
3. Update your sign-in/sign-up flows

## Middleware (Optional)

If you decide to use Supabase Auth, create a `middleware.ts` in your project root:

```typescript
import { updateSession } from '@/lib/supabase/middleware'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Refresh Supabase session
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

## Environment Variables

Make sure these are in your `.env` file (already configured):

```env
NEXT_PUBLIC_SUPABASE_URL="your-project-url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
```
