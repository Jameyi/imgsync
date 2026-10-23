import type { MetadataRoute } from "next";
import { baseURL, indexable } from "../config.ts";
import { articles } from "../content/articles.ts";
import { TOOLS } from "../config/tools.ts";
export default function sitemap(): MetadataRoute.Sitemap {
  if (!indexable) return [];
  const toolRoutes = TOOLS.filter((tool) => tool.implemented).map(
    (tool) => `/tools/${tool.slug}`,
  );
  return [
    "/",
    ...toolRoutes,
    "/docs",
    "/docs/zh",
    "/about",
    "/privacy-policy",
    "/terms",
    "/disclaimer",
    "/contact",
  ]
    .map((path) => ({ url: new URL(path, baseURL).href }))
    .concat(
      articles.map((article) => ({
        url: new URL(`/examples/articles/${article.slug}`, baseURL).href,
        lastModified: article.date,
      })),
    );
}
