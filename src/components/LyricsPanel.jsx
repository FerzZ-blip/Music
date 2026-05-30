import { useRef, useEffect, useState } from 'react';
import { X, TextAlignLeft, MusicNotes } from '@phosphor-icons/react';
import useLyrics from '../hooks/useLyrics';
import { getArtistName } from '../utils';

export default function LyricsPanel({ track, visible, onClose, progress }) {
  const { lines: lyrics, loading, error } = useLyrics(visible ? track : null);
  const scrollRef = useRef(null);
  const [activeLine, setActiveLine] = useState(-1);

  useEffect(() => {
    if (visible && scrollRef.current) scrollRef.current.scrollTop = 0;
    setActiveLine(-1);
  }, [visible, track]);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    if (visible) {
      window.addEventListener('keydown', handler);
      return () => window.removeEventListener('keydown', handler);
    }
  }, [visible, onClose]);

  useEffect(() => {
    if (!lyrics || !lyrics.some((l) => l.time != null)) {
      setActiveLine(-1);
      return;
    }
    const idx = lyrics.findLastIndex((l) => l.time != null && progress >= l.time);
    setActiveLine(idx);
  }, [progress, lyrics]);

  useEffect(() => {
    if (activeLine < 0 || !scrollRef.current) return;
    const el = scrollRef.current.children[activeLine];
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [activeLine]);

  if (!visible) return null;

  const hasSynced = lyrics?.some((l) => l.time != null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-warm-900/40 backdrop-blur-sm dark:bg-warm-950/80" onClick={onClose} />
      <div className="relative w-full max-w-lg mx-4 max-h-[80vh] bg-warm-50 dark:bg-warm-950 rounded-3xl shadow-xl animate-slide-up flex flex-col overflow-hidden border border-warm-200/60 dark:border-warm-800/60">
        <div className="flex items-center justify-between px-6 pt-5 pb-3 shrink-0">
          <div className="flex items-center gap-2">
            <TextAlignLeft size={16} className="text-rose-400" />
            <h3 className="text-sm font-medium text-warm-700 dark:text-warm-300">lirik</h3>
            {!loading && lyrics && (
              <span className="text-[10px] text-warm-400 dark:text-warm-500">{lyrics.length} lines{hasSynced ? ' · synced' : ''}</span>
            )}
          </div>
          <button onClick={onClose} className="text-warm-400 hover:text-warm-600 dark:text-warm-500 dark:hover:text-warm-300 transition-colors p-1">
            <X size={18} weight="bold" />
          </button>
        </div>

        {track && (
          <div className="px-6 pb-3 border-b border-warm-200 dark:border-warm-800 shrink-0">
            <p className="font-medium text-warm-800 dark:text-warm-200 text-sm truncate">{track.title || track.name}</p>
            <p className="text-xs text-warm-500 dark:text-warm-400 truncate">{getArtistName(track)}</p>
          </div>
        )}

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-4 no-scrollbar">
          {loading && (
            <div className="space-y-3">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="h-4 rounded bg-warm-200/50 dark:bg-warm-800/50 animate-pulse-soft" style={{ width: `${50 + Math.random() * 45}%` }} />
              ))}
            </div>
          )}

          {!loading && error && (
            <div className="text-center py-12">
              <MusicNotes size={28} className="text-warm-300 dark:text-warm-700 mx-auto mb-3" />
              <p className="text-sm text-warm-400 dark:text-warm-500">lirik tidak tersedia</p>
              <p className="text-xs text-warm-300 dark:text-warm-600 mt-1">no lyrics for this track</p>
            </div>
          )}

          {!loading && lyrics && lyrics.length > 0 && (
            <div className="space-y-2.5">
              {lyrics.map((line, i) => (
                <p
                  key={i}
                  className={`leading-relaxed transition-all duration-300 ${
                    line.text.startsWith('[')
                      ? 'text-[11px] text-warm-400 dark:text-warm-500 font-medium uppercase tracking-wider'
                      : hasSynced
                        ? i === activeLine
                          ? 'text-base text-rose-600 dark:text-rose-300 font-medium scale-[1.02]'
                          : i < activeLine
                            ? 'text-sm text-warm-400 dark:text-warm-500'
                            : 'text-sm text-warm-700 dark:text-warm-300'
                        : 'text-sm text-warm-700 dark:text-warm-300'
                  }`}
                >
                  {line.text}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
