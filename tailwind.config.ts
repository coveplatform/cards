import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        stone: {
          950: '#0c0a09',
        },
      },
      fontFamily: {
        fantasy: ['Palatino Linotype', 'Book Antiqua', 'Palatino', 'serif'],
      },
    },
  },
  plugins: [],
} satisfies Config
