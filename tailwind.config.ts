import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // SpeakVerse design system
        'sv-bg': '#F7F9FC',
        'sv-surface': '#FFFFFF',
        'sv-text': '#17243A',
        'sv-text-secondary': '#596579',
        'sv-primary': '#2458A6',
        'sv-primary-hover': '#1a4280',
        'sv-accent': '#167D72',
        'sv-border': '#DFE5EE',
        'sv-success': '#18765A',
        'sv-warning': '#9A6216',
        'sv-error': '#B42332',
        'sv-teal': '#167D72',
        'sv-amber': '#9A6216',
        // Semantic feedback colors
        'sv-correct': '#18765A',
        'sv-incorrect': '#B42332',
        'sv-hint': '#9A6216',
        'sv-info': '#2458A6',
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans Telugu', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'sv': '12px',
        'sv-lg': '16px',
      },
      spacing: {
        '4.5': '1.125rem',
      },
      minHeight: {
        'touch': '44px',
      },
      boxShadow: {
        'sv-card': '0 1px 3px 0 rgba(23,36,58,0.08), 0 1px 2px -1px rgba(23,36,58,0.04)',
        'sv-card-hover': '0 4px 6px -1px rgba(23,36,58,0.10), 0 2px 4px -2px rgba(23,36,58,0.06)',
      },
    },
  },
  plugins: [],
}

export default config
