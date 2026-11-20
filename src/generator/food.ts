import { arc, arcPts, circle, ellipse, hatchEllipse, hatchPoly, line, poly, roundRect, smooth, tube, type Pt } from '../lib/geometry';
import { chance, pick, range, type Rng } from '../lib/rng';
import { SB, titleOf, type Category } from './builder';

function kawaii(b: SB, cx: number, cy: number, s = 1, min = 3) {
  b.det(min, arc(cx - 18 * s, cy, 7 * s, 6 * s, 190, 350), arc(cx + 18 * s, cy, 7 * s, 6 * s, 190, 350));
  b.det(min, smooth([[cx - 7 * s, cy + 8 * s], [cx, cy + 13 * s], [cx + 7 * s, cy + 8 * s]]));
  b.add('shading', [hatchEllipse(cx - 30 * s, cy + 9 * s, 8 * s, 4 * s, { angle: 70, spacing: 3 }), hatchEllipse(cx + 30 * s, cy + 9 * s, 8 * s, 4 * s, { angle: 70, spacing: 3 })], { min: 4 });
}

function sprinkles(b: SB, r: Rng, inside: (x: number, y: number) => boolean, box: [number, number, number, number], n: number, min = 4) {
  let placed = 0, tries = 0;
  while (placed < n && tries++ < 400) {
    const x = range(r, box[0], box[2]), y = range(r, box[1], box[3]);
    if (!inside(x, y)) continue;
    const a = range(r, 0, Math.PI);
    b.det(min, line(x - Math.cos(a) * 5, y - Math.sin(a) * 5, x + Math.cos(a) * 5, y + Math.sin(a) * 5));
    placed++;
  }
}

const cupcake = {
  id: 'cupcake',
  name: 'Cupcake',
  build(r: Rng) {
    const topper = pick(r, ['cherry', 'strawberry', 'candle']);
    const face = chance(r, 0.6);
    const b = new SB();
    b.guides(108, 62, 184, 296, { sym: 200, lines: [250] });
    const wrap: Pt[] = [[128, 252], [272, 252], [250, 355], [150, 355]];
    b.shape(poly(wrap, true), ellipse(200, 240, 88, 26), ellipse(200, 205, 68, 26), ellipse(200, 172, 46, 22));

    const frost: Pt[] = [
      [112, 248], [128, 262], [200, 268], [272, 262], [288, 248], [286, 230], [266, 216], [272, 200], [254, 184],
      [244, 166], [226, 152], [200, 148], [174, 152], [156, 166], [146, 184], [128, 200], [134, 216], [114, 230],
    ];
    b.sil(smooth(frost, true));
    b.sil(smooth([[130, 262, 1], [150, 352], [156, 358], [244, 358], [250, 352], [270, 262, 1]] as Pt[]));

    if (topper === 'cherry') {
      b.shape(circle(200, 132, 16));
      b.conn(smooth([[200, 118], [206, 98], [220, 86]]));
      b.sil(circle(200, 132, 16), tube([[200, 118], [206, 98], [220, 86]], 4, 3));
      b.det(4, arc(194, 126, 6, 6, 190, 260));
    } else if (topper === 'strawberry') {
      b.shape(ellipse(200, 128, 18, 22));
      b.sil(smooth([[184, 116], [200, 112], [216, 116], [218, 134], [200, 154, 1], [182, 134]], true));
      b.conn(poly([[186, 114], [194, 102], [200, 112], [206, 102], [214, 114]]));
      for (const [x, y] of [[194, 124], [206, 124], [200, 134], [192, 140], [208, 140]]) b.det(4, circle(x, y, 1.5));
    } else {
      b.shape(roundRect(192, 96, 16, 52, 3));
      b.conn(line(200, 96, 200, 86));
      b.sil(roundRect(192, 96, 16, 54, 3), smooth([[200, 88, 1], [192, 74], [200, 54, 1], [208, 74]], true));
      b.det(3, line(192, 110, 208, 104), line(192, 126, 208, 120), line(192, 142, 208, 136));
    }

    b.det(3, smooth([[134, 216], [170, 228], [200, 230], [230, 228], [266, 216]]), smooth([[146, 184], [175, 194], [200, 196], [225, 194], [254, 184]]));
    for (const t of [0.17, 0.34, 0.5, 0.66, 0.83]) {
      const top = 132 + 140 * t, bot = 152 + 96 * t;
      b.det(3, line(top, 266, bot, 352));
    }
    sprinkles(b, r, (x, y) => ((x - 200) / 80) ** 2 + ((y - 222) / 40) ** 2 < 1, [120, 180, 280, 262], 14);
    if (face) kawaii(b, 200, 300, 1, 3);

    b.shade((s) => hatchPoly([[230, 266], [268, 266], [248, 354], [222, 354]], { angle: -60, spacing: s }));
    b.shade((s) => hatchEllipse(200, 262, 70, 6, { angle: -60, spacing: s * 0.6 }), 8);
    b.shade((s) => hatchEllipse(250, 204, 30, 18, { angle: -60, spacing: s }), 10);

    const tw = { cherry: 'with a Cherry on Top', strawberry: 'with a Strawberry', candle: 'with a Birthday Candle' }[topper];
    return { title: titleOf(face ? 'Smiling' : 'Sweet', 'Cupcake', tw), strokes: b.strokes, frame: b.frame };
  },
};

const iceCream = {
  id: 'icecream',
  name: 'Ice Cream Cone',
  build(r: Rng) {
    const double = chance(r, 0.55);
    const face = chance(r, 0.6);
    const cherry = chance(r, 0.5);
    const b = new SB();
    const topY = double ? 60 : 110;
    b.guides(132, topY - 26, 136, 372 - topY + 26, { sym: 200, lines: [212] });
    const cone: [number, number][] = [[146, 212], [254, 212], [200, 372]];
    b.shape(poly(cone, true), circle(200, 176, 58));
    if (double) b.shape(circle(200, 112, 46));
    b.conn(smooth([[140, 204], [200, 214], [260, 204]]));

    b.sil(poly([[150, 216], [200, 370, 1], [250, 216]] as Pt[]));
    const drips: Pt[] = [
      [140, 198], [148, 222], [160, 214], [168, 238], [180, 216], [200, 226], [216, 214], [228, 244], [240, 214], [252, 224], [260, 198],
    ];
    b.sil(smooth([...drips, ...arcPts(200, 176, 60, 58, -5, -175, 12)], true));
    if (double) b.sil(smooth([[160, 140], [176, 150], [200, 146], [224, 150], [240, 140], ...arcPts(200, 112, 46, 46, -10, -170, 10)], true));
    const topCy = double ? 112 : 176, topR = double ? 46 : 58;
    if (cherry) {
      b.sil(circle(200, topCy - topR - 10, 13), tube([[200, topCy - topR - 22], [206, topCy - topR - 40], [218, topCy - topR - 48]], 4, 3));
      b.det(4, arc(195, topCy - topR - 15, 5, 5, 190, 260));
    }
    b.det(3, hatchPoly([[150, 222], [250, 222], [200, 362]], { angle: 60, spacing: 18, shrink: 1 }));
    b.det(3, hatchPoly([[150, 222], [250, 222], [200, 362]], { angle: 120, spacing: 18, shrink: 1 }));
    if (face) kawaii(b, 200, double ? 180 : 175, 1, 3);
    sprinkles(b, r, (x, y) => ((x - 200) / 44) ** 2 + ((y - topCy + 10) / 32) ** 2 < 1, [150, topCy - 50, 250, topCy + 20], double ? 8 : 10, 4);

    b.shade((s) => hatchEllipse(200, 176, 58, 58, { angle: -60, spacing: s, from: 0.45 }));
    if (double) b.shade((s) => hatchEllipse(200, 112, 46, 46, { angle: -60, spacing: s, from: 0.45 }));
    b.shade((s) => hatchPoly([[214, 226], [248, 226], [204, 352]], { angle: -30, spacing: s * 0.8 }));

    return { title: titleOf(face ? 'Happy' : 'Yummy', double ? 'Double-Scoop' : '', 'Ice Cream', cherry ? 'with a Cherry' : ''), strokes: b.strokes, frame: b.frame };
  },
};

const boba = {
  id: 'boba',
  name: 'Bubble Tea',
  build(r: Rng) {
    const face = chance(r, 0.65);
    const heart = chance(r, 0.4);
    const b = new SB();
    b.guides(124, 34, 152, 336, { sym: 200, lines: [140] });
    const cup: Pt[] = [[140, 142], [260, 142], [244, 364], [156, 364]];
    b.shape(poly(cup, true), ellipse(200, 140, 66, 14));
    const straw: Pt[] = [[214, 120], [232, 40]];
    b.conn(arc(200, 140, 60, 44, 180, 360), tube(straw, 16, 16, false));

    b.sil(smooth([[138, 148, 1], [154, 356], [162, 366], [238, 366], [246, 356], [262, 148, 1]] as Pt[]));
    b.sil(roundRect(130, 132, 140, 16, 8));
    b.sil(smooth([[142, 132], ...arcPts(200, 132, 58, 42, 190, 350, 10), [258, 132]]));
    b.sil(tube(straw, 16, 16, false));

    b.det(3, smooth([[144, 186], [170, 180], [200, 186], [230, 192], [258, 186]]));
    b.det(4, line(218, 104, 233, 101), line(222, 84, 237, 81), line(226, 64, 241, 61));
    const pearls: [number, number][] = [];
    for (let y = 352; y > 296; y -= 15) {
      const t = (y - 142) / (364 - 142);
      const left = 140 + 16 * t + 10, right = 260 - 16 * t - 10;
      for (let x = left + ((y / 15) % 2) * 6; x <= right; x += 15) if (chance(r, 0.85)) pearls.push([x + range(r, -2, 2), y + range(r, -2, 2)]);
    }
    pearls.forEach(([x, y], i) => b.det(i < pearls.length / 2 ? 3 : 4, circle(x, y, 6.5)));
    if (face) kawaii(b, 200, 236, 1.1, 3);
    if (heart) b.det(3, smooth([[200, 282, 1], [184, 270], [186, 258], [200, 262, 1], [214, 258], [216, 270]], true));

    b.shade((s) => hatchPoly([[228, 190], [258, 190], [246, 362], [222, 362]], { angle: -60, spacing: s }));
    b.add('shading', pearls.map(([x, y]) => hatchEllipse(x, y, 6, 6, { angle: 45, spacing: 2.4, shrink: 1 })).join(' '), { min: 5 });
    b.shade((s) => hatchEllipse(200, 148, 62, 4, { angle: -60, spacing: s * 0.5 }), 8);

    return { title: titleOf(face ? 'Smiling' : 'Classic', 'Bubble Tea', heart ? 'with a Heart' : ''), strokes: b.strokes, frame: b.frame };
  },
};

export const food: Category = { id: 'food', name: 'Cute Food', emoji: '🧁', subjects: [cupcake, iceCream, boba] };
