/**
 * ICO container writer (PRD F12): bundles square PNG payloads into one
 * .ico file. PNG encoding itself happens on canvas in the orchestration
 * layer — this module only assembles the container. Pure functions, no DOM.
 */

const ICONDIR_SIZE = 6;
const ICONDIRENTRY_SIZE = 16;

export type IcoEntry = {
  width: number;
  height: number;
  /** Complete PNG payload (signature first) for this size. */
  png: Uint8Array;
};

/**
 * Builds a .ico file from PNG entries. Throws when the list is empty.
 * Entry width/height are written as bytes; 256 would encode as 0 per the
 * ICO spec, which the favicon kit sizes (16/32/48) never reach.
 */
export const buildIco = (entries: readonly IcoEntry[]): ArrayBuffer => {
  if (!entries || entries.length === 0) {
    throw new Error("buildIco requires at least one entry");
  }
  const totalSize =
    ICONDIR_SIZE + ICONDIRENTRY_SIZE * entries.length +
    entries.reduce((sum, entry) => sum + entry.png.length, 0);
  const out = new Uint8Array(totalSize);
  const view = new DataView(out.buffer);

  // ICONDIR
  view.setUint16(0, 0, true); // reserved
  view.setUint16(2, 1, true); // type: icon
  view.setUint16(4, entries.length, true);

  // ICONDIRENTRY array, then payloads in order.
  let dataOffset = ICONDIR_SIZE + ICONDIRENTRY_SIZE * entries.length;
  entries.forEach((entry, i) => {
    const base = ICONDIR_SIZE + ICONDIRENTRY_SIZE * i;
    out[base] = entry.width & 0xff; // 0 encodes 256 — not reached by kit sizes
    out[base + 1] = entry.height & 0xff;
    out[base + 2] = 0; // color count (0 for PNG)
    out[base + 3] = 0; // reserved
    view.setUint16(base + 4, 1, true); // color planes
    view.setUint16(base + 6, 32, true); // bits per pixel
    view.setUint32(base + 8, entry.png.length, true);
    view.setUint32(base + 12, dataOffset, true);
    out.set(entry.png, dataOffset);
    dataOffset += entry.png.length;
  });
  return out.buffer;
};

/** Output file names shared by the workbench downloads and the snippet. */
export const FAVICON_FILES = {
  ico: "favicon.ico",
  png16: "favicon-16x16.png",
  png32: "favicon-32x32.png",
  png180: "apple-touch-icon.png",
  png512: "icon-512x512.png",
} as const;

/** Absolute-path prefix for snippets; empty keeps deployment-root-relative. */
const joinPath = (siteUrl: string | undefined, file: string): string =>
  siteUrl ? `${siteUrl.replace(/\/+$/, "")}/${file}` : `/${file}`;

/**
 * Ready-to-paste HTML <link> wiring for the generated favicon files.
 * Paths are root-absolute so the snippet works on any deployment root.
 */
export const buildFaviconSnippet = (siteUrl?: string): string => {
  const p = (file: string) => joinPath(siteUrl, file);
  return [
    `<link rel="icon" href="${p(FAVICON_FILES.png16)}" sizes="16x16" type="image/png">`,
    `<link rel="icon" href="${p(FAVICON_FILES.png32)}" sizes="32x32" type="image/png">`,
    `<link rel="icon" href="${p(FAVICON_FILES.ico)}" sizes="48x48">`,
    `<link rel="apple-touch-icon" href="${p(FAVICON_FILES.png180)}" sizes="180x180">`,
    `<link rel="icon" href="${p(FAVICON_FILES.png512)}" sizes="512x512" type="image/png">`,
  ].join("\n");
};

/**
 * site.webmanifest content naming the PNG sizes, for copy-paste into the
 * developer's own manifest or use as a standalone file.
 */
export const buildWebmanifest = (siteUrl?: string): string => {
  const icon = (file: string, size: string) => ({
    src: joinPath(siteUrl, file),
    sizes: size,
    type: "image/png",
    purpose: "any",
  });
  return JSON.stringify(
    {
      icons: [
        icon(FAVICON_FILES.png32, "32x32"),
        icon(FAVICON_FILES.png180, "180x180"),
        icon(FAVICON_FILES.png512, "512x512"),
      ],
    },
    null,
    2,
  );
};
