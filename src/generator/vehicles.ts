import { arcPts, circle, ellipse, hatchEllipse, hatchPoly, line, poly, smooth, type Pt } from '../lib/geometry';
import { chance, pick, range, type Rng } from '../lib/rng';
import { M, SB, titleOf, type Category } from './builder';

const corners = (pts: [number, number][]): Pt[] => pts.map((p, i) => (i === 0 || i === pts.length - 1 ? [p[0], p[1], 1] : p));

function starShape(cx: number, cy: number, R: number): Pt[] {
  const pts: Pt[] = [];
  for (let i = 0; i < 8; i++) {
    const a = ((-90 + i * 45) * Math.PI) / 180, rr = i % 2 ? R * 0.35 : R;
    pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, 1]);
  }
  return pts;
}

function cloud(cx: number, cy: number, s: number): string {
  return smooth([[cx - 30 * s, cy + 10 * s], [cx - 34 * s, cy - 4 * s], [cx - 18 * s, cy - 12 * s], [cx - 6 * s, cy - 24 * s], [cx + 12 * s, cy - 20 * s], [cx + 22 * s, cy - 8 * s], [cx + 34 * s, cy - 2 * s], [cx + 30 * s, cy + 10 * s]], true);
}

const car = {
  id: 'car',
  name: 'Bubble Car',
  build(r: Rng) {
    const roof = pick(r, ['none', 'surfboard', 'luggage']);
    const stripe = chance(r, 0.5);
    const face = chance(r, 0.5);
    const b = new SB();
    b.guides(52, roof === 'none' ? 156 : 130, 300, roof === 'none' ? 200 : 226, { sym: 200, lines: [300, 352] });
    b.shape(ellipse(200, 272, 146, 50), ellipse(196, 216, 78, 56), circle(115, 318, 32), circle(285, 318, 32));
    b.conn(line(28, 352, 372, 352), line(62, 300, 344, 300));

    const outline: Pt[] = [
      [62, 318, 1], [58, 296], [64, 262], [90, 246], [124, 238], [136, 198], [162, 166], [212, 160], [244, 178], [266, 232],
      [318, 244], [342, 264], [348, 298], [342, 318, 1],
      ...corners(arcPts(285, 318, 42, 42, 0, -180, 10)),
      ...corners(arcPts(115, 318, 42, 42, 0, -180, 10)),
    ];
    b.sil(smooth(outline, true));
    b.sil(circle(115, 318, 32), circle(285, 318, 32));

    b.det(3, smooth([[214, 174], [236, 186], [254, 232, 1], [206, 232, 1]] as Pt[], true));
    b.det(3, smooth([[150, 232, 1], [148, 206], [164, 180], [198, 174], [198, 232, 1]] as Pt[], true));
    b.det(3, circle(115, 318, 13), circle(285, 318, 13));
    b.det(3, line(202, 240, 204, 300), smooth([[140, 240], [146, 300]]));
    b.det(3, ellipse(334, 268, 8, 10));
    b.det(4, poly([[60, 268], [68, 268], [68, 284], [60, 284]], true), smooth([[176, 252], [192, 252]]));
    for (const cx of [115, 285]) for (let a = 0; a < 360; a += 72) b.det(4, circle(cx + Math.cos((a * Math.PI) / 180) * 7, 318 + Math.sin((a * Math.PI) / 180) * 7, 1.6));
    b.det(4, line(224, 192, 214, 216), line(236, 196, 228, 214), line(172, 192, 162, 214));
    if (stripe) b.det(3, smooth([[66, 272], [200, 266], [340, 274]]), smooth([[66, 280], [200, 274], [342, 282]]));
    if (face) {
      b.det(3, circle(320, 266, 3), smooth([[318, 282], [328, 288], [338, 282]]));
    }
    if (roof === 'surfboard') {
      b.conn(line(170, 162, 170, 150), line(232, 166, 232, 154));
      b.sil(ellipse(200, 146, 112, 12, 2));
      b.det(3, smooth([[100, 146], [200, 148], [300, 150]]));
    } else if (roof === 'luggage') {
      b.conn(line(156, 166, 244, 168));
      b.sil(poly([[160, 166], [160, 132], [212, 132], [212, 166]], true), poly([[214, 168], [214, 144], [244, 144], [244, 168]], true));
      b.det(3, line(186, 132, 186, 166), line(214, 156, 244, 156));
    }

    b.shade((s) => hatchEllipse(200, 356, 160, 7, { angle: -60, spacing: s * 0.6 }), 9);
    b.shade((s) => hatchPoly([[64, 290], [348, 290], [344, 300], [64, 300]], { angle: -60, spacing: s * 0.5 }), 10);
    b.shade((s) => hatchEllipse(115, 318, 32, 32, { angle: -60, spacing: s, from: -1, to: 1 }), 9);
    b.shade((s) => hatchEllipse(285, 318, 32, 32, { angle: -60, spacing: s, from: -1, to: 1 }), 9);
    b.cross((s) => hatchEllipse(115, 318, 32, 32, { angle: 30, spacing: s }));
    b.cross((s) => hatchEllipse(285, 318, 32, 32, { angle: 30, spacing: s }));

    return { title: titleOf(face ? 'Smiley' : 'Zippy', 'Bubble Car', roof === 'surfboard' ? 'with a Surfboard' : roof === 'luggage' ? 'Ready for a Road Trip' : '', stripe && roof === 'none' ? 'with Racing Stripes' : ''), strokes: b.strokes, frame: b.frame };
  },
};

const rocket = {
  id: 'rocket',
  name: 'Rocket',
  build(r: Rng) {
    const flame = chance(r, 0.7);
    const stars = chance(r, 0.6);
    const pilot = chance(r, 0.5);
    const b = new SB();
    b.guides(108, 40, 184, flame ? 352 : 300, { sym: 200, lines: [165, 310] });
    b.shape(ellipse(200, 190, 58, 136), circle(200, 165, 26));
    const fin: Pt[] = [[150, 236], [108, 306], [152, 300]];
    b.conn(poly(fin, true), poly(M(fin), true), poly([[178, 312], [222, 312], [232, 330], [168, 330]], true));

    b.sil(smooth([[200, 52, 1], [236, 100], [256, 170], [254, 240], [238, 312, 1], [162, 312, 1], [146, 240], [144, 170], [164, 100]], true));
    const finS: Pt[] = [[148, 230], [118, 262], [106, 306, 1], [154, 300]];
    b.sil(smooth(finS), smooth(M(finS)));
    b.sil(poly([[176, 312], [224, 312], [234, 332], [166, 332]], true));
    b.sil(line(200, 300, 200, 336));

    b.det(3, circle(200, 165, 32), circle(200, 165, 24));
    b.det(3, smooth([[168, 108], [200, 118], [232, 108]]), smooth([[150, 262], [200, 272], [250, 262]]));
    if (pilot) {
      b.det(3, smooth([[186, 164], [190, 160], [194, 164]]), smooth([[206, 164], [210, 160], [214, 164]]), smooth([[192, 174], [200, 179], [208, 174]]));
      b.det(4, poly([[184, 152], [180, 140], [190, 148]]), poly([[216, 152], [220, 140], [210, 148]]));
    } else {
      b.det(4, line(188, 158, 196, 150), line(190, 168, 206, 152));
    }
    for (const [x, y] of [[166, 210], [234, 210], [166, 240], [234, 240]]) b.det(4, circle(x, y, 3));
    b.det(4, line(200, 196, 200, 262));
    if (flame) {
      b.sil(smooth([[176, 336], [166, 362], [186, 354], [200, 392, 1], [214, 354], [234, 362], [224, 336]]));
      b.det(3, smooth([[188, 340], [192, 360], [200, 372], [208, 360], [212, 340]]));
    }
    if (stars) {
      for (const [x, y, s] of [[82, 90, 12], [310, 70, 9], [322, 200, 13], [76, 230, 8], [300, 320, 8]]) {
        b.det(3, poly(starShape(x + range(r, -6, 6), y + range(r, -6, 6), s), true));
      }
    }

    b.shade((s) => hatchEllipse(200, 190, 58, 136, { angle: -60, spacing: s, from: 0.4 }));
    b.shade((s) => hatchPoly([[250, 236], [282, 262], [294, 306], [248, 300]], { angle: -60, spacing: s * 0.8 }));
    b.cross((s) => hatchPoly([[176, 314], [224, 314], [232, 330], [168, 330]], { angle: 30, spacing: s * 0.6 }));

    return { title: titleOf(pilot ? 'Rocket with a Happy Pilot' : 'Space Rocket', flame ? 'Blasting Off' : '', stars ? 'Among the Stars' : ''), strokes: b.strokes, frame: b.frame };
  },
};

const balloon = {
  id: 'balloon',
  name: 'Hot Air Balloon',
  build(r: Rng) {
    const pattern = pick(r, ['stripes', 'zigzag', 'hearts']);
    const clouds = chance(r, 0.6);
    const b = new SB();
    b.guides(100, 48, 200, 320, { sym: 200, lines: [150, 280] });
    b.shape(circle(200, 150, 96), poly([[174, 318], [226, 318], [222, 362], [178, 362]], true));
    b.conn(smooth([[116, 196], [176, 278]]), smooth([[284, 196], [224, 278]]), line(178, 280, 180, 318), line(222, 280, 220, 318));

    b.sil(smooth([...arcPts(200, 150, 96, 96, 155, 385, 20), [268, 236], [226, 280, 1], [174, 280, 1], [132, 236]], true));
    b.sil(smooth([[172, 318, 1], [228, 318, 1], [224, 364, 1], [176, 364, 1]], true), poly([[168, 312], [232, 312], [232, 322], [168, 322]], true));
    b.sil(line(176, 282, 178, 312), line(224, 282, 222, 312));

    b.det(3, smooth([[200, 54], [200, 160], [200, 280]]), smooth([[200, 54], [150, 110], [148, 200], [186, 280]]), smooth([[200, 54], [250, 110], [252, 200], [214, 280]]));
    b.det(4, smooth([[200, 54], [122, 120], [124, 200], [176, 274]]), smooth([[200, 54], [278, 120], [276, 200], [224, 274]]));
    if (pattern === 'stripes') {
      b.det(3, smooth([[112, 116], [200, 136], [288, 116]]), smooth([[106, 176], [200, 198], [294, 176]]));
    } else if (pattern === 'zigzag') {
      const z: Pt[] = [];
      for (let i = 0; i <= 12; i++) z.push([108 + i * 15.3, 150 + (i % 2 ? -14 : 12), 1]);
      b.det(3, poly(z));
    } else {
      for (const [x, y] of [[170, 140], [230, 140], [200, 210]]) {
        b.det(3, smooth([[x, y + 10, 1], [x - 12, y], [x - 10, y - 9], [x, y - 5, 1], [x + 10, y - 9], [x + 12, y]], true));
      }
    }
    b.det(4, line(178, 334, 222, 334), line(178, 348, 222, 348));
    b.det(4, hatchPoly([[180, 324], [220, 324], [218, 360], [182, 360]], { angle: 90, spacing: 8, shrink: 1 }));
    if (clouds) {
      b.det(3, cloud(78, 258, 1), cloud(330, 300, 0.8), cloud(320, 70, 0.7));
    }

    b.shade((s) => hatchEllipse(200, 150, 96, 96, { angle: -60, spacing: s, from: 0.45 }));
    b.shade((s) => hatchPoly([[204, 322], [220, 322], [218, 362], [202, 362]], { angle: -60, spacing: s * 0.5 }));
    b.cross((s) => hatchEllipse(200, 150, 96, 96, { angle: 30, spacing: s, from: 0.7 }));

    const pw = { stripes: 'Striped', zigzag: 'Zig-Zag', hearts: 'Heart-Covered' }[pattern];
    return { title: titleOf(pw, 'Hot Air Balloon', clouds ? 'in the Clouds' : ''), strokes: b.strokes, frame: b.frame };
  },
};

export const vehicles: Category = { id: 'vehicles', name: 'Vehicles', emoji: '🚀', subjects: [car, rocket, balloon] };
