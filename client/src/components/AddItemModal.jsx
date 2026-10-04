import React, { useState, useEffect } from 'react';
import { 
  X, Search, Film, Tv, Gamepad2, Plus, Sparkles, 
  Check, Loader2, ArrowRight, Package, DollarSign 
} from 'lucide-react';
import { client } from '../api/client';
import confetti from 'canvas-confetti';
import { 
  FORMATS_BY_CATEGORY, 
  DEFAULT_FORMAT_BY_CATEGORY, 
  DEFAULT_PACKAGING_BY_CATEGORY, 
  getFormatsForCategory 
} from '../constants/formats';

export function AddItemModal({ isOpen, onClose, onCreated, shelves = [], initialCategory = 'movie' }) {
  if (!isOpen) return null;

  const [mode, setMode] = useState('search'); // 'search' or 'manual'
  const [category, setCategory] = useState(initialCategory || 'movie'); // 'movie', 'tv', 'game'
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  // Sync category if initialCategory changes when opening
  useEffect(() => {
    if (initialCategory) {
      setCategory(initialCategory);
    }
  }, [initialCategory]);

  // Final submission form state
  const [form, setForm] = useState({
    title: '',
    release_year: '',
    creator: '',
    runtime: '',
    synopsis: '',
    poster_url: '',
    backdrop_url: '',
    status: 'owned',
    ownership_status: 'owned',
    progress_status: 'not_started',
    rating: 0,
    shelf_id: '',
    // Initial edition details
    format: '4K UHD',
    edition_name: 'Standard Edition',
    packaging: 'Standard Case',
    slipcover: false,
    condition: 'Mint',
    purchase_price: '',
    retailer: '',
    storage_location: '',
  });

  const [submitting, setSubmitting] = useState(false);

  // Set default format when category changes
  useEffect(() => {
    const defaultFormat = DEFAULT_FORMAT_BY_CATEGORY[category] || '4K UHD';
    const defaultPackaging = DEFAULT_PACKAGING_BY_CATEGORY[category] || 'Standard Case';
    setForm(prev => ({
      ...prev,
      format: defaultFormat,
      packaging: defaultPackaging,
    }));
  }, [category]);

  // Live search debounce
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await client.get('/lookup/search', { q: searchQuery, category });
        setSearchResults(res.results || []);
      } catch (err) {
        console.error('Lookup search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery, category]);

  const handleSelectCandidate = async (candidate) => {
    setSelectedCandidate(candidate);
    const availableFormats = getFormatsForCategory(category);
    const isSuggestedValid = candidate.suggested_format && availableFormats.some(f => f.value === candidate.suggested_format);
    const resolvedFormat = isSuggestedValid
      ? candidate.suggested_format
      : (availableFormats.some(f => f.value === form.format) ? form.format : (DEFAULT_FORMAT_BY_CATEGORY[category] || '4K UHD'));

    setForm(prev => ({
      ...prev,
      title: candidate.title,
      release_year: candidate.release_year || '',
      creator: candidate.creator || '',
      runtime: candidate.runtime || '',
      synopsis: candidate.synopsis || '',
      poster_url: candidate.poster_url || '',
      backdrop_url: candidate.backdrop_url || '',
      rating: candidate.rating > 0 ? candidate.rating : prev.rating,
      format: resolvedFormat
    }));

    // If candidate needs deeper details and has an id, fetch full details from API
    if ((!candidate.creator || !candidate.synopsis) && candidate.id) {
      try {
        const details = await client.get('/lookup/details', { id: candidate.id, category });
        if (details) {
          setForm(prev => ({
            ...prev,
            creator: details.creator || prev.creator,
            runtime: details.runtime || prev.runtime,
            synopsis: details.synopsis || prev.synopsis,
            rating: details.rating > 0 ? details.rating : prev.rating,
            poster_url: details.poster_url || prev.poster_url,
            backdrop_url: details.backdrop_url || prev.backdrop_url
          }));
        }
      } catch (e) {
        // non-blocking
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      alert('Please enter a title');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        category,
        title: form.title,
        release_year: form.release_year ? parseInt(form.release_year, 10) : null,
        creator: form.creator,
        runtime: form.runtime,
        synopsis: form.synopsis,
        poster_url: form.poster_url,
        backdrop_url: form.backdrop_url,
        ownership_status: form.ownership_status || 'owned',
        progress_status: form.progress_status || 'not_started',
        status: form.ownership_status || 'owned',
        rating: parseFloat(form.rating) || 0,
        shelf_id: form.shelf_id ? parseInt(form.shelf_id, 10) : null,
        edition: {
          format: form.format,
          edition_name: form.edition_name || 'Standard Edition',
          packaging: form.packaging,
          slipcover: form.slipcover ? 1 : 0,
          condition: form.condition,
          purchase_price: form.purchase_price ? parseFloat(form.purchase_price) : 0,
          retailer: form.retailer,
          storage_location: form.storage_location
        }
      };

      const res = await client.post('/items', payload);

      // Trigger celebration confetti!
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 }
        });
      } catch (e) {
        // ignore
      }

      onCreated(res.item);
      onClose();
    } catch (err) {
      alert('Error adding item: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-slate-900/60 backdrop-blur-xs">
      <div 
        className="relative w-full max-w-5xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-forest-500/10 border border-forest-500/20 flex items-center justify-center text-forest-600">
              <Plus className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Add to Collection</h2>
              <p className="text-xs text-slate-500">Catalog physical discs, cartridges, and media</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category & Mode Selector */}
        <div className="px-6 py-3 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          {/* Category Switch */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            {[
              { id: 'movie', label: 'Movie', icon: Film },
              { id: 'tv', label: 'TV Show', icon: Tv },
              { id: 'game', label: 'Game', icon: Gamepad2 }
            ].map((cat) => {
              const Icon = cat.icon;
              const active = category === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setCategory(cat.id);
                    setSelectedCandidate(null);
                    setSearchResults([]);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    active ? 'bg-forest-600 text-white shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Mode Switch (Search vs Manual) */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setMode('search')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                mode === 'search' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🔍 Auto Lookup
            </button>
            <button
              type="button"
              onClick={() => setMode('manual')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                mode === 'manual' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ✍️ Manual Entry
            </button>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
          
          {/* SEARCH AUTO-LOOKUP SECTION */}
          {mode === 'search' && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-semibold text-slate-500">Live Title Search</span>
                  <span className="text-[10px] font-bold text-forest-700 bg-forest-50 border border-forest-200/80 px-2 py-0.5 rounded-md flex items-center gap-1">
                    <span>🎬 IMDb & The Movie Database (TMDb)</span>
                  </span>
                </div>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder={`Search ${category === 'movie' ? 'movies (e.g. Dune, Blade Runner)' : (category === 'tv' ? 'TV series (e.g. Breaking Bad)' : 'games (e.g. Zelda, Elden Ring)')}...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white text-slate-900 pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 focus:border-forest-600 focus:outline-hidden text-sm shadow-xs transition-colors"
                    autoFocus
                  />
                  {isSearching && (
                    <Loader2 className="w-4 h-4 text-forest-600 animate-spin absolute right-3.5 top-1/2 -translate-y-1/2" />
                  )}
                </div>
              </div>

              {/* Search Candidates Grid */}
              {searchResults.length > 0 && !selectedCandidate && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 max-h-84 overflow-y-auto p-1">
                  {searchResults.map((res, i) => (
                    <div
                      key={i}
                      onClick={() => handleSelectCandidate(res)}
                      className="group p-2.5 rounded-xl bg-white border border-slate-200 hover:border-forest-600 hover:shadow-md cursor-pointer transition-all flex flex-col justify-between"
                    >
                      <div className="relative aspect-[2/3] w-full rounded-lg overflow-hidden bg-slate-100 mb-2 border border-slate-200">
                        {res.poster_url ? (
                          <img src={res.poster_url} alt={res.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400 text-[10px]">No Cover</div>
                        )}

                        {res.rating > 0 && (
                          <div className="absolute top-1.5 right-1.5 bg-slate-950/80 backdrop-blur-xs text-emerald-300 font-extrabold text-[10px] px-1.5 py-0.5 rounded border border-emerald-400/30">
                            ★ {res.rating}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800 line-clamp-1 group-hover:text-forest-600">{res.title}</p>
                        <div className="flex items-center justify-between text-[10px] text-slate-500 mt-0.5">
                          <span>{res.release_year || '—'}</span>
                          <span className="text-[9px] font-semibold text-slate-400 truncate max-w-[80px]">
                            {res.creator || (res.source || 'IMDb/TMDb')}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Selected Candidate Preview Banner */}
              {selectedCandidate && (
                <div className="p-4 rounded-2xl bg-forest-50 border border-forest-200 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {form.poster_url && (
                      <img src={form.poster_url} alt={form.title} className="w-12 h-16 object-cover rounded-lg border border-forest-300 shadow-xs" />
                    )}
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] uppercase font-bold text-forest-800 bg-forest-100 px-2 py-0.5 rounded border border-forest-200">
                          IMDb & TMDb Verified
                        </span>
                        {form.rating > 0 && (
                          <span className="text-[10px] font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-forest-200">
                            ★ {form.rating}/10
                          </span>
                        )}
                        {form.runtime && (
                          <span className="text-[10px] text-slate-600">
                            ⏱ {form.runtime}
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-sm text-slate-900 mt-1">{form.title} ({form.release_year})</h4>
                      <p className="text-xs text-slate-600 line-clamp-1">
                        {form.creator ? (category === 'movie' ? `Directed by ${form.creator}` : form.creator) : ''}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedCandidate(null)}
                    className="text-xs text-slate-600 hover:text-slate-900 px-2.5 py-1 rounded-lg bg-white border border-slate-200 shadow-2xs transition-colors shrink-0"
                  >
                    Change Title
                  </button>
                </div>
              )}
            </div>
          )}

          {/* MAIN ENTRY FORM (TITLE & EDITION ATTRIBUTES) */}
          <form id="add-item-form" onSubmit={handleSubmit} className="space-y-6">
            
            {/* Title & Metadata fields */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">General Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                <div className="sm:col-span-2 lg:col-span-2">
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Title *</label>
                  <input
                    type="text"
                    placeholder="e.g. Blade Runner 2049"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full bg-white text-slate-900 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:border-forest-600 focus:outline-hidden shadow-2xs transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Title Type *</label>
                  <select
                    value={category}
                    onChange={(e) => {
                      setCategory(e.target.value);
                      setSelectedCandidate(null);
                      setSearchResults([]);
                    }}
                    className="w-full bg-white text-slate-900 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:border-forest-600 focus:outline-hidden shadow-2xs transition-colors font-medium cursor-pointer"
                  >
                    <option value="movie">Movie</option>
                    <option value="tv">TV Show</option>
                    <option value="game">Game</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Release Year</label>
                  <input
                    type="number"
                    placeholder="2017"
                    value={form.release_year}
                    onChange={(e) => setForm({ ...form, release_year: e.target.value })}
                    className="w-full bg-white text-slate-900 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:border-forest-600 focus:outline-hidden shadow-2xs transition-colors"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Runtime / Length</label>
                  <input
                    type="text"
                    placeholder="e.g. 164 min or 50 hrs"
                    value={form.runtime}
                    onChange={(e) => setForm({ ...form, runtime: e.target.value })}
                    className="w-full bg-white text-slate-900 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:border-forest-600 focus:outline-hidden shadow-2xs transition-colors"
                  />
                </div>

                <div className="sm:col-span-2 lg:col-span-2">
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Director / Studio / Developer</label>
                  <input
                    type="text"
                    placeholder="e.g. Denis Villeneuve"
                    value={form.creator}
                    onChange={(e) => setForm({ ...form, creator: e.target.value })}
                    className="w-full bg-white text-slate-900 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:border-forest-600 focus:outline-hidden shadow-2xs transition-colors"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Assign to Shelf</label>
                  <select
                    value={form.shelf_id}
                    onChange={(e) => setForm({ ...form, shelf_id: e.target.value })}
                    className="w-full bg-white text-slate-900 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:border-forest-600 focus:outline-hidden shadow-2xs transition-colors"
                  >
                    <option value="">None (Unsorted)</option>
                    {shelves.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Rating (0 - 10)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    placeholder="8.5"
                    value={form.rating || ''}
                    onChange={(e) => setForm({ ...form, rating: e.target.value })}
                    className="w-full bg-white text-slate-900 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:border-forest-600 focus:outline-hidden shadow-2xs transition-colors"
                  />
                </div>

                <div className="sm:col-span-1 lg:col-span-2">
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Library Possession</label>
                  <select
                    value={form.ownership_status}
                    onChange={(e) => setForm({ ...form, ownership_status: e.target.value, status: e.target.value })}
                    className="w-full bg-white text-slate-900 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:border-forest-600 focus:outline-hidden shadow-2xs transition-colors"
                  >
                    <option value="owned">Owned</option>
                    <option value="borrowed">Borrowed</option>
                    <option value="wishlist">Wishlist</option>
                  </select>
                </div>

                <div className="sm:col-span-1 lg:col-span-2">
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Watch / Play Progress</label>
                  <select
                    value={form.progress_status}
                    onChange={(e) => setForm({ ...form, progress_status: e.target.value })}
                    className="w-full bg-white text-slate-900 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:border-forest-600 focus:outline-hidden shadow-2xs transition-colors"
                  >
                    <option value="not_started">Backlog (Not Started)</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                <div className="sm:col-span-2 lg:col-span-4">
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Poster Image URL</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={form.poster_url}
                    onChange={(e) => setForm({ ...form, poster_url: e.target.value })}
                    className="w-full bg-white text-slate-900 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:border-forest-600 focus:outline-hidden shadow-2xs transition-colors"
                  />
                </div>

                <div className="sm:col-span-2 lg:col-span-4">
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Synopsis / Overview</label>
                  <textarea
                    rows={2}
                    placeholder="Brief description of the media..."
                    value={form.synopsis}
                    onChange={(e) => setForm({ ...form, synopsis: e.target.value })}
                    className="w-full bg-white text-slate-900 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:border-forest-600 focus:outline-hidden shadow-2xs transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* PHYSICAL EDITION DETAILS */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-forest-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-forest-700">
                  Physical Edition & Packaging Details
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Media Format *</label>
                  <select
                    value={form.format}
                    onChange={(e) => setForm({ ...form, format: e.target.value })}
                    className="w-full bg-slate-50 hover:bg-white text-slate-900 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:bg-white focus:border-forest-600 focus:outline-hidden shadow-2xs transition-colors"
                  >
                    {getFormatsForCategory(category).map((fmt) => (
                      <option key={fmt.value} value={fmt.value}>
                        {fmt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Packaging Type</label>
                  <select
                    value={form.packaging}
                    onChange={(e) => setForm({ ...form, packaging: e.target.value })}
                    className="w-full bg-slate-50 hover:bg-white text-slate-900 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:bg-white focus:border-forest-600 focus:outline-hidden shadow-2xs transition-colors"
                  >
                    <option value="Standard Case">Standard Keep Case</option>
                    <option value="Steelbook">Steelbook</option>
                    <option value="Digibook">Digibook / Digipak</option>
                    <option value="Slipcover">Slipcase / O-Ring</option>
                    <option value="Box Set">Collector Box Set</option>
                    <option value="Cartridge Only">Loose Cartridge</option>
                    <option value="Digital">Digital Code</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Edition Name / Label</label>
                  <input
                    type="text"
                    placeholder="e.g. Collector's Edition, Spine #1042"
                    value={form.edition_name}
                    onChange={(e) => setForm({ ...form, edition_name: e.target.value })}
                    className="w-full bg-slate-50 hover:bg-white text-slate-900 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:bg-white focus:border-forest-600 focus:outline-hidden shadow-2xs transition-colors"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Condition</label>
                  <select
                    value={form.condition}
                    onChange={(e) => setForm({ ...form, condition: e.target.value })}
                    className="w-full bg-slate-50 hover:bg-white text-slate-900 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:bg-white focus:border-forest-600 focus:outline-hidden shadow-2xs transition-colors"
                  >
                    <option value="New/Sealed">New / Sealed</option>
                    <option value="Mint">Mint</option>
                    <option value="Very Good">Very Good</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Purchase Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="29.99"
                    value={form.purchase_price}
                    onChange={(e) => setForm({ ...form, purchase_price: e.target.value })}
                    className="w-full bg-slate-50 hover:bg-white text-slate-900 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:bg-white focus:border-forest-600 focus:outline-hidden shadow-2xs transition-colors"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Storage / Shelf Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Shelf A, Row 2"
                    value={form.storage_location}
                    onChange={(e) => setForm({ ...form, storage_location: e.target.value })}
                    className="w-full bg-slate-50 hover:bg-white text-slate-900 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:bg-white focus:border-forest-600 focus:outline-hidden shadow-2xs transition-colors"
                  />
                </div>

                <div className="sm:col-span-3 flex items-center gap-4 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 font-medium">
                    <input
                      type="checkbox"
                      checked={form.slipcover}
                      onChange={(e) => setForm({ ...form, slipcover: e.target.checked })}
                      className="rounded border-slate-300 text-forest-600 focus:ring-forest-500"
                    />
                    <span>Has Slipcover</span>
                  </label>
                </div>
              </div>
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            Cancel
          </button>

          <button
            form="add-item-form"
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-forest-600 to-forest-700 hover:from-forest-500 hover:to-forest-600 text-white font-bold text-sm shadow-md transition-all"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span>Add to Collection</span>
          </button>
        </div>

      </div>
    </div>
  );
}
