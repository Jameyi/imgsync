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
export const repository = "https://github.com/Jameyi/imgsync";
