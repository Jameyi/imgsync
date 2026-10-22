export type ToolSlug =
  | "remove-white-background"
  | "compress-to-size"
  | "resize-to-preset"
  | "defringe-edges"
  | "platform-preflight";

export type ToolSpec = {
  slug: ToolSlug;
  name: string;
  title: string;
  description: string;
  implemented: boolean;
};

export const TOOLS: readonly ToolSpec[] = [
  {
    slug: "remove-white-background",
    name: "Remove white background",
    title: "Remove White Background from Image — Free Online PNG Tool",
    description:
      "Turn white-background product photos into transparent PNGs in your browser. Interior whites stay intact. Free, no uploads, no signup.",
    implemented: true,
  },
  {
    slug: "compress-to-size",
    name: "Compress to target size",
    title: "Compress Image to Target KB — Exact File Size Tool",
    description:
      "Compress any image to hit an exact KB target. Binary search over quality with downsampling fallback. Free and processed locally in your browser.",
    implemented: true,
  },
  {
    slug: "resize-to-preset",
    name: "Resize to platform presets",
    title: "Resize Image to Platform Presets — Amazon, Shopify, Instagram",
    description:
      "Resize product images to Amazon 2000×2000, Shopify 2048 and more with one click. Free, browser-based, no uploads.",
    implemented: true,
  },
  {
    slug: "defringe-edges",
    name: "Defringe white edges",
    title: "Remove White Edge Halo from Cutouts — Defringe PNG Tool",
    description:
      "Remove white halos left on cutout edges so transparent PNGs look clean on dark backgrounds. Free and processed locally in your browser.",
    implemented: true,
  },
  {
    slug: "platform-preflight",
    name: "Platform preflight",
    title: "Image Preflight Check — Amazon 85% Ratio and Platform Limits",
    description:
      "Check product images against marketplace rules before upload: subject-to-canvas ratio, dimensions and file size. Free and processed locally in your browser.",
    implemented: true,
  },
];

export const getTool = (slug: string): ToolSpec | undefined =>
  TOOLS.find((tool) => tool.slug === slug);
