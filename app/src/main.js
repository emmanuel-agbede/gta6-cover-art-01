// Leonida Cover Lab: wires the page to the renderer. Photos stay on the reader's machine (object
// URLs and FileReader only, nothing is uploaded). The cover is drawn by ./render.js onto the
// preview canvas at the chosen export size, so what you see is exactly what the PNG holds.

import { LAYOUTS, SIZES, GRADES } from './layouts.js';
import { drawCoverArt, pointInPolygon, polygonBounds } from './render.js';
import { runShot } from './shots.js';

const SAMPLE_NAMES = ['heroine', 'driver', 'beach', 'marina'];

const canvas = document.getElementById('cover');
const ctx = canvas.getContext('2d');
const status = document.getElementById('status');
const titleInput = document.getElementById('title');
const kickerInput = document.getElementById('kicker');
const zoomInput = document.getElementById('zoom');
const panelLabel = document.getElementById('panel-label');
const tray = document.getElementById('tray');

const state = {
  layoutId: 'story',
  gradeId: 'sunset',
  sizeId: 'portrait',
  panels: [],
  photos: [],
  title: titleInput.value,
  kicker: kickerInput.value,
  selected: 0,
  armedPhoto: -1,
};

function currentLayout() {
  return LAYOUTS.find((l) => l.id === state.layoutId) ?? LAYOUTS[0];
}

function currentSize() {
  return SIZES.find((s) => s.id === state.sizeId) ?? SIZES[0];
}

/** Gives every panel a photo: panel i takes photo i, wrapping around; -1 while there are none. */
function assignDefaultPhotos() {
  state.panels.forEach((panel, i) => {
    panel.photoIndex = state.photos.length ? i % state.photos.length : -1;
  });
}

function rebuildPanels() {
  state.panels = currentLayout().panels();
  assignDefaultPhotos();
  state.selected = 0;
  syncPanelControls();
}

function applySize() {
  const size = currentSize();
  canvas.width = size.width;
  canvas.height = size.height;
}

// Presentation mode (the ?shot=cover scenes): the cover is shown exactly as it would be
// exported, with no editor chrome drawn on it — above all, no selection ring.
let presentMode = false;

function redraw() {
  drawCoverArt(ctx, canvas.width, canvas.height, { ...state, showSelection: !presentMode });
}

function syncPanelControls() {
  const panel = state.panels[state.selected];
  panelLabel.textContent = panel
    ? `Panel ${state.selected + 1} of ${state.panels.length} selected — drag on the cover to reposition its photo.`
    : 'No panel selected.';
  if (panel) zoomInput.value = String(panel.zoom);
}

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

async function addPhoto(url) {
  const img = await loadImage(url);
  state.photos.push(img);
  renderTray();
  if (state.panels.some((p) => p.photoIndex < 0)) assignDefaultPhotos();
  redraw();
  return img;
}

function renderTray() {
  tray.replaceChildren();
  if (!state.photos.length) {
    const empty = document.createElement('p');
    empty.className = 'tray-empty';
    empty.textContent = 'No photos yet — add some, or use the samples.';
    tray.append(empty);
    return;
  }
  state.photos.forEach((img, i) => {
    const thumb = document.createElement('img');
    thumb.src = img.src;
    thumb.alt = `Photo ${i + 1}`;
    thumb.title = `Photo ${i + 1}: click, then click a panel to place it`;
    if (i === state.armedPhoto) thumb.classList.add('armed');
    thumb.addEventListener('click', () => {
      state.armedPhoto = i;
      renderTray();
      status.textContent = `Photo ${i + 1} picked — now click the panel it belongs in.`;
    });
    tray.append(thumb);
  });
}

/** Builds a row of toggle buttons into a container. */
function buildButtons(containerId, items, currentId, onPick) {
  const box = document.getElementById(containerId);
  box.replaceChildren();
  for (const item of items) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = item.name;
    button.title = item.blurb ?? item.name;
    if (item.id === currentId) button.classList.add('active');
    button.addEventListener('click', () => onPick(item.id));
    box.append(button);
  }
}

function refreshButtons() {
  buildButtons('layout-buttons', LAYOUTS, state.layoutId, (id) => {
    state.layoutId = id;
    rebuildPanels();
    refreshButtons();
    redraw();
  });
  buildButtons('grade-buttons', GRADES, state.gradeId, (id) => {
    state.gradeId = id;
    refreshButtons();
    redraw();
  });
  buildButtons('size-buttons', SIZES, state.sizeId, (id) => {
    state.sizeId = id;
    applySize();
    refreshButtons();
    redraw();
  });
}

document.getElementById('photo-input').addEventListener('change', async (e) => {
  for (const file of e.target.files) await addPhoto(URL.createObjectURL(file));
  status.textContent = `${state.photos.length} photo(s) ready. Click a panel to select it, drag to frame it.`;
});

titleInput.addEventListener('input', () => { state.title = titleInput.value; redraw(); });
kickerInput.addEventListener('input', () => { state.kicker = kickerInput.value; redraw(); });
zoomInput.addEventListener('input', () => {
  const panel = state.panels[state.selected];
  if (panel) {
    panel.zoom = Number(zoomInput.value);
    redraw();
  }
});

// Dragging on the cover: pick the panel under the pointer (or drop the armed photo into it),
// then drag to slide that panel's photo around; the wheel zooms it.
let drag = null;

function canvasFraction(e) {
  const rect = canvas.getBoundingClientRect();
  return [(e.clientX - rect.left) / rect.width, (e.clientY - rect.top) / rect.height];
}

canvas.addEventListener('pointerdown', (e) => {
  const [fx, fy] = canvasFraction(e);
  const index = state.panels.findIndex((p) => pointInPolygon(p.points, fx, fy));
  if (index < 0) return;
  state.selected = index;
  if (state.armedPhoto >= 0) {
    state.panels[index].photoIndex = state.armedPhoto;
    state.armedPhoto = -1;
    renderTray();
  }
  syncPanelControls();
  drag = { x: fx, y: fy };
  canvas.setPointerCapture(e.pointerId);
  redraw();
});

canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const [fx, fy] = canvasFraction(e);
  const panel = state.panels[state.selected];
  const bounds = polygonBounds(panel.points, 1, 1);
  panel.offsetX += (fx - drag.x) / Math.max(0.05, bounds.right - bounds.left);
  panel.offsetY += (fy - drag.y) / Math.max(0.05, bounds.bottom - bounds.top);
  drag = { x: fx, y: fy };
  redraw();
});

canvas.addEventListener('pointerup', () => { drag = null; });
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const panel = state.panels[state.selected];
  if (!panel) return;
  panel.zoom = Math.min(3, Math.max(1, panel.zoom * (e.deltaY < 0 ? 1.06 : 0.94)));
  zoomInput.value = String(panel.zoom);
  redraw();
}, { passive: false });

canvas.addEventListener('dragover', (e) => e.preventDefault());
canvas.addEventListener('drop', async (e) => {
  e.preventDefault();
  for (const file of e.dataTransfer.files) {
    if (file.type.startsWith('image/')) await addPhoto(URL.createObjectURL(file));
  }
});

document.getElementById('export').addEventListener('click', () => {
  const size = currentSize();
  const out = document.createElement('canvas');
  out.width = size.width;
  out.height = size.height;
  drawCoverArt(out.getContext('2d'), size.width, size.height, { ...state, showSelection: false });
  out.toBlob((blob) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `leonida-cover-${size.width}x${size.height}.png`;
    a.click();
    status.textContent = `Saved leonida-cover-${size.width}x${size.height}.png — post it anywhere.`;
  }, 'image/png');
});

/** Sets the whole scene at once; used by the screenshot scenes in ./shots.js. */
async function setupScene({ sizeId, layoutId, gradeId, title, kicker, photoNames }) {
  state.sizeId = sizeId ?? state.sizeId;
  state.layoutId = layoutId ?? state.layoutId;
  state.gradeId = gradeId ?? state.gradeId;
  state.title = title ?? state.title;
  state.kicker = kicker ?? state.kicker;
  titleInput.value = state.title;
  kickerInput.value = state.kicker;
  applySize();
  state.photos = [];
  for (const name of photoNames ?? SAMPLE_NAMES) {
    state.photos.push(await loadImage(`samples/${name}.jpg`));
  }
  renderTray();
  rebuildPanels();
  refreshButtons();
  redraw();
}

async function boot() {
  // The display font must be ready before the first draw, or the lettering falls back.
  const anton = new FontFace('Anton', "url('./fonts/Anton-Regular.ttf')");
  try {
    await anton.load();
    document.fonts.add(anton);
  } catch {
    // A missing font file only costs the display face; the app still works.
  }
  applySize();
  rebuildPanels();
  refreshButtons();
  renderTray();
  redraw();
  const query = new URLSearchParams(location.search);
  if (query.get('shot')) {
    presentMode = query.get('shot') === 'cover';
    await runShot(query, setupScene, redraw);
  } else {
    // Open with the bundled samples in place so the first thing seen is a finished cover.
    for (const name of SAMPLE_NAMES) await addPhoto(`samples/${name}.jpg`);
    status.textContent = 'Sample photos loaded — swap in your own any time.';
  }
}

boot();
