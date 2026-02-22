import { createClient } from '@supabase/supabase-js'

// Admin client for server-side auth operations
// This uses the service role key which bypasses RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

/**
 * Sync a user from NextAuth to Supabase Auth
 * This allows using Supabase features (Storage, Realtime) with authenticated users
 */
export async function syncUserToSupabase(user: {
  id: string
  email: string
  name?: string | null
}) {
  try {
    if (!user.email) {
      console.error('Cannot sync user without email')
      return null
    }

    // Check if user already exists in Supabase Auth
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const existingUser = existingUsers?.users?.find(u => u.email === user.email)

    if (existingUser) {
      // User already exists, update metadata if needed
      const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
        existingUser.id,
        {
          user_metadata: {
            nextauth_user_id: user.id,
            name: user.name,
            synced_at: new Date().toISOString()
          }
        }
      )

      if (error) {
        console.error('Error updating Supabase user:', error)
        return null
      }

      return data.user
    }

    // Create new user in Supabase Auth
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: user.email,
      email_confirm: true, // Auto-confirm since they're already authenticated via NextAuth
      user_metadata: {
        nextauth_user_id: user.id,
        name: user.name,
        synced_at: new Date().toISOString()
      }
    })

    if (error) {
      console.error('Error creating Supabase user:', error)
      return null
    }

    return data.user
  } catch (error) {
    console.error('Error syncing user to Supabase:', error)
    return null
  }
}

/**
 * Create a Supabase session for a NextAuth user
 * This allows the user to access Supabase services with their authentication
 */
export async function createSupabaseSession(userId: string, email: string) {
  try {
    // Get or create the Supabase user
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const supabaseUser = existingUsers?.users?.find(u => u.email === email)

    if (!supabaseUser) {
      console.error('Supabase user not found')
      return null
    }

    // Generate a session token for the user
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: email,
    })

    if (error) {
      console.error('Error generating Supabase session:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error creating Supabase session:', error)
    return null
  }
}

/**
 * Delete a user from Supabase Auth when they're deleted from your app
 */
export async function deleteSupabaseUser(email: string) {
  try {
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const supabaseUser = existingUsers?.users?.find(u => u.email === email)

    if (supabaseUser) {
      const { error } = await supabaseAdmin.auth.admin.deleteUser(supabaseUser.id)

      if (error) {
        console.error('Error deleting Supabase user:', error)
        return false
      }
    }

    return true
  } catch (error) {
    console.error('Error deleting Supabase user:', error)
    return false
  }
}
