import Link from "next/link";
import { FileText, Wrench } from "lucide-react";
export default function AuthorProjects() {
  return (
    <section className="author-section shell">
      <div>
        <span className="eyebrow">EXPLORE IMGSYNC</span>
        <h2>More to explore.</h2>
        <p>Tools and documentation.</p>
      </div>
      <div className="author-grid">
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
