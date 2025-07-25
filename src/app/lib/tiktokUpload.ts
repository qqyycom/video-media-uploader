import { VideoFile, UploadMetadata } from "../types";

interface TikTokUploadConfig {
  accessToken: string;
  videoFile: VideoFile;
  metadata: UploadMetadata;
  onProgress?: (progress: number) => void;
  onChunkUploaded?: (uploadedBytes: number) => void;
}

interface TikTokUploadResult {
  success: boolean;
  videoId?: string;
  publishId?: string;
  error?: string;
}

export async function uploadToTikTok({
  videoFile,
  metadata,
  onProgress,
  onChunkUploaded,
}: TikTokUploadConfig): Promise<TikTokUploadResult> {
  try {
    // Step 1: Initialize upload via backend to protect client secret
    const initResponse = await fetch("/api/tiktok/upload", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: metadata.title,
        description: metadata.description,
        privacy: metadata.privacy,
        disableComment: false,
        disableDuet: false,
        disableStitch: false,
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
        `Failed to initialize TikTok upload: ${
          errorData.error || "Unknown error"
        }`
      );
    }

    const initData = await initResponse.json();
    if (!initData.success) {
      throw new Error(initData.error || "Failed to initialize upload");
    }

    const { publish_id, upload_url, chunk_size, total_chunk_count } =
      initData.data;

    // Step 2: Upload video file directly to TikTok in chunks
    let uploadedBytes = 0;

    for (let i = 0; i < total_chunk_count; i++) {
      const start = i * chunk_size;
      let end = Math.min(start + chunk_size, videoFile.file.size);
      if (i === total_chunk_count - 1) {
        end = videoFile.file.size;
      }
      const chunk = videoFile.file.slice(start, end);

      const response = await fetch(upload_url, {
        method: "PUT",
        headers: {
          "Content-Type": videoFile.file.type,
          "Content-Length": chunk.size.toString(),
          "Content-Range": `bytes ${start}-${end - 1}/${videoFile.file.size}`,
        },
        body: chunk,
      });

      if (response.ok) {
        uploadedBytes = end;
        onProgress?.((uploadedBytes / videoFile.file.size) * 100);
        onChunkUploaded?.(uploadedBytes);
      } else {
        throw new Error(
          `Chunk upload failed: ${response.status} ${response.statusText}`
        );
      }
    }

    // Step 3: Wait for processing completion via backend
    const publishStatus = await checkPublishStatus(publish_id);
    if (!publishStatus.success) {
      throw new Error(publishStatus.error || "Upload processing failed");
    }

    return {
      success: true,
      videoId: publishStatus.videoId,
      publishId: publish_id,
    };
  } catch (error) {
    console.error("TikTok upload error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function checkPublishStatus(
  publishId: string
): Promise<{ success: boolean; videoId?: string; error?: string }> {
  const maxAttempts = 60; // 2 minutes max
  let attempts = 0;

  while (attempts < maxAttempts) {
    const statusResponse = await fetch("/api/tiktok/upload-status", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        publishId,
      }),
    });

    if (!statusResponse.ok) {
      return { success: false, error: "Failed to check upload status" };
    }

    const statusData = await statusResponse.json();

    if (statusData.status === "PUBLISH_COMPLETE") {
      return { success: true, videoId: statusData.videoId };
    } else if (statusData.status === "PUBLISH_FAILED") {
      return { success: false, error: "Video processing failed on TikTok" };
    } else {
      // Still processing, wait and check again
      await new Promise((resolve) => setTimeout(resolve, 2000));
      attempts++;
    }
  }

  return { success: false, error: "Upload processing timeout" };
}

// Backward compatibility functions - deprecated
export async function uploadVideoToTikTok(): Promise<{
  success: boolean;
  data?: { post_id: string };
  error?: string;
}> {
  throw new Error(
    "Direct upload method deprecated. Use uploadToTikTok instead."
  );
}
