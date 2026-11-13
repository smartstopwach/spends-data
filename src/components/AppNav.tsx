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

export const AppNav: React.FC<AppNavProps> = ({ view, onNavigate, counts }) => {
  const badgeFor = (id: AppView): number | null => {
    if (id === 'transactions' && counts.transactions > 0) return counts.transactions;
    if (id === 'reports' && counts.reports > 0) return counts.reports;
    return null;
  };

  return (
    <nav aria-label="Main navigation">
      {/* Mobile: fixed bottom tab bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-1px_12px_rgba(15,23,42,0.06)] backdrop-blur-md md:hidden">
        <div className="mx-auto flex max-w-md items-stretch">
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
                className={`relative flex min-w-0 flex-1 flex-col items-center gap-0.5 px-0 pb-2 pt-2 text-[9px] font-semibold leading-none transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-400 ${
                  active ? 'text-indigo-600' : 'text-slate-400'
                }`}
              >
                <span className="relative">
                  <Icon className="h-[18px] w-[18px]" />
                  {badge !== null && (
                    <span className="absolute -right-2 -top-1.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-indigo-600 px-1 text-[8px] font-bold text-white">
                      {badge > 99 ? '99+' : badge}
                    </span>
                  )}
                </span>
                <span className="w-full truncate text-center">{item.label}</span>
                {active && (
                  <span className="absolute inset-x-5 top-0 h-0.5 rounded-full bg-indigo-600" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Desktop: segmented control in the header */}
      <div className="hidden items-center gap-0.5 rounded-lg border border-slate-200 bg-white p-0.5 shadow-sm md:flex">
        {ITEMS.map((item) => {
          const active = view === item.id;
          const badge = badgeFor(item.id);
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              aria-current={active}
              className={`flex items-center gap-1 rounded-md px-2 py-1.5 text-[11px] font-semibold transition ${
                active
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Icon className="h-3 w-3" />
              <span>{item.label}</span>
              {badge !== null && (
                <span
                  className={`num rounded px-1 text-[10px] font-bold ${
                    active ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-600'
                  }`}
                >
                  {badge > 99 ? '99+' : badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
