"use client";

import React, { useState } from "react";
import { Youtube, CheckCircle, AlertCircle, User, Unlink } from "lucide-react";
import { Button } from "@/app/components/common/Button";
import { useAuth } from "@/app/context/AuthContext";
import { YouTubeAccount, TikTokAccount } from "@/app/types";

interface AccountBindingProps {
  onConnectYouTube: () => void;
  onDisconnectYouTube: () => void;
  onConnectTikTok: () => void;
  onDisconnectTikTok: () => void;
}

interface PlatformRowProps {
  platform: 'youtube' | 'tiktok';
  account: YouTubeAccount | TikTokAccount | null;
  onConnect: () => void;
  onDisconnect: () => void;
  isConnecting?: boolean;
}

function PlatformRow({ platform, account, onConnect, onDisconnect, isConnecting }: PlatformRowProps) {
  const platformConfig = {
    youtube: {
      name: 'YouTube',
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      icon: <Youtube className="w-4 h-4" />
    },
    tiktok: {
      name: 'TikTok',
      color: 'text-gray-800',
      bgColor: 'bg-gray-100',
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M19.321,5.562a5.122,5.122,0,0,1-.443-.258,6.228,6.228,0,0,1-1.137-.966A7.726,7.726,0,0,1,16.644,2.5H13.5V15.436a3.814,3.814,0,1,1-2.532-3.607V8.67a6.987,6.987,0,1,0,5.353,6.766V9.982a9.706,9.706,0,0,0,3,.915V7.743A5.124,5.124,0,0,1,19.321,5.562Z"/>
        </svg>
      )
    }
  };

  const config = platformConfig[platform];
  
  // Get account name safely
  const getAccountName = () => {
    if (!account) return '';
    if (platform === 'youtube') {
      return (account as YouTubeAccount).title || '';
    } else {
      const tiktokAccount = account as TikTokAccount;
      return tiktokAccount.displayName || tiktokAccount.username || '';
    }
  };

  return (
    <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
      {/* Left: Platform Info */}
      <div className="flex items-center space-x-3">
        <div className={`w-8 h-8 ${config.bgColor} ${config.color} rounded-lg flex items-center justify-center`}>
          {config.icon}
        </div>
        <div className="min-w-0">
          <div className="flex items-center space-x-2">
            <span className="font-medium text-gray-900">{config.name}</span>
            {account ? (
              <div className="flex items-center space-x-1 text-xs">
                <CheckCircle className="w-3 h-3 text-green-600" />
                <span className="text-green-600">已连接</span>
              </div>
            ) : (
              <div className="flex items-center space-x-1 text-xs">
                <AlertCircle className="w-3 h-3 text-gray-400" />
                <span className="text-gray-400">未连接</span>
              </div>
            )}
          </div>
          {account && (
            <div className="text-xs text-gray-500 truncate max-w-32">
              {getAccountName()}
            </div>
          )}
        </div>
      </div>

      {/* Right: Action Button */}
      <div className="flex-shrink-0">
        {account ? (
          <Button
            variant="outline"
            size="sm"
            onClick={onDisconnect}
            className="text-xs px-2 py-1 h-7 text-red-600 border-red-200 hover:bg-red-50"
          >
            <Unlink className="w-3 h-3 mr-1" />
            断开
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={onConnect}
            disabled={isConnecting}
            className={`text-xs px-3 py-1 h-7 ${config.color === 'text-red-600' ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-800 hover:bg-gray-900'} text-white`}
          >
            {isConnecting ? (
              <>
                <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin mr-1"></div>
                连接中
              </>
            ) : (
              <>
                <User className="w-3 h-3 mr-1" />
                连接
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

export function AccountBinding({
  onConnectYouTube,
  onDisconnectYouTube,
  onConnectTikTok,
  onDisconnectTikTok,
}: AccountBindingProps) {
  const { youtubeAccount, tiktokAccount } = useAuth();
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);

  const handleConnect = (platform: 'youtube' | 'tiktok', connectFn: () => void) => {
    setConnectingPlatform(platform);
    try {
      connectFn();
    } finally {
      setTimeout(() => setConnectingPlatform(null), 2000);
    }
  };

  const connectedCount = (youtubeAccount ? 1 : 0) + (tiktokAccount ? 1 : 0);

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="text-center">
        <div className="text-2xl font-bold text-gray-900">{connectedCount}/2</div>
        <div className="text-xs text-gray-500">已连接平台</div>
      </div>

      {/* Platform List */}
      <div className="space-y-3">
        <PlatformRow
          platform="youtube"
          account={youtubeAccount}
          onConnect={() => handleConnect('youtube', onConnectYouTube)}
          onDisconnect={onDisconnectYouTube}
          isConnecting={connectingPlatform === 'youtube'}
        />
        <PlatformRow
          platform="tiktok"
          account={tiktokAccount}
          onConnect={() => handleConnect('tiktok', onConnectTikTok)}
          onDisconnect={onDisconnectTikTok}
          isConnecting={connectingPlatform === 'tiktok'}
        />
      </div>

      {/* Status Message */}
      {connectedCount > 0 && (
        <div className="text-center p-2 bg-green-50 rounded-lg border border-green-200">
          <div className="text-xs text-green-700">
            ✅ 可以开始上传视频
          </div>
        </div>
      )}
    </div>
  );
}
