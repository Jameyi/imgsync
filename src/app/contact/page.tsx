import type { Metadata } from "next";
import { repository } from "@/config";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata(
  "Contact ImgSync",
  "/contact",
  "Reach the ImgSync maintainers: feedback, bug reports and partnership questions.",
);

export default function Contact() {
  return (
    <main id="main">
      <section className="shell page-hero">
        <span className="eyebrow">CONTACT</span>
        <h1>Contact</h1>
        <p>
          ImgSync has no accounts and no support inbox tied to your files —
          because we never see them. Here is how to reach the maintainers.
        </p>
      </section>
      <article className="shell content-shell prose">
        <h2>Bug reports and feedback</h2>
        <p>
          The fastest way to get something fixed is the public issue tracker —
          include the tool you used, your browser, and what you expected.
        </p>
        <div className="inline-links">
          <a href={`${repository}/issues`}>Open an issue ↗</a>
        </div>
        <h2>Privacy questions</h2>
        <p>
          Because images are processed locally, there is no data to request or
          delete on your behalf. For questions about this site&apos;s own
          analytics, see the{" "}
          <a href="/privacy-policy">Privacy Policy</a> and open an issue.
        </p>
        <h2>Partnerships</h2>
        <p>
          Tool partnerships and affiliate proposals are welcome via the issue
          tracker as well — mark them clearly so they can be triaged.
        </p>
      </article>
    </main>
  );
}
