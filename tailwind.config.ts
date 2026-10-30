import type { Config } from "tailwindcss";

// Identidade visual W7 Creator.
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        w7: {
          forest: "#26403B",
          green: "#355D52",
          pink: "#C5567A",
          rose: "#D1B0A5",
          ivory: "#FBF8F6",
        },
      },
      fontFamily: {
        display: ["var(--font-playfair)", "Georgia", "serif"],
        sans: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
