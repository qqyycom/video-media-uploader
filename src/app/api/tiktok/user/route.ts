import { NextRequest, NextResponse } from 'next/server'

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

    // Check if token needs refresh
    if (account.expiresAt < Date.now()) {
      return NextResponse.json(
        { error: 'Token expired', needsRefresh: true },
        { status: 401 }
      )
    }

    const response = await fetch(
      'https://open-api.tiktok.com/platform/v1/user/info/?fields=open_id,username,display_name,avatar_url,follower_count',
      {
        headers: {
          'Authorization': `Bearer ${account.accessToken}`,
        },
      }
    )

    if (!response.ok) {
      throw new Error('Failed to fetch user info')
    }

    const data = await response.json()
    const user = data.data.user

    return NextResponse.json({
      id: user.open_id,
      username: user.username,
      displayName: user.display_name,
      avatar: user.avatar_url,
      followerCount: user.follower_count,
    })
  } catch (error) {
    console.error('TikTok user error:', error)
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { refreshToken } = await request.json()

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Refresh token is required' },
        { status: 400 }
      )
    }

    const response = await fetch('https://open-api.tiktok.com/platform/v1/refresh_token/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_key: process.env.NEXT_PUBLIC_TIKTOK_CLIENT_KEY,
        client_secret: process.env.TIKTOK_CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to refresh token')
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      accessToken: data.data.access_token,
      expiresAt: Date.now() + (data.data.expires_in * 1000),
    })
  } catch (error) {
    console.error('TikTok token refresh error:', error)
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    )
  }
}