import { ArrowUpRight, Code, FileText, Wrench } from "lucide-react";
export default function AuthorProjects() {
  // TODO: replace with tool cross-links / promo cards once /tools/[slug] routes land (PRD §7).
  return (
    <section className="author-section shell">
      <div>
        <span className="eyebrow">EXPLORE IMGSYNC</span>
        <h2>More to explore.</h2>
        <p>Project resources and what&apos;s coming next.</p>
      </div>
      <div className="author-grid">
        <a href="https://github.com/your-name/imgsync" target="_blank" rel="noopener noreferrer">
          <span className="product-mark">
            <Code size={25} />
          </span>
          <span>
            <strong>GitHub</strong>
            <small>Source code & issues</small>
          </span>
          <ArrowUpRight size={17} />
        </a>
        <a href="/docs">
          <span className="product-mark amber">
            <FileText size={25} />
          </span>
          <span>
            <strong>Docs</strong>
            <small>Quickstart & configuration</small>
          </span>
        </a>
        <a href="/examples">
          <span className="product-mark">
            <Wrench size={25} />
          </span>
          <span>
            <strong>Tools</strong>
            <small>Browser-based image tools (in development)</small>
          </span>
        </a>
      </div>
    </section>
  );
}
