import React, { useState } from 'react';
import { 
  X, Star, Heart, Calendar, Clock, Film, Tv, Gamepad2, 
  Plus, Trash2, Edit3, Check, DollarSign, Tag,
  Barcode, MapPin, Package, ShieldCheck, ExternalLink
} from 'lucide-react';
import { FormatBadge } from './FormatBadge';
import { client } from '../api/client';

export function ItemDetailModal({ 
  item, 
  onClose, 
  onUpdateItem, 
  onDeleteItem, 
  shelves = [],
  onRefreshData 
}) {
  const [activeTab, setActiveTab] = useState('editions'); // 'editions', 'notes'
  const [isEditingItem, setIsEditingItem] = useState(false);
  const [isAddingEdition, setIsAddingEdition] = useState(false);
  const [loading, setLoading] = useState(false);

  // Edit item form state
  const [editForm, setEditForm] = useState({
    title: item.title,
    release_year: item.release_year || '',
    creator: item.creator || '',
    runtime: item.runtime || '',
    synopsis: item.synopsis || '',
    poster_url: item.poster_url || '',
    status: item.status || 'owned',
    rating: item.rating || 0,
    shelf_id: item.shelf_id || '',
    user_notes: item.user_notes || '',
    tags: Array.isArray(item.tags) ? item.tags.join(', ') : (item.tags || '')
  });

  // New edition form state
  const [newEdition, setNewEdition] = useState({
    format: item.category === 'game' ? 'Nintendo Switch' : (item.category === 'tv' ? 'Blu-ray' : '4K UHD'),
    edition_name: '',
    packaging: 'Standard Case',
    slipcover: false,
    disc_count: 1,
    region: 'Region Free',
    condition: 'Mint',
    purchase_price: '',
    purchase_date: new Date().toISOString().split('T')[0],
    retailer: '',
    storage_location: '',
    barcode: '',
    notes: ''
  });

  const CategoryIcon = item.category === 'tv' ? Tv : (item.category === 'game' ? Gamepad2 : Film);

  const handleSaveItemEdit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const updated = await client.put(`/items/${item.id}`, {
        ...editForm,
        shelf_id: editForm.shelf_id ? parseInt(editForm.shelf_id, 10) : null,
        tags: editForm.tags.split(',').map(t => t.trim()).filter(Boolean)
      });
      onUpdateItem(updated.item);
      setIsEditingItem(false);
    } catch (err) {
      alert('Error updating item: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickStatusChange = async (newStatus) => {
    try {
      const updated = await client.put(`/items/${item.id}`, { status: newStatus });
      onUpdateItem(updated.item);
    } catch (err) {
      alert('Error changing status: ' + err.message);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/80 backdrop-blur-sm">
      <div 
        className="relative w-full max-w-4xl bg-surface rounded-3xl border border-surface-border shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header / Backdrop area */}
        <div className="relative bg-slate-900 border-b border-surface-border">
          {item.backdrop_url && (
            <div 
              className="absolute inset-0 bg-cover bg-center opacity-20 blur-md pointer-events-none"
              style={{ backgroundImage: `url(${item.backdrop_url})` }}
            />
          )}

          <div className="relative p-6 sm:p-8 flex flex-col sm:flex-row gap-6 items-start">
            {/* Poster Thumbnail */}
            <div className="w-32 sm:w-44 shrink-0 aspect-[2/3] rounded-2xl overflow-hidden bg-slate-950 border-2 border-surface-border shadow-xl case-sheen">
              {item.poster_url ? (
                <img src={item.poster_url} alt={item.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-600">
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
                    <span className="uppercase text-[11px] font-bold tracking-wider text-amber-400 bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/20">
                      {item.category}
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
                  </div>

                  <button
                    onClick={onClose}
                    className="p-2 text-slate-400 hover:text-white bg-surface-elevated hover:bg-slate-800 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 mt-2 font-display">
                  {item.title}
                </h1>

                {item.creator && (
                  <p className="text-sm text-slate-300 mt-1 font-medium">
                    {item.category === 'movie' ? 'Directed by ' : (item.category === 'tv' ? 'Created by ' : 'Developer: ')}
                    <span className="text-slate-100">{item.creator}</span>
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

              {/* Status and Rating controls */}
              <div className="flex flex-wrap items-center justify-between gap-4 mt-6 pt-4 border-t border-surface-border/60">
                {/* Status selector */}
                <div className="flex items-center gap-1 bg-surface-elevated p-1 rounded-xl border border-surface-border">
                  {[
                    { id: 'owned', label: 'Owned' },
                    { id: 'in_progress', label: 'Playing/Watching' },
                    { id: 'completed', label: 'Completed' },
                    { id: 'wishlist', label: 'Wishlist' }
                  ].map((s) => (
                    <button
                      key={s.id}
                      onClick={() => handleQuickStatusChange(s.id)}
                      className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all ${
                        item.status === s.id
                          ? 'bg-amber-500 text-slate-950 font-bold shadow'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
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

        {/* Kolekino Navigation Tabs */}
        <div className="flex items-center justify-between px-6 bg-surface-elevated border-b border-surface-border">
          <div className="flex items-center space-x-6">
            <button
              onClick={() => setActiveTab('editions')}
              className={`py-3 text-sm font-semibold border-b-2 flex items-center gap-2 transition-all ${
                activeTab === 'editions'
                  ? 'border-amber-500 text-amber-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Editions & Formats ({item.editions?.length || 0})</span>
            </button>

            <button
              onClick={() => setActiveTab('notes')}
              className={`py-3 text-sm font-semibold border-b-2 flex items-center gap-2 transition-all ${
                activeTab === 'notes'
                  ? 'border-amber-500 text-amber-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Tag className="w-4 h-4" />
              <span>Notes & Details</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditingItem(!isEditingItem)}
              className="text-xs text-slate-300 hover:text-white bg-surface hover:bg-slate-800 px-2.5 py-1.5 rounded-lg border border-surface-border flex items-center gap-1.5"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isEditingItem ? 'Cancel Edit' : 'Edit Item'}</span>
            </button>

            <button
              onClick={() => onDeleteItem(item.id)}
              className="text-xs text-red-400 hover:text-red-300 bg-surface hover:bg-red-950/40 px-2.5 py-1.5 rounded-lg border border-red-900/40 flex items-center gap-1.5"
              title="Delete from collection"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Edit Item Form if toggled */}
          {isEditingItem && (
            <form onSubmit={handleSaveItemEdit} className="p-5 rounded-2xl bg-surface-elevated border border-surface-border space-y-4">
              <h3 className="font-semibold text-slate-200 text-sm">Edit Title Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400">Title</label>
                  <input
                    type="text"
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    className="w-full bg-surface text-slate-100 px-3 py-2 rounded-lg border border-surface-border text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Release Year</label>
                  <input
                    type="number"
                    value={editForm.release_year}
                    onChange={(e) => setEditForm({ ...editForm, release_year: e.target.value })}
                    className="w-full bg-surface text-slate-100 px-3 py-2 rounded-lg border border-surface-border text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Creator / Director / Developer</label>
                  <input
                    type="text"
                    value={editForm.creator}
                    onChange={(e) => setEditForm({ ...editForm, creator: e.target.value })}
                    className="w-full bg-surface text-slate-100 px-3 py-2 rounded-lg border border-surface-border text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Assign to Shelf</label>
                  <select
                    value={editForm.shelf_id}
                    onChange={(e) => setEditForm({ ...editForm, shelf_id: e.target.value })}
                    className="w-full bg-surface text-slate-100 px-3 py-2 rounded-lg border border-surface-border text-sm"
                  >
                    <option value="">None (Unsorted)</option>
                    {shelves.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs text-slate-400">Poster Image URL</label>
                  <input
                    type="url"
                    value={editForm.poster_url}
                    onChange={(e) => setEditForm({ ...editForm, poster_url: e.target.value })}
                    className="w-full bg-surface text-slate-100 px-3 py-2 rounded-lg border border-surface-border text-sm"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs text-slate-400">Synopsis</label>
                  <textarea
                    rows={3}
                    value={editForm.synopsis}
                    onChange={(e) => setEditForm({ ...editForm, synopsis: e.target.value })}
                    className="w-full bg-surface text-slate-100 px-3 py-2 rounded-lg border border-surface-border text-sm"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditingItem(false)}
                  className="px-4 py-2 text-xs text-slate-300 hover:bg-surface rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg"
                >
                  Save Changes
                </button>
              </div>
            </form>
          )}

          {/* TAB 1: EDITIONS & FORMATS */}
          {activeTab === 'editions' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-slate-100 text-sm">Physical & Digital Editions</h3>
                  <p className="text-xs text-slate-400">Track separate formats, slipcovers, and purchase records for this title</p>
                </div>
                <button
                  onClick={() => setIsAddingEdition(!isAddingEdition)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border border-amber-500/30 text-xs font-semibold"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Another Edition</span>
                </button>
              </div>

              {/* Add Edition Form */}
              {isAddingEdition && (
                <form onSubmit={handleAddEdition} className="p-5 rounded-2xl bg-surface-elevated border border-amber-500/30 space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">New Edition Details</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs text-slate-400">Format</label>
                      <select
                        value={newEdition.format}
                        onChange={(e) => setNewEdition({ ...newEdition, format: e.target.value })}
                        className="w-full bg-surface text-slate-100 px-3 py-2 rounded-lg border border-surface-border text-sm"
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
                      <label className="text-xs text-slate-400">Edition Name / Label</label>
                      <input
                        type="text"
                        placeholder="e.g. Collector's Edition, Spine #102"
                        value={newEdition.edition_name}
                        onChange={(e) => setNewEdition({ ...newEdition, edition_name: e.target.value })}
                        className="w-full bg-surface text-slate-100 px-3 py-2 rounded-lg border border-surface-border text-sm"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-slate-400">Packaging Type</label>
                      <select
                        value={newEdition.packaging}
                        onChange={(e) => setNewEdition({ ...newEdition, packaging: e.target.value })}
                        className="w-full bg-surface text-slate-100 px-3 py-2 rounded-lg border border-surface-border text-sm"
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
                      <label className="text-xs text-slate-400">Condition</label>
                      <select
                        value={newEdition.condition}
                        onChange={(e) => setNewEdition({ ...newEdition, condition: e.target.value })}
                        className="w-full bg-surface text-slate-100 px-3 py-2 rounded-lg border border-surface-border text-sm"
                      >
                        <option value="New/Sealed">New / Sealed</option>
                        <option value="Mint">Mint</option>
                        <option value="Very Good">Very Good</option>
                        <option value="Good">Good</option>
                        <option value="Fair">Fair</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs text-slate-400">Purchase Price ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="29.99"
                        value={newEdition.purchase_price}
                        onChange={(e) => setNewEdition({ ...newEdition, purchase_price: e.target.value })}
                        className="w-full bg-surface text-slate-100 px-3 py-2 rounded-lg border border-surface-border text-sm"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-slate-400">Storage / Shelf Location</label>
                      <input
                        type="text"
                        placeholder="e.g. Living Room Shelf A"
                        value={newEdition.storage_location}
                        onChange={(e) => setNewEdition({ ...newEdition, storage_location: e.target.value })}
                        className="w-full bg-surface text-slate-100 px-3 py-2 rounded-lg border border-surface-border text-sm"
                      />
                    </div>

                    <div className="flex items-center gap-3 pt-4">
                      <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                        <input
                          type="checkbox"
                          checked={newEdition.slipcover}
                          onChange={(e) => setNewEdition({ ...newEdition, slipcover: e.target.checked })}
                          className="rounded bg-surface border-surface-border text-amber-500 focus:ring-0"
                        />
                        <span>Includes Slipcover</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingEdition(false)}
                      className="px-4 py-2 text-xs text-slate-300 hover:bg-surface rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-4 py-2 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg"
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
                      className="p-4 rounded-2xl bg-surface-elevated border border-surface-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <FormatBadge
                            format={ed.format}
                            packaging={ed.packaging}
                            slipcover={ed.slipcover}
                            size="md"
                          />
                          <span className="font-semibold text-slate-200 text-sm">
                            {ed.edition_name || 'Standard Edition'}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                          {ed.condition && <span>Condition: <strong className="text-slate-300">{ed.condition}</strong></span>}
                          {ed.region && <span>• {ed.region}</span>}
                          {ed.disc_count > 1 && <span>• {ed.disc_count} Discs</span>}
                          {ed.storage_location && (
                            <span className="flex items-center gap-1 text-slate-300">
                              <MapPin className="w-3 h-3 text-amber-400" />
                              {ed.storage_location}
                            </span>
                          )}
                          {ed.purchase_price > 0 && (
                            <span className="text-emerald-400 font-semibold">
                              ${Number(ed.purchase_price).toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {item.editions.length > 1 && (
                          <button
                            onClick={() => handleDeleteEdition(ed.id)}
                            className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg hover:bg-slate-800"
                            title="Remove edition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 italic">No editions listed yet.</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: NOTES & DETAILS */}
          {activeTab === 'notes' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-semibold text-slate-400 mb-1">Synopsis</h4>
                <p className="text-sm text-slate-200 leading-relaxed bg-surface p-4 rounded-xl border border-surface-border">
                  {item.synopsis || 'No synopsis provided.'}
                </p>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-slate-400 mb-1">Collector's Personal Notes</h4>
                <div className="p-4 rounded-xl bg-surface border border-surface-border text-sm text-slate-300">
                  {item.user_notes ? (
                    <p className="whitespace-pre-line">{item.user_notes}</p>
                  ) : (
                    <p className="text-slate-500 italic">No notes added. Click "Edit Item" above to add personal viewing notes or special packaging comments.</p>
                  )}
                </div>
              </div>

              {item.tags && item.tags.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {item.tags.map((t, idx) => (
                      <span key={idx} className="text-xs bg-surface-elevated text-amber-300 border border-amber-500/20 px-2.5 py-1 rounded-md">
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
