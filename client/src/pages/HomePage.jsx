import React, { useState, useEffect } from 'react';
import { 
  Disc, Film, Tv, Gamepad2, Sparkles, Layers, Star, 
  ArrowRight, ShieldCheck, Play, Pause, 
  CheckCircle2, Compass, Library, 
  Barcode, BarChart3, ChevronRight, X, ExternalLink,
  Eye
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { client } from '../api/client';

// Initial default media items from the demo account
const INITIAL_DEMO_MEDIA = [
  {
    id: 1,
    title: 'Dune: Part Two',
    category: 'movie',
    format: '4K UHD',
    packaging: 'Steelbook',
    edition_name: 'Limited Edition Steelbook',
    release_year: 2024,
    rating: 9.5,
    creator: 'Denis Villeneuve',
    genres: ['Sci-Fi', 'Adventure'],
    poster_url: 'https://upload.wikimedia.org/wikipedia/en/5/52/Dune_Part_Two_poster.jpeg',
    synopsis: 'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.',
    slipcover: false
  },
  {
    id: 2,
    title: 'Oppenheimer',
    category: 'movie',
    format: '4K UHD',
    packaging: 'Slipcover',
    edition_name: 'Iconic 3-Disc Collector Set with Slipcover',
    release_year: 2023,
    rating: 9.2,
    creator: 'Christopher Nolan',
    genres: ['Biography', 'Drama', 'History'],
    poster_url: 'https://upload.wikimedia.org/wikipedia/en/4/4a/Oppenheimer_%28film%29.jpg',
    synopsis: 'The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb during World War II.',
    slipcover: true
  },
  {
    id: 3,
    title: 'Seven Samurai',
    category: 'movie',
    format: 'Criterion 4K',
    packaging: 'Digibook',
    edition_name: 'Criterion Collection #2 (4K Remastered Digipak)',
    release_year: 1954,
    rating: 10,
    creator: 'Akira Kurosawa',
    genres: ['Action', 'Drama'],
    poster_url: 'https://upload.wikimedia.org/wikipedia/commons/b/ba/Seven_Samurai_poster.jpg',
    synopsis: 'Farmers in a village hire seven ronin to protect their crops from bandits in 16th century Japan.',
    slipcover: true
  },
  {
    id: 4,
    title: 'Breaking Bad',
    category: 'tv',
    format: 'Blu-ray',
    packaging: 'Box Set',
    edition_name: 'Complete Series Barrel Collector Box Set',
    release_year: 2008,
    rating: 9.9,
    creator: 'Vince Gilligan (AMC)',
    genres: ['Crime', 'Drama', 'Thriller'],
    poster_url: 'https://upload.wikimedia.org/wikipedia/en/6/61/Breaking_Bad_title_card.png',
    synopsis: 'A chemistry teacher diagnosed with inoperable lung cancer turns to manufacturing methamphetamine with a former student.',
    slipcover: false
  },
  {
    id: 5,
    title: 'The Legend of Zelda: Tears of the Kingdom',
    category: 'game',
    format: 'Nintendo Switch',
    packaging: 'Box Set',
    edition_name: 'Collector’s Edition Box Set with SteelBook',
    release_year: 2023,
    rating: 9.8,
    creator: 'Nintendo EPD',
    genres: ['Action', 'Adventure'],
    poster_url: 'https://upload.wikimedia.org/wikipedia/en/f/fb/The_Legend_of_Zelda_Tears_of_the_Kingdom_cover.jpg',
    synopsis: 'An epic adventure across the land and skies of Hyrule awaits in The Legend of Zelda: Tears of the Kingdom.',
    slipcover: true
  },
  {
    id: 6,
    title: 'Elden Ring',
    category: 'game',
    format: 'PlayStation 5',
    packaging: 'Slipcover',
    edition_name: 'Launch Edition Physical Disc with Art Cards',
    release_year: 2022,
    rating: 10,
    creator: 'FromSoftware / Bandai Namco',
    genres: ['Action RPG', 'Open World'],
    poster_url: 'https://upload.wikimedia.org/wikipedia/en/b/b9/Elden_Ring_Box_art.jpg',
    synopsis: 'Rise, Tarnished, and be guided by grace to brandish the power of the Elden Ring and become an Elden Lord in the Lands Between.',
    slipcover: true
  },
  {
    id: 20,
    title: 'Sanford and Son',
    category: 'tv',
    format: 'Blu-ray',
    packaging: 'Box Set',
    edition_name: 'Complete Series Box Set',
    release_year: 1972,
    rating: 7.9,
    creator: 'Norman Lear',
    genres: ['Comedy', 'Sitcom'],
    poster_url: 'https://images.metahub.space/poster/small/tt0068128/img',
    synopsis: 'The misadventures of a cantankerous junk dealer and his frustrated son in Los Angeles.',
    slipcover: false
  }
];

export function HomePage({ onNavigate }) {
  const { user } = useAuth();
  const [demoMedia, setDemoMedia] = useState(INITIAL_DEMO_MEDIA);
  const [isPaused, setIsPaused] = useState(false);
  const [previewTitle, setPreviewTitle] = useState(null);

  // Fetch actual media items from the demo account via API
  useEffect(() => {
    let isMounted = true;
    async function loadDemoMedia() {
      try {
        const res = await client.get('/items');
        if (isMounted && res.items && res.items.length > 0) {
          const formatted = res.items.map(item => ({
            id: item.id,
            title: item.title,
            category: item.category || 'movie',
            format: item.primary_format || (item.category === 'game' ? 'PS5 / Switch' : '4K UHD'),
            packaging: item.primary_packaging || 'Standard Case',
            edition_name: item.editions?.[0]?.edition_name || 'Standard Edition',
            release_year: item.release_year,
            rating: item.rating || 9.0,
            creator: item.creator,
            genres: item.genres || [],
            poster_url: item.poster_url,
            synopsis: item.synopsis,
            slipcover: Boolean(item.primary_slipcover)
          })).filter(it => it.poster_url);

          if (formatted.length > 0) {
            setDemoMedia(formatted);
          }
        }
      } catch (err) {
        console.debug('Using initial demo media:', err);
      }
    }
    loadDemoMedia();
    return () => { isMounted = false; };
  }, []);

  const getFormatBadgeStyle = (format) => {
    const f = (format || '').toLowerCase();
    if (f.includes('4k')) return 'bg-amber-500/20 text-amber-300 border-amber-400/40';
    if (f.includes('steelbook')) return 'bg-sky-500/20 text-sky-300 border-sky-400/40';
    if (f.includes('criterion')) return 'bg-rose-500/20 text-rose-300 border-rose-400/40';
    if (f.includes('switch')) return 'bg-red-500/20 text-red-300 border-red-400/40';
    if (f.includes('playstation') || f.includes('ps5') || f.includes('ps4')) return 'bg-blue-500/20 text-blue-300 border-blue-400/40';
    if (f.includes('xbox')) return 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40';
    return 'bg-forest-500/20 text-emerald-300 border-emerald-400/40';
  };

  const getCategoryIcon = (category) => {
    if (category === 'tv') return <Tv className="w-3 h-3 text-sky-400" />;
    if (category === 'game') return <Gamepad2 className="w-3 h-3 text-emerald-400" />;
    return <Film className="w-3 h-3 text-amber-400" />;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-forest-500 selection:text-white font-sans overflow-x-hidden">
      
      {/* Ambient background glows */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[550px] bg-gradient-to-b from-forest-700/25 via-emerald-600/10 to-transparent blur-3xl pointer-events-none -z-10" />
      <div className="fixed -top-40 -left-40 w-96 h-96 bg-forest-600/15 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="fixed top-1/3 -right-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Top Navigation */}
      <header className="sticky top-0 z-50 bg-slate-950/85 backdrop-blur-xl border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Brand Logo */}
          <div 
            onClick={() => onNavigate && onNavigate('/')} 
            className="flex items-center gap-3 group cursor-pointer"
          >
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 via-forest-500 to-forest-700 flex items-center justify-center shadow-lg shadow-forest-950/50 group-hover:scale-105 transition-transform">
              <Disc className="w-6 h-6 text-white animate-spin-slow" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-xl sm:text-2xl tracking-tight text-white flex items-center gap-2">
                SHELFMARK
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 bg-forest-900/90 px-2 py-0.5 rounded-md border border-forest-600/60">
                  COLLECTOR
                </span>
              </span>
              <span className="text-xs text-slate-400 font-medium">Physical Media & Game Archive</span>
            </div>
          </div>

          {/* Center Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#showcase" className="hover:text-emerald-400 transition-colors flex items-center gap-1.5">
              <span>Demo Media Window</span>
            </a>
            <a href="#features" className="hover:text-emerald-400 transition-colors">
              Collector Features
            </a>
            <a href="#formats" className="hover:text-emerald-400 transition-colors">
              Formats & Discs
            </a>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <span className="hidden sm:inline text-xs text-slate-400">
                  Signed in as <strong className="text-emerald-400">{user.display_name || user.username}</strong>
                </span>
                <button
                  onClick={() => onNavigate && onNavigate('/dashboard')}
                  className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-forest-600 hover:bg-forest-500 text-white shadow-md shadow-forest-950/40 flex items-center gap-2 transition-all hover:translate-y-[-1px] cursor-pointer"
                >
                  <Library className="w-4 h-4" />
                  <span>Go to Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={() => onNavigate && onNavigate('/login')}
                  className="px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl transition-all shadow-xs cursor-pointer"
                >
                  Sign In
                </button>
                <button
                  onClick={() => onNavigate && onNavigate('/register')}
                  className="hidden sm:inline-flex px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-200 hover:text-white bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 rounded-xl transition-all cursor-pointer"
                >
                  Create Account
                </button>
                <button
                  onClick={() => onNavigate && onNavigate('/dashboard')}
                  className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-forest-600 hover:bg-forest-500 text-white shadow-md shadow-forest-900/40 flex items-center gap-1.5 transition-all hover:translate-y-[-1px] cursor-pointer"
                >
                  <span>Open Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>

        </div>
      </header>

      {/* Main Page Body */}
      <main className="flex-1 space-y-20 pb-24">

        {/* Hero Section */}
        <section className="pt-16 sm:pt-24 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center space-y-8">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-forest-900/60 border border-forest-600/60 text-emerald-300 text-xs sm:text-sm font-semibold shadow-inner">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>Dedicated Physical & Gaming Collection Tracker</span>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white leading-[1.1]">
            Every Disc. Every Steelbook.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-forest-400 to-teal-300">
              Masterfully Cataloged.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-xl text-slate-300 max-w-3xl mx-auto font-normal leading-relaxed">
            Built for physical media enthusiasts, boutique label purists, and video game collectors. Track editions, slipcovers, mint conditions, disc counts, and browse your entire archive as a realistic wooden bookshelf.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={() => onNavigate && onNavigate('/dashboard')}
              className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-forest-600 hover:bg-forest-500 text-white font-extrabold text-sm sm:text-base shadow-lg shadow-forest-900/50 flex items-center justify-center gap-2.5 transition-all hover:scale-[1.02] cursor-pointer"
            >
              <Library className="w-5 h-5 text-emerald-200" />
              <span>Explore Collection Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onNavigate && onNavigate('/register')}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white font-bold text-sm sm:text-base border border-slate-700/80 shadow-md flex items-center justify-center gap-2 transition-all hover:scale-[1.02] cursor-pointer"
            >
              <span>Create Free Account</span>
              <span className="text-xs px-2 py-0.5 rounded bg-forest-900/80 text-emerald-300 border border-forest-700/60 font-semibold">Free</span>
            </button>
          </div>

          {/* Feature Badges Bar */}
          <div className="pt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-slate-400 font-medium">
            <div className="flex items-center justify-center gap-2 bg-slate-900/50 py-2 px-3 rounded-xl border border-slate-800/80">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Edition-Level Precision</span>
            </div>
            <div className="flex items-center justify-center gap-2 bg-slate-900/50 py-2 px-3 rounded-xl border border-slate-800/80">
              <Layers className="w-4 h-4 text-sky-400" />
              <span>Bookshelf Spine View</span>
            </div>
            <div className="flex items-center justify-center gap-2 bg-slate-900/50 py-2 px-3 rounded-xl border border-slate-800/80">
              <Barcode className="w-4 h-4 text-amber-400" />
              <span>Instant TMDB Auto-fill</span>
            </div>
            <div className="flex items-center justify-center gap-2 bg-slate-900/50 py-2 px-3 rounded-xl border border-slate-800/80">
              <BarChart3 className="w-4 h-4 text-purple-400" />
              <span>Investment Analytics</span>
            </div>
          </div>

        </section>


        {/* ========================================================
            THE SCROLLING MEDIA PANEL (NO FILTERS, SHOWING DEMO ACCOUNT MEDIA)
            ======================================================== */}
        <section id="showcase" className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          
          {/* Showcase Window Frame Container */}
          <div className="relative rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl shadow-forest-950/80 overflow-hidden backdrop-blur-md">
            
            {/* Ambient green rim glow */}
            <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-forest-600/25 blur-3xl pointer-events-none" />

            {/* Window Top Titlebar / Control Deck (No Category Filters) */}
            <div className="p-4 sm:p-6 border-b border-slate-800/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-950/60">
              
              {/* Window Title & Live Status */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                    Demo Account Media
                  </span>
                </div>

                <div>
                  <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                    Media from Demo Collection
                    <span className="text-xs text-slate-400 font-normal hidden sm:inline">
                      ({demoMedia.length} titles)
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400 hidden sm:block">
                    Movies, TV shows, and video games currently cataloged in the demo collector profile.
                  </p>
                </div>
              </div>

              {/* Window Controls: Play/Pause Control */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPaused(!isPaused)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                    isPaused 
                      ? 'bg-amber-950/40 text-amber-300 border-amber-700/60 hover:bg-amber-900/50' 
                      : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white'
                  }`}
                  title={isPaused ? 'Resume scrolling' : 'Pause scrolling'}
                >
                  {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                  <span>{isPaused ? 'Resume' : 'Pause'}</span>
                </button>
              </div>

            </div>

            {/* Inner Window Display Screen (Continuous Marquee of Demo Account Media) */}
            <div className="py-6 sm:py-8 space-y-6 sm:space-y-8 bg-slate-950/70 overflow-hidden relative">
              
              {/* Fade gradients on left & right viewport edges for infinite feel */}
              <div className="absolute top-0 bottom-0 left-0 w-16 sm:w-28 bg-gradient-to-r from-slate-950 to-transparent z-20 pointer-events-none" />
              <div className="absolute top-0 bottom-0 right-0 w-16 sm:w-28 bg-gradient-to-l from-slate-950 to-transparent z-20 pointer-events-none" />

              {/* Continuous Marquee Stream of Demo Media */}
              <div className="overflow-hidden">
                <div 
                  className={`flex gap-5 sm:gap-6 animate-marquee-left ${isPaused ? 'is-paused' : ''}`}
                >
                  {/* Repeated to form an infinite seamless loop */}
                  {[...demoMedia, ...demoMedia, ...demoMedia].map((item, idx) => (
                    <div
                      key={`demo-item-${item.id}-${idx}`}
                      onClick={() => setPreviewTitle(item)}
                      className="group/card flex-shrink-0 w-52 sm:w-60 cursor-pointer select-none rounded-2xl bg-slate-900 border border-slate-800/90 hover:border-emerald-500/80 p-3 shadow-lg hover:shadow-forest-950/80 transition-all duration-300 hover:scale-[1.03] hover:-translate-y-1.5 flex flex-col justify-between"
                    >
                      {/* Poster Art with glare effect */}
                      <div className="relative aspect-[2/3] w-full rounded-xl overflow-hidden bg-slate-950 shadow-md">
                        <img
                          src={item.poster_url}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                        
                        {/* Shimmer case glare */}
                        <div className="case-sheen absolute inset-0 pointer-events-none" />

                        {/* Top format tag */}
                        <div className="absolute top-2 left-2 z-10 flex flex-col gap-1 items-start">
                          <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md border backdrop-blur-md shadow-xs ${getFormatBadgeStyle(item.format)}`}>
                            {item.format}
                          </span>
                        </div>

                        {/* Rating pill */}
                        {item.rating > 0 && (
                          <div className="absolute top-2 right-2 z-10 bg-slate-950/85 backdrop-blur-md border border-slate-700/60 px-1.5 py-0.5 rounded-md flex items-center gap-1 text-[11px] font-bold text-amber-400">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            <span>{item.rating}</span>
                          </div>
                        )}

                        {/* Quick View Hover overlay */}
                        <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-2xs opacity-0 group-hover/card:opacity-100 transition-opacity flex items-center justify-center p-3 text-center">
                          <span className="px-3 py-1.5 rounded-xl bg-forest-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md">
                            <Eye className="w-3.5 h-3.5" />
                            <span>Inspect Item</span>
                          </span>
                        </div>
                      </div>

                      {/* Card Meta Content */}
                      <div className="mt-3 space-y-1 text-left">
                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                          {getCategoryIcon(item.category)}
                          <span className="capitalize font-medium text-[11px] text-slate-300">{item.category}</span>
                          <span className="text-slate-600">•</span>
                          <span className="text-[11px]">{item.release_year || 'Classic'}</span>
                        </div>

                        <h4 className="font-bold text-sm text-white truncate group-hover/card:text-emerald-400 transition-colors">
                          {item.title}
                        </h4>
                        
                        <div className="flex items-center justify-between text-xs text-slate-400 pt-0.5">
                          <span className="text-[10px] font-semibold text-slate-300 bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700/50 truncate max-w-[120px]">
                            {item.packaging}
                          </span>

                          {item.slipcover && (
                            <span className="text-[10px] text-emerald-400 font-semibold bg-forest-950/80 px-1.5 py-0.5 rounded border border-forest-800/60">
                              Slipcover
                            </span>
                          )}
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Window Bottom Dock */}
            <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Streaming live demo library items • Click any title to inspect physical edition specs</span>
              </div>

              <button
                onClick={() => onNavigate && onNavigate('/dashboard')}
                className="font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 transition-colors group cursor-pointer"
              >
                <span>Explore Full Collection Dashboard</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

          </div>

        </section>


        {/* ========================================================
            COLLECTOR FEATURES GRID
            ======================================================== */}
        <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 bg-forest-950/80 border border-forest-800/80 px-3 py-1 rounded-full">
              Engineered For Physical Media
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              A Real Collector's Archive
            </h2>
            <p className="text-slate-400 text-sm sm:text-base">
              Say goodbye to generic movie apps. Shelfmark is purpose-built to preserve physical details that matter to passionate collectors.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Feature 1 */}
            <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-forest-600/60 transition-all space-y-3 shadow-md hover:-translate-y-1">
              <div className="w-12 h-12 rounded-2xl bg-forest-900/80 border border-forest-700/60 flex items-center justify-center text-emerald-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Edition-Level Precision</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Log slipcovers, steelbooks, digipaks, disc counts, and condition grades (Mint, Near Mint, Sealed). Never buy a duplicate edition again.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-forest-600/60 transition-all space-y-3 shadow-md hover:-translate-y-1">
              <div className="w-12 h-12 rounded-2xl bg-emerald-950/80 border border-emerald-700/60 flex items-center justify-center text-emerald-400">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Authentic Shelf Spine View</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Switch from poster grids to an authentic bookshelf. Each spine features simulated wooden shelves, spine heights, and format color-coding.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-forest-600/60 transition-all space-y-3 shadow-md hover:-translate-y-1">
              <div className="w-12 h-12 rounded-2xl bg-sky-950/80 border border-sky-700/60 flex items-center justify-center text-sky-400">
                <Barcode className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Smart Barcode & TMDB Search</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Scan UPC barcodes or type titles. Shelfmark instantly fills directors, cast, release years, runtimes, and high-definition poster artwork.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-forest-600/60 transition-all space-y-3 shadow-md hover:-translate-y-1">
              <div className="w-12 h-12 rounded-2xl bg-amber-950/80 border border-amber-700/60 flex items-center justify-center text-amber-400">
                <Library className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Boutique & Themed Shelves</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Organize by boutique labels (Criterion, Arrow Video, Scream Factory), favorite franchises, or console platforms with custom color codes.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-forest-600/60 transition-all space-y-3 shadow-md hover:-translate-y-1">
              <div className="w-12 h-12 rounded-2xl bg-purple-950/80 border border-purple-700/60 flex items-center justify-center text-purple-400">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Insights & Analytics</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Understand your collection value, total investment, format distribution, and track backlog progress for unwatched movies and games.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-forest-600/60 transition-all space-y-3 shadow-md hover:-translate-y-1">
              <div className="w-12 h-12 rounded-2xl bg-teal-950/80 border border-teal-700/60 flex items-center justify-center text-teal-400">
                <Compass className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Total Data Ownership</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Your archive belongs to you. Export full JSON databases, CSV backups, or load sample collections at any time with complete offline safety.
              </p>
            </div>

          </div>

        </section>


        {/* ========================================================
            SUPPORTED FORMATS SHOWCASE
            ======================================================== */}
        <section id="formats" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-slate-900 via-forest-950/40 to-slate-900 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-8">
            
            <div className="space-y-4 max-w-xl text-left">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-forest-900/80 px-2.5 py-1 rounded border border-forest-700">
                Format Versatility
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                Movies, TV Series, and Video Games
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                From 4K Ultra HD discs and boutique label Digipaks to Nintendo Switch cartridges, PlayStation 5 cases, and retro VHS tapes. Shelfmark tailors format dropdowns and edition fields to each title type.
              </p>

              <div className="flex flex-wrap gap-2 pt-2">
                {[
                  '4K UHD', 'Blu-ray', 'Steelbook', 'Criterion Collection', 'Arrow Video',
                  'Nintendo Switch', 'PlayStation 5', 'PlayStation 4', 'Xbox Series X', 'PC Steam'
                ].map((tag) => (
                  <span key={tag} className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700/80 text-slate-200 font-medium">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3 shrink-0 w-full sm:w-auto">
              <button
                onClick={() => onNavigate && onNavigate('/dashboard')}
                className="px-6 py-3.5 rounded-2xl bg-forest-600 hover:bg-forest-500 text-white font-extrabold text-sm shadow-lg shadow-forest-900/50 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Library className="w-4 h-4" />
                <span>Open Dashboard Collection</span>
              </button>
              <button
                onClick={() => onNavigate && onNavigate('/register')}
                className="px-6 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm border border-slate-700 text-center transition-all cursor-pointer"
              >
                Create Account
              </button>
            </div>

          </div>

        </section>

      </main>

      {/* Quick Title Inspection Modal (on Home Page) */}
      {previewTitle && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
          onClick={() => setPreviewTitle(null)}
        >
          <div 
            className="relative w-full max-w-lg bg-slate-900 rounded-3xl border border-slate-700 shadow-2xl p-6 space-y-5 text-left"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex gap-4">
                <div className="w-20 aspect-[2/3] rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shrink-0 shadow-md">
                  <img src={previewTitle.poster_url} alt={previewTitle.title} className="w-full h-full object-cover" />
                </div>
                <div>
                  <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md border ${getFormatBadgeStyle(previewTitle.format)}`}>
                    {previewTitle.format}
                  </span>
                  <h3 className="text-lg font-bold text-white mt-1.5 leading-snug">{previewTitle.title}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {previewTitle.release_year} • {previewTitle.creator || 'Physical Release'}
                  </p>
                  {previewTitle.rating > 0 && (
                    <div className="flex items-center gap-1 text-xs text-amber-400 font-bold mt-1">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{previewTitle.rating} / 10</span>
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={() => setPreviewTitle(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Synopsis */}
            {previewTitle.synopsis && (
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/50 p-3 rounded-xl border border-slate-800">
                {previewTitle.synopsis}
              </p>
            )}

            {/* Edition Specs */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Packaging</span>
                <span className="text-slate-200 font-semibold">{previewTitle.packaging}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Slipcover</span>
                <span className="text-slate-200 font-semibold">{previewTitle.slipcover ? 'Yes (Present)' : 'None'}</span>
              </div>
            </div>

            {/* Action inside modal */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                onClick={() => setPreviewTitle(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setPreviewTitle(null);
                  if (onNavigate) onNavigate('/dashboard');
                }}
                className="px-4 py-2 rounded-xl bg-forest-600 hover:bg-forest-500 text-white text-xs font-bold flex items-center gap-2 shadow-md transition-all cursor-pointer"
              >
                <span>View In Dashboard</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/90 py-12 px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-500 space-y-4">
        <div className="flex items-center justify-center gap-2">
          <Disc className="w-4 h-4 text-emerald-400" />
          <span className="font-bold text-slate-300 tracking-wider">SHELFMARK COLLECTOR</span>
        </div>
        <p className="max-w-md mx-auto">
          The ultimate physical media archive for 4K UHD, Blu-ray discs, boutique box sets, and video games.
        </p>
        <div className="flex items-center justify-center gap-6 text-slate-400 pt-2">
          <button onClick={() => onNavigate && onNavigate('/dashboard')} className="hover:text-emerald-400 transition-colors cursor-pointer">
            Collection Dashboard
          </button>
          <button onClick={() => onNavigate && onNavigate('/login')} className="hover:text-emerald-400 transition-colors cursor-pointer">
            Sign In
          </button>
          <button onClick={() => onNavigate && onNavigate('/register')} className="hover:text-emerald-400 transition-colors cursor-pointer">
            Create Account
          </button>
        </div>
        <p className="pt-4 text-slate-600">
          © {new Date().getFullYear()} Shelfmark. All rights reserved.
        </p>
      </footer>

    </div>
  );
}
