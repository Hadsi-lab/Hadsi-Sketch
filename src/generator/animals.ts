import { arc, circle, ellipse, hatchEllipse, hatchPoly, line, poly, smooth, tube, type Pt } from '../lib/geometry';
import { chance, pick } from '../lib/rng';
import { M, SB, mx, titleOf, type Category } from './builder';

type Eyes = 'open' | 'sleepy' | 'happy';

function eyePair(b: SB, lx: number, y: number, style: Eyes, size = 1) {
  for (const x of [lx, mx(lx)]) {
    if (style === 'open') {
      b.det(3, ellipse(x, y, 10 * size, 13 * size));
      b.det(3, ellipse(x + 1, y + 1, 4 * size, 9 * size));
      b.det(4, circle(x + 3 * size, y - 5 * size, 2.5 * size));
    } else if (style === 'sleepy') {
      b.det(3, arc(x, y - 2, 11 * size, 7 * size, 10, 170));
      b.det(4, line(x - 10 * size, y + 2, x - 15 * size, y + 6), line(x + 10 * size, y + 2, x + 15 * size, y + 6));
    } else {
      b.det(3, arc(x, y + 4, 11 * size, 9 * size, 190, 350));
    }
  }
}

const cat = {
  id: 'cat',
  name: 'Cat',
  build(r: () => number) {
    const eyes = pick(r, ['open', 'sleepy', 'happy'] as Eyes[]);
    const acc = pick(r, ['none', 'bow', 'scarf', 'bell']);
    const tabby = chance(r, 0.5);
    const flip = chance(r, 0.5);
    const fx = (p: Pt[]): Pt[] => (flip ? p.map(([x, y]) => [mx(x), y] as Pt) : p);
    const b = new SB();

    b.guides(110, 55, 230, 318, { sym: 200, lines: [150, 210] });
    b.shape(circle(200, 150, 60), ellipse(200, 285, 70, 80));

    const ear: Pt[] = [[152, 118], [150, 62], [188, 96]];
    b.conn(poly(ear, true), poly(M(ear), true));
    b.conn(ellipse(178, 325, 15, 38), ellipse(222, 325, 15, 38));
    const tail: Pt[] = fx([[262, 335], [314, 320], [330, 268], [306, 226]]);
    b.conn(smooth(tail));

    const head: Pt[] = [
      [145, 172], [141, 140], [149, 112], [150, 60, 1], [182, 92], [200, 89],
      [218, 92], [250, 60, 1], [251, 112], [259, 140], [255, 172], [236, 200], [200, 210], [164, 200],
    ];
    b.sil(smooth(head, true));
    b.sil(smooth([[166, 203], [138, 250], [130, 300], [142, 350], [170, 368], [230, 368], [258, 350], [270, 300], [262, 250], [234, 203]]));
    b.sil(tube(tail, 24, 16));
    b.sil(smooth([[190, 300], [188, 340], [190, 366]]), smooth([[210, 300], [212, 340], [210, 366]]));

    eyePair(b, 176, 150, eyes);
    b.det(3, smooth([[193, 168, 1], [207, 168, 1], [200, 176, 1]], true));
    const mouth: Pt[] = [[200, 176], [198, 183], [190, 187], [183, 182]];
    b.det(3, smooth(mouth), smooth(M(mouth)));
    const inner: Pt[] = [[158, 104], [156, 76], [176, 94]];
    b.det(3, poly(inner), poly(M(inner)));
    b.det(4, line(150, 174, 114, 168), line(150, 182, 112, 187), line(250, 174, 286, 168), line(250, 182, 288, 187));
    b.det(4, line(172, 356, 172, 367), line(181, 356, 181, 367), line(228, 356, 228, 367), line(219, 356, 219, 367));
    if (tabby) {
      b.det(4, line(200, 96, 200, 112), smooth([[184, 98], [188, 111]]), smooth([[216, 98], [212, 111]]));
      b.det(5, smooth([[262, 262], [248, 268], [240, 280]]), smooth([[267, 290], [252, 294], [244, 304]]), smooth([[138, 262], [152, 268], [160, 280]]));
    }

    if (acc === 'bow') {
      b.sil(smooth([[238, 96, 1], [256, 80], [262, 100], [238, 96, 1]], true), smooth([[238, 96, 1], [218, 82], [214, 102], [238, 96, 1]], true));
      b.det(3, circle(238, 96, 5));
    } else if (acc === 'scarf') {
      b.sil(smooth([[158, 196, 1], [200, 214], [242, 196, 1], [246, 212, 1], [200, 232], [154, 212, 1]], true));
      b.sil(smooth([[222, 222, 1], [232, 266, 1], [252, 258, 1], [242, 216, 1]], true));
      b.det(4, line(226, 238, 244, 232), line(229, 252, 248, 246));
    } else if (acc === 'bell') {
      b.sil(smooth([[160, 200], [200, 216], [240, 200]]), smooth([[162, 210], [200, 226], [238, 210]]));
      b.det(3, circle(200, 234, 9));
      b.det(4, line(200, 237, 200, 243), line(192, 232, 208, 232));
    }

    b.shade((s) => hatchEllipse(200, 285, 70, 80, { angle: -60, spacing: s, from: 0.3 }));
    b.shade((s) => hatchEllipse(200, 214, 42, 9, { angle: -60, spacing: s * 0.7 }), 8);
    b.shade((s) => hatchEllipse(200, 150, 60, 60, { angle: -60, spacing: s, from: 0.62 }), 12);
    b.add('shading', [hatchEllipse(168, 172, 9, 5, { angle: 70, spacing: 3.5 }), hatchEllipse(232, 172, 9, 5, { angle: 70, spacing: 3.5 })], { min: 5 });

    const eyeWord = { open: 'Curious', sleepy: 'Sleepy', happy: 'Happy' }[eyes];
    const accWord = { none: '', bow: 'with a Bow', scarf: 'in a Cosy Scarf', bell: 'with a Bell Collar' }[acc];
    return { title: titleOf(eyeWord, tabby ? 'Tabby' : '', 'Cat', accWord), strokes: b.strokes, frame: b.frame };
  },
};

const owl = {
  id: 'owl',
  name: 'Owl',
  build(r: () => number) {
    const eyes = pick(r, ['wide', 'sleepy', 'wink']);
    const acc = pick(r, ['none', 'cap', 'bowtie']);
    const b = new SB();
    b.guides(92, 50, 216, 315, { sym: 200, lines: [182, 342] });
    b.shape(ellipse(200, 225, 92, 118), circle(165, 182, 36), circle(235, 182, 36));
    const tuft: Pt[] = [[132, 128], [120, 72], [166, 112]];
    b.conn(poly(tuft, true), poly(M(tuft), true));
    b.conn(ellipse(118, 245, 24, 70, 15), ellipse(282, 245, 24, 70, -15));
    const branch: Pt[] = [[58, 352], [200, 346], [346, 354]];
    b.conn(smooth(branch));

    b.sil(smooth([
      [200, 108], [166, 112], [120, 70, 1], [130, 128], [110, 175], [108, 240], [122, 300],
      [160, 336], [200, 344], [240, 336], [278, 300], [292, 240], [290, 175], [270, 128], [280, 70, 1], [234, 112],
    ], true));
    const wing: Pt[] = [[126, 180], [102, 214], [96, 266], [112, 312, 1], [136, 296], [142, 248], [136, 200]];
    b.sil(smooth(wing, true), smooth(M(wing), true));
    b.sil(tube(branch, 18, 14, false));

    b.det(3, circle(165, 182, 30), circle(235, 182, 30));
    for (const [x, kind] of [[165, eyes], [235, eyes === 'wink' ? 'sleepy' : eyes]] as [number, string][]) {
      if (kind === 'sleepy') b.det(3, arc(x, 180, 16, 10, 10, 170));
      else {
        b.det(3, circle(x, 184, 15));
        b.det(4, circle(x + 6, 178, 4.5));
      }
    }
    b.det(3, smooth([[190, 212, 1], [210, 212, 1], [200, 234, 1]], true));
    b.det(3, ellipse(200, 282, 52, 56));
    for (let y = 250; y <= 316; y += 17) {
      for (let x = 168; x <= 232; x += 16) {
        const dx = (x - 200) / 52, dy = (y - 282) / 56;
        if (dx * dx + dy * dy < 0.7) b.det(4, arc(x + ((y / 17) % 2) * 8 - 4, y, 7, 5, 20, 160));
      }
    }
    for (const fx of [176, 224]) for (const o of [-8, 0, 8]) b.det(3, ellipse(fx + o, 344, 4, 8));
    b.det(4, smooth([[118, 210], [112, 250], [120, 290]]), smooth([[282, 210], [288, 250], [280, 290]]));
    b.det(5, smooth([[90, 352], [120, 349]]), smooth([[270, 351], [310, 353]]));

    if (acc === 'cap') {
      b.sil(poly([[140, 98], [200, 74], [260, 98], [200, 120]], true));
      b.det(3, smooth([[164, 108], [168, 124], [200, 132], [232, 124], [236, 108]]));
      b.det(3, smooth([[200, 97], [252, 104], [256, 136]]), circle(256, 140, 4));
    } else if (acc === 'bowtie') {
      b.sil(poly([[200, 244], [176, 232], [176, 258]], true), poly([[200, 244], [224, 232], [224, 258]], true));
      b.det(3, circle(200, 244, 5));
    }

    b.shade((s) => hatchEllipse(118, 245, 24, 70, { rot: 15, angle: -60, spacing: s }), 9);
    b.shade((s) => hatchEllipse(282, 245, 24, 70, { rot: -15, angle: -60, spacing: s }), 9);
    b.shade((s) => hatchEllipse(200, 225, 92, 118, { angle: -60, spacing: s, from: 0.55 }));
    b.cross((s) => hatchEllipse(282, 245, 24, 70, { rot: -15, angle: 30, spacing: s }));

    const w = { wide: 'Wide-Eyed', sleepy: 'Sleepy', wink: 'Winking' }[eyes];
    const a = { none: '', cap: 'in a Graduation Cap', bowtie: 'with a Bow Tie' }[acc];
    return { title: titleOf(w, 'Owl', a), strokes: b.strokes, frame: b.frame };
  },
};

const fox = {
  id: 'fox',
  name: 'Fox',
  build(r: () => number) {
    const eyesClosed = chance(r, 0.35);
    const acc = pick(r, ['none', 'scarf', 'leaf']);
    const flip = chance(r, 0.5);
    const fx = (p: Pt[]): Pt[] => (flip ? p.map(([x, y]) => [mx(x), y] as Pt) : p);
    const b = new SB();
    b.guides(110, 58, 238, 312, { sym: 200, lines: [150] });
    b.shape(ellipse(200, 150, 62, 48), ellipse(200, 285, 62, 78));
    const ear: Pt[] = [[152, 128], [142, 62], [184, 106]];
    b.conn(poly(ear, true), poly(M(ear), true));
    const tail = fx([[252, 342], [312, 332], [340, 282], [322, 232]]);
    b.conn(smooth(tail), ellipse(180, 330, 13, 36), ellipse(220, 330, 13, 36));

    b.sil(smooth([
      [200, 198, 1], [178, 188], [152, 178, 1], [140, 166], [146, 150], [142, 132], [156, 118], [142, 60, 1], [182, 104],
      [200, 102], [218, 104], [258, 60, 1], [244, 118], [258, 132], [254, 150], [260, 166], [248, 178, 1], [222, 188],
    ], true));
    b.sil(smooth([[172, 192], [148, 240], [138, 300], [148, 350], [175, 366], [225, 366], [252, 350], [262, 300], [252, 240], [228, 192]]));
    b.sil(tube(tail, 40, 22));
    b.sil(smooth([[190, 300], [189, 340], [190, 366]]), smooth([[210, 300], [211, 340], [210, 366]]));

    for (const x of [176, 224]) {
      if (eyesClosed) b.det(3, arc(x, 144, 11, 6, 15, 165));
      else {
        b.det(3, smooth([[x - 11, 147, 1], [x, 140], [x + 11, 147, 1], [x, 152]], true));
        b.det(4, circle(x + (x < 200 ? 1 : -1), 146, 3.5));
      }
    }
    b.det(3, ellipse(200, 176, 8, 6));
    const mouth: Pt[] = [[200, 182], [195, 188], [188, 186]];
    b.det(3, smooth(mouth), smooth(M(mouth)));
    const mask: Pt[] = [[186, 124], [176, 150], [186, 170], [200, 180]];
    b.det(3, smooth(mask), smooth(M(mask)));
    b.det(3, smooth([[176, 200], [186, 248], [200, 262], [214, 248], [224, 200]]));
    const inner: Pt[] = [[156, 112], [148, 76], [176, 104]];
    b.det(3, poly(inner), poly(M(inner)));
    const tipCenter = fx([[310, 246], [328, 262], [346, 248]]);
    b.det(3, smooth(tipCenter));
    b.det(4, line(174, 357, 174, 367), line(183, 357, 183, 367), line(226, 357, 226, 367), line(217, 357, 217, 367));

    if (acc === 'scarf') {
      b.sil(smooth([[164, 190, 1], [200, 206], [236, 190, 1], [240, 204, 1], [200, 222], [160, 204, 1]], true));
      b.sil(smooth([[176, 212, 1], [166, 254, 1], [184, 258, 1], [192, 218, 1]], true));
      b.det(4, line(172, 228, 188, 232), line(169, 242, 186, 246));
    } else if (acc === 'leaf') {
      b.sil(smooth([[200, 102, 1], [210, 82], [234, 78, 1], [220, 100]], true));
      b.det(3, smooth([[200, 102], [214, 90], [234, 78]]));
    }

    b.shade((s) => hatchPoly([[148, 74], [156, 110], [176, 104]], { angle: -60, spacing: s * 0.5 }));
    b.shade((s) => hatchPoly([[252, 74], [244, 110], [224, 104]], { angle: -60, spacing: s * 0.5 }));
    b.shade((s) => hatchEllipse(200, 285, 62, 78, { angle: -60, spacing: s, from: 0.35 }));
    b.shade((s) => hatchEllipse(flip ? 80 : 320, 292, 22, 44, { rot: flip ? -20 : 20, angle: -60, spacing: s }), 9);
    b.shade((s) => hatchEllipse(200, 202, 36, 8, { angle: -60, spacing: s * 0.6 }), 8);

    return { title: titleOf(eyesClosed ? 'Dreamy' : 'Clever', 'Fox', acc === 'scarf' ? 'in a Scarf' : acc === 'leaf' ? 'with a Leaf Hat' : ''), strokes: b.strokes, frame: b.frame };
  },
};

export const animals: Category = { id: 'animals', name: 'Animals & Wildlife', emoji: '🦊', subjects: [cat, owl, fox] };
