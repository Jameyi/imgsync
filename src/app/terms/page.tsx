import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata(
  "Terms of Service",
  "/terms",
  "Terms for using ImgSync's free browser-based image tools. No accounts, no warranties — use the tools as they are.",
);

export default function Terms() {
  return (
    <main id="main">
      <section className="shell page-hero">
        <span className="eyebrow">TERMS</span>
        <h1>Terms of Service</h1>
        <p>
          ImgSync is free to use, without accounts. These terms explain what
          that means for both sides.
        </p>
      </section>
      <article className="shell content-shell prose">
        <h2>The service</h2>
        <p>
          ImgSync provides browser-based image tools that process files locally
          on your device. The service is provided free of charge, as-is, and
          may change or be discontinued at any time.
        </p>
        <h2>Your content</h2>
        <p>
          You keep all rights to the images you process. Because processing
          happens in your browser, we never receive, store, or claim any rights
          over your files. You are responsible for having the rights to use the
          images you process.
        </p>
        <h2>Acceptable use</h2>
        <p>
          Do not use ImgSync to process content you do not have the rights to,
          or to violate any applicable law. Automated abuse of the site
          (scraping, load generation) is not permitted.
        </p>
        <h2>No warranty</h2>
        <p>
          The tools are provided without warranty of any kind. Always keep your
          original files — processed output should be verified before
          production use, especially for size-limited marketplace uploads.
        </p>
        <h2>Limitation of liability</h2>
        <p>
          To the maximum extent permitted by law, the maintainers are not
          liable for any damages arising from use of the service.
        </p>
      </article>
    </main>
  );
}
