import { useState, useCallback } from 'react'
import { VideoFile, UploadMetadata, UploadProgress } from '@/app/types'
import { generateId } from '@/app/lib/utils'

export function useVideoUploads() {
  const [uploads, setUploads] = useState<UploadProgress[]>([])
  const [selectedVideo, setSelectedVideo] = useState<VideoFile | null>(null)
  const [metadata, setMetadata] = useState<UploadMetadata>({
    title: '',
    description: '',
    tags: [],
    privacy: 'private',
    category: '22',
  })

  const addUpload = useCallback((
    platform: 'youtube' | 'tiktok',
    video: VideoFile,
    metadata: UploadMetadata
  ) => {
    const upload: UploadProgress = {
      id: generateId(),
      platform,
      status: 'pending',
      progress: 0,
      startedAt: new Date(),
    }

    setUploads(prev => [...prev, upload])
    return upload.id
  }, [])

  const updateUpload = useCallback((uploadId: string, updates: Partial<UploadProgress>) => {
    setUploads(prev => 
      prev.map(upload => 
        upload.id === uploadId ? { ...upload, ...updates } : upload
      )
    )
  }, [])

  const cancelUpload = useCallback((uploadId: string) => {
    updateUpload(uploadId, {
      status: 'cancelled',
      completedAt: new Date(),
    })
  }, [updateUpload])

  const retryUpload = useCallback((uploadId: string) => {
    updateUpload(uploadId, {
      status: 'pending',
      progress: 0,
      error: undefined,
      completedAt: undefined,
    })
  }, [updateUpload])

  const clearUploads = useCallback(() => {
    setUploads([])
  }, [])

  const clearCompleted = useCallback(() => {
    setUploads(prev => prev.filter(upload => 
      upload.status !== 'completed'
    ))
  }, [])

  return {
    uploads,
    selectedVideo,
    metadata,
    setSelectedVideo,
    setMetadata,
    addUpload,
    updateUpload,
    cancelUpload,
    retryUpload,
    clearUploads,
    clearCompleted,
  }
}