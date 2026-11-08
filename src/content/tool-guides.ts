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
  "erase-object": {
    steps: [
      {
        title: "Drop one photo",
        body: "Everything runs in your browser — nothing is uploaded.",
      },
      {
        title: "Brush over what you want gone",
        body: "Paint over the unwanted object; the red tint shows exactly what will be erased. Switch brush sizes for small details, and use Undo to fix a stroke.",
      },
      {
        title: "Fill the hole",
        body: "The surrounding scene spreads into the brushed area to fill it. This works best on small cleanups — wires, litter, blemishes — where the surroundings are fairly even.",
      },
      {
        title: "Download the PNG",
        body: "You get the filled photo as a PNG at the original size.",
      },
    ],
    faqs: [
      {
        question: "What kinds of objects does this erase well?",
        answer:
          "Small objects against even surroundings: wires on a wall, litter on a path, blemishes on a surface. The bigger and more textured the erased area, the blurrier the fill gets.",
      },
      {
        question: "Why does a large erased area look smudged?",
        answer:
          "The fill spreads colours in from the edges of your brush marks, so a big hole becomes a soft blend rather than a sharp reconstruction. Erase in smaller strokes, or keep the brush well inside the object's edges for the cleanest result.",
      },
      {
        question: "Is my photo uploaded anywhere?",
        answer:
          "No. The filling runs locally in your browser; your photo never leaves the device.",
      },
    ],
  },
  "format-convert": {
    steps: [
      {
        title: "Drop an image",
        body: "JPEG, PNG or WebP in — nothing is uploaded. Phone photos are auto-straightened using their EXIF orientation.",
      },
      {
        title: "Pick the target format",
        body: "Choose JPEG, PNG or WebP. JPEG and WebP show a quality slider; PNG stays lossless.",
      },
      {
        title: "Check the size comparison",
        body: "The converted size updates live next to the original, so you can pick the format that best fits your platform's limits.",
      },
      {
        title: "Download the converted file",
        body: "You get the image in the new format with the same dimensions and a correctly named file.",
      },
    ],
    faqs: [
      {
        question: "Which format should I convert to?",
        answer:
          "JPEG for universal acceptance on marketplaces, WebP for the smallest files on modern platforms, and PNG when you need transparency or a lossless copy.",
      },
      {
        question: "Does converting re-encode and lose quality?",
        answer:
          "JPEG and WebP are lossy: the quality slider trades file size against fidelity, and the live preview shows the resulting size. PNG conversion is lossless.",
      },
      {
        question: "Will my phone photo come out sideways?",
        answer:
          "No. The tool reads the EXIF orientation tag and rotates the pixels before converting, so the download is upright everywhere.",
      },
    ],
  },
  "favicon-kit": {
    steps: [
      {
        title: "Drop your logo",
        body: "A square PNG with transparency works best — nothing is uploaded. Non-square logos are centered on a transparent square.",
      },
      {
        title: "Generate the kit",
        body: "One click renders every size from the same source: 16, 32 and 48 pixels go into a single .ico; 16, 32, 180 and 512 come out as PNGs.",
      },
      {
        title: "Download the files",
        body: "Grab favicon.ico for the classic browser fallback and the PNGs for modern links and app icons.",
      },
      {
        title: "Paste the wiring",
        body: "Copy the ready-made HTML link tags into your <head> and the icons array into your site.webmanifest.",
      },
    ],
    faqs: [
      {
        question: "Which sizes do browsers actually need?",
        answer:
          "The .ico with 16/32/48 covers classic browser tabs and shortcuts; favicon-16x16.png and favicon-32x32.png cover modern favicons; the 180px apple-touch-icon covers iOS home screens; the 512px icon covers Android and PWA manifests.",
      },
      {
        question: "My logo is not square — what happens?",
        answer:
          "It is scaled down and centered on a transparent square, so nothing is cropped or stretched. For pixel-perfect results, upload a square export from your design tool.",
      },
      {
        question: "Is anything uploaded?",
        answer:
          "No. Resizing and encoding run locally in your browser; your logo never leaves the device.",
      },
    ],
  },
  "image-composite": {
    steps: [
      {
        title: "Drop the backdrop first, then the product photo",
        body: "The backdrop sets the output size — a supplier template, marketplace hero frame or any scene image. Nothing is uploaded.",
      },
      {
        title: "Choose how the product fits the backdrop",
        body: "Contain keeps the whole product visible, cover fills the frame and crops the overflow, stretch fills exactly.",
      },
      {
        title: "Place and scale the product",
        body: "Pick one of the nine alignment presets and drag the scale slider until the product sits naturally on the backdrop.",
      },
      {
        title: "Download the composed PNG",
        body: "You get one flattened PNG at the backdrop's size, ready for marketplace upload.",
      },
    ],
    faqs: [
      {
        question: "Can I use a transparent product PNG as the foreground?",
        answer:
          "Yes — transparent areas let the backdrop show through, which is the main use case: cut out your product first (white background remover), then place it on any scene.",
      },
      {
        question: "What decides the output size?",
        answer:
          "The backdrop. Whatever size your background template is, the composed PNG comes out at exactly that size, so it keeps the template's marketplace-safe dimensions.",
      },
      {
        question: "Is my composition uploaded anywhere?",
        answer:
          "No. Both images are processed locally in your browser; neither file leaves the device.",
      },
    ],
  },
  "smooth-edges": {
    steps: [
      {
        title: "Drop a transparent PNG",
        body: "The smoother works on the alpha channel of a cutout — a white-background remover export is the ideal input. Nothing is uploaded.",
      },
      {
        title: "Pick a strength",
        body: "Light softens the staircase once, Standard twice, Strong three times. Each pass widens the gradient band along the edge.",
      },
      {
        title: "Compare and download",
        body: "The preview shows the softened result. Colours are untouched — only the boundary alpha becomes a gradient.",
      },
      {
        title: "Download the PNG",
        body: "You get the same image as a PNG with smoother, antialiased-looking edges.",
      },
    ],
    faqs: [
      {
        question: "How is this different from the defringe tool?",
        answer:
          "Defringe removes coloured fringe halos on cutout edges; this tool softens hard stair-stepped alpha boundaries. Use the smoother for jagged edges, defringe for white or coloured halos — they compose well in either order.",
      },
      {
        question: "Does smoothing change my colours?",
        answer:
          "No. Only the alpha channel along transparency boundaries is averaged; every pixel's red, green and blue bytes stay exactly as they were.",
      },
      {
        question: "Which strength should I choose?",
        answer:
          "Start with Light for small icons and thin shapes, Standard for typical product cutouts, Strong only for large images with pronounced staircasing — stronger settings widen the soft band.",
      },
    ],
  },
  "batch-convert": {
    steps: [
      {
        title: "Drop up to 30 images",
        body: "Select or drag a whole folder of product photos — every file stays on your device.",
      },
      {
        title: "Pick the target format and quality",
        body: "JPEG, PNG or WebP. Lossy formats show a quality slider that applies to every file in the batch.",
      },
      {
        title: "Run the batch",
        body: "Files convert in parallel and each result is listed with its own status — a single failure never blocks the rest.",
      },
      {
        title: "Download one zip",
        body: "All converted files come back in a single imgsync-batch archive, named after the original stems.",
      },
    ],
    faqs: [
      {
        question: "How many files can I convert at once?",
        answer:
          "Up to 30 per batch. Need more? Run a second batch — there is no daily limit and nothing is stored.",
      },
      {
        question: "What happens if one file fails?",
        answer:
          "It is reported in the failed list with its reason, and every other file still converts normally. The zip contains the successful ones.",
      },
      {
        question: "Are the original files modified?",
        answer:
          "No. Sources are read-only; every result is a new file with the target format's extension, bundled into one zip download.",
      },
    ],
  },
  "rounded-corners": {
    steps: [
      {
        title: "Drop an image",
        body: "Any PNG or JPEG works — nothing is uploaded. Transparency is preserved end to end.",
      },
      {
        title: "Set the corner radius and padding",
        body: "Drag the radius slider to round the corners and the padding slider to add canvas space around the image — room the shadow can breathe in.",
      },
      {
        title: "Add a border and a shadow",
        body: "Give the frame a colored border (hex) and pick a shadow preset; the shadow is the image silhouette blurred behind it, offset downward.",
      },
      {
        title: "Download the framed PNG",
        body: "The export is a PNG at the padded canvas size — transparent, white, or your chosen background.",
      },
    ],
    faqs: [
      {
        question: "Why does my shadow need padding?",
        answer:
          "The shadow is drawn on the canvas around the image. Without padding there is no canvas for it to fall on, so turning on a shadow automatically adds extra canvas room.",
      },
      {
        question: "Does the border cover rounded corners?",
        answer:
          "No. Corner pixels clipped by the radius stay transparent — the border only paints pixels that are still part of the image, so the rounded shape stays clean.",
      },
      {
        question: "Will my colors shift?",
        answer:
          "No. The frame composites in straight alpha; your image pixels are only covered where the border or shadow layer sits on top of them.",
      },
    ],
  },
  "text-watermark": {
    steps: [
      {
        title: "Drop an image",
        body: "Any PNG or JPEG works — nothing is uploaded, and the result keeps the original size.",
      },
      {
        title: "Type the watermark text",
        body: "A name, handle or copyright line. Set the font size and a hex color — white with reduced opacity is the classic look.",
      },
      {
        title: "Choose centered or tiled",
        body: "Centered stamps the text once at a nine-grid position; Tiled repeats it across the whole image at a fixed spacing with a slight tilt.",
      },
      {
        title: "Dial the opacity and download",
        body: "Lower opacity keeps the photo readable while the mark stays visible. Export as PNG.",
      },
    ],
    faqs: [
      {
        question: "Does the watermark survive resizing later?",
        answer:
          "It is stamped into the pixels, so treat the exported file as the protected copy and keep an unwatermarked original elsewhere.",
      },
      {
        question: "Which opacity should I use?",
        answer:
          "40–60% keeps the photo readable while staying visible on busy scenes. Above 70% the mark starts to dominate; below 30% it can disappear on light areas.",
      },
      {
        question: "Can I watermark many photos at once?",
        answer:
          "This tool processes one image per pass. For batches, run each photo through here, or watch for the batch pipeline bringing watermarking to multiple files.",
      },
    ],
  },
  "device-mockup": {
    steps: [
      {
        title: "Drop a screenshot",
        body: "Any app or website screenshot works — the shell is drawn from geometry, so the screen keeps full resolution.",
      },
      {
        title: "Pick a device preset",
        body: "Phone uses a thin bezel with a large screen radius; Tablet uses a thicker shell. Fine-tune the bezel, screen radius and padding to taste.",
      },
      {
        title: "Choose shell and background colors",
        body: "The shell takes any hex color; the canvas behind the device stays transparent or takes a solid color for immediate use on any page.",
      },
      {
        title: "Download the mockup PNG",
        body: "The export is a PNG at the padded canvas size — drop it straight into docs, slides or landing pages.",
      },
    ],
    faqs: [
      {
        question: "Why is there no laptop frame?",
        answer:
          "Laptops need a base shape that isn't a rounded rectangle, which would require drawn polygon geometry rather than pure pixel math. Phone and tablet shells cover the common cases; laptop frames are on the roadmap.",
      },
      {
        question: "What happens to my screenshot's transparent areas?",
        answer:
          "The screen is composited over the shell, so transparent screen pixels show the bezel color beneath — the same way a real device renders.",
      },
      {
        question: "Why does the mockup look better with padding?",
        answer:
          "The shell's rounded corners and any drop shadows need room to breathe. A little canvas padding keeps the device silhouette from touching the image edge.",
      },
    ],
  },
};

export const getGuide = (slug: string): ToolGuide | undefined => guides[slug];
