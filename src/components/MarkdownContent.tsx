import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { repository } from "@/config";
const chineseIds: Record<string, string> = {
  快速开始: "quickstart",
  五个工具: "the-five-tools",
  处理原理: "how-processing-works",
  隐私: "privacy",
  "SEO 与索引": "seo-and-indexing",
  自托管: "self-hosting",
  使用限制: "limits-to-know",
  获取支持: "support",
};
export default function MarkdownContent({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        a: ({ href, children }) => {
          const resolved = href?.match(/^README(?:-zh)?\.md$/)
            ? href === "README-zh.md"
              ? "/docs/zh"
              : "/docs"
            : href?.match(/^(src\/|\.env|LICENSE)/)
              ? `${repository}/blob/main/${href}`
              : href;
          return (
            <a
              href={resolved}
              {...(resolved?.startsWith("http")
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
            >
              {children}
            </a>
          );
        },
        h2: ({ children }) => {
          const label = String(children);
          return (
            <h2
              id={
                chineseIds[label] ||
                label
                  .toLowerCase()
                  .replace(/[’']/g, "")
                  .replace(/[^a-z0-9]+/g, "-")
                  .replace(/^-|-$/g, "")
              }
            >
              {children}
            </h2>
          );
        },
        table: ({ children }) => (
          <div className="table-scroll">
            <table>{children}</table>
          </div>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
