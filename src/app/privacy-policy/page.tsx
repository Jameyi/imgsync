import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata(
  "Privacy Policy",
  "/privacy-policy",
  "ImgSync processes every image locally in your browser. No uploads, no accounts, no tracking pixels on your files.",
);

export default function PrivacyPolicy() {
  return (
    <main id="main">
      <section className="shell page-hero">
        <span className="eyebrow">PRIVACY</span>
        <h1>Privacy Policy</h1>
        <p>
          The short version: your images never leave your device, and we collect
          almost nothing.
        </p>
      </section>
      <article className="shell content-shell prose">
        <h2>How your images are processed</h2>
        <p>
          Every tool on ImgSync runs entirely in your browser using Canvas and
          Web Worker APIs. Your image files are never uploaded to a server,
          stored by us, or seen by anyone but you. Closing the tab discards
          everything.
        </p>
        <h2>What we collect</h2>
        <p>
          We do not require accounts and we do not ask for personal
          information. If analytics are enabled, they are limited to aggregate,
          privacy-respecting page metrics (page views, referrers) — never file
          contents, never cross-site identifiers.
        </p>
        <h2>Cookies and local storage</h2>
        <p>
          ImgSync stores only your interface preferences (such as light/dark
          theme) in your browser&apos;s local storage. No advertising or
          cross-site tracking cookies are used.
        </p>
        <h2>Third-party services</h2>
        <p>
          Outbound links to partner or affiliate sites are governed by those
          sites&apos; own privacy policies. ImgSync does not forward your data
          to them.
        </p>
        <h2>Contact</h2>
        <p>
          Questions about this policy? Use the links in the footer to reach the
          project maintainers.
        </p>
      </article>
    </main>
  );
}
