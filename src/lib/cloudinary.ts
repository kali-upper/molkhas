/**
 * Cloudinary utility functions for file uploads
 */

export interface CloudinaryUploadOptions {
  folder?: string
  tags?: string[]
  context?: Record<string, any>
}

export interface CloudinaryUploadResult {
  public_id: string
  url: string
  secure_url: string
  format: string
  width: number
  height: number
  bytes: number
  created_at: string
  tags: string[]
  context?: Record<string, any>
}

/**
 * Upload a file to Cloudinary
 */
export const uploadToCloudinary = async (
  file: File,
  options: CloudinaryUploadOptions = {}
): Promise<CloudinaryUploadResult> => {
  const formData = new FormData()

  // Get Cloudinary credentials from environment variables
  const apiKey = import.meta.env.VITE_CLOUDINARY_API_KEY
  const apiSecret = import.meta.env.VITE_CLOUDINARY_API_SECRET
  const cloudName = 'de3emq8l3' // Your Cloudinary cloud name

  if (!apiKey || !apiSecret) {
    throw new Error('Cloudinary credentials not configured')
  }

  // Use upload preset (you'll need to create this in Cloudinary dashboard)
  // Create a preset called 'masarx-uploads' in your Cloudinary dashboard
  // Settings: unsigned, allow all formats, no transformations
  const uploadPreset = 'masarx-uploads'

  formData.append('file', file)
  formData.append('upload_preset', uploadPreset)

  // Add optional parameters
  if (options.folder) {
    formData.append('folder', options.folder)
  }

  if (options.tags && options.tags.length > 0) {
    formData.append('tags', options.tags.join(','))
  }

  if (options.context) {
    const contextString = Object.entries(options.context)
      .map(([key, value]) => `${key}=${value}`)
      .join('|')
    formData.append('context', contextString)
  }

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/upload`,
    {
      method: 'POST',
      body: formData
    }
  )

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(`Cloudinary upload failed: ${errorData.error?.message || response.statusText}`)
  }

  const result: CloudinaryUploadResult = await response.json()
  return result
}

/**
 * Delete a file from Cloudinary
 */
export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
  const apiKey = import.meta.env.VITE_CLOUDINARY_API_KEY
  const apiSecret = import.meta.env.VITE_CLOUDINARY_API_SECRET

  if (!apiKey || !apiSecret) {
    throw new Error('Cloudinary credentials not configured')
  }

  // Note: This would require server-side implementation for security
  // as it needs the API secret which shouldn't be exposed to the client
  throw new Error(`Delete operation for ${publicId} should be handled server-side`)
}

/**
 * Generate Cloudinary URL with transformations
 */
export const getCloudinaryUrl = (
  publicId: string,
  transformations: Record<string, any> = {}
): string => {
  const cloudName = 'de3emq8l3'
  const baseUrl = `https://res.cloudinary.com/${cloudName}/image/upload`

  const transformationString = Object.entries(transformations)
    .map(([key, value]) => `${key}_${value}`)
    .join(',')

  if (transformationString) {
    return `${baseUrl}/${transformationString}/${publicId}`
  }

  return `${baseUrl}/${publicId}`
}