import { createClient } from './client'
import { compressForSighting, compressForProfile, formatFileSize } from '@/lib/imageCompression'

/**
 * Upload image directly to Supabase Storage from the client
 * This bypasses Vercel's API route body size limits
 * Automatically compresses images based on bucket type
 */
export async function uploadImageToSupabase(
  file: File,
  bucket: 'sightings' | 'profiles' | 'hunts',
  userId: string
): Promise<{ url: string; path: string } | null> {
  const supabase = createClient()

  try {
    // Compress image based on bucket type
    let processedFile = file
    const originalSize = file.size

    if (bucket === 'profiles') {
      // Profiles: max 2MB
      processedFile = await compressForProfile(file)
    } else {
      // Sightings and Hunts: max 5MB
      processedFile = await compressForSighting(file)
    }

    // Log compression results
    if (processedFile.size < originalSize) {
      console.log(
        `Compressed ${file.name}: ${formatFileSize(originalSize)} → ${formatFileSize(processedFile.size)} ` +
        `(${Math.round((1 - processedFile.size / originalSize) * 100)}% reduction)`
      )
    }

    // Generate unique filename
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(7)
    const path = `${userId}/${timestamp}-${randomStr}.jpg`

    // Upload file
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, processedFile, {
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
