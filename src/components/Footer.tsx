import Link from "next/link";
import { siteName } from "@/config";
import { TOOLS } from "@/config/tools";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="foot-grid">
          <div className="foot-brand">
            <Link className="brand" href="/">
              <svg viewBox="0 0 28 28" aria-hidden="true" className="brand-mark-svg">
                <rect width="28" height="28" rx="7" fill="var(--blue)" />
                <path d="M7 7h7v7H7zM14 14h7v7h-7z" fill="var(--background)" opacity=".9" />
                <path d="M14 7h7v7h-7zM7 14h7v7H7z" fill="var(--surface)" opacity=".92" />
              </svg>
              <span className="brand-name">{siteName}</span>
            </Link>
            <p>
              Single-task image tools for e-commerce. Built in the browser,
              sized for the upload form.
            </p>
          </div>
          <div className="foot-col">
            <h4>Tools</h4>
            {TOOLS.map((tool) => (
              <Link key={tool.slug} href={`/tools/${tool.slug}`}>
                {tool.name}
              </Link>
            ))}
          </div>
          <div className="foot-col">
            <h4>Resources</h4>
            <Link href="/docs">Docs</Link>
            <Link href="/articles">Guides</Link>
            <Link href="/about">About</Link>
            <a href="/sitemap.xml">Sitemap</a>
          </div>
          <div className="foot-col">
            <h4>Legal</h4>
            <Link href="/contact">Contact</Link>
            <Link href="/privacy-policy">Privacy Policy</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/disclaimer">Disclaimer</Link>
          </div>
        </div>
        <div className="foot-bottom">
          <span>© {new Date().getFullYear()} {siteName} — images never leave your device</span>
          <span>Free · No signup · No watermark</span>
        </div>
      </div>
    </footer>
  );
}
