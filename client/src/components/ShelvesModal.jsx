import React, { useState } from 'react';
import { X, Layers, Plus, Trash2, Edit2, Film, Heart, Disc, Clock, Flame, Folder } from 'lucide-react';
import { client } from '../api/client';

export function ShelvesModal({ isOpen, onClose, shelves = [], onRefresh, onSelectShelf, selectedShelfId }) {
  if (!isOpen) return null;

  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    color: '#f59e0b',
    icon: 'film'
  });
  const [loading, setLoading] = useState(false);

  const colors = ['#ef4444', '#f59e0b', '#10b981', '#06b6d4', '#6366f1', '#ec4899', '#8b5cf6'];

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setLoading(true);
    try {
      await client.post('/shelves', form);
      setIsCreating(false);
      setForm({ name: '', description: '', color: '#f59e0b', icon: 'film' });
      onRefresh();
    } catch (err) {
      alert('Error creating shelf: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete shelf "${name}"? (Items on this shelf will remain in your library)`)) return;
    try {
      await client.delete(`/shelves/${id}`);
      onRefresh();
    } catch (err) {
      alert('Error deleting shelf: ' + err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/80 backdrop-blur-sm">
      <div 
        className="relative w-full max-w-xl bg-surface rounded-3xl border border-surface-border shadow-2xl overflow-hidden my-auto max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 bg-surface-elevated border-b border-surface-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-100 font-display">Themed Shelves</h2>
              <p className="text-xs text-slate-400">Organize your collection into custom curated shelves</p>
            </div>
          </div>

          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white bg-surface rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Your Shelves</span>
            <button
              onClick={() => setIsCreating(!isCreating)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border border-amber-500/30 text-xs font-semibold"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Shelf</span>
            </button>
          </div>

          {/* New Shelf Form */}
          {isCreating && (
            <form onSubmit={handleCreate} className="p-4 rounded-2xl bg-surface-elevated border border-amber-500/30 space-y-3">
              <div>
                <label className="text-xs text-slate-400">Shelf Name *</label>
                <input
                  type="text"
                  placeholder="e.g. 80s Cyberpunk, Ghibli Discs"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-surface text-slate-100 px-3 py-2 rounded-xl border border-surface-border text-sm"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs text-slate-400">Description (Optional)</label>
                <input
                  type="text"
                  placeholder="Short note about this shelf"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full bg-surface text-slate-100 px-3 py-2 rounded-xl border border-surface-border text-sm"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">Accent Color</label>
                <div className="flex items-center gap-2">
                  {colors.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setForm({ ...form, color: c })}
                      className={`w-6 h-6 rounded-full border-2 transition-transform ${
                        form.color === c ? 'scale-125 border-white' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-1.5 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl"
                >
                  Create Shelf
                </button>
              </div>
            </form>
          )}

          {/* Shelves List */}
          <div className="space-y-2.5">
            {shelves.map((s) => {
              const isSelected = selectedShelfId === s.id;
              return (
                <div
                  key={s.id}
                  onClick={() => {
                    onSelectShelf(isSelected ? null : s.id);
                    onClose();
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-amber-500/10 border-amber-500/50 shadow-md'
                      : 'bg-surface-elevated border-surface-border hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-10 rounded-md shrink-0 shadow"
                      style={{ backgroundColor: s.color || '#f59e0b' }}
                    />
                    <div>
                      <h4 className="text-sm font-bold text-slate-100">{s.name}</h4>
                      {s.description && <p className="text-xs text-slate-400 mt-0.5">{s.description}</p>}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-slate-400 bg-surface px-2.5 py-1 rounded-lg border border-surface-border">
                      {s.item_count || 0} items
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(s.id, s.name);
                      }}
                      className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-surface rounded-lg transition-colors"
                      title="Delete shelf"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
