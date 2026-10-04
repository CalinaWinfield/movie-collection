import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from './context/AuthContext';
import { client } from './api/client';
import { Navbar } from './components/Navbar';
import { ItemCard } from './components/ItemCard';
import { ShelfView } from './components/ShelfView';
import { ItemDetailModal } from './components/ItemDetailModal';
import { AddItemModal } from './components/AddItemModal';
import { ShelvesModal } from './components/ShelvesModal';
import { StatsModal } from './components/StatsModal';
import { ExportImportModal } from './components/ExportImportModal';
import { AuthModal } from './components/AuthModal';
import { 
  Film, Tv, Gamepad2, Plus, SlidersHorizontal, ArrowUpDown, 
  Sparkles, Layers, Heart, Shield, RefreshCw, Loader2,
  FolderOpen
} from 'lucide-react';

export function App() {
  const { user, loading: authLoading } = useAuth();

  // Navigation and Filter state
  const [currentCategory, setCurrentCategory] = useState('all'); // 'all', 'movie', 'tv', 'game'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedShelfId, setSelectedShelfId] = useState(null);
  const [selectedFormat, setSelectedFormat] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'shelf'

  // Data state
  const [items, setItems] = useState([]);
  const [shelves, setShelves] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  // Modals state
  const [selectedItem, setSelectedItem] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isShelvesModalOpen, setIsShelvesModalOpen] = useState(false);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);

  // Load items based on filters
  const fetchItems = useCallback(async () => {
    if (!user) return;
    setLoadingData(true);
    try {
      const params = {
        category: currentCategory,
        shelf_id: selectedShelfId || undefined,
        format: selectedFormat !== 'all' ? selectedFormat : undefined,
        status: selectedStatus !== 'all' ? selectedStatus : undefined,
        search: searchQuery || undefined,
        sort: sortBy
      };

      const res = await client.get('/items', params);
      setItems(res.items || []);
    } catch (err) {
      console.error('Error fetching items:', err);
    } finally {
      setLoadingData(false);
    }
  }, [user, currentCategory, selectedShelfId, selectedFormat, selectedStatus, searchQuery, sortBy]);

  // Load shelves
  const fetchShelves = useCallback(async () => {
    if (!user) return;
    try {
      const res = await client.get('/shelves');
      setShelves(res.shelves || []);
    } catch (err) {
      console.error('Error fetching shelves:', err);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchItems();
      fetchShelves();
    }
  }, [user, fetchItems, fetchShelves]);

  const handleToggleFavorite = async (item) => {
    try {
      const res = await client.post(`/items/${item.id}/toggle-favorite`);
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_favorite: res.is_favorite } : i));
      if (selectedItem?.id === item.id) {
        setSelectedItem(prev => ({ ...prev, is_favorite: res.is_favorite }));
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
    }
  };

  const handleUpdateItem = (updatedItem) => {
    setItems(prev => prev.map(i => i.id === updatedItem.id ? updatedItem : i));
    setSelectedItem(updatedItem);
    fetchShelves();
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Delete this item from your collection?')) return;
    try {
      await client.delete(`/items/${itemId}`);
      setItems(prev => prev.filter(i => i.id !== itemId));
      setSelectedItem(null);
      fetchShelves();
    } catch (err) {
      alert('Error deleting item: ' + err.message);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#090b10] flex items-center justify-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500 mb-2" />
      </div>
    );
  }

  if (!user) {
    return <AuthModal />;
  }

  const selectedShelf = shelves.find(s => s.id === selectedShelfId);

  // Common format tags for category
  const getFormatPills = () => {
    if (currentCategory === 'game') {
      return ['Nintendo Switch', 'PlayStation 5', 'PlayStation 4', 'Xbox Series X', 'PC Steam'];
    } else if (currentCategory === 'tv') {
      return ['4K UHD', 'Blu-ray', 'DVD', 'Box Set'];
    }
    return ['4K UHD', 'Steelbook', 'Criterion', 'Blu-ray', 'DVD', 'VHS'];
  };

  return (
    <div className="min-h-screen bg-[#090b10] text-slate-100 flex flex-col selection:bg-amber-500/30">
      
      {/* Top Kolekino Navigation */}
      <Navbar
        currentCategory={currentCategory}
        setCurrentCategory={setCurrentCategory}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        viewMode={viewMode}
        setViewMode={setViewMode}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onOpenShelvesModal={() => setIsShelvesModalOpen(true)}
        onOpenStatsModal={() => setIsStatsModalOpen(true)}
        onOpenBackupModal={() => setIsBackupModalOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Active Shelf or Filter Banner */}
        {selectedShelf && (
          <div className="p-4 rounded-2xl bg-surface-elevated border border-surface-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div 
                className="w-3.5 h-8 rounded-full" 
                style={{ backgroundColor: selectedShelf.color || '#f59e0b' }} 
              />
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400">SHELF FILTER</span>
                <h2 className="text-lg font-bold text-slate-100">{selectedShelf.name}</h2>
              </div>
            </div>

            <button
              onClick={() => setSelectedShelfId(null)}
              className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg bg-surface border border-surface-border"
            >
              Clear Shelf Filter ✕
            </button>
          </div>
        )}

        {/* Filters Toolbar */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-2 border-b border-surface-border/60">
          
          {/* Format & Status Pills */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Format filter pills */}
            <div className="flex items-center gap-1 bg-surface p-1 rounded-xl border border-surface-border overflow-x-auto max-w-full">
              <button
                onClick={() => setSelectedFormat('all')}
                className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all ${
                  selectedFormat === 'all' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All Formats
              </button>
              {getFormatPills().map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => setSelectedFormat(selectedFormat === fmt ? 'all' : fmt)}
                  className={`text-xs px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-all ${
                    selectedFormat === fmt ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {fmt}
                </button>
              ))}
            </div>

            {/* Status pills */}
            <div className="flex items-center gap-1 bg-surface p-1 rounded-xl border border-surface-border">
              {[
                { id: 'all', label: 'All Status' },
                { id: 'owned', label: 'Owned' },
                { id: 'in_progress', label: 'In Progress' },
                { id: 'completed', label: 'Completed' },
                { id: 'wishlist', label: 'Wishlist' },
              ].map((st) => (
                <button
                  key={st.id}
                  onClick={() => setSelectedStatus(st.id)}
                  className={`text-xs px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-all ${
                    selectedStatus === st.id ? 'bg-surface-elevated text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sort & Count */}
          <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-end">
            <span className="text-xs text-slate-400">
              <strong className="text-slate-200">{items.length}</strong> {items.length === 1 ? 'title' : 'titles'}
            </span>

            <div className="flex items-center gap-1.5 bg-surface px-2.5 py-1.5 rounded-xl border border-surface-border text-xs text-slate-300">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent text-slate-200 focus:outline-none cursor-pointer text-xs"
              >
                <option value="recent">Recently Added</option>
                <option value="title_asc">Title (A to Z)</option>
                <option value="title_desc">Title (Z to A)</option>
                <option value="year_desc">Release Year (Newest)</option>
                <option value="year_asc">Release Year (Oldest)</option>
                <option value="rating_desc">Highest Rated</option>
              </select>
            </div>
          </div>

        </div>

        {/* Content Display: Bookshelf Spine View or Poster Grid */}
        {viewMode === 'shelf' ? (
          <ShelfView
            items={items}
            onItemClick={(item) => setSelectedItem(item)}
          />
        ) : null}

        {/* Poster Grid */}
        {loadingData ? (
          <div className="py-24 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500 mx-auto mb-3" />
            <p className="text-sm text-slate-400">Loading your collection...</p>
          </div>
        ) : items.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5">
            {items.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                onClick={(clicked) => setSelectedItem(clicked)}
                onToggleFavorite={handleToggleFavorite}
              />
            ))}
          </div>
        ) : (
          /* Empty state */
          <div className="py-20 text-center max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-surface-elevated border border-surface-border flex items-center justify-center mx-auto text-amber-500/70">
              <Film className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-100 font-display">
                {searchQuery || selectedFormat !== 'all' || selectedStatus !== 'all' || selectedShelfId
                  ? 'No matching titles found'
                  : 'Your collection is empty'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {searchQuery || selectedFormat !== 'all' || selectedStatus !== 'all' || selectedShelfId
                  ? 'Try clearing your filters or searching for another title.'
                  : 'Start tracking your 4K UHD discs, Blu-rays, Steelbooks, TV series box sets, and video games.'}
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-glow-gold transition-all"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Add Your First Title</span>
              </button>

              <button
                onClick={() => setIsBackupModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-surface-elevated hover:bg-slate-800 border border-surface-border text-slate-300 font-semibold text-xs transition-all"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Load Sample Collection</span>
              </button>
            </div>
          </div>
        )}

      </main>

      {/* Modals */}
      {selectedItem && (
        <ItemDetailModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onUpdateItem={handleUpdateItem}
          onDeleteItem={handleDeleteItem}
          shelves={shelves}
          onRefreshData={fetchItems}
        />
      )}

      <AddItemModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onCreated={() => {
          fetchItems();
          fetchShelves();
        }}
        shelves={shelves}
      />

      <ShelvesModal
        isOpen={isShelvesModalOpen}
        onClose={() => setIsShelvesModalOpen(false)}
        shelves={shelves}
        onRefresh={fetchShelves}
        onSelectShelf={(id) => setSelectedShelfId(id)}
        selectedShelfId={selectedShelfId}
      />

      <StatsModal
        isOpen={isStatsModalOpen}
        onClose={() => setIsStatsModalOpen(false)}
      />

      <ExportImportModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        onRefresh={() => {
          fetchItems();
          fetchShelves();
        }}
      />

    </div>
  );
}
