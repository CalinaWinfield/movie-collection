import React, { useState } from 'react';
import { X, Download, Upload, Sparkles, FileText, FileCode, Check, AlertCircle } from 'lucide-react';
import { client } from '../api/client';

export function ExportImportModal({ isOpen, onClose, onRefresh }) {
  if (!isOpen) return null;

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleExportJson = () => {
    window.open('/api/backup/export/json', '_blank');
  };

  const handleExportCsv = () => {
    window.open('/api/backup/export/csv', '_blank');
  };

  const handleSeedSample = async () => {
    setLoading(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      const res = await client.post('/backup/seed-sample', {});
      setSuccessMsg(`Successfully loaded ${res.count} curated collector titles!`);
      onRefresh();
    } catch (err) {
      setErrorMsg('Error seeding starter titles: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const json = JSON.parse(evt.target.result);
        setLoading(true);
        const res = await client.post('/backup/import', { data: json });
        setSuccessMsg(`Successfully imported ${res.importedCount} titles into your collection!`);
        onRefresh();
      } catch (err) {
        setErrorMsg('Import error: Please ensure valid Kolekino JSON format.');
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/80 backdrop-blur-sm">
      <div 
        className="relative w-full max-w-lg bg-surface rounded-3xl border border-surface-border shadow-2xl overflow-hidden my-auto flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 bg-surface-elevated border-b border-surface-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-100 font-display">Backup & Library Tools</h2>
              <p className="text-xs text-slate-400">Export, import, or load sample collections</p>
            </div>
          </div>

          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white bg-surface rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Quick Seed Starter Curated Library */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 via-surface-elevated to-surface-elevated border border-amber-500/30 space-y-2">
            <div className="flex items-center gap-2 text-amber-400">
              <Sparkles className="w-4 h-4" />
              <h3 className="text-sm font-bold">Curated Starter Collection</h3>
            </div>
            <p className="text-xs text-slate-400">
              Add iconic boutique physical media (Dune 2 Steelbook, Criterion 4K Seven Samurai, Oppenheimer slipcover, Breaking Bad barrel set, Zelda Tears of the Kingdom).
            </p>
            <button
              onClick={handleSeedSample}
              disabled={loading}
              className="mt-2 w-full py-2 px-3 text-xs font-semibold rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 shadow transition-all"
            >
              {loading ? 'Adding sample titles...' : 'Load Curated Sample Library'}
            </button>
          </div>

          {/* Export Options */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Export Collection</h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleExportJson}
                className="p-3 rounded-2xl bg-surface-elevated border border-surface-border hover:border-amber-500/40 flex items-center gap-2.5 text-left transition-all"
              >
                <FileCode className="w-5 h-5 text-amber-400 shrink-0" />
                <div>
                  <span className="text-xs font-bold text-slate-100 block">JSON Export</span>
                  <span className="text-[10px] text-slate-500 block">Full database backup</span>
                </div>
              </button>

              <button
                onClick={handleExportCsv}
                className="p-3 rounded-2xl bg-surface-elevated border border-surface-border hover:border-amber-500/40 flex items-center gap-2.5 text-left transition-all"
              >
                <FileText className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <span className="text-xs font-bold text-slate-100 block">CSV Spreadsheet</span>
                  <span className="text-[10px] text-slate-500 block">Excel & Sheets format</span>
                </div>
              </button>
            </div>
          </div>

          {/* Import JSON */}
          <div className="space-y-2.5 pt-2 border-t border-surface-border">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Import Backup</h3>
            <label className="flex flex-col items-center justify-center p-5 border-2 border-dashed border-surface-border hover:border-amber-500/50 rounded-2xl bg-surface-elevated/50 cursor-pointer transition-colors text-center">
              <Upload className="w-6 h-6 text-slate-400 mb-1.5" />
              <span className="text-xs font-semibold text-slate-300">Click to upload Kolekino JSON backup</span>
              <span className="text-[10px] text-slate-500 mt-0.5">Supports full .json collection exports</span>
              <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
