import React from 'react';
import { Star, Heart, Film, Tv, Gamepad2, Calendar } from 'lucide-react';
import { FormatBadge } from './FormatBadge';

const CATEGORY_CONFIG = {
  movie: {
    label: 'Movie',
    icon: Film,
    iconColor: 'text-forest-300',
    badgeClass: 'bg-forest-50 text-forest-700 border-forest-200/80',
    posterBadgeClass: 'bg-slate-950/80 border-forest-400/30 text-forest-300'
  },
  tv: {
    label: 'TV Show',
    icon: Tv,
    iconColor: 'text-sky-400',
    badgeClass: 'bg-sky-50 text-sky-700 border-sky-200/80',
    posterBadgeClass: 'bg-slate-950/80 border-sky-400/30 text-sky-300'
  },
  game: {
    label: 'Game',
    icon: Gamepad2,
    iconColor: 'text-emerald-400',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    posterBadgeClass: 'bg-slate-950/80 border-emerald-400/30 text-emerald-300'
  }
};

const formatDateAdded = (dateStr) => {
  if (!dateStr) return null;
  try {
    const normalized = dateStr.includes('T') ? dateStr : dateStr.replace(' ', 'T') + 'Z';
    const d = new Date(normalized);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch {
    return null;
  }
};

export function ItemCard({ item, onClick, onToggleFavorite }) {
  const primaryEdition = item.editions?.[0];
  const hasSlipcover = item.editions?.some(e => e.slipcover === 1);

  const catConfig = CATEGORY_CONFIG[item.category] || CATEGORY_CONFIG.movie;
  const CategoryIcon = catConfig.icon;
  const formattedAddedDate = formatDateAdded(item.created_at);

  const renderStatusBadges = () => {
    const ownership = item.ownership_status || (item.status === 'wishlist' ? 'wishlist' : (item.status === 'borrowed' ? 'borrowed' : 'owned'));
    const progress = item.progress_status || (item.status === 'in_progress' || item.status === 'completed' ? item.status : 'not_started');

    return (
      <div className="flex items-center gap-1 flex-wrap justify-end">
        {ownership === 'borrowed' && (
          <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] px-1.5 py-0.5 rounded-md font-semibold" title="Borrowed Media">
            Borrowed
          </span>
        )}
        {ownership === 'wishlist' && (
          <span className="bg-purple-50 text-purple-700 border border-purple-200 text-[10px] px-1.5 py-0.5 rounded-md font-semibold" title="Wishlist">
            Wishlist
          </span>
        )}
        {progress === 'in_progress' && (
          <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] px-1.5 py-0.5 rounded-md font-semibold" title="In Progress">
            In Progress
          </span>
        )}
        {progress === 'completed' && (
          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] px-1.5 py-0.5 rounded-md font-semibold" title="Completed">
            Completed
          </span>
        )}
      </div>
    );
  };

  return (
    <div 
      onClick={() => onClick(item)}
      className="group relative flex flex-col bg-white rounded-2xl border border-slate-200 hover:border-forest-600 hover:shadow-xl hover:shadow-forest-700/10 transition-all duration-300 overflow-hidden cursor-pointer transform hover:-translate-y-1 shadow-xs"
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

        {/* Media Type Badge on top-left of poster */}
        <div 
          className={`absolute top-2 left-2 z-20 flex items-center gap-1 px-2 py-0.5 rounded-lg backdrop-blur-md border text-[10px] font-semibold shadow-xs ${catConfig.posterBadgeClass}`}
          title={`Type: ${catConfig.label}`}
        >
          <CategoryIcon className={`w-3 h-3 ${catConfig.iconColor}`} />
          <span>{catConfig.label}</span>
        </div>

        {/* Favorite toggle button on top-right of poster */}
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

        {/* Format & Packaging Badges on bottom of poster */}
        <div className="absolute bottom-2 left-2 right-2 z-20 flex items-center justify-between pointer-events-none">
          <FormatBadge
            format={primaryEdition?.format || (item.category === 'game' ? 'Game' : 'Disc')}
            packaging={primaryEdition?.packaging}
            slipcover={hasSlipcover}
            size="sm"
          />

          {item.editions && item.editions.length > 1 && (
            <span className="bg-slate-900/85 backdrop-blur-md text-emerald-300 text-[10px] font-bold px-1.5 py-0.5 rounded border border-emerald-400/40">
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
          {/* Header Row: Media Type & Year + Status Badges & Rating */}
          <div className="flex items-center justify-between gap-1 mb-1.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md border ${catConfig.badgeClass}`}>
                {catConfig.label}
              </span>
              {item.release_year && (
                <span className="text-[11px] font-semibold text-slate-500">
                  {item.release_year}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {renderStatusBadges()}
              {item.rating > 0 && (
                <div className="flex items-center gap-0.5 text-slate-800 font-extrabold text-xs bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <span>{item.rating}</span>
                </div>
              )}
            </div>
          </div>

          {/* Title */}
          <h3 className="font-bold text-sm text-slate-900 group-hover:text-forest-600 transition-colors line-clamp-1 leading-snug">
            {item.title}
          </h3>

          {/* Director / Creator / Developer */}
          {item.creator && (
            <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
              {item.creator}
            </p>
          )}

          {/* Date Added to Collection */}
          {formattedAddedDate && (
            <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium mt-1.5">
              <Calendar className="w-3 h-3 text-forest-600 shrink-0" />
              <span>Added {formattedAddedDate}</span>
            </div>
          )}
        </div>

        {/* Footer info: Shelf or Storage Location */}
        <div className="pt-2 mt-1.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
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
