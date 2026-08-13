import type { Config } from "tailwindcss";

/**
 * Meridian design tokens (Palisaid-influenced).
 * Token -> Tailwind class map (agents: use THESE, never hardcode hex):
 *   brand / brand-deep / brand-soft   #4C5FD5 / #3846A8 / #EEF1FC
 *   ok / ok-soft                      #2E9E5B / #E8F8EE   (APPROVE, satisfied)
 *   warn / warn-soft                  #C08A2E / #FBF1DF   (NEEDS_REVIEW, low-conf, EXPEDITE)
 *   danger / danger-soft              #D2564B / #FCEBEA   (DENY, unsatisfied)
 *   ink / ink-2 / ink-3               #22263A / #6C7086 / #9B9EB3
 *   edge (borders)                    #E7E8F2
 *   canvas (page/card bg)             #F7F8FD
 *   rounded-lg/md/sm                  15px / 11px / 8px
 *   shadow-panel                      dominant-element shadow ONLY
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: "#4C5FD5",
        "brand-deep": "#3846A8",
        "brand-soft": "#EEF1FC",
        ok: "#2E9E5B",
        "ok-soft": "#E8F8EE",
        warn: "#C08A2E",
        "warn-soft": "#FBF1DF",
        danger: "#D2564B",
        "danger-soft": "#FCEBEA",
        ink: "#22263A",
        "ink-2": "#6C7086",
        "ink-3": "#9B9EB3",
        edge: "#E7E8F2",
        canvas: "#F7F8FD",
      },
      fontFamily: {
        sans: ["var(--font-poppins)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      borderRadius: {
        lg: "15px",
        md: "11px",
        sm: "8px",
      },
      boxShadow: {
        panel: "0 10px 30px -12px rgba(56, 70, 168, 0.22)",
      },
      keyframes: {
        "dot-pulse": {
          "0%,100%": { opacity: "0.25" },
          "50%": { opacity: "1" },
        },
        "step-in": {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        // stagger the three dots via inline animationDelay
        "dot-pulse": "dot-pulse 1.1s ease-in-out infinite",
        "step-in": "step-in 0.35s ease-out both",
        "fade-in": "fade-in 0.4s ease-out both",
      },
      spacing: {
        "1": "4px",
        "2": "8px",
        "3": "12px",
        "4": "16px",
        "6": "24px",
      },
    },
  },
  plugins: [],
};

export default config;
