// Shared scroll-reveal + count-up + sparkline-draw utilities.
// Fully gated on prefers-reduced-motion: reduced users land on the final state instantly.

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ── Scroll reveal ─────────────────────────────────────────── */
function initReveal() {
  const els = Array.from(document.querySelectorAll<HTMLElement>(".reveal"));
  if (reduceMotion) {
    els.forEach((el) => el.classList.add("is-in"));
    return;
  }
  const io = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          (e.target as HTMLElement).classList.add("is-in");
          obs.unobserve(e.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
  );
  els.forEach((el) => io.observe(el));
}

/* ── Count-up ──────────────────────────────────────────────── */
function formatNumber(n: number, decimals: number, sep: boolean): string {
  const fixed = n.toFixed(decimals);
  if (!sep) return fixed;
  const [intPart, dec] = fixed.split(".");
  const withSep = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return dec ? `${withSep}.${dec}` : withSep;
}

function runCountUp(el: HTMLElement) {
  const target = parseFloat(el.dataset.countup || "0");
  const decimals = parseInt(el.dataset.decimals || "0", 10);
  const sep = el.dataset.sep === "true";
  const prefix = el.dataset.prefix || "";
  const suffix = el.dataset.suffix || "";
  const duration = 1000;

  if (reduceMotion) {
    el.textContent = prefix + formatNumber(target, decimals, sep) + suffix;
    return;
  }

  const start = performance.now();
  const tick = (now: number) => {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    const val = target * eased;
    el.textContent = prefix + formatNumber(val, decimals, sep) + suffix;
    if (t < 1) requestAnimationFrame(tick);
    else el.textContent = prefix + formatNumber(target, decimals, sep) + suffix;
  };
  requestAnimationFrame(tick);
}

function initCountUp() {
  const els = Array.from(document.querySelectorAll<HTMLElement>("[data-countup]"));
  const io = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          runCountUp(e.target as HTMLElement);
          // draw the sparkline on the same tile
          (e.target as HTMLElement).closest("[data-tile]")?.classList.add("is-drawn");
          obs.unobserve(e.target);
        }
      });
    },
    { threshold: 0.5 }
  );
  els.forEach((el) => io.observe(el));
}

/* ── Boot: type the hero status line ───────────────────────── */
function initBootLine() {
  const el = document.querySelector<HTMLElement>("[data-bootline]");
  if (!el) return;
  const full = el.dataset.bootline || "";
  if (reduceMotion) {
    el.textContent = full;
    el.classList.add("boot-done");
    return;
  }
  el.textContent = "";
  let i = 0;
  const step = () => {
    if (i <= full.length) {
      el.textContent = full.slice(0, i);
      i++;
      setTimeout(step, 26);
    } else {
      el.classList.add("boot-done");
    }
  };
  setTimeout(step, 280);
}

initReveal();
initCountUp();
initBootLine();
