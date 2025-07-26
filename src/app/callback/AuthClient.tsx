/**
 * 认证客户端组件
 * 用于在OAuth认证成功后，将账户信息存储到本地存储和Cookie中
 * 并重定向用户回首页
 */

"use client";

import { useEffect } from "react";
import { TikTokAccount, YouTubeAccount } from "../types";

interface AuthClientProps {
  tiktokAccount?: TikTokAccount;
  youtubeAccount?: YouTubeAccount;
}

export default function AuthClient({
  tiktokAccount,
  youtubeAccount,
}: AuthClientProps) {
  useEffect(() => {
    // 存储TikTok账户信息到本地存储和Cookie
    if (tiktokAccount) {
      localStorage.setItem("tiktok_account", JSON.stringify(tiktokAccount));
      document.cookie = `tiktok_account=${JSON.stringify(
        tiktokAccount
      )}; path=/; max-age=${60 * 60 * 24 * 7}; secure=${
        process.env.NODE_ENV === "production"
      }; samesite=lax`;
    }
    
    // 存储YouTube账户信息到本地存储和Cookie
    if (youtubeAccount) {
      localStorage.setItem("youtube_account", JSON.stringify(youtubeAccount));
      document.cookie = `youtube_account=${JSON.stringify(
        youtubeAccount
      )}; path=/; max-age=${60 * 60 * 24 * 7}; secure=${
        process.env.NODE_ENV === "production"
      }; samesite=lax`;
    }

    // 3秒后重定向回首页
    setTimeout(() => {
      window.location.href = "/";
    }, 3000);
  }, [tiktokAccount, youtubeAccount]);
  
  return null;
}
