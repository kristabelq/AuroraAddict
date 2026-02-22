'use client'

import { useSupabase } from '@/hooks/useSupabase'
import { useState } from 'react'

/**
 * Example component showing how to use Supabase Storage
 * with NextAuth authentication
 */
export function SupabaseStorageExample() {
  const { supabase, isAuthenticated, user } = useSupabase()
  const [uploading, setUploading] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(null)

  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    if (!event.target.files || event.target.files.length === 0) {
      return
    }

    const file = event.target.files[0]
    setUploading(true)

    try {
      // Create a unique file path
      const fileExt = file.name.split('.').pop()
      const fileName = `${user?.id}/${Date.now()}.${fileExt}`

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('avatars') // Make sure this bucket exists in Supabase
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        throw error
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      setImageUrl(publicUrl)
      alert('Upload successful!')
    } catch (error) {
      console.error('Error uploading file:', error)
      alert('Error uploading file')
    } finally {
      setUploading(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="p-4 border rounded">
        <p>Please sign in to use Supabase Storage</p>
      </div>
    )
  }

  return (
    <div className="p-4 border rounded space-y-4">
      <h3 className="text-lg font-semibold">Supabase Storage Example</h3>

      <div>
        <label className="block text-sm font-medium mb-2">
          Upload an image
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          disabled={uploading}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100"
        />
        {uploading && <p className="text-sm text-gray-500 mt-2">Uploading...</p>}
      </div>

      {imageUrl && (
        <div>
          <p className="text-sm font-medium mb-2">Uploaded image:</p>
          <img
            src={imageUrl}
            alt="Uploaded"
            className="max-w-xs rounded border"
          />
          <p className="text-xs text-gray-500 mt-2 break-all">{imageUrl}</p>
        </div>
      )}

      <div className="text-sm text-gray-600 space-y-1">
        <p><strong>How this works:</strong></p>
        <ul className="list-disc list-inside space-y-1">
          <li>You're authenticated via NextAuth</li>
          <li>Your user was synced to Supabase Auth on sign-in</li>
          <li>You can now use Supabase Storage with your credentials</li>
          <li>Files are uploaded to the 'avatars' bucket</li>
        </ul>
      </div>
    </div>
  )
}
