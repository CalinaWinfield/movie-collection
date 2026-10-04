import React from 'react';
import { Star, Heart, Film, Tv, Gamepad2 } from 'lucide-react';
import { FormatBadge } from './FormatBadge';

export function ItemCard({ item, onClick, onToggleFavorite }) {
  const primaryEdition = item.editions?.[0];
  const hasSlipcover = item.editions?.some(e => e.slipcover === 1);

  const CategoryIcon = item.category === 'tv' ? Tv : (item.category === 'game' ? Gamepad2 : Film);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'in_progress':
        return <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] px-2 py-0.5 rounded-md font-semibold">In Progress</span>;
      case 'completed':
        return <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] px-2 py-0.5 rounded-md font-semibold">Completed</span>;
      case 'wishlist':
        return <span className="bg-purple-50 text-purple-700 border border-purple-200 text-[10px] px-2 py-0.5 rounded-md font-semibold">Wishlist</span>;
      default:
        return null;
    }
  };

  return (
    <div 
      onClick={() => onClick(item)}
      className="group relative flex flex-col bg-white rounded-2xl border border-slate-200 hover:border-amber-400 hover:shadow-xl hover:shadow-amber-500/10 transition-all duration-300 overflow-hidden cursor-pointer transform hover:-translate-y-1 shadow-xs"
    >
      {/* Poster Media Box */}
      <div className="relative aspect-[2/3] w-full bg-slate-100 overflow-hidden case-sheen">
        {item.poster_url ? (
          <img
            src={item.poster_url}
            alt={item.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            onError={(e) => {
              e.target.onerror = null;
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}

        {/* Fallback image when no poster or broken */}
        <div 
          className={`w-full h-full flex flex-col items-center justify-center p-4 text-center bg-gradient-to-br from-slate-100 to-slate-200 ${item.poster_url ? 'hidden' : 'flex'}`}
        >
          <CategoryIcon className="w-12 h-12 text-slate-400 mb-2" />
          <span className="text-xs font-bold text-slate-700 line-clamp-2">{item.title}</span>
          <span className="text-[10px] text-slate-500 mt-1">{item.release_year || 'Unknown Year'}</span>
        </div>

        {/* Favorite toggle button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(item);
          }}
          className={`absolute top-2 right-2 z-20 p-2 rounded-xl backdrop-blur-md transition-all ${
            item.is_favorite 
              ? 'bg-white/95 text-red-500 shadow-md border border-red-100' 
              : 'bg-black/35 text-white hover:text-red-400 border border-white/20 opacity-0 group-hover:opacity-100'
          }`}
          title={item.is_favorite ? 'Favorited' : 'Add to Favorites'}
        >
          <Heart className={`w-4 h-4 ${item.is_favorite ? 'fill-current' : ''}`} />
        </button>

        {/* Format & Packaging Badges on top of poster */}
        <div className="absolute bottom-2 left-2 right-2 z-20 flex items-center justify-between pointer-events-none">
          <FormatBadge
            format={primaryEdition?.format || (item.category === 'game' ? 'Game' : 'Disc')}
            packaging={primaryEdition?.packaging}
            slipcover={hasSlipcover}
            size="sm"
          />

          {item.editions && item.editions.length > 1 && (
            <span className="bg-slate-900/85 backdrop-blur-md text-amber-300 text-[10px] font-bold px-1.5 py-0.5 rounded border border-amber-400/40">
              +{item.editions.length - 1} ed
            </span>
          )}
        </div>

        {/* Subtle Gradient at bottom of image for badge legibility */}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none" />
      </div>

      {/* Card Info Box */}
      <div className="p-3.5 flex flex-col flex-1 justify-between gap-1.5 bg-white">
        <div>
          <div className="flex items-center justify-between gap-1 mb-1">
            <span className="text-[11px] font-semibold text-slate-500">
              {item.release_year || '—'}
            </span>
            <div className="flex items-center gap-1">
              {getStatusBadge(item.status)}
              {item.rating > 0 && (
                <div className="flex items-center gap-0.5 text-amber-700 font-extrabold text-xs bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                  <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                  <span>{item.rating}</span>
                </div>
              )}
            </div>
          </div>

          <h3 className="font-bold text-sm text-slate-900 group-hover:text-amber-600 transition-colors line-clamp-1 leading-snug">
            {item.title}
          </h3>

          {item.creator && (
            <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
              {item.creator}
            </p>
          )}
        </div>

        {/* Footer info: Shelf or Storage Location */}
        <div className="pt-2 mt-1 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span className="truncate max-w-[130px] font-medium" title={item.shelf_name || 'Unassigned'}>
            {item.shelf_name ? `📁 ${item.shelf_name}` : 'Shelf: Unsorted'}
          </span>
          {primaryEdition?.storage_location && (
            <span className="truncate max-w-[110px] text-slate-500" title={primaryEdition.storage_location}>
              📍 {primaryEdition.storage_location}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
