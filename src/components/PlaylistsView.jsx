import { useState } from 'react';
import { MusicNotes, Play, Trash, Plus, PencilSimple, ArrowLeft, X } from '@phosphor-icons/react';
import { getArtistName } from '../utils';

function formatCount(n) {
  if (!n) return '0 tracks';
  return n === 1 ? '1 track' : `${n} tracks`;
}

function PlaylistCard({ playlist, onSelect, onRename, onDelete, onPlay }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(playlist.name);

  function handleRename() {
    const trimmed = name.trim();
    if (trimmed && trimmed !== playlist.name) {
      onRename(playlist.id, trimmed);
    } else {
      setName(playlist.name);
    }
    setEditing(false);
  }

  const cover = playlist.tracks?.[0]?.thumbnail;

  return (
    <div className="group bg-warm-50 dark:bg-warm-900/60 rounded-2xl border border-warm-200/60 dark:border-warm-800/60 overflow-hidden transition-all hover:shadow-md">
      <div className="aspect-[3/2] bg-warm-100 dark:bg-warm-800 relative overflow-hidden cursor-pointer" onClick={() => onSelect(playlist)}>
        {cover ? (
          <img src={cover} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <MusicNotes size={32} className="text-warm-300 dark:text-warm-600" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-warm-950/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
          <Play size={20} weight="fill" className="text-white" />
        </div>
      </div>
      <div className="p-3">
        {editing ? (
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={handleRename}
            onKeyDown={(e) => { if (e.key === 'Enter') handleRename(); if (e.key === 'Escape') { setName(playlist.name); setEditing(false); } }}
            className="w-full text-sm font-medium bg-transparent border-b border-rose-300 dark:border-rose-600 outline-none text-warm-800 dark:text-warm-200 pb-0.5"
          />
        ) : (
          <div className="flex items-center gap-1.5">
            <p
              className="text-sm font-medium text-warm-800 dark:text-warm-200 truncate flex-1 cursor-pointer"
              onClick={() => setEditing(true)}
              title="rename"
            >
              {playlist.name}
            </p>
            <button onClick={() => setEditing(true)} className="text-warm-400 hover:text-warm-600 dark:text-warm-500 dark:hover:text-warm-300 transition-colors p-0.5 opacity-0 group-hover:opacity-100">
              <PencilSimple size={12} />
            </button>
            <button onClick={() => onDelete(playlist.id)} className="text-warm-400 hover:text-rose-500 transition-colors p-0.5 opacity-0 group-hover:opacity-100">
              <Trash size={12} />
            </button>
          </div>
        )}
        <p className="text-[10px] text-warm-400 dark:text-warm-500 mt-1">{formatCount(playlist.tracks?.length)}</p>
      </div>
    </div>
  );
}

export default function PlaylistsView({ playlists, currentTrack, playing, onPlay, onRename, onDelete, onCreate, onRemoveTrack }) {
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');

  function handleCreate() {
    const trimmed = newName.trim();
    if (!trimmed) return;
    onCreate(trimmed);
    setNewName('');
    setCreating(false);
  }

  if (selectedPlaylist) {
    const pl = playlists.find((p) => p.id === selectedPlaylist.id) || selectedPlaylist;
    return (
      <section className="animate-fade-in">
        <div className="flex items-center gap-3 mb-5">
          <button onClick={() => setSelectedPlaylist(null)} className="p-2 rounded-xl text-warm-400 hover:text-warm-600 hover:bg-warm-200/50 transition-all dark:text-warm-500 dark:hover:text-warm-300 dark:hover:bg-warm-800/50">
            <ArrowLeft size={16} weight="bold" />
          </button>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-semibold text-warm-800 dark:text-warm-200 truncate">{pl.name}</h2>
            <p className="text-[11px] text-warm-400 dark:text-warm-500">{formatCount(pl.tracks?.length)}</p>
          </div>
        </div>

        {pl.tracks?.length > 0 ? (
          <div className="space-y-0.5">
            {pl.tracks.map((track, i) => (
              <div
                key={`${track.videoId}-${i}`}
                className="group flex items-center gap-3 p-2.5 rounded-xl transition-all hover:bg-warm-100 dark:hover:bg-warm-800/50"
              >
                <button
                  onClick={() => onPlay(pl, i)}
                  className="w-9 h-9 rounded-lg overflow-hidden bg-warm-200 dark:bg-warm-800 shrink-0 flex items-center justify-center"
                >
                  {track.thumbnail ? (
                    <img src={track.thumbnail} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Play size={12} className="text-warm-400" />
                  )}
                </button>
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onPlay(pl, i)}>
                  <p className={`text-xs font-medium truncate ${track.videoId === currentTrack?.videoId ? 'text-rose-600 dark:text-rose-400' : 'text-warm-800 dark:text-warm-200'}`}>
                    {track.title || track.name}
                  </p>
                  <p className="text-[11px] text-warm-500 dark:text-warm-400 truncate">{getArtistName(track)}</p>
                </div>
                <button
                  onClick={() => onRemoveTrack(pl.id, track.videoId)}
                  className="text-warm-400 hover:text-rose-500 transition-all p-1 opacity-0 group-hover:opacity-100"
                >
                  <Trash size={14} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <MusicNotes size={36} className="text-warm-300 dark:text-warm-700 mx-auto mb-3" />
            <p className="text-sm text-warm-400 dark:text-warm-500">this playlist is empty</p>
            <p className="text-xs text-warm-300 dark:text-warm-600 mt-1">add tracks from the player</p>
          </div>
        )}
      </section>
    );
  }

  return (
    <section className="animate-fade-in">
      <div className="flex items-center gap-2 mb-5">
        <MusicNotes size={16} className="text-rose-400" />
        <h2 className="text-sm font-medium text-warm-700 dark:text-warm-300">playlists</h2>
        <span className="text-[11px] text-warm-400 dark:text-warm-500 ml-auto">{playlists.length} total</span>
        {creating ? (
          <div className="flex items-center gap-1.5">
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onBlur={() => { if (!newName.trim()) setCreating(false); }}
              onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') { setCreating(false); setNewName(''); } }}
              placeholder="playlist name"
              className="w-36 text-xs bg-warm-100 dark:bg-warm-800 rounded-lg px-2.5 py-1.5 outline-none text-warm-700 dark:text-warm-300 border border-warm-200 dark:border-warm-700"
            />
            <button onClick={handleCreate} className="text-xs text-rose-500 hover:text-rose-600 font-medium">save</button>
            <button onClick={() => { setCreating(false); setNewName(''); }} className="text-xs text-warm-400 hover:text-warm-600"><X size={14} /></button>
          </div>
        ) : (
          <button onClick={() => setCreating(true)} className="flex items-center gap-1 text-[11px] text-rose-500 hover:text-rose-600 transition-colors font-medium">
            <Plus size={14} weight="bold" />
            new playlist
          </button>
        )}
      </div>

      {playlists.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {playlists.map((pl) => (
            <PlaylistCard
              key={pl.id}
              playlist={pl}
              onSelect={setSelectedPlaylist}
              onRename={onRename}
              onDelete={onDelete}
              onPlay={onPlay}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <MusicNotes size={36} className="text-warm-300 dark:text-warm-700 mx-auto mb-3" />
          <p className="text-sm text-warm-400 dark:text-warm-500">no playlists yet</p>
          <p className="text-xs text-warm-300 dark:text-warm-600 mt-1">create your first playlist</p>
        </div>
      )}
    </section>
  );
}
