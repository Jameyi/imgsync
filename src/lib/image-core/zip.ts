/**
 * Store-method ZIP container writer (PRD F06): bundles payload entries into
 * one .zip archive without re-compressing (images are already compressed
 * formats). Pure functions over bytes — no DOM, zero dependencies.
 */

const LOCAL_SIG = 0x04034b50; // "PK\x03\x04"
const CENTRAL_SIG = 0x02014b50; // "PK\x01\x02"
const EOCD_SIG = 0x06054b50; // "PK\x05\x06"

let crcTable: Uint32Array | undefined;

const crcTableFor = (): Uint32Array => {
  if (crcTable) return crcTable;
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  crcTable = table;
  return table;
};

/** Standard CRC-32 (IEEE 802.3, reflected). Empty input returns 0. */
export const crc32 = (bytes: Uint8Array): number => {
  const table = crcTableFor();
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc = table[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
};

export type ZipEntry = {
  name: string;
  data: Uint8Array;
};

/**
 * Builds a store-method zip from entries. Throws when the list is empty.
 * Layout: local file headers + payloads, central directory, EOCD record.
 */
export const buildZip = (entries: readonly ZipEntry[]): ArrayBuffer => {
  if (!entries || entries.length === 0) {
    throw new Error("buildZip requires at least one entry");
  }
  const encoder = new TextEncoder();
  const nameBytes = entries.map((entry) => encoder.encode(entry.name));
  const parts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;
  entries.forEach((entry, i) => {
    const name = nameBytes[i];
    const crc = crc32(entry.data);
    const local = new Uint8Array(30 + name.length + entry.data.length);
    const view = new DataView(local.buffer);
    view.setUint32(0, LOCAL_SIG, true);
    view.setUint16(4, 20, true); // version needed
    view.setUint16(6, 0, true); // flags
    view.setUint16(8, 0, true); // method: store
    view.setUint16(10, 0, true); // mod time
    view.setUint16(12, 0x21, true); // mod date (1980-01-01)
    view.setUint32(14, crc, true);
    view.setUint32(18, entry.data.length, true); // compressed
    view.setUint32(22, entry.data.length, true); // uncompressed
    view.setUint16(26, name.length, true);
    view.setUint16(28, 0, true); // extra length
    local.set(name, 30);
    local.set(entry.data, 30 + name.length);
    parts.push(local);
    offset += local.length;

    const central = new Uint8Array(46 + name.length);
    const cview = new DataView(central.buffer);
    cview.setUint32(0, CENTRAL_SIG, true);
    cview.setUint16(4, 20, true); // version made by
    cview.setUint16(6, 20, true); // version needed
    cview.setUint16(8, 0, true); // flags
    cview.setUint16(10, 0, true); // method: store
    cview.setUint16(12, 0, true); // mod time
    cview.setUint16(14, 0x21, true); // mod date
    cview.setUint32(16, crc, true);
    cview.setUint32(20, entry.data.length, true); // compressed
    cview.setUint32(24, entry.data.length, true); // uncompressed
    cview.setUint16(28, name.length, true);
    cview.setUint16(30, 0, true); // extra
    cview.setUint16(32, 0, true); // comment
    cview.setUint16(34, 0, true); // disk start
    cview.setUint16(36, 0, true); // internal attrs
    cview.setUint32(38, 0, true); // external attrs
    cview.setUint32(42, offset - local.length, true); // local header offset
    central.set(name, 46);
    centralParts.push(central);
  });
  const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
  const eocd = new Uint8Array(22);
  const eview = new DataView(eocd.buffer);
  eview.setUint32(0, EOCD_SIG, true);
  eview.setUint16(4, 0, true); // disk number
  eview.setUint16(6, 0, true); // central dir disk
  eview.setUint16(8, entries.length, true); // entries this disk
  eview.setUint16(10, entries.length, true); // entries total
  eview.setUint32(12, centralSize, true);
  eview.setUint32(16, offset, true); // central dir offset
  eview.setUint16(20, 0, true); // comment length

  const all = [...parts, ...centralParts, eocd];
  const out = new Uint8Array(all.reduce((sum, part) => sum + part.length, 0));
  let cursor = 0;
  for (const part of all) {
    out.set(part, cursor);
    cursor += part.length;
  }
  return out.buffer;
};
