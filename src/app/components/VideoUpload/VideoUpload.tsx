'use client'

import React, { useCallback, useState, useRef } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, Video, X, Youtube, Music } from 'lucide-react'
import { VideoFile, UploadMetadata } from '@/app/types'
import { formatFileSize, formatDuration, validateVideoFile } from '@/app/lib/utils'
import { Button } from '@/app/components/common/Button'
import { Tabs, TabItem, TabPanel } from '@/app/components/common/Tabs'
import { YouTubeUploadForm } from './YouTubeUploadForm'
import { TikTokUploadForm } from './TikTokUploadForm'
import { useAuth } from '@/app/context/AuthContext'

interface VideoUploadProps {
  onVideoSelect: (video: VideoFile | undefined) => void
  onMetadataChange: (metadata: UploadMetadata) => void
  onUpload: (platform: 'youtube' | 'tiktok') => void
  selectedVideo?: VideoFile
  metadata?: UploadMetadata
  isUploading?: boolean
}

export function VideoUpload({
  onVideoSelect,
  onMetadataChange,
  onUpload,
  selectedVideo,
  metadata = { title: '', privacy: 'private' },
  isUploading = false,
}: VideoUploadProps) {
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [activeTab, setActiveTab] = useState<string>('youtube')
  const videoRef = useRef<HTMLVideoElement>(null)
  const { youtubeAccount, tiktokAccount } = useAuth()

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    const validation = validateVideoFile(file)
    if (!validation.valid) {
      setErrors({ file: validation.error || 'Invalid file' })
      return
    }

    const video = document.createElement('video')
    video.preload = 'metadata'
    
    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src)
      
      const videoFile: VideoFile = {
        id: Math.random().toString(36).substring(7),
        file,
        name: file.name,
        size: file.size,
        duration: video.duration || 0,
        resolution: `${video.videoWidth || 0}x${video.videoHeight || 0}`,
        type: file.type,
        preview: URL.createObjectURL(file),
      }

      onVideoSelect(videoFile)
      setErrors({})
    }

    video.onerror = () => {
      setErrors({ file: '无法读取视频文件' })
      window.URL.revokeObjectURL(video.src)
    }

    video.src = URL.createObjectURL(file)
  }, [onVideoSelect])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/mp4': ['.mp4'],
      'video/quicktime': ['.mov'],
      'video/x-msvideo': ['.avi'],
    },
    maxFiles: 1,
    maxSize: 128 * 1024 * 1024 * 1024, // 128GB
    disabled: isUploading,
  })

  const removeVideo = () => {
    if (selectedVideo?.preview) {
      URL.revokeObjectURL(selectedVideo.preview)
    }
    onVideoSelect(undefined)
  }

  const handleUpload = (platform: 'youtube' | 'tiktok') => {
    onUpload(platform)
  }

  return (
    <div className="space-y-6">
      {!selectedVideo ? (
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
            ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <input {...getInputProps()} />
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <div className="space-y-2">
            <h3 className="text-lg font-medium text-gray-900">
              {isDragActive ? '释放文件以上传' : '拖拽视频文件到此处'}
            </h3>
            <p className="text-sm text-gray-600">
              或者点击选择文件
            </p>
            <p className="text-xs text-gray-500 mt-4">
              支持 MP4, MOV, AVI 格式 • 最大 128GB
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-4">
                <Video className="h-8 w-8 text-blue-600" />
                <div>
                  <h4 className="font-medium text-gray-900">{selectedVideo.name}</h4>
                  <p className="text-sm text-gray-600">
                    {formatFileSize(selectedVideo.size)} • {formatDuration(selectedVideo.duration)} • {selectedVideo.resolution}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={removeVideo}
                disabled={isUploading}
                className="text-red-600 hover:text-red-700"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <video
              ref={videoRef}
              src={selectedVideo.preview}
              controls
              className="w-full max-w-md mx-auto rounded-lg"
            />
          </div>

          <Tabs activeTab={activeTab} onChange={setActiveTab}>
            <TabItem 
              value="youtube" 
              label="YouTube" 
              icon={<Youtube className="h-4 w-4" />}
              disabled={isUploading}
            />
            <TabItem 
              value="tiktok" 
              label="TikTok" 
              icon={<Music className="h-4 w-4" />}
              disabled={isUploading}
            />
          </Tabs>

          <TabPanel value="youtube" activeTab={activeTab}>
            <YouTubeUploadForm
              selectedVideo={selectedVideo}
              metadata={metadata}
              onMetadataChange={onMetadataChange}
              onUpload={() => handleUpload('youtube')}
              isUploading={isUploading}
              isConnected={!!youtubeAccount}
            />
          </TabPanel>

          <TabPanel value="tiktok" activeTab={activeTab}>
            <TikTokUploadForm
              selectedVideo={selectedVideo}
              metadata={metadata}
              onMetadataChange={onMetadataChange}
              onUpload={() => handleUpload('tiktok')}
              isUploading={isUploading}
              isConnected={!!tiktokAccount}
            />
          </TabPanel>
        </div>
      )}

      {errors.file && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700 text-sm">{errors.file}</p>
        </div>
      )}
    </div>
  )
}