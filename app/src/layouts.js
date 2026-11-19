// Panel layouts for Leonida Cover Lab. Each layout is a set of panels whose shapes are polygons in
// fractional cover coordinates (0..1 on both axes), tiling the whole frame with slanted cuts in the
// spirit of classic multi-panel game cover posters. The renderer strokes every polygon with a bold
// white gutter, so neighbouring panels read as separate poster cells.

/** One panel cell: a polygon plus the default photo framing used until the reader adjusts it. */
function cell(points) {
  return { points, photoIndex: 0, offsetX: 0, offsetY: 0, zoom: 1 };
}

export const LAYOUTS = [
  {
    id: 'story',
    name: 'Cover Story',
    blurb: 'One hero panel over two angled scenes',
    panels: () => [
      cell([[0, 0], [1, 0], [1, 0.54], [0, 0.62]]),
      cell([[0, 0.62], [0.55, 0.545], [0.47, 1], [0, 1]]),
      cell([[0.55, 0.545], [1, 0.54], [1, 1], [0.47, 1]]),
    ],
  },
  {
    id: 'grid',
    name: 'Grid Heat',
    blurb: 'Four scenes locked in a slanted grid',
    panels: () => [
      cell([[0, 0], [0.52, 0], [0.47, 0.48], [0, 0.52]]),
      cell([[0.52, 0], [1, 0], [1, 0.5], [0.47, 0.48]]),
      cell([[0, 0.52], [0.47, 0.48], [0.44, 1], [0, 1]]),
      cell([[0.47, 0.48], [1, 0.5], [1, 1], [0.44, 1]]),
    ],
  },
  {
    id: 'duo',
    name: 'Hero Strip',
    blurb: 'A tall hero portrait beside two scenes',
    panels: () => [
      cell([[0, 0], [0.44, 0], [0.38, 1], [0, 1]]),
      cell([[0.44, 0], [1, 0], [1, 0.56], [0.4, 0.52]]),
      cell([[0.4, 0.52], [1, 0.56], [1, 1], [0.38, 1]]),
    ],
  },
];

/** The three export sizes the cover can be written at, in pixels. */
export const SIZES = [
  { id: 'portrait', name: 'Poster 1080 × 1350', width: 1080, height: 1350 },
  { id: 'square', name: 'Square 1080 × 1080', width: 1080, height: 1080 },
  { id: 'landscape', name: 'Wide 1920 × 1080', width: 1920, height: 1080 },
];

/** Colour grades: a wash laid over every panel, plus the photo filter that goes under it. */
export const GRADES = [
  {
    id: 'sunset',
    name: 'Vice Sunset',
    filter: 'saturate(1.28) contrast(1.06)',
    wash: [[0, 'rgba(64, 16, 96, 0.18)'], [0.45, 'rgba(255, 94, 58, 0.05)'], [0.78, 'rgba(255, 42, 133, 0.22)'], [1, 'rgba(24, 6, 54, 0.44)']],
  },
  {
    id: 'neon',
    name: 'Neon Nights',
    filter: 'saturate(1.45) contrast(1.12) brightness(0.96)',
    wash: [[0, 'rgba(0, 229, 255, 0.16)'], [0.5, 'rgba(20, 0, 60, 0.12)'], [1, 'rgba(255, 0, 128, 0.34)']],
  },
  {
    id: 'golden',
    name: 'Golden Hour',
    filter: 'saturate(1.18) contrast(1.03) brightness(1.05) sepia(0.22)',
    wash: [[0, 'rgba(255, 176, 0, 0.10)'], [0.6, 'rgba(255, 94, 58, 0.10)'], [1, 'rgba(120, 40, 0, 0.34)']],
  },
  {
    id: 'noir',
    name: 'Midnight Noir',
    filter: 'saturate(0.55) contrast(1.18) brightness(0.94)',
    wash: [[0, 'rgba(8, 8, 24, 0.30)'], [0.55, 'rgba(8, 8, 24, 0.05)'], [1, 'rgba(0, 0, 12, 0.55)']],
  },
];

/** Per-panel accent tints, cycled by panel index, laid on with soft light so each cell keeps its own mood. */
export const PANEL_TINTS = ['#ff5e3a', '#ff2a85', '#00c2a8', '#ffb300'];
