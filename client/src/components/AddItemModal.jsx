import React, { useState, useEffect } from 'react';
import { 
  X, Search, Film, Tv, Gamepad2, Plus, Sparkles, 
  Check, Loader2, ArrowRight, Package, DollarSign 
} from 'lucide-react';
import { client } from '../api/client';
import confetti from 'canvas-confetti';

export function AddItemModal({ isOpen, onClose, onCreated, shelves = [] }) {
  if (!isOpen) return null;

  const [mode, setMode] = useState('search'); // 'search' or 'manual'
  const [category, setCategory] = useState('movie'); // 'movie', 'tv', 'game'
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);

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
    if (category === 'game') {
      setForm(prev => ({ ...prev, format: 'Nintendo Switch', packaging: 'Standard Case' }));
    } else if (category === 'tv') {
      setForm(prev => ({ ...prev, format: 'Blu-ray', packaging: 'Box Set' }));
    } else {
      setForm(prev => ({ ...prev, format: '4K UHD', packaging: 'Standard Case' }));
    }
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

  const handleSelectCandidate = (candidate) => {
    setSelectedCandidate(candidate);
    setForm(prev => ({
      ...prev,
      title: candidate.title,
      release_year: candidate.release_year || '',
      creator: candidate.creator || '',
      runtime: candidate.runtime || '',
      synopsis: candidate.synopsis || '',
      poster_url: candidate.poster_url || '',
      backdrop_url: candidate.backdrop_url || '',
      format: candidate.suggested_format || prev.format
    }));
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
        status: form.status,
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
        className="relative w-full max-w-3xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600">
              <Plus className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 font-display">Add to Collection</h2>
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
                    active ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'
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
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={`Search ${category === 'movie' ? 'movies (e.g. Dune, Blade Runner)' : (category === 'tv' ? 'TV series (e.g. Breaking Bad)' : 'games (e.g. Zelda, Elden Ring)')}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white text-slate-900 pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 focus:border-amber-500 focus:outline-hidden text-sm shadow-xs transition-colors"
                  autoFocus
                />
                {isSearching && (
                  <Loader2 className="w-4 h-4 text-amber-500 animate-spin absolute right-3.5 top-1/2 -translate-y-1/2" />
                )}
              </div>

              {/* Search Candidates Grid */}
              {searchResults.length > 0 && !selectedCandidate && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-h-72 overflow-y-auto p-1">
                  {searchResults.map((res, i) => (
                    <div
                      key={i}
                      onClick={() => handleSelectCandidate(res)}
                      className="group p-2.5 rounded-xl bg-white border border-slate-200 hover:border-amber-500 hover:shadow-md cursor-pointer transition-all flex flex-col justify-between"
                    >
                      <div className="aspect-[2/3] w-full rounded-lg overflow-hidden bg-slate-100 mb-2 border border-slate-200">
                        {res.poster_url ? (
                          <img src={res.poster_url} alt={res.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400 text-[10px]">No Cover</div>
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800 line-clamp-1 group-hover:text-amber-600">{res.title}</p>
                        <p className="text-[10px] text-slate-500">{res.release_year || '—'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Selected Candidate Preview Banner */}
              {selectedCandidate && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {form.poster_url && (
                      <img src={form.poster_url} alt={form.title} className="w-12 h-16 object-cover rounded-lg border border-amber-300 shadow-xs" />
                    )}
                    <div>
                      <span className="text-[10px] uppercase font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-200">
                        Selected Title
                      </span>
                      <h4 className="font-bold text-sm text-slate-900 mt-1">{form.title} ({form.release_year})</h4>
                      <p className="text-xs text-slate-600">{form.creator}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedCandidate(null)}
                    className="text-xs text-slate-600 hover:text-slate-900 px-2.5 py-1 rounded-lg bg-white border border-slate-200 shadow-2xs transition-colors"
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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Title *</label>
                  <input
                    type="text"
                    placeholder="e.g. Blade Runner 2049"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full bg-white text-slate-900 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:border-amber-500 focus:outline-hidden shadow-2xs transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Release Year</label>
                  <input
                    type="number"
                    placeholder="2017"
                    value={form.release_year}
                    onChange={(e) => setForm({ ...form, release_year: e.target.value })}
                    className="w-full bg-white text-slate-900 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:border-amber-500 focus:outline-hidden shadow-2xs transition-colors"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Director / Studio / Developer</label>
                  <input
                    type="text"
                    placeholder="e.g. Denis Villeneuve"
                    value={form.creator}
                    onChange={(e) => setForm({ ...form, creator: e.target.value })}
                    className="w-full bg-white text-slate-900 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:border-amber-500 focus:outline-hidden shadow-2xs transition-colors"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Runtime / Length</label>
                  <input
                    type="text"
                    placeholder="e.g. 164 min or 50 hrs"
                    value={form.runtime}
                    onChange={(e) => setForm({ ...form, runtime: e.target.value })}
                    className="w-full bg-white text-slate-900 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:border-amber-500 focus:outline-hidden shadow-2xs transition-colors"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Assign to Shelf</label>
                  <select
                    value={form.shelf_id}
                    onChange={(e) => setForm({ ...form, shelf_id: e.target.value })}
                    className="w-full bg-white text-slate-900 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:border-amber-500 focus:outline-hidden shadow-2xs transition-colors"
                  >
                    <option value="">None (Unsorted)</option>
                    {shelves.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-3">
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Poster Image URL</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={form.poster_url}
                    onChange={(e) => setForm({ ...form, poster_url: e.target.value })}
                    className="w-full bg-white text-slate-900 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:border-amber-500 focus:outline-hidden shadow-2xs transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* PHYSICAL EDITION DETAILS */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-amber-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-700">
                  Physical Edition & Packaging Details
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Media Format *</label>
                  <select
                    value={form.format}
                    onChange={(e) => setForm({ ...form, format: e.target.value })}
                    className="w-full bg-slate-50 hover:bg-white text-slate-900 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:bg-white focus:border-amber-500 focus:outline-hidden shadow-2xs transition-colors"
                  >
                    <option value="4K UHD">4K UHD</option>
                    <option value="Blu-ray">Blu-ray</option>
                    <option value="Steelbook">Steelbook</option>
                    <option value="Criterion">Criterion Collection</option>
                    <option value="DVD">DVD</option>
                    <option value="VHS">VHS</option>
                    <option value="Nintendo Switch">Nintendo Switch</option>
                    <option value="PlayStation 5">PlayStation 5</option>
                    <option value="PlayStation 4">PlayStation 4</option>
                    <option value="Xbox Series X">Xbox Series X</option>
                    <option value="PC Steam">PC / Steam</option>
                    <option value="Digital">Digital</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Packaging Type</label>
                  <select
                    value={form.packaging}
                    onChange={(e) => setForm({ ...form, packaging: e.target.value })}
                    className="w-full bg-slate-50 hover:bg-white text-slate-900 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:bg-white focus:border-amber-500 focus:outline-hidden shadow-2xs transition-colors"
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
                    className="w-full bg-slate-50 hover:bg-white text-slate-900 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:bg-white focus:border-amber-500 focus:outline-hidden shadow-2xs transition-colors"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Condition</label>
                  <select
                    value={form.condition}
                    onChange={(e) => setForm({ ...form, condition: e.target.value })}
                    className="w-full bg-slate-50 hover:bg-white text-slate-900 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:bg-white focus:border-amber-500 focus:outline-hidden shadow-2xs transition-colors"
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
                    className="w-full bg-slate-50 hover:bg-white text-slate-900 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:bg-white focus:border-amber-500 focus:outline-hidden shadow-2xs transition-colors"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Storage / Shelf Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Shelf A, Row 2"
                    value={form.storage_location}
                    onChange={(e) => setForm({ ...form, storage_location: e.target.value })}
                    className="w-full bg-slate-50 hover:bg-white text-slate-900 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:bg-white focus:border-amber-500 focus:outline-hidden shadow-2xs transition-colors"
                  />
                </div>

                <div className="sm:col-span-3 flex items-center gap-4 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 font-medium">
                    <input
                      type="checkbox"
                      checked={form.slipcover}
                      onChange={(e) => setForm({ ...form, slipcover: e.target.checked })}
                      className="rounded border-slate-300 text-amber-500 focus:ring-amber-400"
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
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold text-sm shadow-md transition-all"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span>Add to Collection</span>
          </button>
        </div>

      </div>
    </div>
  );
}
