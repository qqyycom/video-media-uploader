import { useState, useEffect } from 'react'
import { useAuth } from '@/app/context/AuthContext'
import { YouTubeAccount, TikTokAccount } from '@/app/types'

export function useAccountConnections() {
  const { 
    youtubeAccount: authYoutubeAccount, 
    tiktokAccount: authTiktokAccount,
    refreshAccountData 
  } = useAuth()
  const [youtubeAccount, setYouTubeAccount] = useState<YouTubeAccount | null>(null)
  const [tiktokAccount, setTikTokAccount] = useState<TikTokAccount | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Sync with AuthContext data
    setYouTubeAccount(authYoutubeAccount)
    setTikTokAccount(authTiktokAccount)
    setLoading(false)
  }, [authYoutubeAccount, authTiktokAccount])

  const refreshAccounts = async () => {
    setLoading(true)
    try {
      // Use AuthContext method to refresh account data
      await refreshAccountData()
    } catch (error) {
      console.error('Failed to refresh accounts:', error)
    } finally {
      setLoading(false)
    }
  }

  return {
    youtubeAccount,
    tiktokAccount,
    loading,
    refreshAccounts,
  }
}