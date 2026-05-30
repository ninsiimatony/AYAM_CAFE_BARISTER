import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './contexts/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        coffee: {
          50:  '#fdf6ed',
          100: '#f9e8d0',
          200: '#f2cfa0',
          300: '#e8b06a',
          400: '#dc8e3e',
          500: '#c87020',
          600: '#a85918',
          700: '#7b4116',
          800: '#5a3018',
          900: '#2c1a0e',
          950: '#160d06',
        },
        cream: {
          50:  '#fffdf9',
          100: '#fdf6ed',
          200: '#f9ecd8',
          300: '#f2dab8',
          400: '#e8c490',
        },
        caramel: {
          300: '#e8b572',
          400: '#d4994a',
          500: '#c8843a',
          600: '#a86e2e',
        },
        espresso: {
          800: '#2c1a0e',
          900: '#160d06',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Georgia', 'serif'],
      },
      backgroundImage: {
        'coffee-gradient': 'linear-gradient(135deg, #2c1a0e 0%, #5a3018 50%, #7b4116 100%)',
        'cream-gradient': 'linear-gradient(135deg, #fdf6ed 0%, #f9e8d0 100%)',
        'hero-pattern': "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23c87020' fill-opacity='0.06'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
      },
      boxShadow: {
        'coffee': '0 4px 24px rgba(124, 63, 0, 0.15)',
        'coffee-lg': '0 8px 40px rgba(124, 63, 0, 0.2)',
        'inset-coffee': 'inset 0 2px 4px rgba(44, 26, 14, 0.1)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}

export default config
