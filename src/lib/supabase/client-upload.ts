import { createClient } from './client'

/**
 * Upload image directly to Supabase Storage from the client
 * This bypasses Vercel's API route body size limits
 */
export async function uploadImageToSupabase(
  file: File,
  bucket: 'sightings' | 'profiles' | 'hunts',
  userId: string
): Promise<{ url: string; path: string } | null> {
  const supabase = createClient()

  try {
    // Generate unique filename
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(7)
    const fileExt = file.name.split('.').pop() || 'jpg'
    const path = `${userId}/${timestamp}-${randomStr}.${fileExt}`

    // Upload file
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (error) {
      console.error('Upload error:', error)
      return null
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(path)

    return {
      url: publicUrl,
      path: data.path,
    }
  } catch (error) {
    console.error('Upload exception:', error)
    return null
  }
}

/**
 * Generate thumbnail from image file
 */
export async function generateThumbnail(
  file: File,
  maxSize: number = 400
): Promise<Blob | null> {
  return new Promise((resolve) => {
    const img = new Image()
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    img.onload = () => {
      // Calculate dimensions
      let width = img.width
      let height = img.height

      if (width > height) {
        if (width > maxSize) {
          height = (height * maxSize) / width
          width = maxSize
        }
      } else {
        if (height > maxSize) {
          width = (width * maxSize) / height
          height = maxSize
        }
      }

      canvas.width = width
      canvas.height = height

      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        (blob) => {
          resolve(blob)
        },
        'image/jpeg',
        0.8
      )
    }

    img.onerror = () => resolve(null)

    img.src = URL.createObjectURL(file)
  })
}
