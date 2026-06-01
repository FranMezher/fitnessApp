/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html'],
  theme: {
    extend: {
      colors: {
        bg: '#080808',
        surface: 'rgba(255,255,255,0.05)',
        line: 'rgba(255,255,255,0.09)',
        neon: '#CCFF00',
        orange: '#FF6B35',
        teal: '#3DFFA0',
        purple: '#B388FF',
        ink: '#F2F2F2',
        muted: '#888888',
        dim: '#444444',
      },
      fontFamily: { sans: ['"Space Grotesk"', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
};
