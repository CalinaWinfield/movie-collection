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
        className="relative w-full max-w-5xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden my-auto max-h-[88vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-600">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Collector Insights</h2>
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
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 shadow-2xs">
                  <span className="text-[11px] font-bold text-slate-500 block uppercase tracking-wider">Total Titles</span>
                  <span className="text-2xl font-black text-forest-600 mt-1 block">{stats.totalItems}</span>
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
                  <span className="text-2xl font-black text-forest-500 mt-1 block">{stats.slipcoverCount}</span>
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

              {/* Insights Grid: Wider Category & Status Cards, Narrower Format Card */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Column 1 (Wider): Category & Status Breakdown (8 / 12 cols = 66.7%) */}
                <div className="lg:col-span-8 space-y-5">
                  {/* Media Category Breakdown */}
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 shadow-2xs space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Media Category Breakdown</h3>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-3.5 rounded-xl bg-white border border-slate-200 flex items-center gap-3.5 shadow-2xs">
                        <div className="w-9 h-9 rounded-lg bg-forest-500/10 border border-forest-500/20 flex items-center justify-center shrink-0">
                          <Film className="w-5 h-5 text-forest-600" />
                        </div>
                        <div>
                          <span className="text-base font-bold text-slate-900 block leading-tight">{stats.categoryCounts?.movie || 0}</span>
                          <span className="text-[11px] text-slate-500">Movies</span>
                        </div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-white border border-slate-200 flex items-center gap-3.5 shadow-2xs">
                        <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                          <Tv className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <span className="text-base font-bold text-slate-900 block leading-tight">{stats.categoryCounts?.tv || 0}</span>
                          <span className="text-[11px] text-slate-500">TV Shows</span>
                        </div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-white border border-slate-200 flex items-center gap-3.5 shadow-2xs">
                        <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                          <Gamepad2 className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                          <span className="text-base font-bold text-slate-900 block leading-tight">{stats.categoryCounts?.game || 0}</span>
                          <span className="text-[11px] text-slate-500">Games</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Dual Aspect Status Breakdown */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Possession Aspect */}
                    <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 shadow-2xs space-y-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Library Possession</h3>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                          <span className="text-[11px] text-slate-500 block font-medium">Owned</span>
                          <span className="text-lg font-bold text-forest-600 mt-0.5 block">
                            {stats.ownershipCounts?.owned ?? (stats.statusCounts?.owned || 0)}
                          </span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                          <span className="text-[11px] text-slate-500 block font-medium">Borrowed</span>
                          <span className="text-lg font-bold text-indigo-600 mt-0.5 block">
                            {stats.ownershipCounts?.borrowed || 0}
                          </span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                          <span className="text-[11px] text-slate-500 block font-medium">Wishlist</span>
                          <span className="text-lg font-bold text-purple-600 mt-0.5 block">
                            {stats.ownershipCounts?.wishlist ?? (stats.statusCounts?.wishlist || 0)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Progress Aspect */}
                    <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 shadow-2xs space-y-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Watch & Play Progress</h3>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                          <span className="text-[11px] text-slate-500 block font-medium">Backlog</span>
                          <span className="text-lg font-bold text-slate-700 mt-0.5 block">
                            {stats.progressCounts?.not_started || 0}
                          </span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                          <span className="text-[11px] text-slate-500 block font-medium">In Progress</span>
                          <span className="text-lg font-bold text-blue-600 mt-0.5 block">
                            {stats.progressCounts?.in_progress ?? (stats.statusCounts?.in_progress || 0)}
                          </span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                          <span className="text-[11px] text-slate-500 block font-medium">Completed</span>
                          <span className="text-lg font-bold text-emerald-600 mt-0.5 block">
                            {stats.progressCounts?.completed ?? (stats.statusCounts?.completed || 0)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Column 2 (Narrower): Format & Edition Breakdown (4 / 12 cols = 33.3%) */}
                <div className="lg:col-span-4 p-5 rounded-2xl bg-slate-50 border border-slate-200 shadow-2xs space-y-3.5 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Format & Edition Breakdown</h3>
                    <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
                      {stats.formatCounts?.map((f, i) => {
                        const pct = stats.totalItems > 0 ? Math.round((f.count / stats.totalItems) * 100) : 0;
                        return (
                          <div key={i} className="space-y-1">
                            <div className="flex justify-between text-xs font-semibold text-slate-700">
                              <span className="truncate pr-2">{f.format}</span>
                              <span className="shrink-0">{f.count} ({pct}%)</span>
                            </div>
                            <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                              <div 
                                className="h-full rounded-full bg-gradient-to-r from-forest-400 to-forest-600"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                      {(!stats.formatCounts || stats.formatCounts.length === 0) && (
                        <p className="text-xs text-slate-400 italic">No format data available</p>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
                    <span>Physical editions logged</span>
                    <span className="font-bold text-slate-700">{stats.formatCounts?.reduce((acc, curr) => acc + curr.count, 0) || 0} total</span>
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
