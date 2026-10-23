import type { ToolGuide } from "@/content/tool-guides";

export default function ToolGuideSection({ guide }: { guide: ToolGuide }) {
  return (
    <section className="shell py-14">
      <span className="eyebrow">How it works</span>
      <h2 className="text-[clamp(24px,2.8vw,34px)]">Three steps, thirty seconds.</h2>
      <ol className="steps mt-8">
        {guide.steps.map((step, i) => (
          <li key={step.title}>
            <span>{String(i + 1).padStart(2, "0")}</span>
            <div>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <h2 className="mt-12 text-[clamp(24px,2.8vw,34px)]">Frequently asked questions</h2>
      <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
        {guide.faqs.map((faq) => (
          <div
            key={faq.question}
            className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6"
          >
            <h3 className="text-[15px]">{faq.question}</h3>
            <p className="mt-2 text-[12px] leading-6">{faq.answer}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
