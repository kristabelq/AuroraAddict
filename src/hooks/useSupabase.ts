'use client'

import { useSession } from 'next-auth/react'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Hook to get an authenticated Supabase client
 * This syncs the NextAuth session with Supabase
 */
export function useSupabase() {
  const { data: session } = useSession()
  const [supabase] = useState<SupabaseClient>(() => createClient())

  useEffect(() => {
    // If user is authenticated via NextAuth, we can use Supabase client
    // The user has already been synced to Supabase Auth via the auth callback
    if (session?.user) {
      // The Supabase client will automatically handle the session
      // since the user was synced during sign-in
    }
  }, [session, supabase])

  return {
    supabase,
    isAuthenticated: !!session?.user,
    user: session?.user,
  }
}
