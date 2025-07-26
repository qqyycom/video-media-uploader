import { useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { YouTubeAccount, TikTokAccount } from "@/app/types";

const TOKEN_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes in milliseconds
const REFRESH_THRESHOLD = 30 * 60 * 1000; // 30 minutes in milliseconds

export function useTokenRefresh() {
  const { youtubeAccount, tiktokAccount, refreshToken, refreshAccountData } =
    useAuth();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const refreshFailureCounts = useRef<{ youtube: number; tiktok: number }>({
    youtube: 0,
    tiktok: 0,
  });
  const lastFailedRefresh = useRef<{ youtube: number; tiktok: number }>({
    youtube: 0,
    tiktok: 0,
  });
  const prevYoutubeId = useRef<string | undefined>(youtubeAccount?.id);
  const prevTiktokId = useRef<string | undefined>(tiktokAccount?.id);

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
    console.log("🔍 Performing token check...");
    console.log("Current failures:", {
      youtube: refreshFailureCounts.current.youtube,
      tiktok: refreshFailureCounts.current.tiktok,
    });
    let refreshed = false;
    const now = Date.now();

    // Check YouTube token
    if (youtubeAccount && checkTokenExpiry(youtubeAccount, "youtube")) {
      const lastFail = lastFailedRefresh.current.youtube;
      const failureCount = refreshFailureCounts.current.youtube;

      // Implement exponential backoff: 1min, 2min, 4min, 8min, 16min, 32min, then stop
      const backoffDelay = Math.pow(2, Math.min(failureCount, 5)) * 60 * 1000;
      const shouldAttemptRefresh = now - lastFail >= backoffDelay;

      if (failureCount >= 5 && lastFail > 0) {
        console.log("🚫 YouTube token refresh max failures reached, skipping");
        return;
      }

      if (shouldAttemptRefresh) {
        console.log("🔄 YouTube token needs refresh, refreshing...");
        try {
          await refreshToken("youtube");
          console.log("✅ YouTube token refreshed successfully");
          refreshFailureCounts.current.youtube = 0; // Reset on success
          lastFailedRefresh.current.youtube = 0;
          refreshed = true;
        } catch (error) {
          console.error("❌ Failed to refresh YouTube token:", error);
          refreshFailureCounts.current.youtube++;
          lastFailedRefresh.current.youtube = now;
        }
      } else {
        console.log(
          `⏸️ YouTube refresh skipped due to backoff (${Math.round(
            (backoffDelay - (now - lastFail)) / 1000
          )}s remaining)`
        );
      }
    }

    // Check TikTok token
    if (tiktokAccount && checkTokenExpiry(tiktokAccount, "tiktok")) {
      const lastFail = lastFailedRefresh.current.tiktok;
      const failureCount = refreshFailureCounts.current.tiktok;

      // Implement exponential backoff: 1min, 2min, 4min, 8min, 16min, 32min, then stop
      const backoffDelay = Math.pow(2, Math.min(failureCount, 5)) * 60 * 1000;
      const shouldAttemptRefresh = now - lastFail >= backoffDelay;

      if (failureCount >= 5 && lastFail > 0) {
        console.log("🚫 TikTok token refresh max failures reached, skipping");
        return;
      }

      if (shouldAttemptRefresh) {
        console.log("🔄 TikTok token needs refresh, refreshing...");
        try {
          await refreshToken("tiktok");
          console.log("✅ TikTok token refreshed successfully");
          refreshFailureCounts.current.tiktok = 0; // Reset on success
          lastFailedRefresh.current.tiktok = 0;
          refreshed = true;
        } catch (error) {
          console.error("❌ Failed to refresh TikTok token:", error);
          refreshFailureCounts.current.tiktok++;
          lastFailedRefresh.current.tiktok = now;
        }
      } else {
        console.log(
          `⏸️ TikTok refresh skipped due to backoff (${Math.round(
            (backoffDelay - (now - lastFail)) / 1000
          )}s remaining)`
        );
      }
    }

    // Only refresh account data if we actually refreshed a token
    if (refreshed) {
      await refreshAccountData().catch((error) => {
        console.error("Failed to refresh account data:", error);
      });
    }
  }, [youtubeAccount?.id, tiktokAccount?.id, refreshToken, refreshAccountData]);

  // Single effect to manage the monitoring lifecycle
  useEffect(() => {
    const hasAccounts = Boolean(youtubeAccount || tiktokAccount);

    // Reset failure counters when accounts actually change
    if (youtubeAccount?.id !== prevYoutubeId.current) {
      refreshFailureCounts.current.youtube = 0;
      lastFailedRefresh.current.youtube = 0;
      prevYoutubeId.current = youtubeAccount?.id;
    }
    if (tiktokAccount?.id !== prevTiktokId.current) {
      refreshFailureCounts.current.tiktok = 0;
      lastFailedRefresh.current.tiktok = 0;
      prevTiktokId.current = tiktokAccount?.id;
    }

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
