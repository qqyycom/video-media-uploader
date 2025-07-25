'use client'

import React, { useState } from 'react'
import { VideoFile, UploadMetadata } from '@/app/types'
import { Button } from '@/app/components/common/Button'
import { Input } from '@/app/components/common/Input'
import { Select } from '@/app/components/common/Select'
import { Music } from 'lucide-react'

interface TikTokUploadFormProps {
  selectedVideo: VideoFile | null
  metadata: UploadMetadata
  onMetadataChange: (metadata: UploadMetadata) => void
  onUpload: () => void
  isUploading: boolean
  isConnected: boolean
}

export function TikTokUploadForm({
  selectedVideo,
  metadata,
  onMetadataChange,
  onUpload,
  isUploading,
  isConnected,
}: TikTokUploadFormProps) {
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleMetadataChange = (field: keyof UploadMetadata, value: string | boolean | undefined) => {
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

    if (metadata.title.length > 2200) {
      newErrors.title = 'TikTok标题不能超过2200个字符'
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
            标题/文案 * <span className="text-xs text-gray-500">(最多2200字符)</span>
          </label>
          <Input
            value={metadata.title}
            onChange={(e) => handleMetadataChange('title', e.target.value)}
            placeholder="输入TikTok视频标题或文案"
            maxLength={2200}
            error={errors.title}
            disabled={isUploading}
          />
          <p className="text-xs text-gray-500 mt-1">
            支持 #话题标签 和 @用户提及
          </p>
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
              <option value="followers">仅粉丝</option>
              <option value="unlisted">朋友</option>
              <option value="private">仅自己</option>
            </Select>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">互动设置</h4>
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={!metadata.disableComment}
                onChange={(e) => handleMetadataChange('disableComment', !e.target.checked)}
                disabled={isUploading}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">允许评论</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={!metadata.disableDuet}
                onChange={(e) => handleMetadataChange('disableDuet', !e.target.checked)}
                disabled={isUploading}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">允许合拍</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={!metadata.disableStitch}
                onChange={(e) => handleMetadataChange('disableStitch', !e.target.checked)}
                disabled={isUploading}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">允许拼接</span>
            </label>
          </div>
        </div>
      </div>

      <div className="bg-black bg-opacity-5 border border-gray-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Music className="h-5 w-5 text-black mt-0.5" />
          <div>
            <h4 className="font-medium text-gray-800">TikTok上传要求</h4>
            <ul className="mt-2 text-sm text-gray-700 space-y-1">
              <li>• 支持格式：MP4, MOV, MPEG, 3GP, AVI</li>
              <li>• 最大文件大小：10GB</li>
              <li>• 推荐比例：9:16 (竖屏)</li>
              <li>• 推荐分辨率：1080x1920</li>
              <li>• 时长：15秒-10分钟</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="h-5 w-5 text-yellow-600 mt-0.5">⚠️</div>
          <div>
            <h4 className="font-medium text-yellow-800">重要提示</h4>
            <p className="mt-1 text-sm text-yellow-700">
              未经审核的开发者账号上传的内容将被限制为私密查看模式。
              如需公开发布，请确保应用已通过TikTok官方审核。
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={handleUpload}
          disabled={!selectedVideo || !isConnected || isUploading}
          className="flex items-center space-x-2 bg-black hover:bg-gray-800 text-white"
        >
          <Music className="h-4 w-4" />
          <span>
            {!isConnected ? '请先连接TikTok账号' : 
             isUploading ? '上传中...' : 
             '上传到TikTok'}
          </span>
        </Button>
      </div>
    </div>
  )
}