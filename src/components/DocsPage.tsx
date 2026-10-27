import fs from "node:fs";
import path from "node:path";
import Link from "next/link";
import MarkdownContent from "./MarkdownContent";
import AuthorProjects from "./AuthorProjects";
const sections = [
  ["Quickstart", "快速开始", "quickstart"],
  ["The five tools", "五个工具", "the-five-tools"],
  ["How processing works", "处理原理", "how-processing-works"],
  ["Privacy", "隐私", "privacy"],
  ["SEO and indexing", "SEO 与索引", "seo-and-indexing"],
  ["Self-hosting", "自托管", "self-hosting"],
  ["Limits to know", "使用限制", "limits-to-know"],
  ["Support", "获取支持", "support"],
];
export default function DocsPage({ language }: { language: "en" | "zh" }) {
  const zh = language === "zh";
  const content = fs.readFileSync(
    path.join(process.cwd(), `src/content/docs.${language}.md`),
    "utf8",
  );
  return (
    <main id="main">
      <section className="shell page-hero">
        <span className="eyebrow">DOCUMENTATION / V1.0</span>
        <h1>{zh ? "工具怎么用，讲清楚。" : "How the tools actually work."}</h1>
        <p>
          {zh
            ? "每个工具的行为、处理边界、隐私口径与站点索引策略，都在这一页。"
            : "What each tool does, where it stops, what stays on your machine, and how the site handles indexing."}
        </p>
        <div className="inline-links">
          <Link
            href="/docs"
            hrefLang="en"
            aria-current={!zh ? "page" : undefined}
          >
            English
          </Link>
          <Link
            href="/docs/zh"
            hrefLang="zh-CN"
            aria-current={zh ? "page" : undefined}
          >
            简体中文
          </Link>
        </div>
      </section>
      <div className="shell docs-layout">
        <nav className="docs-nav" aria-label={zh ? "文档目录" : "On this page"}>
          <strong>{zh ? "本页内容" : "ON THIS PAGE"}</strong>
          {sections.map(([en, cn, id]) => (
            <a href={`#${id}`} key={id}>
              {zh ? cn : en}
            </a>
          ))}
        </nav>
        <article className="prose" lang={zh ? "zh-CN" : "en"}>
          <MarkdownContent content={content} />
        </article>
      </div>
      <AuthorProjects />
    </main>
  );
}
