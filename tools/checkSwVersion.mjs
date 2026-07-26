// checkSwVersion.mjs — fails the build when sw.js and package.json disagree.
//
// WHY: sw.js only clears stale caches and only tells open clients a new build
// landed when SW_VERSION *changes*. A version string left behind is therefore
// silent: every deploy still ships, and no device is ever told. It sat at
// 'ltb-v9.24' while package.json said 10.0.0, so the update prompt had been
// dead across an unknown number of releases. Nothing in the repo checked, and
// the file's own comment said to bump it by hand, which is the same as hoping.
//
// The contract is deliberately loose (major.minor only). Patch releases do not
// need to bust a cache, and forcing a bump on every one would train Kevin to
// ignore this check.
import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync('package.json', 'utf8')).version;
const want = 'ltb-v' + pkg.split('.').slice(0, 2).join('.');
const m = readFileSync('sw.js', 'utf8').match(/const SW_VERSION = '([^']+)'/);

if (!m) {
  console.log('  ✗ sw.js has no SW_VERSION constant');
  console.log('\nSW VERSION: 1 FAILURES');
  process.exit(1);
}
if (m[1] !== want) {
  console.log(`  ✗ sw.js SW_VERSION is '${m[1]}' but package.json is ${pkg} (expected '${want}')`);
  console.log('    Devices are only told a new build shipped when this string changes.');
  console.log('    Bump both together.');
  console.log('\nSW VERSION: 1 FAILURES');
  process.exit(1);
}
console.log(`  ✓ sw.js SW_VERSION '${m[1]}' matches package.json ${pkg}`);
console.log('\nSW VERSION: ALL PASS');
