// src/zipWriter.js — assembles the archive folder into one downloadable file.
//
// WHY HAND-WRITTEN RATHER THAN A LIBRARY
//
// This repo has four dependencies. Adding a fifth for something used once, in a
// feature meant to still be readable in twenty years, is a poor trade — and the
// STORE method (no compression) is about seventy lines of well-documented
// format. Every zip tool on every platform has read STORE since 1989, which is
// exactly the property the archive needs.
//
// No compression is also the RIGHT choice here, not just the easy one. The
// media is already WebP, so deflating it again buys almost nothing and costs
// CPU on a phone. The HTML would compress well, but one uncompressed HTML file
// inside a bundle is not the problem worth solving.
//
// The output is a real .zip. Kevin's PC opens it, macOS opens it, iOS Files
// opens it, and so does anything that comes after them.

// CRC-32, the checksum the zip format requires. Table built once.
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[i] = c >>> 0;
  }
  return t;
})();

function crc32(bytes) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}

function dosDateTime(date) {
  const d = date || new Date();
  const time = ((d.getHours() & 0x1F) << 11) | ((d.getMinutes() & 0x3F) << 5) | ((d.getSeconds() / 2) & 0x1F);
  const day = (((d.getFullYear() - 1980) & 0x7F) << 9) | (((d.getMonth() + 1) & 0x0F) << 5) | (d.getDate() & 0x1F);
  return { time, day };
}

function u16(v) { return [v & 0xFF, (v >>> 8) & 0xFF]; }
function u32(v) { return [v & 0xFF, (v >>> 8) & 0xFF, (v >>> 16) & 0xFF, (v >>> 24) & 0xFF]; }

// entries: [{ path, bytes: Uint8Array }]
export function buildZip(entries, { date } = {}) {
  const enc = new TextEncoder();
  const { time, day } = dosDateTime(date);
  const chunks = [];
  const central = [];
  let offset = 0;

  for (const e of entries) {
    const nameBytes = enc.encode(e.path);
    const data = e.bytes instanceof Uint8Array ? e.bytes : new Uint8Array(e.bytes);
    const crc = crc32(data);

    // Local file header. Version 20, no flags, method 0 (STORE).
    const local = [
      ...u32(0x04034B50), ...u16(20), ...u16(0), ...u16(0),
      ...u16(time), ...u16(day),
      ...u32(crc), ...u32(data.length), ...u32(data.length),
      ...u16(nameBytes.length), ...u16(0),
    ];
    chunks.push(new Uint8Array(local), nameBytes, data);

    central.push({
      nameBytes, crc, size: data.length, offset,
    });
    offset += local.length + nameBytes.length + data.length;
  }

  const centralStart = offset;
  for (const c of central) {
    const header = [
      ...u32(0x02014B50), ...u16(20), ...u16(20), ...u16(0), ...u16(0),
      ...u16(time), ...u16(day),
      ...u32(c.crc), ...u32(c.size), ...u32(c.size),
      ...u16(c.nameBytes.length), ...u16(0), ...u16(0),
      ...u16(0), ...u16(0), ...u32(0),
      ...u32(c.offset),
    ];
    chunks.push(new Uint8Array(header), c.nameBytes);
    offset += header.length + c.nameBytes.length;
  }

  const end = [
    ...u32(0x06054B50), ...u16(0), ...u16(0),
    ...u16(central.length), ...u16(central.length),
    ...u32(offset - centralStart), ...u32(centralStart), ...u16(0),
  ];
  chunks.push(new Uint8Array(end));

  const total = chunks.reduce((n, c) => n + c.length, 0);
  const out = new Uint8Array(total);
  let at = 0;
  for (const c of chunks) { out.set(c, at); at += c.length; }
  return out;
}

export { crc32 };
