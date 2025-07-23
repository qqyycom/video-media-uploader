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
    }
    if (youtubeAccount) {
      localStorage.setItem("youtube_account", JSON.stringify(youtubeAccount));
    }

    // 3秒后，重定向回首页
    setTimeout(() => {
      window.location.href = "/";
    }, 3000);
  }, [tiktokAccount, youtubeAccount]);
  return null;
}
