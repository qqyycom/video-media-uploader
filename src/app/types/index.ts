/**
 * 用户信息接口
 * 用于存储和管理用户的基本信息
 */
export interface User {
  id: string;
  email?: string;
  name?: string;
  avatar?: string;
}

/**
 * YouTube账户信息接口
 * 存储YouTube OAuth认证后的账户详情和访问令牌
 */
export interface YouTubeAccount {
  id: string;
  channelId: string;
  title: string;
  description?: string;
  thumbnail?: string;
  subscriberCount?: number;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
}

/**
 * TikTok账户信息接口
 * 存储TikTok OAuth认证后的账户详情和访问令牌
 */
export interface TikTokAccount {
  id: string;
  openId: string;
  username: string;
  displayName?: string;
  avatar?: string;
  followerCount?: number;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
}

/**
 * 视频文件接口
 * 包含视频文件的元数据和预览信息
 */
export interface VideoFile {
  id: string;
  file: File;
  name: string;
  size: number;
  duration: number;
  resolution: string;
  type: string;
  preview: string;
}

/**
 * 上传元数据接口
 * 包含视频上传所需的标题、描述、标签等信息
 */
export interface UploadMetadata {
  title: string;
  description?: string;
  tags?: string[];
  privacy: 'public' | 'unlisted' | 'private' | 'followers';
  category?: string;
  /** TikTok特有选项 */
  disableComment?: boolean;
  disableDuet?: boolean;
  disableStitch?: boolean;
}

/**
 * TikTok上传数据接口
 * TikTok分块上传时返回的上传信息
 */
export interface TikTokUploadData {
  publish_id: string;
  upload_url: string;
  video_size: number;
  chunk_size: number;
  total_chunk_count: number;
}

/**
 * 上传进度接口
 * 实时跟踪和管理视频上传状态
 */
export interface UploadProgress {
  id: string;
  platform: 'youtube' | 'tiktok';
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  message?: string;
  videoId?: string;
  videoUrl?: string;
  error?: string;
  startedAt: Date;
  completedAt?: Date;
}

/**
 * 认证状态接口
 * 管理应用的整体认证状态
 */
export interface AuthState {
  user: User | null;
  youtubeAccount: YouTubeAccount | null;
  tiktokAccount: TikTokAccount | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * 认证上下文类型接口
 * 提供认证相关的所有操作和状态管理
 */
export interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  connectYouTube: () => Promise<void>;
  disconnectYouTube: () => Promise<void>;
  connectTikTok: () => Promise<void>;
  disconnectTikTok: () => Promise<void>;
  refreshToken: (platform: 'youtube' | 'tiktok') => Promise<void>;
  refreshAccountData: () => Promise<void>;
}