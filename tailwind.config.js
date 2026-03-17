/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'serif-old': ['"Playfair Display"', 'Georgia', 'serif'],
        'mono-cult': ['"Courier Prime"', 'Courier', 'monospace'],
      },
      colors: {
        'ink': '#0a0908',
        'parchment': '#e8dcc8',
        'blood': '#8b1a1a',
        'void': '#0d0d1a',
        'mold': '#2a3a2a',
        'brass': '#b5921a',
        'pale': '#c9b99a',
        'ghost': '#7a8a9a',
        'decay': '#3a2a1a',
      },
      animation: {
        'flicker': 'flicker 3s infinite',
        'shake': 'shake 0.5s ease-in-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 2s linear infinite',
        'fade-in': 'fadeIn 0.6s ease-out forwards',
        'slide-up': 'slideUp 0.4s ease-out forwards',
        'glow-red': 'glowRed 1.5s ease-in-out infinite alternate',
      },
      keyframes: {
        flicker: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.85' },
          '75%': { opacity: '0.95' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-4px) rotate(-1deg)' },
          '20%, 40%, 60%, 80%': { transform: 'translateX(4px) rotate(1deg)' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        glowRed: {
          '0%': { boxShadow: '0 0 5px #8b1a1a, 0 0 10px #8b1a1a' },
          '100%': { boxShadow: '0 0 15px #cc2222, 0 0 30px #cc2222, 0 0 45px #aa1111' },
        },
      },
      backgroundImage: {
        'noise': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.05'/%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [],
}
