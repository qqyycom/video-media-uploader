import { YouTubeAccount, TikTokAccount } from '../types';

export interface TokenRefreshResult {
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
  error?: string;
}

export const isTokenExpired = (expiresAt: number): boolean => {
  return Date.now() >= expiresAt - 60000; // Refresh 1 minute before expiry
};

/**
 * 带有指数退避和重试限制的token刷新函数
 * @param refreshToken 刷新令牌
 * @param maxRetries 最大重试次数，默认为5
 * @param baseDelay 基础延迟时间（毫秒），默认为1000
 */
export const refreshYouTubeToken = async (
  refreshToken: string,
  maxRetries = 5,
  baseDelay = 1000
): Promise<TokenRefreshResult> => {
  let lastError: string = '';
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch('/api/youtube/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          expiresAt: data.expiresAt,
        };
      }

      const errorData = await response.json();
      lastError = errorData.error || 'Failed to refresh YouTube token';
      
      // 如果是最后一次尝试，直接返回错误
      if (attempt === maxRetries) {
        break;
      }
      
      // 计算指数退避延迟: baseDelay * 2^attempt + 随机数(防止雷群)
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
      console.log(`YouTube token refresh attempt ${attempt + 1} failed, retrying in ${Math.round(delay)}ms...`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      
    } catch (error) {
      lastError = 'Network error during YouTube token refresh';
      
      // 如果是最后一次尝试或网络错误，停止重试
      if (attempt === maxRetries) {
        break;
      }
      
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
      console.log(`YouTube token refresh network error attempt ${attempt + 1}, retrying in ${Math.round(delay)}ms...`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  return {
    success: false,
    error: lastError,
  };
};

/**
 * 带有指数退避和重试限制的TikTok token刷新函数
 * @param refreshToken 刷新令牌
 * @param maxRetries 最大重试次数，默认为5
 * @param baseDelay 基础延迟时间（毫秒），默认为1000
 */
export const refreshTikTokToken = async (
  refreshToken: string,
  maxRetries = 5,
  baseDelay = 1000
): Promise<TokenRefreshResult> => {
  let lastError: string = '';
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch('/api/tiktok/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          expiresAt: data.expiresAt,
        };
      }

      const errorData = await response.json();
      lastError = errorData.error || 'Failed to refresh TikTok token';
      
      // 如果是最后一次尝试，直接返回错误
      if (attempt === maxRetries) {
        break;
      }
      
      // 计算指数退避延迟
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
      console.log(`TikTok token refresh attempt ${attempt + 1} failed, retrying in ${Math.round(delay)}ms...`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      
    } catch (error) {
      lastError = 'Network error during TikTok token refresh';
      
      // 如果是最后一次尝试，停止重试
      if (attempt === maxRetries) {
        break;
      }
      
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
      console.log(`TikTok token refresh network error attempt ${attempt + 1}, retrying in ${Math.round(delay)}ms...`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  return {
    success: false,
    error: lastError,
  };
};

/**
 * 确保YouTube令牌有效，带指数退避重试
 * @param account YouTube账户信息
 * @param updateAccount 更新账户信息的回调函数
 * @returns 有效令牌或null
 */
export const ensureValidYouTubeToken = async (
  account: YouTubeAccount,
  updateAccount: (account: YouTubeAccount) => void
): Promise<string | null> => {
  if (!account.expiresAt || !account.refreshToken) {
    return account.accessToken;
  }

  if (!isTokenExpired(account.expiresAt)) {
    return account.accessToken;
  }

  const result = await refreshYouTubeToken(account.refreshToken);
  if (result.success && result.accessToken) {
    const updatedAccount = {
      ...account,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken || account.refreshToken,
      expiresAt: result.expiresAt || account.expiresAt,
    };
    updateAccount(updatedAccount);
    updateAccountInStorage('youtube', updatedAccount);
    return result.accessToken;
  }

  console.error('Failed to refresh YouTube token:', result.error);
  return null;
};

/**
 * 确保TikTok令牌有效，带指数退避重试
 * @param account TikTok账户信息
 * @param updateAccount 更新账户信息的回调函数
 * @returns 有效令牌或null
 */
export const ensureValidTikTokToken = async (
  account: TikTokAccount,
  updateAccount: (account: TikTokAccount) => void
): Promise<string | null> => {
  if (!account.expiresAt || !account.refreshToken) {
    return account.accessToken;
  }

  if (!isTokenExpired(account.expiresAt)) {
    return account.accessToken;
  }

  const result = await refreshTikTokToken(account.refreshToken);
  if (result.success && result.accessToken) {
    const updatedAccount = {
      ...account,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken || account.refreshToken,
      expiresAt: result.expiresAt || account.expiresAt,
    };
    updateAccount(updatedAccount);
    updateAccountInStorage('tiktok', updatedAccount);
    return result.accessToken;
  }

  console.error('Failed to refresh TikTok token:', result.error);
  return null;
};

/**
 * 指数退避重试工具函数
 * @param operation 需要重试的异步操作
 * @param maxRetries 最大重试次数
 * @param baseDelay 基础延迟时间（毫秒）
 * @returns 操作结果
 */
export const retryWithExponentialBackoff = async <T>(
  operation: () => Promise<T>,
  maxRetries = 5,
  baseDelay = 1000
): Promise<T> => {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // 如果是最后一次尝试，抛出错误
      if (attempt === maxRetries) {
        break;
      }
      
      // 计算指数退避延迟
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
      console.log(`Operation attempt ${attempt + 1} failed, retrying in ${Math.round(delay)}ms...`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError || new Error('Operation failed after maximum retries');
};

const updateAccountInStorage = (
  platform: 'youtube' | 'tiktok',
  account: YouTubeAccount | TikTokAccount
): void => {
  try {
    const cookieName = platform === 'youtube' ? 'youtube_account' : 'tiktok_account';
    document.cookie = `${cookieName}=${JSON.stringify(account)}; path=/; max-age=${60 * 60 * 24 * 7}; secure=${process.env.NODE_ENV === 'production'}; samesite=lax`;
  } catch (error) {
    console.error(`Failed to update ${platform} account in storage:`, error);
  }
};

export const makeAuthenticatedRequest = async (
  url: string,
  options: RequestInit,
  platform: 'youtube' | 'tiktok',
  account: YouTubeAccount | TikTokAccount,
  updateAccount: (account: YouTubeAccount | TikTokAccount) => void
): Promise<Response> => {
  let accessToken: string | null;

  if (platform === 'youtube') {
    accessToken = await ensureValidYouTubeToken(
      account as YouTubeAccount,
      updateAccount as (account: YouTubeAccount) => void
    );
  } else {
    accessToken = await ensureValidTikTokToken(
      account as TikTokAccount,
      updateAccount as (account: TikTokAccount) => void
    );
  }

  if (!accessToken) {
    throw new Error(`Failed to get valid ${platform} access token`);
  }

  const authenticatedOptions: RequestInit = {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${accessToken}`,
    },
  };

  return fetch(url, authenticatedOptions);
};