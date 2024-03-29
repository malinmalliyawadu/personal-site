/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      animation: {
        blob: "blob 60s infinite",
        wave: "wave 2.5s infinite",
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
        wave: {
          "0%": {
            transform: "rotate(0deg)",
          },
          "10%": {
            transform: "rotate(14deg)",
          },
          "20%": {
            transform: "rotate(-8deg)",
          },
          "30%": {
            transform: "rotate(14deg)",
          },
          "40%": {
            transform: "rotate(-4deg)",
          },
          "50%": {
            transform: "rotate(10deg)",
          },
          "60%": {
            transform: "rotate(0deg)",
          },
          "100%": {
            transform: "rotate(0deg)",
          },
        },
      },
    },
  },
  plugins: [],
};
