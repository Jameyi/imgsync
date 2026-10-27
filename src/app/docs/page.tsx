import DocsPage from "@/components/DocsPage";
import { baseURL } from "@/config";
import { pageMetadata } from "@/lib/seo";
export const metadata = {
  ...pageMetadata(
    "Documentation",
    "/docs",
    "How the five ImgSync tools behave, what stays on your machine, the privacy model, and how the site handles crawling and indexing.",
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
