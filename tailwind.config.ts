import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          50: "#fefdfa",
          100: "#fdfbf7",
          200: "#faf7f0",
          300: "#f5efe6",
          400: "#eadecc",
          500: "#ddcbb2",
          900: "#443b2f",
        },
        emerald: {
          50: "#ecfdf5",
          100: "#d1fae5",
          200: "#a7f3d0",
          300: "#6ee7b7",
          400: "#34d399",
          500: "#10b981",
          600: "#059669",
          700: "#047857",
          800: "#065f46",
          900: "#064e3b",
          950: "#022c22",
        },
        mint: {
          50: "#f2fcf8",
          100: "#e1f8ef",
          200: "#c5f2df",
          300: "#96e6c7",
          400: "#5ed2a8",
          500: "#34b889",
          600: "#24956d",
          700: "#1e7759",
          800: "#1b5e48",
          900: "#184e3d",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Cabinet Grotesk", "Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
