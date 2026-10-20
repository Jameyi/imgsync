import DocsPage from "@/components/DocsPage";
import { baseURL } from "@/config";
import { pageMetadata } from "@/lib/seo";
export const metadata = {
  ...pageMetadata(
    "Documentation",
    "/docs",
    "Set up your Next.js site, configure metadata and indexing, and inspect working SEO examples.",
  ),
  alternates: {
    canonical: `${baseURL}/docs`,
    languages: {
      en: `${baseURL}/docs`,
      "zh-CN": `${baseURL}/docs/zh`,
      "x-default": `${baseURL}/docs`,
    },
  },
};
export default function Docs() {
  return <DocsPage language="en" />;
}
