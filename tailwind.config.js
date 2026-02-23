/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Charte graphique Kimistack (Slack-inspired violet)
        primary: {
          50:  '#F9F0FA',
          100: '#F0D9F1',
          200: '#E0B3E2',
          300: '#C77FCA',
          400: '#9E4DA2',
          500: '#7B2C7F',  // accent violet
          600: '#611F69',  // primary light
          700: '#4A154B',  // PRIMARY — brand color
          800: '#350D36',  // primary dark
          900: '#270A28',
          950: '#1A0619',
        },
        secondary: {
          50:  '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#7CB8DE',
          400: '#1D9BD1',
          500: '#1264A3',  // secondary brand
          600: '#0F4C75',
          700: '#0B3D5E',
          800: '#082E47',
          900: '#051E30',
        },
        accent: {
          50:  '#ECFDF5',
          100: '#D1FAE5',
          200: '#A7F3D0',
          300: '#6EE7B7',
          400: '#2EB886',  // success / accent brand
          500: '#10B981',
          600: '#059669',
        },
        warning: {
          50:  '#FDF5E6',
          100: '#FBEBCC',
          200: '#F7D799',
          300: '#F3C366',
          400: '#EFAF33',
          500: '#ECB22E',  // Warning
          600: '#BD8E25',
          700: '#8E6A1C',
        },
        error: {
          50:  '#FCE8ED',
          100: '#F9D1DB',
          200: '#F3A3B7',
          300: '#ED7593',
          400: '#E7476F',
          500: '#E01E5A',  // Error
          600: '#B31848',
          700: '#861236',
        },
        surface: '#FFFFFF',
        muted:   '#F8FAFC',
        subtle:  '#F1F5F9',
      },
      fontFamily: {
        sans: ['Jost', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
