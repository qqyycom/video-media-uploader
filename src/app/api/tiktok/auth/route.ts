import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const error = searchParams.get("error");
    const state = searchParams.get("state");

    if (error) {
      return NextResponse.redirect(
        new URL(`/?error=${encodeURIComponent(error)}`, request.url)
      );
    }

    if (!code) {
      return NextResponse.json(
        { error: "Authorization code is required" },
        { status: 400 }
      );
    }

    // Exchange code for access token
    const tokenResponse = await fetch(
      "https://open.tiktokapis.com/v2/oauth/token/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_key: process.env.NEXT_PUBLIC_TIKTOK_CLIENT_KEY || "",
          client_secret: process.env.TIKTOK_CLIENT_SECRET || "",
          code: code,
          grant_type: "authorization_code",
          redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/callback/tiktok`,
        }),
      }
    );

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      throw new Error(errorData.message || "Failed to get access token");
    }

    const tokenData = await tokenResponse.json();
    console.log(tokenData);

    // Get user info
    const userInfoResponse = await fetch(
      "https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name",
      {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      }
    );

    if (!userInfoResponse.ok) {
      throw new Error("Failed to get user info");
    }

    const userInfoData = await userInfoResponse.json();
    const user = userInfoData.data.user;

    const account = {
      id: user.open_id,
      openId: user.open_id,
      username: user.username,
      displayName: user.display_name,
      avatar: user.avatar_url,
      followerCount: user.follower_count,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt: Date.now() + tokenData.expires_in * 1000,
    };

    // Store account info in session/cookie
    const response = NextResponse.json({
      redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/?tiktok=connected`,
      account: account,
    });
    response.cookies.set("tiktok_account", JSON.stringify(account), {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error("TikTok auth error:", error);
    return NextResponse.redirect(
      new URL(
        `${process.env.NEXT_PUBLIC_APP_URL}/?error=${encodeURIComponent(
          (error as Error).message
        )}`,
        request.url
      )
    );
  }
}
