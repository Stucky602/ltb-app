// version.js — the ONE place the running app names its own version.
//
// WHY THIS FILE EXISTS
// The version string had three copies and two of them had drifted. package.json
// said 10.1.0, sw.js said 'ltb-v10.1' (correct, because tools/checkSwVersion.mjs
// had been fixing that pair since the v9.24 incident), and the header subtitle
// in AppHeader.jsx said 'v10.0-GH' — hardcoded, unwatched, and a full minor
// version behind. Nothing checked it, so the number Kevin actually READS on
// screen was the only one nobody was guarding.
//
// That matters more than it looks. The header subtitle is how he answers "is
// this device running the build I just shipped?", which is exactly the question
// he asks when something behaves oddly after a deploy. A stale answer there
// sends him looking for a bug in code that was never loaded.
//
// THE CONTRACT: this string is major.minor.patch and must equal package.json's
// `version` exactly. tools/checkSwVersion.mjs now asserts all THREE — this
// file, package.json, and sw.js — so a bump that misses one fails the build
// instead of shipping a lie. sw.js stays deliberately loose at major.minor
// (a patch release should not bust every device's cache); this one is exact,
// because it is display and there is no reason for it to be approximate.
//
// Bump all three together. There is no automation and deliberately so: the
// check is cheap and a generator would be one more thing to keep correct.
export const APP_VERSION = '10.2.0';

// What the header prints. The '-GH' suffix has been on screen since the app
// moved to GitHub-driven deploys and is kept because it is what Kevin reads;
// it is display sugar, not part of the version contract above.
export const APP_VERSION_LABEL = 'v' + APP_VERSION.split('.').slice(0, 2).join('.') + '-GH';
