import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const youtubeAccountCookie = request.cookies.get('youtube_account')
    if (!youtubeAccountCookie) {
      return NextResponse.json(
        { error: 'YouTube account not connected' },
        { status: 401 }
      )
    }

    const account = JSON.parse(youtubeAccountCookie.value)

    // Check if token needs refresh
    if (account.expiresAt < Date.now()) {
      return NextResponse.json(
        { error: 'Token expired', needsRefresh: true },
        { status: 401 }
      )
    }

    const response = await fetch(
      'https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true',
      {
        headers: {
          Authorization: `Bearer ${account.accessToken}`,
        },
      }
    )

    if (!response.ok) {
      throw new Error('Failed to fetch user info')
    }

    const data = await response.json()
    const channel = data.items?.[0]

    if (!channel) {
      throw new Error('No channel found')
    }

    return NextResponse.json({
      id: channel.id,
      title: channel.snippet.title,
      description: channel.snippet.description,
      thumbnail: channel.snippet.thumbnails?.high?.url,
      subscriberCount: parseInt(channel.statistics.subscriberCount),
      videoCount: parseInt(channel.statistics.videoCount),
      viewCount: parseInt(channel.statistics.viewCount),
    })
  } catch (error) {
    console.error('YouTube user error:', error)
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

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.NEXT_PUBLIC_YOUTUBE_CLIENT_ID,
        client_secret: process.env.YOUTUBE_CLIENT_SECRET,
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
      accessToken: data.access_token,
      expiresAt: Date.now() + (data.expires_in * 1000),
    })
  } catch (error) {
    console.error('YouTube token refresh error:', error)
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    )
  }
}