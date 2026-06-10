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
        /* Industrial Brutalist Color Palette */
        "brutal-black": "#09090B",      // Deep Zinc - Primary Background
        "brutal-orange": "#FF4500",     // OrangeRed - Accent & Danger
        "brutal-warning": "#FB8C00",    // Orange - Warning Alert
        "brutal-success": "#10B981",    // Emerald - Success/Normal
        "brutal-border": "#E2E8F0",     // Slate 200 - High-contrast borders
        "brutal-text": "#FAFAFA",       // Zinc 50 - Primary text
        "brutal-text-secondary": "#A1A1AA", // Zinc 400 - Secondary text
        "brutal-text-muted": "#71717A", // Zinc 500 - Muted text
      },
      fontFamily: {
        /* Industrial Brutalist Typography */
        heading: ["Space Grotesk", "sans-serif"],  // Architectural precision
        numeric: ["Space Mono", "monospace"],      // Decimal alignment
        body: ["Inter", "sans-serif"],             // Maximum legibility
      },
      borderWidth: {
        /* Brutalist Border Standards */
        brutal: "2px",
      },
      borderRadius: {
        /* Sharp corners - no rounded borders */
        none: "0px",
      },
      boxShadow: {
        /* Hard shadows for brutalist aesthetic */
        brutal: "4px 4px 0px 0px rgba(226, 232, 240, 1)",
        "brutal-hover": "6px 6px 0px 0px rgba(255, 69, 0, 1)",
      },
      spacing: {
        /* Fixed multiples of 8px */
        // Tailwind already has these, but documenting the standard
      },
    },
  },
  plugins: [],
};

export default config;
