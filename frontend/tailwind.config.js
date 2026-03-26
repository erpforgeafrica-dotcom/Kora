/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        kora: {
          ink: "#101828",
          base: "#f8f9fc",
          accent: "#0f766e",
          signal: "#d97706"
        }
      },
      boxShadow: {
        panel: "0 10px 40px rgba(16, 24, 40, 0.08)"
      }
    }
  },
  plugins: []
};
