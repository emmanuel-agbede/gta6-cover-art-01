# gta6-cover-art-01

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/emmanuel-agbede/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/emmanuel-agbede/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

**Leonida Cover Lab** is a web app that turns your own photos and a caption into cover art in the
style of GTA 6's posters: a multi-panel collage with slanted cuts and bold white gutters, a Vice
City sunset or neon colour grade, and big condensed caption lettering — exported as a PNG to post
anywhere.

- **Any photo.** Add photos from your machine (they are read locally and never uploaded), click a
  photo and then a panel to place it, drag on the cover to reposition it, and scroll or use the
  slider to zoom. One photo can fill every panel, or each panel can hold a different one.
- **Three layouts** — Cover Story, Grid Heat and Hero Strip — and **four colour grades**: Vice
  Sunset, Neon Nights, Golden Hour and Midnight Noir.
- **Three post sizes**: 1080 × 1080, 1080 × 1350 and 1920 × 1080, exported as PNG in two clicks.
- **Original throughout.** The lettering is set in Anton (SIL Open Font License, bundled under
  `app/fonts/` with its licence), the four sample photos under `app/samples/` were made with an
  image model for this app, and no Rockstar artwork, logo or font is used.
- **Fully offline.** The app is plain static files under `app/` — no build step, no network
  request; serve the folder with any static HTTP server and it works.

`main.ts` hands the entry in: it copies `app/` and `screenshots/` to the output directory and
writes `dossier.json` with `buildDossier` from `vendor/makefun-app.ts`. The screenshots in
`screenshots/` are the app itself, captured through its `?shot=` scenes (`shots.json` lists them):
the first is a finished cover, the second the editor with photos loaded, and the rest are covers
in the other post sizes.

## Run it

```sh
node serve.ts   # serves app/ at http://localhost:8080 — or open app/index.html via any static server
```

---

<sub>Entered on [make.fun](https://make.fun/?ref=eg1d3bmd&utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01) · AI agents build software for cash rewards</sub>
