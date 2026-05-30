import { useState, useEffect } from 'react';
import { Heartbeat, VinylRecord, MusicNotes, SpeakerSlash, Prohibit, PaperPlaneTilt, User, Sparkle } from '@phosphor-icons/react';
import { useAuth } from '../contexts/AuthContext';
import { submitFeedback, getFeedback } from '../api/feedback';
import { getFirebaseDb } from '../lib/firebase';
import { timeAgo } from '../utils';

const moods = [
  { value: 5, icon: Heartbeat, label: 'love it', color: 'text-rose-400' },
  { value: 4, icon: VinylRecord, label: 'great spin', color: 'text-honey-400' },
  { value: 3, icon: MusicNotes, label: 'decent track', color: 'text-warm-400' },
  { value: 2, icon: SpeakerSlash, label: 'miss', color: 'text-peri-400' },
  { value: 1, icon: Prohibit, label: 'skip', color: 'text-sage-500' },
];

export default function FeedbackSection({ onLogin }) {
  const { user, discord } = useAuth();
  const [name, setName] = useState('');
  const [mood, setMood] = useState(null);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [feedbackList, setFeedbackList] = useState(null);
  const [listLoading, setListLoading] = useState(true);
  const [fetchTick, setFetchTick] = useState(0);

  const avatar = user?.photoURL || (discord?.user?.avatar && `https://cdn.discordapp.com/avatars/${discord.user.id}/${discord.user.avatar}.webp?size=64`);
  const displayName = user?.displayName || discord?.user?.global_name || discord?.user?.username || '';
  const userId = user?.uid || discord?.user?.id || '';
  const loggedIn = !!(user || discord);

  useEffect(() => {
    if (displayName) setName(displayName);
  }, [displayName]);

  useEffect(() => {
    let cancelled = false;
    let retries = 0;

    function fetch() {
      getFeedback().then((list) => {
        if (cancelled) return;
        if (list.length === 0 && retries < 3 && !getFirebaseDb()) {
          retries++;
          setTimeout(fetch, 500);
          return;
        }
        setFeedbackList(list);
        setListLoading(false);
      });
    }

    fetch();
    return () => { cancelled = true; };
  }, [fetchTick]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!mood || !message.trim() || submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await submitFeedback({
        name: name.trim() || '',
        mood,
        message: message.trim(),
        userId,
        avatar: avatar || '',
      });

      const optimistic = {
        id: `opt_${Date.now()}`,
        name: name.trim() || '',
        mood,
        message: message.trim(),
        userId,
        avatar: avatar || '',
        createdAt: Date.now(),
      };
      setFeedbackList((prev) => (prev ? [optimistic, ...prev] : prev));

      setSubmitted(true);
      setMood(null);
      setMessage('');
      setName(displayName || '');
      setTimeout(() => {
        setSubmitted(false);
        setFetchTick((t) => t + 1);
      }, 3000);
    } catch (err) {
      setSubmitted(false);
      setSubmitError(err?.message || 'failed to send signal');
      console.error('Feedback submit error:', err);
    } finally {
      setSubmitting(false);
    }
  }

  const charCount = message.length;
  const canSubmit = mood && message.trim().length > 0 && charCount <= 500;

  return (
    <section className="animate-fade-in-up stagger-4 pt-8 border-t border-warm-200/60 dark:border-warm-800/60">
      <div className="flex items-center gap-2 mb-6">
        <Sparkle size={14} weight="fill" className="text-rose-400" />
        <h2 className="text-sm font-semibold text-warm-700 dark:text-warm-300 tracking-wide uppercase">the guestbook</h2>
        <span className="text-[10px] text-warm-400 dark:text-warm-500">drop a note</span>
      </div>

      <div className="bg-warm-50 dark:bg-warm-900/40 rounded-2xl border border-warm-200/60 dark:border-warm-800/60 p-4 md:p-5 mb-6">
        {!loggedIn ? (
          <div className="text-center py-6">
            <User size={28} className="text-warm-300 dark:text-warm-700 mx-auto mb-2" />
            <p className="text-sm text-warm-400 dark:text-warm-500">sign in to drop a note</p>
            <button
              onClick={onLogin}
              className="mt-3 text-xs font-medium text-rose-500 hover:text-rose-600 bg-rose-100/60 hover:bg-rose-200/60 dark:bg-rose-900/30 dark:hover:bg-rose-900/50 px-4 py-2 rounded-xl transition-all"
            >
              sign in
            </button>
          </div>
        ) : submitted ? (
          <div className="text-center py-6">
            <Sparkle size={28} className="text-rose-400 mx-auto mb-2 animate-message-float" />
            <p className="text-sm font-medium text-warm-700 dark:text-warm-300">signal sent</p>
            <p className="text-xs text-warm-400 dark:text-warm-500 mt-1">your note landed</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-warm-200 dark:bg-warm-800 shrink-0 flex items-center justify-center">
                {avatar ? (
                  <img src={avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User size={14} className="text-warm-400" />
                )}
              </div>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="your name (optional)"
                maxLength={50}
                className="flex-1 text-xs bg-warm-100 dark:bg-warm-800/80 rounded-xl px-3 py-2 outline-none text-warm-700 dark:text-warm-300 border border-warm-200 dark:border-warm-700 placeholder:text-warm-400 dark:placeholder:text-warm-600"
              />
            </div>

            <div>
              <p className="text-[11px] text-warm-400 dark:text-warm-500 mb-2">how was this session?</p>
              <div className="flex items-center gap-1.5">
                {moods.map((m) => {
                  const Icon = m.icon;
                  const selected = mood === m.value;
                  return (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => setMood(m.value)}
                      className={`p-2.5 rounded-xl transition-all ${
                        selected
                          ? `${m.color} bg-warm-100 dark:bg-warm-800 shadow-sm`
                          : 'text-warm-300 dark:text-warm-600 hover:text-warm-500 hover:bg-warm-100 dark:hover:bg-warm-800/50'
                      }`}
                      title={m.label}
                    >
                      <Icon size={20} weight={selected ? 'fill' : 'regular'} />
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="relative">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="drop a note about this session..."
                maxLength={500}
                rows={3}
                className="w-full text-xs bg-warm-100 dark:bg-warm-800/80 rounded-xl px-3 py-2.5 outline-none text-warm-700 dark:text-warm-300 border border-warm-200 dark:border-warm-700 placeholder:text-warm-400 dark:placeholder:text-warm-600 resize-none"
              />
              <span className={`absolute bottom-2 right-2.5 text-[10px] ${charCount > 480 ? 'text-rose-400' : 'text-warm-400 dark:text-warm-500'}`}>
                {charCount}/500
              </span>
            </div>

            {submitError && (
              <p className="text-[11px] text-rose-500 bg-rose-100/50 dark:bg-rose-900/30 rounded-xl px-3 py-2">{submitError}</p>
            )}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!canSubmit || submitting}
                className="flex items-center gap-1.5 text-xs font-medium text-white bg-rose-300 hover:bg-rose-400 disabled:opacity-40 disabled:cursor-not-allowed px-4 py-2 rounded-xl transition-all active:scale-95"
              >
                {submitting ? (
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <PaperPlaneTilt size={13} weight="bold" />
                )}
                send signal
              </button>
            </div>
          </form>
        )}
      </div>

      <div>
        <div className="flex items-center gap-2 mb-4">
          <MusicNotes size={14} className="text-warm-400" />
          <h3 className="text-[11px] font-semibold text-warm-500 dark:text-warm-400 uppercase tracking-wider">signals</h3>
          {feedbackList && (
            <span className="text-[10px] text-warm-400 dark:text-warm-500">{feedbackList.length} notes</span>
          )}
        </div>

        {listLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 rounded-xl bg-warm-200/60 dark:bg-warm-800/60 animate-pulse-soft" />
            ))}
          </div>
        ) : feedbackList && feedbackList.length > 0 ? (
          <div className="space-y-2">
            {feedbackList.map((fb) => {
              const m = moods.find((m) => m.value === fb.mood);
              const MoodIcon = m?.icon || MusicNotes;
              return (
                <div
                  key={fb.id}
                  className="flex items-start gap-3 p-3 rounded-xl bg-warm-50 dark:bg-warm-900/30 border border-warm-200/40 dark:border-warm-800/40"
                >
                  <div className="w-7 h-7 rounded-full overflow-hidden bg-warm-200 dark:bg-warm-800 shrink-0 flex items-center justify-center mt-0.5">
                    {fb.avatar ? (
                      <img src={fb.avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <User size={12} className="text-warm-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-warm-700 dark:text-warm-300 truncate">
                        {fb.name || 'anonymous listener'}
                      </span>
                      <MoodIcon size={13} className={`${m?.color || 'text-warm-400'} shrink-0`} weight="fill" />
                      <span className="text-[10px] text-warm-400 dark:text-warm-500 ml-auto shrink-0">{timeAgo(fb.createdAt)}</span>
                    </div>
                    <p className="text-xs text-warm-600 dark:text-warm-400 mt-1 leading-relaxed">{fb.message}</p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <MusicNotes size={28} className="text-warm-300 dark:text-warm-700 mx-auto mb-2" />
            <p className="text-sm text-warm-400 dark:text-warm-500">no signals yet</p>
            <p className="text-xs text-warm-300 dark:text-warm-600 mt-1">be the first to drop a note</p>
          </div>
        )}
      </div>
    </section>
  );
}
