import Link from "next/link";
import { notFound } from "next/navigation";
import { articles } from "@/content/articles";
import { baseURL, siteName } from "@/config";
import { TOOLS } from "@/config/tools";
import { breadcrumbs, pageMetadata } from "@/lib/seo";
import JsonLd from "@/components/JsonLd";
export const dynamicParams = false;
export function generateStaticParams() {
  return articles.map(({ slug }) => ({ slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = articles.find((a) => a.slug === slug);
  if (!article) notFound();
  const metadata = pageMetadata(
    article.title,
    `/articles/${slug}`,
    article.summary,
  );
  return {
    ...metadata,
    openGraph: {
      ...metadata.openGraph,
      type: "article" as const,
      publishedTime: article.date,
      modifiedTime: article.date,
      authors: [siteName],
    },
  };
}
export default async function Article({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = articles.find((a) => a.slug === slug);
  if (!article) notFound();
  const path = `/articles/${slug}`;
  const related = article.relatedTools
    .map((toolSlug) => TOOLS.find((t) => t.slug === toolSlug))
    .filter((t) => t !== undefined);
  return (
    <main id="main">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: article.title,
          description: article.summary,
          datePublished: article.date,
          dateModified: article.date,
          author: { "@type": "Organization", name: siteName, url: baseURL },
          image: new URL(
            `/api/og?title=${encodeURIComponent(article.title)}`,
            baseURL,
          ).href,
          mainEntityOfPage: new URL(path, baseURL).href,
        }}
      />
      <JsonLd
        data={breadcrumbs([
          { name: "Home", path: "/" },
          { name: "Guides", path: "/articles" },
          { name: article.title, path },
        ])}
      />
      <section className="shell page-hero">
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span>/</span>
          <Link href="/articles">Guides</Link>
          <span>/ {article.category.toLowerCase()}</span>
        </nav>
        <span className="eyebrow">
          {article.category} · {article.date}
        </span>
        <h1>{article.title}</h1>
        <p>{article.summary}</p>
      </section>
      <article className="shell content-shell prose">
        <p className="article-meta">By {siteName}</p>
        {article.body.map((section) => (
          <section key={section.heading}>
            <h2>{section.heading}</h2>
            <p>{section.text}</p>
            {section.items && (
              <ul>
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
          </section>
        ))}
        <h2>Try the tools</h2>
        <p>
          Every guide maps to a free browser tool — your images never leave
          your device.
        </p>
        <div className="inline-links">
          {related.map((tool) => (
            <Link key={tool.slug} href={`/tools/${tool.slug}`}>
              {tool.name} →
            </Link>
          ))}
          <Link href="/articles">All guides →</Link>
        </div>
      </article>
    </main>
  );
}
