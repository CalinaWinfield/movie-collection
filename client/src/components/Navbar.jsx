import React, { useState, useRef, useEffect } from 'react';
import { 
  Film, Tv, Gamepad2, Disc, Search, Plus, Layers, 
  BarChart3, Download, User, LogOut, Sparkles,
  LayoutGrid, StretchHorizontal, Home
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
  onOpenStatsModal,
  onOpenBackupModal,
  onNavigate
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
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-[1750px] mx-auto px-4 sm:px-8 lg:px-12">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & Category Switcher */}
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setCurrentCategory('all')}>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 via-forest-500 to-forest-700 flex items-center justify-center shadow-md">
                <Disc className="w-6 h-6 text-white animate-spin-slow" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-xl tracking-tight text-slate-900 flex items-center gap-1.5">
                  SHELFMARK
                  <span className="text-[10px] font-bold uppercase tracking-wider text-forest-700 bg-forest-50 px-1.5 py-0.5 rounded border border-forest-200">
                    COLLECTOR
                  </span>
                </span>
                <span className="text-[11px] text-slate-500 -mt-1 tracking-tight">Physical & Media Library</span>
              </div>
            </div>

            {/* Home link */}
            <button
              onClick={() => onNavigate ? onNavigate('/') : (window.location.href = '/')}
              className="hidden xl:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-950 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors cursor-pointer"
              title="Return to Home Showcase"
            >
              <Home className="w-3.5 h-3.5 text-forest-600" />
              <span>Home</span>
            </button>

            {/* Category tabs */}
            <nav className="hidden md:flex items-center space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200/70">
              {categories.map((cat) => {
                const Icon = cat.icon;
                const active = currentCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setCurrentCategory(cat.id)}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                      active
                        ? 'bg-forest-600 text-white shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
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
          <div className="flex-1 max-w-lg mx-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search collection, format, director, barcode..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-100 text-slate-900 pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:bg-white focus:border-forest-600 focus:ring-2 focus:ring-forest-600/20 transition-all placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 px-1"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Action Tools & User Menu */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* View Switchers */}
            <div className="hidden lg:flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg text-xs transition-colors ${viewMode === 'grid' ? 'bg-white text-forest-700 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-800'}`}
                title="Poster Grid"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('shelf')}
                className={`p-1.5 rounded-lg text-xs transition-colors ${viewMode === 'shelf' ? 'bg-white text-forest-700 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-800'}`}
                title="Physical Shelf Spine View"
              >
                <StretchHorizontal className="w-4 h-4" />
              </button>
            </div>

            {/* Shelves Manager */}
            <button
              onClick={onOpenShelvesModal}
              className="flex items-center gap-1.5 px-3.5 py-2 text-sm rounded-xl text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 shadow-xs transition-all font-medium"
              title="Custom Shelves"
            >
              <Layers className="w-4 h-4 text-forest-600" />
              <span className="hidden sm:inline">Shelves</span>
            </button>

            {/* Collector Insights / Stats */}
            <button
              onClick={onOpenStatsModal}
              className="flex items-center gap-1.5 px-3.5 py-2 text-sm rounded-xl text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 shadow-xs transition-all font-medium"
              title="Collector Stats & Insights"
            >
              <BarChart3 className="w-4 h-4 text-sky-500" />
              <span className="hidden sm:inline">Insights</span>
            </button>

            {/* If user is signed in: show Add Title & User profile. If guest: show Sign In & Create Account */}
            {user ? (
              <>
                <button
                  onClick={onOpenAddModal}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold rounded-xl text-white bg-forest-600 hover:bg-forest-700 shadow-sm transition-all"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span className="hidden sm:inline">Add Title</span>
                </button>

                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:border-forest-600/70 shadow-xs transition-all"
                    title={user?.display_name || user?.username}
                  >
                    <User className="w-4 h-4 text-slate-600" />
                  </button>

                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white border border-slate-200 shadow-xl py-2 z-50 text-sm">
                      <div className="px-4 py-2 border-b border-slate-100">
                        <p className="font-bold text-slate-900 truncate">{user?.display_name || user?.username}</p>
                        <p className="text-xs text-slate-500 truncate">@{user?.username}</p>
                      </div>

                      <button
                        onClick={() => { setUserDropdownOpen(false); onOpenBackupModal(); }}
                        className="w-full text-left px-4 py-2 text-slate-700 hover:bg-slate-50 hover:text-slate-900 flex items-center gap-2.5 transition-colors"
                      >
                        <Download className="w-4 h-4 text-forest-600" />
                        <span>Import / Export & Backup</span>
                      </button>

                      <button
                        onClick={() => { setUserDropdownOpen(false); loginDemo(); }}
                        className="w-full text-left px-4 py-2 text-slate-700 hover:bg-slate-50 hover:text-slate-900 flex items-center gap-2.5 transition-colors"
                      >
                        <Sparkles className="w-4 h-4 text-sky-500" />
                        <span>Switch to Demo Library</span>
                      </button>

                      <div className="border-t border-slate-100 my-1"></div>

                      <button
                        onClick={() => { 
                          setUserDropdownOpen(false); 
                          logout(); 
                          if (onNavigate) onNavigate('/login');
                        }}
                        className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 flex items-center gap-2.5 transition-colors font-medium"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onNavigate && onNavigate('/login')}
                  className="px-3 sm:px-3.5 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-all shadow-2xs"
                >
                  Sign In
                </button>
                <button
                  onClick={() => onNavigate && onNavigate('/register')}
                  className="px-3 sm:px-3.5 py-1.5 sm:py-2 text-xs sm:text-sm font-bold text-white bg-forest-600 hover:bg-forest-700 rounded-xl shadow-xs transition-all"
                >
                  Create Account
                </button>
              </div>
            )}

          </div>

        </div>

        {/* Mobile category bar */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-200">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const active = currentCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setCurrentCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  active ? 'bg-forest-600 text-white font-bold' : 'text-slate-600'
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
