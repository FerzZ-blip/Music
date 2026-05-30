import { useState, useEffect } from 'react';
import { getTrending, getTopTracks, getRadio, getMoods, searchTracks } from '../api/verome';
import { getHotTracks, parseEid } from '../api/openwhyd';
import { normalizeTracks } from '../utils';
import TrackList from './TrackList';
import MoodGrid from './MoodGrid';
import FeedbackSection from './FeedbackSection';
import { Play, DotsThree, Radio, CaretRight, TrendUp, VinylRecord, MusicNotes, Compass } from '@phosphor-icons/react';
import { getArtistName } from '../utils';

export default function HomeView({ onPlay, currentTrack, playing, onAddToQueue, onLogin }) {
  const [trending, setTrending] = useState(null);
  const [topTracks, setTopTracks] = useState(null);
  const [curated, setCurated] = useState(null);
  const [moodTracks, setMoodTracks] = useState(null);
  const [activeMood, setActiveMood] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function fetchAll() {
      try {
        const [trend, top, hot] = await Promise.all([
          getTrending(),
          getTopTracks(),
          getHotTracks(),
        ]);
        if (!cancelled) {
          setTrending(normalizeTracks(trend?.tracks?.slice(0, 10)));
          setTopTracks(normalizeTracks(top?.tracks?.slice(0, 15)));
          setCurated(Array.isArray(hot) ? hot.slice(0, 8) : []);
        }
      } catch {} finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchAll();
    return () => { cancelled = true; };
  }, []);

  async function handleMoodSelect(mood) {
    setActiveMood(mood);
    try {
      const data = await searchTracks(mood, 'songs');
      setMoodTracks(normalizeTracks(data?.results?.slice(0, 15)));
    } catch {
      setMoodTracks([]);
    }
  }

  function handleOpenwhydPlay(track) {
    const eid = parseEid(track.eId);
    if (eid.type === 'youtube') {
      onPlay({ videoId: eid.id, title: track.name, artist: track.uNm, thumbnail: track.img });
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="w-28 h-28 rounded-2xl bg-warm-200/60 dark:bg-warm-800/60 animate-pulse-soft shrink-0" />
          ))}
        </div>
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-warm-200/60 dark:bg-warm-800/60 animate-pulse-soft" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-4">
      <MoodGrid onMoodSelect={handleMoodSelect} />

      {moodTracks && activeMood && (
        <section className="animate-fade-in-up">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MusicNotes size={14} weight="fill" className="text-rose-400" />
              <h2 className="text-sm font-semibold text-rose-600 dark:text-rose-400 tracking-wide uppercase">{activeMood}</h2>
            </div>
            <button onClick={() => { setMoodTracks(null); setActiveMood(null); }} className="text-[11px] text-warm-400 hover:text-warm-600 dark:text-warm-500 dark:hover:text-warm-300 transition-colors">
              clear
            </button>
          </div>
          <TrackList tracks={moodTracks} onPlay={onPlay} currentTrack={currentTrack} playing={playing} onAddToQueue={onAddToQueue} />
        </section>
      )}

      <section className="animate-fade-in-up stagger-1">
        <div className="flex items-center gap-2 mb-4">
          <TrendUp size={14} weight="fill" className="text-rose-400" />
          <h2 className="text-sm font-semibold text-warm-700 dark:text-warm-300 tracking-wide uppercase">on repeat</h2>
          {trending && trending.length > 0 && (
            <span className="text-[10px] text-warm-400 dark:text-warm-500">{trending.length} tracks</span>
          )}
        </div>

        {trending && trending.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            {trending.slice(0, 2).map((track, i) => (
              <div
                key={track.videoId || i}
                onClick={() => onPlay(track)}
                className={`group relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-md active:scale-[0.99] ${
                  i === 0
                    ? 'bg-gradient-to-br from-rose-100 to-rose-200 dark:from-rose-900/50 dark:to-rose-800/30 md:col-span-1'
                    : 'bg-warm-100 dark:bg-warm-900/60'
                }`}
              >
                <div className="flex items-center gap-4 p-4">
                  <div className={`relative rounded-xl overflow-hidden bg-warm-200 shrink-0 shadow-xs ${
                    i === 0 ? 'w-16 h-16' : 'w-14 h-14'
                  }`}>
                    {track.thumbnail && (
                      <img src={track.thumbnail} alt="" className="w-full h-full object-cover" />
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                      <div className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-md">
                        <Play size={14} weight="fill" className="text-warm-800 ml-0.5" />
                      </div>
                    </div>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-warm-800 dark:text-warm-200 truncate">{track.name || track.title}</p>
                    <p className="text-xs text-warm-500 dark:text-warm-400 truncate mt-0.5">{getArtistName(track)}</p>
                  </div>
                  {i === 0 && (
                    <span className="text-[10px] text-rose-500 dark:text-rose-400 font-medium shrink-0 self-start mt-0.5">#1</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <TrackList
          tracks={trending?.slice(2)}
          onPlay={onPlay}
          currentTrack={currentTrack}
          playing={playing}
          onAddToQueue={onAddToQueue}
        />
      </section>

      {curated && curated.length > 0 && (
        <section className="animate-fade-in-up stagger-2">
          <div className="flex items-center gap-2 mb-4">
            <Compass size={14} weight="fill" className="text-peri-400" />
            <h2 className="text-sm font-semibold text-warm-700 dark:text-warm-300 tracking-wide uppercase">dig this</h2>
            <span className="text-[10px] text-warm-400 dark:text-warm-500">via openwhyd</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-2.5">
            {curated.map((track, i) => {
              const eid = parseEid(track.eId);
              const isLarge = i === 0;
              return (
                <button
                  key={track._id || i}
                  onClick={() => handleOpenwhydPlay(track)}
                  className="group text-left"
                  disabled={eid.type !== 'youtube'}
                >
                  <div className={`rounded-xl overflow-hidden bg-warm-200 dark:bg-warm-800 mb-2 relative shadow-xs ${
                    isLarge ? 'aspect-square' : 'aspect-square'
                  }`}>
                    {track.img ? (
                      <img src={track.img} alt="" className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-warm-300 dark:text-warm-600">
                        <MusicNotes size={24} />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                      <div className="w-9 h-9 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-md translate-y-1 group-hover:translate-y-0">
                        <Play size={14} weight="fill" className="text-warm-800 ml-0.5" />
                      </div>
                    </div>
                  </div>
                  <p className="text-xs font-medium text-warm-800 dark:text-warm-200 truncate">{track.name}</p>
                  <p className="text-[10px] text-warm-500 dark:text-warm-400 truncate">{track.uNm}</p>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {topTracks && topTracks.length > 0 && (
        <section className="animate-fade-in-up stagger-3">
          <div className="flex items-center gap-2 mb-4">
            <VinylRecord size={14} weight="fill" className="text-sage-400" />
            <h2 className="text-sm font-semibold text-warm-700 dark:text-warm-300 tracking-wide uppercase">the hits</h2>
            <span className="text-[10px] text-warm-400 dark:text-warm-500">charting now</span>
          </div>
          <TrackList
            tracks={topTracks}
            onPlay={onPlay}
            currentTrack={currentTrack}
            playing={playing}
            onAddToQueue={onAddToQueue}
          />
        </section>
      )}

      <FeedbackSection onLogin={onLogin} />
    </div>
  );
}
