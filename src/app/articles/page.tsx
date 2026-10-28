import Link from "next/link";
import { articles } from "@/content/articles";
import { pageMetadata } from "@/lib/seo";
export const metadata = pageMetadata(
  "Guides — marketplace image requirements",
  "/articles",
  "Practical guides for e-commerce image compliance: marketplace rules, compression targets, white backgrounds, and cutout edge fixes.",
);
export default function Articles() {
  return (
    <main id="main">
      <section className="shell page-hero">
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span>/</span>
          <span>Guides</span>
        </nav>
        <span className="eyebrow">GUIDES</span>
        <h1>Marketplace image rules, decoded.</h1>
        <p>
          Practical guides for sellers: what each marketplace requires from
          your product images, and how to get there with browser tools — no
          uploads, no accounts.
        </p>
      </section>
      <section className="shell section article-grid">
        {articles.map((article) => (
          <Link
            className="article-card"
            href={`/articles/${article.slug}`}
            key={article.slug}
          >
            <span className="eyebrow">{article.category}</span>
            <span className="article-meta">{article.date}</span>
            <h2>{article.title}</h2>
            <p>{article.summary}</p>
            <span className="text-link">Read the guide →</span>
          </Link>
        ))}
      </section>
    </main>
  );
}
