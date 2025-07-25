import { VideoFile, UploadMetadata } from "@/app/types";

interface YouTubeUploadConfig {
  videoFile: VideoFile;
  metadata: UploadMetadata;
  onProgress?: (progress: number) => void;
  onChunkUploaded?: (uploadedBytes: number) => void;
}

interface YouTubeUploadResult {
  success: boolean;
  videoId?: string;
  error?: string;
}

export async function uploadToYouTube({
  videoFile,
  metadata,
  onProgress,
  onChunkUploaded,
}: YouTubeUploadConfig): Promise<YouTubeUploadResult> {
  try {
    // Step 1: Initialize upload via backend to protect client secret
    const initResponse = await fetch("/api/youtube/upload-init", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: metadata.title,
        description: metadata.description,
        tags: metadata.tags,
        privacy: metadata.privacy,
        category: metadata.category,
        videoFile: {
          size: videoFile.file.size,
          name: videoFile.file.name,
          type: videoFile.file.type,
        },
      }),
    });

    if (!initResponse.ok) {
      const errorData = await initResponse.json();
      throw new Error(
        `Failed to initialize YouTube upload: ${
          errorData.error || "Unknown error"
        }`
      );
    }

    const initData = await initResponse.json();
    if (!initData.success) {
      throw new Error(initData.error || "Failed to initialize upload");
    }

    const { uploadUrl } = initData.data;

    // Step 2: Upload video file via backend proxy (chunked upload)
    const chunkSize = videoFile.file.size; // file size
    const totalChunks = Math.ceil(videoFile.file.size / chunkSize);
    let uploadedBytes = 0;

    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize;
      let end = Math.min(start + chunkSize, videoFile.file.size);
      if (i === totalChunks - 1) {
        end = videoFile.file.size;
      }
      const chunk = videoFile.file.slice(start, end);

      const formData = new FormData();
      formData.append("videoFile", chunk);
      formData.append("uploadUrl", uploadUrl);
      formData.append("chunkIndex", i.toString());
      formData.append("totalChunks", totalChunks.toString());
      formData.append("fileSize", videoFile.file.size.toString());

      const response = await fetch("/api/youtube/upload-chunk", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `Chunk upload failed: ${errorData.error || "Unknown error"}`
        );
      }

      const result = await response.json();

      if (result.status === "complete") {
        uploadedBytes = videoFile.file.size;
        onProgress?.(100);
        onChunkUploaded?.(uploadedBytes);

        // Step 3: Wait for processing completion via backend
        const publishStatus = await checkPublishStatus();
        if (!publishStatus.success) {
          throw new Error(publishStatus.error || "Upload processing failed");
        }

        return {
          success: true,
          videoId: result.videoId || publishStatus.videoId,
        };
      } else {
        uploadedBytes = end;
        onProgress?.((uploadedBytes / videoFile.file.size) * 100);
        onChunkUploaded?.(uploadedBytes);
      }
    }

    throw new Error("Upload did not complete");
  } catch (error) {
    console.error("YouTube upload error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function checkPublishStatus(): Promise<{
  success: boolean;
  videoId?: string;
  error?: string;
}> {
  const maxAttempts = 60; // 2 minutes max
  let attempts = 0;

  while (attempts < maxAttempts) {
    const statusResponse = await fetch("/api/youtube/upload-status", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!statusResponse.ok) {
      return { success: false, error: "Failed to check upload status" };
    }

    const statusData = await statusResponse.json();

    if (statusData.status === "PUBLISH_COMPLETE") {
      return { success: true, videoId: statusData.videoId };
    } else if (statusData.status === "PUBLISH_FAILED") {
      return { success: false, error: "Video processing failed on YouTube" };
    } else {
      // Still processing, wait and check again
      await new Promise((resolve) => setTimeout(resolve, 2000));
      attempts++;
    }
  }

  return { success: false, error: "Upload processing timeout" };
}
