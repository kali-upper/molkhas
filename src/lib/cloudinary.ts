/**
 * Cloudinary utility functions using Supabase Edge Functions
 */

export interface CloudinaryUploadOptions {
  folder?: string
}

export interface CloudinaryUploadResult {
  success: boolean
  url: string
  public_id: string
  message: string
}

/**
 * Upload a file to Cloudinary via Supabase Edge Function
 */
export const uploadToCloudinary = async (
  file: File,
  options: CloudinaryUploadOptions = {}
): Promise<CloudinaryUploadResult> => {
  // Convert file to base64
  const base64 = await fileToBase64(file)

  // Get Supabase client
  const { createClient } = await import('@supabase/supabase-js')
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase credentials not configured')
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  // Get current session
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    throw new Error('User not authenticated')
  }

  // Call Edge Function
  const { data, error } = await supabase.functions.invoke('upload-avatar', {
    body: {
      file: base64,
      fileName: file.name,
      contentType: file.type,
      folder: options.folder || 'avatars'
    }
  })

  if (error) {
    throw new Error(`Upload failed: ${error.message}`)
  }

  if (!data.success) {
    throw new Error(`Upload failed: ${data.error || 'Unknown error'}`)
  }

  return data
}

/**
 * Convert File to base64 string
 */
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => {
      const base64 = reader.result as string
      // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64Data = base64.split(',')[1]
      resolve(base64Data)
    }
    reader.onerror = error => reject(error)
  })
}

/**
 * Delete a file from Cloudinary via Supabase Edge Function
 */
export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
  // Get Supabase client
  const { createClient } = await import('@supabase/supabase-js')
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase credentials not configured')
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  // Get current session
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    throw new Error('User not authenticated')
  }

  // Call Edge Function for secure deletion
  const { error } = await supabase.functions.invoke('delete-avatar', {
    body: { publicId }
  })

  if (error) {
    throw new Error(`Delete failed: ${error.message}`)
  }
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