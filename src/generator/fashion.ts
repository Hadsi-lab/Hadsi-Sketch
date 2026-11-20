import { arcPts, circle, ellipse, hatchEllipse, hatchPoly, line, poly, smooth, tube, type Pt } from '../lib/geometry';
import { chance, pick, type Rng } from '../lib/rng';
import { SB, titleOf, type Category } from './builder';

function star(cx: number, cy: number, R: number, r = R * 0.45): Pt[] {
  const pts: Pt[] = [];
  for (let i = 0; i < 10; i++) {
    const a = ((-90 + i * 36) * Math.PI) / 180, rr = i % 2 ? r : R;
    pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, 1]);
  }
  return pts;
}
const heart = (cx: number, cy: number, s: number): Pt[] => [
  [cx, cy + 12 * s, 1], [cx - 14 * s, cy], [cx - 12 * s, cy - 10 * s], [cx, cy - 6 * s, 1], [cx + 12 * s, cy - 10 * s], [cx + 14 * s, cy],
];
const bolt = (cx: number, cy: number, s: number): Pt[] =>
  ([[4, -18], [-10, 2], [0, 2], [-4, 18], [10, -2], [0, -2]] as [number, number][]).map(([x, y]) => [cx + x * s, cy + y * s, 1]);

function logo(b: SB, kind: string, cx: number, cy: number, s: number, min = 3) {
  if (kind === 'star') b.det(min, poly(star(cx, cy, 16 * s), true));
  else if (kind === 'heart') b.det(min, smooth(heart(cx, cy, s * 1.1), true));
  else b.det(min, poly(bolt(cx, cy, s), true));
}

const sneaker = {
  id: 'sneaker',
  name: 'Sneaker',
  build(r: Rng) {
    const high = chance(r, 0.5);
    const mark = pick(r, ['star', 'heart', 'bolt']);
    const b = new SB();
    b.guides(52, high ? 140 : 196, 304, high ? 208 : 152, { sym: 200, lines: [312] });
    b.shape(ellipse(210, 282, 138, 50));
    b.shape(high ? ellipse(112, 230, 46, 78) : ellipse(118, 262, 50, 46));
    b.conn(smooth([[58, 318], [200, 320], [350, 314]]), smooth([[284, 312], [292, 282], [322, 266]]));

    const upper: Pt[] = high
      ? [[70, 314], [62, 256], [62, 196], [70, 156], [86, 144], [118, 146], [140, 152, 1], [148, 128], [170, 120], [186, 132, 1], [188, 150], [200, 182], [222, 212], [256, 238], [298, 256], [332, 272], [346, 292], [346, 310]]
      : [[70, 314], [62, 274], [68, 238], [90, 216], [126, 224, 1], [150, 204], [172, 196], [188, 204, 1], [196, 216], [236, 238], [284, 256], [324, 272], [344, 292], [346, 310]];
    b.sil(smooth(upper));
    b.sil(smooth([[58, 312, 1], [346, 306], [354, 322], [342, 340], [82, 342], [58, 332]], true));
    if (high) b.sil(smooth([[86, 152], [114, 158], [142, 166], [160, 190]]));
    else b.sil(smooth([[92, 222], [118, 232], [146, 230], [164, 222]]));

    b.det(3, smooth([[60, 326], [200, 330], [350, 324]]));
    const e0: [number, number] = high ? [196, 160] : [198, 218];
    const e1: [number, number] = [254, 240];
    const n = high ? 6 : 4;
    const holes: [number, number][] = [];
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      holes.push([e0[0] + (e1[0] - e0[0]) * t, e0[1] + (e1[1] - e0[1]) * t]);
    }
    holes.forEach(([x, y]) => b.det(3, circle(x - 10, y + 10, 3.5)));
    for (let i = 0; i < n - 1; i++) {
      const [x0, y0] = holes[i], [x1, y1] = holes[i + 1];
      b.det(3, line(x0 - 10, y0 + 10, x1 + 4, y1 - 10), line(x1 - 10, y1 + 10, x0 + 4, y0 - 10));
    }
    b.det(3, smooth([[288, 312], [294, 284], [324, 268]]));
    b.det(3, smooth([[84, 312], [80, 270], high ? [80, 168] : [88, 230]]));
    logo(b, mark, high ? 130 : 150, high ? 262 : 280, 1.2);
    if (high) b.det(3, circle(118, 214, 14), circle(118, 214, 9));
    for (let x = 90; x < 340; x += 16) b.det(4, line(x, 332, x + 6, 340));
    b.det(5, smooth([[76, 310], [70, 262], high ? [72, 170] : [78, 234]]), smooth([[296, 306], [302, 282], [330, 270]]));

    b.shade((s) => hatchPoly([[62, 330], [350, 326], [342, 340], [82, 342]], { angle: -60, spacing: s * 0.6 }));
    b.shade((s) => hatchEllipse(120, 280, 40, 26, { angle: -60, spacing: s }));
    b.shade((s) => hatchEllipse(200, 352, 150, 7, { angle: -60, spacing: s * 0.7 }), 9);

    return { title: titleOf(high ? 'High-Top' : 'Low-Top', 'Sneaker with a', mark === 'star' ? 'Star' : mark === 'heart' ? 'Heart' : 'Lightning Bolt', 'Logo'), strokes: b.strokes, frame: b.frame };
  },
};

const cap = {
  id: 'cap',
  name: 'Baseball Cap',
  build(r: Rng) {
    const mark = pick(r, ['star', 'heart', 'bolt']);
    const vents = chance(r, 0.6);
    const b = new SB();
    b.guides(84, 112, 272, 196, { sym: 200, lines: [252] });
    b.shape(ellipse(200, 236, 100, 100), ellipse(262, 272, 92, 30, 8));
    b.conn(smooth([[100, 252], [200, 274], [300, 254]]));

    const crown: Pt[] = [[102, 254], [106, 190], [140, 148], [200, 132], [260, 148], [294, 190], [298, 254]];
    b.sil(smooth(crown));
    b.sil(smooth([[172, 266], [236, 254], [302, 250], [350, 266], [342, 292], [290, 302], [220, 296], [172, 280]], true));
    b.sil(smooth([[102, 254], [160, 272], [200, 276]]));

    b.det(3, ellipse(200, 134, 11, 5));
    b.det(3, smooth([[200, 138], [204, 200], [210, 272]]), smooth([[198, 138], [160, 180], [146, 262]]), smooth([[202, 138], [246, 180], [262, 258]]));
    b.det(3, circle(176, 214, 24));
    logo(b, mark, 176, 214, 0.95, 3);
    b.det(4, smooth([[182, 274], [236, 262], [300, 258], [338, 270]]), smooth([[186, 282], [236, 272], [298, 268], [334, 278]]));
    if (vents) b.det(4, circle(150, 170, 3.5), circle(232, 160, 3.5), circle(276, 196, 3.5));
    b.det(5, smooth([[110, 248], [114, 196], [146, 156], [196, 140]]));

    b.shade((s) => hatchPoly([[222, 148], [260, 150], [292, 192], [296, 252], [262, 256], [250, 190]], { angle: -60, spacing: s }));
    b.shade((s) => hatchPoly([[176, 282], [220, 296], [290, 302], [334, 294], [300, 288], [240, 286], [190, 280]], { angle: -60, spacing: s * 0.5 }), 9);
    b.cross((s) => hatchPoly([[176, 282], [220, 296], [290, 302], [334, 294], [300, 288], [240, 286], [190, 280]], { angle: 30, spacing: s * 0.6 }));

    return { title: titleOf('Baseball Cap with a', mark === 'star' ? 'Star' : mark === 'heart' ? 'Heart' : 'Lightning', 'Badge'), strokes: b.strokes, frame: b.frame };
  },
};

const handbag = {
  id: 'handbag',
  name: 'Handbag',
  build(r: Rng) {
    const charm = pick(r, ['none', 'star', 'heart']);
    const pattern = pick(r, ['plain', 'dots', 'stripes']);
    const b = new SB();
    b.guides(96, 86, 208, 274, { sym: 200, lines: [200] });
    const body: Pt[] = [[120, 196], [280, 196], [302, 352], [98, 352]];
    b.shape(poly(body, true), ellipse(200, 196, 60, 84));
    const handle = arcPts(200, 198, 58, 92, 180, 360, 14);
    b.conn(smooth(handle), smooth([[118, 206], [140, 266], [200, 284], [260, 266], [282, 206]]));

    b.sil(smooth([[124, 196, 1], [276, 196, 1], [298, 340], [290, 354], [110, 354], [102, 340]], true));
    b.sil(tube(handle, 14, 14, false));
    b.sil(smooth([[122, 204, 1], [142, 266], [200, 286], [258, 266], [278, 204, 1]]));

    b.det(3, roundRect(186, 272, 28, 22, 6), circle(200, 283, 5));
    b.det(3, ellipse(142, 196, 10, 6), ellipse(258, 196, 10, 6));
    b.det(4, smooth([[132, 214], [150, 260], [200, 274], [250, 260], [268, 214]]));
    b.det(4, smooth([[108, 342], [292, 342]]));
    if (pattern === 'dots') {
      for (let y = 302; y < 340; y += 18) for (let x = 120 + ((y / 18) % 2) * 10; x < 284; x += 22) b.det(4, circle(x, y, 4));
    } else if (pattern === 'stripes') {
      for (const y of [304, 318, 332]) b.det(4, line(108, y, 292, y));
    }
    if (charm !== 'none') {
      b.conn(line(258, 202, 268, 232));
      if (charm === 'star') b.sil(poly(star(270, 246, 14), true));
      else b.sil(smooth(heart(270, 246, 0.9), true));
    }

    b.shade((s) => hatchPoly([[248, 286], [270, 220], [282, 206], [298, 344], [250, 350]], { angle: -60, spacing: s }));
    b.shade((s) => hatchEllipse(200, 364, 110, 6, { angle: -60, spacing: s * 0.6 }), 9);
    b.cross((s) => hatchPoly([[262, 300], [294, 300], [298, 344], [262, 348]], { angle: 30, spacing: s }));

    return { title: titleOf(pattern === 'dots' ? 'Polka-Dot' : pattern === 'stripes' ? 'Striped' : 'Classic', 'Handbag', charm !== 'none' ? `with a ${charm === 'star' ? 'Star' : 'Heart'} Charm` : ''), strokes: b.strokes, frame: b.frame };
  },
};

function roundRect(x: number, y: number, w: number, h: number, rr: number) {
  return smooth([[x + rr, y], [x + w - rr, y], [x + w, y + rr], [x + w, y + h - rr], [x + w - rr, y + h], [x + rr, y + h], [x, y + h - rr], [x, y + rr]], true);
}

export const fashion: Category = { id: 'fashion', name: 'Sneakers & Fashion', emoji: '👟', subjects: [sneaker, cap, handbag] };
