/**
 * 直接上传Hook
 * 管理视频上传到YouTube和TikTok的完整流程，包括进度跟踪和错误处理
 */

import { useCallback, useState } from "react";
import { VideoFile, UploadMetadata, UploadProgress } from "@/app/types";
import { uploadToYouTube } from "@/app/lib/youtubeUpload";
import { uploadToTikTok } from "@/app/lib/tiktokUpload";
import { generateId } from "@/app/lib/utils";

interface UseDirectUploadProps {
  /** YouTube访问令牌 */
  youtubeAccessToken?: string;
  /** TikTok访问令牌 */
  tiktokAccessToken?: string;
}

interface UseDirectUploadReturn {
  /** 当前所有上传任务 */
  uploads: UploadProgress[];
  /** 是否有正在进行的的上传 */
  isUploading: boolean;
  /** 开始上传到指定平台 */
  uploadToPlatform: (
    platform: "youtube" | "tiktok",
    videoFile: VideoFile,
    metadata: UploadMetadata
  ) => Promise<void>;
  /** 取消指定上传 */
  cancelUpload: (uploadId: string) => void;
  /** 重试失败的上传 */
  retryUpload: (uploadId: string) => void;
  /** 清除所有上传记录 */
  clearUploads: () => void;
}

export function useDirectUpload({
  youtubeAccessToken,
  tiktokAccessToken,
}: UseDirectUploadProps): UseDirectUploadReturn {
  const [uploads, setUploads] = useState<UploadProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const addUpload = useCallback(
    (
      platform: "youtube" | "tiktok",
      _video: VideoFile,
      _metadata: UploadMetadata
    ) => {
      const upload: UploadProgress = {
        id: generateId(),
        platform,
        status: "pending",
        progress: 0,
        startedAt: new Date(),
      };

      setUploads((prev) => [...prev, upload]);
      return upload.id;
    },
    []
  );

  const updateUpload = useCallback(
    (uploadId: string, updates: Partial<UploadProgress>) => {
      setUploads((prev) =>
        prev.map((upload) =>
          upload.id === uploadId ? { ...upload, ...updates } : upload
        )
      );
    },
    []
  );

  const uploadToPlatform = useCallback(
    async (
      platform: "youtube" | "tiktok",
      videoFile: VideoFile,
      metadata: UploadMetadata
    ) => {
      const uploadId = addUpload(platform, videoFile, metadata);
      const accessToken =
        platform === "youtube" ? youtubeAccessToken : tiktokAccessToken;

      if (!accessToken) {
        updateUpload(uploadId, {
          status: "failed",
          error: `No ${platform} access token available`,
          completedAt: new Date(),
        });
        return;
      }

      setIsUploading(true);
      updateUpload(uploadId, { status: "uploading" });

      try {
        let result;

        if (platform === "youtube") {
          result = await uploadToYouTube({
            accessToken,
            videoFile,
            metadata,
            onProgress: (progress) => {
              updateUpload(uploadId, { progress });
            },
            onChunkUploaded: (uploadedBytes) => {
              updateUpload(uploadId, {
                message: `Uploaded ${(uploadedBytes / 1024 / 1024).toFixed(
                  1
                )} MB`,
              });
            },
          });
        } else {
          result = await uploadToTikTok({
            accessToken,
            videoFile,
            metadata,
            onProgress: (progress) => {
              updateUpload(uploadId, { progress });
            },
            onChunkUploaded: (uploadedBytes) => {
              updateUpload(uploadId, {
                message: `Uploaded ${(uploadedBytes / 1024 / 1024).toFixed(
                  1
                )} MB`,
              });
            },
          });
        }

        if (result.success) {
          updateUpload(uploadId, {
            status: "completed",
            progress: 100,
            videoId: result.videoId,
            completedAt: new Date(),
          });
        } else {
          updateUpload(uploadId, {
            status: "failed",
            error: result.error,
            completedAt: new Date(),
          });
        }
      } catch (error) {
        updateUpload(uploadId, {
          status: "failed",
          error: error instanceof Error ? error.message : "Upload failed",
          completedAt: new Date(),
        });
      } finally {
        setIsUploading(false);
      }
    },
    [youtubeAccessToken, tiktokAccessToken, addUpload, updateUpload]
  );

  const cancelUpload = useCallback(
    (uploadId: string) => {
      updateUpload(uploadId, {
        status: "cancelled",
        completedAt: new Date(),
      });
    },
    [updateUpload]
  );

  const retryUpload = useCallback(
    (uploadId: string) => {
      updateUpload(uploadId, {
        status: "pending",
        progress: 0,
        error: undefined,
        completedAt: undefined,
      });
    },
    [updateUpload]
  );

  const clearUploads = useCallback(() => {
    setUploads([]);
  }, []);

  return {
    uploads,
    isUploading,
    uploadToPlatform,
    cancelUpload,
    retryUpload,
    clearUploads,
  };
}
