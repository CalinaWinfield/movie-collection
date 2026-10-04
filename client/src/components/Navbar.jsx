import React, { useState, useRef, useEffect } from 'react';
import { 
  Film, Tv, Gamepad2, Disc, Search, Plus, Layers, 
  Handshake, BarChart3, Download, User, LogOut, Sparkles,
  LayoutGrid, StretchHorizontal, ListFilter
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function Navbar({ 
  currentCategory, 
  setCurrentCategory, 
  searchQuery, 
  setSearchQuery,
  viewMode,
  setViewMode,
  onOpenAddModal,
  onOpenShelvesModal,
  onOpenLentModal,
  onOpenStatsModal,
  onOpenBackupModal,
  activeLoansCount = 0
}) {
  const { user, logout, loginDemo } = useAuth();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setUserDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const categories = [
    { id: 'all', label: 'All Media', icon: Disc },
    { id: 'movie', label: 'Movies', icon: Film },
    { id: 'tv', label: 'TV Shows', icon: Tv },
    { id: 'game', label: 'Games', icon: Gamepad2 },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#090b10]/90 backdrop-blur-md border-b border-surface-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & Category Switcher */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setCurrentCategory('all')}>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-glow-gold">
                <Disc className="w-6 h-6 text-slate-950 animate-spin-slow" />
              </div>
              <div className="flex flex-col">
                <span className="font-display font-extrabold text-xl tracking-wider text-slate-100 flex items-center gap-1.5">
                  KOLEKINO
                  <span className="text-[10px] font-sans font-semibold uppercase tracking-widest text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                    COLLECTOR
                  </span>
                </span>
                <span className="text-[11px] text-slate-400 -mt-1 tracking-tight">Physical & Media Library</span>
              </div>
            </div>

            {/* Category tabs */}
            <nav className="hidden md:flex items-center space-x-1 bg-surface/80 p-1 rounded-xl border border-surface-border">
              {categories.map((cat) => {
                const Icon = cat.icon;
                const active = currentCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setCurrentCategory(cat.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      active
                        ? 'bg-amber-500 text-slate-950 shadow-md font-semibold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-surface-elevated'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-md mx-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search collection, format, director, barcode..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-surface text-slate-100 pl-10 pr-4 py-2 text-sm rounded-xl border border-surface-border focus:outline-none focus:border-amber-500/70 focus:ring-1 focus:ring-amber-500/50 transition-all placeholder:text-slate-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-200 px-1"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Action Tools & User Menu */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* View Switchers */}
            <div className="hidden lg:flex items-center bg-surface p-1 rounded-lg border border-surface-border">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded text-xs transition-colors ${viewMode === 'grid' ? 'bg-surface-elevated text-amber-400 shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                title="Poster Grid"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('shelf')}
                className={`p-1.5 rounded text-xs transition-colors ${viewMode === 'shelf' ? 'bg-surface-elevated text-amber-400 shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                title="Physical Shelf Spine View"
              >
                <StretchHorizontal className="w-4 h-4" />
              </button>
            </div>

            {/* Shelves Manager */}
            <button
              onClick={onOpenShelvesModal}
              className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-xl text-slate-300 bg-surface hover:bg-surface-elevated border border-surface-border transition-all"
              title="Custom Shelves"
            >
              <Layers className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline font-medium">Shelves</span>
            </button>

            {/* Lent Out Tracker */}
            <button
              onClick={onOpenLentModal}
              className={`relative flex items-center gap-1.5 px-3 py-2 text-sm rounded-xl border transition-all ${
                activeLoansCount > 0 
                  ? 'bg-amber-950/40 border-amber-500/40 text-amber-300' 
                  : 'bg-surface hover:bg-surface-elevated border-surface-border text-slate-300'
              }`}
              title="Lent Out Tracker"
            >
              <Handshake className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline font-medium">Lent Out</span>
              {activeLoansCount > 0 && (
                <span className="bg-amber-500 text-slate-950 text-[10px] font-extrabold px-1.5 py-0.2 rounded-full ml-0.5">
                  {activeLoansCount}
                </span>
              )}
            </button>

            {/* Collector Insights / Stats */}
            <button
              onClick={onOpenStatsModal}
              className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-xl text-slate-300 bg-surface hover:bg-surface-elevated border border-surface-border transition-all"
              title="Collector Stats & Insights"
            >
              <BarChart3 className="w-4 h-4 text-sky-400" />
              <span className="hidden sm:inline font-medium">Insights</span>
            </button>

            {/* Add Item Button */}
            <button
              onClick={onOpenAddModal}
              className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold rounded-xl text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 shadow-glow-gold transition-all"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span className="hidden sm:inline">Add Title</span>
            </button>

            {/* User Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="w-9 h-9 rounded-xl bg-surface-elevated border border-surface-border flex items-center justify-center text-slate-200 hover:border-amber-500/50 transition-all"
                title={user?.display_name || user?.username}
              >
                <User className="w-4 h-4 text-slate-300" />
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-surface-elevated border border-surface-border shadow-2xl py-2 z-50 text-sm">
                  <div className="px-4 py-2 border-b border-surface-border">
                    <p className="font-semibold text-slate-100 truncate">{user?.display_name || user?.username}</p>
                    <p className="text-xs text-slate-400 truncate">@{user?.username}</p>
                  </div>

                  <button
                    onClick={() => { setUserDropdownOpen(false); onOpenBackupModal(); }}
                    className="w-full text-left px-4 py-2 text-slate-300 hover:bg-surface hover:text-white flex items-center gap-2.5 transition-colors"
                  >
                    <Download className="w-4 h-4 text-amber-400" />
                    <span>Import / Export & Backup</span>
                  </button>

                  <button
                    onClick={() => { setUserDropdownOpen(false); loginDemo(); }}
                    className="w-full text-left px-4 py-2 text-slate-300 hover:bg-surface hover:text-white flex items-center gap-2.5 transition-colors"
                  >
                    <Sparkles className="w-4 h-4 text-sky-400" />
                    <span>Switch to Demo Library</span>
                  </button>

                  <div className="border-t border-surface-border my-1"></div>

                  <button
                    onClick={() => { setUserDropdownOpen(false); logout(); }}
                    className="w-full text-left px-4 py-2 text-red-400 hover:bg-surface hover:text-red-300 flex items-center gap-2.5 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>

          </div>

        </div>

        {/* Mobile category bar */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-surface-border/50">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const active = currentCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setCurrentCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  active ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

      </div>
    </header>
  );
}
