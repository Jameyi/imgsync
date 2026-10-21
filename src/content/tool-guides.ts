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
};

export const getGuide = (slug: string): ToolGuide | undefined => guides[slug];
