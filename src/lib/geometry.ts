// Small SVG path toolkit used by the procedural generator and the photo tracer.
export type Pt = [number, number] | [number, number, number]; // third value = 1 → sharp corner

const f = (n: number) => (Math.round(n * 10) / 10).toString();
const xy = (p: Pt | [number, number]) => `${f(p[0])} ${f(p[1])}`;

export const rad = (deg: number) => (deg * Math.PI) / 180;

export function circle(cx: number, cy: number, r: number): string {
  return ellipse(cx, cy, r, r);
}

export function ellipse(cx: number, cy: number, rx: number, ry: number, rotDeg = 0): string {
  const c = Math.cos(rad(rotDeg));
  const s = Math.sin(rad(rotDeg));
  const p1: [number, number] = [cx - rx * c, cy - rx * s];
  const p2: [number, number] = [cx + rx * c, cy + rx * s];
  return `M${xy(p1)} A${f(rx)} ${f(ry)} ${f(rotDeg)} 1 0 ${xy(p2)} A${f(rx)} ${f(ry)} ${f(rotDeg)} 1 0 ${xy(p1)} Z`;
}

export function line(x1: number, y1: number, x2: number, y2: number): string {
  return `M${f(x1)} ${f(y1)} L${f(x2)} ${f(y2)}`;
}

export function poly(pts: Pt[], closed = false): string {
  if (!pts.length) return '';
  return 'M' + pts.map(xy).join(' L') + (closed ? ' Z' : '');
}

/** Points along an (optionally rotated) ellipse between two angles (degrees, 0 = right, 90 = down). */
export function arcPts(cx: number, cy: number, rx: number, ry: number, a0: number, a1: number, n = 16, rotDeg = 0): [number, number][] {
  const out: [number, number][] = [];
  const c = Math.cos(rad(rotDeg));
  const s = Math.sin(rad(rotDeg));
  for (let i = 0; i <= n; i++) {
    const a = rad(a0 + ((a1 - a0) * i) / n);
    const x = Math.cos(a) * rx;
    const y = Math.sin(a) * ry;
    out.push([cx + x * c - y * s, cy + x * s + y * c]);
  }
  return out;
}

export function arc(cx: number, cy: number, rx: number, ry: number, a0: number, a1: number, rotDeg = 0): string {
  return smooth(arcPts(cx, cy, rx, ry, a0, a1, Math.max(4, Math.ceil(Math.abs(a1 - a0) / 15)), rotDeg));
}

/** Catmull-Rom spline through points, emitted as cubic Béziers. Points flagged with a 3rd value of 1 become sharp corners. */
export function smooth(pts: Pt[], closed = false, tension = 1): string {
  const n = pts.length;
  if (n < 2) return '';
  if (n === 2 && !closed) return poly(pts);
  const get = (i: number): Pt => (closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]);
  const tangent = (i: number): [number, number] => {
    const p = get(i);
    if (p[2] === 1 || (!closed && (i === 0 || i === n - 1))) {
      // Sharp/end points: short tangent toward neighbour keeps the corner crisp.
      return [0, 0];
    }
    const a = get(i - 1);
    const b = get(i + 1);
    return [((b[0] - a[0]) / 6) * tension, ((b[1] - a[1]) / 6) * tension];
  };
  let d = `M${xy(pts[0])}`;
  const segs = closed ? n : n - 1;
  for (let i = 0; i < segs; i++) {
    const p0 = get(i);
    const p1 = get(i + 1);
    const t0 = tangent(i);
    const t1 = tangent(i + 1);
    d += ` C${f(p0[0] + t0[0])} ${f(p0[1] + t0[1])} ${f(p1[0] - t1[0])} ${f(p1[1] - t1[1])} ${xy(p1)}`;
  }
  return closed ? d + ' Z' : d;
}

/** Sample a Catmull-Rom spline into a dense polyline. */
export function sampleSmooth(pts: Pt[], per = 10): [number, number][] {
  const n = pts.length;
  if (n < 2) return pts.map((p) => [p[0], p[1]]);
  const out: [number, number][] = [];
  const get = (i: number) => pts[Math.max(0, Math.min(n - 1, i))];
  for (let i = 0; i < n - 1; i++) {
    const p0 = get(i - 1), p1 = get(i), p2 = get(i + 1), p3 = get(i + 2);
    for (let k = 0; k < per; k++) {
      const t = k / per, t2 = t * t, t3 = t2 * t;
      const c = (a: number, b: number, cc: number, dd: number) =>
        0.5 * (2 * b + (-a + cc) * t + (2 * a - 5 * b + 4 * cc - dd) * t2 + (-a + 3 * b - 3 * cc + dd) * t3);
      out.push([c(p0[0], p1[0], p2[0], p3[0]), c(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  const last = pts[n - 1];
  out.push([last[0], last[1]]);
  return out;
}

/** Closed outline around a smooth centre line – tails, straws, handles, legs. */
export function tube(center: Pt[], w0: number, w1 = w0, roundEnds = true): string {
  const s = sampleSmooth(center, 8);
  const left: [number, number][] = [];
  const right: [number, number][] = [];
  for (let i = 0; i < s.length; i++) {
    const a = s[Math.max(0, i - 1)];
    const b = s[Math.min(s.length - 1, i + 1)];
    let dx = b[0] - a[0], dy = b[1] - a[1];
    const len = Math.hypot(dx, dy) || 1;
    dx /= len; dy /= len;
    const w = (w0 + (w1 - w0) * (i / (s.length - 1))) / 2;
    left.push([s[i][0] - dy * w, s[i][1] + dx * w]);
    right.push([s[i][0] + dy * w, s[i][1] - dx * w]);
  }
  const pts: [number, number][] = [...left];
  if (roundEnds && w1 > 1.5) {
    const e = s[s.length - 1], pe = s[s.length - 2];
    const ang = Math.atan2(e[1] - pe[1], e[0] - pe[0]);
    for (let k = 1; k < 6; k++) {
      const a = ang + Math.PI / 2 - (Math.PI * k) / 6;
      pts.push([e[0] + Math.cos(a) * (w1 / 2), e[1] + Math.sin(a) * (w1 / 2)]);
    }
  }
  pts.push(...right.reverse());
  return 'M' + pts.map(xy).join(' L') + ' Z';
}

export function roundRect(x: number, y: number, w: number, h: number, r: number): string {
  r = Math.min(r, w / 2, h / 2);
  return `M${f(x + r)} ${f(y)} H${f(x + w - r)} Q${f(x + w)} ${f(y)} ${f(x + w)} ${f(y + r)} V${f(y + h - r)} Q${f(x + w)} ${f(y + h)} ${f(x + w - r)} ${f(y + h)} H${f(x + r)} Q${f(x)} ${f(y + h)} ${f(x)} ${f(y + h - r)} V${f(y + r)} Q${f(x)} ${f(y)} ${f(x + r)} ${f(y)} Z`;
}

/** Mirror points around a vertical axis (keeps order reversed so outlines stay continuous). */
export function mirror(pts: Pt[], cx: number): Pt[] {
  return pts.map((p) => (p.length === 3 ? [2 * cx - p[0], p[1], p[2]] : [2 * cx - p[0], p[1]]) as Pt).reverse();
}

export function mirrorPath(fn: (s: 1 | -1) => string): string[] {
  return [fn(-1), fn(1)];
}

interface HatchOpts {
  angle?: number; // degrees of hatch lines
  spacing?: number;
  from?: number; // -1..1 fraction of the perpendicular sweep to start at
  to?: number;
  rot?: number; // ellipse rotation
  shrink?: number; // shorten lines for a hand-drawn look
}

/** Parallel hatch lines clipped to an ellipse. Returns a single multi-segment path. */
export function hatchEllipse(cx: number, cy: number, rx: number, ry: number, o: HatchOpts = {}): string {
  const { angle = 45, spacing = 10, from = -1, to = 1, rot = 0, shrink = 0.88 } = o;
  const a = rad(angle - rot);
  const ux = Math.cos(a), uy = Math.sin(a);
  const nx = -uy, ny = ux;
  const R = Math.max(rx, ry);
  const cr = Math.cos(rad(rot)), sr = Math.sin(rad(rot));
  let d = '';
  for (let t = -R; t <= R; t += spacing) {
    const frac = t / R;
    if (frac < from || frac > to) continue;
    // Line: p = n*t + u*s in ellipse-local coords. Solve (px/rx)^2 + (py/ry)^2 = 1.
    const A = (ux / rx) ** 2 + (uy / ry) ** 2;
    const B = 2 * ((nx * t * ux) / rx ** 2 + (ny * t * uy) / ry ** 2);
    const C = ((nx * t) / rx) ** 2 + ((ny * t) / ry) ** 2 - 1;
    const disc = B * B - 4 * A * C;
    if (disc <= 0) continue;
    const sq = Math.sqrt(disc);
    let s0 = (-B - sq) / (2 * A), s1 = (-B + sq) / (2 * A);
    const mid = (s0 + s1) / 2, half = ((s1 - s0) / 2) * shrink;
    s0 = mid - half; s1 = mid + half;
    if (s1 - s0 < 4) continue;
    const toWorld = (s: number): [number, number] => {
      const lx = nx * t + ux * s, ly = ny * t + uy * s;
      return [cx + lx * cr - ly * sr, cy + lx * sr + ly * cr];
    };
    d += `M${xy(toWorld(s0))} L${xy(toWorld(s1))} `;
  }
  return d.trim();
}

/** Hatch lines clipped to an arbitrary convex polygon. */
export function hatchPoly(poly: [number, number][], o: { angle?: number; spacing?: number; shrink?: number } = {}): string {
  const { angle = 45, spacing = 10, shrink = 0.9 } = o;
  const a = rad(angle);
  const ux = Math.cos(a), uy = Math.sin(a);
  const nx = -uy, ny = ux;
  const proj = poly.map((p) => p[0] * nx + p[1] * ny);
  const tMin = Math.min(...proj), tMax = Math.max(...proj);
  let d = '';
  for (let t = tMin + spacing / 2; t < tMax; t += spacing) {
    const hits: number[] = [];
    for (let i = 0; i < poly.length; i++) {
      const p = poly[i], q = poly[(i + 1) % poly.length];
      const tp = p[0] * nx + p[1] * ny, tq = q[0] * nx + q[1] * ny;
      if ((tp - t) * (tq - t) < 0 || tp === t) {
        const k = (t - tp) / (tq - tp || 1e-9);
        const x = p[0] + (q[0] - p[0]) * k, y = p[1] + (q[1] - p[1]) * k;
        hits.push(x * ux + y * uy);
      }
    }
    if (hits.length < 2) continue;
    hits.sort((m, n) => m - n);
    for (let h = 0; h + 1 < hits.length; h += 2) {
      const mid = (hits[h] + hits[h + 1]) / 2, half = ((hits[h + 1] - hits[h]) / 2) * shrink;
      if (half * 2 < 4) continue;
      const P = (s: number): [number, number] => [nx * t + ux * s, ny * t + uy * s];
      d += `M${xy(P(mid - half))} L${xy(P(mid + half))} `;
    }
  }
  return d.trim();
}

/** Ramer–Douglas–Peucker polyline simplification. */
export function rdp(pts: [number, number][], eps: number): [number, number][] {
  if (pts.length < 3) return pts;
  const keep = new Uint8Array(pts.length);
  keep[0] = keep[pts.length - 1] = 1;
  const stack: [number, number][] = [[0, pts.length - 1]];
  while (stack.length) {
    const [s, e] = stack.pop()!;
    const [x1, y1] = pts[s], [x2, y2] = pts[e];
    const dx = x2 - x1, dy = y2 - y1;
    const len = Math.hypot(dx, dy) || 1;
    let maxD = 0, idx = -1;
    for (let i = s + 1; i < e; i++) {
      const dd = Math.abs(dy * pts[i][0] - dx * pts[i][1] + x2 * y1 - y2 * x1) / len;
      if (dd > maxD) { maxD = dd; idx = i; }
    }
    if (maxD > eps && idx > 0) {
      keep[idx] = 1;
      stack.push([s, idx], [idx, e]);
    }
  }
  return pts.filter((_, i) => keep[i]);
}

export function polyLength(pts: [number, number][]): number {
  let l = 0;
  for (let i = 1; i < pts.length; i++) l += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  return l;
}
