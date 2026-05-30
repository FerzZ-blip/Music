import { useState, useRef, useEffect } from 'react';
import { getSong, searchTracks, getAlbum, getArtist } from './api/verome';
import { getHotTracks, parseEid } from './api/openwhyd';
import { normalizeTrack, normalizeTracks, normalizeAlbum, hdThumb, getArtistName } from './utils';
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
import { Sparkle, ArrowLeft, User, MusicNotes, MicrophoneStage, VinylRecord, Heart, ThumbsUp, ThumbsDown, ClockCounterClockwise, List } from '@phosphor-icons/react';

export default function App() {
  const [activeView, setActiveView] = useState('home');
  const [searchResults, setSearchResults] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [lyricsOpen, setLyricsOpen] = useState(false);
  const [queueOpen, setQueueOpen] = useState(false);
  const [queue, setQueue] = useState([]);
  const [queueIndex, setQueueIndex] = useState(-1);
  const [detailView, setDetailView] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
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

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);

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

  useEffect(() => { queueRef.current = queue; }, [queue]);
  useEffect(() => { queueIndexRef.current = queueIndex; }, [queueIndex]);
  useEffect(() => { repeatRef.current = repeat; }, [repeat]);
  useEffect(() => { shuffleRef.current = shuffle; }, [shuffle]);
  useEffect(() => { localStorage.setItem('liked', JSON.stringify([...likedTracks])); }, [likedTracks]);
  useEffect(() => { localStorage.setItem('saved', JSON.stringify(savedTracks)); }, [savedTracks]);
  useEffect(() => { localStorage.setItem('history', JSON.stringify(history)); }, [history]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  const yt = useYouTubePlayer();
  const { bridgeConnected, discordConnected } = useDiscordPresence(yt.currentTrack, yt.playing);
  const { user: googleUser, discord: discordUser } = useAuth();
  const avatar = googleUser?.photoURL || (discordUser?.user?.avatar && `https://cdn.discordapp.com/avatars/${discordUser.user.id}/${discordUser.user.avatar}.webp?size=64`);

  useEffect(() => {
    if (yt.currentTrack) prefetchLyrics(yt.currentTrack);
  }, [yt.currentTrack]);

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
        yt.play(meta, () => {
          setPlaying(false);
          const r = repeatRef.current;
          const q = queueRef.current;
          const qi = queueIndexRef.current;
          if (r === 'one') {
            playTrack(q[qi] || meta, qi, false);
          } else if (shuffleRef.current && q.length > 0) {
            const remaining = q.filter((_, i) => i !== qi);
            if (remaining.length > 0) {
              const pick = remaining[Math.floor(Math.random() * remaining.length)];
              playTrack(pick, q.indexOf(pick), false);
            }
          } else if (r === 'all' && q.length > 0) {
            if (qi < q.length - 1) {
              playTrack(q[qi + 1], qi + 1, false);
            } else {
              playTrack(q[0], 0, false);
            }
          } else if (q.length > 0 && qi < q.length - 1) {
            playTrack(q[qi + 1], qi + 1, false);
          }
        });
      });
  }

  function setPlaying(v) {
    // sync helper for onEnd callback since yt.playing might not be reliable in closure
  }

  function handlePlay(track) {
    playTrack(track, -1, false);
  }

  function handleTogglePlay() {
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
    if (queue.length > 0 && queueIndex > 0) {
      playTrack(queue[queueIndex - 1], queueIndex - 1, false);
    }
  }

  function handleNext() {
    if (shuffle && queue.length > 0) {
      const remaining = queue.filter((_, i) => i !== queueIndex);
      if (remaining.length > 0) {
        const pick = remaining[Math.floor(Math.random() * remaining.length)];
        playTrack(pick, queue.indexOf(pick), false);
      }
    } else if (queue.length > 0 && queueIndex < queue.length - 1) {
      playTrack(queue[queueIndex + 1], queueIndex + 1, false);
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
    setDetailView(null);
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

  async function handleNavigate(view) {
    setActiveView(view);
    setDetailView(null);
    setSearchResults(null);
    setSearchQuery('');
    if (view === 'dig') {
      try {
        const data = await getHotTracks();
        setSearchResults(Array.isArray(data) ? data.slice(0, 20) : []);
      } catch { setSearchResults([]); }
    }
  }

  function handleViewAlbum(browseId) {
    setDetailView('album');
    setDetailLoading(true);
    getAlbum(browseId)
      .then((data) => setDetailData(normalizeAlbum(data)))
      .catch(() => setDetailData(null))
      .finally(() => setDetailLoading(false));
  }

  function handleViewArtist(browseId) {
    setDetailView('artist');
    setDetailLoading(true);
    getArtist(browseId)
      .then((data) => {
        if (data?.topSongs) data.topSongs = normalizeTracks(data.topSongs);
        if (data?.topTracks) data.topTracks = normalizeTracks(data.topTracks);
        setDetailData(data);
      })
      .catch(() => setDetailData(null))
      .finally(() => setDetailLoading(false));
  }

  function handleBack() {
    setDetailView(null);
    setDetailData(null);
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

  function handleViewFromNowPlaying(type, id) {
    setShowNowPlaying(false);
    if (type === 'album') handleViewAlbum(id);
    else if (type === 'artist' && id) handleViewArtist(id);
    else if (type === 'artist' && yt.currentTrack?.artist) {
      searchTracks(yt.currentTrack.artist, 'artists').then((data) => {
        const artist = data?.results?.[0];
        if (artist?.browseId) handleViewArtist(artist.browseId);
      }).catch(() => {});
    }
  }

  function renderDetail() {
    if (!detailView || !detailData) return null;

    if (detailView === 'album') {
      const album = detailData?.album || detailData;
      const tracks = detailData?.tracks || album?.tracks || [];
      return (
        <section className="animate-fade-in-up">
          <button onClick={handleBack} className="flex items-center gap-1.5 text-xs text-warm-500 hover:text-warm-700 dark:text-warm-400 dark:hover:text-warm-200 mb-5 transition-colors">
            <ArrowLeft size={14} weight="bold" /> back
          </button>
          <div className="flex flex-col md:flex-row gap-4 md:gap-6 mb-6 md:mb-8">
            <div className="w-28 h-28 md:w-40 md:h-40 rounded-2xl overflow-hidden bg-warm-200 dark:bg-warm-800 shrink-0 shadow-md">
              {album?.thumbnail ? (
                <img src={hdThumb(album.thumbnail)} alt="" className="w-full h-full object-cover" />
              ) : album?.thumbnails?.[0]?.url ? (
                <img src={hdThumb(album.thumbnails[0].url)} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center"><VinylRecord size={40} className="text-warm-300 dark:text-warm-600" /></div>
              )}
            </div>
            <div className="flex flex-col justify-center">
              <p className="text-[11px] text-warm-400 dark:text-warm-500 uppercase tracking-wider mb-1">album</p>
              <h2 className="text-xl font-semibold text-warm-800 dark:text-warm-200 mb-1">{album?.title || album?.name}</h2>
              <p className="text-sm text-warm-500 dark:text-warm-400">{album?.artists?.map((a) => a.name).join(', ') || album?.artist?.name || ''}</p>
              {tracks.length > 0 && <p className="text-xs text-warm-400 dark:text-warm-500 mt-1">{tracks.length} tracks</p>}
            </div>
          </div>
          <TrackList tracks={tracks} onPlay={handlePlay} currentTrack={yt.currentTrack} playing={yt.playing} loading={detailLoading} />
        </section>
      );
    }

    if (detailView === 'artist') {
      const artist = detailData?.artist || detailData;
      const topSongs = detailData?.topSongs || detailData?.topTracks || [];
      return (
        <section className="animate-fade-in-up">
          <button onClick={handleBack} className="flex items-center gap-1.5 text-xs text-warm-500 hover:text-warm-700 mb-5 transition-colors">
            <ArrowLeft size={14} weight="bold" /> back
          </button>
          <div className="flex flex-col md:flex-row gap-4 md:gap-6 mb-6 md:mb-8">
            <div className="w-28 h-28 md:w-40 md:h-40 rounded-2xl overflow-hidden bg-warm-200 dark:bg-warm-800 shrink-0 shadow-md flex items-center justify-center">
              <MicrophoneStage size={40} className="text-warm-300 dark:text-warm-600" />
            </div>
            <div className="flex flex-col justify-center">
              <p className="text-[11px] text-warm-400 dark:text-warm-500 uppercase tracking-wider mb-1">artist</p>
              <h2 className="text-xl font-semibold text-warm-800 dark:text-warm-200 mb-1">{artist?.name || ''}</h2>
              {artist?.subscribers && <p className="text-xs text-warm-400 dark:text-warm-500">{artist.subscribers} subscribers</p>}
            </div>
          </div>
          {topSongs.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xs font-semibold text-warm-600 dark:text-warm-400 uppercase tracking-wide mb-3">top songs</h3>
              <TrackList tracks={topSongs} onPlay={handlePlay} currentTrack={yt.currentTrack} playing={yt.playing} />
            </div>
          )}
        </section>
      );
    }
    return null;
  }

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
          onViewAlbum={() => handleViewFromNowPlaying('album')}
          onViewArtist={() => handleViewFromNowPlaying('artist')}
        />
      );
    }

    if (detailView) return renderDetail();

    if (searchResults && searchQuery && (searchResults.songs || Array.isArray(searchResults))) {
      if (Array.isArray(searchResults)) {
        return (
          <section className="animate-fade-in">
            <div className="flex items-center gap-2 mb-5">
              <h2 className="text-sm text-warm-500 dark:text-warm-400">found in the stacks — <span className="text-warm-700 dark:text-warm-200 font-medium">"{searchQuery}"</span></h2>
              <span className="text-xs text-warm-400 dark:text-warm-500 ml-auto">{searchResults.length} tracks</span>
            </div>
            <TrackList tracks={searchResults} onPlay={handlePlay} currentTrack={yt.currentTrack} playing={yt.playing} loading={searchLoading} />
          </section>
        );
      }

      const { songs = [], albums = [], artists = [] } = searchResults;
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
              <TrackList tracks={songs} onPlay={handlePlay} currentTrack={yt.currentTrack} playing={yt.playing} loading={searchLoading} />
            </section>
          )}

          {albums.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <VinylRecord size={14} className="text-peri-400 dark:text-peri-300" />
                <h3 className="text-xs font-semibold text-warm-600 dark:text-warm-400 uppercase tracking-wide">albums</h3>
                <span className="text-[10px] text-warm-400 dark:text-warm-500">{albums.length}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 md:gap-3">
                {albums.map((album, i) => (
                  <button key={album.browseId || i} onClick={() => handleViewAlbum(album.browseId)} className="group text-left">
                    <div className="aspect-square rounded-xl overflow-hidden bg-warm-200 dark:bg-warm-800 mb-1.5 md:mb-2 shadow-xs">
                      {album.thumbnails?.[0]?.url ? (
                        <img src={hdThumb(album.thumbnails[0].url)} alt="" className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300" loading="lazy" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><VinylRecord size={28} className="text-warm-300 dark:text-warm-600" /></div>
                      )}
                    </div>
                    <p className="text-xs font-medium text-warm-800 dark:text-warm-200 truncate">{album.title}</p>
                    <p className="text-[10px] text-warm-500 dark:text-warm-400 truncate">{album.artists?.map((a) => a.name).join(', ')}</p>
                  </button>
                ))}
              </div>
            </section>
          )}

          {artists.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <MicrophoneStage size={14} className="text-sage-400 dark:text-sage-300" />
                <h3 className="text-xs font-semibold text-warm-600 dark:text-warm-400 uppercase tracking-wide">artists</h3>
                <span className="text-[10px] text-warm-400 dark:text-warm-500">{artists.length}</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {artists.map((artist, i) => (
                  <button key={artist.browseId || i} onClick={() => handleViewArtist(artist.browseId)} className="group text-left">
                    <div className="aspect-square rounded-xl overflow-hidden bg-warm-200 dark:bg-warm-800 mb-2 shadow-xs flex items-center justify-center">
                      {artist.thumbnails?.[0]?.url ? (
                        <img src={hdThumb(artist.thumbnails[0].url)} alt="" className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300" loading="lazy" />
                      ) : (
                        <MicrophoneStage size={28} className="text-warm-300 dark:text-warm-600" />
                      )}
                    </div>
                    <p className="text-xs font-medium text-warm-800 dark:text-warm-200 truncate">{artist.title || artist.name}</p>
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>
      );
    }

    if (activeView === 'dig' && !searchQuery) {
      if (!Array.isArray(searchResults)) {
        return (
          <section className="animate-fade-in">
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-14 rounded-xl bg-warm-200/60 dark:bg-warm-800/60 animate-pulse-soft" />
        ))}
            </div>
          </section>
        );
      }
      return (
        <section className="animate-fade-in">
          <div className="flex items-center gap-2 mb-5">
            <MusicNotes size={16} className="text-rose-400 dark:text-rose-300" />
            <h2 className="text-sm font-medium text-warm-700 dark:text-warm-300">dig this</h2>
            <span className="text-[11px] text-warm-400 dark:text-warm-500 ml-auto">via openwhyd</span>
          </div>
          <div className="space-y-1">
            {searchResults.length > 0 ? searchResults.map((track, i) => {
              const eid = parseEid(track.eId);
              return (
                <div
                  key={track._id || i}
                  onClick={() => { if (eid.type === 'youtube') handlePlay({ videoId: eid.id, title: track.name, artist: track.uNm, thumbnail: hdThumb(track.img) }); }}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-warm-100 dark:hover:bg-warm-800/50 cursor-pointer transition-all duration-200 group animate-fade-in"
                >
                  <div className="w-11 h-11 rounded-lg overflow-hidden bg-warm-200 dark:bg-warm-800 shrink-0 flex items-center justify-center">
                    {track.img ? <img src={hdThumb(track.img)} alt="" className="w-full h-full object-cover" loading="lazy" /> : <MusicNotes size={18} className="text-warm-400 dark:text-warm-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-warm-800 dark:text-warm-200 truncate">{track.name}</p>
                    <p className="text-xs text-warm-500 dark:text-warm-400 truncate">{track.uNm}</p>
                  </div>
                  <span className="text-xs text-warm-400 dark:text-warm-500">{track.nbP || ''}</span>
                </div>
              );
            }) : (
              <p className="text-sm text-warm-400 text-center py-8">no tracks found</p>
            )}
          </div>
        </section>
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
            <TrackList tracks={history} onPlay={handlePlay} currentTrack={yt.currentTrack} playing={yt.playing} />
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
            <TrackList tracks={savedTracks} onPlay={handlePlay} currentTrack={yt.currentTrack} playing={yt.playing} />
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

    return <HomeView onPlay={handlePlay} currentTrack={yt.currentTrack} playing={yt.playing} />;
  }

  return (
    <div className="min-h-[100dvh] flex flex-col">
      {!showNowPlaying && (
        <>
          <Sidebar activeView={activeView} onNavigate={handleNavigate} dark={dark} onThemeToggle={() => setDark((d) => !d)} onLogin={() => setLoginOpen(true)} open={sidebarOpen} onToggle={() => setSidebarOpen((s) => !s)} />
          <MobileNav activeView={activeView} onNavigate={handleNavigate} dark={dark} onThemeToggle={() => setDark((d) => !d)} />
        </>
      )}

      <main className={`flex-1 px-4 md:px-10 pt-4 md:pt-5 pb-[152px] md:pb-[76px] ${showNowPlaying ? 'ml-0 max-w-none' : 'md:ml-20 max-w-5xl'}`}>
        {!showNowPlaying && (
          <div className="flex items-center justify-between mb-6 md:mb-7">
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
        {renderContent()}
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
        liked={yt.currentTrack ? likedTracks.has(yt.currentTrack.videoId) : false}
        onLike={() => handleToggleLike(yt.currentTrack)}
        saved={yt.currentTrack ? savedTracks.some((t) => t.videoId === yt.currentTrack.videoId) : false}
        onSave={() => handleSaveTrack(yt.currentTrack)}
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
    </div>
  );
}
