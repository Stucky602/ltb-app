// Deep-compare two snapshots. Object key ORDER is ignored (not behavior);
// array order, values, and presence/absence are all compared strictly.
import fs from 'fs';
const [a, b] = [process.argv[2], process.argv[3]].map(p => JSON.parse(fs.readFileSync(p)));
const diffs = [];
function cmp(x, y, path) {
  if (x === y) return;
  if (typeof x !== typeof y) { diffs.push(`${path}: type ${typeof x} vs ${typeof y}`); return; }
  if (typeof x === 'number') { if (Math.abs(x - y) > 1e-9) diffs.push(`${path}: ${x} vs ${y}`); return; }
  if (x === null || y === null || typeof x !== 'object') { diffs.push(`${path}: ${JSON.stringify(x)} vs ${JSON.stringify(y)}`); return; }
  if (Array.isArray(x) !== Array.isArray(y)) { diffs.push(`${path}: array vs object`); return; }
  if (Array.isArray(x)) {
    if (x.length !== y.length) { diffs.push(`${path}: length ${x.length} vs ${y.length}`); return; }
    x.forEach((v, i) => cmp(v, y[i], `${path}[${i}]`));
    return;
  }
  const kx = Object.keys(x).sort(), ky = Object.keys(y).sort();
  for (const k of new Set([...kx, ...ky])) {
    if (!(k in x)) { diffs.push(`${path}.${k}: missing in A`); continue; }
    if (!(k in y)) { diffs.push(`${path}.${k}: missing in B`); continue; }
    cmp(x[k], y[k], `${path}.${k}`);
  }
}
cmp(a, b, '$');
if (diffs.length) {
  console.log(`DIFFERENCES (${diffs.length}):`);
  diffs.slice(0, 60).forEach(d => console.log(' ', d));
  process.exit(1);
}
console.log('IDENTICAL — behavior preserved exactly.');
