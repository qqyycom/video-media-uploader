'use client'

import React, { useState } from 'react'
import { VideoFile, UploadMetadata } from '@/app/types'
import { Button } from '@/app/components/common/Button'
import { Input } from '@/app/components/common/Input'
import { Textarea } from '@/app/components/common/Textarea'
import { Select } from '@/app/components/common/Select'
import { TagInput } from '@/app/components/common/TagInput'
import { Youtube } from 'lucide-react'

interface YouTubeUploadFormProps {
  selectedVideo: VideoFile | null
  metadata: UploadMetadata
  onMetadataChange: (metadata: UploadMetadata) => void
  onUpload: () => void
  isUploading: boolean
  isConnected: boolean
}

export function YouTubeUploadForm({
  selectedVideo,
  metadata,
  onMetadataChange,
  onUpload,
  isUploading,
  isConnected,
}: YouTubeUploadFormProps) {
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleMetadataChange = (field: keyof UploadMetadata, value: string | string[] | undefined) => {
    const newMetadata = { ...metadata, [field]: value }
    onMetadataChange(newMetadata)
    
    // Clear error when user starts typing
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
      newErrors.title = 'YouTube标题不能超过100个字符'
    }

    if (metadata.description && metadata.description.length > 5000) {
      newErrors.description = 'YouTube描述不能超过5000个字符'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleUpload = () => {
    if (validateMetadata()) {
      onUpload()
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            标题 * <span className="text-xs text-gray-500">(最多100字符)</span>
          </label>
          <Input
            value={metadata.title}
            onChange={(e) => handleMetadataChange('title', e.target.value)}
            placeholder="输入YouTube视频标题"
            maxLength={100}
            error={errors.title}
            disabled={isUploading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            描述 <span className="text-xs text-gray-500">(最多5000字符)</span>
          </label>
          <Textarea
            value={metadata.description || ''}
            onChange={(e) => handleMetadataChange('description', e.target.value)}
            placeholder="输入YouTube视频描述"
            maxLength={5000}
            rows={4}
            error={errors.description}
            disabled={isUploading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            标签 <span className="text-xs text-gray-500">(帮助用户发现您的视频)</span>
          </label>
          <TagInput
            tags={metadata.tags || []}
            onChange={(tags) => handleMetadataChange('tags', tags)}
            placeholder="添加标签，按回车键确认"
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
              <option value="unlisted">不公开(有链接的人可以看)</option>
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
              <option value="1">Film & Animation</option>
              <option value="2">Autos & Vehicles</option>
              <option value="10">Music</option>
              <option value="15">Pets & Animals</option>
              <option value="17">Sports</option>
              <option value="19">Travel & Events</option>
              <option value="20">Gaming</option>
              <option value="22">People & Blogs</option>
              <option value="23">Comedy</option>
              <option value="24">Entertainment</option>
              <option value="25">News & Politics</option>
              <option value="26">Howto & Style</option>
              <option value="27">Education</option>
              <option value="28">Science & Technology</option>
            </Select>
          </div>
        </div>
      </div>

      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Youtube className="h-5 w-5 text-red-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-red-800">YouTube上传要求</h4>
            <ul className="mt-2 text-sm text-red-700 space-y-1">
              <li>• 支持格式：MP4, MOV, AVI, FLV, WMV, WebM</li>
              <li>• 最大文件大小：128GB</li>
              <li>• 最长时长：12小时</li>
              <li>• 推荐分辨率：1080p或更高</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={handleUpload}
          disabled={!selectedVideo || !isConnected || isUploading}
          className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white"
        >
          <Youtube className="h-4 w-4" />
          <span>
            {!isConnected ? '请先连接YouTube账号' : 
             isUploading ? '上传中...' : 
             '上传到YouTube'}
          </span>
        </Button>
      </div>
    </div>
  )
}