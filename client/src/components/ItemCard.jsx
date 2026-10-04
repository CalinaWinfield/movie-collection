import React from 'react';
import { Star, Heart, Handshake, Film, Tv, Gamepad2 } from 'lucide-react';
import { FormatBadge } from './FormatBadge';

export function ItemCard({ item, onClick, onToggleFavorite }) {
  const primaryEdition = item.editions?.[0];
  const hasSlipcover = item.editions?.some(e => e.slipcover === 1);
  const isLent = Boolean(item.active_borrower);

  const CategoryIcon = item.category === 'tv' ? Tv : (item.category === 'game' ? Gamepad2 : Film);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'in_progress':
        return <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] px-2 py-0.5 rounded font-medium">In Progress</span>;
      case 'completed':
        return <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] px-2 py-0.5 rounded font-medium">Completed</span>;
      case 'wishlist':
        return <span className="bg-purple-500/20 text-purple-400 border border-purple-500/30 text-[10px] px-2 py-0.5 rounded font-medium">Wishlist</span>;
      default:
        return null;
    }
  };

  return (
    <div 
      onClick={() => onClick(item)}
      className="group relative flex flex-col bg-surface rounded-2xl border border-surface-border hover:border-amber-500/50 hover:shadow-2xl hover:shadow-amber-500/10 transition-all duration-300 overflow-hidden cursor-pointer transform hover:-translate-y-1"
    >
      {/* Poster Media Box */}
      <div className="relative aspect-[2/3] w-full bg-slate-900 overflow-hidden case-sheen">
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
          className={`w-full h-full flex flex-col items-center justify-center p-4 text-center bg-gradient-to-br from-slate-900 to-slate-950 ${item.poster_url ? 'hidden' : 'flex'}`}
        >
          <CategoryIcon className="w-12 h-12 text-slate-700 mb-2" />
          <span className="text-xs font-semibold text-slate-400 line-clamp-2">{item.title}</span>
          <span className="text-[10px] text-slate-600 mt-1">{item.release_year || 'Unknown Year'}</span>
        </div>

        {/* Kolekino Lent Out Banner */}
        {isLent && (
          <div className="absolute top-2 left-2 z-20 flex items-center gap-1 bg-amber-500/95 text-slate-950 px-2 py-0.5 rounded-md text-[11px] font-bold shadow-lg backdrop-blur-sm">
            <Handshake className="w-3.5 h-3.5" />
            <span>LENT OUT</span>
          </div>
        )}

        {/* Favorite toggle button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(item);
          }}
          className={`absolute top-2 right-2 z-20 p-2 rounded-xl backdrop-blur-md transition-all ${
            item.is_favorite 
              ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
              : 'bg-black/40 text-slate-300 hover:text-white border border-white/10 opacity-0 group-hover:opacity-100'
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
            <span className="bg-black/75 backdrop-blur-md text-amber-300 text-[10px] font-bold px-1.5 py-0.5 rounded border border-amber-500/30">
              +{item.editions.length - 1} ed
            </span>
          )}
        </div>

        {/* Subtle Dark Gradient at bottom of image for badge legibility */}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />
      </div>

      {/* Card Info Box */}
      <div className="p-3.5 flex flex-col flex-1 justify-between gap-1.5">
        <div>
          <div className="flex items-center justify-between gap-1 mb-1">
            <span className="text-[11px] font-medium text-slate-400">
              {item.release_year || '—'}
            </span>
            <div className="flex items-center gap-1">
              {getStatusBadge(item.status)}
              {item.rating > 0 && (
                <div className="flex items-center gap-0.5 text-amber-400 font-bold text-xs bg-amber-400/10 px-1.5 py-0.5 rounded">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <span>{item.rating}</span>
                </div>
              )}
            </div>
          </div>

          <h3 className="font-semibold text-sm text-slate-100 group-hover:text-amber-400 transition-colors line-clamp-1 leading-snug">
            {item.title}
          </h3>

          {item.creator && (
            <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
              {item.creator}
            </p>
          )}
        </div>

        {/* Footer info: Shelf or Storage Location */}
        <div className="pt-2 mt-1 border-t border-surface-border flex items-center justify-between text-[11px] text-slate-400">
          <span className="truncate max-w-[120px]" title={item.shelf_name || 'Unassigned'}>
            {item.shelf_name ? `📁 ${item.shelf_name}` : 'Shelf: Unsorted'}
          </span>
          {isLent ? (
            <span className="text-amber-400 font-semibold truncate max-w-[90px]" title={`With ${item.active_borrower}`}>
              With {item.active_borrower}
            </span>
          ) : (
            primaryEdition?.storage_location && (
              <span className="truncate max-w-[90px] text-slate-500" title={primaryEdition.storage_location}>
                📍 {primaryEdition.storage_location}
              </span>
            )
          )}
        </div>
      </div>
    </div>
  );
}
