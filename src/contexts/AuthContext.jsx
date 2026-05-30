import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { initFirebase, getFirebaseAuth, signInGoogle, signOutFirebase } from '../lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { connectDiscord, fetchDiscordUser, disconnectDiscord, getStoredDiscord, storeDiscord } from '../lib/discord'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [discord, setDiscord] = useState(getStoredDiscord())

  useEffect(() => {
    initFirebase()
    const auth = getFirebaseAuth()
    if (auth) {
      const unsub = onAuthStateChanged(auth, (u) => {
        setUser(u)
        setLoading(false)
      })
      return unsub
    }
    setLoading(false)
  }, [])

  const signInGoogle = useCallback(async () => {
    const u = await signInGoogle()
    setUser(u)
    return u
  }, [])

  const signOut = useCallback(async () => {
    await signOutFirebase()
    setUser(null)
  }, [])

  const linkDiscord = useCallback(async () => {
    const data = await connectDiscord()
    const token = data.access_token || data.accessToken
    const discordUser = await fetchDiscordUser(token)
    const entry = { accessToken: token, user: discordUser }
    storeDiscord(token, discordUser)
    setDiscord(entry)
    return entry
  }, [])

  const unlinkDiscord = useCallback(() => {
    disconnectDiscord()
    setDiscord(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, signInGoogle, signOut, discord, linkDiscord, unlinkDiscord }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
