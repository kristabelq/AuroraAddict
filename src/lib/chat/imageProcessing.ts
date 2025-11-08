/**
 * Image Processing Utility for Chat Messages
 *
 * Handles:
 * - Image upload validation (type, size)
 * - Image compression and resizing
 * - EXIF data stripping (privacy)
 * - Saving to /public/uploads/chat-images
 */

import sharp from 'sharp';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

export const IMAGE_CONSTRAINTS = {
  maxFileSize: 5 * 1024 * 1024, // 5MB
  maxImagesPerMessage: 3,
  maxWidth: 1920,
  maxHeight: 1080,
  quality: 85,
  allowedFormats: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
};

/**
 * Validate image file
 */
export function validateImage(file: File): {
  valid: boolean;
  error?: string;
} {
  // Check file size
  if (file.size > IMAGE_CONSTRAINTS.maxFileSize) {
    const sizeMB = (IMAGE_CONSTRAINTS.maxFileSize / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `Image size exceeds ${sizeMB}MB limit`,
    };
  }

  // Check file type
  if (!IMAGE_CONSTRAINTS.allowedFormats.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid image format. Allowed: JPG, PNG, WebP',
    };
  }

  return { valid: true };
}

/**
 * Process and save chat image
 */
export async function processChatImage(
  file: File,
  chatId: string,
  messageId: string,
  index: number
): Promise<{
  success: boolean;
  url?: string;
  error?: string;
}> {
  try {
    // Validate image
    const validation = validateImage(file);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error,
      };
    }

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Create directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'chat-images', chatId);
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Generate filename
    const filename = `${messageId}-${index}.jpg`;
    const filepath = path.join(uploadDir, filename);

    // Process image with Sharp
    await sharp(buffer)
      .resize(IMAGE_CONSTRAINTS.maxWidth, IMAGE_CONSTRAINTS.maxHeight, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality: IMAGE_CONSTRAINTS.quality })
      .toFile(filepath);

    // Generate URL path
    const url = `/uploads/chat-images/${chatId}/${filename}`;

    return {
      success: true,
      url,
    };
  } catch (error) {
    console.error('Error processing chat image:', error);
    return {
      success: false,
      error: 'Failed to process image',
    };
  }
}

/**
 * Process multiple images for a chat message
 */
export async function processChatImages(
  files: File[],
  chatId: string,
  messageId: string
): Promise<{
  success: boolean;
  urls: string[];
  errors: string[];
}> {
  // Validate count
  if (files.length > IMAGE_CONSTRAINTS.maxImagesPerMessage) {
    return {
      success: false,
      urls: [],
      errors: [`Maximum ${IMAGE_CONSTRAINTS.maxImagesPerMessage} images per message`],
    };
  }

  const urls: string[] = [];
  const errors: string[] = [];

  // Process each image
  for (let i = 0; i < files.length; i++) {
    const result = await processChatImage(files[i], chatId, messageId, i);

    if (result.success && result.url) {
      urls.push(result.url);
    } else if (result.error) {
      errors.push(`Image ${i + 1}: ${result.error}`);
    }
  }

  return {
    success: urls.length > 0,
    urls,
    errors,
  };
}

/**
 * Get image dimensions without loading full file
 */
export async function getImageDimensions(
  file: File
): Promise<{ width: number; height: number } | null> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const metadata = await sharp(buffer).metadata();

    if (metadata.width && metadata.height) {
      return {
        width: metadata.width,
        height: metadata.height,
      };
    }

    return null;
  } catch (error) {
    console.error('Error getting image dimensions:', error);
    return null;
  }
}

/**
 * Validate images client-side before upload
 */
export function validateImages(files: FileList | File[]): {
  valid: boolean;
  errors: string[];
} {
  const fileArray = Array.from(files);
  const errors: string[] = [];

  // Check count
  if (fileArray.length > IMAGE_CONSTRAINTS.maxImagesPerMessage) {
    errors.push(
      `Maximum ${IMAGE_CONSTRAINTS.maxImagesPerMessage} images per message`
    );
  }

  // Validate each file
  fileArray.forEach((file, index) => {
    const validation = validateImage(file);
    if (!validation.valid && validation.error) {
      errors.push(`Image ${index + 1}: ${validation.error}`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}
