import { createClient } from '@supabase/supabase-js'
import sharp from 'sharp'

// Server-side Supabase client for storage operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export interface ImageUploadOptions {
  bucket: 'sightings' | 'profiles' | 'hunts'
  userId: string
  file: File | Buffer
  maxWidth?: number
  maxHeight?: number
  quality?: number
  generateThumbnail?: boolean
  thumbnailSize?: number
}

export interface ImageUploadResult {
  url: string
  thumbnailUrl?: string
  path: string
  thumbnailPath?: string
}

/**
 * Upload an image to Supabase Storage with automatic optimization
 */
export async function uploadImage(
  options: ImageUploadOptions
): Promise<ImageUploadResult> {
  const {
    bucket,
    userId,
    file,
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 85,
    generateThumbnail = false,
    thumbnailSize = 400,
  } = options

  // Convert File to Buffer if needed
  let buffer: Buffer
  if (file instanceof Buffer) {
    buffer = file
  } else {
    const bytes = await file.arrayBuffer()
    buffer = Buffer.from(bytes)
  }

  // Generate unique filename
  const timestamp = Date.now()
  const randomStr = Math.random().toString(36).substring(7)
  const filename = `${userId}/${timestamp}-${randomStr}.jpg`
  const thumbnailFilename = `${userId}/${timestamp}-${randomStr}-thumb.jpg`

  // Process full-resolution image
  const processedImage = await sharp(buffer)
    .resize(maxWidth, maxHeight, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .jpeg({
      quality,
      progressive: true,
    })
    .toBuffer()

  // Upload full-resolution image
  const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
    .from(bucket)
    .upload(filename, processedImage, {
      contentType: 'image/jpeg',
      cacheControl: '3600',
      upsert: false,
    })

  if (uploadError) {
    console.error('Supabase upload error:', uploadError)
    throw new Error(`Failed to upload image: ${uploadError.message}`)
  }

  // Get public URL
  const { data: { publicUrl } } = supabaseAdmin.storage
    .from(bucket)
    .getPublicUrl(filename)

  const result: ImageUploadResult = {
    url: publicUrl,
    path: filename,
  }

  // Generate and upload thumbnail if requested
  if (generateThumbnail) {
    const thumbnail = await sharp(buffer)
      .resize(thumbnailSize, thumbnailSize, {
        fit: 'cover',
        position: 'center',
      })
      .jpeg({
        quality: 80,
        progressive: true,
      })
      .toBuffer()

    const { error: thumbError } = await supabaseAdmin.storage
      .from(bucket)
      .upload(thumbnailFilename, thumbnail, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
        upsert: false,
      })

    if (thumbError) {
      console.error('Thumbnail upload error:', thumbError)
      // Continue even if thumbnail fails
    } else {
      const { data: { publicUrl: thumbUrl } } = supabaseAdmin.storage
        .from(bucket)
        .getPublicUrl(thumbnailFilename)

      result.thumbnailUrl = thumbUrl
      result.thumbnailPath = thumbnailFilename
    }
  }

  return result
}

/**
 * Delete an image from Supabase Storage
 */
export async function deleteImage(bucket: string, path: string): Promise<boolean> {
  const { error } = await supabaseAdmin.storage
    .from(bucket)
    .remove([path])

  if (error) {
    console.error('Delete error:', error)
    return false
  }

  return true
}

/**
 * Delete multiple images from Supabase Storage
 */
export async function deleteImages(bucket: string, paths: string[]): Promise<boolean> {
  const { error } = await supabaseAdmin.storage
    .from(bucket)
    .remove(paths)

  if (error) {
    console.error('Delete error:', error)
    return false
  }

  return true
}
