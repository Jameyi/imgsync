import { notFound } from "next/navigation";
import Link from "next/link";
import { baseURL } from "@/config";
import { TOOLS, getTool } from "@/config/tools";
import { breadcrumbs, faqPage, pageMetadata } from "@/lib/seo";
import { getGuide } from "@/content/tool-guides";
import { getPromos } from "@/config/promos";
import JsonLd from "@/components/JsonLd";
import PromoCard from "@/components/PromoCard";
import ToolGuideSection from "@/components/ToolGuide";
import WhiteToTransparentWorkbench from "@/components/WhiteToTransparentWorkbench";
import CompressToSizeWorkbench from "@/components/CompressToSizeWorkbench";
import DefringeEdgesWorkbench from "@/components/DefringeEdgesWorkbench";
import ResizeToPresetWorkbench from "@/components/ResizeToPresetWorkbench";
import PlatformPreflightWorkbench from "@/components/PlatformPreflightWorkbench";
import PsdExportWorkbench from "@/components/PsdExportWorkbench";

export function generateStaticParams() {
  return TOOLS.filter((tool) => tool.implemented).map((tool) => ({
    slug: tool.slug,
  }));
}

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const tool = getTool(slug);
  if (!tool) return {};
  return pageMetadata(tool.title, `/tools/${tool.slug}`, tool.description);
}

export default async function ToolPage({ params }: PageProps) {
  const { slug } = await params;
  const tool = getTool(slug);
  if (!tool || !tool.implemented) notFound();
  const guide = getGuide(tool.slug);
  const promos = getPromos(tool.slug);
  const schema = {
    "@context": "https://schema.org",
    "@type": "SoftwareSourceCode",
    name: tool.name,
    description: tool.description,
    url: new URL(`/tools/${tool.slug}`, baseURL).href,
  };
  return (
    <main id="main">
      <section className="shell page-hero">
        <JsonLd
          data={breadcrumbs([
            { name: "Home", path: "/" },
            { name: "Tools", path: "/tools" },
            { name: tool.name, path: `/tools/${tool.slug}` },
          ])}
        />
        <JsonLd data={schema} />
        {guide && <JsonLd data={faqPage(guide.faqs)} />}
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span>/</span>
          <span>Tools</span>
          <span>/</span>
          <span>{tool.name}</span>
        </nav>
        <h1>{tool.name}</h1>
        <p>{tool.description}</p>
      </section>
      <section className="shell bench-section">
        <div className="bench" data-bench={tool.slug}>
          <div className="bench-top">
            <span className="bench-id mono-label">
              IMGSYNC / <b>{tool.name}</b>
            </span>
            <span className="bench-local mono-label">🔒 Local only</span>
          </div>
          <div className="bench-body-area">
            {tool.slug === "remove-white-background" ? (
              <WhiteToTransparentWorkbench tool={tool} />
            ) : tool.slug === "compress-to-size" ? (
              <CompressToSizeWorkbench tool={tool} />
            ) : tool.slug === "defringe-edges" ? (
              <DefringeEdgesWorkbench tool={tool} />
            ) : tool.slug === "resize-to-preset" ? (
              <ResizeToPresetWorkbench tool={tool} />
            ) : tool.slug === "platform-preflight" ? (
              <PlatformPreflightWorkbench tool={tool} />
            ) : tool.slug === "psd-export" ? (
              <PsdExportWorkbench tool={tool} />
            ) : (
              <p>Engine wiring up.</p>
            )}
          </div>
        </div>
      </section>
      {guide && <ToolGuideSection guide={guide} />}
      {promos.length > 0 && (
        <section className="shell pb-14">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {promos.map((promo) => (
              <PromoCard key={promo.brand} promo={promo} toolSlug={tool.slug} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
