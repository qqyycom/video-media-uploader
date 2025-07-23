import { TikTokUploadData, UploadMetadata } from '../types';

export interface TikTokUploadResult {
  success: boolean;
  data?: {
    share_url: string;
    video_id: string;
    embed_html: string;
    embed_link: string;
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
      // Upload video in chunks
      for (let chunkIndex = 0; chunkIndex < this.totalChunks; chunkIndex++) {
        const start = chunkIndex * this.chunkSize;
        const end = Math.min(start + this.chunkSize, videoFile.size);
        const chunk = videoFile.slice(start, end);

        const formData = new FormData();
        formData.append('video', chunk);
        formData.append('upload_url', this.uploadUrl);
        formData.append('chunk_index', chunkIndex.toString());
        formData.append('total_chunks', this.totalChunks.toString());

        const chunkResponse = await fetch('/api/tiktok/upload-chunk', {
          method: 'POST',
          body: formData,
        });

        if (!chunkResponse.ok) {
          const errorData = await chunkResponse.json();
          throw new Error(errorData.error || 'Failed to upload video chunk');
        }

        // Update progress
        if (onProgress) {
          const progress = ((chunkIndex + 1) / this.totalChunks) * 100;
          onProgress(progress);
        }
      }

      // Publish the video after all chunks are uploaded
      const publishResponse = await fetch('/api/tiktok/publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          publishId: this.publishId,
        }),
      });

      if (!publishResponse.ok) {
        const errorData = await publishResponse.json();
        throw new Error(errorData.error || 'Failed to publish video');
      }

      const publishData = await publishResponse.json();
      return {
        success: true,
        data: publishData.data,
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }
}

export async function initializeTikTokUpload(
  videoFile: File,
  metadata: UploadMetadata
): Promise<{ success: boolean; data?: TikTokUploadData; error?: string }> {
  try {
    const response = await fetch('/api/tiktok/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
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
        error: errorData.error || 'Failed to initialize upload',
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
      error: error instanceof Error ? error.message : 'Network error occurred',
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
      error: initResult.error || 'Failed to initialize upload',
    };
  }

  // Step 2: Upload video using the uploader class
  const uploader = new TikTokUploader(initResult.data);
  return await uploader.uploadVideo(videoFile, onProgress);
}