import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // backgroundImage: {
      //   "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
      //   "gradient-conic":
      //     "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      // },
      colors: {
        HCRed: "#ec3750",
        HCPurple: "#a633d6",
        // For accessibility & contrast
        HCPurpleText: "#C57BE5",
        HCOrange: "#ff8c37",
        bg: "#03001C",
      },
      fontFamily: {
        "dm-mono": ["var(--font-dm-mono)"],
      },
      backgroundImage: {
        "footer-pattern": "url('/footer-pattern.svg')",
      },
      keyframes: {
        fadeInDown: {
          "0%": { opacity: "0", transform: "translateY(-10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        fadeInDown: "fadeInDown 0.5s ease-out forwards",
      },
      screens: {
        'tabletx': '1090px',
        'tabletxx': '1185px'
      }
    },
  },
  plugins: [require("tailwind-scrollbar")],
};
export default config;
