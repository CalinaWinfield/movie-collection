import React, { useState, useEffect } from 'react';
import { 
  X, Star, Heart, Calendar, Clock, Film, Tv, Gamepad2, 
  Plus, Trash2, Edit3, Check, DollarSign, Tag,
  Barcode, MapPin, Package, ShieldCheck, ExternalLink, Loader2
} from 'lucide-react';
import { FormatBadge } from './FormatBadge';
import { client } from '../api/client';
import { 
  getFormatsForCategory, 
  DEFAULT_FORMAT_BY_CATEGORY 
} from '../constants/formats';

export function ItemDetailModal({ 
  item, 
  onClose, 
  onUpdateItem, 
  onDeleteItem, 
  shelves = [],
  onRefreshData 
}) {
  if (!item) return null;

  const [activeTab, setActiveTab] = useState('editions'); // 'editions', 'notes'
  const [isEditingItem, setIsEditingItem] = useState(false);
  const [isAddingEdition, setIsAddingEdition] = useState(false);
  const [loading, setLoading] = useState(false);

  const CategoryIcon = item.category === 'tv' ? Tv : (item.category === 'game' ? Gamepad2 : Film);
  const currentOwnership = item.ownership_status || (item.status === 'wishlist' ? 'wishlist' : (item.status === 'borrowed' ? 'borrowed' : 'owned'));
  const currentProgress = item.progress_status || (item.status === 'in_progress' || item.status === 'completed' ? item.status : 'not_started');

  const [newEdition, setNewEdition] = useState({
    format: item.category === 'game' ? 'Nintendo Switch' : (item.category === 'tv' ? 'Blu-ray' : '4K UHD'),
    packaging: 'Standard Case',
    edition_name: '',
    condition: 'Mint',
    purchase_price: '',
    storage_location: '',
    slipcover: false,
    disc_count: 1
  });

  const getInitialEditForm = (currentItem) => {
    if (!currentItem) return {};
    const primary = currentItem.editions?.[0] || {};
    return {
      title: currentItem.title || '',
      category: currentItem.category || 'movie',
      release_year: currentItem.release_year || '',
      creator: currentItem.creator || '',
      runtime: currentItem.runtime || '',
      synopsis: currentItem.synopsis || '',
      poster_url: currentItem.poster_url || '',
      ownership_status: currentItem.ownership_status || (currentItem.status === 'wishlist' ? 'wishlist' : (currentItem.status === 'borrowed' ? 'borrowed' : 'owned')),
      progress_status: currentItem.progress_status || (currentItem.status === 'in_progress' || currentItem.status === 'completed' ? currentItem.status : 'not_started'),
      status: currentItem.status || 'owned',
      rating: currentItem.rating || 0,
      shelf_id: currentItem.shelf_id || '',
      user_notes: currentItem.user_notes || '',
      tags: Array.isArray(currentItem.tags) ? currentItem.tags.join(', ') : (currentItem.tags || ''),
      // Physical Edition Details (from primary edition)
      edition_id: primary.id || null,
      format: primary.format || (currentItem.category === 'game' ? 'Nintendo Switch' : (currentItem.category === 'tv' ? 'Blu-ray' : '4K UHD')),
      packaging: primary.packaging || 'Standard Case',
      edition_name: primary.edition_name || 'Standard Edition',
      condition: primary.condition || 'Mint',
      purchase_price: primary.purchase_price !== undefined && primary.purchase_price !== null ? primary.purchase_price : '',
      storage_location: primary.storage_location || '',
      slipcover: Boolean(primary.slipcover)
    };
  };

  const [editForm, setEditForm] = useState(() => getInitialEditForm(item));

  // Keep editForm and newEdition synced whenever item changes
  useEffect(() => {
    if (item) {
      setEditForm(getInitialEditForm(item));
      setNewEdition(prev => ({
        ...prev,
        format: item.category === 'game' ? 'Nintendo Switch' : (item.category === 'tv' ? 'Blu-ray' : '4K UHD')
      }));
    }
  }, [item]);

  const handleEditCategoryChange = (newCat) => {
    const validFormats = getFormatsForCategory(newCat);
    const isValid = validFormats.some(f => f.value === editForm.format);
    const nextFormat = isValid ? editForm.format : (DEFAULT_FORMAT_BY_CATEGORY[newCat] || '4K UHD');
    setEditForm(prev => ({
      ...prev,
      category: newCat,
      format: nextFormat
    }));
  };

  const handleSelectEditionToEdit = (editionId) => {
    const edObj = item.editions?.find(e => e.id === editionId);
    if (!edObj) return;
    setEditForm(prev => ({
      ...prev,
      edition_id: edObj.id,
      format: edObj.format || (prev.category === 'game' ? 'Nintendo Switch' : '4K UHD'),
      packaging: edObj.packaging || 'Standard Case',
      edition_name: edObj.edition_name || 'Standard Edition',
      condition: edObj.condition || 'Mint',
      purchase_price: edObj.purchase_price !== undefined && edObj.purchase_price !== null ? edObj.purchase_price : '',
      storage_location: edObj.storage_location || '',
      slipcover: Boolean(edObj.slipcover)
    }));
  };

  const handleSaveItemEdit = async (e) => {
    e.preventDefault();
    if (!editForm.title.trim()) {
      alert('Please enter a title');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        title: editForm.title.trim(),
        category: editForm.category,
        release_year: editForm.release_year ? parseInt(editForm.release_year, 10) : null,
        creator: editForm.creator,
        runtime: editForm.runtime,
        synopsis: editForm.synopsis,
        poster_url: editForm.poster_url,
        ownership_status: editForm.ownership_status,
        progress_status: editForm.progress_status,
        rating: parseFloat(editForm.rating) || 0,
        shelf_id: editForm.shelf_id ? parseInt(editForm.shelf_id, 10) : null,
        user_notes: editForm.user_notes,
        tags: editForm.tags ? editForm.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        edition: {
          id: editForm.edition_id,
          format: editForm.format,
          packaging: editForm.packaging,
          edition_name: editForm.edition_name || 'Standard Edition',
          condition: editForm.condition,
          purchase_price: editForm.purchase_price ? parseFloat(editForm.purchase_price) : 0,
          storage_location: editForm.storage_location,
          slipcover: editForm.slipcover ? 1 : 0
        }
      };

      const updated = await client.put(`/items/${item.id}`, payload);
      onUpdateItem(updated.item);
      setIsEditingItem(false);
      if (onRefreshData) onRefreshData();
    } catch (err) {
      alert('Error updating item: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickOwnershipChange = async (newOwnership) => {
    try {
      const updated = await client.put(`/items/${item.id}`, { ownership_status: newOwnership });
      onUpdateItem(updated.item);
    } catch (err) {
      alert('Error changing possession status: ' + err.message);
    }
  };

  const handleQuickProgressChange = async (newProgress) => {
    try {
      const updated = await client.put(`/items/${item.id}`, { progress_status: newProgress });
      onUpdateItem(updated.item);
    } catch (err) {
      alert('Error changing progress status: ' + err.message);
    }
  };

  const handleRatingChange = async (newRating) => {
    try {
      const updated = await client.put(`/items/${item.id}`, { rating: newRating });
      onUpdateItem(updated.item);
    } catch (err) {
      alert('Error changing rating: ' + err.message);
    }
  };

  const handleAddEdition = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await client.post(`/items/${item.id}/editions`, {
        ...newEdition,
        slipcover: newEdition.slipcover ? 1 : 0,
        purchase_price: newEdition.purchase_price ? parseFloat(newEdition.purchase_price) : 0,
        disc_count: parseInt(newEdition.disc_count, 10) || 1
      });
      setIsAddingEdition(false);
      onRefreshData();
    } catch (err) {
      alert('Error adding edition: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEdition = async (editionId) => {
    if (!window.confirm('Are you sure you want to delete this edition?')) return;
    try {
      await client.delete(`/items/editions/${editionId}`);
      onRefreshData();
    } catch (err) {
      alert('Error deleting edition: ' + err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-slate-900/60 backdrop-blur-xs">
      <div 
        className="relative w-full max-w-4xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header / Backdrop area */}
        <div className="relative bg-slate-900 border-b border-slate-800">
          {item.backdrop_url && (
            <div 
              className="absolute inset-0 bg-cover bg-center opacity-25 blur-md pointer-events-none"
              style={{ backgroundImage: `url(${item.backdrop_url})` }}
            />
          )}

          <div className="relative p-6 sm:p-8 flex flex-col sm:flex-row gap-6 items-start">
            {/* Poster Thumbnail */}
            <div className="w-32 sm:w-44 shrink-0 aspect-[2/3] rounded-2xl overflow-hidden bg-slate-950 border-2 border-slate-700/60 shadow-xl case-sheen">
              {item.poster_url ? (
                <img src={item.poster_url} alt={item.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-500">
                  <CategoryIcon className="w-10 h-10 mb-2" />
                  <span className="text-xs">No Cover</span>
                </div>
              )}
            </div>

            {/* Title & Metadata Header */}
            <div className="flex-1 w-full flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="uppercase text-[11px] font-bold tracking-wider text-forest-400 bg-forest-400/10 px-2.5 py-0.5 rounded-full border border-forest-400/20">
                      {item.category === 'tv' ? 'TV Show' : (item.category === 'game' ? 'Game' : 'Movie')}
                    </span>
                    {item.release_year && (
                      <span className="text-sm font-semibold text-slate-300">
                        {item.release_year}
                      </span>
                    )}
                    {item.runtime && (
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {item.runtime}
                      </span>
                    )}
                    {item.created_at && (
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-forest-400/80" />
                        Added {(() => {
                          try {
                            const normalized = item.created_at.includes('T') ? item.created_at : item.created_at.replace(' ', 'T') + 'Z';
                            const d = new Date(normalized);
                            return isNaN(d.getTime()) ? item.created_at : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
                          } catch {
                            return item.created_at;
                          }
                        })()}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={onClose}
                    className="p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <h1 className="text-2xl sm:text-3xl font-bold text-white mt-2 tracking-tight">
                  {item.title}
                </h1>

                {item.creator && (
                  <p className="text-sm text-slate-300 mt-1 font-medium">
                    {item.category === 'movie' ? 'Directed by ' : (item.category === 'tv' ? 'Created by ' : 'Developer: ')}
                    <span className="text-white font-semibold">{item.creator}</span>
                  </p>
                )}

                {item.genres && item.genres.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap mt-3">
                    {item.genres.map((g, i) => (
                      <span key={i} className="text-xs bg-slate-800/80 text-slate-300 px-2.5 py-0.5 rounded-md border border-slate-700">
                        {g}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Dual Status and Rating controls */}
              <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center justify-between gap-4 mt-6 pt-4 border-t border-slate-800">
                <div className="flex flex-wrap items-center gap-3">
                  {/* Aspect 1: Possession / Ownership */}
                  <div className="flex items-center gap-1 bg-slate-800/90 p-1 rounded-xl border border-slate-700/80">
                    <span className="text-[10px] uppercase font-bold text-slate-400 px-1.5">Possession:</span>
                    {[
                      { id: 'owned', label: 'Owned' },
                      { id: 'borrowed', label: 'Borrowed' },
                      { id: 'wishlist', label: 'Wishlist' }
                    ].map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => handleQuickOwnershipChange(s.id)}
                        className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all ${
                          currentOwnership === s.id
                            ? (s.id === 'borrowed' ? 'bg-indigo-500 text-white font-bold shadow' : (s.id === 'wishlist' ? 'bg-purple-500 text-white font-bold shadow' : 'bg-forest-600 text-white font-bold shadow'))
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>

                  {/* Aspect 2: Progress / Watch / Play */}
                  <div className="flex items-center gap-1 bg-slate-800/90 p-1 rounded-xl border border-slate-700/80">
                    <span className="text-[10px] uppercase font-bold text-slate-400 px-1.5">Progress:</span>
                    {[
                      { id: 'not_started', label: 'Backlog' },
                      { id: 'in_progress', label: item.category === 'game' ? 'Playing' : 'Watching' },
                      { id: 'completed', label: 'Completed' }
                    ].map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => handleQuickProgressChange(s.id)}
                        className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all ${
                          currentProgress === s.id
                            ? (s.id === 'completed' ? 'bg-emerald-500 text-white font-bold shadow' : (s.id === 'in_progress' ? 'bg-blue-500 text-white font-bold shadow' : 'bg-slate-600 text-white font-bold shadow'))
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Rating Stars (1 to 10) */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Rating:</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                      <button
                        key={star}
                        onClick={() => handleRatingChange(star)}
                        className={`p-0.5 transition-colors ${
                          item.rating >= star ? 'text-amber-400' : 'text-slate-700 hover:text-amber-300'
                        }`}
                        title={`${star}/10`}
                      >
                        <Star className={`w-3.5 h-3.5 ${item.rating >= star ? 'fill-amber-400' : ''}`} />
                      </button>
                    ))}
                  </div>
                  <span className="text-xs font-bold text-amber-400 ml-1">
                    {item.rating > 0 ? `${item.rating}/10` : '—'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Shelfmark Navigation Tabs */}
        <div className="flex items-center justify-between px-6 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center space-x-6">
            <button
              onClick={() => setActiveTab('editions')}
              className={`py-3 text-sm font-semibold border-b-2 flex items-center gap-2 transition-all ${
                activeTab === 'editions'
                  ? 'border-forest-600 text-forest-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Editions & Formats ({item.editions?.length || 0})</span>
            </button>

            <button
              onClick={() => setActiveTab('notes')}
              className={`py-3 text-sm font-semibold border-b-2 flex items-center gap-2 transition-all ${
                activeTab === 'notes'
                  ? 'border-forest-600 text-forest-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Tag className="w-4 h-4" />
              <span>Notes & Details</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditingItem(!isEditingItem)}
              className="text-xs text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 font-medium flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isEditingItem ? 'Cancel Edit' : 'Edit Item'}</span>
            </button>

            <button
              onClick={() => onDeleteItem(item.id)}
              className="text-xs text-red-600 hover:text-red-700 bg-white hover:bg-red-50 px-2.5 py-1.5 rounded-lg border border-red-200 flex items-center gap-1.5 shadow-xs transition-colors"
              title="Delete from collection"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/60">
          
          {/* Edit Item Form if toggled */}
          {isEditingItem && (
            <form onSubmit={handleSaveItemEdit} className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Edit Title & Edition Details</h3>
                  <p className="text-xs text-slate-500">Update general information, media format, packaging, and library records</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditingItem(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* General Information */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">General Information</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                  <div className="sm:col-span-2 lg:col-span-2">
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">Title *</label>
                    <input
                      type="text"
                      value={editForm.title}
                      onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                      className="w-full bg-slate-50 hover:bg-white text-slate-900 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:bg-white focus:border-forest-600 focus:outline-hidden shadow-2xs transition-colors"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">Title Type *</label>
                    <select
                      value={editForm.category}
                      onChange={(e) => handleEditCategoryChange(e.target.value)}
                      className="w-full bg-slate-50 hover:bg-white text-slate-900 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:bg-white focus:border-forest-600 focus:outline-hidden shadow-2xs transition-colors font-medium cursor-pointer"
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
                      value={editForm.release_year}
                      onChange={(e) => setEditForm({ ...editForm, release_year: e.target.value })}
                      className="w-full bg-slate-50 hover:bg-white text-slate-900 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:bg-white focus:border-forest-600 focus:outline-hidden shadow-2xs transition-colors"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">Runtime / Length</label>
                    <input
                      type="text"
                      placeholder="e.g. 164 min or 50 hrs"
                      value={editForm.runtime}
                      onChange={(e) => setEditForm({ ...editForm, runtime: e.target.value })}
                      className="w-full bg-slate-50 hover:bg-white text-slate-900 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:bg-white focus:border-forest-600 focus:outline-hidden shadow-2xs transition-colors"
                    />
                  </div>

                  <div className="sm:col-span-2 lg:col-span-2">
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">
                      {editForm.category === 'movie' ? 'Director' : (editForm.category === 'tv' ? 'Creator / Network' : 'Developer / Publisher')}
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Denis Villeneuve"
                      value={editForm.creator}
                      onChange={(e) => setEditForm({ ...editForm, creator: e.target.value })}
                      className="w-full bg-slate-50 hover:bg-white text-slate-900 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:bg-white focus:border-forest-600 focus:outline-hidden shadow-2xs transition-colors"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">Assign to Shelf</label>
                    <select
                      value={editForm.shelf_id}
                      onChange={(e) => setEditForm({ ...editForm, shelf_id: e.target.value })}
                      className="w-full bg-slate-50 hover:bg-white text-slate-900 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:bg-white focus:border-forest-600 focus:outline-hidden shadow-2xs transition-colors"
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
                      value={editForm.rating || ''}
                      onChange={(e) => setEditForm({ ...editForm, rating: e.target.value })}
                      className="w-full bg-slate-50 hover:bg-white text-slate-900 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:bg-white focus:border-forest-600 focus:outline-hidden shadow-2xs transition-colors"
                    />
                  </div>

                  <div className="sm:col-span-1 lg:col-span-2">
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">Library Possession</label>
                    <select
                      value={editForm.ownership_status}
                      onChange={(e) => setEditForm({ ...editForm, ownership_status: e.target.value, status: e.target.value })}
                      className="w-full bg-slate-50 hover:bg-white text-slate-900 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:bg-white focus:border-forest-600 focus:outline-hidden shadow-2xs transition-colors"
                    >
                      <option value="owned">Owned</option>
                      <option value="borrowed">Borrowed</option>
                      <option value="wishlist">Wishlist</option>
                    </select>
                  </div>

                  <div className="sm:col-span-1 lg:col-span-2">
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">Watch / Play Progress</label>
                    <select
                      value={editForm.progress_status}
                      onChange={(e) => setEditForm({ ...editForm, progress_status: e.target.value })}
                      className="w-full bg-slate-50 hover:bg-white text-slate-900 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:bg-white focus:border-forest-600 focus:outline-hidden shadow-2xs transition-colors"
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
                      value={editForm.poster_url}
                      onChange={(e) => setEditForm({ ...editForm, poster_url: e.target.value })}
                      className="w-full bg-slate-50 hover:bg-white text-slate-900 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:bg-white focus:border-forest-600 focus:outline-hidden shadow-2xs transition-colors"
                    />
                  </div>

                  <div className="sm:col-span-2 lg:col-span-4">
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">Synopsis / Overview</label>
                    <textarea
                      rows={2}
                      value={editForm.synopsis}
                      onChange={(e) => setEditForm({ ...editForm, synopsis: e.target.value })}
                      className="w-full bg-slate-50 hover:bg-white text-slate-900 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:bg-white focus:border-forest-600 focus:outline-hidden shadow-2xs transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Physical Edition & Packaging Details */}
              <div className="p-4 rounded-2xl bg-forest-50/60 border border-forest-200/80 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-forest-600" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-forest-800">
                      Physical Edition & Packaging Details
                    </h4>
                  </div>
                  {item.editions && item.editions.length > 1 && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-600">Editing Edition:</span>
                      <select
                        value={editForm.edition_id || ''}
                        onChange={(e) => handleSelectEditionToEdit(parseInt(e.target.value, 10))}
                        className="bg-white text-slate-900 px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-medium shadow-2xs cursor-pointer"
                      >
                        {item.editions.map(ed => (
                          <option key={ed.id} value={ed.id}>
                            {ed.edition_name || 'Standard'} ({ed.format})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">Media Format *</label>
                    <select
                      value={editForm.format}
                      onChange={(e) => setEditForm({ ...editForm, format: e.target.value })}
                      className="w-full bg-white text-slate-900 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:border-forest-600 focus:outline-hidden shadow-2xs transition-colors"
                    >
                      {getFormatsForCategory(editForm.category).map((fmt) => (
                        <option key={fmt.value} value={fmt.value}>
                          {fmt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">Packaging Type</label>
                    <select
                      value={editForm.packaging}
                      onChange={(e) => setEditForm({ ...editForm, packaging: e.target.value })}
                      className="w-full bg-white text-slate-900 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:border-forest-600 focus:outline-hidden shadow-2xs transition-colors"
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
                      value={editForm.edition_name}
                      onChange={(e) => setEditForm({ ...editForm, edition_name: e.target.value })}
                      className="w-full bg-white text-slate-900 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:border-forest-600 focus:outline-hidden shadow-2xs transition-colors"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">Condition</label>
                    <select
                      value={editForm.condition}
                      onChange={(e) => setEditForm({ ...editForm, condition: e.target.value })}
                      className="w-full bg-white text-slate-900 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:border-forest-600 focus:outline-hidden shadow-2xs transition-colors"
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
                      value={editForm.purchase_price}
                      onChange={(e) => setEditForm({ ...editForm, purchase_price: e.target.value })}
                      className="w-full bg-white text-slate-900 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:border-forest-600 focus:outline-hidden shadow-2xs transition-colors"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">Storage / Shelf Location</label>
                    <input
                      type="text"
                      placeholder="e.g. Shelf A, Row 2"
                      value={editForm.storage_location}
                      onChange={(e) => setEditForm({ ...editForm, storage_location: e.target.value })}
                      className="w-full bg-white text-slate-900 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:border-forest-600 focus:outline-hidden shadow-2xs transition-colors"
                    />
                  </div>

                  <div className="sm:col-span-3 flex items-center gap-4 pt-1">
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 font-medium">
                      <input
                        type="checkbox"
                        checked={editForm.slipcover}
                        onChange={(e) => setEditForm({ ...editForm, slipcover: e.target.checked })}
                        className="rounded border-slate-300 text-forest-600 focus:ring-forest-500"
                      />
                      <span>Has Slipcover</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditingItem(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 text-xs font-bold bg-forest-600 hover:bg-forest-700 text-white rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                >
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 1: EDITIONS & FORMATS */}
          {activeTab === 'editions' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-slate-800 text-sm">Physical & Digital Editions</h3>
                  <p className="text-xs text-slate-500">Track separate formats, slipcovers, and purchase records for this title</p>
                </div>
                <button
                  onClick={() => setIsAddingEdition(!isAddingEdition)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-forest-50 text-forest-800 hover:bg-forest-100 border border-forest-200 text-xs font-semibold shadow-xs transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Another Edition</span>
                </button>
              </div>

              {/* Add Edition Form */}
              {isAddingEdition && (
                <form onSubmit={handleAddEdition} className="p-5 rounded-2xl bg-white border border-forest-300 shadow-xs space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-forest-700">New Edition Details</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-600 mb-1 block">Format</label>
                      <select
                        value={newEdition.format}
                        onChange={(e) => setNewEdition({ ...newEdition, format: e.target.value })}
                        className="w-full bg-slate-50 hover:bg-white text-slate-900 px-3 py-2 rounded-lg border border-slate-200 text-sm focus:bg-white focus:border-forest-600 focus:outline-hidden transition-colors"
                      >
                        {getFormatsForCategory(item.category).map((fmt) => (
                          <option key={fmt.value} value={fmt.value}>
                            {fmt.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-600 mb-1 block">Edition Name / Label</label>
                      <input
                        type="text"
                        placeholder="e.g. Collector's Edition, Spine #102"
                        value={newEdition.edition_name}
                        onChange={(e) => setNewEdition({ ...newEdition, edition_name: e.target.value })}
                        className="w-full bg-slate-50 hover:bg-white text-slate-900 px-3 py-2 rounded-lg border border-slate-200 text-sm focus:bg-white focus:border-forest-600 focus:outline-hidden transition-colors"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-600 mb-1 block">Packaging Type</label>
                      <select
                        value={newEdition.packaging}
                        onChange={(e) => setNewEdition({ ...newEdition, packaging: e.target.value })}
                        className="w-full bg-slate-50 hover:bg-white text-slate-900 px-3 py-2 rounded-lg border border-slate-200 text-sm focus:bg-white focus:border-forest-600 focus:outline-hidden transition-colors"
                      >
                        <option value="Standard Case">Standard Keep Case</option>
                        <option value="Steelbook">Steelbook</option>
                        <option value="Digibook">Digibook / Digipak</option>
                        <option value="Slipcover">Slipcase / O-Ring</option>
                        <option value="Box Set">Collector Box Set</option>
                        <option value="Cartridge Only">Loose Cartridge</option>
                        <option value="Digital">Digital / Code</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-600 mb-1 block">Condition</label>
                      <select
                        value={newEdition.condition}
                        onChange={(e) => setNewEdition({ ...newEdition, condition: e.target.value })}
                        className="w-full bg-slate-50 hover:bg-white text-slate-900 px-3 py-2 rounded-lg border border-slate-200 text-sm focus:bg-white focus:border-forest-600 focus:outline-hidden transition-colors"
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
                        value={newEdition.purchase_price}
                        onChange={(e) => setNewEdition({ ...newEdition, purchase_price: e.target.value })}
                        className="w-full bg-slate-50 hover:bg-white text-slate-900 px-3 py-2 rounded-lg border border-slate-200 text-sm focus:bg-white focus:border-forest-600 focus:outline-hidden transition-colors"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-600 mb-1 block">Storage / Shelf Location</label>
                      <input
                        type="text"
                        placeholder="e.g. Living Room Shelf A"
                        value={newEdition.storage_location}
                        onChange={(e) => setNewEdition({ ...newEdition, storage_location: e.target.value })}
                        className="w-full bg-slate-50 hover:bg-white text-slate-900 px-3 py-2 rounded-lg border border-slate-200 text-sm focus:bg-white focus:border-forest-600 focus:outline-hidden transition-colors"
                      />
                    </div>

                    <div className="flex items-center gap-3 pt-4">
                      <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 font-medium">
                        <input
                          type="checkbox"
                          checked={newEdition.slipcover}
                          onChange={(e) => setNewEdition({ ...newEdition, slipcover: e.target.checked })}
                          className="rounded border-slate-300 text-forest-600 focus:ring-forest-500"
                        />
                        <span>Includes Slipcover</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingEdition(false)}
                      className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-4 py-2 text-xs font-semibold bg-forest-600 hover:bg-forest-700 text-white rounded-lg shadow-xs transition-colors"
                    >
                      Save Edition
                    </button>
                  </div>
                </form>
              )}

              {/* Editions List */}
              <div className="space-y-3">
                {item.editions && item.editions.length > 0 ? (
                  item.editions.map((ed) => (
                    <div 
                      key={ed.id}
                      className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-slate-300 transition-colors"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <FormatBadge
                            format={ed.format}
                            packaging={ed.packaging}
                            slipcover={ed.slipcover}
                            size="md"
                          />
                          <span className="font-semibold text-slate-800 text-sm">
                            {ed.edition_name || 'Standard Edition'}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                          {ed.condition && <span>Condition: <strong className="text-slate-700 font-semibold">{ed.condition}</strong></span>}
                          {ed.region && <span>• {ed.region}</span>}
                          {ed.disc_count > 1 && <span>• {ed.disc_count} Discs</span>}
                          {ed.storage_location && (
                            <span className="flex items-center gap-1 text-slate-700 font-medium">
                              <MapPin className="w-3 h-3 text-forest-600" />
                              {ed.storage_location}
                            </span>
                          )}
                          {ed.purchase_price > 0 && (
                            <span className="text-emerald-600 font-semibold">
                              ${Number(ed.purchase_price).toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            handleSelectEditionToEdit(ed.id);
                            setIsEditingItem(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-forest-600 rounded-lg hover:bg-forest-50 transition-colors"
                          title="Edit this edition"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        {item.editions.length > 1 && (
                          <button
                            onClick={() => handleDeleteEdition(ed.id)}
                            className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                            title="Remove edition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic">No editions listed yet.</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: NOTES & DETAILS */}
          {activeTab === 'notes' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Synopsis</h4>
                <p className="text-sm text-slate-700 leading-relaxed bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs">
                  {item.synopsis || 'No synopsis provided.'}
                </p>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Collector's Personal Notes</h4>
                <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-xs text-sm text-slate-700">
                  {item.user_notes ? (
                    <p className="whitespace-pre-line">{item.user_notes}</p>
                  ) : (
                    <p className="text-slate-400 italic">No notes added. Click "Edit Item" above to add personal viewing notes or special packaging comments.</p>
                  )}
                </div>
              </div>

              {item.tags && item.tags.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {item.tags.map((t, idx) => (
                      <span key={idx} className="text-xs bg-forest-50 text-forest-800 border border-forest-200 font-medium px-2.5 py-1 rounded-md shadow-2xs">
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
