import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        sand: {
          50:  "#FDFAF3",
          100: "#FAF3E3",
          200: "#F5E4C0",
          300: "#EDD49A",
          400: "#E2BF72",
          500: "#D4A54E",
        },
        earth: {
          50:  "#F7EFE7",
          100: "#EDD9C6",
          200: "#D5B08A",
          300: "#B8845A",
          400: "#8B5A2B",
          500: "#5C3D1E",
          600: "#3E2610",
          700: "#2C1A0E",
          800: "#1A0F08",
        },
        trail: {
          DEFAULT: "#C4622D",
          light:   "#D97E4A",
          dark:    "#9B4A1E",
        },
        forest: {
          DEFAULT: "#4A7C59",
          light:   "#6A9E78",
          dark:    "#2E5038",
        },
      },
      fontFamily: {
        display: ["var(--font-playfair)", "Georgia", "serif"],
        body:    ["var(--font-lato)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
