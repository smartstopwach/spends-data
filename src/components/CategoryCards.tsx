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

export const CategoryCards: React.FC<CategoryCardsProps> = ({
  items,
  selectedCategory,
  onSelectCategory,
}) => {
  if (items.length === 0) return null;

  return (
    <section aria-label="Category Breakdown">
      <div className="flex items-center justify-between px-1 mb-3">
        <h2 className="text-sm font-bold text-zinc-700">Kahan Kharch Hua</h2>
        {selectedCategory !== 'all' && (
          <button
            type="button"
            onClick={() => onSelectCategory('all')}
            className="text-xs font-bold text-zinc-500 hover:text-zinc-900 cursor-pointer"
          >
            Show All
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {items.map((item) => {
          const isSelected = selectedCategory === item.category;
          return (
            <button
              key={item.category}
              type="button"
              onClick={() => onSelectCategory(isSelected ? 'all' : item.category)}
              className={`text-left rounded-[22px] p-4 bg-white border transition aesthetic-card cursor-pointer ${
                isSelected
                  ? 'border-zinc-900 ring-2 ring-zinc-900/10'
                  : 'border-black/[0.06] hover:border-zinc-300'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div
                  className={`w-9 h-9 rounded-2xl flex items-center justify-center ${item.bgClass} ${item.textClass}`}
                >
                  <CategoryIcon name={item.iconName} className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold text-zinc-400 tabular-nums">
                  {item.percentage}%
                </span>
              </div>

              <p className="mt-3 text-xs font-semibold text-zinc-500 truncate">
                {item.label}
              </p>
              <p className="mt-0.5 text-lg font-extrabold text-zinc-900 tabular-nums">
                {formatINR(item.amount)}
              </p>

              <div className="mt-2.5 h-1.5 w-full rounded-full bg-zinc-100 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.max(6, item.percentage)}%`,
                    backgroundColor: item.color,
                  }}
                />
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};
