import { useState, useEffect, useRef, useCallback } from 'react'
import { getArtistName } from '../utils'

const BRIDGE_PORT = import.meta.env.BRIDGE_PORT || '6474'
const WS_URL = `ws://localhost:${BRIDGE_PORT}`
const IS_LOCAL = typeof window !== 'undefined' && (
  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
)

export default function useDiscordPresence(track, playing) {
  const [bridgeConnected, setBridgeConnected] = useState(false)
  const [discordConnected, setDiscordConnected] = useState(false)
  const wsRef = useRef(null)
  const reconnectTimer = useRef(null)
  const trackRef = useRef(track)
  const playingRef = useRef(playing)

  trackRef.current = track
  playingRef.current = playing

  const sendPresence = useCallback(() => {
    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN) return
    const t = trackRef.current
    const p = playingRef.current

    if (!t || !p) {
      ws.send(JSON.stringify({ type: 'clear' }))
      return
    }

    const artist = getArtistName(t)
    const thumb = t.thumbnail || `https://i.ytimg.com/vi/${t.videoId}/maxresdefault.jpg`

    ws.send(JSON.stringify({
      type: 'presence',
      details: t.title?.slice(0, 128) || 'Unknown track',
      state: artist ? `by ${artist}`.slice(0, 128) : '',
      largeImageKey: thumb,
      largeImageText: `${t.title || ''}${artist ? ` — ${artist}` : ''}`,
      smallImageKey: p ? 'play' : 'pause',
      smallImageText: p ? 'playing' : 'paused',
      startTimestamp: p ? Date.now() : undefined,
    }))
  }, [])

  useEffect(() => {
    if (!IS_LOCAL) return

    function connect() {
      if (wsRef.current?.readyState === WebSocket.OPEN) return

      let ws
      try {
        ws = new WebSocket(WS_URL)
      } catch {
        return
      }

      ws.onopen = () => {
        setBridgeConnected(true)
        wsRef.current = ws
        sendPresence()
      }

      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data)
          if (msg.type === 'connected') {
            setDiscordConnected(!!msg.discord)
          }
          if (msg.type === 'pong') {
            setDiscordConnected(!!msg.connected)
          }
        } catch {}
      }

      ws.onclose = () => {
        setBridgeConnected(false)
        setDiscordConnected(false)
        wsRef.current = null
        reconnectTimer.current = setTimeout(connect, 5000)
      }

      ws.onerror = () => {
        ws.close()
      }
    }

    connect()
    return () => {
      clearTimeout(reconnectTimer.current)
      if (wsRef.current) wsRef.current.close()
    }
  }, [sendPresence])

  useEffect(() => {
    sendPresence()
  }, [track, playing, sendPresence])

  return { bridgeConnected, discordConnected }
}
