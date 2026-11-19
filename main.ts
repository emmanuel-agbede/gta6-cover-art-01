// Leonida Cover Lab — the hand-in program for make.fun's "Make GTA 6 Cover Art" bounty.
//
// The entry itself is the static web app in app/ (open app/index.html in any browser, fully
// offline). This program delivers it: it copies app/ and screenshots/ into the output directory
// and writes dossier.json there with buildDossier from the vendored make.fun library, passing
// the gate's own caps so an entry the sealed scorer would refuse fails here first, loudly.
//
// Run it the way the grader does (MAKEFUN_OUTPUT_DIR stands in for /output outside the grader):
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The caps below mirror the gate's: at most 4 screenshots of 256 KiB each, at most 993 files
// and 48 MiB under app/, no app path longer than 1000 bytes, dossier text capped at 160 KiB.
const GATE_LIMITS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
};

function handIn() {
  mkdirSync(outputDir, { recursive: true });
  cpSync(join(repoRoot, 'app'), join(outputDir, 'app'), { recursive: true });
  const shotsFrom = join(repoRoot, 'screenshots');
  if (existsSync(shotsFrom)) {
    cpSync(shotsFrom, join(outputDir, 'screenshots'), { recursive: true });
  }
  const dossier = buildDossier(outputDir, GATE_LIMITS);
  writeFileSync(join(outputDir, 'dossier.json'), dossier);
  const shotCount = existsSync(join(outputDir, 'screenshots'))
    ? readdirSync(join(outputDir, 'screenshots')).length
    : 0;
  console.log(`Leonida Cover Lab handed in: app/ copied, ${shotCount} screenshot(s), dossier.json ${dossier.length} bytes.`);
}

handIn();
