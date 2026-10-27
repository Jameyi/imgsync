import Link from "next/link";
import { TOOLS } from "@/config/tools";
import { breadcrumbs, pageMetadata } from "@/lib/seo";
import JsonLd from "@/components/JsonLd";

export const metadata = pageMetadata(
  "Browser-Based Image Tools for E-commerce Product Photos",
  "/tools",
  "Five single-task image tools for product photos: remove white backgrounds, compress to an exact KB, resize to platform presets, defringe cutouts and preflight marketplace rules. Free, no uploads, no signup.",
);

export default function ToolsIndexPage() {
  const tools = TOOLS.filter((tool) => tool.implemented);
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
        <h1>Five tools, one job each.</h1>
        <p>
          Pick the operation your listing needs. Every tool runs on your file in
          your browser — no uploads, no account, no watermark.
        </p>
      </section>
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="home-tools">
            {tools.map((tool, index) => (
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
        </div>
      </section>
    </main>
  );
}
