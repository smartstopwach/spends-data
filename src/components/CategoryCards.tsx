import React from 'react';
import { CategoryBreakdownItem } from '../hooks/useSpendsStore';
import { SpendCategory } from '../types';
import { formatINR } from '../utils/mathAndFormat';
import { CategoryIcon } from './CategoryIcon';

interface CategoryCardsProps {
  items: CategoryBreakdownItem[];
  selectedCategory: SpendCategory | 'all';
  onSelectCategory: (cat: SpendCategory | 'all') => void;
}

export const CategoryCards: React.FC<CategoryCardsProps> = React.memo(
  ({ items, selectedCategory, onSelectCategory }) => {
    if (items.length === 0) return null;

    return (
      <section aria-label="Category Breakdown" className="rounded-3xl bento-card p-5 sm:p-6">
        <div className="flex items-center justify-between mb-3.5">
          <div>
            <h2 className="text-sm sm:text-base font-extrabold text-zinc-900">
              Kahan Kharch Hua
            </h2>
            <p className="text-[11px] text-zinc-400 font-medium">
              Tap card to filter entries
            </p>
          </div>
          {selectedCategory !== 'all' && (
            <button
              type="button"
              onClick={() => onSelectCategory('all')}
              className="px-3 py-1 rounded-full bg-zinc-100 hover:bg-zinc-200 text-xs font-bold text-zinc-700 transition cursor-pointer"
            >
              Show All
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
          {items.map((item) => {
            const isSelected = selectedCategory === item.category;
            return (
              <button
                key={item.category}
                type="button"
                onClick={() => onSelectCategory(isSelected ? 'all' : item.category)}
                className={`text-left rounded-2xl p-3.5 transition border cursor-pointer ${
                  isSelected
                    ? 'bg-zinc-900 text-white border-zinc-900 shadow-sm'
                    : 'bg-zinc-50/80 hover:bg-zinc-100/80 text-zinc-900 border-zinc-200/70'
                }`}
              >
                <div className="flex items-center justify-between gap-1.5">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                      isSelected ? 'bg-white/15 text-white' : `${item.bgClass} ${item.textClass}`
                    }`}
                  >
                    <CategoryIcon name={item.iconName} className="w-4 h-4" />
                  </div>
                  <span
                    className={`text-[11px] font-bold tabular-nums ${
                      isSelected ? 'text-zinc-300' : 'text-zinc-400'
                    }`}
                  >
                    {item.percentage}%
                  </span>
                </div>

                <p
                  className={`mt-2.5 text-[11px] font-semibold truncate ${
                    isSelected ? 'text-zinc-300' : 'text-zinc-500'
                  }`}
                >
                  {item.label}
                </p>
                <p className="mt-0.5 text-base font-extrabold tabular-nums truncate">
                  {formatINR(item.amount)}
                </p>

                <div
                  className={`mt-2 h-1 w-full rounded-full overflow-hidden ${
                    isSelected ? 'bg-white/20' : 'bg-zinc-200/80'
                  }`}
                >
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.max(8, item.percentage)}%`,
                      backgroundColor: isSelected ? '#34d399' : item.color,
                    }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </section>
    );
  }
);
CategoryCards.displayName = 'CategoryCards';
