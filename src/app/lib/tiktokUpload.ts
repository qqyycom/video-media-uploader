import { TikTokUploadData, UploadMetadata } from "../types";

export interface TikTokUploadResult {
  success: boolean;
  data?: {
    post_id: string;
  };
  error?: string;
}

export class TikTokUploader {
  private publishId: string;
  private uploadUrl: string;
  private chunkSize: number;
  private totalChunks: number;

  constructor(uploadData: TikTokUploadData) {
    this.publishId = uploadData.publish_id;
    this.uploadUrl = uploadData.upload_url;
    this.chunkSize = uploadData.chunk_size;
    this.totalChunks = uploadData.total_chunk_count;
  }

  async uploadVideo(
    videoFile: File,
    onProgress?: (progress: number) => void
  ): Promise<TikTokUploadResult> {
    try {
      console.log("Starting TikTok upload with:", {
        publishId: this.publishId,
        totalChunks: this.totalChunks,
        chunkSize: this.chunkSize,
        fileSize: videoFile.size,
      });

      console.log(videoFile.size);

      // Upload video in chunks
      for (let chunkIndex = 0; chunkIndex < this.totalChunks; chunkIndex++) {
        const start = chunkIndex * this.chunkSize;
        let end = Math.min(start + this.chunkSize, videoFile.size);

        if (chunkIndex === this.totalChunks - 1) {
          end = videoFile.size;
        }

        const chunk = videoFile.slice(start, end, "video/mp4");
        const actualChunkSize = end - start;

        console.log(`Uploading chunk ${chunkIndex + 1}/${this.totalChunks}`, {
          start,
          end: end - 1,
          size: actualChunkSize,
        });

        const chunkResponse = await fetch("/api/tiktok/upload-chunk", {
          method: "POST",
          body: chunk,
          headers: {
            upload_url: this.uploadUrl,
            chunk_index: chunkIndex.toString(),
            total_chunks: this.totalChunks.toString(),
            chunk_size: this.chunkSize.toString(), // 使用总的chunkSize而不是actualChunkSize
            total_size: videoFile.size.toString(),
          },
        });

        console.log(chunkResponse);

        if (!chunkResponse.ok) {
          const errorData = await chunkResponse.json();
          console.error("Chunk upload error:", errorData);
          throw new Error(errorData.error || "Failed to upload video chunk");
        }

        // Update progress
        if (onProgress) {
          const progress = ((chunkIndex + 1) / this.totalChunks) * 100;
          onProgress(progress);
        }
      }

      console.log("All chunks uploaded, publishing video...");

      // // Publish the video after all chunks are uploaded
      // const publishResponse = await fetch("/api/tiktok/publish", {
      //   method: "POST",
      //   headers: {
      //     "Content-Type": "application/json",
      //   },
      //   body: JSON.stringify({
      //     publishId: this.publishId,
      //   }),
      // });

      // if (!publishResponse.ok) {
      //   const errorData = await publishResponse.json();
      //   console.error("Publish error:", errorData);
      //   throw new Error(errorData.error || "Failed to publish video");
      // }

      // const publishData = await publishResponse.json();
      // console.log("Video published successfully:", publishData);
      return {
        success: true,
        data: {
          post_id: "123",
        },
        // data: publishData.data,
      };
    } catch (error) {
      console.error("TikTok upload error:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }
}

export async function initializeTikTokUpload(
  videoFile: File,
  metadata: UploadMetadata
): Promise<{ success: boolean; data?: TikTokUploadData; error?: string }> {
  try {
    const response = await fetch("/api/tiktok/upload", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        videoFile: {
          size: videoFile.size,
          name: videoFile.name,
          type: videoFile.type,
        },
        title: metadata.title,
        description: metadata.description,
        privacy: metadata.privacy,
        disableComment: metadata.disableComment,
        disableDuet: metadata.disableDuet,
        disableStitch: metadata.disableStitch,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.error || "Failed to initialize upload",
      };
    }

    const responseData = await response.json();
    return {
      success: true,
      data: responseData.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error occurred",
    };
  }
}

export async function uploadVideoToTikTok(
  videoFile: File,
  metadata: UploadMetadata,
  onProgress?: (progress: number) => void
): Promise<TikTokUploadResult> {
  // Step 1: Initialize upload
  const initResult = await initializeTikTokUpload(videoFile, metadata);

  if (!initResult.success || !initResult.data) {
    return {
      success: false,
      error: initResult.error || "Failed to initialize upload",
    };
  }

  // Step 2: Upload video using the uploader class
  const uploader = new TikTokUploader(initResult.data);
  return await uploader.uploadVideo(videoFile, onProgress);
}
