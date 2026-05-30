import { X, Play, Trash, Queue, CaretUp, CaretDown } from '@phosphor-icons/react';
import { getArtistName } from '../utils';

export default function QueuePanel({ queue, currentIndex, visible, onClose, onPlay, onRemove, onClear, onMove }) {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-warm-900/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-warm-50 dark:bg-warm-950 h-full shadow-2xl animate-slide-right overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-warm-200 dark:border-warm-800">
          <div className="flex items-center gap-2">
            <Queue size={18} className="text-rose-400" />
            <h2 className="text-sm font-semibold text-warm-700 dark:text-warm-300">queue</h2>
            <span className="text-[11px] text-warm-400 dark:text-warm-500">{queue.length} tracks</span>
          </div>
          <button onClick={onClose} className="text-warm-400 hover:text-warm-600 dark:text-warm-500 dark:hover:text-warm-300 transition-colors p-1">
            <X size={18} weight="bold" />
          </button>
        </div>

        {queue.length === 0 && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Queue size={32} className="text-warm-300 dark:text-warm-700 mx-auto mb-2" />
              <p className="text-sm text-warm-400 dark:text-warm-500">empty queue</p>
              <p className="text-xs text-warm-300 dark:text-warm-600 mt-1">add tracks to the rotation</p>
            </div>
          </div>
        )}

        {queue.length > 0 && (
          <>
            <div className="flex-1 overflow-y-auto no-scrollbar px-2 py-2">
              <div className="space-y-0.5">
                {queue.map((track, i) => {
                  const isCurrent = i === currentIndex;
                  return (
                    <div
                      key={`${track.videoId}-${i}`}
                      className={`group flex items-center gap-3 p-2.5 rounded-xl transition-all duration-200 ${
                        isCurrent ? 'bg-rose-100/70 dark:bg-rose-900/30' : 'hover:bg-warm-100 dark:hover:bg-warm-800/50'
                      }`}
                    >
                      <button
                        onClick={() => onPlay(track)}
                        className="w-9 h-9 rounded-lg overflow-hidden bg-warm-200 dark:bg-warm-800 shrink-0 flex items-center justify-center"
                      >
                        {track.thumbnail ? (
                          <img src={track.thumbnail} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Play size={12} className="text-warm-400" />
                        )}
                      </button>
                      <div className="flex-1 min-w-0" onClick={() => onPlay(track)}>
                        <p className={`text-xs font-medium truncate ${isCurrent ? 'text-rose-700 dark:text-rose-300' : 'text-warm-800 dark:text-warm-200'}`}>
                          {track.title || track.name}
                        </p>
                        <p className="text-[11px] text-warm-500 dark:text-warm-400 truncate">
                          {getArtistName(track)}
                        </p>
                      </div>
                      <div className="flex flex-col items-center gap-0.5 shrink-0">
                        <button onClick={() => onMove(i, i - 1)} className="text-warm-400 hover:text-warm-600 dark:text-warm-500 dark:hover:text-warm-300 transition-all p-0.5 disabled:opacity-20" disabled={i === 0}>
                          <CaretUp size={11} weight="bold" />
                        </button>
                        <span className="text-[10px] text-warm-400 dark:text-warm-500">{i + 1}</span>
                        <button onClick={() => onMove(i, i + 1)} className="text-warm-400 hover:text-warm-600 dark:text-warm-500 dark:hover:text-warm-300 transition-all p-0.5 disabled:opacity-20" disabled={i === queue.length - 1}>
                          <CaretDown size={11} weight="bold" />
                        </button>
                      </div>
                      <button
                        onClick={() => onRemove(i)}
                        className="opacity-0 group-hover:opacity-100 text-warm-400 hover:text-rose-500 transition-all p-1"
                      >
                        <Trash size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="px-4 py-3 border-t border-warm-200 dark:border-warm-800">
              <button
                onClick={onClear}
                className="w-full py-2 rounded-xl text-xs font-medium text-warm-500 hover:text-warm-700 hover:bg-warm-200/50 transition-all dark:text-warm-500 dark:hover:text-warm-300 dark:hover:bg-warm-800/50"
              >
                clear queue
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
