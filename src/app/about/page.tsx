import Link from "next/link";
import { repository } from "@/config";
import { pageMetadata } from "@/lib/seo";
export const metadata = pageMetadata(
  "About ImgSync",
  "/about",
  "Why ImgSync exists: free browser-based image tools that process everything locally.",
);
export default function About() {
  return (
    <main id="main">
      <section className="shell page-hero">
        <span className="eyebrow">LOCAL-FIRST, BY DESIGN</span>
        <h1>
          Image tools that
          <br />
          respect your files.
        </h1>
        <p>
          ImgSync brings everyday image tasks together in one place — and every
          file is processed in your own browser.
        </p>
      </section>
      <article className="shell content-shell prose">
        <h2>No uploads. Ever.</h2>
        <p>
          Traditional online image tools upload your files to a server. ImgSync
          uses your browser&apos;s own Canvas and Web Worker APIs, so your
          images never leave your device. That makes it private by default and
          free to run.
        </p>
        <h2>Practical tools, not toys.</h2>
        <p>
          Each tool solves a real task — cleaning up white backgrounds,
          compressing to a size limit, preparing images for marketplaces and
          social platforms — with the options you actually need.
        </p>
        <h2>Open source.</h2>
        <p>
          The project is MIT licensed and the image engine is available as a
          standalone library. Inspect it, adapt it, and build on it.
        </p>
        <div className="inline-links">
          <a href={repository}>Source code ↗</a>
          <a href={`${repository}/issues`}>Share feedback ↗</a>
          <Link href="/docs">Read the docs →</Link>
        </div>
      </article>
    </main>
  );
}
