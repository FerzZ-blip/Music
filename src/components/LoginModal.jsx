import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import {
  GoogleLogo,
  DiscordLogo,
  SignOut,
  LinkBreak,
  X,
  User,
} from '@phosphor-icons/react'

export default function LoginModal({ onClose }) {
  const { user, signInGoogle, signOut, loading: authLoading, discord, linkDiscord, unlinkDiscord } = useAuth()
  const [googleLoading, setGoogleLoading] = useState(false)
  const [discordLoading, setDiscordLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true)
    setError(null)
    try {
      await signInGoogle()
    } catch (e) {
      if (e.code === 'auth/popup-closed-by-user') return
      setError('Gagal masuk dengan Google. Coba lagi.')
    } finally {
      setGoogleLoading(false)
    }
  }

  const handleDiscordLink = async () => {
    setDiscordLoading(true)
    setError(null)
    try {
      await linkDiscord()
    } catch (e) {
      if (e.message === 'Popup closed') return
      setError('Gagal menghubungkan Discord. Pastikan redirect URI sudah sesuai di Discord Developer Portal.')
    } finally {
      setDiscordLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-warm-950/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-warm-50 dark:bg-warm-900 rounded-3xl p-6 w-full max-w-sm mx-4 shadow-xl border border-warm-200/60 dark:border-warm-800/60" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <User size={18} className="text-warm-500" />
            <span className="text-sm font-semibold text-warm-800 dark:text-warm-200">account</span>
          </div>
          <button onClick={onClose} className="text-warm-400 hover:text-warm-600 dark:hover:text-warm-300 transition-colors">
            <X size={18} />
          </button>
        </div>

        {authLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-rose-300 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {error && (
          <div className="mb-4 px-3 py-2 rounded-xl bg-rose-100/60 dark:bg-rose-900/30 text-xs text-rose-600 dark:text-rose-400">
            {error}
          </div>
        )}

        {!authLoading && (
          <div className="space-y-3">
            {user ? (
              <div className="flex items-center justify-between p-3 rounded-2xl bg-white/60 dark:bg-warm-950/60 border border-warm-200/60 dark:border-warm-800/40">
                <div className="flex items-center gap-3 min-w-0">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="" className="w-9 h-9 rounded-full shrink-0" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-warm-200 dark:bg-warm-800 flex items-center justify-center shrink-0">
                      <GoogleLogo size={16} className="text-warm-500" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-warm-800 dark:text-warm-200 truncate">{user.displayName || 'Google user'}</p>
                    <p className="text-[11px] text-warm-400 truncate">{user.email}</p>
                  </div>
                </div>
                <button onClick={signOut} className="text-warm-400 hover:text-warm-600 dark:hover:text-warm-300 transition-colors shrink-0 ml-2" title="sign out">
                  <SignOut size={16} />
                </button>
              </div>
            ) : (
              <button
                onClick={handleGoogleSignIn}
                disabled={googleLoading}
                className="w-full flex items-center gap-3 p-3 rounded-2xl bg-white/60 dark:bg-warm-950/60 border border-warm-200/60 dark:border-warm-800/40 hover:bg-white dark:hover:bg-warm-950 transition-all group disabled:opacity-50"
              >
                <div className="w-9 h-9 rounded-full bg-warm-200 dark:bg-warm-800 flex items-center justify-center shrink-0 group-hover:bg-warm-300 dark:group-hover:bg-warm-700 transition-colors">
                  {googleLoading ? (
                    <div className="w-4 h-4 border-2 border-warm-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <GoogleLogo size={16} className="text-warm-600 dark:text-warm-300" />
                  )}
                </div>
                <span className="text-sm font-medium text-warm-700 dark:text-warm-300">
                  {googleLoading ? 'signing in...' : 'sign in with Google'}
                </span>
              </button>
            )}

            {discord ? (
              <div className="flex items-center justify-between p-3 rounded-2xl bg-white/60 dark:bg-warm-950/60 border border-warm-200/60 dark:border-warm-800/40">
                <div className="flex items-center gap-3 min-w-0">
                  {discord.user.avatar ? (
                    <img
                      src={`https://cdn.discordapp.com/avatars/${discord.user.id}/${discord.user.avatar}.webp?size=64`}
                      alt=""
                      className="w-9 h-9 rounded-full shrink-0"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-warm-200 dark:bg-warm-800 flex items-center justify-center shrink-0">
                      <DiscordLogo size={16} className="text-warm-500" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-warm-800 dark:text-warm-200 truncate">{discord.user.global_name || discord.user.username}</p>
                    <p className="text-[11px] text-warm-400 truncate">@{discord.user.username}</p>
                  </div>
                </div>
                <button onClick={unlinkDiscord} className="text-warm-400 hover:text-warm-600 dark:hover:text-warm-300 transition-colors shrink-0 ml-2" title="disconnect Discord">
                  <LinkBreak size={16} />
                </button>
              </div>
            ) : (
              <button
                onClick={handleDiscordLink}
                disabled={discordLoading}
                className="w-full flex items-center gap-3 p-3 rounded-2xl bg-white/60 dark:bg-warm-950/60 border border-warm-200/60 dark:border-warm-800/40 hover:bg-white dark:hover:bg-warm-950 transition-all group disabled:opacity-50"
              >
                <div className="w-9 h-9 rounded-full bg-warm-200 dark:bg-warm-800 flex items-center justify-center shrink-0 group-hover:bg-warm-300 dark:group-hover:bg-warm-700 transition-colors">
                  {discordLoading ? (
                    <div className="w-4 h-4 border-2 border-warm-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <DiscordLogo size={16} className="text-warm-600 dark:text-warm-300" />
                  )}
                </div>
                <span className="text-sm font-medium text-warm-700 dark:text-warm-300">
                  {discordLoading ? 'connecting...' : 'connect Discord'}
                </span>
              </button>
            )}

            <p className="text-[10px] text-warm-400 dark:text-warm-500 text-center pt-1">
              {!user && !discord && 'sign in to save tracks and connect Discord'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
