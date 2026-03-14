/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // Enable class-based dark mode
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Semantic color tokens that adapt to theme
        'bg-primary': 'var(--bg-primary)',
        'bg-secondary': 'var(--bg-secondary)',
        'bg-tertiary': 'var(--bg-tertiary)',
        'bg-card': 'var(--bg-card)',
        'border': 'var(--border)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-tertiary': 'var(--text-tertiary)',
        'accent-blue': 'var(--accent-blue)',
        'accent-blue-hover': 'var(--accent-blue-hover)',
        
        // Legacy navy colors for backward compatibility
        navy: {
          950: '#0f1419',
          900: '#1a1f2e',
          800: '#222939',
          700: '#2d3548',
          600: '#3d4558',
        },
      },
      fontSize: {
        // Increased base font sizes for better readability
        'xs': ['14px', { lineHeight: '20px' }],      // Minimum 14px
        'sm': ['15px', { lineHeight: '22px' }],
        'base': ['16px', { lineHeight: '24px' }],    // 16px minimum body
        'lg': ['18px', { lineHeight: '28px' }],
        'xl': ['20px', { lineHeight: '30px' }],
        '2xl': ['24px', { lineHeight: '32px' }],     // 24px minimum headings
        '3xl': ['28px', { lineHeight: '36px' }],
        '4xl': ['32px', { lineHeight: '40px' }],
        '5xl': ['36px', { lineHeight: '44px' }],
        '6xl': ['48px', { lineHeight: '56px' }],
        '7xl': ['56px', { lineHeight: '64px' }],
      },
      spacing: {
        // Generous spacing values
        '18': '4.5rem',   // 72px
        '22': '5.5rem',   // 88px
        '26': '6.5rem',   // 104px
        '30': '7.5rem',   // 120px
      },
      padding: {
        'card': '2rem',       // 32px card padding
        'card-lg': '2.5rem',  // 40px large card padding
      },
      gap: {
        'section': '2rem',    // 32px section gap
        'element': '1rem',    // 16px element gap
      },
    },
  },
  plugins: [],
}
