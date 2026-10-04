/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#f8fafc',
        surface: '#ffffff',
        'surface-elevated': '#f1f5f9',
        'surface-border': '#e2e8f0',
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
        'glow-gold': '0 4px 20px -2px rgba(245, 158, 11, 0.25)',
        'case': '2px 4px 12px rgba(0, 0, 0, 0.45), inset -1px 0 2px rgba(255, 255, 255, 0.25)',
      }
    },
  },
  plugins: [],
}
