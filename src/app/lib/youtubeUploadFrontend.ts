import { VideoFile, UploadMetadata } from '@/app/types'

interface YouTubeFrontendUploadConfig {
  videoFile: VideoFile
  metadata: UploadMetadata
  accessToken: string
  onProgress?: (progress: number) => void
  onChunkUploaded?: (uploadedBytes: number) => void
}

interface YouTubeFrontendUploadResult {
  success: boolean
  videoId?: string
  error?: string
}

export async function uploadToYouTubeFrontend({
  videoFile,
  metadata,
  accessToken,
  onProgress,
  onChunkUploaded
}: YouTubeFrontendUploadConfig): Promise<YouTubeFrontendUploadResult> {
  try {
    // Step 1: Create upload session directly with YouTube API
    const sessionResponse = await fetch(
      'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Upload-Content-Length': videoFile.file.size.toString(),
          'X-Upload-Content-Type': videoFile.file.type || 'video/*',
        },
        body: JSON.stringify({
          snippet: {
            title: metadata.title,
            description: metadata.description || '',
            tags: metadata.tags || [],
            categoryId: metadata.category || '22',
          },
          status: {
            privacyStatus: metadata.privacy || 'private',
          },
        }),
      }
    )

    if (!sessionResponse.ok) {
      const errorData = await sessionResponse.json()
      throw new Error(`Failed to create upload session: ${errorData.error?.message || 'Unknown error'}`)
    }

    const uploadUrl = sessionResponse.headers.get('Location')
    if (!uploadUrl) {
      throw new Error('No upload URL received from YouTube')
    }

    // Step 2: Upload video file directly to YouTube in chunks
    const chunkSize = 64 * 1024 * 1024 // 64MB chunks
    const totalChunks = Math.ceil(videoFile.file.size / chunkSize)
    let uploadedBytes = 0

    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize
      let end = Math.min(start + chunkSize, videoFile.file.size)
      if (i === totalChunks - 1) {
        end = videoFile.file.size
      }
      const chunk = videoFile.file.slice(start, end)

      const response = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': videoFile.file.type,
          'Content-Length': chunk.size.toString(),
          'Content-Range': `bytes ${start}-${end - 1}/${videoFile.file.size}`,
        },
        body: chunk,
      })

      if (response.status === 308) {
        // Resume incomplete
        uploadedBytes = end
        onProgress?.((uploadedBytes / videoFile.file.size) * 100)
        onChunkUploaded?.(uploadedBytes)
      } else if (response.status === 200 || response.status === 201) {
        // Upload complete
        const data = await response.json()
        
        return {
          success: true,
          videoId: data.id,
        }
      } else {
        const errorData = await response.json()
        throw new Error(`Upload failed: ${errorData.error?.message || 'Unknown error'}`)
      }
    }

    throw new Error('Upload did not complete')
  } catch (error) {
    console.error('YouTube frontend upload error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// Token refresh utility for frontend
export async function refreshYouTubeToken(refreshToken: string): Promise<{
  success: boolean
  accessToken?: string
  refreshToken?: string
  expiresAt?: number
  error?: string
}> {
  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.NEXT_PUBLIC_YOUTUBE_CLIENT_ID!,
        client_secret: process.env.YOUTUBE_CLIENT_SECRET!,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to refresh token')
    }

    const data = await response.json()

    return {
      success: true,
      accessToken: data.access_token,
      refreshToken: refreshToken,
      expiresAt: Date.now() + (data.expires_in * 1000),
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Token refresh failed',
    }
  }
}