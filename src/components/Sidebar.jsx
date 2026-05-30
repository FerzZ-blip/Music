import { Sparkle, House, Compass, ClockCounterClockwise, MicrophoneStage, VinylRecord, Heart, Moon, Sun, User, DiscordLogo, GoogleLogo } from '@phosphor-icons/react';
import { useAuth } from '../contexts/AuthContext';

const navItems = [
  { icon: House, label: 'home' },
  { icon: Compass, label: 'dig' },
  { icon: ClockCounterClockwise, label: 'spins' },
  { icon: MicrophoneStage, label: 'artists' },
  { icon: VinylRecord, label: 'albums' },
  { icon: Heart, label: 'crate' },
];

export default function Sidebar({ activeView, onNavigate, dark, onThemeToggle, onLogin }) {
  const { user, discord } = useAuth();
  const avatar = user?.photoURL || discord?.user?.avatar && `https://cdn.discordapp.com/avatars/${discord.user.id}/${discord.user.avatar}.webp?size=64`;

  return (
    <aside className="fixed left-0 top-0 bottom-24 w-20 flex flex-col items-center py-8 gap-2 z-30">
      <div className="mb-6">
        <Sparkle size={24} weight="fill" className="text-rose-400" />
      </div>
      <nav className="flex flex-col items-center gap-1 flex-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.label;
          return (
            <button
              key={item.label}
              onClick={() => onNavigate(item.label)}
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
    </aside>
  );
}
