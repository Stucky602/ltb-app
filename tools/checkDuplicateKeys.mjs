// checkDuplicateKeys.mjs — fails the build on a duplicate key in any object
// literal in the source tree.
//
// WHY THIS EXISTS
// A duplicate key in a JS object literal is not an error. The last definition
// silently wins and the earlier one evaporates. In receiptMatch.js's LINE_MAP
// that is not a style problem, it is a money problem: three of the six
// duplicates found in July 2026 carried a `packQty` on the LATER entry only, so
// the pack quantity survived purely because of declaration order. Sorting that
// object, or "tidying up the obvious duplicate" by deleting the second one,
// would have silently changed per-unit costs on every receipt scan afterwards.
//
// esbuild has warned about this on every single build for months. Nothing read
// the warnings. ci.yml's own comment records a duplicate LINE_MAP key shipping
// twice before this check existed; the July 2026 sweep found six more. Warnings
// nobody reads are not a safety net, so this makes it fail.
//
// Deliberately whole-tree rather than LINE_MAP-only. The failure mode is a
// property of object literals, not of that one map, and the check costs
// milliseconds.

import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

let failures = 0;

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name.startsWith('.')) continue;
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.(js|jsx|mjs)$/.test(name)) out.push(full);
  }
  return out;
}

// Walks the source character by character, tracking which OBJECT LITERAL each
// key sits directly inside. An earlier version grouped by nesting DEPTH, which
// is wrong and produced 34 false positives in dishes.js: two sibling dishes at
// the same depth are different literals, and both are entitled to a variant
// called "Small (~4 servings)". Identity, not depth.
//
// Crude on purpose. This only needs to find `'key':` and `"key":` inside object
// literals, which is how every lookup map in this codebase is written. A real
// parser would be more correct and would also be a dependency.
function duplicatesIn(src) {
  let i = 0, line = 1;
  let nextId = 0;
  const stack = [nextId++];          // id of the literal we are currently inside
  const seen = new Map();            // literalId -> Map(key -> line)
  const dups = [];

  const isKeyStart = () => {
    // Look back: a key is a quoted string at the start of a line (possibly
    // after whitespace or a comma) followed by a colon.
    const rest = src.slice(i);
    const m = rest.match(/^(['"])([^'"\n]+)\1\s*:/);
    if (!m) return null;
    let j = i - 1;
    while (j >= 0 && (src[j] === ' ' || src[j] === '\t')) j--;
    if (j >= 0 && src[j] !== '\n' && src[j] !== ',' && src[j] !== '{') return null;
    return m;
  };

  while (i < src.length) {
    const c = src[i];
    if (c === '\n') { line++; i++; continue; }

    // comments
    if (c === '/' && src[i + 1] === '/') { while (i < src.length && src[i] !== '\n') i++; continue; }
    if (c === '/' && src[i + 1] === '*') {
      i += 2;
      while (i < src.length && !(src[i] === '*' && src[i + 1] === '/')) { if (src[i] === '\n') line++; i++; }
      i += 2; continue;
    }

    // a quoted run is either a key or just a string; check for key first
    if (c === "'" || c === '"') {
      const m = isKeyStart();
      if (m) {
        const id = stack[stack.length - 1];
        const bucket = seen.get(id) || new Map();
        const prior = bucket.get(m[2]);
        if (prior) dups.push({ key: m[2], first: prior, second: line });
        else bucket.set(m[2], line);
        seen.set(id, bucket);
      }
      // skip the string body either way
      const q = c; i++;
      while (i < src.length && src[i] !== q) {
        if (src[i] === '\\') i++;
        if (src[i] === '\n') line++;
        i++;
      }
      i++; continue;
    }
    if (c === '`') {
      i++;
      while (i < src.length && src[i] !== '`') { if (src[i] === '\\') i++; if (src[i] === '\n') line++; i++; }
      i++; continue;
    }

    if (c === '{') { stack.push(nextId++); i++; continue; }
    if (c === '}') { if (stack.length > 1) stack.pop(); i++; continue; }
    i++;
  }
  return dups;
}

for (const file of walk('src')) {
  for (const d of duplicatesIn(readFileSync(file, 'utf8'))) {
    failures++;
    console.log(`  ✗ ${file}: duplicate key "${d.key}" at lines ${d.first} and ${d.second}`);
    console.log('    The later definition wins silently. Merge them; do not delete either');
    console.log('    blindly, since one may carry a packQty or a comment the other lacks.');
  }
}

if (failures === 0) console.log('  ✓ no duplicate object-literal keys in src/');
console.log(failures === 0 ? '\nDUPLICATE KEYS: ALL PASS' : `\nDUPLICATE KEYS: ${failures} FAILURES`);
process.exit(failures ? 1 : 0);
