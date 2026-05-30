import { House, ClockCounterClockwise, Heart } from '@phosphor-icons/react';

const navItems = [
  { icon: House, label: 'home' },
  { icon: ClockCounterClockwise, label: 'spins' },
  { icon: Heart, label: 'crate' },
];

export default function MobileNav({ activeView, onNavigate }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-warm-50/90 backdrop-blur-xl border-t border-warm-200/80 z-40 flex items-center justify-around px-2 md:hidden dark:bg-warm-950/90 dark:border-warm-800/80">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeView === item.label;
        return (
          <button
            key={item.label}
            onClick={() => onNavigate(item.label)}
            className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all duration-200 ${
              isActive
                ? 'text-rose-500'
                : 'text-warm-400 hover:text-warm-600 dark:text-warm-500 dark:hover:text-warm-300'
            }`}
          >
            <Icon size={20} weight={isActive ? 'fill' : 'regular'} />
            <span className="text-[9px] font-medium">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
