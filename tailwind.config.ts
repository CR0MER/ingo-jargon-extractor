import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#f7f6f4",
        surface: "#fffefc",
        "surface-alt": "#fbfaf8",
        "surface-sunken": "#fdfcfa",
        "surface-muted": "#f5f4f2",
        "surface-badge": "#f2f0ed",

        border: "#e7e5e4",
        "border-subtle": "#efedea",
        "border-subtle-alt": "#f2f0ed",
        "border-control": "#ddd9d4",

        text: "#1c1917",
        "text-control": "#44403c",
        "text-secondary": "#57534e",
        "text-tertiary": "#78716c",
        "text-muted": "#a8a29e",
        "text-disabled": "#c4bfba",
        "text-disabled-alt": "#d6d3d1",

        accent: "oklch(0.52 0.085 195)",
        "accent-hover": "oklch(0.45 0.085 195)",
        "accent-light": "oklch(0.62 0.06 195)",
        "accent-light-alt": "oklch(0.72 0.06 195)",
        "accent-tint": "oklch(0.985 0.008 195)",

        danger: "oklch(0.55 0.19 25)",
        "danger-hover": "oklch(0.48 0.19 25)",
        "danger-tint": "oklch(0.95 0.03 25)",

        overlay: "rgba(28,25,23,.34)",
      },
      fontFamily: {
        sans: [
          '"Helvetica Neue"',
          "Helvetica",
          "var(--font-noto-sans-jp)",
          "sans-serif",
        ],
        mono: ["var(--font-jetbrains-mono)", "monospace"],
      },
      fontSize: {
        "9.5": "9.5px",
        "10": "10px",
        "10.5": "10.5px",
        "11": "11px",
        "11.5": "11.5px",
        "12": "12px",
        "12.5": "12.5px",
        "13": "13px",
        "13.5": "13.5px",
        "14": "14px",
        "15": "15px",
        "19": "19px",
        "26": "26px",
      },
      borderRadius: {
        "2": "2px",
        "4": "4px",
        "5": "5px",
        "6": "6px",
        "7": "7px",
        "8": "8px",
        "9": "9px",
        "12": "12px",
        "15": "15px",
      },
      spacing: {
        "9": "9px",
        "11": "11px",
        "18": "18px",
        "22": "22px",
        "26": "26px",
        "34": "34px",
      },
      width: {
        panel: "296px",
      },
      height: {
        header: "56px",
        "30": "30px",
      },
      boxShadow: {
        modal: "0 18px 50px rgba(28,25,23,.22)",
      },
      transitionDuration: {
        "450": "450ms",
      },
    },
  },
  plugins: [],
};

export default config;
