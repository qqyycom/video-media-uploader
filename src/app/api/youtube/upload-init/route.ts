import { NextRequest, NextResponse } from 'next/server'
import { refreshYouTubeToken, isTokenExpired } from '../../../lib/tokenRefresh'

export async function POST(request: NextRequest) {
  try {
    const { title, description, tags, privacy, category, videoFile } = await request.json()

    if (!title || !videoFile?.size) {
      return NextResponse.json(
        { error: 'Title and video file size are required' },
        { status: 400 }
      )
    }

    // Get YouTube account from cookies
    const youtubeAccountCookie = request.cookies.get('youtube_account')
    if (!youtubeAccountCookie) {
      return NextResponse.json(
        { error: 'YouTube account not connected' },
        { status: 401 }
      )
    }

    let account = JSON.parse(youtubeAccountCookie.value)
    
    // Check if token needs refresh and refresh it
    if (account.expiresAt && account.refreshToken && isTokenExpired(account.expiresAt)) {
      const refreshResult = await refreshYouTubeToken(account.refreshToken)
      
      if (refreshResult.success) {
        account = {
          ...account,
          accessToken: refreshResult.accessToken,
          refreshToken: refreshResult.refreshToken || account.refreshToken,
          expiresAt: refreshResult.expiresAt,
        }
        
        // Update cookie with refreshed account
        const response = NextResponse.json({
          success: true,
          tokenRefreshed: true,
        })
        
        response.cookies.set('youtube_account', JSON.stringify(account), {
          httpOnly: false,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 7, // 7 days
        })
        
        return response
      } else {
        return NextResponse.json(
          { error: 'Failed to refresh token', needsReauth: true },
          { status: 401 }
        )
      }
    }

    // Create upload session with YouTube API
    const sessionResponse = await fetch(
      'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${account.accessToken}`,
          'Content-Type': 'application/json',
          'X-Upload-Content-Length': videoFile.size.toString(),
          'X-Upload-Content-Type': videoFile.type || 'video/*',
        },
        body: JSON.stringify({
          snippet: {
            title,
            description: description || '',
            tags: tags || [],
            categoryId: category || '22',
          },
          status: {
            privacyStatus: privacy || 'private',
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

    // Calculate chunk parameters
    const chunkSize = Math.min(64 * 1024 * 1024, videoFile.size) // 64MB chunks or file size if smaller
    const totalChunks = Math.ceil(videoFile.size / chunkSize)

    return NextResponse.json({
      success: true,
      data: {
        uploadUrl,
        chunkSize,
        totalChunks,
        videoSize: videoFile.size,
      },
    })
  } catch (error) {
    console.error('YouTube upload init error:', error)
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    )
  }
}