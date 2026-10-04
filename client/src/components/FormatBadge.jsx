import React from 'react';

export function FormatBadge({ format, packaging, slipcover, size = 'sm' }) {
  const f = (format || '').toLowerCase();

  let bgClass = 'bg-slate-800 text-slate-300 border-slate-700';
  let label = format || 'Standard';

  if (f.includes('4k')) {
    bgClass = 'bg-gradient-to-r from-amber-500/20 to-yellow-500/10 text-amber-300 border-amber-500/40 shadow-sm';
    label = '4K UHD';
  } else if (f.includes('criterion')) {
    bgClass = 'bg-neutral-900 text-white border-neutral-600 font-serif tracking-widest';
    label = 'CRITERION';
  } else if (f.includes('bluray') || f.includes('blu-ray')) {
    bgClass = 'bg-blue-600/20 text-blue-300 border-blue-500/40';
    label = 'BLU-RAY';
  } else if (f.includes('steelbook')) {
    bgClass = 'bg-gradient-to-r from-slate-400/20 to-zinc-400/10 text-zinc-200 border-zinc-400/50 shadow-sm';
    label = 'STEELBOOK';
  } else if (f.includes('switch') || f.includes('nintendo')) {
    bgClass = 'bg-red-600/20 text-red-400 border-red-500/40';
    label = 'SWITCH';
  } else if (f.includes('ps5') || f.includes('playstation 5')) {
    bgClass = 'bg-sky-600/20 text-sky-300 border-sky-500/40';
    label = 'PS5';
  } else if (f.includes('ps4') || f.includes('playstation 4')) {
    bgClass = 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40';
    label = 'PS4';
  } else if (f.includes('ps3') || f.includes('playstation 3')) {
    bgClass = 'bg-blue-600/20 text-blue-300 border-blue-500/40';
    label = 'PS3';
  } else if (f.includes('ps2') || f.includes('playstation 2')) {
    bgClass = 'bg-blue-700/20 text-blue-300 border-blue-600/40';
    label = 'PS2';
  } else if (f.includes('ps1') || f.includes('playstation 1')) {
    bgClass = 'bg-slate-600/20 text-slate-300 border-slate-500/40';
    label = 'PS1';
  } else if (f.includes('switch') || f.includes('nintendo switch')) {
    bgClass = 'bg-red-600/20 text-red-400 border-red-500/40';
    label = 'SWITCH';
  } else if (f.includes('3ds') || f.includes('nintendo ds')) {
    bgClass = 'bg-rose-600/20 text-rose-300 border-rose-500/40';
    label = '3DS / DS';
  } else if (f.includes('wii')) {
    bgClass = 'bg-sky-500/20 text-sky-200 border-sky-400/40';
    label = f.includes('wii u') ? 'WII U' : 'WII';
  } else if (f.includes('nintendo')) {
    bgClass = 'bg-red-600/20 text-red-400 border-red-500/40';
    label = 'NINTENDO';
  } else if (f.includes('xbox')) {
    bgClass = 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40';
    if (f.includes('series')) label = 'XBOX SERIES';
    else if (f.includes('one')) label = 'XBOX ONE';
    else if (f.includes('360')) label = 'XBOX 360';
    else label = 'XBOX';
  } else if (f.includes('pc') || f.includes('steam')) {
    bgClass = 'bg-purple-600/20 text-purple-300 border-purple-500/40';
    label = 'PC';
  } else if (f.includes('laserdisc')) {
    bgClass = 'bg-yellow-600/20 text-yellow-300 border-yellow-500/40';
    label = 'LASERDISC';
  } else if (f.includes('cartridge')) {
    bgClass = 'bg-amber-700/20 text-amber-300 border-amber-600/40';
    label = 'CARTRIDGE';
  } else if (f.includes('vhs')) {
    bgClass = 'bg-pink-600/20 text-pink-300 border-pink-500/40 font-mono';
    label = 'VHS';
  } else if (f.includes('dvd')) {
    bgClass = 'bg-slate-700/40 text-slate-300 border-slate-600/40';
    label = 'DVD';
  } else if (f.includes('digital')) {
    bgClass = 'bg-teal-600/20 text-teal-300 border-teal-500/40';
    label = 'DIGITAL';
  }

  const isSmall = size === 'sm';

  return (
    <div className="inline-flex items-center gap-1.5 flex-wrap">
      <span className={`inline-flex items-center font-bold tracking-wider uppercase rounded border ${bgClass} ${isSmall ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1'}`}>
        {label}
      </span>

      {packaging && packaging.toLowerCase().includes('steelbook') && !f.includes('steelbook') && (
        <span className={`inline-flex items-center rounded border border-zinc-500/40 bg-zinc-800/80 text-zinc-300 font-semibold uppercase ${isSmall ? 'text-[9px] px-1.5 py-0.5' : 'text-[11px] px-2 py-0.5'}`}>
          Steelbook
        </span>
      )}

      {slipcover ? (
        <span className={`inline-flex items-center rounded border border-emerald-500/30 bg-emerald-950/40 text-emerald-300/90 font-medium ${isSmall ? 'text-[9px] px-1.5 py-0.5' : 'text-[11px] px-2 py-0.5'}`} title="Has Slipcover">
          Slipcover
        </span>
      ) : null}
    </div>
  );
}
