import { NextRequest, NextResponse } from "next/server";
import { refreshYouTubeToken, isTokenExpired } from "../../../lib/tokenRefresh";

export async function POST(request: NextRequest) {
  try {
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

    // Check upload status by querying the upload URL with a HEAD request
    // YouTube doesn't provide a separate status endpoint for resumable uploads
    // We'll simulate status based on the upload URL validity

    // For now, we'll return a success status since YouTube uploads complete synchronously
    // In a real implementation, you might need to poll the upload URL or use YouTube's Data API
    return NextResponse.json({
      success: true,
      status: "PUBLISH_COMPLETE",
      videoId: "mock-youtube-video-id", // This would be extracted from the actual response
    });
  } catch (error) {
    console.error("YouTube upload status error:", error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
