import { useState, useEffect, useRef } from 'react';
import {
  Play, Pause, SkipBack, SkipForward, CaretDown, Shuffle, Repeat, SpeakerHigh, TextAlignLeft, Queue,
  Heart, Heartbeat, VinylRecord, MicrophoneStage, MusicNotes,
} from '@phosphor-icons/react';
import useLyrics from '../hooks/useLyrics';
import { getArtistName } from '../utils';

function formatTime(s) {
  if (!s || isNaN(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export default function NowPlayingView({
  track, playing, progress, duration, volume, error,
  onTogglePlay, onSeek, onVolume, onPrev, onNext, onClose, onLyrics,
  repeat, onRepeat, shuffle, onShuffle,
  liked, onLike, saved, onSave,
  onViewAlbum, onViewArtist,
}) {
  function cycleRepeat() {
    const modes = ['off', 'one', 'all'];
    const idx = modes.indexOf(repeat);
    onRepeat(modes[(idx + 1) % modes.length]);
  }

  const { lines: lyrics, loading: lyricsLoading, error: lyricsError } = useLyrics(track);
  const [activeLine, setActiveLine] = useState(-1);
  const lyricsRef = useRef(null);

  useEffect(() => {
    if (!lyrics || !lyrics.some((l) => l.time != null)) {
      setActiveLine(-1);
      return;
    }
    const idx = lyrics.findLastIndex((l) => l.time != null && progress >= l.time);
    setActiveLine(idx);
  }, [progress, lyrics]);

  useEffect(() => {
    if (activeLine < 0 || !lyricsRef.current) return;
    const el = lyricsRef.current.children[activeLine];
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [activeLine]);

  function handleProgressClick(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    onSeek(pct * (duration || 0));
  }

  const progressPct = duration ? (progress / duration) * 100 : 0;
  const hasSynced = lyrics?.some((l) => l.time != null);

  return (
    <div className="min-h-[calc(100dvh-68px)] flex flex-col md:flex-row animate-fade-in">
      <div className="flex items-center justify-between px-4 py-2 md:hidden">
        <button onClick={onClose} className="flex items-center gap-1 text-xs text-warm-500 hover:text-warm-700 dark:text-warm-400 dark:hover:text-warm-200 transition-colors p-2 rounded-xl hover:bg-warm-100 dark:hover:bg-warm-800/50">
          <CaretDown size={16} weight="bold" />
          now playing
        </button>
        <button onClick={onLyrics} className="p-2 rounded-xl text-warm-400 hover:text-warm-600 hover:bg-warm-100 transition-all dark:text-warm-500 dark:hover:text-warm-300 dark:hover:bg-warm-800/50" title="lyrics panel">
          <TextAlignLeft size={18} />
        </button>
      </div>

      <div className="md:w-[42%] md:min-w-[360px] flex flex-col items-center justify-center px-4 md:px-8 py-4 md:py-6 md:sticky md:top-0 md:self-start">
        <button onClick={onClose} className="hidden md:flex items-center gap-1 text-xs text-warm-400 hover:text-warm-600 dark:text-warm-500 dark:hover:text-warm-300 transition-colors mb-4 self-start">
          <CaretDown size={14} weight="bold" />
          now playing
        </button>

        <div className="w-full aspect-square max-w-[260px] md:max-w-[300px] rounded-2xl md:rounded-3xl overflow-hidden bg-warm-200 shadow-lg mb-5 md:mb-6 dark:bg-warm-800">
          {track?.thumbnail ? (
            <img src={track.thumbnail} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <MusicNotes size={48} className="text-warm-300 dark:text-warm-600" />
            </div>
          )}
        </div>

        <div className="w-full text-left mb-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold text-warm-800 dark:text-warm-200 truncate">{track?.title || track?.name}</h2>
              <p className="text-sm text-warm-500 dark:text-warm-400 truncate mt-0.5">{getArtistName(track) || 'unknown artist'}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={onLike} className={`p-2 rounded-xl transition-all ${liked ? 'text-rose-500 bg-rose-100/60 dark:text-rose-400 dark:bg-rose-900/40' : 'text-warm-400 hover:text-rose-500 hover:bg-warm-100 dark:text-warm-500 dark:hover:text-rose-400 dark:hover:bg-warm-800/50'}`}>
                <Heart size={20} weight={liked ? 'fill' : 'regular'} />
              </button>
              <button onClick={onSave} className={`p-2 rounded-xl transition-all ${saved ? 'text-rose-500 bg-rose-100/60 dark:text-rose-400 dark:bg-rose-900/40' : 'text-warm-400 hover:text-rose-500 hover:bg-warm-100 dark:text-warm-500 dark:hover:text-rose-400 dark:hover:bg-warm-800/50'}`}>
                <Heartbeat size={20} weight={saved ? 'fill' : 'regular'} />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-2">
            <button onClick={onViewAlbum} className="flex items-center gap-1 text-[11px] text-warm-400 hover:text-warm-600 dark:text-warm-500 dark:hover:text-warm-300 transition-colors">
              <VinylRecord size={13} /> album
            </button>
            <button onClick={onViewArtist} className="flex items-center gap-1 text-[11px] text-warm-400 hover:text-warm-600 dark:text-warm-500 dark:hover:text-warm-300 transition-colors">
              <MicrophoneStage size={13} /> artist
            </button>
          </div>
        </div>

        <div className="w-full mb-4">
          <div className="h-[3px] bg-warm-200 dark:bg-warm-800 rounded-full cursor-pointer group relative mb-2" onClick={handleProgressClick}>
            <div className="h-full bg-rose-400 rounded-full relative transition-[width] duration-200" style={{ width: `${progressPct}%` }}>
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-rose-400 shadow-md opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
          <div className="flex justify-between text-[11px] text-warm-400 dark:text-warm-500 tabular-nums">
            <span>{formatTime(progress)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-4 w-full mb-4">
          <button onClick={onShuffle} className={`p-2 rounded-xl transition-all ${shuffle ? 'text-rose-500 bg-rose-100/60 dark:text-rose-400 dark:bg-rose-900/40' : 'text-warm-400 hover:text-warm-600 hover:bg-warm-100 dark:text-warm-500 dark:hover:text-warm-300 dark:hover:bg-warm-800/50'}`}>
            <Shuffle size={18} weight={shuffle ? 'fill' : 'regular'} />
          </button>
          <button onClick={onPrev} className="p-3 rounded-xl text-warm-500 hover:text-warm-700 hover:bg-warm-100 transition-all dark:text-warm-400 dark:hover:text-warm-200 dark:hover:bg-warm-800/50">
            <SkipBack size={22} weight="fill" />
          </button>
          <button
            onClick={onTogglePlay}
            className="w-16 h-16 rounded-full bg-rose-300 hover:bg-rose-400 text-white flex items-center justify-center transition-all shadow-md active:scale-90 dark:bg-rose-700 dark:hover:bg-rose-600"
          >
            {playing ? <Pause size={26} weight="fill" /> : <Play size={26} weight="fill" />}
          </button>
          <button onClick={onNext} className="p-3 rounded-xl text-warm-500 hover:text-warm-700 hover:bg-warm-100 transition-all dark:text-warm-400 dark:hover:text-warm-200 dark:hover:bg-warm-800/50">
            <SkipForward size={22} weight="fill" />
          </button>
          <button onClick={cycleRepeat} className={`p-2 rounded-xl transition-all ${repeat === 'off' ? 'text-warm-400 hover:text-warm-600 hover:bg-warm-100 dark:text-warm-500 dark:hover:text-warm-300 dark:hover:bg-warm-800/50' : 'text-rose-500 bg-rose-100/60 dark:text-rose-400 dark:bg-rose-900/40'}`}>
            <Repeat size={18} weight={repeat !== 'off' ? 'fill' : 'regular'} />
          </button>
        </div>

        <div className="w-full flex items-center gap-3">
          <SpeakerHigh size={16} className="text-warm-400 dark:text-warm-500 shrink-0" />
          <div
            className="flex-1 h-1.5 bg-warm-200 dark:bg-warm-800 rounded-full cursor-pointer relative"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
              onVolume(pct);
            }}
          >
            <div className="h-full bg-rose-300 rounded-full transition-[width] duration-150" style={{ width: `${volume * 100}%` }} />
          </div>
        </div>

        {error && (
          <div className="mt-4 text-center">
            <span className="text-[11px] text-rose-500 bg-rose-100/60 px-3 py-1.5 rounded-lg">playback restricted</span>
          </div>
        )}
      </div>

      <div className="md:flex-1 md:border-l border-warm-200/60 dark:border-warm-800/60 md:min-h-[calc(100dvh-68px)] md:overflow-y-auto relative">
        <div className="px-6 md:px-10 py-6 md:py-10 max-w-xl">
          <div className="flex items-center gap-2 mb-6">
            <MusicNotes size={14} weight="fill" className="text-rose-400" />
            <h3 className="text-[11px] font-semibold text-warm-500 dark:text-warm-400 uppercase tracking-wider">lirik</h3>
            {hasSynced && <span className="text-[10px] text-warm-400 dark:text-warm-500">synced</span>}
          </div>

          {lyricsLoading && (
            <div className="space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-4 rounded bg-warm-200/50 dark:bg-warm-800/50 animate-pulse-soft" style={{ width: `${45 + Math.random() * 45}%` }} />
              ))}
            </div>
          )}

          {!lyricsLoading && lyricsError && (
            <div className="text-center py-12">
              <TextAlignLeft size={28} className="text-warm-300 dark:text-warm-700 mx-auto mb-3" />
              <p className="text-sm text-warm-400 dark:text-warm-500">no lyrics for this track</p>
              <p className="text-xs text-warm-300 dark:text-warm-600 mt-1">lirik tidak tersedia</p>
            </div>
          )}

          {!lyricsLoading && lyrics && lyrics.length > 0 && (
            <>
              <div ref={lyricsRef} className="space-y-3">
                {lyrics.map((line, i) => (
                  <p
                    key={i}
                    className={`transition-all duration-300 ${
                      line.text.startsWith('[')
                        ? 'text-[11px] text-warm-400 dark:text-warm-500 font-medium tracking-wider uppercase'
                        : hasSynced
                          ? i === activeLine
                            ? 'text-base text-rose-600 dark:text-rose-300 font-medium scale-[1.02]'
                            : i < activeLine
                              ? 'text-sm text-warm-400 dark:text-warm-500'
                              : 'text-sm text-warm-600 dark:text-warm-400'
                          : 'text-sm text-warm-600 dark:text-warm-400 leading-relaxed'
                    }`}
                  >
                    {line.text}
                  </p>
                ))}
              </div>
              {lyrics.length > 15 && (
                <div className="mt-6 text-center">
                  <p className="text-[10px] text-warm-300 dark:text-warm-600">{lyrics.length} lines</p>
                </div>
              )}
            </>
          )}

          {!lyricsLoading && !lyrics && !lyricsError && (
            <div className="text-center py-12">
              <MusicNotes size={28} className="text-warm-300 dark:text-warm-700 mx-auto mb-3" />
              <p className="text-sm text-warm-400 dark:text-warm-500">no lyrics loaded</p>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 h-12 bg-gradient-to-t from-warm-50 to-transparent pointer-events-none dark:from-warm-950" />
      </div>
    </div>
  );
}
