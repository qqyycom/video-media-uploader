'use client'

import React, { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, Video, X } from 'lucide-react'
import { VideoFile, UploadMetadata } from '@/app/types'
import { formatFileSize, formatDuration, validateVideoFile } from '@/app/lib/utils'
import { Button } from '@/app/components/common/Button'
import { Input } from '@/app/components/common/Input'
import { Textarea } from '@/app/components/common/Textarea'
import { Select } from '@/app/components/common/Select'
import { TagInput } from '@/app/components/common/TagInput'

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

  const handleMetadataChange = (field: keyof UploadMetadata, value: string | string[] | undefined) => {
    const newMetadata = { ...metadata, [field]: value }
    onMetadataChange(newMetadata)
    
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' })
    }
  }

  const validateMetadata = () => {
    const newErrors: Record<string, string> = {}

    if (!metadata.title.trim()) {
      newErrors.title = '标题不能为空'
    }

    if (metadata.title.length > 100) {
      newErrors.title = '标题不能超过100个字符'
    }

    if (metadata.description && metadata.description.length > 5000) {
      newErrors.description = '描述不能超过5000个字符'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleUpload = (platform: 'youtube' | 'tiktok') => {
    if (validateMetadata()) {
      onUpload(platform)
    }
  }

  const removeVideo = () => {
    if (selectedVideo?.preview) {
      URL.revokeObjectURL(selectedVideo.preview)
    }
    onVideoSelect(undefined)
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
              src={selectedVideo.preview}
              controls
              className="w-full max-w-md mx-auto rounded-lg"
            />
          </div>

          <div className="grid gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                标题 *
              </label>
              <Input
                value={metadata.title}
                onChange={(e) => handleMetadataChange('title', e.target.value)}
                placeholder="输入视频标题"
                maxLength={100}
                error={errors.title}
                disabled={isUploading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                描述
              </label>
              <Textarea
                value={metadata.description || ''}
                onChange={(e) => handleMetadataChange('description', e.target.value)}
                placeholder="输入视频描述"
                maxLength={5000}
                rows={4}
                error={errors.description}
                disabled={isUploading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                标签
              </label>
              <TagInput
                tags={metadata.tags || []}
                onChange={(tags) => handleMetadataChange('tags', tags)}
                placeholder="添加标签"
                disabled={isUploading}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  隐私设置
                </label>
                <Select
                  value={metadata.privacy}
                  onChange={(e) => handleMetadataChange('privacy', e.target.value)}
                  disabled={isUploading}
                >
                  <option value="public">公开</option>
                  <option value="unlisted">不公开</option>
                  <option value="private">私密</option>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  分类
                </label>
                <Select
                  value={metadata.category || '22'}
                  onChange={(e) => handleMetadataChange('category', e.target.value)}
                  disabled={isUploading}
                >
                  <option value="22">People & Blogs</option>
                  <option value="24">Entertainment</option>
                  <option value="10">Music</option>
                  <option value="20">Gaming</option>
                  <option value="26">Howto & Style</option>
                </Select>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedVideo && (
        <div className="flex justify-end space-x-3">
          <Button
            variant="outline"
            onClick={() => handleUpload('youtube')}
            disabled={isUploading}
            className="flex items-center space-x-2"
          >
            <Video className="h-4 w-4" />
            <span>上传到 YouTube</span>
          </Button>
          
          <Button
            variant="outline"
            onClick={() => handleUpload('tiktok')}
            disabled={isUploading}
            className="flex items-center space-x-2"
          >
            <Video className="h-4 w-4" />
            <span>上传到 TikTok</span>
          </Button>
        </div>
      )}
    </div>
  )
}