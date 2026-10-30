import Link from "next/link";
import { TOOLS } from "@/config/tools";
import { breadcrumbs, pageMetadata } from "@/lib/seo";
import JsonLd from "@/components/JsonLd";

export const metadata = pageMetadata(
  "Browser-Based Image Tools for E-commerce Product Photos",
  "/tools",
  "Seven single-task image tools for product photos, grouped by job: background cutouts, compression and resizing, marketplace preflight and layered PSD export. Free, no uploads, no signup.",
);

export default function ToolsIndexPage() {
  const tools = TOOLS.filter((tool) => tool.implemented);
  // Group tools by category, preserving TOOLS order within each group and
  // first-appearance order of the groups themselves.
  const groups: { category: string; tools: typeof tools }[] = [];
  for (const tool of tools) {
    const group = groups.find((g) => g.category === tool.category);
    if (group) group.tools.push(tool);
    else groups.push({ category: tool.category, tools: [tool] });
  }
  return (
    <main id="main">
      <section className="shell page-hero">
        <JsonLd
          data={breadcrumbs([
            { name: "Home", path: "/" },
            { name: "Tools", path: "/tools" },
          ])}
        />
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span>/</span>
          <span>Tools</span>
        </nav>
        <h1>Seven tools, one job each.</h1>
        <p>
          Pick the operation your listing needs. Every tool runs on your file in
          your browser — no uploads, no account, no watermark. Expand a group
          below to see its tools.
        </p>
      </section>
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="wrap">
          {groups.map((group) => (
            <details key={group.category} className="tool-group" open>
              <summary className="tool-group-summary">
                <span className="mono-label">{group.category.toUpperCase()}</span>
                <span className="tool-group-count">
                  {group.tools.length} tool{group.tools.length > 1 ? "s" : ""}
                </span>
              </summary>
              <div className="home-tools">
                {group.tools.map((tool, index) => (
                  <Link
                    key={tool.slug}
                    href={`/tools/${tool.slug}`}
                    className="home-tool"
                  >
                    <div className="tool-top">
                      <span className="tool-num">
                        {String(index + 1).padStart(2, "0")} /{" "}
                        {tool.slug.split("-").pop()?.toUpperCase()}
                      </span>
                    </div>
                    <h3>{tool.name}</h3>
                    <p>{tool.description}</p>
                    <span className="tool-go">Open tool →</span>
                  </Link>
                ))}
              </div>
            </details>
          ))}
        </div>
      </section>
    </main>
  );
}
