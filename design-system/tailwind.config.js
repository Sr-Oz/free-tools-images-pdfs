/**
 * Golden Wattle Modern — Tailwind theme extension
 * Reference only: this project has no build step / no Tailwind installed.
 * Drop the `extend` block below into a real tailwind.config.js in a project
 * that actually runs Tailwind. See design-system/README.md.
 */
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#FFD700",
          dark: "#C9A200",
          light: "#FFEA80",
        },
        secondary: {
          DEFAULT: "#004D40",
          dark: "#00332B",
          light: "#337066",
        },
        tertiary: {
          DEFAULT: "#FFCC00",
          dark: "#CCA300",
        },
        neutral: {
          dark: "#1B1C1C",
          700: "#3A3B3B",
          400: "#8A8B8B",
          200: "#D6D6D6",
        },
        surface: "#F2F2F2",
      },
      fontFamily: {
        heading: ["Manrope", "system-ui", "sans-serif"],
        body: ["Manrope", "system-ui", "sans-serif"],
        label: ["Manrope", "system-ui", "sans-serif"],
      },
      fontSize: {
        "headline-lg": ["2.75rem", { lineHeight: "1.15", fontWeight: "800" }],
        "headline-md": ["2rem", { lineHeight: "1.15", fontWeight: "700" }],
        "headline-sm": ["1.5rem", { lineHeight: "1.2", fontWeight: "700" }],
        body: ["1rem", { lineHeight: "1.6", fontWeight: "400" }],
        "body-sm": ["0.9rem", { lineHeight: "1.6", fontWeight: "400" }],
        label: ["0.8rem", { lineHeight: "1.4", fontWeight: "600" }],
      },
      borderRadius: {
        sm: "6px",
        md: "10px",
      },
      boxShadow: {
        "wattle-sm": "0 1px 2px rgba(27,28,28,0.06), 0 4px 12px rgba(27,28,28,0.08)",
        "wattle-md": "0 8px 24px rgba(27,28,28,0.12)",
      },
    },
  },
};
