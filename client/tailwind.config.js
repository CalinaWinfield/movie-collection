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
        forest: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#2d6a4f', // Forest Green main
          600: '#1e5631', // Deep Forest Green
          700: '#164327', // Rich Pine Forest
          800: '#11341f',
          900: '#0b2415',
          950: '#05140b',
        },
        brand: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#2d6a4f',
          600: '#1e5631',
          700: '#164327',
          800: '#11341f',
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
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        display: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif']
      },
      boxShadow: {
        'glow-forest': '0 4px 20px -2px rgba(45, 106, 79, 0.35)',
        'glow-gold': '0 4px 20px -2px rgba(45, 106, 79, 0.25)',
        'case': '2px 4px 12px rgba(0, 0, 0, 0.45), inset -1px 0 2px rgba(255, 255, 255, 0.25)',
      }
    },
  },
  plugins: [],
}
