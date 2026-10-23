// BDD (Gherkin) — T1g: affiliate promo config, config/ seam
//
// Feature: affiliate promo slots (off by default)
//   As the site owner
//   I want promo slots that are configured but disabled until the
//     affiliate account is approved
//   So that the page is ready for monetisation without exposing
//     dead links to visitors
//
// Scenario: disabled promos are invisible to the page
//   Given the F01 tool "remove-white-background" has a remove.bg promo
//     with enabled: false
//   When getPromos("remove-white-background") is called
//   Then the result is an empty array
//
// Scenario: promo data is structurally complete
//   Given the raw PROMOS array
//   When it is inspected
//   Then every entry has a non-empty brand, body and href
//   And every href is an absolute http(s) URL
//
// Scenario: tools without promos do not claim any
//   When getPromos("defringe-edges") or getPromos("no-such-tool") is called
//   Then the result is an empty array
//   (PromoCard render behaviour is covered by the live page test in
//    tests/tools-page.test.mjs — the component is pure display driven by
//    this data.)

import test from "node:test";
import assert from "node:assert/strict";
import { getPromos, PROMOS } from "../src/config/promos.ts";

test("disabled promos are invisible to the page", () => {
  assert.deepEqual(
    getPromos("remove-white-background"),
    [],
    "F01 promos exist in PROMOS but are disabled → page sees none",
  );
});

test("promo data is structurally complete", () => {
  assert.ok(PROMOS.length >= 1, "at least one promo is configured");
  for (const promo of PROMOS) {
    assert.ok(promo.brand.trim(), "brand non-empty");
    assert.ok(promo.body.trim(), "body non-empty");
    assert.ok(/^https?:\/\//.test(promo.href), "href is absolute http(s)");
  }
});

test("tools without promos do not claim any", () => {
  assert.deepEqual(getPromos("defringe-edges"), []);
  assert.deepEqual(getPromos("no-such-tool"), []);
});
