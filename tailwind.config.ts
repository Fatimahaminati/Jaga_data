import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eefbf6',
          100: '#d5f5e9',
          200: '#aeead6',
          300: '#79d9bd',
          400: '#42c0a0',
          500: '#1da587',
          600: '#11856e',
          700: '#106a5a',
          800: '#115549',
          900: '#11463d',
          950: '#04281f',
        },
        accent: {
          50: '#fff4ed',
          100: '#ffe7d9',
          200: '#fecbb1',
          300: '#fdaa7f',
          400: '#fb7d47',
          500: '#f95a21',
          600: '#ea4013',
          700: '#c22e0e',
          800: '#9a2714',
          900: '#7c2414',
        },
        ink: {
          50: '#f6f7f9',
          100: '#eceef2',
          200: '#d5d9e2',
          300: '#b0b8c8',
          400: '#8591a8',
          500: '#5f6c85',
          600: '#515c73',
          700: '#424b5e',
          800: '#394150',
          900: '#333945',
          950: '#15181f',
        },
      },
      fontFamily: {
        sans: [
          'Segoe UI',
          'system-ui',
          '-apple-system',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
      borderRadius: {
        xl: '0.9rem',
        '2xl': '1.25rem',
      },
      boxShadow: {
        card: '0 1px 2px rgba(21, 24, 31, 0.06), 0 8px 24px -12px rgba(21, 24, 31, 0.25)',
        pop: '0 12px 32px -12px rgba(21, 24, 31, 0.35)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        // `scale` (properti CSS mandiri) supaya tidak menimpa `transform`
        // milik utilitas Tailwind seperti `-translate-x-1/2 -translate-y-1/2`.
        'pop-in': {
          from: { opacity: '0', scale: '0.96' },
          to: { opacity: '1', scale: '1' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.25s ease-out both',
        'pop-in': 'pop-in 0.15s ease-out both',
      },
    },
  },
  plugins: [],
} satisfies Config
