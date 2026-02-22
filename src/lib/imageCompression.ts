/**
 * Client-side image compression utility
 * Resizes images to target file sizes to save storage costs
 */

export interface CompressionOptions {
  maxSizeMB: number
  maxWidthOrHeight?: number
  initialQuality?: number
}

/**
 * Compress an image file to target size
 */
export async function compressImage(
  file: File,
  options: CompressionOptions
): Promise<File> {
  const {
    maxSizeMB,
    maxWidthOrHeight = 2048,
    initialQuality = 0.9,
  } = options

  // If file is already smaller than target, return as-is
  const maxSizeBytes = maxSizeMB * 1024 * 1024
  if (file.size <= maxSizeBytes) {
    return file
  }

  return new Promise((resolve, reject) => {
    const img = new Image()
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      reject(new Error('Could not get canvas context'))
      return
    }

    img.onload = async () => {
      // Calculate new dimensions
      let { width, height } = img

      // Scale down if larger than max dimension
      if (width > maxWidthOrHeight || height > maxWidthOrHeight) {
        if (width > height) {
          height = (height * maxWidthOrHeight) / width
          width = maxWidthOrHeight
        } else {
          width = (width * maxWidthOrHeight) / height
          height = maxWidthOrHeight
        }
      }

      canvas.width = width
      canvas.height = height

      // Draw image
      ctx.drawImage(img, 0, 0, width, height)

      // Try different quality levels to hit target size
      let quality = initialQuality
      let blob: Blob | null = null
      let attempts = 0
      const maxAttempts = 5

      while (attempts < maxAttempts) {
        blob = await new Promise<Blob | null>((resolve) => {
          canvas.toBlob(
            (b) => resolve(b),
            'image/jpeg',
            quality
          )
        })

        if (!blob) {
          reject(new Error('Failed to compress image'))
          return
        }

        // If size is acceptable, we're done
        if (blob.size <= maxSizeBytes) {
          break
        }

        // Reduce quality for next attempt
        quality -= 0.1
        attempts++

        // If quality gets too low, try reducing dimensions
        if (quality < 0.5 && attempts < maxAttempts - 1) {
          width = Math.floor(width * 0.8)
          height = Math.floor(height * 0.8)
          canvas.width = width
          canvas.height = height
          ctx.drawImage(img, 0, 0, width, height)
          quality = 0.7 // Reset quality for smaller image
        }
      }

      if (!blob) {
        reject(new Error('Failed to compress image'))
        return
      }

      // Create new file from blob
      const compressedFile = new File(
        [blob],
        file.name.replace(/\.\w+$/, '.jpg'),
        {
          type: 'image/jpeg',
          lastModified: Date.now(),
        }
      )

      resolve(compressedFile)
    }

    img.onerror = () => {
      reject(new Error('Failed to load image'))
    }

    img.src = URL.createObjectURL(file)
  })
}

/**
 * Compress image for sightings/hunts (max 5MB)
 */
export async function compressForSighting(file: File): Promise<File> {
  return compressImage(file, {
    maxSizeMB: 5,
    maxWidthOrHeight: 2048,
    initialQuality: 0.9,
  })
}

/**
 * Compress image for profiles (max 2MB)
 */
export async function compressForProfile(file: File): Promise<File> {
  return compressImage(file, {
    maxSizeMB: 2,
    maxWidthOrHeight: 1024,
    initialQuality: 0.85,
  })
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}
