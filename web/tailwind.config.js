/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sentry: {
          bg: '#0a0a0f',
          card: '#12121a',
          border: '#1e1e2e',
          accent: '#3b82f6',
          success: '#22c55e',
          warning: '#f59e0b',
          danger: '#ef4444',
        }
      }
    },
  },
  plugins: [],
}
