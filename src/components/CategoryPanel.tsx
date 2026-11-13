import React from 'react';
import { ChevronRight } from 'lucide-react';
import { CategoryBreakdownItem } from '../hooks/useSpendsStore';
import { SpendCategory } from '../types';
import { formatINR } from '../utils/mathAndFormat';
import { CategoryIcon } from './CategoryIcon';

interface CategoryPanelProps {
  items: CategoryBreakdownItem[];
  totalSpend: number;
  selectedCategory: SpendCategory | 'all';
  onSelectCategory: (cat: SpendCategory | 'all') => void;
}

export const CategoryPanel: React.FC<CategoryPanelProps> = React.memo(
  ({ items, totalSpend, selectedCategory, onSelectCategory }) => (
    <section aria-label="Category breakdown" className="panel flex flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Where Money Went</h2>
          <p className="mt-0.5 text-xs font-medium text-slate-500">
            {items.length} {items.length === 1 ? 'category' : 'categories'} · {formatINR(totalSpend)}
          </p>
        </div>
        {selectedCategory !== 'all' && (
          <button
            type="button"
            onClick={() => onSelectCategory('all')}
            className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-200"
          >
            Reset
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-1 py-8 text-center">
          <p className="text-[13px] font-semibold text-slate-700">No spends this period</p>
          <p className="text-[11px] font-medium text-slate-400">Add a debit to see breakdown</p>
        </div>
      ) : (
        <ul className="mt-4 space-y-1">
          {items.map((item) => {
            const active = selectedCategory === item.category;
            const width = Math.max(3, Math.min(100, item.percentage));
            return (
              <li key={item.category}>
                <button
                  type="button"
                  onClick={() => onSelectCategory(active ? 'all' : item.category)}
                  className={`group flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition ${
                    active ? 'bg-indigo-50/80 ring-1 ring-indigo-200' : 'hover:bg-slate-50'
                  }`}
                >
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${item.bgClass} ${item.textClass}`}
                  >
                    <CategoryIcon name={item.iconName} className="h-3.5 w-3.5" />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-[12px] font-semibold text-slate-800">
                        {item.label}
                      </span>
                      <span className="num shrink-0 text-[12px] font-bold text-slate-900">
                        {formatINR(item.amount)}
                      </span>
                    </span>

                    <span className="mt-1.5 flex items-center gap-2">
                      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                        <span
                          className="block h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${width}%`,
                            backgroundColor: active ? '#4f46e5' : item.color,
                          }}
                        />
                      </span>
                      <span className="num w-9 shrink-0 text-right text-[10px] font-bold text-slate-400">
                        {item.percentage}%
                      </span>
                    </span>
                  </span>

                  <ChevronRight
                    className={`h-3.5 w-3.5 shrink-0 transition ${
                      active ? 'text-indigo-500' : 'text-slate-300 group-hover:text-slate-400'
                    }`}
                  />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  )
);
CategoryPanel.displayName = 'CategoryPanel';
