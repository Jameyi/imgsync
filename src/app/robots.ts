import type { MetadataRoute } from "next";
import { baseURL, indexable } from "@/config";
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/" },
      // GEO: answer engines are welcome — content is public and static
      { userAgent: "GPTBot", allow: "/" },
      { userAgent: "OAI-SearchBot", allow: "/" },
      { userAgent: "ChatGPT-User", allow: "/" },
      { userAgent: "ClaudeBot", allow: "/" },
      { userAgent: "PerplexityBot", allow: "/" },
      { userAgent: "Google-Extended", allow: "/" },
    ],
    ...(indexable ? { sitemap: `${baseURL}/sitemap.xml` } : {}),
  };
}
