# Supabase Auth Integration with NextAuth

This document explains how Supabase Auth is integrated with NextAuth in the Aurora Intel application.

## Overview

Your app now uses a **hybrid authentication system**:
- **NextAuth** handles the authentication flow (sign-in, sign-up, sessions)
- **Supabase Auth** users are automatically synced for using Supabase features
- Users in your Prisma database are mirrored in Supabase Auth

## How It Works

### 1. User Registration Flow

When a user registers:
1. User is created in your Prisma database (PostgreSQL via Supabase)
2. User is automatically synced to Supabase Auth
3. User can now use both NextAuth sessions AND Supabase features

```typescript
// In register API route
const user = await prisma.user.create({ ... })

// Automatically synced to Supabase Auth
await syncUserToSupabase({
  id: user.id,
  email: user.email,
  name: user.name,
})
```

### 2. User Sign-In Flow

When a user signs in:
1. NextAuth validates credentials
2. User session is created
3. User is synced to Supabase Auth (if not already synced)
4. User can access Supabase features with their authenticated session

### 3. Using Supabase Features

#### Client Components

```typescript
'use client'

import { useSupabase } from '@/hooks/useSupabase'

export default function MyComponent() {
  const { supabase, isAuthenticated, user } = useSupabase()

  // Upload to Supabase Storage
  async function uploadImage(file: File) {
    if (!isAuthenticated) return

    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(`${user.id}/${file.name}`, file)

    return { data, error }
  }

  // Subscribe to realtime changes
  useEffect(() => {
    if (!isAuthenticated) return

    const channel = supabase
      .channel('sightings')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'Sighting'
      }, (payload) => {
        console.log('New sighting!', payload)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [isAuthenticated, supabase])
}
```

#### Server Components

```typescript
import { createClient } from '@/lib/supabase/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export default async function ServerComponent() {
  const session = await getServerSession(authOptions)
  const supabase = await createClient()

  // Use Supabase features server-side
  const { data } = await supabase.storage
    .from('avatars')
    .list(`${session?.user?.id}/`)

  return <div>{/* Your component */}</div>
}
```

#### Server Actions

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function uploadAvatar(formData: FormData) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    throw new Error('Not authenticated')
  }

  const supabase = await createClient()
  const file = formData.get('file') as File

  const { data, error } = await supabase.storage
    .from('avatars')
    .upload(`${session.user.id}/${file.name}`, file)

  return { data, error }
}
```

## Environment Variables

Make sure you have these in your `.env` file:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret"
```

### Getting Your Supabase Service Role Key

1. Go to your Supabase Dashboard
2. Navigate to **Project Settings** → **API**
3. Under **Project API keys**, find the **service_role** key
4. Copy it and add to your `.env` file as `SUPABASE_SERVICE_ROLE_KEY`

⚠️ **Important**: Never expose the service role key in client-side code!

## Common Use Cases

### 1. Uploading Images to Supabase Storage

```typescript
'use client'

import { useSupabase } from '@/hooks/useSupabase'

export function ImageUpload() {
  const { supabase, user } = useSupabase()

  async function handleUpload(file: File) {
    const filePath = `${user.id}/${Date.now()}-${file.name}`

    const { data, error } = await supabase.storage
      .from('images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Upload error:', error)
      return
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('images')
      .getPublicUrl(filePath)

    console.log('Uploaded:', publicUrl)
  }

  return <input type="file" onChange={(e) => {
    if (e.target.files?.[0]) {
      handleUpload(e.target.files[0])
    }
  }} />
}
```

### 2. Realtime Subscriptions

```typescript
'use client'

import { useSupabase } from '@/hooks/useSupabase'
import { useEffect, useState } from 'react'

export function RealtimeSightings() {
  const { supabase } = useSupabase()
  const [sightings, setSightings] = useState([])

  useEffect(() => {
    const channel = supabase
      .channel('public:Sighting')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'Sighting'
      }, (payload) => {
        setSightings(prev => [payload.new, ...prev])
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  return <div>{/* Render sightings */}</div>
}
```

### 3. Direct Database Queries (Alternative to Prisma)

```typescript
'use client'

import { useSupabase } from '@/hooks/useSupabase'

export function UserProfile() {
  const { supabase, user } = useSupabase()

  async function updateProfile(bio: string) {
    const { data, error } = await supabase
      .from('User')
      .update({ bio })
      .eq('id', user.id)

    return { data, error }
  }

  return <div>{/* Profile form */}</div>
}
```

## Setting Up Supabase Storage

To use Supabase Storage, you need to create buckets in your Supabase dashboard:

1. Go to **Storage** in your Supabase Dashboard
2. Click **New Bucket**
3. Create buckets for your needs (e.g., `avatars`, `images`, `videos`)
4. Set the bucket to **Public** if you want direct URL access
5. Configure Row Level Security (RLS) policies if needed

### Example RLS Policy for Storage

```sql
-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload to own folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read access
CREATE POLICY "Public read access"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');
```

## Enabling Realtime

To use Realtime subscriptions, enable it for your tables:

1. Go to **Database** → **Replication** in Supabase Dashboard
2. Enable replication for tables you want to subscribe to (e.g., `Sighting`, `Hunt`)
3. Use the subscription code shown above

## Troubleshooting

### Users not syncing to Supabase Auth

- Check that `SUPABASE_SERVICE_ROLE_KEY` is set correctly
- Check the server logs for sync errors
- Verify the service role key has admin permissions

### Storage uploads failing

- Ensure the bucket exists in Supabase Dashboard
- Check RLS policies if uploads are blocked
- Verify file size limits (default: 50MB)

### Realtime not working

- Enable replication for the table in Supabase Dashboard
- Check that your subscription channel name matches the table name
- Verify the event type ('INSERT', 'UPDATE', 'DELETE', or '*')

## Migration Path (Optional)

If you want to fully migrate from NextAuth to Supabase Auth in the future:

1. Update sign-in/sign-up flows to use Supabase Auth directly
2. Remove NextAuth dependencies
3. Update session management to use Supabase sessions
4. Migrate existing user passwords (requires custom migration script)

For now, the hybrid approach gives you the best of both worlds!
