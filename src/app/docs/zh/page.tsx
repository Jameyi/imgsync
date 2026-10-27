import DocsPage from "@/components/DocsPage";
import { baseURL } from "@/config";
import { pageMetadata } from "@/lib/seo";
export const metadata = {
  ...pageMetadata(
    "中文文档",
    "/docs/zh",
    "五个工具各自的行为与边界、处理原理、隐私口径，以及站点的爬虫与索引策略。",
  ),
  alternates: {
    canonical: `${baseURL}/docs/zh`,
    languages: {
      en: `${baseURL}/docs`,
      "zh-CN": `${baseURL}/docs/zh`,
      "x-default": `${baseURL}/docs`,
    },
  },
};
export default function Docs() {
  return <DocsPage language="zh" />;
}
