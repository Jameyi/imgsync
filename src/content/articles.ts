export type ArticleSection = {
  heading: string;
  text: string;
  items?: string[];
};

export type Article = {
  slug: string;
  title: string;
  summary: string;
  date: string;
  category: string;
  body: ArticleSection[];
  relatedTools: string[];
  faqs: { question: string; answer: string }[];
};

export const articles: Article[] = [
  {
    slug: "amazon-main-image-requirements",
    title: "Amazon Main Image Requirements: The Complete 2026 Checklist",
    summary:
      "Every rule Amazon applies to a main product image — pure white background, 85% subject ratio, minimum 1600px, no props or text — and how to pass them all on the first upload.",
    date: "2026-10-28",
    category: "MARKETPLACE RULES",
    body: [
      {
        heading: "Why Amazon rejects main images",
        text: "Amazon suppresses or blocks listings whose main image violates its style rules. Most rejections come from five causes: the background is not pure white, the product fills too little of the frame, the image is too small, the file exceeds the size limit, or the image contains text, logos, or props. Every one of these is checkable before you upload.",
      },
      {
        heading: "The five rules that matter",
        text: "Amazon's product image requirements for a main image boil down to:",
        items: [
          "Pure white background — RGB 255,255,255, no gradients, no shadows that read as a background",
          "85% rule — the product must fill at least 85% of the image frame",
          "Minimum size — at least 1600px on the longest side (1000px minimum to enable zoom; 1600px is the safe target)",
          "File format — JPEG preferred, PNG accepted; file size up to 10MB",
          "No extras — no text, watermarks, borders, props, or additional items in the main image",
        ],
      },
      {
        heading: "Check the 85% ratio before you upload",
        text: "The subject-to-canvas ratio is the rule sellers misjudge most. A product shot that looks full can sit at 70% and still get flagged. Measure it: find the bounding box of your product, compare its width and height against the canvas, and scale up until the larger dimension reaches 85% of the frame with a small margin. The Platform Preflight tool does this automatically and reports the exact ratio.",
      },
      {
        heading: "Fix the background to true white",
        text: "Studio photos rarely produce a pure 255 white — lighting leaves a faint gray or warm cast. Convert near-white pixels to transparent, then composite onto a pure white canvas, and the background passes Amazon's check. The Remove White Background tool handles the conversion; keep tolerance low enough to preserve product edges.",
      },
      {
        heading: "Resize to the right canvas",
        text: "For a square product, export at 2000×2000. Use a marketplace preset that scales your product to the 85% line inside the canvas instead of stretching it — stretching distorts the product and creates a new rejection reason. Resize to Preset includes Amazon presets that do the scaling for you.",
      },
      {
        heading: "Run a preflight, then upload",
        text: "Before spending a listing slot on a rejection, run the image through Platform Preflight: it checks subject ratio, minimum dimensions, and file size in one pass and tells you exactly which rule fails. Fix, re-run, then upload.",
      },
    ],
    relatedTools: ["platform-preflight", "remove-white-background", "resize-to-preset"],
    faqs: [
      {
        question: "What size does an Amazon main image need to be?",
        answer:
          "At least 1600px on the longest side. Amazon enables the zoom feature at 1000px, but 1600px is the safe target so the zoom works on every device.",
      },
      {
        question: "What is the 85% rule on Amazon?",
        answer:
          "The main product image must fill at least 85% of the canvas. Measure your product's bounding box against the frame and scale up until the longer dimension reaches 85%, leaving a small margin.",
      },
      {
        question: "Does Amazon allow PNG for main images?",
        answer:
          "Yes, JPEG is preferred but PNG is accepted, up to 10MB. The background must still be pure white — a transparent PNG exported over a white canvas passes.",
      },
    ],
  },
  {
    slug: "compress-product-images-to-marketplace-limits",
    title: "How to Compress Product Images to Marketplace Size Limits",
    summary:
      "Amazon, eBay, and Etsy all cap upload file sizes. Learn how quality-based compression works, why quality sliders alone overshoot, and how to hit an exact KB target without visible quality loss.",
    date: "2026-10-28",
    category: "COMPRESSION",
    body: [
      {
        heading: "The size limits you will hit",
        text: "Marketplaces cap uploads at the file level: Amazon accepts images up to 10MB but the zoom feature works best under 1MB per image, eBay caps pictures at 7MB, and Etsy recommends staying under 1MB for fast gallery loading. Listing tools that bulk-upload often enforce their own lower caps. Missing the limit means a failed upload or, worse, slow galleries that cost conversions.",
      },
      {
        heading: "Why a quality slider is the wrong tool",
        text: "A quality slider changes the JPEG quality factor and you find out what size you got only after export. At quality 80 a product photo might be 380KB; at 75 it might be 210KB. If your target is 100KB, you are guessing your way down in the dark, re-exporting repeatedly, and each guess degrades the image differently.",
      },
      {
        heading: "Binary search on quality hits the target",
        text: "The reliable method: binary-search the quality parameter. Start at 90, encode, check the size; halve the range toward the target until the output lands just under the limit. Combined with a fallback that downsamples the longest side when quality alone cannot reach the target, this converges on an exact file size in a handful of steps. Compress to Size implements exactly this: you set the target in KB and get a file under it, without manual iteration.",
      },
      {
        heading: "How far can you compress?",
        text: "For typical product photos on a plain background, JPEG quality 70-80 is visually indistinguishable from the original at listing size. Below quality 50 you start seeing blocking around edges and text. As a rule of thumb, a 3000×3000 white-background product shot compresses to 100-200KB with no visible loss — well under every marketplace cap.",
      },
      {
        heading: "Compression checklist",
        text: "Before uploading anywhere:",
        items: [
          "Export at the display resolution, not camera resolution",
          "Target under 1MB for gallery images; under 200KB is comfortable",
          "Keep a lossless master — compression is one-way",
          "Check the compressed file for edge artifacts on high-contrast product edges",
        ],
      },
    ],
    relatedTools: ["compress-to-size"],
    faqs: [
      {
        question: "How do I compress an image to exactly 100KB?",
        answer:
          "Use binary search over the JPEG quality parameter: encode, check the size, and halve the quality range toward your target until the file lands just under 100KB. The Compress to Size tool automates this — you set the target and it converges in a few steps.",
      },
      {
        question: "What is the maximum image size for eBay listings?",
        answer:
          "eBay caps picture uploads at 7MB per image and allows up to 24 pictures per listing. For fast-loading galleries, aim for well under that — a few hundred KB per image is comfortable.",
      },
      {
        question: "Does compressing a JPEG reduce its quality?",
        answer:
          "Some information is always discarded, but at quality 70-80 product photos are visually indistinguishable from the original at listing size. Visible blocking usually appears below quality 50.",
      },
    ],
  },
  {
    slug: "pure-white-background-rgb-255-255-255",
    title: "Why Your Product Background Must Be RGB 255,255,255 — and How to Get There",
    summary:
      "Amazon requires a pure white main-image background, but camera white balance and JPEG compression leave near-white pixels. Here is why 254 is a rejection and how to fix it without losing edges.",
    date: "2026-10-28",
    category: "IMAGE EDITING",
    body: [
      {
        heading: "What 'pure white' actually means",
        text: "A pure white pixel has equal red, green, and blue channels at 255. Anything at 254 or below is technically a shade of gray — invisible to your eye on most screens, but detectable by Amazon's automated checks and by any print or compositing pipeline downstream. The gap between 'looks white' and 'is white' is where rejections happen.",
      },
      {
        heading: "Why your studio shots are not 255",
        text: "Three forces work against you: camera white balance introduces a color cast (usually warm), studio lighting falls off toward the corners creating a gradient, and JPEG compression bleeds color values around edges. A photo that measures 250-253 across the background is typical straight out of camera.",
      },
      {
        heading: "The two ways to fix it",
        text: "Option one: levels adjustment. Pull the white point down to your background's brightest value — every pixel above it becomes 255. Fast, but it clips near-white product details too. Option two: convert near-white to transparency with a tolerance that captures the background but not the product, then composite on a true white canvas. This preserves soft product edges and is what Remove White Background does — tolerance in, transparent PNG out.",
      },
      {
        heading: "Watch the edges",
        text: "Cutting a product off a near-white background leaves a halo: semi-transparent edge pixels blended with the old background color. On a pure white canvas the halo is invisible, but if you ever place the cutout on a colored background it shows as a white fringe. Defringe Edges removes it by re-estimating edge pixel colors from the surrounding product colors.",
      },
      {
        heading: "Verify before upload",
        text: "Spot-check the four corners and the area immediately around your product: all should read 255,255,255 in any color picker. If you are batch-preparing listings, Platform Preflight's background check does this across a whole image in one pass.",
      },
    ],
    relatedTools: ["remove-white-background", "defringe-edges", "platform-preflight"],
    faqs: [
      {
        question: "What RGB value is pure white?",
        answer:
          "Pure white is RGB 255,255,255 — every channel at maximum. A background measuring 254 or below is technically gray, and automated marketplace checks can flag it.",
      },
      {
        question: "Why is my photo background not 255 white?",
        answer:
          "Camera white balance introduces a color cast, studio lighting falls off toward the corners, and JPEG compression shifts values around edges. Backgrounds measuring 250-253 straight out of camera are typical.",
      },
      {
        question: "How do I make a background pure white without losing product edges?",
        answer:
          "Convert near-white pixels to transparency with a controlled tolerance, then composite the cutout onto a true white canvas. This preserves soft product edges better than a blanket levels adjustment.",
      },
    ],
  },
  {
    slug: "remove-white-halo-after-cutout",
    title: "How to Remove the White Halo Left Behind by Background Removal",
    summary:
      "Cutout images carry a faint white fringe from the original background. It ruins product shots on dark or colored backgrounds — here is what causes it and how to defringe it properly.",
    date: "2026-10-28",
    category: "IMAGE EDITING",
    body: [
      {
        heading: "What the halo is",
        text: "When a cutout is made, edge pixels are not cleanly product or background — they are a blend. A pixel at the edge of a red product on white background might be stored as pink at 50% alpha. Place that cutout on a black background and the blend resolves to a visible white-pink fringe tracing the product contour. Sellers know it as the halo, and it is the single most common complaint after background removal.",
      },
      {
        heading: "Why most tools leave it",
        text: "Background removers optimize for a clean mask, not for edge color. Their output is honest — the edge pixels really are semi-transparent blends — but nobody re-estimates what those pixels should look like in their new context. Manual fixing in an editor means painting the edge pixel by pixel, which no one does at listing volume.",
      },
      {
        heading: "How defringing works",
        text: "Defringing re-derives each edge pixel's color from the product side, not the background side. For every semi-transparent pixel, look at the fully opaque product colors nearby, estimate the true product color under the blend, and rewrite the pixel so its color is pure product and only its alpha carries the softness. The result: soft, anti-aliased edges with zero background contamination. Defringe Edges does this in the browser in seconds.",
      },
      {
        heading: "When to defringe",
        text: "Run a defringe whenever a cutout will sit on anything that is not white:",
        items: [
          "Colored detail-page backgrounds (dark backgrounds make the fringe most visible)",
          "Composited lifestyle shots — product placed into a scene template",
          "Marketplace images that allow non-white secondary backgrounds",
          "Social media and ad creatives built from catalog cutouts",
        ],
      },
      {
        heading: "Verify the fix",
        text: "Drop the defringed cutout onto a black canvas. Any remaining fringe pops out instantly against black. If edges are clean there, they are clean everywhere.",
      },
    ],
    relatedTools: ["defringe-edges", "remove-white-background"],
    faqs: [
      {
        question: "Why does my cutout image have white edges?",
        answer:
          "Edge pixels from background removal are semi-transparent blends of the product and the old background. On any non-white surface the blend resolves into a visible white fringe, also called a halo.",
      },
      {
        question: "How do I remove the white halo from a cutout?",
        answer:
          "Run a defringe: each semi-transparent edge pixel is re-colored from the surrounding product colors so only its alpha carries the softness. The Defringe Edges tool does this in the browser in seconds.",
      },
      {
        question: "How can I check if the fringe is gone?",
        answer:
          "Place the cutout on a black background. Any remaining fringe pops out instantly against black — if the edges are clean there, they are clean everywhere.",
      },
    ],
  },
  {
    slug: "ebay-etsy-shopify-image-size-requirements",
    title: "eBay, Etsy, and Shopify Image Size Requirements: 2026 Quick Reference",
    summary:
      "Exact pixel dimensions, ratio rules, and file limits for the three big non-Amazon marketplaces, with a workflow to make one product photo satisfy all of them.",
    date: "2026-10-28",
    category: "MARKETPLACE RULES",
    body: [
      {
        heading: "The numbers per platform",
        text: "Requirements differ more in the details than the headline dimensions:",
        items: [
          "eBay — minimum 500px on the longest side, 1600px+ recommended for zoom; up to 24 pictures per listing; 7MB file cap; no borders or placeholder art",
          "Etsy — at least 2000px wide for shop-quality display; 5:4 ratio recommended for listings; 1MB or less keeps galleries fast; first photo is the thumbnail so keep the product centered",
          "Shopify — square 2048×2048 recommended for product cards; 4:5 or 1:1 both render well; under 20MB but 300KB or less keeps storefront speed scores high",
        ],
      },
      {
        heading: "One photo, many canvases",
        text: "You do not need separate photoshoots per platform — you need the same cutout placed on differently sized canvases. The workflow: cut the product onto transparency once, then for each platform scale the product to that platform's fill ratio on the right canvas size. This keeps color, sharpness, and framing consistent across every listing while the canvas does the platform-specific work.",
      },
      {
        heading: "Ratio pitfalls",
        text: "Etsy's 5:4 and a marketplace square like eBay's 1:1 cannot come from the same crop without cutting into the product or adding padding. The safe pattern: fit the product into the smaller canvas with margin (never stretch), let the larger canvas center it with proportionally more background. Resize to Preset ships platform presets that encode exactly this: contain-scaling with the platform's fill ratio, no distortion.",
      },
      {
        heading: "File weight matters as much as pixels",
        text: "Etsy galleries and Shopify storefronts are performance-sensitive: oversized images slow page loads and Etsy's search rewards fast-loading shops. After resizing, compress to the target — under 1MB for Etsy, a few hundred KB for Shopify product cards. Compress to Size lets you hit each platform's number exactly.",
      },
      {
        heading: "A five-minute pre-upload routine",
        text: "For each platform: check dimensions against the table above, verify the subject fills the recommended ratio, compress to the file target, and spot-check the first image (it is the thumbnail everywhere). Platform Preflight encodes this table and reports pass/fail per rule so the routine runs in seconds.",
      },
    ],
    relatedTools: ["resize-to-preset", "platform-preflight", "compress-to-size"],
    faqs: [
      {
        question: "What is the minimum image size for eBay?",
        answer:
          "500px on the longest side, but eBay recommends 1600px or more so the zoom feature works. Listings can carry up to 24 pictures with a 7MB per-file cap.",
      },
      {
        question: "What image size does Etsy recommend?",
        answer:
          "At least 2000px wide, with a 5:4 aspect ratio for listing photos. Keep the product centered — the first photo becomes your shop thumbnail — and stay near 1MB for fast galleries.",
      },
      {
        question: "What size should Shopify product images be?",
        answer:
          "Square 2048×2048 is the recommended target for product cards. Keep files to a few hundred KB so storefront page-speed scores stay high.",
      },
    ],
  },
];
