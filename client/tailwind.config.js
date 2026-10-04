/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#090b10',
        surface: '#11151f',
        'surface-elevated': '#181e2b',
        'surface-border': '#222a3d',
        brand: {
          50: '#fffbeb',
          100: '#fef3c7',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        },
        edition: {
          '4k': '#eab308',
          bluray: '#2563eb',
          dvd: '#64748b',
          steelbook: '#94a3b8',
          criterion: '#ef4444',
          switch: '#dc2626',
          ps5: '#0284c7',
          xbox: '#16a34a',
          pc: '#8b5cf6',
          vhs: '#ec4899',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Cinzel', 'Inter', 'serif']
      },
      boxShadow: {
        'glow-gold': '0 0 25px -5px rgba(245, 158, 11, 0.35)',
        'glow-blue': '0 0 25px -5px rgba(37, 99, 235, 0.35)',
        'glow-red': '0 0 25px -5px rgba(239, 68, 68, 0.35)',
        'case': '2px 4px 12px rgba(0, 0, 0, 0.6), inset -1px 0 2px rgba(255, 255, 255, 0.15)',
      }
    },
  },
  plugins: [],
}
