/**
 * Tailwind CSS Configuration
 * Content paths tuned to Vite React project structure.
 */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          900: '#0e1116',
        },
      },
    },
  },
  // Use class strategy so we can toggle dark mode regardless of OS setting
  darkMode: 'class',
  plugins: [],
};
