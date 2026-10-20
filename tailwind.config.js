/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          DEFAULT: '#FFF8EC',
          light: '#FFFDF9',
          card: '#FFFFFF',
        },
        charcoal: {
          DEFAULT: '#171717',
          border: '#292929',
          muted: '#77736D',
          light: '#F4EFE6',
        },
        purple: {
          DEFAULT: '#7450E8',
          hover: '#6339E0',
          light: '#F0EBFF',
        },
        yellow: {
          DEFAULT: '#FFD93D',
          hover: '#F5CE26',
          light: '#FFF8D6',
        },
        mint: {
          DEFAULT: '#75E6C1',
          light: '#E2FAF2',
          dark: '#2AA57D',
        },
      },
      boxShadow: {
        'editorial-sm': '2px 2px 0px #292929',
        'editorial': '3px 3px 0px #292929',
        'editorial-lg': '5px 6px 0px #292929',
        'editorial-press': '1px 1px 0px #292929',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Black Ops One"', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        orbitron: ['Orbitron', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
}
