"use client";

import { useState, useEffect } from "react";
import { useAuth } from "./context/AuthContext";
import { useVideoUploads } from "./hooks/useVideoUploads";
import { useAccountConnections } from "./hooks/useAccountConnections";
import { useTokenRefresh } from "./hooks/useTokenRefresh";
import { VideoUpload } from "./components/VideoUpload/VideoUpload";
import { AccountBinding } from "./components/AccountBinding/AccountBinding";
import { UploadProgressList } from "./components/UploadProgress/UploadProgress";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "./components/common/Card";
import { Button } from "./components/common/Button";
import {
  VideoFile,
  UploadMetadata,
  YouTubeAccount,
  TikTokAccount,
} from "./types";
import Image from "next/image";

export default function Home() {
  const {
    youtubeAccount,
    tiktokAccount,
    loading: accountsLoading,
    refreshAccounts,
  } = useAccountConnections();

  const {
    uploads,
    selectedVideo,
    metadata,
    setSelectedVideo,
    setMetadata,
    addUpload,
    updateUpload,
    cancelUpload,
  } = useVideoUploads();

  const {
    login,
    connectYouTube,
    connectTikTok,
    disconnectYouTube,
    disconnectTikTok,
  } = useAuth();

  // Initialize token refresh monitoring
  useTokenRefresh();

  const [isUploading, setIsUploading] = useState(false);

  // Helper function to check token expiry status
  const getTokenStatus = (account: YouTubeAccount | TikTokAccount | null) => {
    if (!account || !account.expiresAt) return "unknown";

    const now = Date.now();
    const expiresAt = account.expiresAt;
    const timeUntilExpiry = expiresAt - now;
    const hoursUntilExpiry = timeUntilExpiry / (60 * 60 * 1000);

    if (timeUntilExpiry <= 0) return "expired";
    if (hoursUntilExpiry <= 0.5) return "expiring";
    return "valid";
  };

  useEffect(() => {
    const initializeApp = async () => {
      await login("test@test.com", "123456");
      refreshAccounts();
    };

    initializeApp();
  }, []);

  // Listen for storage changes to detect account binding
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "youtube_account" || e.key === "tiktok_account") {
        console.log("Account data changed, refreshing...");
        refreshAccounts();
      }
    };

    // Listen for storage events from other tabs/windows
    window.addEventListener("storage", handleStorageChange);

    // Also listen for custom events from the same window (OAuth callbacks)
    const handleAccountUpdate = () => {
      console.log("Account updated, refreshing...");
      setTimeout(() => refreshAccounts(), 1000); // Small delay to ensure data is saved
    };

    window.addEventListener("accountUpdated", handleAccountUpdate);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("accountUpdated", handleAccountUpdate);
    };
  }, [refreshAccounts]);

  const handleVideoSelect = (video: VideoFile | undefined) => {
    setSelectedVideo(video || null);
  };

  const handleMetadataChange = (newMetadata: UploadMetadata) => {
    setMetadata(newMetadata);
  };

  const validateUpload = (platform: "youtube" | "tiktok"): string | null => {
    if (!selectedVideo) return "请先选择视频文件";
    if (platform === "youtube" && !youtubeAccount)
      return "请先连接 YouTube 账号";
    if (platform === "tiktok" && !tiktokAccount) return "请先连接 TikTok 账号";
    return null;
  };

  const showNotification = (message: string, type: "success" | "error") => {
    // This would integrate with a toast notification system
    console.log(`${type.toUpperCase()}: ${message}`);
  };

  const handleUpload = async (platform: "youtube" | "tiktok") => {
    const validationError = validateUpload(platform);
    if (validationError) {
      showNotification(validationError, "error");
      return;
    }

    if (!selectedVideo) return;

    setIsUploading(true);
    const uploadId = addUpload(platform, selectedVideo, metadata);

    try {
      updateUpload(uploadId, { status: "uploading", progress: 0 });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minute timeout

      const response = await fetch(`/api/${platform}/upload`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...metadata,
          videoId: selectedVideo.id,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "上传失败");
      }

      // Simulate upload progress with more realistic increments
      const progressSteps = [10, 25, 45, 60, 75, 85, 95, 100];
      for (const progress of progressSteps) {
        await new Promise((resolve) => setTimeout(resolve, 300));
        updateUpload(uploadId, { progress });
      }

      const result = await response.json();
      updateUpload(uploadId, {
        status: "completed",
        progress: 100,
        completedAt: new Date(),
        videoId: result.videoId || "mock-video-id",
        videoUrl:
          result.videoUrl || `https://${platform}.com/watch?v=mock-video-id`,
      });

      showNotification(
        `视频已成功上传到 ${platform === "youtube" ? "YouTube" : "TikTok"}`,
        "success"
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "上传失败";
      updateUpload(uploadId, {
        status: "failed",
        error: errorMessage,
      });
      showNotification(errorMessage, "error");
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancelUpload = (uploadId: string) => {
    cancelUpload(uploadId);
    showNotification("上传已取消", "error");
  };

  const handleRetryUpload = async (uploadId: string) => {
    const upload = uploads.find((u) => u.id === uploadId);
    if (!upload) return;

    showNotification("正在重新上传...", "success");
    await handleUpload(upload.platform);
  };

  if (accountsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600">加载账号信息中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg shadow-sm border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Image
                  src="/foxx-logo-small_2x.png"
                  alt="FOXX"
                  width={40}
                  height={40}
                  className="object-contain"
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  FOXX视频上传平台
                </h1>
                <p className="text-sm text-gray-500">多平台同步发布工具</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 text-sm">
                <div
                  className={`w-2 h-2 rounded-full ${
                    youtubeAccount ? "bg-green-500" : "bg-gray-300"
                  }`}
                />
                <span
                  className={
                    youtubeAccount
                      ? "text-green-600 font-medium"
                      : "text-gray-500"
                  }
                >
                  YouTube
                  {youtubeAccount &&
                    getTokenStatus(youtubeAccount) === "expiring" && (
                      <span className="ml-1 text-xs text-orange-500">⚠️</span>
                    )}
                </span>
                <div
                  className={`w-2 h-2 rounded-full ${
                    tiktokAccount ? "bg-green-500" : "bg-gray-300"
                  }`}
                />
                <span
                  className={
                    tiktokAccount
                      ? "text-green-600 font-medium"
                      : "text-gray-500"
                  }
                >
                  TikTok
                  {tiktokAccount &&
                    getTokenStatus(tiktokAccount) === "expiring" && (
                      <span className="ml-1 text-xs text-orange-500">⚠️</span>
                    )}
                </span>
              </div>
              <Button
                onClick={refreshAccounts}
                disabled={accountsLoading}
                variant="outline"
                size="sm"
                className="hover:bg-blue-50"
              >
                {accountsLoading ? "刷新中..." : "刷新账号"}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 xl:col-span-3 space-y-6">
            <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center space-x-2 text-gray-900">
                  <svg
                    className="w-5 h-5 text-blue-600"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                  </svg>
                  <span>视频上传</span>
                </CardTitle>
                <CardDescription className="text-gray-600">
                  选择视频文件并配置发布信息
                </CardDescription>
              </CardHeader>
              <CardContent>
                <VideoUpload
                  selectedVideo={selectedVideo || undefined}
                  metadata={metadata}
                  onVideoSelect={handleVideoSelect}
                  onMetadataChange={handleMetadataChange}
                  onUpload={handleUpload}
                  isUploading={isUploading}
                />
              </CardContent>
            </Card>

            {uploads.length > 0 && (
              <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center space-x-2 text-gray-900">
                    <svg
                      className="w-5 h-5 text-green-600"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M13,9H11V7H13M13,17H11V11H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" />
                    </svg>
                    <span>上传进度</span>
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    实时查看视频上传状态
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <UploadProgressList
                    uploads={uploads}
                    onCancel={handleCancelUpload}
                    onRetry={handleRetryUpload}
                  />
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-2 xl:col-span-2 space-y-6">
            <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-gray-900">
                  <svg
                    className="w-5 h-5 text-purple-600"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z" />
                  </svg>
                  <span>账号管理</span>
                </CardTitle>
                <CardDescription className="text-gray-600">
                  连接和管理您的社交媒体账号
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AccountBinding
                  onConnectYouTube={connectYouTube}
                  onDisconnectYouTube={disconnectYouTube}
                  onConnectTikTok={connectTikTok}
                  onDisconnectTikTok={disconnectTikTok}
                />
              </CardContent>
            </Card>

            {/* Token Status Card */}
            {(youtubeAccount || tiktokAccount) && (
              <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-gray-900">
                    <svg
                      className="w-5 h-5 text-blue-600"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M12,7C13.4,7 14.8,8.6 14.8,10V14.5C14.8,16.9 13.4,18.5 12,18.5C10.6,18.5 9.2,16.9 9.2,14.5V10C9.2,8.6 10.6,7 12,7Z" />
                    </svg>
                    <span>Token 状态</span>
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    账号授权状态监控
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {youtubeAccount && (
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center">
                            <svg
                              className="w-4 h-4 text-white"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M10,15L15.19,12L10,9V15M21.56,7.17C21.69,7.64 21.78,8.27 21.84,9.07C21.91,9.87 21.94,10.56 21.94,11.16L22,12C22,14.19 21.84,15.8 21.56,16.83C21.31,17.73 20.73,18.31 19.83,18.56C19.36,18.69 18.5,18.78 17.18,18.84C15.88,18.91 14.69,18.94 13.59,18.94L12,19C7.81,19 5.2,18.84 4.17,18.56C3.27,18.31 2.69,17.73 2.44,16.83C2.31,16.36 2.22,15.73 2.16,14.93C2.09,14.13 2.06,13.44 2.06,12.84L2,12C2,9.81 2.16,8.2 2.44,7.17C2.69,6.27 3.27,5.69 4.17,5.44C4.64,5.31 5.5,5.22 6.82,5.16C8.12,5.09 9.31,5.06 10.41,5.06L12,5C16.19,5 18.8,5.16 19.83,5.44C20.73,5.69 21.31,6.27 21.56,7.17Z" />
                            </svg>
                          </div>
                          <span className="font-medium">YouTube</span>
                        </div>
                        <div className="text-right">
                          {(() => {
                            const status = getTokenStatus(youtubeAccount);
                            if (status === "valid")
                              return (
                                <span className="text-green-600 text-sm">
                                  ✅ 正常
                                </span>
                              );
                            if (status === "expiring")
                              return (
                                <span className="text-orange-600 text-sm">
                                  ⚠️ 即将过期
                                </span>
                              );
                            if (status === "expired")
                              return (
                                <span className="text-red-600 text-sm">
                                  ❌ 已过期
                                </span>
                              );
                            return (
                              <span className="text-gray-600 text-sm">
                                ❓ 未知
                              </span>
                            );
                          })()}
                          {youtubeAccount.expiresAt && (
                            <div className="text-xs text-gray-500 mt-1">
                              {new Date(
                                youtubeAccount.expiresAt
                              ).toLocaleString()}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {tiktokAccount && (
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 bg-black rounded-full flex items-center justify-center">
                            <svg
                              className="w-4 h-4 text-white"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M19.321,5.562a5.122,5.122,0,0,1-.443-.258,6.228,6.228,0,0,1-1.137-.966A7.726,7.726,0,0,1,16.644,2.5H13.5V15.436a3.814,3.814,0,1,1-2.532-3.607V8.67a6.987,6.987,0,1,0,5.353,6.766V9.982a9.706,9.706,0,0,0,3,.915V7.743A5.124,5.124,0,0,1,19.321,5.562Z" />
                            </svg>
                          </div>
                          <span className="font-medium">TikTok</span>
                        </div>
                        <div className="text-right">
                          {(() => {
                            const status = getTokenStatus(tiktokAccount);
                            if (status === "valid")
                              return (
                                <span className="text-green-600 text-sm">
                                  ✅ 正常
                                </span>
                              );
                            if (status === "expiring")
                              return (
                                <span className="text-orange-600 text-sm">
                                  ⚠️ 即将过期
                                </span>
                              );
                            if (status === "expired")
                              return (
                                <span className="text-red-600 text-sm">
                                  ❌ 已过期
                                </span>
                              );
                            return (
                              <span className="text-gray-600 text-sm">
                                ❓ 未知
                              </span>
                            );
                          })()}
                          {tiktokAccount.expiresAt && (
                            <div className="text-xs text-gray-500 mt-1">
                              {new Date(
                                tiktokAccount.expiresAt
                              ).toLocaleString()}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-center p-2 bg-blue-50 rounded-lg text-blue-700 text-sm">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse mr-2"></div>
                      自动监控已启用 (每5分钟检查)
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Stats Card */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-purple-600 text-white">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-blue-100">总上传数</span>
                    <span className="text-2xl font-bold">{uploads.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-blue-100">成功</span>
                    <span className="text-xl font-semibold text-green-300">
                      {uploads.filter((u) => u.status === "completed").length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-blue-100">失败</span>
                    <span className="text-xl font-semibold text-red-300">
                      {uploads.filter((u) => u.status === "failed").length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
