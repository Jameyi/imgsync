import { canIndex, resolveSiteUrl } from "./lib/site-url.mjs";

export const siteName =
  process.env.NEXT_PUBLIC_SITE_NAME || "ImgSync";
export const title =
  process.env.NEXT_PUBLIC_TITLE || "ImgSync — browser-based image tools";
export const description =
  process.env.NEXT_PUBLIC_DESCRIPTION ||
  "Free browser-based image tools. Everything processes locally in your browser — no uploads, no accounts, no tracking.";
export const baseURL = resolveSiteUrl(process.env);
export const indexable = canIndex(process.env);
// TODO: replace with the real ImgSync repository URL when created.
export const repository = "https://github.com/your-name/imgsync";
export const templateURL =
  "https://github.com/new?template_name=imgsync&template_owner=your-name";
export const deployURL = `https://vercel.com/new/clone?repository-url=${encodeURIComponent(repository)}&project-name=imgsync&repository-name=imgsync&env=NEXT_PUBLIC_URL&envDescription=${encodeURIComponent("Your production website origin, e.g. https://example.com")}`;
