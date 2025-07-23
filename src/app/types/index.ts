export interface User {
  id: string;
  email?: string;
  name?: string;
  avatar?: string;
}

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

export interface UploadMetadata {
  title: string;
  description?: string;
  tags?: string[];
  privacy: 'public' | 'unlisted' | 'private' | 'followers';
  category?: string;
  // TikTok specific options
  disableComment?: boolean;
  disableDuet?: boolean;
  disableStitch?: boolean;
}

export interface TikTokUploadData {
  publish_id: string;
  upload_url: string;
  video_size: number;
  chunk_size: number;
  total_chunk_count: number;
}

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

export interface AuthState {
  user: User | null;
  youtubeAccount: YouTubeAccount | null;
  tiktokAccount: TikTokAccount | null;
  isLoading: boolean;
  error: string | null;
}

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