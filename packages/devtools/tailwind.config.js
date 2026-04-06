module.exports = {
  content: [
    './src/**/*.{ts,tsx,js,jsx}',
    '../../packages/ui/src/**/*.{ts,tsx,js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        tera: {
          black: '#0D0D0D',
          carbon: '#1A1A1A',
          graphite: '#2E2E2E',
          blue: '#3A7BFF',
          cyan: '#4FE3FF',
          purple: '#8A5CFF',
          mist: '#B3B3B3',
          cloud: '#F5F5F5',
        },
        primary: '#3A7BFF',
        accent: '#8A5CFF',
        highlight: '#4FE3FF',
        background: '#0D0D0D',
        surface: '#1A1A1A',
        border: '#2E2E2E',
        text: '#F5F5F5',
        muted: '#B3B3B3',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        heading: ['Space Grotesk', 'Inter', 'sans-serif'],
        code: ['JetBrains Mono', 'Fira Code', 'monospace'],
        satoshi: ['Satoshi', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
