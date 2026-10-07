/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        raven: {
          bg: '#0A1128',
          bgDark: '#070C1E',
          card: '#121B2D',
          cardHover: '#18243C',
          surface: '#1A253D',
          border: '#1F2D48',
          borderLight: '#2D3E61',
          red: '#E02424',
          redHover: '#C81E1E',
          redGlow: '#FF3838',
          muted: '#8C9BB4'
        },
        btc: {
          orange: '#F7931A',
          orangeHover: '#E07D09',
          gold: '#F0B90B',
          goldDark: '#C99400'
        },
        crypto: {
          green: '#0ECB81',
          greenDark: '#0A8A56',
          muted: '#8C9BB4',
          light: '#EAECEF'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Courier New', 'monospace']
      },
      boxShadow: {
        'glow-orange': '0 0 18px -2px rgba(247, 147, 26, 0.45)',
        'glow-raven': '0 0 18px -2px rgba(224, 36, 36, 0.45)',
        'glow-gold': '0 0 18px -2px rgba(240, 185, 11, 0.45)',
        'glow-green': '0 0 18px -2px rgba(14, 203, 129, 0.45)',
      }
    },
  },
  plugins: [],
}
