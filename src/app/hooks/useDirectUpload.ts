import { useCallback, useState } from "react";
import { VideoFile, UploadMetadata, UploadProgress } from "@/app/types";
import { uploadToYouTube } from "@/app/lib/youtubeUpload";
import { uploadToTikTok } from "@/app/lib/tiktokUpload";
import { generateId } from "@/app/lib/utils";

interface UseDirectUploadProps {
  youtubeAccessToken?: string;
  tiktokAccessToken?: string;
}

interface UseDirectUploadReturn {
  uploads: UploadProgress[];
  isUploading: boolean;
  uploadToPlatform: (
    platform: "youtube" | "tiktok",
    videoFile: VideoFile,
    metadata: UploadMetadata
  ) => Promise<void>;
  cancelUpload: (uploadId: string) => void;
  retryUpload: (uploadId: string) => void;
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
