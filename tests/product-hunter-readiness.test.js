"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const data = require("../data/product-hunter/candidates-br-2026-11-09.json");
const { validateCandidates, summarizeCandidates } = require("../src/product-hunter-readiness");

function clone() { return structuredClone(data); }
test("20 source-linked EPROLO prospects, exactly 5 non-purchasable Woo drafts, no profit claims", () => {
  assert.deepEqual(validateCandidates(data), []);
  const s = summarizeCandidates(data);
  assert.equal(s.dataset_valid, true);
  assert.equal(s.total_candidates, 20);
  assert.equal(s.private_woo_drafts, 5);
  assert.equal(s.research_only, 14);
  assert.equal(s.deferred, 1);
  assert.equal(s.approved_for_sale, 0);
  assert.equal(s.auto_purchase_enabled, false);
  assert.equal(s.current_profit_verified, false);
  assert.deepEqual(data.prospects.filter(p => p.woo_draft_id).map(p => p.woo_draft_id), [99,100,101,102,103]);
});
test("reject counterfeit catalog sources and duplicate SKU mapping", () => {
  const bad = clone();
  bad.prospects[1].public_listing_url = bad.prospects[0].public_listing_url;
  assert.ok(validateCandidates(bad).some(e => e.includes("invalid/duplicate")));
  bad.prospects[1].public_listing_url = "http://fake.example/dropshipping";
  assert.ok(validateCandidates(bad).some(e => e.includes("invalid/duplicate")));
  bad.prospects[1].public_listing_url = data.prospects[1].public_listing_url;
  bad.prospects[1].woo_draft_id = 99;
  assert.ok(validateCandidates(bad).some(e => e.includes("unique WooCommerce")));
});
test("reject unsupported claims of approval, real profits, or unverified prices and stock", () => {
  const bad = clone();
  bad.prospects[0].commercially_approved = true;
  bad.prospects[0].supplier_unit_cost_brl = 1.99;
  bad.prospects[0].confirmed_supplier_stock = 199;
  bad.prospects[0].verified_net_margin_brl = 9.99;
  const e = validateCandidates(bad);
  assert.ok(e.some(z => z.includes("unverified commercial")));
  assert.ok(e.some(z => z.includes("unsourced")));
});
test("reject unintended enablement of purchase or checkout in research dataset", () => {
  const bad = clone();
  bad.policy.write_supplier_orders = true;
  bad.policy.release_checkout = true;
  assert.ok(validateCandidates(bad).some(e => e.includes("fail-closed")));
});
