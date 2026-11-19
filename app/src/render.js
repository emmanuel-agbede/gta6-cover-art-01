// The cover renderer: draws the whole poster onto any 2D canvas context at any size, so the editor
// preview and the exported PNG are the same drawing. Panels are clipped polygons filled with the
// reader's photos (cover-fit, with their own offset and zoom), washed with a colour grade, divided
// by bold white gutters, and finished with condensed display lettering in the Anton typeface.

import { GRADES, PANEL_TINTS } from './layouts.js';

/** Traces a fractional polygon as a path on a w × h canvas. */
export function polygonPath(ctx, points, w, h) {
  ctx.beginPath();
  points.forEach(([fx, fy], i) => {
    if (i === 0) ctx.moveTo(fx * w, fy * h);
    else ctx.lineTo(fx * w, fy * h);
  });
  ctx.closePath();
}

/** The axis-aligned bounds of a fractional polygon, in pixels. */
export function polygonBounds(points, w, h) {
  const xs = points.map(([fx]) => fx * w);
  const ys = points.map(([, fy]) => fy * h);
  return {
    left: Math.min(...xs),
    top: Math.min(...ys),
    right: Math.max(...xs),
    bottom: Math.max(...ys),
  };
}

/** True when the fractional point (fx, fy) falls inside the polygon. */
export function pointInPolygon(points, fx, fy) {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [xi, yi] = points[i];
    const [xj, yj] = points[j];
    if (yi > fy !== yj > fy && fx < ((xj - xi) * (fy - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** Draws a palm-tree silhouette: a curved trunk and six swept fronds, centred near (x, y). */
function drawPalmSilhouette(ctx, x, y, s, color) {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineCap = 'round';
  ctx.lineWidth = s * 0.07;
  ctx.beginPath();
  ctx.moveTo(x - s * 0.3, y + s);
  ctx.quadraticCurveTo(x - s * 0.1, y, x + s * 0.18, y - s * 0.72);
  ctx.stroke();
  const [cx, cy] = [x + s * 0.18, y - s * 0.72];
  for (const a of [-2.9, -2.35, -1.8, -1.25, -0.7, -0.2]) {
    ctx.lineWidth = s * 0.05;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.quadraticCurveTo(
      cx + Math.cos(a) * s * 0.55,
      cy + Math.sin(a) * s * 0.55 - s * 0.18,
      cx + Math.cos(a) * s * 0.95,
      cy + Math.sin(a) * s * 0.95 + s * 0.3,
    );
    ctx.stroke();
  }
}

/** Fills a panel that has no photo yet: a dusk sky, a low sun and palm silhouettes. */
function drawEmptyPanel(ctx, bounds, panelIndex) {
  const { left, top, right, bottom } = bounds;
  const pw = right - left;
  const ph = bottom - top;
  const sky = ctx.createLinearGradient(0, top, 0, bottom);
  sky.addColorStop(0, '#3b1d63');
  sky.addColorStop(0.55, '#c22e7d');
  sky.addColorStop(1, '#ff7a3c');
  ctx.fillStyle = sky;
  ctx.fillRect(left, top, pw, ph);
  const sunR = Math.min(pw, ph) * 0.26;
  ctx.fillStyle = '#ffd76e';
  ctx.beginPath();
  ctx.arc(left + pw * 0.68, top + ph * 0.62, sunR, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(27, 8, 48, 0.85)';
  ctx.fillRect(left, bottom - ph * 0.1, pw, ph * 0.1);
  drawPalmSilhouette(ctx, left + pw * 0.2, bottom - ph * 0.08, Math.min(pw, ph) * 0.34, 'rgba(27, 8, 48, 0.9)');
  drawPalmSilhouette(ctx, left + pw * 0.88, bottom - ph * 0.06, Math.min(pw, ph) * 0.24, 'rgba(27, 8, 48, 0.75)');
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.font = `600 ${Math.max(13, Math.min(pw, ph) * 0.055)}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText(`PANEL ${panelIndex + 1} — ADD A PHOTO`, left + pw / 2, top + ph * 0.16);
}

/** Draws one panel: its photo (or the empty scene), its accent tint and its share of the grade. */
function drawPanel(ctx, w, h, panel, photo, panelIndex, grade) {
  const bounds = polygonBounds(panel.points, w, h);
  ctx.save();
  polygonPath(ctx, panel.points, w, h);
  ctx.clip();
  if (photo) {
    const bw = bounds.right - bounds.left;
    const bh = bounds.bottom - bounds.top;
    const scale = Math.max(bw / photo.naturalWidth, bh / photo.naturalHeight) * panel.zoom;
    const pw = photo.naturalWidth * scale;
    const ph = photo.naturalHeight * scale;
    const px = bounds.left + (bw - pw) / 2 + panel.offsetX * bw * 0.35;
    const py = bounds.top + (bh - ph) / 2 + panel.offsetY * bh * 0.35;
    ctx.filter = grade.filter;
    ctx.drawImage(photo, px, py, pw, ph);
    ctx.filter = 'none';
  } else {
    drawEmptyPanel(ctx, bounds, panelIndex);
  }
  ctx.globalCompositeOperation = 'soft-light';
  ctx.fillStyle = PANEL_TINTS[panelIndex % PANEL_TINTS.length];
  ctx.fillRect(bounds.left, bounds.top, bounds.right - bounds.left, bounds.bottom - bounds.top);
  ctx.globalCompositeOperation = 'source-over';
  ctx.restore();
}

/** The kicker line: letterspaced capitals on a hot-pink bar, centred near the top of the cover. */
function drawKicker(ctx, w, h, kicker) {
  const text = kicker.trim().toUpperCase();
  if (!text) return 0;
  const size = h * 0.026;
  ctx.font = `${size}px Anton, sans-serif`;
  const spaced = text.split('').join('  ');
  const tw = ctx.measureText(spaced).width;
  const barW = tw + size * 2.4;
  const barH = size * 1.9;
  const barX = (w - barW) / 2;
  const barY = h * 0.028;
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
  ctx.shadowBlur = size * 0.5;
  ctx.shadowOffsetY = size * 0.16;
  ctx.fillStyle = '#ff2a85';
  ctx.fillRect(barX, barY, barW, barH);
  ctx.restore();
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(spaced, w / 2, barY + barH / 2 + size * 0.06);
  ctx.textBaseline = 'alphabetic';
  return barY + barH;
}

/** The title: big condensed capitals with a warm gradient fill, a heavy black outline and a hard shadow. */
function drawTitle(ctx, w, h, title, topEdge) {
  const text = title.trim().toUpperCase();
  if (!text) return;
  let size = h * 0.105;
  ctx.textAlign = 'center';
  const setFont = () => { ctx.font = `${size}px Anton, sans-serif`; };
  setFont();
  while (ctx.measureText(text).width > w * 0.92 && size > 14) {
    size -= 3;
    setFont();
  }
  const y = topEdge + size * 1.04;
  const fill = ctx.createLinearGradient(0, y - size, 0, y);
  fill.addColorStop(0, '#ffffff');
  fill.addColorStop(0.55, '#ffe9b8');
  fill.addColorStop(1, '#ffb300');
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.shadowColor = 'rgba(10, 0, 24, 0.65)';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = size * 0.045;
  ctx.shadowOffsetY = size * 0.06;
  ctx.strokeStyle = '#14041f';
  ctx.lineWidth = size * 0.16;
  ctx.strokeText(text, w / 2, y);
  ctx.shadowColor = 'transparent';
  ctx.fillStyle = fill;
  ctx.fillText(text, w / 2, y);
  ctx.restore();
}

/**
 * Draws the complete cover described by `state` onto ctx at w × h.
 * state: { layout, gradeId, panels, photos, title, kicker, selected, showSelection }
 * photos is an array of images; each panel names its photo by index into it (or -1 for none).
 */
export function drawCoverArt(ctx, w, h, state) {
  const grade = GRADES.find((g) => g.id === state.gradeId) ?? GRADES[0];
  ctx.fillStyle = '#160a26';
  ctx.fillRect(0, 0, w, h);
  state.panels.forEach((panel, i) => {
    const photo = panel.photoIndex >= 0 ? state.photos[panel.photoIndex] : null;
    drawPanel(ctx, w, h, panel, photo ?? null, i, grade);
  });
  // The grade wash over the whole poster knits the panels into one cover.
  const wash = ctx.createLinearGradient(0, 0, 0, h);
  for (const [at, color] of grade.wash) wash.addColorStop(at, color);
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, w, h);
  // White gutters between panels, with a fine dark keyline inside each.
  for (const panel of state.panels) {
    polygonPath(ctx, panel.points, w, h);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = Math.max(3, w * 0.0075);
    ctx.stroke();
    polygonPath(ctx, panel.points, w, h);
    ctx.strokeStyle = 'rgba(10, 2, 20, 0.55)';
    ctx.lineWidth = Math.max(1, w * 0.0016);
    ctx.stroke();
  }
  // Outer frame.
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = Math.max(4, w * 0.009);
  ctx.strokeRect(0, 0, w, h);
  // A soft vignette to seat the lettering.
  const vig = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.42, w / 2, h / 2, Math.max(w, h) * 0.78);
  vig.addColorStop(0, 'rgba(10, 0, 24, 0)');
  vig.addColorStop(1, 'rgba(10, 0, 24, 0.30)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);
  // A shade across the top so the lettering stays bold over bright skies and faces,
  // and a hot-pink keyline just inside the frame for a finished, printed-poster edge.
  const scrim = ctx.createLinearGradient(0, 0, 0, h * 0.24);
  scrim.addColorStop(0, 'rgba(12, 0, 26, 0.34)');
  scrim.addColorStop(1, 'rgba(12, 0, 26, 0)');
  ctx.fillStyle = scrim;
  ctx.fillRect(0, 0, w, h * 0.24);
  const inset = Math.max(4, w * 0.009) + Math.max(2, w * 0.004);
  ctx.strokeStyle = 'rgba(255, 42, 133, 0.85)';
  ctx.lineWidth = Math.max(1.5, w * 0.0022);
  ctx.strokeRect(inset, inset, w - inset * 2, h - inset * 2);
  const kickerBottom = drawKicker(ctx, w, h, state.kicker);
  drawTitle(ctx, w, h, state.title, Math.max(kickerBottom + h * 0.012, h * 0.02));
  // The editor's selection ring (never on an export: showSelection is false there).
  if (state.showSelection && state.selected >= 0 && state.panels[state.selected]) {
    polygonPath(ctx, state.panels[state.selected].points, w, h);
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = Math.max(3, w * 0.005);
    ctx.setLineDash([w * 0.02, w * 0.012]);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}
