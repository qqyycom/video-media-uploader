'use client'

import React from 'react'
import { Upload, CheckCircle, XCircle, Clock, RotateCcw } from 'lucide-react'
import { UploadProgress } from '@/app/types'
import { Button } from '@/app/components/common/Button'
import { Card, CardContent } from '@/app/components/common/Card'
import { Progress } from '@/app/components/common/Progress'

interface UploadProgressListProps {
  uploads: UploadProgress[]
  onCancel: (uploadId: string) => void
  onRetry: (uploadId: string) => void
}

export function UploadProgressList({
  uploads,
  onCancel,
  onRetry,
}: UploadProgressListProps) {
  if (uploads.length === 0) {
    return null
  }

  const getStatusIcon = (status: UploadProgress['status']) => {
    switch (status) {
      case 'uploading':
      case 'processing':
        return <Upload className="h-5 w-5 animate-pulse" />
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-gray-500" />
      default:
        return <Clock className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusColor = (status: UploadProgress['status']) => {
    switch (status) {
      case 'uploading':
      case 'processing':
        return 'text-blue-600'
      case 'completed':
        return 'text-green-600'
      case 'failed':
        return 'text-red-600'
      case 'cancelled':
        return 'text-gray-600'
      default:
        return 'text-gray-600'
    }
  }

  const getStatusText = (status: UploadProgress['status']) => {
    switch (status) {
      case 'pending':
        return '等待上传'
      case 'uploading':
        return '上传中'
      case 'processing':
        return '处理中'
      case 'completed':
        return '上传完成'
      case 'failed':
        return '上传失败'
      case 'cancelled':
        return '已取消'
      default:
        return '未知状态'
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">上传进度</h3>
      
      {uploads.map((upload) => (
        <Card key={upload.id} className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1">
              <div className={getStatusColor(upload.status)}>
                {getStatusIcon(upload.status)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">
                      {upload.platform === 'youtube' ? 'YouTube' : 'TikTok'}
                    </p>
                    <p className={`text-sm ${getStatusColor(upload.status)}`}>
                      {getStatusText(upload.status)}
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {upload.status === 'uploading' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onCancel(upload.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        取消
                      </Button>
                    )}
                    
                    {upload.status === 'failed' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRetry(upload.id)}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        重试
                      </Button>
                    )}
                  </div>
                </div>
                
                {(upload.status === 'uploading' || upload.status === 'processing') && (
                  <div className="mt-2">
                    <Progress value={upload.progress} className="h-2" />
                    <div className="flex justify-between text-xs text-gray-600 mt-1">
                      <span>{upload.progress}%</span>
                      <span>{upload.message}</span>
                    </div>
                  </div>
                )}
                
                {upload.videoUrl && upload.status === 'completed' && (
                  <p className="text-sm text-blue-600 mt-2">
                    <a
                      href={upload.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      查看视频
                    </a>
                  </p>
                )}
                
                {upload.error && (
                  <p className="text-sm text-red-600 mt-2">{upload.error}</p>
                )}
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}