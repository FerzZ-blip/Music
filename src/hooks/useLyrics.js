import { useState, useEffect, useRef } from 'react';
import { fetchLyrics } from '../api/lyrics';
import { getArtistName } from '../utils';

const cache = new Map();

export default function useLyrics(track) {
  const [lines, setLines] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const activeTrackRef = useRef(null);

  useEffect(() => {
    if (!track) {
      setLines(null);
      setLoading(false);
      setError(null);
      return;
    }

    const key = track.videoId || `${track.title}|${getArtistName(track)}`;
    if (!key) return;

    const cached = cache.get(key);
    if (cached) {
      setLines(cached);
      setLoading(false);
      setError(null);
      return;
    }

    const artist = getArtistName(track);
    const title = track.title || track.name || '';
    if (!title && !artist) return;

    activeTrackRef.current = key;
    setLoading(true);
    setLines(null);
    setError(null);

    fetchLyrics(title, artist)
      .then((result) => {
        if (activeTrackRef.current !== key) return;
        if (result && result.length > 0) {
          cache.set(key, result);
          setLines(result);
        } else {
          setLines(null);
          setError('not found');
        }
      })
      .catch(() => {
        if (activeTrackRef.current !== key) return;
        setError('not found');
        setLines(null);
      })
      .finally(() => {
        if (activeTrackRef.current === key) setLoading(false);
      });
  }, [track]);

  return { lines, loading, error };
}

export function prefetchLyrics(track) {
  if (!track) return;
  const key = track.videoId || `${track.title}|${getArtistName(track)}`;
  if (!key || cache.has(key)) return;

  const artist = getArtistName(track);
  const title = track.title || track.name || '';
  if (!title && !artist) return;

  fetchLyrics(title, artist)
    .then((result) => {
      if (result && result.length > 0) cache.set(key, result);
    })
    .catch(() => {});
}
