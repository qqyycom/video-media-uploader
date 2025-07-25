import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const videoChunk = await request.arrayBuffer();
    const uploadUrl = request.headers.get("upload_url") as string;
    const chunkIndex = parseInt(request.headers.get("chunk_index") as string);
    const totalChunks = parseInt(request.headers.get("total_chunks") as string);
    const chunkSize = parseInt(request.headers.get("chunk_size") as string);
    const totalSize = parseInt(request.headers.get("total_size") as string);

    if (!videoChunk || !uploadUrl) {
      return NextResponse.json(
        { error: "Video chunk and upload URL are required" },
        { status: 400 }
      );
    }

    // Upload chunk to TikTok's upload URL
    // Use raw file data directly instead of FormData for TikTok upload
    const start = chunkIndex * chunkSize;
    const end = Math.min(start + videoChunk.byteLength - 1, totalSize - 1);

    console.log(`Uploading chunk ${chunkIndex + 1}/${totalChunks}`, {
      start,
      end,
      size: videoChunk.byteLength,
      url: uploadUrl,
    });

    const uploadResponse = await fetch(uploadUrl, {
      method: "PUT",
      body: videoChunk,
      headers: {
        "Content-Range": `bytes ${start}-${end}/${totalSize}`,
        "Content-Type": "video/mp4",
        "Content-Length": videoChunk.byteLength.toString(),
      },
    });

    // 尝试读取响应内容以获取更多错误信息
    let responseText = "";
    let responseJson = null;

    try {
      responseText = await uploadResponse.text();
      if (responseText) {
        try {
          responseJson = JSON.parse(responseText);
        } catch (e) {
          // 如果不是JSON格式，保持responseText
        }
      }
    } catch (e) {
      console.error("Error reading response:", e);
    }

    if (!uploadResponse.ok) {
      console.error("TikTok chunk upload error:", {
        status: uploadResponse.status,
        statusText: uploadResponse.statusText,
        responseText,
      });

      return NextResponse.json(
        {
          error: "Failed to upload video chunk",
          status: uploadResponse.status,
          statusText: uploadResponse.statusText,
          details: responseJson || responseText,
        },
        { status: uploadResponse.status }
      );
    }

    console.log("TikTok chunk upload success");

    return NextResponse.json({
      success: true,
      chunkIndex,
      totalChunks,
      completed: chunkIndex === totalChunks - 1,
    });
  } catch (error) {
    console.error("TikTok chunk upload error:", error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
