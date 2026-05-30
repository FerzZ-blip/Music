import { Play, Pause, Queue } from '@phosphor-icons/react';
import { getArtistName } from '../utils';

function formatTime(s) {
  if (!s || isNaN(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

function TimeAgo({ date }) {
  if (!date) return null;
  const now = Date.now();
  const diff = now - new Date(date).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

export default function TrackList({ tracks, onPlay, currentTrack, playing, loading, onAddToQueue }) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-16 rounded-xl bg-warm-200/60 dark:bg-warm-800/60 animate-pulse-soft" />
        ))}
      </div>
    );
  }

  if (!tracks || tracks.length === 0) return null;

  const isPlayingThis = (track) => currentTrack?.videoId === track.videoId && playing;

  return (
    <div className="space-y-1">
      {tracks.map((track, i) => {
        const active = currentTrack?.videoId === track.videoId;
        return (
          <div
            key={track.videoId || track.id || i}
            className={`group flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all duration-200 ${
              active
                ? 'bg-rose-100/70 dark:bg-rose-900/30'
                : 'hover:bg-warm-100 dark:hover:bg-warm-800/50'
            } animate-fade-in stagger-${Math.min(i + 1, 8)}`}
            onClick={() => onPlay(track)}
          >
            <div className="relative w-10 h-10 md:w-11 md:h-11 rounded-lg overflow-hidden bg-warm-200 dark:bg-warm-800 shrink-0 flex items-center justify-center">
              {track.thumbnail ? (
                <img
                  src={track.thumbnail}
                  alt=""
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="text-warm-400 text-xs">♪</div>
              )}
              <div className={`absolute inset-0 bg-black/20 flex items-center justify-center transition-opacity duration-200 ${
                isPlayingThis(track) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
              }`}>
                {isPlayingThis(track) ? (
                  <div className="flex items-end gap-[2px] h-4">
                    <span className="w-[2px] bg-white rounded-full animate-bar-1" />
                    <span className="w-[2px] bg-white rounded-full animate-bar-2" />
                    <span className="w-[2px] bg-white rounded-full animate-bar-3" />
                  </div>
                ) : (
                  <Play size={14} weight="fill" className="text-white" />
                )}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <p className={`text-xs md:text-sm font-medium truncate ${active ? 'text-rose-700 dark:text-rose-300' : 'text-warm-900 dark:text-warm-200'}`}>
                {track.title || track.name}
              </p>
              <p className="text-[10px] md:text-xs text-warm-500 dark:text-warm-400 truncate">
                {getArtistName(track) || 'unknown'}
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {track.duration && (
              <span className="text-xs text-warm-400 dark:text-warm-500 tabular-nums">{formatTime(track.duration)}</span>
            )}
            {(track.nbP !== undefined || track.playCount) && (
              <span className="text-[11px] text-warm-400 dark:text-warm-500 hidden sm:block">
                  {track.nbP || track.playCount}
                </span>
              )}
              {track.date && (
                <span className="text-[11px] text-warm-400 hidden md:block">
                  <TimeAgo date={track.date} />
                </span>
              )}
              {onAddToQueue && (
                <button
                  onClick={(e) => { e.stopPropagation(); onAddToQueue(track); }}
                  className="opacity-0 group-hover:opacity-100 text-warm-400 hover:text-rose-500 dark:text-warm-500 dark:hover:text-rose-400 transition-all p-1"
                  title="add to queue"
                >
                  <Queue size={15} />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
