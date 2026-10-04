import React, { useState, useEffect } from 'react';
import { X, BarChart3, Disc, DollarSign, Package, Film, Tv, Gamepad2, Award, CheckCircle2 } from 'lucide-react';
import { client } from '../api/client';

export function StatsModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const data = await client.get('/stats');
        setStats(data);
      } catch (err) {
        console.error('Error fetching collector stats:', err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-slate-900/60 backdrop-blur-xs">
      <div 
        className="relative w-full max-w-2xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden my-auto max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-600">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 font-display">Collector Insights</h2>
              <p className="text-xs text-slate-500">Deep statistics and breakdown of your media library</p>
            </div>
          </div>

          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 bg-white">
          {loading ? (
            <div className="text-center py-12 text-slate-400 text-sm">Gathering collection analytics...</div>
          ) : stats ? (
            <>
              {/* Key Metric Tiles */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 shadow-2xs">
                  <span className="text-[11px] font-bold text-slate-500 block uppercase tracking-wider">Total Titles</span>
                  <span className="text-2xl font-black text-amber-600 mt-1 block">{stats.totalItems}</span>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Cataloged items</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 shadow-2xs">
                  <span className="text-[11px] font-bold text-slate-500 block uppercase tracking-wider">Estimated Value</span>
                  <span className="text-2xl font-black text-emerald-600 mt-1 block">
                    ${stats.totalSpent?.toLocaleString() || 0}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Avg ${stats.avgPrice || 0}/item
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 shadow-2xs">
                  <span className="text-[11px] font-bold text-slate-500 block uppercase tracking-wider">Slipcovers</span>
                  <span className="text-2xl font-black text-amber-500 mt-1 block">{stats.slipcoverCount}</span>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">With outer sleeves</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 shadow-2xs">
                  <span className="text-[11px] font-bold text-slate-500 block uppercase tracking-wider">Favorites</span>
                  <span className="text-2xl font-black text-rose-500 mt-1 block">
                    {stats.favoritesCount || 0}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Starred titles</span>
                </div>
              </div>

              {/* Category Breakdown */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 shadow-2xs space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Media Category Breakdown</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-white border border-slate-200 flex items-center gap-3 shadow-2xs">
                    <Film className="w-5 h-5 text-amber-500 shrink-0" />
                    <div>
                      <span className="text-sm font-bold text-slate-900 block">{stats.categoryCounts?.movie || 0}</span>
                      <span className="text-[10px] text-slate-500">Movies</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-slate-200 flex items-center gap-3 shadow-2xs">
                    <Tv className="w-5 h-5 text-blue-500 shrink-0" />
                    <div>
                      <span className="text-sm font-bold text-slate-900 block">{stats.categoryCounts?.tv || 0}</span>
                      <span className="text-[10px] text-slate-500">TV Shows</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-slate-200 flex items-center gap-3 shadow-2xs">
                    <Gamepad2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    <div>
                      <span className="text-sm font-bold text-slate-900 block">{stats.categoryCounts?.game || 0}</span>
                      <span className="text-[10px] text-slate-500">Games</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Format Distribution Breakdown */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 shadow-2xs space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Format & Edition Breakdown</h3>
                <div className="space-y-2">
                  {stats.formatCounts?.map((f, i) => {
                    const pct = stats.totalItems > 0 ? Math.round((f.count / stats.totalItems) * 100) : 0;
                    return (
                      <div key={i} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold text-slate-700">
                          <span>{f.format}</span>
                          <span>{f.count} ({pct}%)</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                          <div 
                            className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Status Breakdown */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 shadow-2xs space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Backlog & Progress</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                    <span className="text-xs text-slate-500 block font-medium">Owned</span>
                    <span className="text-lg font-bold text-slate-900 mt-0.5 block">{stats.statusCounts?.owned || 0}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                    <span className="text-xs text-slate-500 block font-medium">In Progress</span>
                    <span className="text-lg font-bold text-blue-600 mt-0.5 block">{stats.statusCounts?.in_progress || 0}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                    <span className="text-xs text-slate-500 block font-medium">Completed</span>
                    <span className="text-lg font-bold text-emerald-600 mt-0.5 block">{stats.statusCounts?.completed || 0}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                    <span className="text-xs text-slate-500 block font-medium">Wishlist</span>
                    <span className="text-lg font-bold text-purple-600 mt-0.5 block">{stats.statusCounts?.wishlist || 0}</span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-slate-400">No stats available yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}
