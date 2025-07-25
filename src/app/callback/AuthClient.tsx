// 使用client组件将用户绑定信息存到localstorage中

"use client";

import React, { useEffect } from "react";
import { TikTokAccount, YouTubeAccount } from "../types";

export default function AuthClient({
  tiktokAccount,
  youtubeAccount,
}: {
  tiktokAccount?: TikTokAccount;
  youtubeAccount?: YouTubeAccount;
}) {
  useEffect(() => {
    if (tiktokAccount) {
      localStorage.setItem("tiktok_account", JSON.stringify(tiktokAccount));
      // 将tiktok_account写入cookie
      // document.cookie = `tiktok_account=${JSON.stringify(tiktokAccount)}`;
      document.cookie = `tiktok_account=${JSON.stringify(
        tiktokAccount
      )}; path=/; max-age=${60 * 60 * 24 * 7}; secure=${
        process.env.NODE_ENV === "production"
      }; samesite=lax`;
    }
    if (youtubeAccount) {
      localStorage.setItem("youtube_account", JSON.stringify(youtubeAccount));
      // 将youtube_account写入cookie
      // document.cookie = `youtube_account=${JSON.stringify(youtubeAccount)}`;
      document.cookie = `youtube_account=${JSON.stringify(
        youtubeAccount
      )}; path=/; max-age=${60 * 60 * 24 * 7}; secure=${
        process.env.NODE_ENV === "production"
      }; samesite=lax`;
    }

    // 3秒后，重定向回首页
    setTimeout(() => {
      window.location.href = "/";
    }, 3000);
  }, [tiktokAccount, youtubeAccount]);
  return null;
}
