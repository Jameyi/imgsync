export type ToolSlug =
  | "remove-white-background"
  | "compress-to-size"
  | "resize-to-preset"
  | "defringe-edges"
  | "platform-preflight"
  | "psd-export"
  | "compress"
  | "erase-object"
  | "format-convert"
  | "favicon-kit";

export type ToolSpec = {
  slug: ToolSlug;
  name: string;
  title: string;
  description: string;
  implemented: boolean;
  /** Display group on the /tools index page. */
  category: string;
};

export const TOOLS: readonly ToolSpec[] = [
  {
    slug: "remove-white-background",
    name: "Remove white background",
    title: "Remove White Background from Image — Free Online PNG Tool",
    description:
      "Turn white-background product photos into transparent PNGs in your browser. Interior whites stay intact. Free, no uploads, no signup.",
    implemented: true,
    category: "Background & cutouts",
  },
  {
    slug: "compress-to-size",
    name: "Compress to target size",
    title: "Compress Image to Target KB — Exact File Size Tool",
    description:
      "Compress any image to hit an exact KB target. Binary search over quality with downsampling fallback. Free and processed locally in your browser.",
    implemented: true,
    category: "Compression & size",
  },
  {
    slug: "resize-to-preset",
    name: "Resize to platform presets",
    title: "Resize Image to Platform Presets — Amazon, Shopify, Instagram",
    description:
      "Resize product images to Amazon 2000×2000, Shopify 2048 and more with one click. Free, browser-based, no uploads.",
    implemented: true,
    category: "Compression & size",
  },
  {
    slug: "defringe-edges",
    name: "Defringe white edges",
    title: "Remove White Edge Halo from Cutouts — Defringe PNG Tool",
    description:
      "Remove white halos left on cutout edges so transparent PNGs look clean on dark backgrounds. Free and processed locally in your browser.",
    implemented: true,
    category: "Background & cutouts",
  },
  {
    slug: "platform-preflight",
    name: "Platform preflight",
    title: "Image Preflight Check — Amazon 85% Ratio and Platform Limits",
    description:
      "Check product images against marketplace rules before upload: subject-to-canvas ratio, dimensions and file size. Free and processed locally in your browser.",
    implemented: true,
    category: "Marketplace compliance",
  },
  {
    slug: "psd-export",
    name: "Layered PSD export",
    title: "Export Images as Layered PSD Online — Free Photoshop File Maker",
    description:
      "Upload several images and export one layered PSD file, each image on its own layer with names, order and visibility. Free and processed locally in your browser.",
    implemented: true,
    category: "PSD & layers",
  },
  {
    slug: "compress",
    name: "Compress with quality slider",
    title: "Compress Image with Quality Slider — Live Size Preview Tool",
    description:
      "Drag the quality slider and see the file size update live. Re-encodes PNG and WebP sources to JPEG. Free and processed locally in your browser.",
    implemented: true,
    category: "Compression & size",
  },
  {
    slug: "erase-object",
    name: "Erase object and fill",
    title: "Remove Object from Photo Online — Free Erase and Fill Tool",
    description:
      "Brush over unwanted objects and let the surrounding scene fill the hole. Best for small cleanups like wires, litter and blemishes. Free and processed locally in your browser.",
    implemented: true,
    category: "Retouching",
  },
  {
    slug: "format-convert",
    name: "Convert image format",
    title: "Convert PNG, JPEG and WebP Online — Free Format Converter",
    description:
      "Convert images between JPEG, PNG and WebP with a live size comparison, and auto-straighten phone photos via EXIF. Free and processed locally in your browser.",
    implemented: true,
    category: "Compression & size",
  },
  {
    slug: "favicon-kit",
    name: "Favicon kit",
    title: "Generate Favicon ICO and PNG Set Online — Free Favicon Maker",
    description:
      "Upload one logo and get a complete favicon kit: multi-size .ico, 16/32/180/512 PNGs, ready-to-paste HTML links and a webmanifest snippet. Free and processed locally in your browser.",
    implemented: true,
    category: "Developer tools",
  },
];

export const getTool = (slug: string): ToolSpec | undefined =>
  TOOLS.find((tool) => tool.slug === slug);
