import type { MetadataRoute } from "next";
import { baseURL, indexable } from "../config.ts";
import { TOOLS } from "../config/tools.ts";
import { articles } from "../content/articles.ts";
export default function sitemap(): MetadataRoute.Sitemap {
  if (!indexable) return [];
  const toolRoutes = TOOLS.filter((tool) => tool.implemented).map(
    (tool) => `/tools/${tool.slug}`,
  );
  const articleRoutes = articles.map((article) => `/articles/${article.slug}`);
  return [
    "/",
    "/tools",
    ...toolRoutes,
    "/articles",
    ...articleRoutes,
    "/docs",
    "/docs/zh",
    "/about",
    "/privacy-policy",
    "/terms",
    "/disclaimer",
    "/contact",
  ].map((path) => ({ url: new URL(path, baseURL).href }));
}
