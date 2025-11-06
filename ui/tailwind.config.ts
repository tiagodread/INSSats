import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#f1f5ff",
          100: "#e1ebff",
          200: "#c2d7ff",
          300: "#95b7ff",
          400: "#618cff",
          500: "#3a63ff",
          600: "#2341db",
          700: "#1a32af",
          800: "#1a2a88",
          900: "#1b266d"
        },
        slate: {
          950: "#0f1729"
        }
      }
    }
  },
  plugins: []
};

export default config;
