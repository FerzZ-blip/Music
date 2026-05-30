import { useState, useRef, useCallback, useEffect } from 'react';

export function useAudio() {
  const [currentTrack, setCurrentTrack] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.7);
  const audioRef = useRef(null);

  useEffect(() => {
    const audio = audioRef.current || new Audio();
    audioRef.current = audio;

    const onTime = () => setProgress(audio.currentTime);
    const onMeta = () => setDuration(audio.duration);
    const onEnd = () => {
      setPlaying(false);
      setProgress(0);
    };
    const onError = () => {
      setPlaying(false);
    };

    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('loadedmetadata', onMeta);
    audio.addEventListener('ended', onEnd);
    audio.addEventListener('error', onError);

    return () => {
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('loadedmetadata', onMeta);
      audio.removeEventListener('ended', onEnd);
      audio.removeEventListener('error', onError);
    };
  }, []);

  const play = useCallback(async (track, streamUrl) => {
    const audio = audioRef.current;
    if (!audio) return;

    if (currentTrack?.videoId === track.videoId && audio.src) {
      if (playing) {
        audio.pause();
        setPlaying(false);
      } else {
        audio.play().catch(() => {});
        setPlaying(true);
      }
      return;
    }

    if (!streamUrl) {
      setCurrentTrack(track);
      setPlaying(false);
      setProgress(0);
      return;
    }

    audio.src = streamUrl;
    audio.volume = volume;
    setCurrentTrack(track);
    setPlaying(false);
    setProgress(0);

    try {
      await audio.play();
      setPlaying(true);
    } catch {
      setPlaying(false);
    }
  }, [currentTrack, playing, volume]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play().catch(() => {});
      setPlaying(true);
    }
  }, [playing]);

  const seek = useCallback((time) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = time;
    setProgress(time);
  }, []);

  const setVolume = useCallback((v) => {
    const audio = audioRef.current;
    if (audio) audio.volume = v;
    setVolumeState(v);
  }, []);

  return {
    currentTrack,
    playing,
    progress,
    duration,
    volume,
    play,
    togglePlay,
    seek,
    setVolume,
  };
}
