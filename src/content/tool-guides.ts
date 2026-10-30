export type GuideStep = { title: string; body: string };
export type GuideFaq = { question: string; answer: string };
export type ToolGuide = { steps: GuideStep[]; faqs: GuideFaq[] };

const guides: { [slug: string]: ToolGuide } = {
  "remove-white-background": {
    steps: [
      {
        title: "Drop your white-background photo",
        body: "Studio shots on plain white work best. The file stays in your browser.",
      },
      {
        title: "Set the tolerance",
        body: "The default covers most studio setups. Nudge it if edges keep a halo or pale product areas get erased.",
      },
      {
        title: "Download a transparent PNG",
        body: "Alpha is recalculated live as you adjust. Ready for any marketplace or template.",
      },
    ],
    faqs: [
      {
        question: "Will light gray count as background too?",
        answer:
          "Within the tolerance you choose. Segmentation is flood-fill from the border, so white fills inside the product are never cut out.",
      },
      {
        question: "Why is there still a white outline on dark themes?",
        answer:
          "Anti-aliased pixels keep a partial white tint. The defringe tool removes it — run it right after this one.",
      },
    ],
  },
  "platform-preflight": {
    steps: [
      {
        title: "Drop your main-image candidate",
        body: "The photo is analysed locally — nothing is uploaded. The subject is detected against its background automatically.",
      },
      {
        title: "Read the checks",
        body: "Subject-to-canvas ratio and minimum dimensions are checked against marketplace rules. Each check says pass or fail in plain words.",
      },
      {
        title: "Fix what failed",
        body: "Follow the fix-it links: the resize tool centres your subject on the right canvas, the background remover handles white-backdrop rejection.",
      },
    ],
    faqs: [
      {
        question: "How is the subject measured?",
        answer:
          "The tool segments the product from its background and takes the bounding box of the largest region. The ratio is that box's area over the full canvas — the same measurement marketplaces apply to main images.",
      },
      {
        question: "Why does my image fail the ratio check?",
        answer:
          "The product occupies too little of the canvas. Marketplaces like Amazon expect the subject to fill about 85% of the frame — crop tighter or use the resize tool to scale the subject up on the canvas.",
      },
    ],
  },
  "resize-to-preset": {
    steps: [
      {
        title: "Drop your product photo",
        body: "Any size works — the file stays in your browser the whole time.",
      },
      {
        title: "Pick a platform preset",
        body: "Amazon 2000×2000, Shopify 2048 and more. Your photo is scaled to fit and centred — never stretched.",
      },
      {
        title: "Download the ready image",
        body: "Leftover canvas is filled with clean white, the standard for marketplace main images.",
      },
    ],
    faqs: [
      {
        question: "Will my photo get stretched or distorted?",
        answer:
          "No. The aspect ratio is always kept. The photo is scaled to the largest size that fits the preset and centred on the canvas.",
      },
      {
        question: "What fills the empty space around my photo?",
        answer:
          "Solid white by default, which most marketplaces require. The fill colour can be changed before download.",
      },
    ],
  },
  "defringe-edges": {
    steps: [
      {
        title: "Drop your cutout PNG",
        body: "Any transparent PNG with a leftover white outline — from a background remover or a saved PSD. It stays in your browser.",
      },
      {
        title: "Defringe the edge",
        body: "One click scans the edge band and strips the white tint baked into semi-transparent pixels.",
      },
      {
        title: "Download the clean PNG",
        body: "Compare on a dark preview before you save. The halo is gone, the edge keeps its softness.",
      },
    ],
    faqs: [
      {
        question: "Why does my cutout glow white on dark backgrounds?",
        answer:
          "Anti-aliased edge pixels keep part of the old white background mixed in. Defringe unmixes that white from the color so only the subject's own tint remains.",
      },
      {
        question: "Will defringing blur or shrink my edges?",
        answer:
          "No. Only semi-transparent pixels touching full transparency are recolored. Alpha, dimensions and fully opaque areas stay exactly as they were.",
      },
    ],
  },
  "compress-to-size": {
    steps: [
      {
        title: "Drop your product photo",
        body: "JPEG, PNG or WebP. It stays in your browser.",
      },
      {
        title: "Enter your target in KB",
        body: "Match your marketplace limit. The tool searches the best quality that fits instead of a blind slider.",
      },
      {
        title: "Download the fitted JPEG",
        body: "Over target? The smallest usable picture is shown with an honest note and no further shrinking.",
      },
    ],
    faqs: [
      {
        question: "Why is the output always JPEG?",
        answer:
          "The size search needs a lossy codec, and JPEG is accepted by every marketplace. PNG and WebP presets are coming later.",
      },
      {
        question: "What if the image can't reach my target?",
        answer:
          "You get the closest possible result with a clear note. Raising the target is the honest fix — quality is never trashed silently.",
      },
    ],
  },
  "psd-export": {
    steps: [
      {
        title: "Drop two or more images",
        body: "Each image becomes one layer, top of the list first. Rename layers inline to keep the file tidy.",
      },
      {
        title: "Arrange the stack",
        body: "Reorder with the arrows, toggle visibility per layer. The PSD canvas matches the largest image unless you picture a specific size.",
      },
      {
        title: "Export the .psd",
        body: "The file downloads straight from your browser — open it in Photoshop, Photopea or GIMP with every layer intact.",
      },
    ],
    faqs: [
      {
        question: "Which apps can open the exported PSD?",
        answer:
          "Photoshop, Photopea and GIMP all read it. The file keeps layer names, order, offsets and visibility flags.",
      },
      {
        question: "Are my images uploaded anywhere?",
        answer:
          "No. The PSD is assembled in your browser and downloads locally — nothing touches a server, even for very large canvases (heavy builds run in a Web Worker).",
      },
    ],
  },
  compress: {
    steps: [
      {
        title: "Drop your image",
        body: "PNG, JPEG or WebP — the slider re-encodes any of them to a clean JPEG.",
      },
      {
        title: "Drag the quality slider",
        body: "The file size updates live as you drag. Stop at the smallest quality that still looks right to you.",
      },
      {
        title: "Download the JPEG",
        body: "The download name carries the quality level, so you can compare exports side by side.",
      },
    ],
    faqs: [
      {
        question: "How is this different from Compress to Size?",
        answer:
          "Compress to Size hunts for the quality that hits an exact KB target. This tool gives you the slider — you pick the trade-off visually instead.",
      },
      {
        question: "Why does a PNG input become a JPEG?",
        answer:
          "The size control needs a lossy codec and JPEG is accepted everywhere. If you need to keep transparency, use the background remover first and export PNG there.",
      },
    ],
  },
};

export const getGuide = (slug: string): ToolGuide | undefined => guides[slug];
