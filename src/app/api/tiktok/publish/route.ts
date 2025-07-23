import { NextRequest, NextResponse } from 'next/server'

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

    const account = JSON.parse(tiktokAccountCookie.value)

    // Step 2: Confirm the upload with TikTok API
    const publishResponse = await fetch('https://open.tiktokapis.com/v2/post/publish/video/init/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${account.accessToken}`,
        'Content-Type': 'application/json; charset=UTF-8'
      },
      body: JSON.stringify({
        publish_id: publishId,
      }),
    })

    if (!publishResponse.ok) {
      const errorData = await publishResponse.json()
      console.error('TikTok publish error:', errorData)
      return NextResponse.json(
        { error: 'Failed to publish video', details: errorData },
        { status: publishResponse.status }
      )
    }

    const publishData = await publishResponse.json()
    
    if (publishData.error?.code !== 'ok') {
      return NextResponse.json(
        { error: 'Failed to publish video', details: publishData },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        share_url: publishData.data.share_url,
        video_id: publishData.data.video_id,
        embed_html: publishData.data.embed_html,
        embed_link: publishData.data.embed_link,
      },
    })

  } catch (error) {
    console.error('TikTok publish error:', error)
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    )
  }
}