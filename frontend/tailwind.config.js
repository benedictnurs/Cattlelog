/** @type {import('tailwindcss').Config} */
import plugin from "tailwindcss/plugin";

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      keyframes: {
        glow: {
          "0%": { filter: "drop-shadow(0 0 5px #e7c756)" },
          "50%": { filter: "drop-shadow(0 0 10px #e7c756)" },
          "100%": { filter: "drop-shadow(0 0 5px #e7c756)" },
        },
        tooltipFadeIn: {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        glow: "glow 1.5s infinite alternate ease-in-out",
        "tooltip-enter": "tooltipFadeIn 220ms ease-out both",
      },
      colors: {
        header_primary: "#2C75A5",
        header_secondary: "#0F293A",
        footer_middle_color: "#1C4B69",
        tag_bg_color: "#7B7B7B",
        rating_green: "#3E8D40",
        rating_yellow: "#E7C756",
        rating_red: "#E05346",
      },
    },
  },
  plugins: [
    plugin(function ({ addUtilities }) {
      addUtilities({
        ".scrollbar-gutter-stable": {
          "scrollbar-gutter": "stable",
        },
      });
    }),
  ],
};
