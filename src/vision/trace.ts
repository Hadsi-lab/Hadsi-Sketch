// Turns a photo into layered construction strokes, entirely in the browser.
// Pipeline: resize → auto-contrast → background estimate & cleanup → mask →
// (per fidelity level) k-means ellipse fitting, silhouette tracing,
// edge detection + chain tracing, tone-based hatching.
import { ellipse, line, poly, polyLength, rdp, roundRect, smooth, type Pt } from '../lib/geometry';
import { mulberry32 } from '../lib/rng';
import type { SketchSource, Stroke } from '../lib/types';

export interface Analysis {
  w: number;
  h: number;
  gray: Float32Array; // 0..1 contrast-stretched luminance
  mask: Uint8Array; // 1 = subject
  maskValid: boolean;
  cleaned: string; // data URL of cleaned-up reference
  original: string;
}

export interface AnalyzeOptions { removeBackground: boolean; boostContrast: boolean }

const MAX_SIDE = 360;

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = () => rej(new Error('Could not read that image.'));
    img.src = src;
  });
}

export function analyze(img: CanvasImageSource & { width: number; height: number }, opts: AnalyzeOptions): Analysis {
  const iw = (img as HTMLImageElement).naturalWidth || img.width;
  const ih = (img as HTMLImageElement).naturalHeight || img.height;
  const scale = Math.min(1, MAX_SIDE / Math.max(iw, ih));
  const w = Math.max(16, Math.round(iw * scale));
  const h = Math.max(16, Math.round(ih * scale));
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  const ctx = cv.getContext('2d', { willReadFrequently: true })!;
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);
  const original = cv.toDataURL('image/jpeg', 0.85);
  const id = ctx.getImageData(0, 0, w, h);
  const px = id.data;
  const N = w * h;

  // Luminance + auto contrast (2nd–98th percentile stretch).
  const lum = new Float32Array(N);
  for (let i = 0; i < N; i++) lum[i] = (0.299 * px[i * 4] + 0.587 * px[i * 4 + 1] + 0.114 * px[i * 4 + 2]) / 255;
  let lo = 0, hi = 1;
  if (opts.boostContrast) {
    const sorted = Float32Array.from(lum).sort();
    lo = sorted[Math.floor(N * 0.02)];
    hi = sorted[Math.floor(N * 0.98)];
    if (hi - lo < 0.05) { lo = 0; hi = 1; }
  }
  const gray = new Float32Array(N);
  for (let i = 0; i < N; i++) gray[i] = Math.min(1, Math.max(0, (lum[i] - lo) / (hi - lo)));

  // Background colour = median of the border ring.
  const ring: number[][] = [[], [], []];
  const b = Math.max(2, Math.round(Math.min(w, h) * 0.03));
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (x >= b && x < w - b && y >= b && y < h - b) continue;
    const i = (y * w + x) * 4;
    ring[0].push(px[i]); ring[1].push(px[i + 1]); ring[2].push(px[i + 2]);
  }
  const med = ring.map((c) => c.sort((a, z) => a - z)[c.length >> 1]);
  const dist = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    dist[i] = Math.hypot(px[i * 4] - med[0], px[i * 4 + 1] - med[1], px[i * 4 + 2] - med[2]) / 441;
  }
  const blurred = blur(dist, w, h, 1.5);
  const t = otsu(blurred);
  let mask: Uint8Array = new Uint8Array(N);
  for (let i = 0; i < N; i++) mask[i] = blurred[i] > Math.max(t, 0.06) ? 1 : 0;
  mask = morph(mask, w, h, 2, true);
  mask = morph(mask, w, h, 2, false);
  mask = largestComponents(mask, w, h);
  mask = fillHoles(mask, w, h);
  let area = 0;
  for (let i = 0; i < N; i++) area += mask[i];
  const frac = area / N;
  const maskValid = opts.removeBackground && frac > 0.03 && frac < 0.9;
  if (!maskValid) mask.fill(1);

  // Cleaned reference: subject on white, contrast boosted, soft edge.
  const soft = blur(Float32Array.from(mask), w, h, 1.2);
  const out = ctx.createImageData(w, h);
  for (let i = 0; i < N; i++) {
    const k = maskValid ? soft[i] : 1;
    for (let c = 0; c < 3; c++) {
      let v = px[i * 4 + c] / 255;
      if (opts.boostContrast) v = Math.min(1, Math.max(0, (v - lo) / (hi - lo)));
      out.data[i * 4 + c] = Math.round((v * k + (1 - k)) * 255);
    }
    out.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(out, 0, 0);
  const cleaned = cv.toDataURL('image/jpeg', 0.9);
  return { w, h, gray, mask, maskValid, cleaned, original };
}

interface LevelParams { blur: number; edgePct: number; minLen: number; eps: number; maxChains: number; k: number; silEps: number; shade: number; cross: number; spacing: number }

const PARAMS: LevelParams[] = [
  { blur: 3.2, edgePct: 0.05, minLen: 60, eps: 6, maxChains: 0, k: 3, silEps: 9, shade: 0, cross: 0, spacing: 0 },
  { blur: 2.6, edgePct: 0.06, minLen: 40, eps: 4, maxChains: 6, k: 4, silEps: 5, shade: 0, cross: 0, spacing: 0 },
  { blur: 2.0, edgePct: 0.09, minLen: 24, eps: 2.6, maxChains: 24, k: 5, silEps: 3, shade: 0, cross: 0, spacing: 0 },
  { blur: 1.6, edgePct: 0.1, minLen: 18, eps: 1.8, maxChains: 40, k: 6, silEps: 2, shade: 0.25, cross: 0, spacing: 7 },
  { blur: 1.3, edgePct: 0.13, minLen: 14, eps: 1.3, maxChains: 80, k: 6, silEps: 1.3, shade: 0.35, cross: 0.12, spacing: 5 },
];

export function strokesFromAnalysis(a: Analysis, level: number): Stroke[] {
  const p = PARAMS[Math.max(1, Math.min(5, level)) - 1];
  const { w, h, mask } = a;
  const strokes: Stroke[] = [];
  const bb = maskBounds(mask, w, h);

  // 1. Guides
  strokes.push({ d: roundRect(bb.x0, bb.y0, bb.x1 - bb.x0, bb.y1 - bb.y0, 4), layer: 'guide' });
  const cx = (bb.x0 + bb.x1) / 2, cy = (bb.y0 + bb.y1) / 2;
  strokes.push({ d: line(cx, bb.y0 - 10, cx, bb.y1 + 10), layer: 'guide' });
  strokes.push({ d: line(bb.x0 - 10, cy, bb.x1 + 10, cy), layer: 'guide' });

  // 2. Basic shapes via k-means ellipses on mask pixels
  const ells = fitEllipses(mask, w, h, p.k);
  for (const e of ells) strokes.push({ d: ellipse(e.cx, e.cy, e.rx, e.ry, e.rot), layer: 'shape' });

  // 3. Connectors: tangent lines joining neighbouring ellipses (minimum spanning tree)
  for (const [i, j] of mst(ells.map((e) => [e.cx, e.cy] as [number, number]))) {
    const A = ells[i], B = ells[j];
    const ang = Math.atan2(B.cy - A.cy, B.cx - A.cx);
    const nx = -Math.sin(ang), ny = Math.cos(ang);
    const ra = radiusAt(A, ang + Math.PI / 2), rb = radiusAt(B, ang + Math.PI / 2);
    for (const s of [1, -1]) {
      strokes.push({ d: line(A.cx + nx * ra * s, A.cy + ny * ra * s, B.cx + nx * rb * s, B.cy + ny * rb * s), layer: 'connector', minLevel: 2 });
    }
  }

  // 4. Silhouette
  const g = blur(a.gray, w, h, p.blur);
  if (a.maskValid) {
    const contour = traceContour(mask, w, h);
    if (contour.length > 10) {
      let s = rdp(contour, p.silEps);
      if (s.length > 3 && level > 1) {
        strokes.push({ d: smooth(s as Pt[], true), layer: 'silhouette', minLevel: 1 });
      } else {
        s = s.length > 3 ? s : contour;
        strokes.push({ d: poly(s, true), layer: 'silhouette', minLevel: 1 });
      }
    }
  }

  // 5. Interior details from edge chains
  const edges = canny(g, w, h, mask, p.edgePct, a.maskValid);
  const chains = traceChains(edges, w, h)
    .map((c) => ({ c, len: polyLength(c) }))
    .filter((c) => c.len >= p.minLen)
    .sort((x, y) => y.len - x.len);
  let budget = p.maxChains;
  if (!a.maskValid) {
    // No clean silhouette: promote the longest edges to the outline layer.
    for (const ch of chains.splice(0, Math.min(3, chains.length))) {
      strokes.push({ d: chainPath(ch.c, Math.max(p.eps, 2.5), level), layer: 'silhouette', minLevel: 1 });
    }
    if (level === 1) budget = 0;
  }
  for (const ch of chains.slice(0, budget)) strokes.push({ d: chainPath(ch.c, p.eps, level), layer: 'detail', minLevel: 1 });

  // 6. Shading hatch from tone
  if (p.shade > 0) {
    const tone = blur(a.gray, w, h, 2.2);
    const inside: number[] = [];
    for (let i = 0; i < w * h; i++) if (mask[i]) inside.push(tone[i]);
    inside.sort((x, y) => x - y);
    const t1 = inside[Math.floor(inside.length * p.shade)] ?? 0;
    const d1 = hatchRegion(tone, mask, w, h, t1, -60, p.spacing);
    if (d1) strokes.push({ d: d1, layer: 'shading', minLevel: 1 });
    if (p.cross > 0) {
      const t2 = inside[Math.floor(inside.length * p.cross)] ?? 0;
      const d2 = hatchRegion(tone, mask, w, h, t2, 30, p.spacing * 0.9);
      if (d2) strokes.push({ d: d2, layer: 'shading', minLevel: 1 });
    }
  }
  return strokes;
}

export function photoSource(a: Analysis, title: string, kind: 'photo' | 'import' | 'ai'): SketchSource {
  const cache = new Map<number, Stroke[]>();
  return {
    id: `${kind}-${Date.now()}`,
    title,
    kind,
    width: a.w,
    height: a.h,
    reference: a.cleaned,
    frame: (() => { const b = maskBounds(a.mask, a.w, a.h); return [b.x0, b.y0, b.x1 - b.x0, b.y1 - b.y0] as [number, number, number, number]; })(),
    strokesFor(level) {
      if (!cache.has(level)) cache.set(level, strokesFromAnalysis(a, level));
      return cache.get(level)!;
    },
  };
}

// ───────────────────────── helpers ─────────────────────────

function chainPath(c: [number, number][], eps: number, level: number): string {
  const s = rdp(c, eps);
  return level <= 1 ? poly(s) : smooth(s as Pt[]);
}

export function blur(src: Float32Array, w: number, h: number, sigma: number): Float32Array {
  if (sigma <= 0.3) return Float32Array.from(src);
  const r = Math.ceil(sigma * 2.5);
  const k = new Float32Array(r * 2 + 1);
  let sum = 0;
  for (let i = -r; i <= r; i++) sum += k[i + r] = Math.exp(-(i * i) / (2 * sigma * sigma));
  for (let i = 0; i < k.length; i++) k[i] /= sum;
  const tmp = new Float32Array(w * h), out = new Float32Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let v = 0;
    for (let i = -r; i <= r; i++) v += src[y * w + Math.min(w - 1, Math.max(0, x + i))] * k[i + r];
    tmp[y * w + x] = v;
  }
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let v = 0;
    for (let i = -r; i <= r; i++) v += tmp[Math.min(h - 1, Math.max(0, y + i)) * w + x] * k[i + r];
    out[y * w + x] = v;
  }
  return out;
}

function otsu(v: Float32Array): number {
  const bins = 64, hist = new Float64Array(bins);
  for (const x of v) hist[Math.min(bins - 1, Math.floor(x * bins))]++;
  const total = v.length;
  let sum = 0;
  for (let i = 0; i < bins; i++) sum += i * hist[i];
  let sumB = 0, wB = 0, best = 0, thr = 0;
  for (let i = 0; i < bins; i++) {
    wB += hist[i];
    if (!wB) continue;
    const wF = total - wB;
    if (!wF) break;
    sumB += i * hist[i];
    const mB = sumB / wB, mF = (sum - sumB) / wF;
    const between = wB * wF * (mB - mF) ** 2;
    if (between > best) { best = between; thr = i; }
  }
  return (thr + 0.5) / bins;
}

function morph(m: Uint8Array, w: number, h: number, r: number, dilate: boolean): Uint8Array {
  const out = new Uint8Array(m.length);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let v = dilate ? 0 : 1;
    for (let dy = -r; dy <= r && (dilate ? !v : v); dy++) for (let dx = -r; dx <= r; dx++) {
      const yy = y + dy, xx = x + dx;
      const s = yy < 0 || yy >= h || xx < 0 || xx >= w ? 0 : m[yy * w + xx];
      if (dilate && s) { v = 1; break; }
      if (!dilate && !s) { v = 0; break; }
    }
    out[y * w + x] = v;
  }
  return out;
}

function largestComponents(m: Uint8Array, w: number, h: number): Uint8Array {
  const label = new Int32Array(m.length);
  const sizes: number[] = [0];
  const stack: number[] = [];
  for (let i = 0; i < m.length; i++) {
    if (!m[i] || label[i]) continue;
    const id = sizes.length;
    let n = 0;
    stack.push(i);
    label[i] = id;
    while (stack.length) {
      const p = stack.pop()!;
      n++;
      const x = p % w, y = (p / w) | 0;
      for (const q of [x > 0 ? p - 1 : -1, x < w - 1 ? p + 1 : -1, y > 0 ? p - w : -1, y < h - 1 ? p + w : -1]) {
        if (q >= 0 && m[q] && !label[q]) { label[q] = id; stack.push(q); }
      }
    }
    sizes.push(n);
  }
  const max = Math.max(...sizes);
  const out = new Uint8Array(m.length);
  for (let i = 0; i < m.length; i++) if (label[i] && sizes[label[i]] >= max * 0.25) out[i] = 1;
  return out;
}

function fillHoles(m: Uint8Array, w: number, h: number): Uint8Array {
  const outside = new Uint8Array(m.length);
  const stack: number[] = [];
  const push = (p: number) => { if (!m[p] && !outside[p]) { outside[p] = 1; stack.push(p); } };
  for (let x = 0; x < w; x++) { push(x); push((h - 1) * w + x); }
  for (let y = 0; y < h; y++) { push(y * w); push(y * w + w - 1); }
  while (stack.length) {
    const p = stack.pop()!;
    const x = p % w, y = (p / w) | 0;
    if (x > 0) push(p - 1);
    if (x < w - 1) push(p + 1);
    if (y > 0) push(p - w);
    if (y < h - 1) push(p + w);
  }
  const out = new Uint8Array(m.length);
  for (let i = 0; i < m.length; i++) out[i] = outside[i] ? 0 : 1;
  return out;
}

function maskBounds(m: Uint8Array, w: number, h: number) {
  let x0 = w, y0 = h, x1 = 0, y1 = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (m[y * w + x]) {
    if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
  }
  if (x1 <= x0) return { x0: 0, y0: 0, x1: w, y1: h };
  return { x0, y0, x1, y1 };
}

interface Ell { cx: number; cy: number; rx: number; ry: number; rot: number; n: number }

function fitEllipses(m: Uint8Array, w: number, h: number, k: number): Ell[] {
  const pts: [number, number][] = [];
  const step = Math.max(1, Math.round(Math.sqrt((w * h) / 6000)));
  for (let y = 0; y < h; y += step) for (let x = 0; x < w; x += step) if (m[y * w + x]) pts.push([x, y]);
  if (pts.length < k * 4) return [];
  const r = mulberry32(42);
  // k-means++ init
  const cents: [number, number][] = [pts[Math.floor(r() * pts.length)]];
  while (cents.length < k) {
    const d = pts.map((p) => Math.min(...cents.map((c) => (p[0] - c[0]) ** 2 + (p[1] - c[1]) ** 2)));
    const tot = d.reduce((a, b) => a + b, 0);
    let pick = r() * tot, idx = 0;
    while (pick > d[idx] && idx < d.length - 1) pick -= d[idx++];
    cents.push(pts[idx]);
  }
  const asg = new Int32Array(pts.length);
  for (let it = 0; it < 12; it++) {
    pts.forEach((p, i) => {
      let best = 0, bd = Infinity;
      cents.forEach((c, j) => { const dd = (p[0] - c[0]) ** 2 + (p[1] - c[1]) ** 2; if (dd < bd) { bd = dd; best = j; } });
      asg[i] = best;
    });
    const acc = cents.map(() => [0, 0, 0]);
    pts.forEach((p, i) => { acc[asg[i]][0] += p[0]; acc[asg[i]][1] += p[1]; acc[asg[i]][2]++; });
    acc.forEach((a, j) => { if (a[2]) cents[j] = [a[0] / a[2], a[1] / a[2]]; });
  }
  const ells: Ell[] = [];
  for (let j = 0; j < k; j++) {
    let n = 0, sx = 0, sy = 0;
    pts.forEach((p, i) => { if (asg[i] === j) { n++; sx += p[0]; sy += p[1]; } });
    if (n < pts.length * 0.03) continue;
    const mx = sx / n, my = sy / n;
    let cxx = 0, cyy = 0, cxy = 0;
    pts.forEach((p, i) => { if (asg[i] === j) { const dx = p[0] - mx, dy = p[1] - my; cxx += dx * dx; cyy += dy * dy; cxy += dx * dy; } });
    cxx /= n; cyy /= n; cxy /= n;
    const tr = cxx + cyy, det = cxx * cyy - cxy * cxy;
    const disc = Math.sqrt(Math.max(0, (tr * tr) / 4 - det));
    const l1 = tr / 2 + disc, l2 = Math.max(1, tr / 2 - disc);
    const rot = (Math.atan2(l1 - cxx, cxy || 1e-9) * 180) / Math.PI;
    ells.push({ cx: mx, cy: my, rx: 2 * Math.sqrt(l1), ry: 2 * Math.sqrt(l2), rot: Math.abs(cxy) < 1e-6 ? (cxx >= cyy ? 0 : 90) : rot, n });
  }
  return ells.sort((a, b) => b.rx * b.ry - a.rx * a.ry);
}

function radiusAt(e: Ell, ang: number): number {
  const t = ang - (e.rot * Math.PI) / 180;
  return 1 / Math.sqrt((Math.cos(t) / e.rx) ** 2 + (Math.sin(t) / e.ry) ** 2);
}

function mst(pts: [number, number][]): [number, number][] {
  if (pts.length < 2) return [];
  const inTree = [0];
  const edges: [number, number][] = [];
  while (inTree.length < pts.length) {
    let best: [number, number] = [0, 0], bd = Infinity;
    for (const i of inTree) for (let j = 0; j < pts.length; j++) {
      if (inTree.includes(j)) continue;
      const d = (pts[i][0] - pts[j][0]) ** 2 + (pts[i][1] - pts[j][1]) ** 2;
      if (d < bd) { bd = d; best = [i, j]; }
    }
    edges.push(best);
    inTree.push(best[1]);
  }
  return edges;
}

/** Moore-neighbour boundary tracing of the outer contour. */
function traceContour(m: Uint8Array, w: number, h: number): [number, number][] {
  const at = (x: number, y: number) => (x >= 0 && y >= 0 && x < w && y < h ? m[y * w + x] : 0);
  let start = -1;
  for (let i = 0; i < m.length; i++) if (m[i]) { start = i; break; }
  if (start < 0) return [];
  const dirs = [[-1, 0], [-1, -1], [0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1]];
  const sx = start % w, sy = (start / w) | 0;
  let x = sx, y = sy, back = 0; // came from west
  const out: [number, number][] = [[x, y]];
  for (let guard = 0; guard < w * h * 2; guard++) {
    let found = false;
    for (let k = 1; k <= 8; k++) {
      const d = (back + k) % 8;
      const nx = x + dirs[d][0], ny = y + dirs[d][1];
      if (at(nx, ny)) {
        back = (d + 4) % 8; // radial sweep: resume just after the pixel we came from
        x = nx; y = ny;
        found = true;
        break;
      }
    }
    if (!found) break;
    if (x === sx && y === sy) break;
    out.push([x, y]);
  }
  return out;
}

function canny(g: Float32Array, w: number, h: number, mask: Uint8Array, pct: number, maskValid: boolean): Uint8Array {
  const N = w * h;
  const mag = new Float32Array(N), dir = new Uint8Array(N);
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    const i = y * w + x;
    const gx = -g[i - w - 1] - 2 * g[i - 1] - g[i + w - 1] + g[i - w + 1] + 2 * g[i + 1] + g[i + w + 1];
    const gy = -g[i - w - 1] - 2 * g[i - w] - g[i - w + 1] + g[i + w - 1] + 2 * g[i + w] + g[i + w + 1];
    mag[i] = Math.hypot(gx, gy);
    const a = ((Math.atan2(gy, gx) * 180) / Math.PI + 180) % 180;
    dir[i] = a < 22.5 || a >= 157.5 ? 0 : a < 67.5 ? 1 : a < 112.5 ? 2 : 3;
  }
  // Interior region: shrink mask so silhouette edges aren't duplicated as details.
  const inner = maskValid ? morph(mask, w, h, 5, false) : mask;
  const nms = new Float32Array(N);
  const vals: number[] = [];
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    const i = y * w + x;
    if (!inner[i]) continue;
    const m = mag[i];
    let a = 0, b = 0;
    switch (dir[i]) {
      case 0: a = mag[i - 1]; b = mag[i + 1]; break;
      case 1: a = mag[i - w - 1]; b = mag[i + w + 1]; break;
      case 2: a = mag[i - w]; b = mag[i + w]; break;
      default: a = mag[i - w + 1]; b = mag[i + w - 1];
    }
    if (m >= a && m >= b && m > 0.02) { nms[i] = m; vals.push(m); }
  }
  if (!vals.length) return new Uint8Array(N);
  vals.sort((p, q) => q - p);
  let innerCount = 0;
  for (let i = 0; i < N; i++) innerCount += inner[i];
  const high = vals[Math.min(vals.length - 1, Math.floor(innerCount * pct * 0.25))];
  const low = high * 0.45;
  const out = new Uint8Array(N);
  const stack: number[] = [];
  for (let i = 0; i < N; i++) if (nms[i] >= high) { out[i] = 1; stack.push(i); }
  while (stack.length) {
    const p = stack.pop()!;
    const x = p % w, y = (p / w) | 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const xx = x + dx, yy = y + dy;
      if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue;
      const q = yy * w + xx;
      if (!out[q] && nms[q] >= low) { out[q] = 1; stack.push(q); }
    }
  }
  return out;
}

function traceChains(e: Uint8Array, w: number, h: number): [number, number][][] {
  const seen = new Uint8Array(e.length);
  const nb = (p: number) => {
    const x = p % w, y = (p / w) | 0, out: number[] = [];
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dy) continue;
      const xx = x + dx, yy = y + dy;
      if (xx >= 0 && yy >= 0 && xx < w && yy < h && e[yy * w + xx]) out.push(yy * w + xx);
    }
    return out;
  };
  const chains: [number, number][][] = [];
  const walk = (s: number) => {
    const c: [number, number][] = [];
    let p = s;
    while (p >= 0) {
      seen[p] = 1;
      c.push([p % w, (p / w) | 0]);
      const next = nb(p).filter((q) => !seen[q]);
      // prefer 4-connected neighbours for smoother chains
      next.sort((a, b) => (Math.abs(a - p) === 1 || Math.abs(a - p) === w ? 0 : 1) - (Math.abs(b - p) === 1 || Math.abs(b - p) === w ? 0 : 1));
      p = next.length ? next[0] : -1;
    }
    if (c.length > 2) chains.push(c);
  };
  for (let i = 0; i < e.length; i++) if (e[i] && !seen[i] && nb(i).length === 1) walk(i);
  for (let i = 0; i < e.length; i++) if (e[i] && !seen[i]) walk(i);
  return chains;
}

function hatchRegion(tone: Float32Array, mask: Uint8Array, w: number, h: number, thr: number, angle: number, spacing: number): string {
  const a = (angle * Math.PI) / 180;
  const ux = Math.cos(a), uy = Math.sin(a);
  const nx = -uy, ny = ux;
  const corners = [[0, 0], [w, 0], [0, h], [w, h]].map(([x, y]) => x * nx + y * ny);
  const tMin = Math.min(...corners), tMax = Math.max(...corners);
  const sCorners = [[0, 0], [w, 0], [0, h], [w, h]].map(([x, y]) => x * ux + y * uy);
  const sMin = Math.min(...sCorners), sMax = Math.max(...sCorners);
  let d = '';
  const f = (n: number) => Math.round(n * 10) / 10;
  for (let t = tMin; t < tMax; t += spacing) {
    let runStart: number | null = null;
    for (let s = sMin; s <= sMax + 1; s += 1) {
      const x = Math.round(nx * t + ux * s), y = Math.round(ny * t + uy * s);
      const ok = x >= 0 && y >= 0 && x < w && y < h && mask[y * w + x] && tone[y * w + x] <= thr;
      if (ok && runStart === null) runStart = s;
      if (!ok && runStart !== null) {
        if (s - runStart > 5) {
          const s0 = runStart + 1, s1 = s - 2;
          d += `M${f(nx * t + ux * s0)} ${f(ny * t + uy * s0)} L${f(nx * t + ux * s1)} ${f(ny * t + uy * s1)} `;
        }
        runStart = null;
      }
    }
  }
  return d.trim();
}
