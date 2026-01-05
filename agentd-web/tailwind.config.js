/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'agentd-bg': '#FAF2DE',
        'agentd-text': '#2E2E2E',
        'agentd-border': '#000000',
        'agentd-primary': '#5F5CE5',
        'agentd-secondary': '#C3FF16',
        'agentd-accent1': '#FFE816',
        'agentd-accent2': '#F79CFF',
        'agentd-accent3': '#FD9800',
      },
      fontFamily: {
        'instrument-serif': ['Instrument Serif', 'serif'],
        'general-sans': ['General Sans', 'sans-serif'],
        'anton': ['Anton', 'sans-serif'],
        'bebas': ['Bebas Neue', 'sans-serif'],
        'caveat': ['Caveat', 'cursive'],
        'gochi': ['Gochi Hand', 'cursive'],
        'pixelify': ['Pixelify Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
