import { NextRequest, NextResponse } from "next/server";
import { refreshYouTubeToken, isTokenExpired } from "../../../lib/tokenRefresh";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const videoFile = formData.get("videoFile") as File;
    const uploadUrl = formData.get("uploadUrl") as string;
    const chunkIndex = parseInt(formData.get("chunkIndex") as string);
    const totalChunks = parseInt(formData.get("totalChunks") as string);
    const fileSize = parseInt(formData.get("fileSize") as string);

    if (!videoFile || !uploadUrl) {
      return NextResponse.json(
        { error: "Video file and upload URL are required" },
        { status: 400 }
      );
    }

    // Get YouTube account from cookies
    const youtubeAccountCookie = request.cookies.get("youtube_account");
    if (!youtubeAccountCookie) {
      return NextResponse.json(
        { error: "YouTube account not connected" },
        { status: 401 }
      );
    }

    let account = JSON.parse(youtubeAccountCookie.value);

    // Check if token needs refresh and refresh it
    if (
      account.expiresAt &&
      account.refreshToken &&
      isTokenExpired(account.expiresAt)
    ) {
      const refreshResult = await refreshYouTubeToken(account.refreshToken);

      if (refreshResult.success) {
        account = {
          ...account,
          accessToken: refreshResult.accessToken,
          refreshToken: refreshResult.refreshToken || account.refreshToken,
          expiresAt: refreshResult.expiresAt,
        };

        // Update cookie with refreshed account
        const response = NextResponse.json({
          success: true,
          tokenRefreshed: true,
        });

        response.cookies.set("youtube_account", JSON.stringify(account), {
          httpOnly: false,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 7, // 7 days
        });

        return response;
      } else {
        return NextResponse.json(
          { error: "Failed to refresh token", needsReauth: true },
          { status: 401 }
        );
      }
    }

    // Calculate chunk boundaries
    const chunkSize = Math.ceil(fileSize / totalChunks);
    const start = chunkIndex * chunkSize;
    let end = Math.min(start + chunkSize, fileSize);
    if (chunkIndex === totalChunks - 1) {
      end = fileSize;
    }

    // Convert File to Buffer
    const bytes = await videoFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const chunk = buffer.subarray(start, end);

    // Upload chunk to YouTube
    const response = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${account.accessToken}`,
        "Content-Type": videoFile.type || "video/*",
        "Content-Length": chunk.length.toString(),
        "Content-Range": `bytes ${start}-${end - 1}/${fileSize}`,
      },
      body: chunk,
    });

    if (response.status === 308) {
      // Resume incomplete
      const range = response.headers.get("Range");
      return NextResponse.json({
        success: true,
        status: "incomplete",
        range: range,
        uploadedBytes: end,
      });
    } else if (response.status === 200 || response.status === 201) {
      // Upload complete
      const data = await response.json();
      return NextResponse.json({
        success: true,
        status: "complete",
        videoId: data.id,
        data,
      });
    } else {
      const errorData = await response.json();
      throw new Error(
        `Upload failed: ${errorData.error?.message || "Unknown error"}`
      );
    }
  } catch (error) {
    console.error("YouTube chunk upload error:", error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
