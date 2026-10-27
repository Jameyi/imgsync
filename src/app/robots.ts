import type { MetadataRoute } from "next";
import { baseURL, indexable } from "../config.ts";

const CITATION_CRAWLERS = [
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "PerplexityBot",
  "Google-Extended",
];

const TRAINING_CRAWLERS = [
  "GPTBot",
  "anthropic-ai",
  "Bytespider",
  "CCBot",
  "meta-externalagent",
  "Amazonbot",
  "Applebot-Extended",
  "Diffbot",
  "omgili",
  "PetalBot",
  "SemrushBot-SWA",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/" },
      ...CITATION_CRAWLERS.map((userAgent) => ({ userAgent, allow: "/" })),
      ...TRAINING_CRAWLERS.map((userAgent) => ({ userAgent, disallow: "/" })),
    ],
    ...(indexable ? { sitemap: `${baseURL}/sitemap.xml` } : {}),
  };
}
