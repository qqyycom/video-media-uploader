import { useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { YouTubeAccount, TikTokAccount } from "@/app/types";

const TOKEN_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes in milliseconds
const REFRESH_THRESHOLD = 30 * 60 * 1000; // 30 minutes in milliseconds

export function useTokenRefresh() {
  const { youtubeAccount, tiktokAccount, refreshToken, refreshAccountData } =
    useAuth();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const checkTokenExpiry = (
    account: YouTubeAccount | TikTokAccount | null,
    platform: "youtube" | "tiktok"
  ): boolean => {
    if (!account || !account.expiresAt) {
      return false;
    }

    const now = Date.now();
    const expiresAt = account.expiresAt;
    const timeUntilExpiry = expiresAt - now;

    console.log(`[${platform.toUpperCase()}] Token check:`, {
      expiresAt: new Date(expiresAt).toISOString(),
      timeUntilExpiry: Math.round(timeUntilExpiry / (60 * 1000)),
      threshold: Math.round(REFRESH_THRESHOLD / (60 * 1000)),
    });

    // Return true if token expires within the threshold
    return timeUntilExpiry <= REFRESH_THRESHOLD;
  };

  const performTokenCheck = useCallback(async () => {
    try {
      console.log("🔍 Performing token check...");
      let refreshed = false;

      // Check YouTube token
      if (youtubeAccount && checkTokenExpiry(youtubeAccount, "youtube")) {
        console.log("🔄 YouTube token needs refresh, refreshing...");
        try {
          await refreshToken("youtube");
          console.log("✅ YouTube token refreshed successfully");
          refreshed = true;
        } catch (error) {
          console.error("❌ Failed to refresh YouTube token:", error);
          // 不再重试，避免无限循环
        }
      }

      // Check TikTok token
      if (tiktokAccount && checkTokenExpiry(tiktokAccount, "tiktok")) {
        console.log("🔄 TikTok token needs refresh, refreshing...");
        try {
          await refreshToken("tiktok");
          console.log("✅ TikTok token refreshed successfully");
          refreshed = true;
        } catch (error) {
          console.error("❌ Failed to refresh TikTok token:", error);
          // 不再重试，避免无限循环
        }
      }

      // Only refresh account data if we actually refreshed a token
      if (refreshed) {
        await refreshAccountData();
      }
    } catch (error) {
      console.error("Token check failed:", error);
    }
  }, [youtubeAccount, tiktokAccount, refreshToken, refreshAccountData]);

  // Single effect to manage the monitoring lifecycle
  useEffect(() => {
    const hasAccounts = Boolean(youtubeAccount || tiktokAccount);

    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Start monitoring if we have accounts
    if (hasAccounts) {
      console.log("🚀 Starting token monitoring (5-minute intervals)...");

      // Perform initial check
      performTokenCheck();

      // Set up interval
      intervalRef.current = setInterval(
        performTokenCheck,
        TOKEN_CHECK_INTERVAL
      );
    } else {
      console.log("⏹️ No accounts connected, stopping monitoring");
    }

    // Cleanup function
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [youtubeAccount?.id, tiktokAccount?.id, performTokenCheck]);

  return {
    isMonitoring: intervalRef.current !== null,
    performTokenCheck,
  };
}
