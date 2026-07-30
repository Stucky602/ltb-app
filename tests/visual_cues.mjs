// tests/visual_cues.mjs — photographs of what a step should look like.
//
// WHAT THIS PROTECTS
//
// A kitchen photograph is one-shot. The roux will not be at that colour again
// today, the sear will not happen twice, and the plating is already in a
// container. So the failure this suite exists to prevent is a cue that REPORTS
// SAVED and has no bytes behind it — discovered a year later, when retaking is
// impossible.
//
// Everything below follows from that: a cue cannot reach 'stored' without a
// server-confirmed checksum, the archive manifest lists what it omitted rather
// than quietly presenting itself as complete, and the bundle is verified
// readable by a zip implementation that is not this one.
//
// The second thing protected is the archive's independence. Kevin's ruling on
// Jul 30 made it a folder rather than one HTML file, because media cannot live
// inside a self-contained file without either bloating it past opening or
// pointing at URLs that die with the worker. The bundle assertions check that
// the folder still explains itself to someone with no software but a browser.

import { execFileSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  makeCue, markStored, markFailed, brokenCues, unfinishedCues,
  cuesForDish, cueComparisonSets, buildBundleManifest, BUNDLE_README, CUE_KINDS, CUE_STATUS,
} from '../src/visualCues.js';
import { buildZip, crc32 } from '../src/zipWriter.js';
import { currentVersionFor } from '../src/recipeVersions.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let p = 0, f = 0;
const ok = (n, c, x) => { c ? (p++, console.log('  ✓ ' + n)) : (f++, console.log('  ✗ ' + n + (x ? '\n      ' + x : ''))); };

// ── A cue cannot claim to be saved ──────────────────────────────────────────
{
  const cue = makeCue({ dishName: 'Gumbo', step: 'Dark roux', kind: 'target' });
  ok('a new cue starts pending, not stored', cue.status === 'pending');
  ok('and has no media key yet', cue.mediaKey === null && cue.checksum === null);

  const stored = markStored(cue, { mediaKey: 'k.webp', checksum: 'abc', bytes: 1000, width: 1600, height: 1200 });
  ok('a confirmed upload marks it stored', stored.status === 'stored');

  ok('marking stored with no key FAILS instead',
    markStored(cue, { checksum: 'abc' }).status === 'failed',
    'the only path to stored is a server-confirmed checksum');
  ok('and with no checksum it FAILS too',
    markStored(cue, { mediaKey: 'k.webp' }).status === 'failed',
    'a kitchen photo is one-shot; optimism here loses it permanently');

  const failed = markFailed(cue, 'upload timed out');
  ok('a failure records why', failed.status === 'failed' && /timed out/.test(failed.failureReason));
}

// ── Drift between metadata and bytes is surfaced ────────────────────────────
{
  const good = markStored(makeCue({ dishName: 'Gumbo', step: 'Roux' }), { mediaKey: 'k', checksum: 'c' });
  const liar = { ...makeCue({ dishName: 'Gumbo', step: 'Roux' }), status: 'stored' };       // stored, no key
  const orphan = { ...makeCue({ dishName: 'Gumbo', step: 'Roux' }), mediaKey: 'k2' };       // key, not stored

  ok('a cue claiming stored with no key is flagged broken', brokenCues([liar]).length === 1);
  ok('a cue with a key but not stored is flagged too', brokenCues([orphan]).length === 1);
  ok('a healthy cue is not flagged', brokenCues([good]).length === 0);
  ok('unfinished cues are listable so they can be retaken',
    unfinishedCues([good, liar, markFailed(makeCue({ dishName: 'Chili', step: 'x' }), 'net')]).length === 1);
}

// ── A cue belongs to a recipe VERSION ───────────────────────────────────────
{
  const cue = makeCue({ dishName: 'Bolognese', step: 'Browning' });
  const current = currentVersionFor('bolognese');
  ok('a cue is stamped with the recipe version at capture',
    cue.recipeVersionId === current.id, `${cue.recipeVersionId} vs ${current.id}`);
  ok('and keyed by dishId, not display name', cue.dishId === 'bolognese');

  // Explicit version wins, so a cue can be filed against a historical recipe.
  const back = makeCue({ dishName: 'Bolognese', step: 'x', recipeVersionId: 'bolognese@2020-01-01-a' });
  ok('an explicit version is preserved', back.recipeVersionId === 'bolognese@2020-01-01-a',
    'when the recipe changes an old cue becomes historical, not wrong');

  ok('an unknown dish still produces a cue', !!makeCue({ dishName: 'Not A Dish', step: 'x' }).id);
}

// ── Comparison sets are the point ───────────────────────────────────────────
{
  const target = markStored(makeCue({ dishName: 'Gumbo', step: 'Dark roux', kind: 'target' }), { mediaKey: 'a', checksum: 'a' });
  const tooFar = markStored(makeCue({ dishName: 'Gumbo', step: 'Dark roux', kind: 'too-far' }), { mediaKey: 'b', checksum: 'b' });
  const lonely = markStored(makeCue({ dishName: 'Gumbo', step: 'Plating', kind: 'target' }), { mediaKey: 'c', checksum: 'c' });

  const sets = cueComparisonSets([lonely, target, tooFar], 'Gumbo');
  ok('cues group by step', sets.length === 2);
  ok('a step with both target and contrast sorts first', sets[0].step === 'Dark roux',
    'target beside too-far is the whole reason for the feature');
  ok('the contrast is grouped with its target', sets[0].target.length === 1 && sets[0].contrast.length === 1);

  ok('cues filter by dish', cuesForDish([target, lonely], 'Gumbo').length === 2);
  ok('and another dish gets none', cuesForDish([target], 'Chili').length === 0);

  ok('the kind list is closed', CUE_KINDS.length >= 4 && CUE_KINDS.every(k => k.id && k.label),
    'free-text kinds become twelve spellings of "roux" inside a month');
  ok('the status list is exported', CUE_STATUS.includes('stored'));
}

// ── The manifest tells the truth about what is missing ──────────────────────
{
  const stored = markStored(makeCue({ dishName: 'Gumbo', step: 'Roux' }), { mediaKey: 'g.webp', checksum: 'sum1', bytes: 2048 });
  const never = markFailed(makeCue({ dishName: 'Chili', step: 'Bloom' }), 'offline');

  const m = buildBundleManifest({ cues: [stored, never], archiveBytes: 5000 });
  ok('the manifest lists the archive itself', m.files.some(x => x.path === 'archive.html'));
  ok('and each stored photograph', m.files.some(x => x.path === 'media/g.webp' && x.checksum === 'sum1'));
  ok('a photograph that never uploaded is NOT listed as present',
    !m.files.some(x => /Bloom/.test(JSON.stringify(x))));
  ok('but IS listed as omitted, with a reason',
    m.omitted.length === 1 && /never finished uploading/.test(m.omitted[0].why),
    'an archive that quietly drops failures misrepresents itself as complete');

  ok('each media entry carries its recipe version', m.files.filter(x => x.path.startsWith('media/')).every(x => !!x.recipeVersionId));
  ok('the readme explains the folder without software',
    /archive\.html/.test(BUNDLE_README) && /manifest\.json/.test(BUNDLE_README) && /checksum/.test(BUNDLE_README));
  ok('and tells a future reader how to spot a damaged file',
    /different\s*\n?\s*checksum was damaged|checksum was damaged/.test(BUNDLE_README));
}

// ── The bundle is a real zip ────────────────────────────────────────────────
//
// Verified by Python's zipfile, deliberately: a zip that only this code can
// read is not an archive, it is a private format. If the writer is subtly wrong
// the failure would otherwise appear years later on a machine nobody has yet.
{
  const enc = new TextEncoder();
  const zip = buildZip([
    { path: 'archive.html', bytes: enc.encode('<html><body>The record</body></html>') },
    { path: 'README.txt', bytes: enc.encode(BUNDLE_README) },
    { path: 'media/gumbo_roux_target_abc123.webp', bytes: new Uint8Array([82, 73, 70, 70, 1, 2, 3, 4]) },
    { path: 'manifest.json', bytes: enc.encode(JSON.stringify({ schema: 1 })) },
  ], { date: new Date('2026-07-30T12:00:00Z') });

  ok('the bundle has bytes', zip.length > 100);
  ok('it starts with the zip magic number', zip[0] === 0x50 && zip[1] === 0x4B);

  const tmp = path.join(os.tmpdir(), 'ltb_bundle_test.zip');
  fs.writeFileSync(tmp, zip);
  let report = '';
  try {
    report = execFileSync('python3', ['-c', `
import zipfile, json
z = zipfile.ZipFile(${JSON.stringify(tmp)})
bad = z.testzip()
names = sorted(z.namelist())
print(json.dumps({
  "corrupt": bad,
  "names": names,
  "archive": z.read("archive.html").decode()[:20],
  "nested": z.read("media/gumbo_roux_target_abc123.webp").hex(),
}))
`], { encoding: 'utf8' });
  } catch (e) {
    report = '';
  }

  if (!report) {
    ok('an independent zip implementation reads the bundle', false, 'python3 unavailable or the zip was rejected');
  } else {
    const r = JSON.parse(report);
    ok('an independent zip implementation reads the bundle', r.corrupt === null);
    ok('every file survives the round trip', r.names.length === 4);
    ok('the archive text is intact', r.archive.startsWith('<html>'));
    ok('binary media is byte-exact', r.nested === '5249464601020304',
      'a photograph mangled by the writer would be indistinguishable from a corrupt camera file');
    ok('the folder structure is preserved', r.names.some(n => n.startsWith('media/')));
  }
  fs.rmSync(tmp, { force: true });

  ok('crc32 matches the known value for "123456789"',
    crc32(new TextEncoder().encode('123456789')) === 0xCBF43926,
    'the standard check value; a wrong CRC makes every zip tool report corruption');
}


// ── Cue metadata must survive a backup round trip ───────────────────────────
//
// The photographs live in R2 and are NOT in the backup. This metadata is the
// only record of which image belongs to which dish and which recipe version, so
// losing it orphans every file in the bucket — they would still exist and mean
// nothing. archiveHistory is written into the payload and never restored, a
// live bug in that same file, which is exactly the shape being guarded here.
{
  const backup = fs.readFileSync(path.join(ROOT, 'src/backupRestore.js'), 'utf8');
  ok('cues are written into the backup payload', /visualCues: state\.visualCues/.test(backup));
  ok('AND read back on restore', /payload\.visualCues/.test(backup) && /setVisualCues\(payload\.visualCues\)/.test(backup),
    'a payload field that is never restored is silent data loss');
  ok('and persisted to the same key on restore', /saveJSON\(VISUAL_CUES_KEY/.test(backup));

  const boot = fs.readFileSync(path.join(ROOT, 'src/bootHydrate.js'), 'utf8');
  ok('cues are loaded at boot', /loadJSON\(VISUAL_CUES_KEY/.test(boot),
    'booting empty and then saving would overwrite the stored list with nothing');
  ok('and set into state', /setVisualCues\(/.test(boot));
}

// ── The capture UI cannot claim a save it did not get ──────────────────────
{
  const ui = fs.readFileSync(path.join(ROOT, 'src/components/CueAtlas.jsx'), 'utf8');
  const code = ui.replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');

  ok('stored is only ever set from an upload result',
    /result\.ok[\s\S]{0,40}markStored\(working, result\)/.test(code),
    'the only path to stored is a server-confirmed checksum');
  ok('a failed upload is marked failed', /markFailed\(working, result\.reason\)/.test(code));
  ok('failures stay visible on the card rather than in a toast',
    /status === 'failed'/.test(code),
    'a failed upload the cook did not notice is a photograph that cannot be retaken');
  ok('and the copy says the photo is gone and needs retaking',
    /needs retaking/.test(ui));

  ok('photos are fetched through the gated route, never a public URL',
    /WORKER_BASE\}\/media\//.test(code) && !/r2\.dev|pub-[a-z0-9]+\./.test(code),
    'the bucket has public access disabled and must stay that way');

  ok('the capture flow opens the camera before asking questions',
    ui.indexOf('capture="environment"') < ui.indexOf('Which step?'),
    'a question asked before the shutter is a question asked while the roux darkens');

  ok('a cue shows which recipe version it was true of', /versionLabel\(c\.recipeVersionId\)/.test(code));
  ok('deleting a cue deletes the photograph too', /method: 'DELETE'/.test(code));
  ok('and confirms first', /window\.confirm/.test(code));

  ok('the component uses the repo icon set, not an uninstalled package',
    /from '\.\.\/icons\.jsx'/.test(code) && !/lucide-react/.test(code),
    'app_render bundles App.jsx with no externals, so an unresolvable import fails the whole gate');
}

console.log(f === 0 ? '\nVISUAL CUES: ALL PASS' : `\nVISUAL CUES: ${f} FAILURES`);
process.exit(f ? 1 : 0);
