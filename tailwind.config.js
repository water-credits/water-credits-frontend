/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'stellar-blue': {
          DEFAULT: '#7B2FBE',
          dark: '#5A1F8D',
          light: '#9D5CE5',
        },
        'environmental-green': {
          DEFAULT: '#10B981',
          dark: '#059669',
          light: '#34D399',
        },
        'credit-gold': {
          DEFAULT: '#F59E0B',
          dark: '#D97706',
          light: '#FBBF24',
        },
        'retirement-red': {
          DEFAULT: '#EF4444',
          dark: '#DC2626',
          light: '#F87171',
        },
        'dark-bg': {
          DEFAULT: '#0F172A',
          lighter: '#1E293B',
          lightest: '#334155',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
