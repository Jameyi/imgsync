import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata(
  "Contact ImgSync",
  "/contact",
  "Reach the ImgSync team: feedback, bug reports and partnership questions.",
);

const CONTACT_EMAIL = "contact@civlensai.com";

export default function Contact() {
  return (
    <main id="main">
      <section className="shell page-hero">
        <span className="eyebrow">CONTACT</span>
        <h1>Contact</h1>
        <p>
          ImgSync has no accounts and no support inbox tied to your files —
          because we never see them. Here is how to reach us.
        </p>
      </section>
      <article className="shell content-shell prose">
        <h2>Bug reports and feedback</h2>
        <p>
          Email us with the tool you used, your browser, and what you expected
          — a screenshot helps. We read everything.
        </p>
        <div className="inline-links">
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        </div>
        <h2>Privacy questions</h2>
        <p>
          Because images are processed locally, there is no data to request or
          delete on your behalf. For questions about this site&apos;s own
          analytics, see the <a href="/privacy-policy">Privacy Policy</a> and
          write to us at the address above.
        </p>
        <h2>Partnerships</h2>
        <p>
          Tool partnerships and affiliate proposals are welcome at the same
          address — put &quot;partnership&quot; in the subject so they can be
          triaged quickly.
        </p>
      </article>
    </main>
  );
}
