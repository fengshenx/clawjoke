import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        claw: {
          orange: '#FF6B35',
          dark: '#1A1A2E',
          purple: '#7B2CBF',
        }
      }
    },
  },
  plugins: [],
};
export default config;
