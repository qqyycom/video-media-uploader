import { NextRequest, NextResponse } from 'next/server'
import { refreshTikTokToken, isTokenExpired } from '../../../lib/tokenRefresh'

export async function POST(request: NextRequest) {
  try {
    const { videoFile, title, privacy, disableComment, disableDuet, disableStitch } = await request.json()

    if (!videoFile || !title) {
      return NextResponse.json(
        { error: 'Video file and title are required' },
        { status: 400 }
      )
    }

    // Get TikTok account from cookies
    const tiktokAccountCookie = request.cookies.get('tiktok_account')
    if (!tiktokAccountCookie) {
      return NextResponse.json(
        { error: 'TikTok account not connected' },
        { status: 401 }
      )
    }

    let account = JSON.parse(tiktokAccountCookie.value)
    
    // Check if token needs refresh and refresh it
    if (account.expiresAt && account.refreshToken && isTokenExpired(account.expiresAt)) {
      const refreshResult = await refreshTikTokToken(account.refreshToken)
      
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
          message: 'Token refreshed, please retry upload',
          tokenRefreshed: true,
        })
        
        response.cookies.set('tiktok_account', JSON.stringify(account), {
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

    // Map privacy level to TikTok API values
    const privacyLevelMap: Record<string, string> = {
      'public': 'PUBLIC_TO_EVERYONE',
      'unlisted': 'MUTUAL_FOLLOW_FRIEND', 
      'private': 'SELF_ONLY',
      'followers': 'FOLLOWER_OF_CREATOR'
    }

    // Step 1: Initialize video upload with TikTok API
    const initResponse = await fetch('https://open.tiktokapis.com/v2/post/publish/video/init/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${account.accessToken}`,
        'Content-Type': 'application/json; charset=UTF-8'
      },
      body: JSON.stringify({
        post_info: {
          title: title.substring(0, 2200), // Max 2200 characters
          privacy_level: privacyLevelMap[privacy] || 'PUBLIC_TO_EVERYONE',
          disable_duet: disableDuet || false,
          disable_comment: disableComment || false,
          disable_stitch: disableStitch || false,
        },
        source_info: {
          source: 'FILE_UPLOAD',
          video_size: videoFile.size,
          chunk_size: Math.min(videoFile.size, 10 * 1024 * 1024), // 10MB chunks max
          total_chunk_count: Math.ceil(videoFile.size / Math.min(videoFile.size, 10 * 1024 * 1024))
        }
      }),
    })

    if (!initResponse.ok) {
      const errorData = await initResponse.json()
      console.error('TikTok init error:', errorData)
      
      // Handle specific TikTok API errors
      const errorMessage = getTikTokErrorMessage(errorData)
      return NextResponse.json(
        { error: errorMessage, details: errorData },
        { status: initResponse.status }
      )
    }

    const initData = await initResponse.json()
    
    if (initData.error?.code !== 'ok') {
      const errorMessage = getTikTokErrorMessage(initData)
      return NextResponse.json(
        { error: errorMessage, details: initData },
        { status: 400 }
      )
    }

    // Return upload initialization data
    return NextResponse.json({
      success: true,
      data: {
        publish_id: initData.data.publish_id,
        upload_url: initData.data.upload_url,
        video_size: videoFile.size,
        chunk_size: Math.min(videoFile.size, 10 * 1024 * 1024),
        total_chunk_count: Math.ceil(videoFile.size / Math.min(videoFile.size, 10 * 1024 * 1024)),
      },
      account: {
        id: account.id,
        username: account.username,
        avatar: account.avatar,
      },
    })

  } catch (error) {
    console.error('TikTok upload error:', error)
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    )
  }
}

// Helper function to handle TikTok API error messages
function getTikTokErrorMessage(errorData: { error?: { code?: string; message?: string } }): string {
  const errorCode = errorData.error?.code
  const errorMessage = errorData.error?.message || 'Unknown error'
  
  const errorMap: Record<string, string> = {
    'access_token_invalid': 'Invalid access token. Please reconnect your TikTok account.',
    'scope_not_authorized': 'Missing required permissions. Please reconnect your TikTok account.',
    'rate_limit_exceeded': 'Too many requests. Please wait a moment and try again.',
    'spam_risk_user_banned': 'Account has been flagged for spam risk.',
    'user_has_no_video_post_permission': 'Account does not have permission to post videos.',
    'reached_active_user_cap': 'TikTok has reached its active user limit for this app.',
    'unaudited_client_can_only_post_to_private': 'Videos can only be posted as private until the app is audited by TikTok.',
  }
  
  return errorMap[errorCode] || `TikTok API Error: ${errorMessage}`
}

export async function GET(request: NextRequest) {
  try {
    const tiktokAccountCookie = request.cookies.get('tiktok_account')
    if (!tiktokAccountCookie) {
      return NextResponse.json(
        { error: 'TikTok account not connected' },
        { status: 401 }
      )
    }

    const account = JSON.parse(tiktokAccountCookie.value)
    
    return NextResponse.json({
      connected: true,
      account: {
        id: account.id,
        username: account.username,
        displayName: account.displayName,
        avatar: account.avatar,
        followerCount: account.followerCount,
      },
    })
  } catch (error) {
    console.error('TikTok user info error:', error)
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    )
  }
}