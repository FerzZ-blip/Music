import { useState, useRef, useEffect, useCallback } from 'react';
import { getSong, searchTracks } from './api/verome';
import { normalizeTrack, hdThumb, getArtistName } from './utils';
import useYouTubePlayer from './hooks/useYouTubePlayer';
import useDiscordPresence from './hooks/useDiscordPresence';
import { prefetchLyrics } from './hooks/useLyrics';
import { useAuth } from './contexts/AuthContext';
import Sidebar from './components/Sidebar';
import MobileNav from './components/MobileNav';
import SearchBar from './components/SearchBar';
import Player from './components/Player';
import HomeView from './components/HomeView';
import NowPlayingView from './components/NowPlayingView';
import QueuePanel from './components/QueuePanel';
import LyricsPanel from './components/LyricsPanel';
import TrackList from './components/TrackList';
import LoginModal from './components/LoginModal';
import LoadingScreen from './components/LoadingScreen';
import BottomSheet from './components/BottomSheet';
import PlaylistsView from './components/PlaylistsView';
import AddToPlaylistModal from './components/AddToPlaylistModal';
import { Sparkle, User, MusicNotes, Heart, ClockCounterClockwise, List } from '@phosphor-icons/react';
import { isNative } from './lib/capacitor';

function tryHaptic() {
  if (!isNative()) return;
  import('@capacitor/haptics').then(({ Haptics }) => {
    Haptics.impact({ style: 'light' }).catch(() => {});
  }).catch(() => {});
}

export default function App() {
  const [activeView, setActiveView] = useState('home');
  const [searchResults, setSearchResults] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [lyricsOpen, setLyricsOpen] = useState(false);
  const [queueOpen, setQueueOpen] = useState(false);
  const [queue, setQueue] = useState([]);
  const [queueIndex, setQueueIndex] = useState(-1);

  const [showNowPlaying, setShowNowPlaying] = useState(false);
  const [volume, setVolumeState] = useState(0.7);
  const [repeat, setRepeat] = useState('off');
  const [shuffle, setShuffle] = useState(false);
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark');
  const [likedTracks, setLikedTracks] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('liked') || '[]')); }
    catch { return new Set(); }
  });
  const [savedTracks, setSavedTracks] = useState(() => {
    try { return JSON.parse(localStorage.getItem('saved') || '[]'); }
    catch { return []; }
  });
  const [history, setHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem('history') || '[]'); }
    catch { return []; }
  });
  const [playlists, setPlaylists] = useState(() => {
    try { return JSON.parse(localStorage.getItem('playlists') || '[]'); }
    catch { return []; }
  });
  const [pullRefresh, setPullRefresh] = useState(false);
  const pullStart = useRef(0);
  const pullY = useRef(0);

  const [playlistModalOpen, setPlaylistModalOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setPageLoading(false), 2000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes('access_token')) {
      const params = new URLSearchParams(hash.replace('#', ''));
      const data = { type: 'discord-auth', state: params.get('state'), access_token: params.get('access_token'), error: params.get('error') };
      if (window.opener) {
        window.opener.postMessage(data, window.location.origin);
        window.close();
      }
      window.location.hash = '';
    }
  }, []);

  const queueRef = useRef(queue);
  const queueIndexRef = useRef(queueIndex);
  const repeatRef = useRef(repeat);
  const shuffleRef = useRef(shuffle);
  const playTrackRef = useRef(null);
  const seekRef = useRef(null);
  const currentTrackRef = useRef(null);

  useEffect(() => { queueRef.current = queue; }, [queue]);
  useEffect(() => { queueIndexRef.current = queueIndex; }, [queueIndex]);
  useEffect(() => { repeatRef.current = repeat; }, [repeat]);
  useEffect(() => { shuffleRef.current = shuffle; }, [shuffle]);
  useEffect(() => { playTrackRef.current = playTrack; });
  useEffect(() => { seekRef.current = yt.seek; });
  useEffect(() => { currentTrackRef.current = yt.currentTrack; });
  useEffect(() => { localStorage.setItem('liked', JSON.stringify([...likedTracks])); }, [likedTracks]);
  useEffect(() => { localStorage.setItem('saved', JSON.stringify(savedTracks)); }, [savedTracks]);
  useEffect(() => { localStorage.setItem('history', JSON.stringify(history)); }, [history]);
  useEffect(() => { localStorage.setItem('playlists', JSON.stringify(playlists)); }, [playlists]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
    if (isNative()) {
      import('@capacitor/status-bar').then(({ StatusBar }) => {
        StatusBar.setStyle({ style: dark ? 'DARK' : 'LIGHT' });
      }).catch(() => {});
    }
  }, [dark]);

  const handleTrackEnd = useCallback(() => {
    const r = repeatRef.current;
    const q = queueRef.current;
    const qi = queueIndexRef.current;
    const ct = currentTrackRef.current;

    if (r === 'one') {
      if (q[qi]) playTrackRef.current?.(q[qi], qi, false);
      else seekRef.current?.(0);
      return;
    }

    if (q.length === 0) return;

    if (shuffleRef.current) {
      const remaining = q.filter((_, i) => i !== qi);
      if (remaining.length > 0) {
        const pick = remaining[Math.floor(Math.random() * remaining.length)];
        playTrackRef.current?.(pick, q.indexOf(pick), false);
      }
      return;
    }

    let next = qi + 1;
    while (next < q.length && q[next]?.videoId === ct?.videoId) {
      next++;
    }
    if (next < q.length) {
      playTrackRef.current?.(q[next], next, false);
    } else if (r === 'all') {
      playTrackRef.current?.(q[0], 0, false);
    }
  }, []);

  const yt = useYouTubePlayer();
  const { bridgeConnected, discordConnected } = useDiscordPresence(yt.currentTrack, yt.playing);
  const { user: googleUser, discord: discordUser } = useAuth();
  const avatar = googleUser?.photoURL || (discordUser?.user?.avatar && `https://cdn.discordapp.com/avatars/${discordUser.user.id}/${discordUser.user.avatar}.webp?size=64`);

  useEffect(() => {
    if (yt.currentTrack) prefetchLyrics(yt.currentTrack);
  }, [yt.currentTrack]);

  useEffect(() => {
    if (!yt.trackEndedAt) return;
    handleTrackEnd();
  }, [yt.trackEndedAt, handleTrackEnd]);

  function playTrack(track, idx, addToQueue) {
    if (!track) return;
    const trackId = track.videoId || track.id;
    if (!trackId) return;

    if (!addToQueue) {
      setHistory((prev) => {
        const entry = { ...track, videoId: trackId, playedAt: Date.now() };
        const filtered = prev.filter((t) => t.videoId !== trackId);
        return [entry, ...filtered].slice(0, 100);
      });
    }

    if (addToQueue) {
      const exists = queue.find((t) => t.videoId === trackId);
      if (exists) return;
      setQueue((prev) => [...prev, track]);
      if (queue.length === 0) {
        setQueueIndex(0);
        playTrack(track, 0, false);
      }
      return;
    }

    if (yt.currentTrack?.videoId === trackId) {
      yt.togglePlay();
      return;
    }

    const meta = normalizeTrack({ ...track, videoId: trackId });
    getSong(trackId)
      .then((data) => {
        if (!meta.thumbnail && data?.song?.thumbnail) meta.thumbnail = data.song.thumbnail;
        if (!getArtistName(meta) && data?.artist?.name) meta.artist = { name: data.artist.name, id: data.artist.browseId || null };
        if (!meta.artistName) meta.artistName = getArtistName(meta);
        if (data?.album && !meta.album) meta.album = data.album;
      })
      .catch(() => {})
      .finally(() => {
        setQueueIndex(idx !== undefined ? idx : -1);
        yt.play(meta);
      });
  }

  function setPlaying(v) {}

  function handlePlay(track) {
    tryHaptic();
    playTrack(track, -1, false);
  }

  function handleTogglePlay() {
    tryHaptic();
    yt.togglePlay();
  }

  function handleSeek(time) {
    yt.seek(time);
  }

  function handleVolume(v) {
    setVolumeState(v);
    yt.setVolume(v);
  }

  function handlePrev() {
    tryHaptic();
    if (queue.length > 0 && queueIndex > 0) {
      playTrack(queue[queueIndex - 1], queueIndex - 1, false);
    }
  }

  function handleNext() {
    tryHaptic();
    if (shuffle && queue.length > 0) {
      const remaining = queue.filter((_, i) => i !== queueIndex);
      if (remaining.length > 0) {
        const pick = remaining[Math.floor(Math.random() * remaining.length)];
        playTrack(pick, queue.indexOf(pick), false);
      }
      return;
    } else if (queue.length > 0) {
      let next = queueIndex + 1;
      while (next < queue.length && queue[next]?.videoId === yt.currentTrack?.videoId) {
        next++;
      }
      if (next < queue.length) {
        playTrack(queue[next], next, false);
      } else if (repeat === 'all') {
        playTrack(queue[0], 0, false);
      }
    }
  }

  function handleQueueRemove(i) {
    setQueue((prev) => prev.filter((_, idx) => idx !== i));
    if (i === queueIndex) {
      if (queue.length > 1) {
        const newIdx = i < queue.length - 1 ? i : i - 1;
        setQueueIndex(Math.max(0, newIdx));
        playTrack(queue[Math.max(0, newIdx)], Math.max(0, newIdx), false);
      } else {
        setQueueIndex(-1);
        yt.stop();
      }
    } else if (i < queueIndex) {
      setQueueIndex((prev) => prev - 1);
    }
  }

  function handleQueueClear() {
    setQueue([]);
    setQueueIndex(-1);
    yt.stop();
    setQueueOpen(false);
  }

  async function handleSearch(query) {
    setSearchQuery(query);
    setActiveView('home');
    if (!query.trim()) { setSearchResults(null); return; }
    setSearchLoading(true);
    try {
      const data = await searchTracks(query);
      setSearchResults((data?.results || []).map(normalizeTrack));
    } catch { setSearchResults([]); }
    finally { setSearchLoading(false); }
  }

  async function handleSearchAcross(query) {
    setSearchQuery(query);
    if (!query.trim()) return;
    setSearchLoading(true);
    try {
      const [songData, albumData, artistData] = await Promise.all([
        searchTracks(query, 'songs').catch(() => ({ results: [] })),
        searchTracks(query, 'albums').catch(() => ({ results: [] })),
        searchTracks(query, 'artists').catch(() => ({ results: [] })),
      ]);
      setSearchResults({
        songs: (songData?.results || []).map(normalizeTrack),
        albums: albumData?.results || [],
        artists: artistData?.results || [],
      });
    } catch { setSearchResults({ songs: [], albums: [], artists: [] }); }
    finally { setSearchLoading(false); }
  }

  function handleNavigate(view) {
    setActiveView(view);
    setSearchResults(null);
    setSearchQuery('');
    setSidebarOpen(false);
  }

  function handleOpenNowPlaying() {
    if (yt.currentTrack) setShowNowPlaying(true);
  }

  function handleCloseNowPlaying() {
    setShowNowPlaying(false);
  }

  function handleToggleShuffle() {
    setShuffle((s) => !s);
  }

  function handleToggleLike(track) {
    if (!track?.videoId) return;
    setLikedTracks((prev) => {
      const next = new Set(prev);
      if (next.has(track.videoId)) next.delete(track.videoId);
      else next.add(track.videoId);
      return next;
    });
  }

  function handleSaveTrack(track) {
    if (!track?.videoId) return;
    setSavedTracks((prev) => {
      const exists = prev.find((t) => t.videoId === track.videoId);
      if (exists) return prev.filter((t) => t.videoId !== track.videoId);
      return [track, ...prev];
    });
  }

  function handleAddToQueue() {
    const track = yt.currentTrack;
    if (!track?.videoId) return;
    const exists = queue.find((t) => t.videoId === track.videoId);
    if (exists) return;
    setQueue((prev) => [...prev, track]);
    setQueueIndex(queue.length);
  }

  function handleAddTrackToQueue(track) {
    const id = track?.videoId || track?.id;
    if (!id) return;
    const exists = queue.find((t) => (t.videoId || t.id) === id);
    if (exists) return;
    setQueue((prev) => [...prev, { ...track, videoId: id }]);
    if (!yt.currentTrack) {
      setQueueIndex(0);
      playTrack(track, 0, false);
    } else if (yt.currentTrack.videoId === id) {
      setQueueIndex(queue.length);
    }
  }

  function handleQueueMove(from, to) {
    if (to < 0 || to >= queue.length) return;
    setQueue((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
    if (queueIndex === from) setQueueIndex(to);
    else if (from < queueIndex && to >= queueIndex) setQueueIndex((i) => i - 1);
    else if (from > queueIndex && to <= queueIndex) setQueueIndex((i) => i + 1);
  }

  function handleAddToPlaylist(track, playlistId) {
    if (!track?.videoId) return;
    setPlaylists((prev) => prev.map((pl) => {
      if (pl.id !== playlistId) return pl;
      if (pl.tracks.some((t) => t.videoId === track.videoId)) return pl;
      return { ...pl, tracks: [...pl.tracks, track] };
    }));
  }

  function handleCreatePlaylist(name) {
    const id = `pl_${Date.now()}`;
    setPlaylists((prev) => [...prev, { id, name, tracks: [], createdAt: Date.now() }]);
    return id;
  }

  function handleDeletePlaylist(id) {
    setPlaylists((prev) => prev.filter((pl) => pl.id !== id));
  }

  function handleRenamePlaylist(id, name) {
    setPlaylists((prev) => prev.map((pl) => pl.id === id ? { ...pl, name } : pl));
  }

  function handleRemoveTrackFromPlaylist(playlistId, trackId) {
    setPlaylists((prev) => prev.map((pl) =>
      pl.id === playlistId ? { ...pl, tracks: pl.tracks.filter((t) => t.videoId !== trackId) } : pl
    ));
  }

  function handlePlayPlaylist(playlist, trackIndex = 0) {
    const tracks = playlist?.tracks;
    if (!tracks || tracks.length === 0) return;
    const remaining = tracks.slice(trackIndex);
    setQueue(remaining);
    setQueueIndex(0);
    playTrack(remaining[0], 0, false);
  }

  const handlePullStart = useCallback((e) => {
    if (showNowPlaying || activeView !== 'home' || searchQuery) return;
    if (window.scrollY > 0) return;
    pullStart.current = e.touches[0].clientY;
  }, [showNowPlaying, activeView, searchQuery]);

  const handlePullMove = useCallback((e) => {
    if (pullStart.current === 0) return;
    const diff = e.touches[0].clientY - pullStart.current;
    if (diff > 80) {
      pullY.current = diff;
      setPullRefresh(true);
    }
  }, []);

  const handlePullEnd = useCallback(() => {
    if (pullRefresh) {
      setPullRefresh(false);
      window.location.reload();
    }
    pullStart.current = 0;
  }, [pullRefresh]);

  function renderContent() {
    if (showNowPlaying) {
      return (
        <NowPlayingView
          track={yt.currentTrack}
          playing={yt.playing}
          progress={yt.progress}
          duration={yt.duration}
          volume={volume}
          error={yt.error}
          onTogglePlay={handleTogglePlay}
          onSeek={handleSeek}
          onVolume={handleVolume}
          onPrev={handlePrev}
          onNext={handleNext}
          onClose={handleCloseNowPlaying}
          onLyrics={() => setLyricsOpen(true)}
          repeat={repeat}
          onRepeat={setRepeat}
          shuffle={shuffle}
          onShuffle={handleToggleShuffle}
          liked={yt.currentTrack ? likedTracks.has(yt.currentTrack.videoId) : false}
          onLike={() => handleToggleLike(yt.currentTrack)}
          saved={yt.currentTrack ? savedTracks.some((t) => t.videoId === yt.currentTrack.videoId) : false}
          onSave={() => handleSaveTrack(yt.currentTrack)}
          onAddToQueue={handleAddToQueue}
          onAddToPlaylist={() => setPlaylistModalOpen(true)}
        />
      );
    }

    if (searchResults && searchQuery && (searchResults.songs || Array.isArray(searchResults))) {
      if (Array.isArray(searchResults)) {
        return (
          <section className="animate-fade-in">
            <div className="flex items-center gap-2 mb-5">
              <h2 className="text-sm text-warm-500 dark:text-warm-400">found in the stacks — <span className="text-warm-700 dark:text-warm-200 font-medium">"{searchQuery}"</span></h2>
              <span className="text-xs text-warm-400 dark:text-warm-500 ml-auto">{searchResults.length} tracks</span>
            </div>
            <TrackList tracks={searchResults} onPlay={handlePlay} currentTrack={yt.currentTrack} playing={yt.playing} onAddToQueue={handleAddTrackToQueue} />
          </section>
        );
      }

      const { songs = [] } = searchResults;
      return (
        <div className="space-y-8 animate-fade-in">
          <h2 className="text-sm text-warm-500 dark:text-warm-400">found in the stacks — <span className="text-warm-700 dark:text-warm-200 font-medium">"{searchQuery}"</span></h2>

          {songs.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <MusicNotes size={14} className="text-rose-400 dark:text-rose-300" />
                <h3 className="text-xs font-semibold text-warm-600 dark:text-warm-400 uppercase tracking-wide">songs</h3>
                <span className="text-[10px] text-warm-400 dark:text-warm-500">{songs.length}</span>
              </div>
              <TrackList tracks={songs} onPlay={handlePlay} currentTrack={yt.currentTrack} playing={yt.playing} onAddToQueue={handleAddTrackToQueue} />
            </section>
          )}
        </div>
      );
    }

    if (activeView === 'spins') {
      return (
        <section className="animate-fade-in">
          <div className="flex items-center gap-2 mb-5">
            <ClockCounterClockwise size={16} className="text-rose-400" />
            <h2 className="text-sm font-medium text-warm-700 dark:text-warm-300">history</h2>
            <span className="text-[11px] text-warm-400 dark:text-warm-500 ml-auto">{history.length} played</span>
            {history.length > 0 && (
              <button onClick={() => setHistory([])} className="text-[11px] text-warm-400 hover:text-rose-500 transition-colors">clear</button>
            )}
          </div>
          {history.length > 0 ? (
            <TrackList tracks={history} onPlay={handlePlay} currentTrack={yt.currentTrack} playing={yt.playing} onAddToQueue={handleAddTrackToQueue} />
            ) : (
              <p className="text-sm text-warm-400 text-center py-8">nothing on the turntable</p>
            )}
        </section>
      );
    }

    if (activeView === 'crate') {
      return (
        <section className="animate-fade-in">
          <div className="flex items-center gap-2 mb-5">
            <Heart size={16} className="text-rose-400" />
            <h2 className="text-sm font-medium text-warm-700 dark:text-warm-300">favorites</h2>
            <span className="text-[11px] text-warm-400 dark:text-warm-500 ml-auto">{savedTracks.length} saved</span>
          </div>
          {savedTracks.length > 0 ? (
            <TrackList tracks={savedTracks} onPlay={handlePlay} currentTrack={yt.currentTrack} playing={yt.playing} onAddToQueue={handleAddTrackToQueue} />
          ) : (
            <div className="text-center py-16">
              <Heart size={36} className="text-warm-300 dark:text-warm-700 mx-auto mb-3" />
              <p className="text-sm text-warm-400 dark:text-warm-500">empty crate</p>
              <p className="text-xs text-warm-300 dark:text-warm-600 mt-1">save tracks to your crate</p>
            </div>
          )}
        </section>
      );
    }

    if (activeView === 'playlists') {
      return (
        <PlaylistsView
          playlists={playlists}
          currentTrack={yt.currentTrack}
          playing={yt.playing}
          onPlay={handlePlayPlaylist}
          onRename={handleRenamePlaylist}
          onDelete={handleDeletePlaylist}
          onCreate={handleCreatePlaylist}
          onRemoveTrack={handleRemoveTrackFromPlaylist}
        />
      );
    }

    return <HomeView onPlay={handlePlay} currentTrack={yt.currentTrack} playing={yt.playing} onAddToQueue={handleAddTrackToQueue} onLogin={() => setLoginOpen(true)} />;
  }

  return (
    <div className="min-h-[100dvh] flex flex-col app-container">
      {pageLoading && <LoadingScreen message="tuning the frequencies..." />}
      {!showNowPlaying && (
        <>
          <Sidebar activeView={activeView} onNavigate={handleNavigate} dark={dark} onThemeToggle={() => setDark((d) => !d)} onLogin={() => setLoginOpen(true)} open={sidebarOpen} onToggle={() => setSidebarOpen((s) => !s)} />
          <MobileNav activeView={activeView} onNavigate={handleNavigate} dark={dark} onThemeToggle={() => setDark((d) => !d)} />
        </>
      )}

      <main
        className={`flex-1 px-4 md:px-10 pt-4 md:pt-5 pb-[152px] md:pb-[76px] ${showNowPlaying ? 'ml-0 max-w-none' : 'md:ml-20 max-w-5xl'}`}
        onTouchStart={handlePullStart}
        onTouchMove={handlePullMove}
        onTouchEnd={handlePullEnd}
      >
        {pullRefresh && (
          <div className="flex items-center justify-center py-4">
            <div className="w-5 h-5 border-2 border-rose-300 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {!showNowPlaying && (
          <div className="flex items-center justify-between mb-6 md:mb-7 app-header">
            <div className="flex items-center gap-2 md:gap-3">
              <button onClick={() => setSidebarOpen((s) => !s)} className="md:hidden w-9 h-9 rounded-xl flex items-center justify-center text-warm-400 hover:text-warm-600 hover:bg-warm-200/50 transition-all dark:text-warm-500 dark:hover:text-warm-300 dark:hover:bg-warm-800/50">
                <List size={18} weight="bold" />
              </button>
              <Sparkle size={20} weight="fill" className="text-rose-400 dark:text-rose-300 hidden md:block" />
              <h1 className="text-base md:text-lg font-semibold text-warm-800 dark:text-warm-200 tracking-tight">lullaby</h1>
              {activeView !== 'home' && !searchQuery && (
                <span className="text-[11px] text-warm-400 bg-warm-100 dark:text-warm-500 dark:bg-warm-800/60 px-2.5 py-1 rounded-lg capitalize">{activeView}</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setLoginOpen(true)}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-warm-400 hover:text-warm-600 hover:bg-warm-200/50 transition-all dark:text-warm-500 dark:hover:text-warm-300 dark:hover:bg-warm-800/50"
                title="account"
              >
                {avatar ? (
                  <img src={avatar} alt="" className="w-6 h-6 rounded-full object-cover" />
                ) : (
                  <User size={17} />
                )}
              </button>
              <SearchBar onSearch={handleSearch} onSearchAcross={handleSearchAcross} />
            </div>
          </div>
        )}
        <div className="relative min-h-[200px]">
          {renderContent()}
          {searchLoading && (
            <LoadingScreen overlay message="sifting through the stacks..." />
          )}
        </div>
      </main>

      <div ref={yt.containerRef} className="fixed opacity-0 pointer-events-none w-0 h-0" />

      <Player
        currentTrack={yt.currentTrack}
        playing={yt.playing}
        progress={yt.progress}
        duration={yt.duration}
        volume={volume}
        error={yt.error}
        onTogglePlay={handleTogglePlay}
        onSeek={handleSeek}
        onVolume={handleVolume}
        onLyrics={() => setLyricsOpen(true)}
        onQueueToggle={() => setQueueOpen(!queueOpen)}
        onPrev={handlePrev}
        onNext={handleNext}
        onExpand={handleOpenNowPlaying}
        queueLength={queue.length}
        queueIndex={queueIndex}
        repeat={repeat}
        onRepeat={setRepeat}
        shuffle={shuffle}
        onShuffle={handleToggleShuffle}
        saved={yt.currentTrack ? savedTracks.some((t) => t.videoId === yt.currentTrack.videoId) : false}
        onSave={() => handleSaveTrack(yt.currentTrack)}
        onAddToQueue={handleAddToQueue}
        onAddToPlaylist={() => setPlaylistModalOpen(true)}
        bridgeConnected={bridgeConnected}
        discordConnected={discordConnected}
      />

      <QueuePanel
        queue={queue}
        currentIndex={queueIndex}
        visible={queueOpen}
        onClose={() => setQueueOpen(false)}
        onPlay={(track) => {
          const idx = queue.findIndex((t) => t.videoId === track.videoId);
          if (idx >= 0) playTrack(track, idx, false);
        }}
        onRemove={handleQueueRemove}
        onClear={handleQueueClear}
        onMove={handleQueueMove}
      />

      <LyricsPanel track={yt.currentTrack} visible={lyricsOpen} onClose={() => setLyricsOpen(false)} progress={yt.progress} />

      {loginOpen && <LoginModal onClose={() => setLoginOpen(false)} />}

      <AddToPlaylistModal
        visible={playlistModalOpen}
        track={yt.currentTrack}
        playlists={playlists}
        onClose={() => setPlaylistModalOpen(false)}
        onAdd={handleAddToPlaylist}
        onCreate={handleCreatePlaylist}
      />
    </div>
  );
}
