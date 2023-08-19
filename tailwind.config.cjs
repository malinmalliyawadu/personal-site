/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      animation: {
        blob: "blob 60s infinite ease-in",
      },
      keyframes: {
        blob: {
          "0%": {
            transform: "rotate(0deg) translate(-150px) scale(1.2)",
          },
          "50%": {
            transform: "rotate(360deg) translate(300px) scale(2)",
          },
          "100%": {
            transform: "rotate(0deg) translate(-150px) scale(1.2)",
          },
        },
      },
    },
  },
  plugins: [],
};
