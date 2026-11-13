import React from 'react';
import { Download, LayoutDashboard, ListOrdered, Mail, Settings } from 'lucide-react';

export type AppView = 'home' | 'transactions' | 'reports' | 'download' | 'settings';

interface AppNavProps {
  view: AppView;
  onNavigate: (view: AppView) => void;
  counts: { transactions: number; reports: number };
}

const ITEMS: Array<{ id: AppView; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: 'home', label: 'Home', icon: LayoutDashboard },
  { id: 'transactions', label: 'Transactions', icon: ListOrdered },
  { id: 'reports', label: 'Reports', icon: Mail },
  { id: 'download', label: 'Download', icon: Download },
  { id: 'settings', label: 'Settings', icon: Settings },
];

/**
 * Main navigation: one bottom tab bar on every screen size. It is fixed to the
 * viewport and sits outside the sticky header, so its position stays correct.
 * On wide screens it is centred and capped in width instead of stretching.
 */
export const AppNav: React.FC<AppNavProps> = ({ view, onNavigate, counts }) => {
  const badgeFor = (id: AppView): number | null => {
    if (id === 'transactions' && counts.transactions > 0) return counts.transactions;
    if (id === 'reports' && counts.reports > 0) return counts.reports;
    return null;
  };

  return (
    <nav aria-label="Main navigation" className="fixed inset-x-0 bottom-0 z-40 pointer-events-none">
      <div className="pointer-events-auto mx-auto w-full border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-1px_12px_rgba(15,23,42,0.06)] backdrop-blur-md sm:max-w-xl sm:rounded-t-2xl lg:max-w-2xl">
        <div className="flex items-stretch">
          {ITEMS.map((item) => {
            const active = view === item.id;
            const badge = badgeFor(item.id);
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                aria-current={active ? 'page' : undefined}
                className={`relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 px-1 py-2 text-[9px] font-semibold leading-none transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-400 sm:text-[11px] md:py-2.5 ${
                  active ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <span className="relative">
                  <Icon className="h-[18px] w-[18px] sm:h-5 sm:w-5" />
                  {badge !== null && (
                    <span className="absolute -right-2 -top-1.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-indigo-600 px-1 text-[8px] font-bold text-white">
                      {badge > 99 ? '99+' : badge}
                    </span>
                  )}
                </span>
                <span className="w-full truncate text-center">{item.label}</span>
                {active && <span className="absolute inset-x-4 top-0 h-0.5 rounded-full bg-indigo-600 sm:inset-x-8" />}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
