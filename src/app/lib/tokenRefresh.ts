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

export const refreshYouTubeToken = async (
  refreshToken: string
): Promise<TokenRefreshResult> => {
  try {
    const response = await fetch('/api/youtube/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.error || 'Failed to refresh YouTube token',
      };
    }

    const data = await response.json();
    return {
      success: true,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      expiresAt: data.expiresAt,
    };
  } catch (error) {
    return {
      success: false,
      error: 'Network error during YouTube token refresh',
    };
  }
};

export const refreshTikTokToken = async (
  refreshToken: string
): Promise<TokenRefreshResult> => {
  try {
    const response = await fetch('/api/tiktok/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.error || 'Failed to refresh TikTok token',
      };
    }

    const data = await response.json();
    return {
      success: true,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      expiresAt: data.expiresAt,
    };
  } catch (error) {
    return {
      success: false,
      error: 'Network error during TikTok token refresh',
    };
  }
};

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