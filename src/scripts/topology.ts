// ─────────────────────────────────────────────────────────────────────────────
// Live service-topology hero. Canvas 2D, no dependencies.
// The nodes are Malin's real shipped systems + the stack that runs them.
// Art-directed fixed coordinates (no physics) so it is always composed.
// ─────────────────────────────────────────────────────────────────────────────

type Accent = "signal" | "route" | "violet" | "default";

interface NodeDef {
  id: string;
  label: string;
  sub: string;
  icon: string;
  tier: number;
  nx: number;
  ny: number;
  accent: Accent;
  href?: string;
}

const C = {
  base: "#0a0e14",
  tile: "#141b26",
  line: "#243040",
  fg: "#e6edf3",
  fgDim: "#9fb0c3",
  fgFaint: "#5c6b7e",
  signal: "#3ddc97",
  route: "#4da3ff",
  violet: "#a78bfa",
  amber: "#ffb454",
};

const accentColor = (a: Accent) =>
  a === "signal" ? C.signal : a === "route" ? C.route : a === "violet" ? C.violet : C.fgDim;

// Tier x positions (normalized). 0 Edge → 4 Data, left to right.
const TX = [0.085, 0.305, 0.515, 0.725, 0.925];

const NODES: NodeDef[] = [
  // Edge
  { id: "everybody-eats", label: "everybody-eats", sub: "10,000+ volunteers · 4.6K MAU", icon: "/icons/nextjs.svg", tier: 0, nx: TX[0], ny: 0.22, accent: "route", href: "#work-ee" },
  { id: "fair-food", label: "fair-food", sub: "600+ volunteers · a11y-first", icon: "/icons/react.svg", tier: 0, nx: TX[0], ny: 0.52, accent: "route", href: "#work-ff" },
  { id: "microfrontends", label: "microfrontends", sub: "PartsTrader · supplier platform", icon: "/icons/single-spa.svg", tier: 0, nx: TX[0], ny: 0.82, accent: "route", href: "#exp-partstrader" },
  // Compute
  { id: "open-banking-api", label: "open-banking-api", sub: "ANZ · regulated APIs", icon: "/icons/nodejs.svg", tier: 1, nx: TX[1], ny: 0.16, accent: "route", href: "#exp-anz" },
  { id: "dotnet-svc", label: ".net services", sub: "C# · domain core", icon: "/icons/dotnetcore.svg", tier: 1, nx: TX[1], ny: 0.46, accent: "default" },
  { id: "fastify-api", label: "fastify apis", sub: "node · high throughput", icon: "/icons/fastify.svg", tier: 1, nx: TX[1], ny: 0.76, accent: "default" },
  // Platform
  { id: "kubernetes", label: "kubernetes", sub: "orchestration", icon: "/icons/kubernetes.svg", tier: 2, nx: TX[2], ny: 0.24, accent: "default" },
  { id: "argocd", label: "argocd", sub: "gitops delivery", icon: "/icons/argocd.svg", tier: 2, nx: TX[2], ny: 0.5, accent: "default" },
  { id: "terraform", label: "terraform", sub: "infra as code", icon: "/icons/terraform.svg", tier: 2, nx: TX[2], ny: 0.76, accent: "default" },
  // Cloud
  { id: "aws", label: "aws", sub: "2× AWS Professional", icon: "/icons/aws.svg", tier: 3, nx: TX[3], ny: 0.3, accent: "violet", href: "#certs" },
  { id: "census-pipeline", label: "census-pipeline", sub: "Stats NZ · national census", icon: "/icons/azure.svg", tier: 3, nx: TX[3], ny: 0.64, accent: "violet", href: "#exp-statsnz" },
  // Data
  { id: "postgres", label: "postgres", sub: "primary store", icon: "/icons/postgresql.svg", tier: 4, nx: TX[4], ny: 0.36, accent: "default" },
  { id: "redis", label: "redis", sub: "cache · queues", icon: "/icons/redis.svg", tier: 4, nx: TX[4], ny: 0.66, accent: "default" },
];

const EDGES: Array<[string, string]> = [
  ["everybody-eats", "dotnet-svc"],
  ["everybody-eats", "fastify-api"],
  ["fair-food", "fastify-api"],
  ["microfrontends", "dotnet-svc"],
  ["open-banking-api", "kubernetes"],
  ["dotnet-svc", "kubernetes"],
  ["dotnet-svc", "argocd"],
  ["fastify-api", "argocd"],
  ["dotnet-svc", "terraform"],
  ["kubernetes", "aws"],
  ["argocd", "aws"],
  ["argocd", "census-pipeline"],
  ["terraform", "aws"],
  ["terraform", "census-pipeline"],
  ["aws", "postgres"],
  ["aws", "redis"],
  ["census-pipeline", "postgres"],
];

// Edges that carry animated request packets.
const ACTIVE = new Set([
  "everybody-eats>dotnet-svc",
  "fair-food>fastify-api",
  "open-banking-api>kubernetes",
  "dotnet-svc>argocd",
  "argocd>aws",
  "terraform>census-pipeline",
  "aws>postgres",
  "census-pipeline>postgres",
]);

function start() {
  const canvas = document.getElementById("topo-canvas") as HTMLCanvasElement | null;
  const wrap = document.getElementById("topo-wrap");
  const tip = document.getElementById("topo-tip");
  if (!canvas || !wrap) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // Below 860px the CSS hides the canvas and the static "live systems" legend takes
  // over, so the engine must go fully inert (no sizing, no rAF) on mobile.
  const mqMobile = window.matchMedia("(max-width: 860px)");

  // Preload icons.
  const icons = new Map<string, HTMLImageElement>();
  let iconsLoaded = 0;
  NODES.forEach((n) => {
    if (icons.has(n.icon)) return;
    const img = new Image();
    img.onload = () => { iconsLoaded++; requestDraw(); };
    img.onerror = () => { iconsLoaded++; };
    img.src = n.icon;
    icons.set(n.icon, img);
  });

  const PAD = { l: 60, r: 60, t: 48, b: 46 };
  const CHIP = 38;
  const half = CHIP / 2;

  let W = 0, H = 0, dpr = 1;
  const pos = new Map<string, { x: number; y: number; phase: number }>();

  function layout() {
    if (mqMobile.matches || getComputedStyle(canvas!).display === "none") return; // hidden on mobile
    const rect = wrap!.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) return; // hidden / not measured yet
    W = rect.width;
    H = rect.height;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas!.width = Math.round(W * dpr);
    canvas!.height = Math.round(H * dpr);
    canvas!.style.width = W + "px";
    canvas!.style.height = H + "px";
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    const innerW = W - PAD.l - PAD.r;
    const innerH = H - PAD.t - PAD.b;
    // Compress nodes into the upper band so the lower-left HUD never hides them.
    // Map ny [0.16, 0.82] -> [0.03, 0.50] of the inner height.
    const NY0 = 0.16, NY1 = 0.82, OUT0 = 0.02, OUT1 = 0.46;
    const nyScale = (OUT1 - OUT0) / (NY1 - NY0);
    NODES.forEach((n, i) => {
      const nyMapped = OUT0 + (n.ny - NY0) * nyScale;
      pos.set(n.id, {
        x: PAD.l + n.nx * innerW,
        y: PAD.t + nyMapped * innerH,
        phase: (i / NODES.length) * Math.PI * 2,
      });
    });
  }

  // Packets per active edge.
  interface Packet { t: number; speed: number; }
  const packets = new Map<string, { list: Packet[]; next: number }>();
  EDGES.forEach(([a, b]) => {
    const key = `${a}>${b}`;
    if (ACTIVE.has(key)) packets.set(key, { list: [], next: 0 });
  });

  let hovered: string | null = null;
  const neighbors = (id: string) => {
    const set = new Set<string>([id]);
    EDGES.forEach(([a, b]) => {
      if (a === id) set.add(b);
      if (b === id) set.add(a);
    });
    return set;
  };
  let related: Set<string> | null = null;

  function cubic(t: number, p0: number, p1: number, p2: number, p3: number) {
    const u = 1 - t;
    return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3;
  }
  function edgeGeom(a: string, b: string) {
    const pa = pos.get(a)!, pb = pos.get(b)!;
    const x1 = pa.x + half, y1 = pa.y;
    const x2 = pb.x - half, y2 = pb.y;
    const midX = (x1 + x2) / 2;
    return { x1, y1, x2, y2, midX };
  }

  const TIER_LABELS = ["edge", "compute", "platform", "cloud", "data"];
  function drawTierLabels() {
    ctx!.save();
    ctx!.font = '500 10px "JetBrains Mono", monospace';
    ctx!.fillStyle = C.fgFaint;
    ctx!.textAlign = "center";
    ctx!.textBaseline = "alphabetic";
    const innerW = W - PAD.l - PAD.r;
    TX.forEach((tx, i) => {
      ctx!.globalAlpha = 0.7;
      ctx!.fillText(TIER_LABELS[i].toUpperCase(), PAD.l + tx * innerW, 20);
    });
    ctx!.restore();
  }

  function drawEdge(a: string, b: string) {
    const g = edgeGeom(a, b);
    const key = `${a}>${b}`;
    let alpha = 0.16;
    let color = C.route;
    if (related) {
      const on = related.has(a) && related.has(b) && (a === hovered || b === hovered);
      alpha = on ? 0.55 : 0.05;
    }
    ctx!.save();
    ctx!.strokeStyle = color;
    ctx!.globalAlpha = alpha;
    ctx!.lineWidth = related && related.has(a) && related.has(b) && (a === hovered || b === hovered) ? 1.6 : 1;
    ctx!.beginPath();
    ctx!.moveTo(g.x1, g.y1);
    ctx!.bezierCurveTo(g.midX, g.y1, g.midX, g.y2, g.x2, g.y2);
    ctx!.stroke();
    ctx!.restore();
  }

  function drawPacket(a: string, b: string, t: number) {
    const g = edgeGeom(a, b);
    const x = cubic(t, g.x1, g.midX, g.midX, g.x2);
    const y = cubic(t, g.y1, g.y1, g.y2, g.y2);
    const incident = hovered && (a === hovered || b === hovered);
    let col = C.signal;
    let alpha = 1;
    if (related) {
      if (incident) col = C.amber;
      else if (!(related.has(a) && related.has(b))) alpha = 0.12;
    }
    ctx!.save();
    ctx!.globalAlpha = alpha;
    ctx!.shadowBlur = 10;
    ctx!.shadowColor = col;
    ctx!.fillStyle = col;
    ctx!.beginPath();
    ctx!.arc(x, y, 2.1, 0, Math.PI * 2);
    ctx!.fill();
    ctx!.restore();
  }

  function roundRect(x: number, y: number, w: number, h: number, r: number) {
    ctx!.beginPath();
    ctx!.moveTo(x + r, y);
    ctx!.arcTo(x + w, y, x + w, y + h, r);
    ctx!.arcTo(x + w, y + h, x, y + h, r);
    ctx!.arcTo(x, y + h, x, y, r);
    ctx!.arcTo(x, y, x + w, y, r);
    ctx!.closePath();
  }

  function drawNode(n: NodeDef, time: number) {
    const p = pos.get(n.id)!;
    const isHover = hovered === n.id;
    let alpha = 1;
    if (related && !related.has(n.id)) alpha = 0.28;
    const breathe = reduceMotion ? 0 : Math.sin(time / 1400 + p.phase) * 0.6;
    const s = (isHover ? 3 : 0) + breathe;
    const size = CHIP + s;
    const x = p.x - size / 2;
    const y = p.y - size / 2;
    const ac = accentColor(n.accent);

    ctx!.save();
    ctx!.globalAlpha = alpha;

    // chip
    roundRect(x, y, size, size, 9);
    ctx!.fillStyle = C.tile;
    ctx!.fill();
    if (isHover) {
      ctx!.shadowBlur = 18;
      ctx!.shadowColor = C.route;
    }
    ctx!.lineWidth = 1;
    ctx!.strokeStyle = isHover ? C.route : n.href ? ac : C.line;
    ctx!.globalAlpha = alpha * (isHover || n.href ? 1 : 0.9);
    roundRect(x, y, size, size, 9);
    ctx!.stroke();
    ctx!.shadowBlur = 0;

    // icon
    const img = icons.get(n.icon);
    if (img && img.complete && img.naturalWidth > 0) {
      const isz = size * 0.56;
      ctx!.globalAlpha = related && !related.has(n.id) ? 0.28 : 1;
      try {
        ctx!.drawImage(img, p.x - isz / 2, p.y - isz / 2, isz, isz);
      } catch (_e) { /* ignore */ }
    } else {
      ctx!.globalAlpha = alpha;
      ctx!.fillStyle = ac;
      ctx!.beginPath();
      ctx!.arc(p.x, p.y, 5, 0, Math.PI * 2);
      ctx!.fill();
    }

    // service indicator dot (top-right) for real systems
    if (n.href) {
      ctx!.globalAlpha = alpha;
      ctx!.fillStyle = n.accent === "violet" ? C.violet : C.signal;
      ctx!.shadowBlur = isHover ? 8 : 0;
      ctx!.shadowColor = ctx!.fillStyle as string;
      ctx!.beginPath();
      ctx!.arc(x + size - 4, y + 4, 2.4, 0, Math.PI * 2);
      ctx!.fill();
      ctx!.shadowBlur = 0;
    }

    // label
    ctx!.globalAlpha = alpha;
    ctx!.font = `${isHover || n.href ? 500 : 400} 10.5px "JetBrains Mono", monospace`;
    ctx!.fillStyle = isHover ? C.fg : n.href ? ac : C.fgDim;
    ctx!.textAlign = "center";
    ctx!.textBaseline = "top";
    ctx!.fillText(n.label, p.x, p.y + size / 2 + 7);
    ctx!.restore();
  }

  let last = 0;
  let raf = 0;
  let running = false;

  function frame(now: number) {
    if (!running) return;
    raf = requestAnimationFrame(frame);
    // throttle ~33fps
    if (now - last < 30) return;
    const dt = Math.min(50, now - last) / 1000;
    last = now;
    draw(now, dt);
  }

  function updatePackets(dt: number, now: number) {
    packets.forEach((store, key) => {
      // advance
      for (let i = store.list.length - 1; i >= 0; i--) {
        store.list[i].t += store.list[i].speed * dt;
        if (store.list[i].t >= 1) store.list.splice(i, 1);
      }
      // spawn
      if (now >= store.next) {
        store.list.push({ t: 0, speed: 0.42 + Math.random() * 0.22 });
        store.next = now + 1200 + Math.random() * 2200;
      }
    });
  }

  function draw(now: number, dt: number) {
    if (mqMobile.matches) return; // canvas hidden on mobile
    ctx!.clearRect(0, 0, W, H);
    drawTierLabels();
    EDGES.forEach(([a, b]) => drawEdge(a, b));
    if (!reduceMotion) updatePackets(dt, now);
    packets.forEach((store, key) => {
      const [a, b] = key.split(">");
      if (reduceMotion) {
        // static frozen packets at three points
        [0.3, 0.62].forEach((t) => drawPacket(a, b, t));
      } else {
        store.list.forEach((p) => drawPacket(a, b, p.t));
      }
    });
    NODES.forEach((n) => drawNode(n, now));
  }

  function requestDraw() {
    if (!running) draw(performance.now(), 0);
  }

  // Hover handling
  function nodeAt(mx: number, my: number): NodeDef | null {
    for (const n of NODES) {
      const p = pos.get(n.id)!;
      const r = CHIP / 2 + 8;
      if (mx >= p.x - r && mx <= p.x + r && my >= p.y - r && my <= p.y + r + 12) return n;
    }
    return null;
  }

  function setHover(n: NodeDef | null) {
    const id = n ? n.id : null;
    if (id === hovered) return;
    hovered = id;
    related = id ? neighbors(id) : null;
    canvas!.style.cursor = n && n.href ? "pointer" : n ? "default" : "default";
    if (n && tip) {
      const p = pos.get(n.id)!;
      tip.innerHTML = `<span class="tip-label">${n.label}</span><span class="tip-sub">${n.sub}</span>${n.href ? '<span class="tip-go">view →</span>' : ""}`;
      // Flip below the node near the top so the tip is never clipped by the wrap.
      const below = p.y < 130;
      tip.classList.toggle("below", below);
      tip.style.left = p.x + "px";
      tip.style.top = (below ? p.y + CHIP / 2 + 12 : p.y - CHIP / 2 - 12) + "px";
      tip.classList.add("show");
      tip.dataset.tone = n.accent;
    } else if (tip) {
      tip.classList.remove("show");
    }
    if (!running) requestDraw();
  }

  canvas.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    setHover(nodeAt(e.clientX - rect.left, e.clientY - rect.top));
  });
  canvas.addEventListener("mouseleave", () => setHover(null));
  canvas.addEventListener("click", (e) => {
    const rect = canvas.getBoundingClientRect();
    const n = nodeAt(e.clientX - rect.left, e.clientY - rect.top);
    if (n && n.href) {
      const target = document.querySelector(n.href);
      if (target) target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
    }
  });

  function startLoop() {
    if (running || reduceMotion || mqMobile.matches) return;
    running = true;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }
  function stopLoop() {
    running = false;
    cancelAnimationFrame(raf);
  }

  // Pause when offscreen / hidden.
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) startLoop();
        else stopLoop();
      });
    },
    { threshold: 0.05 }
  );
  io.observe(wrap);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopLoop();
    else if (isVisible()) startLoop();
  });

  // Cross the mobile breakpoint: go inert below 860px, resume above it.
  mqMobile.addEventListener("change", (e) => {
    if (e.matches) {
      stopLoop();
    } else {
      lastW = 0;
      lastH = 0;
      layout();
      if (isVisible()) startLoop();
      else requestDraw();
    }
  });
  function isVisible() {
    const r = wrap!.getBoundingClientRect();
    return r.bottom > 0 && r.top < window.innerHeight;
  }

  // ResizeObserver keeps the canvas correctly sized through any layout/viewport
  // change (and corrects an initial measurement taken before final layout).
  let lastW = 0, lastH = 0;
  const ro = new ResizeObserver(() => {
    const r = wrap!.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return;
    if (Math.abs(r.width - lastW) < 1 && Math.abs(r.height - lastH) < 1) return;
    lastW = r.width;
    lastH = r.height;
    layout();
    requestDraw();
  });
  ro.observe(wrap);

  layout();
  // Draw once immediately, then animate (after fonts for crisp labels).
  draw(performance.now(), 0);
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      layout();
      requestDraw();
    });
  }
  if (reduceMotion) {
    requestDraw();
  } else if (isVisible()) {
    startLoop();
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", start);
} else {
  start();
}
