import { arc, arcPts, circle, ellipse, hatchEllipse, hatchPoly, line, poly, roundRect, smooth, tube, type Pt } from '../lib/geometry';
import { chance, pick } from '../lib/rng';
import { SB, titleOf, type Category } from './builder';

const lerp = (a: [number, number], b: [number, number], t: number): [number, number] => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

const dragon = {
  id: 'dragon',
  name: 'Baby Dragon',
  build(r: () => number) {
    const fire = chance(r, 0.45);
    const crown = chance(r, 0.35);
    const sleepy = !fire && chance(r, 0.35);
    const b = new SB();
    b.guides(72, 48, 300, 318, { sym: 200, lines: [140, 352] });
    b.shape(circle(205, 140, 58), ellipse(258, 160, 34, 26), ellipse(195, 282, 62, 70));
    b.conn(poly([[168, 100], [150, 52], [190, 88]], true), poly([[214, 86], [222, 44], [238, 92]], true));
    b.conn(poly([[150, 238], [92, 160], [122, 262]], true));
    const tail: Pt[] = [[152, 318], [108, 344], [80, 318], [90, 290]];
    b.conn(smooth(tail), ellipse(170, 340, 22, 20), ellipse(224, 340, 22, 20), ellipse(246, 258, 11, 24, -35));

    b.sil(smooth([
      [160, 172], [148, 140], [158, 104], [190, 84], [226, 88], [250, 116], [278, 134], [294, 156],
      [286, 180], [256, 188], [228, 190], [202, 198], [176, 192],
    ], true));
    b.sil(smooth([[170, 210], [142, 248], [134, 290], [150, 334], [200, 352], [244, 338], [258, 296], [250, 250], [228, 208]]));
    b.sil(smooth([[150, 232], [122, 196], [92, 156, 1], [98, 196], [82, 208, 1], [104, 226], [92, 246, 1], [124, 258], [148, 262]], true));
    b.sil(tube(tail, 28, 8, false));
    b.sil(smooth([[90, 290, 1], [72, 280, 1], [82, 300], [96, 304, 1], [92, 286, 1]], true));
    b.sil(smooth([[166, 102, 1], [150, 72], [152, 50, 1], [176, 78], [190, 90, 1]], true), smooth([[212, 88, 1], [218, 60], [224, 42, 1], [236, 70], [238, 94, 1]], true));
    b.sil(smooth([[150, 330], [148, 352], [172, 360], [192, 352], [190, 332]]), smooth([[204, 336], [204, 356], [226, 362], [246, 354], [242, 330]]));
    b.sil(smooth([[236, 238], [234, 260], [244, 280], [258, 278], [256, 256], [248, 236]]));

    if (sleepy) b.det(3, arc(224, 130, 13, 8, 10, 170));
    else {
      b.det(3, circle(222, 130, 13), circle(225, 132, 7));
      b.det(4, circle(228, 127, 3));
    }
    b.det(3, ellipse(280, 148, 3, 4));
    if (fire) b.det(3, smooth([[254, 174], [270, 184], [288, 172]]));
    else b.det(3, smooth([[254, 176], [268, 182], [282, 174]]));
    b.det(3, ellipse(204, 286, 36, 48));
    for (const y of [256, 274, 292, 310]) {
      const half = Math.sqrt(Math.max(0, 1 - ((y - 286) / 48) ** 2)) * 34;
      b.det(4, smooth([[204 - half, y], [204, y + 5], [204 + half, y]]));
    }
    for (const [x, y] of [[164, 96], [150, 118], [142, 146], [140, 176]] as [number, number][]) {
      b.det(3, poly([[x + 4, y - 8], [x - 12, y - 2], [x + 2, y + 8]]));
    }
    b.det(3, line(150, 240, 92, 156), line(150, 248, 82, 208), line(150, 256, 92, 246));
    b.det(4, line(160, 352, 160, 360), line(172, 354, 172, 362), line(216, 356, 216, 362), line(228, 356, 228, 363));

    if (fire) {
      b.sil(smooth([[292, 168, 1], [318, 150], [336, 160], [352, 140, 1], [350, 172], [368, 170, 1], [346, 194], [314, 190]], true));
      b.det(3, smooth([[300, 172], [322, 166], [334, 176], [324, 184], [306, 180]]));
    }
    if (crown) {
      b.sil(poly([[184, 86], [182, 62, 1], [194, 74], [202, 58, 1], [210, 72], [222, 60, 1], [218, 84]] as Pt[], true));
      b.det(4, circle(202, 76, 3));
    }

    b.shade((s) => hatchEllipse(195, 282, 62, 70, { angle: -60, spacing: s, from: 0.45 }));
    b.shade((s) => hatchPoly([[148, 236], [96, 168], [102, 200], [86, 210], [106, 226], [96, 244], [146, 258]], { angle: -60, spacing: s }), 9);
    b.shade((s) => hatchEllipse(210, 202, 34, 8, { angle: -60, spacing: s * 0.6 }), 8);
    b.cross((s) => hatchPoly([[148, 236], [96, 168], [102, 200], [86, 210], [106, 226], [96, 244], [146, 258]], { angle: 30, spacing: s }));

    return { title: titleOf(sleepy ? 'Sleepy' : 'Little', 'Dragon', fire ? 'Breathing Fire' : '', crown ? 'with a Crown' : ''), strokes: b.strokes, frame: b.frame };
  },
};

const unicorn = {
  id: 'unicorn',
  name: 'Unicorn',
  build(r: () => number) {
    const eyesOpen = chance(r, 0.5);
    const flowers = chance(r, 0.5);
    const star = chance(r, 0.5);
    const b = new SB();
    b.guides(96, 36, 214, 332, { sym: 200, lines: [168] });
    b.shape(circle(200, 168, 62), circle(258, 228, 38));
    b.conn(poly([[202, 114], [232, 40], [226, 120]], true), poly([[166, 120], [158, 74], [190, 108]], true));
    b.conn(smooth([[155, 212], [142, 290], [138, 364]]), smooth([[232, 258], [252, 310], [270, 364]]), smooth([[246, 140], [270, 180], [292, 214]]));

    b.sil(smooth([
      [150, 200], [140, 165], [150, 130], [166, 118], [158, 72, 1], [192, 106], [216, 110],
      [248, 138], [272, 176], [294, 208], [296, 240], [278, 262], [252, 266], [232, 258],
    ]));
    b.sil(smooth([[150, 200], [143, 290], [138, 364]]), smooth([[232, 258], [252, 310], [272, 364]]));
    const hb: [number, number] = [204, 112], hr: [number, number] = [228, 120], tip: [number, number] = [230, 38];
    b.sil(smooth([[...hb, 1], [...tip, 1], [...hr, 1]] as Pt[], true));
    b.sil(smooth([[172, 108], [144, 116], [128, 150], [110, 182], [122, 216], [102, 252], [118, 290], [100, 330], [118, 364]]));

    for (let k = 1; k <= 4; k++) {
      const a = lerp(hb, tip, k / 5), c = lerp(hr, tip, k / 5 - 0.07);
      b.det(3, line(a[0], a[1], c[0], c[1]));
    }
    if (eyesOpen) {
      b.det(3, ellipse(216, 164, 9, 12));
      b.det(4, circle(219, 159, 3));
      b.det(4, line(222, 152, 230, 146), line(226, 156, 235, 152));
    } else {
      b.det(3, arc(216, 166, 12, 8, 15, 165));
      b.det(4, line(208, 172, 204, 180), line(216, 174, 216, 182), line(224, 172, 228, 180));
    }
    b.det(3, ellipse(276, 232, 4, 6, 20), smooth([[262, 252], [274, 256], [286, 248]]));
    b.det(3, poly([[168, 112], [163, 84], [184, 106]]));
    b.det(3, smooth([[190, 106], [212, 126], [204, 150]]));
    b.det(3, smooth([[160, 122], [142, 168], [140, 214]]), smooth([[146, 220], [130, 262], [132, 300]]), smooth([[138, 300], [124, 334], [130, 362]]));
    b.det(4, smooth([[176, 116], [162, 150], [164, 186]]), smooth([[150, 240], [140, 280], [146, 320]]));

    if (flowers) {
      for (const [x, y] of [[172, 108], [150, 122], [190, 104]] as [number, number][]) {
        b.sil(circle(x, y, 9));
        b.det(3, circle(x, y, 3));
        for (let a = 0; a < 360; a += 72) b.det(4, line(x + Math.cos((a * Math.PI) / 180) * 3, y + Math.sin((a * Math.PI) / 180) * 3, x + Math.cos((a * Math.PI) / 180) * 9, y + Math.sin((a * Math.PI) / 180) * 9));
      }
    }
    if (star) {
      const pts: Pt[] = [];
      for (let i = 0; i < 10; i++) {
        const a = (-90 + i * 36) * (Math.PI / 180), rr = i % 2 ? 4.5 : 11;
        pts.push([196 + Math.cos(a) * rr, 212 + Math.sin(a) * rr, 1]);
      }
      b.det(3, poly(pts, true));
    }

    b.shade((s) => hatchPoly([[200, 262], [232, 258], [252, 310], [270, 364], [204, 364]], { angle: -60, spacing: s }));
    b.shade((s) => hatchEllipse(240, 200, 14, 8, { angle: 60, spacing: s * 0.35 }), 10);
    b.shade((s) => hatchPoly([[150, 130], [128, 150], [110, 182], [122, 216], [146, 210]], { angle: -60, spacing: s }), 9);

    return { title: titleOf(eyesOpen ? 'Bright-Eyed' : 'Dreamy', 'Unicorn', flowers ? 'with a Flower Crown' : '', star && !flowers ? 'with a Star Mark' : ''), strokes: b.strokes, frame: b.frame };
  },
};

const ghost = {
  id: 'ghost',
  name: 'Friendly Ghost',
  build(r: () => number) {
    const hat = pick(r, ['none', 'witch', 'bow']);
    const item = pick(r, ['none', 'lantern', 'balloon']);
    const face = pick(r, ['smile', 'oh', 'happy']);
    const b = new SB();
    b.guides(78, 40, 244, 330, { sym: 200, lines: [180, 352] });
    b.shape(circle(200, 175, 95), ellipse(200, 262, 95, 100));
    b.conn(ellipse(102, 245, 24, 14, -30), ellipse(298, 245, 24, 14, 30), line(100, 352, 300, 352));

    const body: Pt[] = [
      ...arcPts(200, 175, 95, 95, 180, 360, 14),
      [297, 260], [300, 345], [276, 366], [250, 344], [225, 368], [200, 346], [175, 368], [150, 344], [124, 366], [100, 345], [103, 260],
    ];
    b.sil(smooth(body, true));
    b.sil(smooth([[106, 232], [86, 228], [80, 244], [92, 258], [104, 258]]), smooth([[294, 232], [314, 228], [320, 244], [308, 258], [296, 258]]));

    for (const x of [168, 232]) {
      if (face === 'happy') b.det(3, arc(x, 186, 13, 10, 190, 350));
      else {
        b.det(3, ellipse(x, 182, 12, 18));
        b.det(4, circle(x + 4, 175, 4));
      }
    }
    if (face === 'oh') b.det(3, ellipse(200, 222, 9, 12));
    else b.det(3, smooth([[184, 214], [200, 226], [216, 214]]));
    b.det(4, ellipse(148, 206, 12, 6), ellipse(252, 206, 12, 6));

    if (hat === 'witch') {
      b.sil(ellipse(200, 92, 92, 16));
      b.sil(smooth([[150, 88, 1], [178, 40], [196, 0, 1], [236, 30, 1], [222, 40], [250, 88, 1]] as Pt[]));
      b.det(3, smooth([[156, 76], [200, 84], [244, 76]]), smooth([[158, 64], [200, 72], [242, 64]]));
      b.det(4, roundRect(190, 63, 20, 15, 2));
    } else if (hat === 'bow') {
      b.sil(smooth([[240, 96, 1], [264, 74], [270, 104], [240, 96, 1]], true), smooth([[240, 96, 1], [214, 78], [212, 108], [240, 96, 1]], true));
      b.det(3, circle(240, 96, 6));
    }
    if (item === 'lantern') {
      b.conn(line(318, 238, 318, 262));
      b.sil(roundRect(300, 262, 36, 50, 8), roundRect(304, 256, 28, 8, 3));
      b.det(3, smooth([[318, 274], [326, 288], [318, 300], [310, 288], [318, 274]], true));
      b.det(4, line(306, 270, 330, 270), line(306, 304, 330, 304));
    } else if (item === 'balloon') {
      b.conn(smooth([[312, 238], [326, 180], [316, 130]]));
      b.sil(smooth([[316, 128, 1], [300, 104], [292, 80], [304, 64], [316, 72, 1], [328, 64], [340, 80], [332, 104]], true));
      b.det(4, arc(306, 80, 6, 6, 200, 280));
    }

    b.shade((s) => hatchEllipse(200, 262, 95, 100, { angle: -60, spacing: s, from: 0.55 }));
    b.shade((s) => hatchEllipse(200, 380, 90, 8, { angle: -60, spacing: s * 0.7 }), 10);
    b.add('shading', [hatchEllipse(148, 206, 12, 6, { angle: 70, spacing: 3.5 }), hatchEllipse(252, 206, 12, 6, { angle: 70, spacing: 3.5 })], { min: 5 });

    return {
      title: titleOf(face === 'oh' ? 'Surprised' : 'Friendly', 'Ghost', hat === 'witch' ? 'in a Witch Hat' : hat === 'bow' ? 'with a Bow' : '', item === 'lantern' ? 'with a Lantern' : item === 'balloon' ? 'with a Heart Balloon' : ''),
      strokes: b.strokes, frame: b.frame,
    };
  },
};

export const fantasy: Category = { id: 'fantasy', name: 'Fantasy Creatures', emoji: '🐉', subjects: [dragon, unicorn, ghost] };
