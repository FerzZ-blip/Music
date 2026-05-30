import { Sparkle, House, ClockCounterClockwise, Heart, MusicNotes, Moon, Sun, User } from '@phosphor-icons/react';
import { useAuth } from '../contexts/AuthContext';

const APP_VERSION = '1.0.0';

const navItems = [
  { icon: House, label: 'home' },
  { icon: ClockCounterClockwise, label: 'spins' },
  { icon: Heart, label: 'crate' },
  { icon: MusicNotes, label: 'playlists' },
];

export default function Sidebar({ activeView, onNavigate, dark, onThemeToggle, onLogin, open, onToggle }) {
  const { user, discord } = useAuth();
  const avatar = user?.photoURL || discord?.user?.avatar && `https://cdn.discordapp.com/avatars/${discord.user.id}/${discord.user.avatar}.webp?size=64`;

  const navContent = (closeOnNav) => (
    <>
      <nav className="flex flex-col items-center gap-1 flex-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.label;
          return (
            <button
              key={item.label}
              onClick={() => { onNavigate(item.label); if (closeOnNav) onToggle?.(); }}
              className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                isActive
                  ? 'bg-rose-200/60 text-rose-600 shadow-sm dark:bg-rose-800/40 dark:text-rose-300'
                  : 'text-warm-400 hover:text-warm-600 hover:bg-warm-200/50 dark:text-warm-500 dark:hover:text-warm-300 dark:hover:bg-warm-800/50'
              }`}
              title={item.label}
            >
              <Icon size={22} weight={isActive ? 'fill' : 'regular'} />
            </button>
          );
        })}
      </nav>
      <div className="flex flex-col items-center gap-1">
        <button
          onClick={onThemeToggle}
          className="w-14 h-14 rounded-2xl flex items-center justify-center text-warm-400 hover:text-warm-600 hover:bg-warm-200/50 transition-all duration-300 dark:text-warm-500 dark:hover:text-warm-300 dark:hover:bg-warm-800/50"
          title={dark ? 'light mode' : 'dark mode'}
        >
          {dark ? <Sun size={20} weight="regular" /> : <Moon size={20} weight="regular" />}
        </button>
        <button
          onClick={onLogin}
          className="w-14 h-14 rounded-2xl flex items-center justify-center text-warm-400 hover:text-warm-600 hover:bg-warm-200/50 transition-all duration-300 dark:text-warm-500 dark:hover:text-warm-300 dark:hover:bg-warm-800/50"
          title={user || discord ? 'account' : 'sign in'}
        >
          {avatar ? (
            <img src={avatar} alt="" className="w-7 h-7 rounded-full object-cover" />
          ) : (
            <User size={20} />
          )}
        </button>
      </div>
      <span className="text-[9px] text-warm-300 dark:text-warm-700 tracking-wider mt-1">v{APP_VERSION}</span>
    </>
  );

  return (
    <>
      {/* Mobile drawer */}
      <div className={`fixed inset-0 z-50 md:hidden ${open ? '' : 'pointer-events-none'}`}>
        <div
          className={`absolute inset-0 bg-warm-950/40 backdrop-blur-sm transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`}
          onClick={onToggle}
        />
        <div
          className={`absolute left-0 top-0 bottom-0 transition-transform duration-300 ease-out ${open ? 'translate-x-0' : '-translate-x-full'}`}
        >
          <div className="w-20 flex flex-col items-center py-8 gap-2 h-full bg-warm-50 dark:bg-warm-950">
            <div className="mb-6">
              <Sparkle size={24} weight="fill" className="text-rose-400" />
            </div>
            {navContent(true)}
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <aside className="fixed left-0 top-0 bottom-24 w-20 z-30 hidden md:flex flex-col items-center py-8 gap-2">
        <div className="mb-6">
          <Sparkle size={24} weight="fill" className="text-rose-400" />
        </div>
        {navContent(false)}
      </aside>
    </>
  );
}
