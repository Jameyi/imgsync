// BDD (Gherkin) — T1f: per-tool guide content (how-to steps + FAQ), content/ seam
//
// Feature: F01 guide data
//   As a visitor arriving from search
//   I want a how-to walkthrough and an honest FAQ on the tool page
//   So that I can trust the tool before I upload and after I download
//
// Scenario: implemented tool carries exactly its guide
//   Given the F01 tool "remove-white-background" is implemented
//   When the guide is looked up by slug
//   Then it has exactly 3 how-to steps and 2 FAQs
//   And every step has a non-empty title and body
//   And every FAQ has a non-empty question and answer
//
// Scenario: guide copy matches the approved demo wording (2026-10-21)
//   When the F01 guide is loaded
//   Then step titles are, in order:
//     "Drop your white-background photo"
//     "Set the tolerance"
//     "Download a transparent PNG"
//   And FAQ questions are, in order:
//     "Will light gray count as background too?"
//     "Why is there still a white outline on dark themes?"
//
// Scenario: tools without a guide do not claim one
//   When the guide is looked up for a draft slug ("defringe-edges")
//     or an unknown slug ("no-such-tool")
//   Then the result is undefined
//   (visible page render + FAQPage schema are covered in tests/tools-page.test.mjs)
//
// Scenario GC1: compress-to-size carries exactly its guide (T2)
//   Given the F10 tool "compress-to-size" is implemented
//   When the guide is looked up by slug
//   Then it has exactly 3 how-to steps and 2 FAQs
//   And every step has a non-empty title and body
//
// Scenario GC2: guide copy matches the approved T2 wording
//   When the F10 guide is loaded
//   Then step titles are, in order:
//     "Drop your product photo"
//     "Enter your target in KB"
//     "Download the fitted JPEG"
//   And FAQ questions are, in order:
//     "Why is the output always JPEG?"
//     "What if the image can't reach my target?"
//
// Scenario GC3: only truly draft slugs carry no guide
//   When the guide is looked up for "platform-preflight" or "no-such-tool"
//   Then the result is undefined
//
// Scenario GE1: resize-to-preset carries exactly its guide (T4)
//   Given the F02 tool "resize-to-preset" is implemented
//   When the guide is looked up by slug
//   Then it has exactly 3 how-to steps and 2 FAQs
//   And every step and FAQ field is non-empty
//
// Scenario GE2: resize-to-preset guide copy matches the approved T4 wording
//   When the F02 guide is loaded
//   Then step titles are, in order:
//     "Drop your product photo"
//     "Pick a platform preset"
//     "Download the ready image"
//   And FAQ questions are, in order:
//     "Will my photo get stretched or distorted?"
//     "What fills the empty space around my photo?"
//
// Scenario GD1: defringe-edges carries exactly its guide (T3)
//   Given the F08 tool "defringe-edges" is implemented
//   When the guide is looked up by slug
//   Then it has exactly 3 how-to steps and 2 FAQs
//   And every step and FAQ field is non-empty
//
// Scenario GD2: defringe-edges guide copy matches the approved T3 wording
//   When the F08 guide is loaded
//   Then step titles are, in order:
//     "Drop your cutout PNG"
//     "Defringe the edge"
//     "Download the clean PNG"
//   And FAQ questions are, in order:
//     "Why does my cutout glow white on dark backgrounds?"
//     "Will defringing blur or shrink my edges?"

import test from "node:test";
import assert from "node:assert/strict";
import { getGuide } from "../src/content/tool-guides.ts";

test("implemented tool carries exactly its guide", () => {
  const guide = getGuide("remove-white-background");
  assert.ok(guide, "F01 has a guide");
  assert.equal(guide.steps.length, 3, "exactly 3 how-to steps");
  assert.equal(guide.faqs.length, 2, "exactly 2 FAQs");
  for (const step of guide.steps) {
    assert.ok(step.title.trim(), "step title non-empty");
    assert.ok(step.body.trim(), "step body non-empty");
  }
  for (const faq of guide.faqs) {
    assert.ok(faq.question.trim(), "faq question non-empty");
    assert.ok(faq.answer.trim(), "faq answer non-empty");
  }
});

test("guide copy matches the approved demo wording", () => {
  const guide = getGuide("remove-white-background");
  assert.deepEqual(
    guide.steps.map((step) => step.title),
    [
      "Drop your white-background photo",
      "Set the tolerance",
      "Download a transparent PNG",
    ],
    "step titles in order",
  );
  assert.deepEqual(
    guide.faqs.map((faq) => faq.question),
    [
      "Will light gray count as background too?",
      "Why is there still a white outline on dark themes?",
    ],
    "faq questions in order",
  );
});

test("tools without a guide do not claim one", () => {
  assert.equal(getGuide("platform-preflight"), undefined, "draft slug has no guide");
  assert.equal(getGuide("no-such-tool"), undefined, "unknown slug has no guide");
});

test("resize-to-preset carries exactly its guide (GE1)", () => {
  const guide = getGuide("resize-to-preset");
  assert.ok(guide, "F02 has a guide");
  assert.equal(guide.steps.length, 3, "exactly 3 how-to steps");
  assert.equal(guide.faqs.length, 2, "exactly 2 FAQs");
  for (const step of guide.steps) {
    assert.ok(step.title.trim(), "step title non-empty");
    assert.ok(step.body.trim(), "step body non-empty");
  }
  for (const faq of guide.faqs) {
    assert.ok(faq.question.trim(), "faq question non-empty");
    assert.ok(faq.answer.trim(), "faq answer non-empty");
  }
});

test("resize-to-preset guide copy matches the approved wording (GE2)", () => {
  const guide = getGuide("resize-to-preset");
  assert.ok(guide, "F02 has a guide");
  assert.deepEqual(
    guide.steps.map((step) => step.title),
    [
      "Drop your product photo",
      "Pick a platform preset",
      "Download the ready image",
    ],
    "step titles in order",
  );
  assert.deepEqual(
    guide.faqs.map((faq) => faq.question),
    [
      "Will my photo get stretched or distorted?",
      "What fills the empty space around my photo?",
    ],
    "faq questions in order",
  );
});

test("defringe-edges carries exactly its guide (GD1)", () => {
  const guide = getGuide("defringe-edges");
  assert.ok(guide, "F08 has a guide");
  assert.equal(guide.steps.length, 3, "exactly 3 how-to steps");
  assert.equal(guide.faqs.length, 2, "exactly 2 FAQs");
  for (const step of guide.steps) {
    assert.ok(step.title.trim(), "step title non-empty");
    assert.ok(step.body.trim(), "step body non-empty");
  }
  for (const faq of guide.faqs) {
    assert.ok(faq.question.trim(), "faq question non-empty");
    assert.ok(faq.answer.trim(), "faq answer non-empty");
  }
});

test("defringe-edges guide copy matches the approved wording (GD2)", () => {
  const guide = getGuide("defringe-edges");
  assert.ok(guide, "F08 has a guide");
  assert.deepEqual(
    guide.steps.map((step) => step.title),
    [
      "Drop your cutout PNG",
      "Defringe the edge",
      "Download the clean PNG",
    ],
    "step titles in order",
  );
  assert.deepEqual(
    guide.faqs.map((faq) => faq.question),
    [
      "Why does my cutout glow white on dark backgrounds?",
      "Will defringing blur or shrink my edges?",
    ],
    "faq questions in order",
  );
});

test("compress-to-size carries exactly its guide (GC1)", () => {
  const guide = getGuide("compress-to-size");
  assert.ok(guide, "F10 has a guide");
  assert.equal(guide.steps.length, 3, "exactly 3 how-to steps");
  assert.equal(guide.faqs.length, 2, "exactly 2 FAQs");
  for (const step of guide.steps) {
    assert.ok(step.title.trim(), "step title non-empty");
    assert.ok(step.body.trim(), "step body non-empty");
  }
  for (const faq of guide.faqs) {
    assert.ok(faq.question.trim(), "faq question non-empty");
    assert.ok(faq.answer.trim(), "faq answer non-empty");
  }
});

test("compress-to-size guide copy matches the approved wording (GC2)", () => {
  const guide = getGuide("compress-to-size");
  assert.ok(guide, "F10 has a guide");
  assert.deepEqual(
    guide.steps.map((step) => step.title),
    [
      "Drop your product photo",
      "Enter your target in KB",
      "Download the fitted JPEG",
    ],
    "step titles in order",
  );
  assert.deepEqual(
    guide.faqs.map((faq) => faq.question),
    [
      "Why is the output always JPEG?",
      "What if the image can't reach my target?",
    ],
    "faq questions in order",
  );
});
