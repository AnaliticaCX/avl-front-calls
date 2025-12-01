import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#375a6f',
          hover: '#2b4f65',
          dark: '#233d4a',
          light: '#5a7c90',
        },
        secondary: {
          DEFAULT: '#2f5b6d',
          dark: '#1f3b4d',
        },
        brand: {
          green: '#cfe97a',
          blue: '#0a3f8b',
        },
        text: {
          title: '#111827', // gray-900
          DEFAULT: '#374151', // gray-700
          body: '#4b5563', // gray-600
          muted: '#6b7280', // gray-500
          light: '#f9fafb', // gray-50
        },
        background: {
          DEFAULT: '#fffbf7',
          paper: '#ffffff',
          warm: '#fffbf7',
        },
        avalogic: {
          darkBlue: '#0a2540',
          blue: '#0056b3',
          lightBlue: '#f0f4f8',
          orange: '#f97316',
          textLight: '#64748b',
          lightGray: '#f1f5f9',
        }
      },
      backgroundImage: {
        'gradient-principal': 'linear-gradient(90deg, #365a6f 0%, #274f62 100%)',
        'gradient-vertical': 'linear-gradient(180deg, #365a6f 0%, #274f62 100%)',
        'gradient-secundario': 'linear-gradient(90deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.02))'
      },
      fontFamily: {
        sans: ["'Roboto'", "sans-serif"],
        slab: ["'Roboto Slab'", "serif"]
      },
      borderRadius: {
        'btn-lg': '30px'
      },
      boxShadow: {
        'primary-sm': '0 2px 8px rgba(55, 90, 111, 0.12)',
        'primary-md': '0 6px 20px rgba(55, 90, 111, 0.12)',
        'card': '0 6px 18px rgba(16, 24, 40, 0.06)',
      },
      backgroundSize: {
        '200': '200%'
      },
      screens: {
        'xs': '0px',
        'sm': '576px',
        'md': '768px',
        'lg': '992px',
        'xl': '1200px',
        '2xl': '1440px'
      }
    },
  },
  plugins: [],
};

export default config;
