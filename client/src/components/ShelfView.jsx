import React from 'react';
import { Disc, Heart } from 'lucide-react';

export function ShelfView({ items, onItemClick }) {
  if (items.length === 0) {
    return null;
  }

  // Get spine color & styling based on format
  const getSpineStyle = (item) => {
    const primaryFormat = (item.primary_format || item.editions?.[0]?.format || '').toLowerCase();
    const primaryPackaging = (item.primary_packaging || item.editions?.[0]?.packaging || '').toLowerCase();

    if (primaryPackaging.includes('steelbook') || primaryFormat.includes('steelbook')) {
      return {
        bg: 'bg-gradient-to-r from-zinc-700 via-zinc-400 to-zinc-600 text-slate-900 border-zinc-300/40',
        logoText: 'STEELBOOK',
        textColor: 'text-zinc-950 font-bold',
        badgeBg: 'bg-zinc-800 text-zinc-100',
        height: 'h-64 sm:h-72',
        width: 'w-10 sm:w-12',
      };
    } else if (primaryFormat.includes('4k')) {
      return {
        bg: 'bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-950 text-amber-300 border-amber-500/30',
        logoText: '4K ULTRA HD',
        textColor: 'text-amber-300 font-semibold',
        badgeBg: 'bg-amber-500 text-black',
        height: 'h-64 sm:h-72',
        width: 'w-10 sm:w-12',
      };
    } else if (primaryFormat.includes('criterion')) {
      return {
        bg: 'bg-gradient-to-r from-neutral-800 via-neutral-900 to-neutral-800 text-white border-neutral-600',
        logoText: 'CRITERION',
        textColor: 'text-white font-serif tracking-widest',
        badgeBg: 'bg-white text-black',
        height: 'h-64 sm:h-72',
        width: 'w-10 sm:w-12',
      };
    } else if (primaryFormat.includes('switch')) {
      return {
        bg: 'bg-gradient-to-r from-red-600 via-red-500 to-red-700 text-white border-red-400/40',
        logoText: 'SWITCH',
        textColor: 'text-white font-bold',
        badgeBg: 'bg-white text-red-600',
        height: 'h-56 sm:h-60',
        width: 'w-9 sm:w-11',
      };
    } else if (primaryFormat.includes('ps5')) {
      return {
        bg: 'bg-gradient-to-r from-slate-200 via-white to-slate-300 text-sky-950 border-sky-400/50',
        logoText: 'PS5',
        textColor: 'text-slate-900 font-extrabold',
        badgeBg: 'bg-sky-600 text-white',
        height: 'h-60 sm:h-64',
        width: 'w-9 sm:w-11',
      };
    } else if (primaryFormat.includes('bluray') || primaryFormat.includes('blu-ray')) {
      return {
        bg: 'bg-gradient-to-r from-blue-700 via-blue-600 to-blue-800 text-white border-blue-400/40',
        logoText: 'BLU-RAY',
        textColor: 'text-white font-semibold',
        badgeBg: 'bg-sky-400 text-slate-950',
        height: 'h-64 sm:h-72',
        width: 'w-10 sm:w-12',
      };
    } else {
      return {
        bg: 'bg-gradient-to-r from-slate-800 via-slate-700 to-slate-900 text-slate-100 border-slate-600',
        logoText: 'MEDIA',
        textColor: 'text-slate-200 font-medium',
        badgeBg: 'bg-slate-700 text-slate-200',
        height: 'h-64 sm:h-72',
        width: 'w-10 sm:w-12',
      };
    }
  };

  return (
    <div className="w-full my-6">
      <div className="flex items-center justify-between mb-3 px-2">
        <h3 className="text-sm font-semibold tracking-wider uppercase text-slate-400 flex items-center gap-2">
          <span>📚 Physical Shelf View</span>
          <span className="text-xs text-slate-500 font-normal">({items.length} titles on display)</span>
        </h3>
        <span className="text-xs text-slate-500 hidden sm:inline">
          Tip: Hover to pull case from shelf
        </span>
      </div>

      <div className="relative p-6 pt-10 rounded-2xl bg-[#0d1017] border border-surface-border overflow-hidden">
        {/* Bookcase Wooden Shelf Board Base */}
        <div className="absolute inset-x-0 bottom-4 h-5 shelf-board z-0" />

        {/* Spines Container */}
        <div className="relative z-10 flex items-end gap-1.5 overflow-x-auto pb-4 pt-10 px-2 scrollbar-thin">
          {items.map((item) => {
            const style = getSpineStyle(item);

            return (
              <div
                key={item.id}
                onClick={() => onItemClick(item)}
                className={`group relative flex flex-col justify-between items-center ${style.width} ${style.height} ${style.bg} border rounded-t shadow-case cursor-pointer transition-all duration-300 hover:-translate-y-6 hover:shadow-2xl hover:z-30 shrink-0 select-none`}
                title={`${item.title} (${item.release_year || 'Unknown'})`}
              >
                {/* Top Format Emblem */}
                <div className="w-full flex flex-col items-center pt-2">
                  <span className={`text-[8px] font-extrabold uppercase tracking-tighter px-1 py-0.5 rounded ${style.badgeBg}`}>
                    {style.logoText}
                  </span>
                  {item.is_favorite ? (
                    <Heart className="w-2.5 h-2.5 fill-red-500 text-red-500 mt-1" />
                  ) : null}
                </div>

                {/* Vertical Spine Title */}
                <div className="flex-1 flex items-center justify-center py-2 overflow-hidden">
                  <span
                    className={`text-xs tracking-wide whitespace-nowrap transform -rotate-90 origin-center truncate max-w-[170px] ${style.textColor}`}
                  >
                    {item.title}
                  </span>
                </div>

                {/* Bottom Disc / Format indicator */}
                <div className="w-full flex flex-col items-center pb-2">
                  <Disc className="w-3.5 h-3.5 opacity-60 group-hover:rotate-180 transition-transform duration-700" />
                  {item.release_year && (
                    <span className="text-[9px] opacity-75 font-mono mt-0.5">
                      {item.release_year}
                    </span>
                  )}
                </div>

                {/* Shelf Spine Pull Glow */}
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-t pointer-events-none" />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
