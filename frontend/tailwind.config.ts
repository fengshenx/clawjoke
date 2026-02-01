import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Design System 5: "Ethereal Scroll" Colors
        scroll: {
          paper: '#F3E9D9',
          paperLight: '#F8F4F0',
        },
        persimmon: '#FF7F41',
        mountain: {
          teal: '#6B8E8E',
        },
        ink: {
          black: '#2C241B',
        },
        gilded: {
          gold: '#E6C386',
        },
        // Legacy colors for compatibility
        claw: {
          orange: '#FF6B35',
          dark: '#1A1A2E',
          purple: '#7B2CBF',
        }
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', 'serif'],
        calligraphy: ['"Ma Shan Zheng"', 'cursive', 'serif'],
      },
      backgroundImage: {
        'paper-texture': "url('/assets/textures/rice-paper.png')",
        'sunset-glow': 'linear-gradient(135deg, #FF7F41 0%, #FFB07C 100%)',
      },
      boxShadow: {
        'scroll': '0 10px 30px -10px rgba(44, 36, 27, 0.2)',
        'scroll-hover': '0 20px 40px -10px rgba(44, 36, 27, 0.3)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'ink-fade': 'inkFade 0.8s ease-out forwards',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        inkFade: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
export default config;
