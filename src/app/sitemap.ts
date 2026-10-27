import type { MetadataRoute } from "next";
import { baseURL, indexable } from "../config.ts";
import { TOOLS } from "../config/tools.ts";
export default function sitemap(): MetadataRoute.Sitemap {
  if (!indexable) return [];
  const toolRoutes = TOOLS.filter((tool) => tool.implemented).map(
    (tool) => `/tools/${tool.slug}`,
  );
  return [
    "/",
    "/tools",
    ...toolRoutes,
    "/docs",
    "/docs/zh",
    "/about",
    "/privacy-policy",
    "/terms",
    "/disclaimer",
    "/contact",
  ].map((path) => ({ url: new URL(path, baseURL).href }));
}
