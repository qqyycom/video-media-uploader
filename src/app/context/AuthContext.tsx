/**
 * 认证上下文提供器
 * 管理应用的全局认证状态，包括用户登录、平台账户连接等
 */

"use client";

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  ReactNode,
} from "react";
import {
  AuthContextType,
  AuthState,
  User,
  YouTubeAccount,
  TikTokAccount,
} from "@/app/types";

interface AuthAction {
  type:
    | "SET_LOADING"
    | "SET_ERROR"
    | "SET_USER"
    | "SET_YOUTUBE_ACCOUNT"
    | "SET_TIKTOK_ACCOUNT"
    | "CLEAR_YOUTUBE_ACCOUNT"
    | "CLEAR_TIKTOK_ACCOUNT"
    | "LOGOUT";
  payload?: unknown;
}

const initialState: AuthState = {
  user: null,
  youtubeAccount: null,
  tiktokAccount: null,
  isLoading: true,
  error: null,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, isLoading: action.payload as boolean };
    case "SET_ERROR":
      return {
        ...state,
        error: action.payload as string | null,
        isLoading: false,
      };
    case "SET_USER":
      return {
        ...state,
        user: action.payload as User | null,
        isLoading: false,
      };
    case "SET_YOUTUBE_ACCOUNT":
      return {
        ...state,
        youtubeAccount: action.payload as YouTubeAccount | null,
      };
    case "SET_TIKTOK_ACCOUNT":
      return {
        ...state,
        tiktokAccount: action.payload as TikTokAccount | null,
      };
    case "CLEAR_YOUTUBE_ACCOUNT":
      return { ...state, youtubeAccount: null };
    case "CLEAR_TIKTOK_ACCOUNT":
      return { ...state, tiktokAccount: null };
    case "LOGOUT":
      return { ...initialState, isLoading: false };
    default:
      return state;
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });

      // Load user from localStorage
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const user: User = JSON.parse(userStr);
        dispatch({ type: "SET_USER", payload: user });
      }

      // Load connected accounts and force refresh
      await refreshAccountData();
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: "Failed to initialize auth" });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  const refreshAccountData = async () => {
    try {
      // Load YouTube account
      const youtubeStr = localStorage.getItem("youtube_account");
      if (youtubeStr) {
        const youtubeAccount: YouTubeAccount = JSON.parse(youtubeStr);
        document.cookie = `youtube_account=${JSON.stringify(youtubeAccount)}`;
        dispatch({ type: "SET_YOUTUBE_ACCOUNT", payload: youtubeAccount });
      } else {
        dispatch({ type: "SET_YOUTUBE_ACCOUNT", payload: null });
      }

      // Load TikTok account
      const tiktokStr = localStorage.getItem("tiktok_account");
      if (tiktokStr) {
        const tiktokAccount: TikTokAccount = JSON.parse(tiktokStr);
        document.cookie = `tiktok_account=${JSON.stringify(tiktokAccount)}`;
        dispatch({ type: "SET_TIKTOK_ACCOUNT", payload: tiktokAccount });
      } else {
        dispatch({ type: "SET_TIKTOK_ACCOUNT", payload: null });
      }
    } catch (error) {
      console.error("Failed to refresh account data:", error);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });

      // Mock login - replace with actual Supabase auth
      const user: User = {
        id: "1",
        email,
        name: email.split("@")[0],
      };

      localStorage.setItem("user", JSON.stringify(user));
      dispatch({ type: "SET_USER", payload: user });
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: "Login failed" });
      throw error;
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  const logout = async () => {
    try {
      localStorage.removeItem("user");
      localStorage.removeItem("youtube_account");
      localStorage.removeItem("tiktok_account");
      dispatch({ type: "LOGOUT" });
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: "Logout failed" });
    }
  };

  const connectYouTube = async () => {
    try {
      const clientId = process.env.NEXT_PUBLIC_YOUTUBE_CLIENT_ID;
      const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/callback/youtube`;

      const scope = [
        "https://www.googleapis.com/auth/youtube.upload",
        "https://www.googleapis.com/auth/youtube.readonly",
      ].join(" ");

      const authUrl =
        `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${clientId}&` +
        `redirect_uri=${redirectUri}&` +
        `response_type=code&` +
        `scope=${encodeURIComponent(scope)}&` +
        `access_type=offline&` +
        `prompt=consent`;

      window.location.href = authUrl;
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: "Failed to connect YouTube" });
    }
  };

  const disconnectYouTube = async () => {
    try {
      localStorage.removeItem("youtube_account");
      dispatch({ type: "CLEAR_YOUTUBE_ACCOUNT" });
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: "Failed to disconnect YouTube" });
    }
  };

  const connectTikTok = async () => {
    try {
      const clientKey = process.env.NEXT_PUBLIC_TIKTOK_CLIENT_KEY;
      const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/callback/tiktok/`;

      const scope = "user.info.basic,video.publish";
      const state = Math.random().toString(36).substring(7);

      const authUrl =
        `https://www.tiktok.com/v2/auth/authorize?` +
        `client_key=${clientKey}&` +
        `scope=${scope}&` +
        `response_type=code&` +
        `redirect_uri=${redirectUri}&` +
        `state=${state}`;

      window.location.href = authUrl;
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: "Failed to connect TikTok" });
    }
  };

  const disconnectTikTok = async () => {
    try {
      localStorage.removeItem("tiktok_account");
      dispatch({ type: "CLEAR_TIKTOK_ACCOUNT" });
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: "Failed to disconnect TikTok" });
    }
  };

  const refreshToken = async (platform: "youtube" | "tiktok") => {
    try {
      console.log(`🔄 Refreshing ${platform} token...`);

      const currentAccount =
        platform === "youtube" ? state.youtubeAccount : state.tiktokAccount;
      if (!currentAccount || !currentAccount.refreshToken) {
        throw new Error(`No refresh token available for ${platform}`);
      }

      const response = await fetch(`/api/${platform}/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          refreshToken: currentAccount.refreshToken,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `Failed to refresh ${platform} token`
        );
      }

      const data = await response.json();

      // Update the account with new token information
      const updatedAccount = {
        ...currentAccount,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken || currentAccount.refreshToken,
        expiresAt: data.expiresAt || Date.now() + data.expiresIn * 1000,
      };

      // Save to localStorage
      localStorage.setItem(
        `${platform}_account`,
        JSON.stringify(updatedAccount)
      );

      // Update state
      if (platform === "youtube") {
        dispatch({ type: "SET_YOUTUBE_ACCOUNT", payload: updatedAccount });
      } else {
        dispatch({ type: "SET_TIKTOK_ACCOUNT", payload: updatedAccount });
      }

      console.log(`✅ ${platform} token refreshed successfully`);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : `Failed to refresh ${platform} token`;
      console.error(`❌ Token refresh failed for ${platform}:`, errorMessage);

      dispatch({
        type: "SET_ERROR",
        payload: errorMessage,
      });

      throw error;
    }
  };

  const value: AuthContextType = {
    ...state,
    login,
    logout,
    connectYouTube,
    disconnectYouTube,
    connectTikTok,
    disconnectTikTok,
    refreshToken,
    refreshAccountData,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
