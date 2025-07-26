/**
 * 工具函数集合
 * 提供文件大小格式化、时长格式化、视频验证等常用功能
 */

import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * 合并Tailwind CSS类名的工具函数
 * 自动处理冲突的类名
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 格式化文件大小
 * @param bytes 文件大小（字节）
 * @returns 格式化后的文件大小字符串
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

/**
 * 格式化视频时长
 * @param seconds 视频时长（秒）
 * @returns MM:SS格式的时长字符串
 */
export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

/**
 * 验证视频文件
 * @param file 要验证的文件
 * @returns 验证结果和错误信息
 */
export function validateVideoFile(file: File): { valid: boolean; error?: string } {
  const validTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/avi']
  const maxSize = 128 * 1024 * 1024 * 1024 // 128GB for YouTube
  
  if (!validTypes.includes(file.type)) {
    return { valid: false, error: '不支持的文件格式。请上传 MP4、MOV 或 AVI 格式的视频。' }
  }
  
  if (file.size > maxSize) {
    return { valid: false, error: '文件过大。YouTube 最大支持 128GB，TikTok 最大支持 10GB。' }
  }
  
  return { valid: true }
}

/**
 * 生成唯一ID
 * @returns 随机生成的唯一ID字符串
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

/**
 * 加密令牌（简单加密，生产环境请使用专业加密）
 * @param token 要加密的令牌
 * @returns 加密后的令牌
 */
export function encryptToken(token: string): string {
  // Simple encryption for demo - in production use proper encryption
  return btoa(token + process.env.NEXT_PUBLIC_SECRET_KEY || 'default-secret')
}

/**
 * 解密令牌（简单解密，生产环境请使用专业加密）
 * @param encryptedToken 要解密的令牌
 * @returns 解密后的令牌
 */
export function decryptToken(encryptedToken: string): string {
  // Simple decryption for demo - in production use proper encryption
  try {
    const decoded = atob(encryptedToken)
    return decoded.replace(process.env.NEXT_PUBLIC_SECRET_KEY || 'default-secret', '')
  } catch {
    return ''
  }
}

export const youtubeCategories = [
  { value: '1', label: 'Film & Animation' },
  { value: '2', label: 'Autos & Vehicles' },
  { value: '10', label: 'Music' },
  { value: '15', label: 'Pets & Animals' },
  { value: '17', label: 'Sports' },
  { value: '19', label: 'Travel & Events' },
  { value: '20', label: 'Gaming' },
  { value: '22', label: 'People & Blogs' },
  { value: '23', label: 'Comedy' },
  { value: '24', label: 'Entertainment' },
  { value: '25', label: 'News & Politics' },
  { value: '26', label: 'Howto & Style' },
  { value: '27', label: 'Education' },
  { value: '28', label: 'Science & Technology' },
  { value: '29', label: 'Nonprofits & Activism' },
]

export const tiktokCategories = [
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'education', label: 'Education' },
  { value: 'comedy', label: 'Comedy' },
  { value: 'dance', label: 'Dance' },
  { value: 'music', label: 'Music' },
  { value: 'sports', label: 'Sports' },
  { value: 'food', label: 'Food & Drink' },
  { value: 'beauty', label: 'Beauty & Fashion' },
  { value: 'travel', label: 'Travel' },
  { value: 'gaming', label: 'Gaming' },
]