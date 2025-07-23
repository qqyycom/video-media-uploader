import { NextRequest, NextResponse } from 'next/server'
import { refreshYouTubeToken, isTokenExpired } from '../../../lib/tokenRefresh'

export async function POST(request: NextRequest) {
  try {
    const { videoId, title, description, tags, privacy, category } = await request.json()

    if (!videoId || !title) {
      return NextResponse.json(
        { error: 'Video ID and title are required' },
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
          uploadData: {
            snippet: {
              title,
              description: description || '',
              tags: tags || [],
              categoryId: category || '22',
            },
            status: {
              privacyStatus: privacy || 'private',
            },
          },
          account: {
            id: account.id,
            title: account.title,
            thumbnail: account.thumbnail,
          },
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

    const uploadData = {
      snippet: {
        title,
        description: description || '',
        tags: tags || [],
        categoryId: category || '22',
      },
      status: {
        privacyStatus: privacy || 'private',
      },
    }

    return NextResponse.json({
      success: true,
      uploadData,
      account: {
        id: account.id,
        title: account.title,
        thumbnail: account.thumbnail,
      },
    })
  } catch (error) {
    console.error('YouTube upload error:', error)
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    )
  }
}

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
    
    return NextResponse.json({
      connected: true,
      account: {
        id: account.id,
        title: account.title,
        thumbnail: account.thumbnail,
        subscriberCount: account.subscriberCount,
      },
    })
  } catch (error) {
    console.error('YouTube user info error:', error)
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    )
  }
}