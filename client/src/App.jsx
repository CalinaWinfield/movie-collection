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
  const [selectedOwnership, setSelectedOwnership] = useState('all');
  const [selectedProgress, setSelectedProgress] = useState('all');
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
        ownership_status: selectedOwnership !== 'all' ? selectedOwnership : undefined,
        progress_status: selectedProgress !== 'all' ? selectedProgress : undefined,
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
  }, [user, currentCategory, selectedShelfId, selectedFormat, selectedOwnership, selectedProgress, searchQuery, sortBy]);

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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-forest-600 mb-2" />
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
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col selection:bg-forest-600/20">
      
      {/* Top Navigation */}
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

      {/* Main Container - WIDER BODY */}
      <main className="flex-1 max-w-[1750px] w-full mx-auto px-4 sm:px-8 lg:px-12 py-8 space-y-6">
        
        {/* Active Shelf Filter Banner */}
        {selectedShelf && (
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div 
                className="w-3.5 h-8 rounded-full shadow-xs" 
                style={{ backgroundColor: selectedShelf.color || '#2d6a4f' }} 
              />
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-forest-700">SHELF FILTER</span>
                <h2 className="text-lg font-bold text-slate-900">{selectedShelf.name}</h2>
              </div>
            </div>

            <button
              onClick={() => setSelectedShelfId(null)}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors"
            >
              Clear Shelf Filter ✕
            </button>
          </div>
        )}

        {/* Filters Toolbar */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-2 border-b border-slate-200">
          
          {/* Format & Status Pills */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Format filter pills */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-xs overflow-x-auto max-w-full">
              <button
                onClick={() => setSelectedFormat('all')}
                className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  selectedFormat === 'all' ? 'bg-forest-600 text-white shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                All Formats
              </button>
              {getFormatPills().map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => setSelectedFormat(selectedFormat === fmt ? 'all' : fmt)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all ${
                    selectedFormat === fmt ? 'bg-forest-600 text-white font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {fmt}
                </button>
              ))}
            </div>

            {/* Possession filter pills */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 px-1.5 hidden sm:inline">Possession:</span>
              {[
                { id: 'all', label: 'All' },
                { id: 'owned', label: 'Owned' },
                { id: 'borrowed', label: 'Borrowed' },
                { id: 'wishlist', label: 'Wishlist' },
              ].map((st) => (
                <button
                  key={st.id}
                  onClick={() => setSelectedOwnership(st.id)}
                  className={`text-xs px-2.5 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all ${
                    selectedOwnership === st.id 
                      ? 'bg-forest-100 text-forest-900 font-bold border border-forest-300/80 shadow-2xs' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>

            {/* Progress filter pills */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 px-1.5 hidden sm:inline">Progress:</span>
              {[
                { id: 'all', label: 'All' },
                { id: 'not_started', label: 'Backlog' },
                { id: 'in_progress', label: 'In Progress' },
                { id: 'completed', label: 'Completed' },
              ].map((pg) => (
                <button
                  key={pg.id}
                  onClick={() => setSelectedProgress(pg.id)}
                  className={`text-xs px-2.5 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all ${
                    selectedProgress === pg.id 
                      ? 'bg-blue-100 text-blue-900 font-bold border border-blue-300/80 shadow-2xs' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {pg.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sort & Count */}
          <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-end">
            <span className="text-xs text-slate-500 font-medium">
              <strong className="text-slate-900 font-bold">{items.length}</strong> {items.length === 1 ? 'title' : 'titles'}
            </span>

            <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-700 shadow-xs">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent text-slate-800 font-medium focus:outline-none cursor-pointer text-xs"
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

        {/* Poster Grid - WIDER SCREEN RESPONSIVE */}
        {loadingData ? (
          <div className="py-24 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-forest-600 mx-auto mb-3" />
            <p className="text-sm text-slate-500 font-medium">Loading your collection...</p>
          </div>
        ) : items.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-5 sm:gap-6">
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
            <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center mx-auto text-forest-600">
              <Film className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                {searchQuery || selectedFormat !== 'all' || selectedOwnership !== 'all' || selectedProgress !== 'all' || selectedShelfId
                  ? 'No matching titles found'
                  : 'Your collection is empty'}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {searchQuery || selectedFormat !== 'all' || selectedOwnership !== 'all' || selectedProgress !== 'all' || selectedShelfId
                  ? 'Try clearing your filters or searching for another title.'
                  : 'Start tracking your 4K UHD discs, Blu-rays, Steelbooks, TV series box sets, and video games.'}
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-forest-600 hover:bg-forest-700 text-white font-bold text-xs shadow-sm transition-all"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Add Your First Title</span>
              </button>

              <button
                onClick={() => setIsBackupModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs shadow-xs transition-all"
              >
                <Sparkles className="w-4 h-4 text-forest-600" />
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
        initialCategory={currentCategory !== 'all' ? currentCategory : 'movie'}
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
