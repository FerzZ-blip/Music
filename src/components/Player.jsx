import { Play, Pause, SkipBack, SkipForward, SpeakerHigh, SpeakerX, TextAlignLeft, Queue, Playlist, CaretUp } from '@phosphor-icons/react';
import { useState, useRef } from 'react';
import { getArtistName } from '../utils';

function formatTime(s) {
  if (!s || isNaN(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export default function Player({
  currentTrack, playing, progress, duration, volume, error,
  onTogglePlay, onSeek, onVolume, onLyrics, onQueueToggle,
  onPrev, onNext, onExpand, queueLength, queueIndex,
  repeat, onRepeat, shuffle, onShuffle,
  saved, onSave,
  onAddToQueue,
  bridgeConnected, discordConnected,
}) {
  const [volumeOpen, setVolumeOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const progressRef = useRef(null);

  function handleProgressClick(e) {
    if (!duration) return;
    const rect = progressRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    onSeek(pct * duration);
  }

  function handleVolumeClick(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    onVolume(pct);
  }

  const progressPct = duration ? (progress / duration) * 100 : 0;

  if (!currentTrack) {
    return (
      <div className="fixed left-0 right-0 h-[68px] bg-warm-50/85 backdrop-blur-xl border-t border-warm-200/80 z-40 flex items-center px-6 dark:bg-warm-900/85 dark:border-warm-800/80 bottom-0 md:bottom-0">
        <div className="flex items-center gap-3 ml-14 md:ml-0">
          <div className="w-11 h-11 rounded-xl bg-warm-200 dark:bg-warm-800 flex items-center justify-center">
            <Playlist size={18} className="text-warm-400 dark:text-warm-500" />
          </div>
          <div>
            <p className="text-sm text-warm-400 dark:text-warm-500 font-medium">drop the needle</p>
            <p className="text-xs text-warm-300 dark:text-warm-600">find a record to spin</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed left-0 right-0 bg-warm-50/85 backdrop-blur-xl border-t border-warm-200/80 z-40 dark:bg-warm-900/85 dark:border-warm-800/80 bottom-0 md:bottom-0">
      <div
        ref={progressRef}
        className="h-1 bg-warm-200/80 dark:bg-warm-800/80 cursor-pointer group relative"
        onClick={handleProgressClick}
      >
        <div
          className="h-full bg-gradient-to-r from-rose-300 to-rose-400 relative"
          style={{ width: `${progressPct}%`, transition: dragging ? 'none' : 'width 0.3s ease' }}
        >
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-rose-400 scale-0 group-hover:scale-100 transition-transform shadow-md" />
        </div>
      </div>

      <div className="h-[67px] flex items-center px-3 md:px-5 gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0 ml-14 md:ml-0 cursor-pointer" onClick={onExpand}>
          <div className="relative w-11 h-11 rounded-xl overflow-hidden bg-warm-200 shrink-0 shadow-sm">
            {currentTrack.thumbnail ? (
              <img src={currentTrack.thumbnail} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className={playing ? 'animate-spin-slow' : ''}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-warm-400">
                    <circle cx="12" cy="12" r="10" />
                    <circle cx="12" cy="12" r="3" fill="currentColor" />
                  </svg>
                </div>
              </div>
            )}
            {playing && (
              <div className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-rose-400 flex items-center justify-center shadow-xs">
                <div className="flex items-end gap-[1px] h-2">
                  <span className="w-[1.5px] bg-white rounded-full animate-bar-1" />
                  <span className="w-[1.5px] bg-white rounded-full animate-bar-2" />
                  <span className="w-[1.5px] bg-white rounded-full animate-bar-3" />
                </div>
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-warm-800 dark:text-warm-200 truncate max-w-[140px] md:max-w-[220px]">
              {currentTrack.title || currentTrack.name}
            </p>
            <p className="text-[11px] text-warm-500 dark:text-warm-400 truncate max-w-[140px] md:max-w-[220px]">
              {getArtistName(currentTrack) || 'unknown artist'}
            </p>
          </div>
          <CaretUp size={14} className="text-warm-300 dark:text-warm-600 shrink-0 mr-1 hidden md:block" />
        </div>

        {error && (
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-100/60 dark:bg-rose-900/30">
            <span className="text-[11px] text-rose-600 dark:text-rose-400 whitespace-nowrap">playback unavailable</span>
          </div>
        )}

        <div className="flex items-center gap-1">
          <button
            onClick={onSave}
            className={`p-2 rounded-xl transition-all ${saved ? 'text-rose-500 bg-rose-100/60 dark:text-rose-400 dark:bg-rose-900/40' : 'text-warm-400 hover:text-rose-500 hover:bg-warm-200/50 dark:text-warm-500 dark:hover:text-rose-400 dark:hover:bg-warm-800/50'}`}
            title={saved ? 'saved to crate' : 'save to crate'}
          >
            <Playlist size={17} weight={saved ? 'fill' : 'regular'} />
          </button>
          <button
            onClick={onAddToQueue}
            className="p-2 rounded-xl text-warm-400 hover:text-warm-600 hover:bg-warm-200/50 transition-all dark:text-warm-500 dark:hover:text-warm-300 dark:hover:bg-warm-800/50"
            title="add to queue"
          >
            <Queue size={17} weight="regular" />
          </button>
        </div>

        <div className="flex items-center gap-0.5">
          <button onClick={onPrev} className="p-1.5 sm:p-2 rounded-xl text-warm-400 hover:text-warm-600 hover:bg-warm-200/50 transition-all dark:text-warm-500 dark:hover:text-warm-300 dark:hover:bg-warm-800/50">
            <SkipBack size={15} weight="fill" />
          </button>
          <button
            onClick={onTogglePlay}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-rose-300 hover:bg-rose-400 text-white flex items-center justify-center transition-all active:scale-90 shadow-sm dark:bg-rose-700 dark:hover:bg-rose-600"
            title={playing ? 'pause' : 'play'}
          >
            {playing ? <Pause size={16} weight="fill" /> : <Play size={16} weight="fill" />}
          </button>
          <button onClick={onNext} className="p-1.5 sm:p-2 rounded-xl text-warm-400 hover:text-warm-600 hover:bg-warm-200/50 transition-all dark:text-warm-500 dark:hover:text-warm-300 dark:hover:bg-warm-800/50">
            <SkipForward size={15} weight="fill" />
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={onLyrics}
            className="p-2 rounded-xl text-warm-400 hover:text-warm-600 hover:bg-warm-200/50 transition-all dark:text-warm-500 dark:hover:text-warm-300 dark:hover:bg-warm-800/50 hidden sm:flex"
            title="lyrics"
          >
            <TextAlignLeft size={15} />
          </button>
          <button
            onClick={onQueueToggle}
            className="relative p-2 rounded-xl text-warm-400 hover:text-warm-600 hover:bg-warm-200/50 transition-all dark:text-warm-500 dark:hover:text-warm-300 dark:hover:bg-warm-800/50"
            title="queue"
          >
            <Queue size={17} weight="regular" />
            {queueLength > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-rose-400 text-white text-[9px] font-medium flex items-center justify-center">
                {queueLength}
              </span>
            )}
          </button>

          <div className="relative hidden md:flex items-center" title={discordConnected ? 'Discord connected' : bridgeConnected ? 'bridge connected, no Discord' : 'Discord bridge offline'}>
            <div className={`w-2 h-2 rounded-full ${discordConnected ? 'bg-honey-500' : bridgeConnected ? 'bg-warm-300' : 'bg-warm-200 dark:bg-warm-700'}`} />
          </div>

          <div className="relative hidden md:block">
            <button
              onClick={() => setVolumeOpen(!volumeOpen)}
              className="p-2 rounded-xl text-warm-400 hover:text-warm-600 hover:bg-warm-200/50 transition-all dark:text-warm-500 dark:hover:text-warm-300 dark:hover:bg-warm-800/50"
            >
              {volume === 0 ? <SpeakerX size={17} /> : <SpeakerHigh size={17} weight={volume > 0.5 ? 'fill' : 'regular'} />}
            </button>
            {volumeOpen && (
              <div className="absolute bottom-full right-0 mb-3 p-3.5 bg-white dark:bg-warm-900 rounded-2xl shadow-lg border border-warm-200/80 dark:border-warm-800/80">
                <div
                  className="w-24 h-1.5 bg-warm-200 dark:bg-warm-800 rounded-full cursor-pointer relative"
                  onClick={handleVolumeClick}
                >
                  <div className="h-full bg-rose-400 rounded-full" style={{ width: `${volume * 100}%` }} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
