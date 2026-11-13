/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/pages/**/*.{js,mdx}",
    "./src/components/**/*.{js,mdx}",
    "./src/app/**/*.{js,mdx}",
    "./src/lib/**/*.{js,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "var(--brand-50)",
          100: "var(--brand-100)",
          600: "var(--brand-600)",
          700: "var(--brand-700)",
        },
        ink: {
          900: "var(--ink-900)",
          600: "var(--ink-600)",
          400: "var(--ink-400)",
        },
        line: {
          200: "var(--line-200)",
        },
        surface: {
          0: "var(--surface-0)",
          50: "var(--surface-50)",
          100: "var(--surface-100)",
        },
        risk: {
          low: "var(--risk-low)",
          "low-bg": "var(--risk-low-bg)",
          med: "var(--risk-med)",
          "med-bg": "var(--risk-med-bg)",
          high: "var(--risk-high)",
          "high-bg": "var(--risk-high-bg)",
        },
        emergency: {
          DEFAULT: "var(--emergency)",
          bg: "var(--emergency-bg)",
        },
        demo: {
          DEFAULT: "var(--demo)",
          bg: "var(--demo-bg)",
        },
        info: {
          DEFAULT: "var(--info)",
          bg: "var(--info-bg)",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        devanagari: ["var(--font-devanagari)", "sans-serif"],
        kannada: ["var(--font-kannada)", "sans-serif"],
      },
      minHeight: {
        touch: "44px",
      },
      minWidth: {
        touch: "44px",
      },
    },
  },
  plugins: [],
};
