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
          information. If analytics are enabled, they are limited to
          aggregate, privacy-respecting page metrics (page views, referrers,
          tool funnel events) — never file contents, which stay on your
          device.
        </p>
        <h2>Cookies and analytics</h2>
        <p>
          ImgSync stores only your interface preferences (such as light/dark
          theme) in your browser&apos;s local storage. We measure site usage
          with Google Analytics 4, which uses cookies to distinguish visits
          and aggregate them into anonymous statistics — page views, referrer
          channels, and tool funnel events. These cookies are never used for
          advertising profiles, and your image files are never part of any
          measurement. You can block analytics cookies with your browser or
          any consent manager without losing tool functionality.
        </p>
        <h2>Third-party services and affiliate links</h2>
        <p>
          Some pages contain links to partner or affiliate sites (for example,
          photo-editing services recommended after a tool completes). When a
          link is an affiliate link, it is marked as sponsored content and
          opens the partner site in a new tab. ImgSync receives a commission
          only if you choose to make a purchase there — your images and tool
          results are never shared with partners, and clicking a link does not
          send us or the partner any of your file data. Outbound sites are
          governed by their own privacy policies.
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
