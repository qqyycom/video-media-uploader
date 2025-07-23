import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const videoChunk = formData.get('video') as File
    const uploadUrl = formData.get('upload_url') as string
    const chunkIndex = parseInt(formData.get('chunk_index') as string)
    const totalChunks = parseInt(formData.get('total_chunks') as string)

    if (!videoChunk || !uploadUrl) {
      return NextResponse.json(
        { error: 'Video chunk and upload URL are required' },
        { status: 400 }
      )
    }

    // Upload chunk to TikTok's upload URL
    const chunkFormData = new FormData()
    chunkFormData.append('video', videoChunk)

    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      body: chunkFormData,
      headers: {
        'Content-Range': `bytes ${chunkIndex * videoChunk.size}-${(chunkIndex + 1) * videoChunk.size - 1}/${totalChunks * videoChunk.size}`,
      },
    })

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text()
      console.error('TikTok chunk upload error:', errorText)
      return NextResponse.json(
        { error: 'Failed to upload video chunk' },
        { status: uploadResponse.status }
      )
    }

    return NextResponse.json({
      success: true,
      chunkIndex,
      totalChunks,
      completed: chunkIndex === totalChunks - 1,
    })

  } catch (error) {
    console.error('TikTok chunk upload error:', error)
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    )
  }
}