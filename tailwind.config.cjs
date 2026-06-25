/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      colors: {
        base: "var(--base)",
        "base-2": "var(--base-2)",
        panel: "var(--panel)",
        tile: "var(--tile)",
        inset: "var(--inset)",
        line: "var(--line)",
        fg: "var(--fg)",
        "fg-dim": "var(--fg-dim)",
        "fg-faint": "var(--fg-faint)",
        signal: "var(--signal)",
        route: "var(--route)",
        amber: "var(--amber)",
        coral: "var(--coral)",
        violet: "var(--violet)",
      },
      fontFamily: {
        display: ['"Clash Display"', '"Hanken Grotesk"', "sans-serif"],
        sans: ['"Hanken Grotesk"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
      maxWidth: {
        content: "var(--content-max)",
      },
    },
  },
  plugins: [],
};
