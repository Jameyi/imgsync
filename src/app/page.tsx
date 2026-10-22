import Link from "next/link";
import { baseURL, siteName } from "@/config";
import { TOOLS } from "@/config/tools";
import { pageMetadata } from "@/lib/seo";
import JsonLd from "@/components/JsonLd";

export const metadata = pageMetadata(
  "ImgSync — Free Browser-Based Image Tools for E-commerce",
  "/",
);

const FAQS = [
  {
    q: "Do my images get uploaded anywhere?",
    a: "No. Every tool runs entirely in your browser using canvas and web workers. Nothing is sent to a server — your unpublished product shots stay on your machine.",
  },
  {
    q: "What is a platform preflight?",
    a: "Before you upload to Amazon or Instagram, a preflight checks subject-to-canvas ratio (e.g. Amazon's 85% rule), dimensions and file size — tells you what would get rejected, and hands you the fix in the same page.",
  },
  {
    q: "Is it free?",
    a: "Yes. Every tool is free, unlimited, with no account and no watermark.",
  },
];

const TRUST_POINTS = [
  "🔒 100% local processing",
  "🚫 No uploads, ever",
  "⚡ No account needed",
  "🖼 No watermark",
];

export default function Home() {
  return (
    <main id="main" className="pb-24">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: siteName,
          url: baseURL,
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "SoftwareSourceCode",
          name: siteName,
          url: baseURL,
          description:
            "Free browser-based image tools for e-commerce sellers: background removal, exact-size compression, platform presets, defringing and preflight checks.",
        }}
      />

      <section className="shell pb-20 pt-16 text-center">
        <span className="eyebrow">Free image tools</span>
        <h1
          className="mx-auto max-w-[16em] text-[clamp(34px,4.6vw,54px)]"
          style={{ letterSpacing: "-0.05em" }}
        >
          Product images,{" "}
          <span className="text-[var(--blue)]">compliant in one click.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-[36em] text-[15px] leading-7">
          Single-task tools for e-commerce sellers and developers. Every image
          is processed locally in your browser — no uploads, no account, no
          watermark.
        </p>
        <div className="mt-7 flex justify-center gap-2.5">
          <Link
            href="/tools/remove-white-background"
            className="button button-blue"
          >
            Start with background removal
          </Link>
          <a href="#tools" className="button button-outline">
            Browse all tools
          </a>
        </div>
        <p className="mt-4 text-[10px] text-[var(--muted)]">
          Free forever · No signup · Your files never leave your device
        </p>
      </section>

      <section
        id="tools"
        className="border-y border-[var(--border)] bg-[var(--soft)] py-16"
      >
        <div className="shell">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-5">
            <div>
              <span className="eyebrow">The toolkit</span>
              <h2 className="text-[clamp(28px,3.2vw,40px)]">
                Five single-task tools. Live now.
              </h2>
            </div>
            <p className="max-w-[26em] text-xs leading-6">
              Each tool does one job and gets it right. Validated against real
              search demand from e-commerce sellers.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {TOOLS.filter((tool) => tool.implemented).map((tool) => (
              <Link
                key={tool.slug}
                href={`/tools/${tool.slug}`}
                className="h-full rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5 transition-colors hover:border-[var(--blue)]"
              >
                <div className="text-[15px] font-semibold tracking-tight">
                  {tool.name}
                </div>
                <p className="mt-1.5 text-[11px] leading-6">
                  {tool.description}
                </p>
                <span className="mt-3 block text-xs text-[var(--blue)]">
                  Open tool →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-[var(--border)]">
        <div className="shell flex flex-wrap items-center justify-center gap-x-10 gap-y-3 py-7 text-[11px] font-semibold tracking-tight">
          {TRUST_POINTS.map((point) => (
            <span key={point}>{point}</span>
          ))}
        </div>
      </section>

      <section className="shell py-20">
        <span className="eyebrow">Common questions</span>
        <h2 className="text-[clamp(28px,3.2vw,40px)]">
          Questions, answered up front.
        </h2>
        <div className="mt-8 grid grid-cols-1 gap-3 md:grid-cols-3">
          {FAQS.map((faq) => (
            <div
              key={faq.q}
              className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6"
            >
              <h3 className="text-[15px]">{faq.q}</h3>
              <p className="mt-2 text-[12px] leading-6">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
