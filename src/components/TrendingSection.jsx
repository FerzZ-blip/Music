import { Play, Pause, Clock, MusicNote, TrendingUp, ChartBar, Star } from '@phosphor-icons/react';
import { useState, useEffect } from 'react';
import { getTrending, getTopTracks, getCharts } from '../api/verome';
import { normalizeTracks } from '../utils';
import TrackList from './TrackList';

const tabs = [
  { id: 'trending', label: 'on repeat', icon: TrendingUp },
  { id: 'top', label: 'the hits', icon: Star },
  { id: 'charts', label: 'charts', icon: ChartBar },
];

export default function TrendingSection({ onPlay, currentTrack, playing }) {
  const [activeTab, setActiveTab] = useState('trending');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    async function fetchData() {
      try {
        let result;
        if (activeTab === 'trending') result = await getTrending();
        else if (activeTab === 'top') result = await getTopTracks();
        else result = await getCharts();
        if (!cancelled) setData(result);
      } catch {
        if (!cancelled) setData([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();
    return () => { cancelled = true; };
  }, [activeTab]);

  const tracks = normalizeTracks(Array.isArray(data) ? data : data?.tracks || []);

  const TabIcon = tabs.find((t) => t.id === activeTab)?.icon || TrendingUp;

  return (
    <section className="animate-fade-in">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <TabIcon size={15} weight="fill" className="text-rose-400" />
          <h2 className="text-sm font-semibold text-warm-700 dark:text-warm-300 tracking-wide uppercase">{tabs.find((t) => t.id === activeTab)?.label}</h2>
          <span className="text-[10px] text-warm-400 dark:text-warm-500">{tracks.length} tracks</span>
        </div>
        <div className="flex gap-1 bg-warm-100 dark:bg-warm-900/80 rounded-xl p-0.5 border border-warm-200/50 dark:border-warm-800/50">
          {tabs.map((tab) => {
            const TIcon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-white dark:bg-warm-800 text-rose-500 dark:text-rose-300 shadow-xs'
                    : 'text-warm-500 hover:text-warm-700 dark:text-warm-500 dark:hover:text-warm-300'
                }`}
              >
                <TIcon size={12} weight={activeTab === tab.id ? 'fill' : 'regular'} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
      <TrackList
        tracks={tracks}
        onPlay={onPlay}
        currentTrack={currentTrack}
        playing={playing}
        loading={loading}
      />
    </section>
  );
}
