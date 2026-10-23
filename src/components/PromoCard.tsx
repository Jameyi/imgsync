"use client";

import { track } from "@/lib/tools/runtime";
import type { Promo } from "@/config/promos";

export default function PromoCard({
  promo,
  toolSlug,
}: {
  promo: Promo;
  toolSlug: string;
}) {
  return (
    <aside className="rounded-lg border border-[var(--border)] bg-[var(--soft)] p-5">
      <div className="mb-3 flex items-center justify-between">
        <span className="rounded bg-[#fff0ce] px-1.5 py-0.5 text-[9px] font-bold tracking-[0.08em] text-[#ac6b12]">
          SPONSORED
        </span>
        <span className="text-[10px] text-[var(--muted)]">Disclosure ↓</span>
      </div>
      <div className="text-[14px] font-semibold">{promo.brand}</div>
      <p className="mt-1.5 text-[11px] leading-6">{promo.body}</p>
      <a
        href={promo.href}
        rel="sponsored noopener"
        target="_blank"
        className="button button-dark mt-4 block w-full"
        onClick={() =>
          track({ tool: toolSlug, step: "promo_click", meta: { brand: promo.brand } })
        }
      >
        Try {promo.brand} →
      </a>
      <p className="mt-3 border-t border-[var(--border)] pt-3 text-[10px] leading-5 text-[var(--muted)]">
        Sponsored content. We may earn a commission from links on this page — it never
        affects tool results, which are computed locally.
      </p>
    </aside>
  );
}
