import { useState, useEffect, useRef } from 'react';
import { getMoods } from '../api/verome';
import { Cloud, Lightning, Target, SunDim, Train, Confetti, Heart, CloudRain, Moon, Barbell, GameController, MusicNotes, VinylRecord } from '@phosphor-icons/react';

const moodBg = [
  'bg-rose-200/70', 'bg-peri-200/70', 'bg-sage-200/70', 'bg-honey-200/70',
  'bg-rose-300/50', 'bg-peri-300/50', 'bg-sage-300/50', 'bg-honey-300/50',
];

const genreBg = [
  'bg-rose-100 hover:bg-rose-200 text-rose-600 hover:text-rose-800 border-rose-200/50 dark:bg-rose-900/30 dark:hover:bg-rose-800/40 dark:text-rose-400 dark:hover:text-rose-200 dark:border-rose-800/40',
  'bg-peri-100 hover:bg-peri-200 text-peri-600 hover:text-peri-800 border-peri-200/50 dark:bg-peri-900/30 dark:hover:bg-peri-800/40 dark:text-peri-400 dark:hover:text-peri-200 dark:border-peri-800/40',
  'bg-sage-100 hover:bg-sage-200 text-sage-600 hover:text-sage-800 border-sage-200/50 dark:bg-sage-900/30 dark:hover:bg-sage-800/40 dark:text-sage-400 dark:hover:text-sage-200 dark:border-sage-800/40',
  'bg-honey-100 hover:bg-honey-200 text-honey-600 hover:text-honey-800 border-honey-200/50 dark:bg-honey-900/30 dark:hover:bg-honey-800/40 dark:text-honey-400 dark:hover:text-honey-200 dark:border-honey-800/40',
  'bg-warm-100 hover:bg-warm-200 text-warm-600 hover:text-warm-800 border-warm-200/50 dark:bg-warm-800/60 dark:hover:bg-warm-700/60 dark:text-warm-400 dark:hover:text-warm-200 dark:border-warm-700/50',
];

const moodIcons = {
  Chill: Cloud,
  Energize: Lightning,
  Focus: Target,
  'Feel good': SunDim,
  Commute: Train,
  Party: Confetti,
  Romance: Heart,
  Sad: CloudRain,
  Sleep: Moon,
  Workout: Barbell,
  Gaming: GameController,
};

const moodColors = {
  Chill: 'text-peri-500',
  Energize: 'text-honey-500',
  Focus: 'text-sage-500',
  'Feel good': 'text-honey-500',
  Commute: 'text-warm-500',
  Party: 'text-rose-500',
  Romance: 'text-rose-500',
  Sad: 'text-peri-500',
  Sleep: 'text-peri-500',
  Workout: 'text-warm-500',
  Gaming: 'text-sage-500',
};

export default function MoodGrid({ onMoodSelect }) {
  const [moods, setMoods] = useState(null);
  const [genres, setGenres] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    getMoods()
      .then((data) => {
        if (Array.isArray(data) && data.length >= 2) {
          setMoods(data[0]?.items || []);
          setGenres(data[1]?.items || []);
        }
      })
      .catch(() => {});
  }, []);

  const items = moods || [];
  if (items.length === 0) return null;

  return (
    <section className="animate-fade-in mb-10">
      <div className="flex items-center gap-2 mb-4">
        <VinylRecord size={14} weight="fill" className="text-rose-400" />
        <h2 className="text-sm font-semibold text-warm-700 dark:text-warm-300 tracking-wide uppercase">set the mood</h2>
        <span className="text-[10px] text-warm-400 dark:text-warm-500">pick a vibe</span>
      </div>
      <div className="relative">
        <div
          ref={scrollRef}
          className="flex gap-2.5 overflow-x-auto pb-2 no-scrollbar snap-x snap-mandatory"
        >
          {items.map((mood, i) => {
            const Icon = moodIcons[mood.title] || MusicNotes;
            const color = moodColors[mood.title] || 'text-rose-400';
            return (
              <button
                key={mood.title}
                onClick={() => onMoodSelect?.(mood.title)}
                className="snap-start shrink-0 group"
              >
                <div
                  className={`w-28 h-28 rounded-2xl ${moodBg[i % moodBg.length]} flex flex-col items-center justify-center transition-all duration-300 group-hover:scale-[1.04] group-hover:shadow-md active:scale-95`}
                >
                  <Icon size={22} weight="fill" className={`${color} mb-1`} />
                  <span className="text-[11px] font-medium text-warm-700 dark:text-warm-300">{mood.title}</span>
                </div>
              </button>
            );
          })}
        </div>
        <div className="absolute right-0 top-0 bottom-2 w-12 bg-gradient-to-l from-warm-50 to-transparent pointer-events-none dark:from-warm-950" />
      </div>

      {genres && genres.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center gap-2 mb-3">
            <MusicNotes size={13} weight="fill" className="text-peri-400" />
            <h2 className="text-sm font-semibold text-warm-700 dark:text-warm-300 tracking-wide uppercase">genre</h2>
            <span className="text-[10px] text-warm-400 dark:text-warm-500">find your sound</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {genres.slice(0, 12).map((genre, i) => (
              <button
                key={genre.title}
                onClick={() => onMoodSelect?.(genre.title)}
                className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all duration-200 border active:scale-95 ${genreBg[i % genreBg.length]}`}
              >
                {genre.title}
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
