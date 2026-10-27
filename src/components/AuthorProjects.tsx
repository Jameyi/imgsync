import Link from "next/link";
import { ArrowUpRight, Code, FileText, Wrench } from "lucide-react";
import { repository } from "@/config";
export default function AuthorProjects() {
  return (
    <section className="author-section shell">
      <div>
        <span className="eyebrow">EXPLORE IMGSYNC</span>
        <h2>More to explore.</h2>
        <p>Tools, documentation and the source behind them.</p>
      </div>
      <div className="author-grid">
        <a href={repository} target="_blank" rel="noopener noreferrer">
          <span className="product-mark">
            <Code size={25} />
          </span>
          <span>
            <strong>GitHub</strong>
            <small>Source code & issues</small>
          </span>
          <ArrowUpRight size={17} />
        </a>
        <Link href="/docs">
          <span className="product-mark amber">
            <FileText size={25} />
          </span>
          <span>
            <strong>Docs</strong>
            <small>How the tools work</small>
          </span>
        </Link>
        <Link href="/tools">
          <span className="product-mark">
            <Wrench size={25} />
          </span>
          <span>
            <strong>Tools</strong>
            <small>Browser-based image tools</small>
          </span>
        </Link>
      </div>
    </section>
  );
}
