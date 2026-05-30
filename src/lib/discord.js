const CLIENT_ID = import.meta.env.VITE_DISCORD_CLIENT_ID
const SCOPE = 'identify'

function getAuthURL(state) {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173'
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: origin,
    response_type: 'token',
    scope: SCOPE,
    state,
  })
  return `https://discord.com/api/oauth2/authorize?${params}`
}

export function connectDiscord() {
  return new Promise((resolve, reject) => {
    const state = crypto.randomUUID()
    const url = getAuthURL(state)
    const w = 600, h = 700
    const left = screen.width / 2 - w / 2
    const top = screen.height / 2 - h / 2
    const popup = window.open(
      url,
      'discord-auth',
      `width=${w},height=${h},top=${top},left=${left},popup=1`
    )
    if (!popup) return reject(new Error('Popup blocked'))

    const handler = (e) => {
      if (e.origin !== window.location.origin) return
      try {
        const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data
        if (data.type === 'discord-auth' && data.state === state) {
          window.removeEventListener('message', handler)
          if (data.error) reject(new Error(data.error))
          else resolve(data)
        }
      } catch {}
    }
    window.addEventListener('message', handler)

    const poll = setInterval(() => {
      if (popup.closed) {
        clearInterval(poll)
        window.removeEventListener('message', handler)
        reject(new Error('Popup closed'))
      }
    }, 500)
  })
}

export async function fetchDiscordUser(accessToken) {
  const res = await fetch('https://discord.com/api/v10/users/@me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) throw new Error('Failed to fetch Discord user')
  return res.json()
}

export function disconnectDiscord() {
  localStorage.removeItem('discord_token')
  localStorage.removeItem('discord_user')
}

export function getStoredDiscord() {
  const token = localStorage.getItem('discord_token')
  const user = localStorage.getItem('discord_user')
  if (token && user) {
    try { return { accessToken: token, user: JSON.parse(user) } }
    catch { return null }
  }
  return null
}

export function storeDiscord(accessToken, user) {
  localStorage.setItem('discord_token', accessToken)
  localStorage.setItem('discord_user', JSON.stringify(user))
}
