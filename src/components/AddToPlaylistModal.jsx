import { useState } from 'react';
import { X, Plus, Check, MusicNotes } from '@phosphor-icons/react';

export default function AddToPlaylistModal({ visible, track, playlists, onClose, onAdd, onCreate }) {
  const [selected, setSelected] = useState(new Set());
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');

  if (!visible) return null;

  function togglePlaylist(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleCreate() {
    const trimmed = newName.trim();
    if (!trimmed) return;
    const id = onCreate(trimmed);
    setSelected((prev) => new Set(prev).add(id));
    setNewName('');
    setCreating(false);
  }

  function handleDone() {
    selected.forEach((id) => onAdd(track, id));
    setSelected(new Set());
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-warm-900/30 backdrop-blur-sm" onClick={() => { setSelected(new Set()); onClose(); }} />
      <div className="relative w-full max-w-sm bg-warm-50 dark:bg-warm-950 rounded-t-3xl md:rounded-2xl shadow-2xl animate-slide-up overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-warm-200 dark:border-warm-800">
          <div className="flex items-center gap-2">
            <MusicNotes size={16} className="text-rose-400" />
            <h2 className="text-sm font-semibold text-warm-700 dark:text-warm-300">add to playlist</h2>
          </div>
          <button onClick={() => { setSelected(new Set()); onClose(); }} className="text-warm-400 hover:text-warm-600 dark:text-warm-500 dark:hover:text-warm-300 transition-colors p-1">
            <X size={18} weight="bold" />
          </button>
        </div>

        <div className="max-h-72 overflow-y-auto no-scrollbar px-2 py-2">
          {playlists.length === 0 && !creating && (
            <div className="text-center py-8">
              <MusicNotes size={28} className="text-warm-300 dark:text-warm-700 mx-auto mb-2" />
              <p className="text-sm text-warm-400 dark:text-warm-500">no playlists yet</p>
              <p className="text-xs text-warm-300 dark:text-warm-600 mt-1">create one below</p>
            </div>
          )}
          <div className="space-y-0.5">
            {playlists.map((pl) => (
              <button
                key={pl.id}
                onClick={() => togglePlaylist(pl.id)}
                className="w-full flex items-center gap-3 p-2.5 rounded-xl transition-all hover:bg-warm-100 dark:hover:bg-warm-800/50 text-left"
              >
                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0 ${
                  selected.has(pl.id)
                    ? 'bg-rose-400 border-rose-400'
                    : 'border-warm-300 dark:border-warm-600'
                }`}>
                  {selected.has(pl.id) && <Check size={12} weight="bold" className="text-white" />}
                </div>
                <div className="w-8 h-8 rounded-lg overflow-hidden bg-warm-200 dark:bg-warm-800 shrink-0 flex items-center justify-center">
                  {pl.tracks?.[0]?.thumbnail ? (
                    <img src={pl.tracks[0].thumbnail} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <MusicNotes size={14} className="text-warm-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-warm-800 dark:text-warm-200 truncate">{pl.name}</p>
                  <p className="text-[10px] text-warm-400 dark:text-warm-500">{pl.tracks?.length || 0} tracks</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="px-4 py-3 border-t border-warm-200 dark:border-warm-800 space-y-2">
          {creating ? (
            <div className="flex items-center gap-2">
              <input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onBlur={() => { if (!newName.trim()) setCreating(false); }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') { setCreating(false); setNewName(''); } }}
                placeholder="playlist name"
                className="flex-1 text-xs bg-warm-100 dark:bg-warm-800 rounded-xl px-3 py-2 outline-none text-warm-700 dark:text-warm-300 border border-warm-200 dark:border-warm-700"
              />
              <button onClick={handleCreate} className="text-xs text-rose-500 hover:text-rose-600 font-medium whitespace-nowrap">save</button>
              <button onClick={() => { setCreating(false); setNewName(''); }} className="text-warm-400 hover:text-warm-600"><X size={14} /></button>
            </div>
          ) : (
            <button
              onClick={() => setCreating(true)}
              className="w-full flex items-center gap-2 py-2 px-3 rounded-xl text-xs font-medium text-warm-500 hover:text-warm-700 hover:bg-warm-200/50 transition-all dark:text-warm-500 dark:hover:text-warm-300 dark:hover:bg-warm-800/50"
            >
              <Plus size={14} weight="bold" />
              new playlist
            </button>
          )}
          <button
            onClick={handleDone}
            disabled={selected.size === 0 && !creating}
            className="w-full py-2.5 rounded-xl text-xs font-semibold bg-rose-300 hover:bg-rose-400 text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            done
          </button>
        </div>
      </div>
    </div>
  );
}
