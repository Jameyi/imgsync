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
  {
    slug: "remove-bg-shutting-down-free-alternatives",
    title: "remove.bg Is Shutting Down December 1: What Happens and the Free Alternatives",
    summary:
      "remove.bg's standalone site closes December 1, 2026 at 9:00 CET — credits expire that morning. What happens to your account and API, the data to rescue first, and free browser-based alternatives for product photos.",
    date: "2026-11-06",
    category: "INDUSTRY NEWS",
    body: [
      {
        heading: "What actually happens on December 1",
        text: "remove.bg's own FAQ states that its standalone website will no longer be available from December 1, 2026 at 9:00 a.m. CET. Background removal moves into Canva, which acquired remove.bg in 2021, and the self-service API moves to Leonardo.Ai — also a Canva company. The Photoshop plugin and the other plugins and integrations are discontinued the same day. Enterprise API contracts are the one exception: they continue as normal. This is not a migration — accounts, history and credit balances do not carry over to either destination.",
      },
      {
        heading: "Rescue your data before the cutoff",
        text: "Three things die at 9:00 a.m. CET on December 1, and one of them has no recovery path:",
        items: [
          "Unused pay-as-you-go credits expire that morning and are non-refundable — spend them on your backlog first",
          "Annual subscriptions end with an automatic pro-rata refund to the original payment method; any final monthly renewal on or after November 1 is free",
          "Invoices and credit usage reports must be downloaded from the Account page before December 1 — remove.bg states you won't be able to download them afterward",
          "Export any processed images you still need; account history is not migrating anywhere",
        ],
      },
      {
        heading: "Where background removal goes — and where it doesn't",
        text: "The short version \"remove.bg moves to Canva\" is wrong for two of the three groups affected. If you used the website for one-off cutouts, remove.bg points you to Canva's Background Remover, which uses the same underlying technology. If you called the API, your destination is Leonardo.Ai, not Canva — the self-service API stops accepting requests on December 1 and a Canva subscription does not cover it. Leonardo's migration guide documents a different endpoint, Bearer authentication instead of the X-Api-Key header, JSON-only requests, and prepaid credit billing. If you held credits, neither destination inherits them.",
      },
      {
        heading: "Free alternatives that run in your browser",
        text: "If your images are product photos on white or near-white studio backgrounds — the typical marketplace case — you don't need an AI cutout service at all. ImgSync's Remove White Background tool converts white and near-white backgrounds to transparency locally in your browser: no account, no upload, full output resolution, and interior whites (like a white shirt inside a jacket) stay intact. Follow with Defringe Edges to remove any leftover halo, so the cutout sits cleanly on dark or colored backdrops. Everything processes on your device; images never leave it.",
      },
      {
        heading: "Handling the backlog in bulk",
        text: "The credit-expiry advice cuts both ways: whatever backlog you would have spent remove.bg credits on still needs processing. For white-background catalogs, batch the work — convert the exports to your marketplace's required format with Batch Convert (up to 30 images per pass, one zip download). For photos with complex backgrounds that genuinely need AI segmentation, in-browser AI cutout tools exist that run the model locally, as do desktop editors; judge them on output resolution, watermark policy and whether your images are uploaded.",
      },
      {
        heading: "A ten-minute migration checklist",
        text: "Run this before December 1 and the shutdown costs you nothing:",
        items: [
          "Log in and record your plan type and credit balance",
          "Spend usable pay-as-you-go credits on the images you actually need",
          "Download invoices and the credit usage report",
          "Export processed images you want to keep",
          "If you integrate the API: audit every key and every system using it, then either migrate to Leonardo.Ai or replace the call for white-background images with a local pipeline",
        ],
      },
      {
        heading: "What sellers should take from this",
        text: "Marketplace main images need a pure white background anyway — Amazon's 85% rule and white-background requirement apply regardless of which cutout service you use. A local pipeline that converts near-white backgrounds to transparency, defringes the edges and composites onto a true-white or transparent canvas covers the everyday case end to end, with no subscription and no shutdown risk. The Platform Preflight guide walks through the full compliance checklist.",
      },
    ],
    relatedTools: ["remove-white-background", "batch-convert", "defringe-edges"],
    faqs: [
      {
        question: "Is remove.bg really shutting down?",
        answer:
          "Yes. remove.bg's own FAQ states the standalone website will no longer be available from December 1, 2026 at 9:00 a.m. CET, with background removal moving into Canva and the self-service API into Leonardo.Ai. Enterprise API contracts are not affected.",
      },
      {
        question: "What happens to my remove.bg credits?",
        answer:
          "Unused pay-as-you-go credits expire on December 1, 2026 and are non-refundable — they do not transfer to Canva or Leonardo.Ai. Annual subscribers receive a pro-rata refund automatically; any final monthly renewal on or after November 1 is free.",
      },
      {
        question: "What replaces the remove.bg API?",
        answer:
          "Leonardo.Ai, also owned by Canva. The self-service API stops accepting requests on December 1 and the credentials do not carry over — Leonardo's migration guide lists a new endpoint, Bearer authentication and JSON-only requests. Enterprise API contracts continue as normal.",
      },
      {
        question: "Is there a free alternative that doesn't upload my photos?",
        answer:
          "For white-background product photos, ImgSync's Remove White Background runs entirely in your browser with no account and full output resolution — nothing is uploaded. For complex backgrounds that need AI segmentation, look for tools that run the cutout model locally in the browser rather than uploading your files.",
      },
    ],
  },
  {
    slug: "why-is-my-photo-sideways-exif-orientation",
    title: "Why Is My Photo Sideways? EXIF Orientation Explained and Fixed",
    summary:
      "The camera saved the pixels sideways and left a note saying which way is up — and some software never reads the note. How EXIF orientation works, where it breaks, and how to bake the rotation in for good.",
    date: "2026-11-07",
    category: "IMAGE EDITING",
    body: [
      {
        heading: "The photo isn't rotated — its tag is",
        text: "Most sideways-photo mysteries come from one design choice: camera sensors read pixels in one fixed physical direction, no matter how you hold the device. When you turn a phone to portrait, the camera still saves a landscape pixel grid and adds a small metadata note — the EXIF orientation flag — that says \"rotate 90° clockwise to display.\" Photo viewers and phone galleries read that flag and show the photo upright. Software that ignores it shows the raw grid: sideways.",
      },
      {
        heading: "The eight orientation values",
        text: "EXIF orientation has eight possible values:",
        items: [
          "1 — normal, no rotation (most landscape shots)",
          "3 — rotate 180° (camera held upside down)",
          "6 — rotate 90° clockwise (phone held with the top to the right)",
          "8 — rotate 90° counter-clockwise (top to the left)",
          "2, 4, 5, 7 — the same four orientations plus a horizontal mirror (common with front-camera selfies)",
        ],
      },
      {
        heading: "Where the flag breaks",
        text: "The display works only while every step of the chain reads the note. It breaks in familiar places: export tools that strip EXIF to save bytes, older image editors that resize pixels but not flags, some CDN and optimization pipelines, and marketplaces whose uploders ignore orientation entirely — a perfectly upright preview on your desktop becomes a sideways listing image after upload. Format conversion has the same trap: JPEG to WebP often drops the metadata, so a photo that looked fine as a JPEG arrives rotated as a WebP.",
      },
      {
        heading: "The reliable fix: bake the rotation into pixels",
        text: "Rather than hoping every viewer reads the flag, make the pixels upright themselves: read the orientation value, rotate the pixel grid by the matching angle (and mirror for the flipped variants), then save with the flag reset to 1. From that moment every viewer, uploader and converter agrees on the picture, because there is nothing left to interpret.",
      },
      {
        heading: "Do it locally in your browser",
        text: "The Fix Orientation tool does exactly that: it reads the EXIF flag, rotates the pixels to match, and exports an upright file named with a -fixed suffix — all inside your browser, with nothing uploaded. Photos without an orientation flag pass through unchanged, so a batch is safe to run without checking each file first.",
      },
      {
        heading: "Prevention checklist",
        text: "Three habits prevent most recurrences: don't trust the gallery preview alone — check the file after any export or conversion; bake orientation before sending images through any pipeline that strips metadata; and when a photo looks right in one app and wrong in another, suspect the flag before suspecting your eyes.",
      },
      {
        heading: "For marketplace sellers",
        text: "Sideways main images are an instant rejection on Amazon and look careless everywhere else, and marketplace uploaders are exactly the kind of software that ignores orientation flags. Bake the rotation before listing — the Platform Preflight guide covers the rest of the image rules in the same pass.",
      },
    ],
    relatedTools: ["fix-orientation", "platform-preflight"],
    faqs: [
      {
        question: "What is EXIF orientation?",
        answer:
          "A metadata flag cameras write to record how the raw pixel grid should be rotated for display. Viewers that read it show the photo upright; software that ignores it shows the pixels as saved — usually sideways for portrait shots.",
      },
      {
        question: "Why does my photo look right on my phone but sideways when I upload it?",
        answer:
          "Your phone's gallery reads the EXIF orientation flag; the uploader doesn't. The pixels were always sideways — the phone was correcting the display. Fix it by baking the rotation into the pixels, then the file looks right everywhere.",
      },
      {
        question: "Does converting a JPEG to WebP fix the rotation?",
        answer:
          "No — and it often makes it worse. Conversion typically strips EXIF metadata, removing the only note that said which way was up. Fix the orientation first, then convert.",
      },
    ],
  },
  {
    slug: "convert-multiple-images-at-once",
    title: "How to Convert Multiple Images at Once (Without Uploading Them)",
    summary:
      "Converting a folder of product photos one file at a time is the slow way. What batch conversion should look like — format, quality, naming and one zip — and how to do it locally in a browser.",
    date: "2026-11-07",
    category: "WORKFLOWS",
    body: [
      {
        heading: "Why one-at-a-time stops working",
        text: "A single image takes seconds to convert; twenty take an hour of clicking, renaming and re-downloading. The busywork scales with the catalog: marketplace shoots, seasonal refreshes and variant images all arrive in batches, and every manual pass adds two risks — a file converted with the wrong quality setting, and a file that never got converted at all.",
      },
      {
        heading: "What a batch converter needs to get right",
        text: "Four things separate a real batch tool from a looped single-file form:",
        items: [
          "One settings pass — format and quality apply to every file in the run",
          "Parallel processing — files convert concurrently, not in a slow queue",
          "Failure isolation — one corrupt file reports an error without sinking the batch",
          "Collision-safe naming — two sources named cover.jpg can't overwrite each other in the output",
        ],
      },
      {
        heading: "Choosing format and quality once",
        text: "For product photos, WebP at moderate quality is usually the sweet spot: visibly identical to JPEG at the same quality setting and meaningfully smaller, which matters when a marketplace or storefront penalizes slow pages. PNG stays the choice when transparency must survive the conversion. Set the quality slider once — batch conversion is also how you guarantee every image in a catalog was compressed with the same setting, which one-at-a-time conversion quietly destroys.",
      },
      {
        heading: "Doing it locally in the browser",
        text: "ImgSync's Batch Convert drops up to 30 images, converts them in parallel through the browser's encoders, and hands back one zip. Nothing is uploaded — the files never leave your machine, which matters for unreleased product shots. Name collisions get an automatic suffix (a.png and a.jpg both becoming WebP produce a.webp and a-1.webp), and a failed file is reported in the failed list while the rest of the batch completes.",
      },
      {
        heading: "Where the zip lands in a workflow",
        text: "Batch conversion composes well with the other steps: fix orientation first so nothing arrives sideways, then batch-convert, then run marketplace preflight on the zip's contents. Keeping each pass single-purpose means a mistake in one step never contaminates the others — you re-run just that step instead of the whole pipeline.",
      },
      {
        heading: "The limits worth knowing",
        text: "Browsers cap memory, which is why the batch limit sits at 30 files per run rather than pretending to be an FTP job. For thousands of images, split the drop into a few runs — there is no daily quota and no upload wait, so the per-run limit costs seconds, not hours.",
      },
    ],
    relatedTools: ["batch-convert", "fix-orientation", "platform-preflight"],
    faqs: [
      {
        question: "How many images can I convert at once?",
        answer:
          "Up to 30 per batch run. Larger sets split naturally into multiple runs — there's no quota, and each run takes seconds because the files never upload.",
      },
      {
        question: "What happens if one file in the batch is corrupt?",
        answer:
          "It's reported in the failed list with the reason, and every other file still converts. The zip contains the successful conversions only.",
      },
      {
        question: "Are the converted files renamed?",
        answer:
          "Each output keeps its source name with the new extension; when two sources would produce the same name, the later one gets a numeric suffix so nothing overwrites anything.",
      },
    ],
  },
  {
    slug: "favicon-sizes-complete-set",
    title: "Favicon Sizes in 2026: The Complete Set and the HTML That Wires It",
    summary:
      "One favicon file stopped being enough years ago. The exact sizes browsers, iOS, Android and Windows actually request in 2026, the two files you can skip, and the HTML that ties it together.",
    date: "2026-11-07",
    category: "WEB BASICS",
    body: [
      {
        heading: "Why one favicon is no longer enough",
        text: "The 16×16 favicon.ico survived because it costs nothing to keep, but every platform that displays your site icon now asks for its own size: browser tabs, bookmark lists, iOS home screens, Android install prompts, Windows tiles and social crawlers each request a different pixel dimension. Serve the wrong size and the platform upscales it — a blurry icon in the exact places users decide whether to trust your brand.",
      },
      {
        heading: "The complete 2026 set",
        text: "These are the sizes worth generating for a production site:",
        items: [
          "16×16 — classic browser tab and bookmark bars",
          "32×32 — retina-tab and standard shortcut icons",
          "48×48 — Windows site tiles and some desktop contexts",
          "180×180 — Apple touch icon (iOS home screen, always PNG, no transparency)",
          "192×192 — Android/Chrome home-screen and install-prompt icon",
          "512×512 — PWA splash and high-density launchers",
        ],
      },
      {
        heading: "The two files you can safely skip",
        text: "The legacy 16×16-only favicon.ico still earns its place for old crawlers, but most dedicated files are dead weight: Safari's pinned-tab mask-icon is requested rarely and falls back to the touch icon, and Windows tile configs (browserconfig.xml) matter only for pinned Edge tiles on enterprise desktops. Ship the six sizes above and you cover effectively every request a 2026 browser makes.",
      },
      {
        heading: "The HTML that ties it together",
        text: "Sizes only matter if the pages reference them. The minimum wiring:",
        items: [
          "<link rel=\"icon\" type=\"image/png\" sizes=\"16x16 32x32 48x48\" href=\"/favicon-32.png\"> — modern browsers pick the best match",
          "<link rel=\"apple-touch-icon\" sizes=\"180x180\" href=\"/apple-touch-icon.png\"> — iOS ignores the ICO entirely",
          "<link rel=\"icon\" type=\"image/png\" sizes=\"192x192\" href=\"/android-chrome-192.png\"> — Android install prompts",
          "A web app manifest naming the 192 and 512 icons — required for PWA installability",
        ],
      },
      {
        heading: "Generate the whole set at once",
        text: "ImgSync's Favicon Kit takes one square source image and produces the full set in a single pass: 16/32/48 packed into a real .ico, plus 16/32/180/512 PNGs and copy-paste HTML and web manifest snippets. One source file means one design decision instead of six, and the icons can't drift apart visually. Everything renders locally in your browser.",
      },
      {
        heading: "Source-image advice",
        text: "Start from a square PNG or SVG-backed design at 512×512 or larger with the mark centered and generous padding — icons are displayed at sizes where fine detail vanishes, so a logo reduced to a bold shape survives every size while a detailed illustration turns to noise. Check the 16×16 render before shipping: if it's unreadable there, no amount of HTML fixes it.",
      },
    ],
    relatedTools: ["favicon-kit"],
    faqs: [
      {
        question: "What favicon sizes do I actually need in 2026?",
        answer:
          "16, 32 and 48 packed into an .ico, plus PNGs at 180 (Apple touch), 192 and 512 (Android/PWA). That covers browser tabs, iOS home screens, Android install prompts and PWA manifests.",
      },
      {
        question: "Is favicon.ico still needed?",
        answer:
          "Yes, keep one — old crawlers and some tools still request it at the site root. It costs nothing alongside the PNG set.",
      },
      {
        question: "Why does my icon look blurry on iPhone?",
        answer:
          "iOS requests the 180×180 apple-touch-icon. If it's missing, the platform upscales a small favicon instead. Provide the 180×180 PNG — Apple also expects it opaque, so flatten any transparency.",
      },
    ],
  },
  {
    slug: "place-product-photo-on-backdrop",
    title: "How to Place a Product Photo on a Backdrop Template",
    summary:
      "Cutouts look unfinished on a bare checkerboard. How to composite a transparent product shot onto a branded backdrop — sized, positioned and edge-clean — without a desktop editor.",
    date: "2026-11-07",
    category: "IMAGE EDITING",
    body: [
      {
        heading: "Why a cutout alone isn't the finished image",
        text: "A transparent-background product shot is an intermediate asset. Social posts, banners, collection headers and lookbooks all want the product sitting on a designed surface — a brand color, a lifestyle scene, a seasonal gradient. Pasting it into a template in a desktop editor works but turns every reuse into manual work: resize, drag, nudge, re-export.",
      },
      {
        heading: "The three decisions before compositing",
        text: "Every good product-on-backdrop result comes down to the same three choices:",
        items: [
          "Fit — should the product cover the backdrop (cover), sit fully inside it with letterboxing (contain), or stretch? Cover crops, contain preserves the whole product, stretch distorts — avoid it for products",
          "Position — where on the canvas the product sits; a nine-grid preset (top-left … bottom-right) covers most layouts without pixel-pushing",
          "Scale — the product should occupy roughly two-thirds of the canvas so backdrop and subject both read",
        ],
      },
      {
        heading: "Backdrop comes first, product on top",
        text: "Order matters because the product's edges are already alpha-clean. Load the backdrop as the canvas, then place the transparent cutout over it — the compositing blends the product's soft edge pixels with whatever sits behind, which is exactly what makes a cutout look native on the surface rather than pasted on.",
      },
      {
        heading: "Do it locally in the browser",
        text: "ImgSync's Image Composite takes the backdrop and the cutout, applies your fit, position and scale choices, and blends the result in the browser — nothing uploaded. Combined with the white-background remover (which produces the cutout) the whole flow runs locally: white background to transparency, then composite onto the branded surface, then export the finished image.",
      },
      {
        heading: "Edge quality decides believability",
        text: "Two artifacts betray a composite: the white halo left over from an imperfect cutout, and jagged stair-stepping on the product outline. Fix both before compositing — defringe re-colors edge pixels from the product's own colors, and alpha smoothing softens the staircase. Both run in the browser and take seconds; they turn a visibly pasted product into one that looks photographed on the backdrop.",
      },
      {
        heading: "Batch the rest of the catalog",
        text: "One hero image composites by hand; a catalog doesn't. Export the finished composite as a template decision — same backdrop, same position, same scale — and keep the cutouts organized, so every future product reuses the identical framing and the set looks shot together. Convert the finished exports to the target format in one batch run and the whole catalog ships in minutes.",
      },
    ],
    relatedTools: ["image-composite", "remove-white-background", "batch-convert"],
    faqs: [
      {
        question: "Should the product fit with cover or contain?",
        answer:
          "Contain for product photography — it keeps the entire product visible and letterboxes instead of cropping. Cover suits mood shots where partial cropping of the subject is acceptable; never stretch, it distorts the product.",
      },
      {
        question: "Why does my composite have a white outline around the product?",
        answer:
          "That's a halo left by the cutout — edge pixels keep their original near-white color. Run a defringe pass on the cutout first; it re-colors those pixels from the product's own colors, and the composite looks native.",
      },
      {
        question: "How big should the product be on the canvas?",
        answer:
          "Around two-thirds of the canvas dimension is a reliable default — enough presence for the product to read as the subject while leaving the backdrop visible enough to do its branding job.",
      },
    ],
  },
];
