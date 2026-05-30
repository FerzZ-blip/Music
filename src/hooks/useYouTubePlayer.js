import { useState, useRef, useCallback, useEffect } from 'react';

let apiLoaded = false;
const apiQueue = [];

function loadAPI() {
  if (apiLoaded) return;
  apiLoaded = true;
  window.onYouTubeIframeAPIReady = () => {
    apiQueue.forEach((fn) => fn());
    apiQueue.length = 0;
  };
  const s = document.createElement('script');
  s.src = 'https://www.youtube.com/iframe_api';
  document.head.appendChild(s);
}

function onAPI(cb) {
  if (window.YT?.Player) return cb();
  apiQueue.push(cb);
  if (!apiLoaded) loadAPI();
}

export default function useYouTubePlayer() {
  const [state, setState] = useState({
    ready: false,
    playing: false,
    loading: false,
    progress: 0,
    duration: 0,
    currentTrack: null,
    error: null,
  });

  const playerRef = useRef(null);
  const containerRef = useRef(null);
  const readyRef = useRef(false);
  const progressTimer = useRef(null);
  const onEndRef = useRef(null);
  const volumeRef = useRef(0.7);
  const pendingRef = useRef(null);

  const update = useCallback((patch) => {
    setState((prev) => ({ ...prev, ...patch }));
  }, []);

  // Keep playback alive when tab is hidden
  useEffect(() => {
    let ctx
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)()
      // silent oscillator keeps audio channel active
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      gain.gain.value = 0
      osc.connect(gain).connect(ctx.destination)
      osc.start()
    } catch {}
    if (!ctx) return

    const handleVisibility = () => {
      if (ctx.state === 'suspended') ctx.resume()
    }
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
      ctx.close()
    }
  }, [])

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let destroyed = false;

    onAPI(() => {
      if (destroyed) return;
      const p = new YT.Player(el, {
        height: '1',
        width: '1',
        playerVars: {
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          playsinline: 1,
          rel: 0,
        },
        events: {
          onReady: () => {
            readyRef.current = true;
            update({ ready: true });
            if (pendingRef.current) {
              const { id, onEnd } = pendingRef.current;
              pendingRef.current = null;
              p.loadVideoById(id);
              p.setVolume(volumeRef.current * 100);
              onEndRef.current = onEnd || null;
            }
            // Resume playback if tab was hidden and player got paused
            document.addEventListener('visibilitychange', () => {
              if (!document.hidden && readyRef.current && playerRef.current) {
                try {
                  if (playerRef.current.getPlayerState?.() !== YT.PlayerState.PLAYING) {
                    playerRef.current.playVideo()
                  }
                } catch {}
              }
            })
          },
          onStateChange: (e) => {
            const PLAYING = 1, PAUSED = 2, ENDED = 0, CUED = 5, BUFFERING = 3;
            if (e.data === PLAYING) {
              const d = p.getDuration() || 0;
              update({ playing: true, loading: false, duration: d, error: null });
              clearInterval(progressTimer.current);
              progressTimer.current = setInterval(() => {
                if (p?.getCurrentTime) update({ progress: p.getCurrentTime() });
              }, 250);
            } else if (e.data === PAUSED) {
              update({ playing: false });
              clearInterval(progressTimer.current);
            } else if (e.data === ENDED) {
              clearInterval(progressTimer.current);
              update({ playing: false, progress: 0 });
              onEndRef.current?.();
            } else if (e.data === CUED) {
              update({ duration: p.getDuration() || 0 });
            }
          },
          onError: (e) => {
            update({ error: e.data, loading: false });
            if (e.data === 150 || e.data === 101) {
              update({ error: 'embedding restricted', loading: false });
            }
          },
        },
      });
      playerRef.current = p;
    });

    return () => {
      destroyed = true;
      clearInterval(progressTimer.current);
      if (playerRef.current?.destroy) {
        try { playerRef.current.destroy(); } catch {}
      }
      playerRef.current = null;
      readyRef.current = false;
    };
  }, [update]);

  const play = useCallback((track, onEnd) => {
    if (!track?.videoId) return;

    const curId = state.currentTrack?.videoId;
    if (curId === track.videoId && readyRef.current) {
      if (state.playing) playerRef.current?.pauseVideo();
      else playerRef.current?.playVideo();
      return;
    }

    update({ currentTrack: track, progress: 0, duration: 0, error: null, loading: true });

    if (!readyRef.current || !playerRef.current) {
      pendingRef.current = { id: track.videoId, onEnd };
      return;
    }

    onEndRef.current = onEnd || null;
    playerRef.current.loadVideoById(track.videoId);
    playerRef.current.setVolume(volumeRef.current * 100);
  }, [state.currentTrack?.videoId, state.playing, update]);

  const togglePlay = useCallback(() => {
    if (!playerRef.current) return;
    if (state.playing) playerRef.current.pauseVideo();
    else playerRef.current.playVideo();
  }, [state.playing]);

  const seek = useCallback((time) => {
    if (playerRef.current) {
      playerRef.current.seekTo(time, true);
      update({ progress: time });
    }
  }, [update]);

  const setVolume = useCallback((v) => {
    volumeRef.current = v;
    if (playerRef.current) playerRef.current.setVolume(v * 100);
  }, []);

  const stop = useCallback(() => {
    if (playerRef.current) playerRef.current.stopVideo();
    clearInterval(progressTimer.current);
    update({ playing: false, progress: 0, currentTrack: null, error: null });
  }, [update]);

  return { ...state, containerRef, play, togglePlay, seek, setVolume, stop, update };
}
