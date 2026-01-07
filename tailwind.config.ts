import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Dark theme backgrounds
        'alm-bg-primary': '#0a0a0f',
        'alm-bg-secondary': '#12121a',
        'alm-bg-tertiary': '#1a1a24',
        'alm-bg-elevated': '#22222e',

        // Light theme backgrounds
        'alm-bg-light-primary': '#f8fafc',
        'alm-bg-light-secondary': '#ffffff',
        'alm-bg-light-tertiary': '#f1f5f9',

        // Accent colors
        'alm-accent': '#6366f1',
        'alm-accent-hover': '#818cf8',
        'alm-accent-muted': '#4f46e5',

        // Semantic colors
        'alm-success': '#22c55e',
        'alm-success-muted': '#16a34a',
        'alm-warning': '#f59e0b',
        'alm-warning-muted': '#d97706',
        'alm-danger': '#ef4444',
        'alm-danger-muted': '#dc2626',
        'alm-info': '#3b82f6',
        'alm-info-muted': '#2563eb',

        // Text colors
        'alm-text-primary': '#f8fafc',
        'alm-text-secondary': '#94a3b8',
        'alm-text-muted': '#64748b',
        'alm-text-dark': '#1e293b',
        'alm-text-dark-secondary': '#475569',

        // Border colors
        'alm-border': 'rgba(255, 255, 255, 0.08)',
        'alm-border-hover': 'rgba(255, 255, 255, 0.15)',
        'alm-border-light': 'rgba(0, 0, 0, 0.08)',

        // Chart colors
        'alm-chart-1': '#6366f1',
        'alm-chart-2': '#22c55e',
        'alm-chart-3': '#f59e0b',
        'alm-chart-4': '#ef4444',
        'alm-chart-5': '#8b5cf6',
        'alm-chart-6': '#06b6d4',
        'alm-chart-7': '#ec4899',
        'alm-chart-8': '#14b8a6',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        'xxs': '0.625rem',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'glass-sm': '0 4px 16px 0 rgba(0, 0, 0, 0.25)',
        'glow': '0 0 20px rgba(99, 102, 241, 0.3)',
        'glow-success': '0 0 20px rgba(34, 197, 94, 0.3)',
        'glow-danger': '0 0 20px rgba(239, 68, 68, 0.3)',
      },
      backdropBlur: {
        'xs': '2px',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-glass': 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
        'shimmer': 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.05) 50%, transparent 100%)',
      },
    },
  },
  plugins: [],
};

export default config;
