import { NextRequest, NextResponse } from 'next/server'
import { refreshTikTokToken, isTokenExpired } from '../../../lib/tokenRefresh'

export async function POST(request: NextRequest) {
  try {
    const { publishId } = await request.json()

    if (!publishId) {
      return NextResponse.json(
        { error: 'Publish ID is required' },
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

    // Check upload status with TikTok API
    const statusResponse = await fetch(
      `https://open.tiktokapis.com/v2/post/publish/status/fetch/?publish_id=${publishId}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${account.accessToken}`,
          'Content-Type': 'application/json; charset=UTF-8',
        },
        body: JSON.stringify({
          publish_id: publishId,
        }),
      }
    )

    if (!statusResponse.ok) {
      const errorData = await statusResponse.json()
      throw new Error(`TikTok status check failed: ${errorData.error?.message || 'Unknown error'}`)
    }

    const statusData = await statusResponse.json()
    
    if (statusData.error?.code !== 'ok') {
      throw new Error(`TikTok API error: ${statusData.error?.message || 'Unknown error'}`)
    }

    return NextResponse.json({
      success: true,
      status: statusData.data.status,
      videoId: statusData.data.video_id,
      publishId: statusData.data.publish_id,
    })
  } catch (error) {
    console.error('TikTok upload status error:', error)
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    )
  }
}