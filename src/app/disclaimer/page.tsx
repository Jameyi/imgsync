import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata(
  "Disclaimer",
  "/disclaimer",
  "ImgSync output guidance: verify processed images against each platform's current requirements before publishing.",
);

export default function Disclaimer() {
  return (
    <main id="main">
      <section className="shell page-hero">
        <span className="eyebrow">DISCLAIMER</span>
        <h1>Disclaimer</h1>
        <p>
          Guidance on this site reflects platform requirements at the time of
          writing — always double-check before you publish.
        </p>
      </section>
      <article className="shell content-shell prose">
        <h2>Platform requirements change</h2>
        <p>
          Marketplace and social platform specifications (image dimensions,
          file-size limits, aspect ratios) change without notice. The presets
          and preflight checks in ImgSync are based on published requirements
          at the time of the latest update and may lag behind.
        </p>
        <h2>Verify before you publish</h2>
        <p>
          Processed output — especially size-limited compression and background
          removal — should be reviewed by you against the target
          platform&apos;s current rules before uploading. ImgSync cannot
          guarantee acceptance of any processed file.
        </p>
        <h2>Affiliate links</h2>
        <p>
          Some outbound links on this site may be affiliate links. If you buy
          through them, the vendor may pay us a commission at no extra cost to
          you. This never affects which files we recommend or how the tools
          process your images — tools run locally and see none of it.
        </p>
        <h2>Not legal advice</h2>
        <p>
          Nothing on this site is legal, licensing, or marketplace-policy
          advice. Consult the platform or a professional for your specific
          situation.
        </p>
      </article>
    </main>
  );
}
