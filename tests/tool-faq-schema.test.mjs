// BDD (Gherkin) — T1f: FAQPage JSON-LD builder, lib/seo.ts seam
//
// Feature: FAQ schema for tool guides
//   As a search engine and AI answer engine
//   I want FAQPage structured data matching the visible FAQ on the page
//   So that the answers are citable in rich results and AI-generated answers
//
// Scenario: faqPage wraps questions as FAQPage with accepted answers
//   Given a list of {question, answer} pairs
//   When faqPage(faqs) is called
//   Then the result has @context "https://schema.org" and @type "FAQPage"
//   And mainEntity has one Question per pair, in the same order
//   And each Question carries its question text as name
//     and its answer text as acceptedAnswer.text (@type "Answer")
//
// Scenario: an empty list produces an empty mainEntity (no invented FAQs)
//   When faqPage([]) is called
//   Then mainEntity is an empty array
//   (JSON-LD escaping on render is handled by the shared JsonLd component,
//    already covered by existing tool-page assertions)

import test from "node:test";
import assert from "node:assert/strict";
import { faqPage } from "../src/lib/seo.ts";

test("faqPage wraps questions as FAQPage with accepted answers", () => {
  const faqs = [
    { question: "Q one?", answer: "A one." },
    { question: "Q two?", answer: "A two." },
  ];
  const schema = faqPage(faqs);
  assert.equal(schema["@context"], "https://schema.org");
  assert.equal(schema["@type"], "FAQPage");
  assert.equal(schema.mainEntity.length, 2, "one Question per pair");
  for (let i = 0; i < faqs.length; i++) {
    const entry = schema.mainEntity[i];
    assert.equal(entry["@type"], "Question");
    assert.equal(entry.name, faqs[i].question, "question text in order");
    assert.deepEqual(entry.acceptedAnswer, {
      "@type": "Answer",
      text: faqs[i].answer,
    }, "acceptedAnswer carries the answer text");
  }
});

test("an empty list produces an empty mainEntity", () => {
  const schema = faqPage([]);
  assert.deepEqual(schema.mainEntity, [], "no invented FAQs");
});
