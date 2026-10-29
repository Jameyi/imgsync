// BDD (Gherkin) — T1g: affiliate promo config, config/ seam
//
// Feature: affiliate promo slots (off by default)
//   As the site owner
//   I want promo slots that are configured but disabled until the
//     affiliate account is approved
//   So that the page is ready for monetisation without exposing
//     dead links to visitors
//
// Scenario: the approved Photoroom promo is visible on its tool
//   Given the F01 tool "remove-white-background" has a Photoroom promo
//     with enabled: true
//   When getPromos("remove-white-background") is called
//   Then the result contains exactly one promo
//   And its brand is "Photoroom" and its href is the partner referral link
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

test("the approved Photoroom promo is visible on its tool", () => {
  const promos = getPromos("remove-white-background");
  assert.equal(promos.length, 1, "exactly one enabled promo for F01");
  assert.equal(promos[0].brand, "Photoroom");
  assert.equal(promos[0].href, "https://refer.photoroom.com/jameyi");
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
