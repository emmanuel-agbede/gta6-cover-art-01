// Fixed scenes for the entry's screenshots, driven by the ?shot= query so every screenshot is the
// app itself, drawn by its own code: ?shot=cover shows one finished cover filling the viewport;
// ?shot=editor shows the editor with the sample photos loaded and a panel selected.
// window.__shotReady is set once the scene is painted, which the screenshot script waits for.

export async function runShot(query, setupScene, redraw) {
  const shot = query.get('shot');
  if (shot === 'cover') document.body.classList.add('shot-cover');
  await setupScene({
    sizeId: query.get('size') ?? 'portrait',
    layoutId: query.get('layout') ?? 'story',
    gradeId: query.get('grade') ?? 'sunset',
    title: query.get('caption') ?? 'Sunset Heat',
    kicker: query.get('kicker') ?? 'Leonida',
    photoNames: (query.get('photos') ?? 'heroine,driver,beach,marina').split(','),
  });
  redraw();
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
