import Link from "next/link";
import { baseURL, siteName } from "@/config";
import { TOOLS } from "@/config/tools";
import { pageMetadata } from "@/lib/seo";
import JsonLd from "@/components/JsonLd";
import HomeCompare from "@/components/HomeCompare";

export const metadata = pageMetadata(
  "ImgSync — Free Browser-Based Image Tools for E-commerce",
  "/",
);

const FAQS = [
  {
    q: "Do my images get uploaded anywhere?",
    a: "No. Every tool runs in your browser with canvas and web workers. Nothing is sent to a server, and there is no account to tie the file to.",
  },
  {
    q: "What is a platform preflight?",
    a: "A check against marketplace rules before upload: subject-to-canvas ratio, canvas dimensions and file size. If a check fails, the report links straight to the fixing tool.",
  },
  {
    q: "Is it really free?",
    a: "Yes. All five tools are free and unlimited, with no watermark. Suggestions are labelled and never gate the tool you came for.",
  },
];

const TRUST = [
  "100% local processing",
  "No uploads, ever",
  "Canvas + web workers",
  "Free, no watermark",
];

const STEPS = [
  {
    n: "01",
    title: "Drop an image",
    body: "PNG, JPEG or WebP. Decoding happens in the browser; a 4 MP threshold hands heavy frames to a worker.",
  },
  {
    n: "02",
    title: "Dial the spec",
    body: "Tolerance, exact KB or a platform preset. The preview updates as you change the one value that matters.",
  },
  {
    n: "03",
    title: "Export and go",
    body: "Download the result with the target met. No watermark, no queue, no account. The file never left your machine.",
  },
];

const TOOL_NUM = [
  "platform-preflight",
  "remove-white-background",
  "compress-to-size",
  "resize-to-preset",
  "defringe-edges",
] as const;

const toolOrder = [...TOOLS].sort(
  (a, b) => TOOL_NUM.indexOf(a.slug as never) - TOOL_NUM.indexOf(b.slug as never),
);

export default function Home() {
  return (
    <main id="main">
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

      {/* hero */}
      <section className="home-hero">
        <div className="wrap home-hero-grid">
          <div>
            <span className="kicker">
              <span className="dot" />
              5 tools live <span className="sep">/</span> 0 uploads{" "}
              <span className="sep">/</span> no account
            </span>
            <h1 className="home-title">
              Ship product images that <em>pass inspection.</em>
            </h1>
            <p className="home-lede">
              Five single-task tools for e-commerce sellers and developers.
              Remove white, hit an exact file size, meet platform specs — all in
              your browser. Your files never leave the device.
            </p>
            <div className="home-actions">
              <Link className="btn btn-primary" href="/tools/remove-white-background">
                Remove a background →
              </Link>
              <a className="btn btn-ghost" href="#tools">
                See all five tools
              </a>
            </div>
            <dl className="home-facts">
              <div>
                <dt>Uploads</dt>
                <dd>0 bytes</dd>
              </div>
              <div>
                <dt>Worker threshold</dt>
                <dd>4 megapixels</dd>
              </div>
              <div>
                <dt>Price</dt>
                <dd>Free, no signup</dd>
              </div>
            </dl>
          </div>
          <HomeCompare />
        </div>
      </section>

      {/* trust strip */}
      <div className="home-strip">
        <div className="wrap home-strip-inner">
          {TRUST.map((item) => (
            <span key={item}>✓ {item}</span>
          ))}
        </div>
      </div>

      {/* preflight band */}
      <section className="home-band" id="preflight">
        <div className="wrap home-band-grid">
          <div>
            <span className="kicker" style={{ color: "var(--band-muted)" }}>
              <span className="dot" />
              02 — Preflight
            </span>
            <h2 className="home-band-title">
              Every marketplace has a <em>rulebook.</em>
            </h2>
            <p className="home-lede" style={{ color: "var(--band-muted)" }}>
              Check subject ratio, canvas size and file weight before you upload.
              If something fails, the fix is one click away — not a trip back to
              Photoshop.
            </p>
            <div className="home-actions">
              <Link className="btn btn-accent" href="/tools/platform-preflight">
                Run a preflight →
              </Link>
            </div>
          </div>
          <div className="home-spec">
            <div className="home-spec-top">
              <span>Amazon</span>
              <span className="mono-label">Sample</span>
            </div>
            <div className="home-spec-big">
              <strong>85%</strong>
              <span>Subject-to-canvas minimum</span>
            </div>
            <ul className="home-spec-rows">
              <li>
                <span>Canvas</span>
                <b>2000 × 2000</b>
              </li>
              <li>
                <span>Max file</span>
                <b>10 MB</b>
              </li>
              <li>
                <span>Background</span>
                <b>Pure white</b>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* tools */}
      <section className="section" id="tools">
        <div className="wrap">
          <div className="sec-head">
            <div>
              <span className="kicker">
                <span className="dot" />
                03 — The toolkit
              </span>
              <h2>
                Five jobs. <em>One bench.</em>
              </h2>
            </div>
            <p>
              Each tool does a single job and stops. No layers, no canvas, no
              learning curve — just the operation your listing needs.
            </p>
          </div>
          <div className="home-tools">
            {toolOrder.map((tool, index) => (
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

      {/* steps */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="sec-head">
            <div>
              <span className="kicker">
                <span className="dot" />
                05 — How it works
              </span>
              <h2>
                Three steps. <em>No manual.</em>
              </h2>
            </div>
          </div>
          <ol className="home-steps">
            {STEPS.map((step) => (
              <li key={step.n}>
                <span className="step-n">{step.n}</span>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* FAQ */}
      <section className="section" id="faq" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="sec-head">
            <div>
              <span className="kicker">
                <span className="dot" />
                06 — Common questions
              </span>
              <h2>
                Answered <em>up front.</em>
              </h2>
            </div>
          </div>
          <div className="home-faqs">
            {FAQS.map((faq) => (
              <details key={faq.q} className="home-faq" open>
                <summary>{faq.q}</summary>
                <p>{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="home-cta">
        <div className="wrap home-cta-inner">
          <div>
            <span className="kicker" style={{ color: "var(--band-muted)" }}>
              <span className="dot" />
              Ready when you are
            </span>
            <h2 className="home-band-title">
              Pick the problem. <em>Keep the pixels.</em>
            </h2>
          </div>
          <div className="home-actions">
            <Link className="btn btn-accent" href="/tools/remove-white-background">
              Start with a cutout →
            </Link>
            <Link className="btn btn-ghost" href="/tools/platform-preflight">
              Run a preflight
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
