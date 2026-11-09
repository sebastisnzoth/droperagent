"use strict";

/**
 * Offline, no-external-request Product Hunter gate for DROPERAGENT.
 * Supplier public catalog listings are leads, never purchase authorization.
 * Reusable by GitHub Core CI, sourcing operator and future admin dashboards.
 */
function validateCandidates(data) {
  const errors = [];
  if (!data || data.schema_version !== 1 || !Array.isArray(data.prospects)) {
    return ["Invalid candidate dataset/schema"];
  }
  if (data.policy?.write_supplier_orders !== false ||
      data.policy?.publish_new_products !== false ||
      data.policy?.move_money !== false ||
      data.policy?.release_checkout !== false) {
    errors.push("Dataset launch policy is not fail-closed");
  }
  const ids = new Set(), sourceUrls = new Set(), wooIds = new Set();
  for (const [index, row] of data.prospects.entries()) {
    const tag = row?.id || `row[${index}]`;
    if (!row || !/^PH-\d{3}$/.test(row.id || "") || ids.has(row.id)) {
      errors.push(`${tag}: duplicate/invalid candidate ID`);
    } else ids.add(row.id);
    const url = row?.public_listing_url;
    if (typeof url !== "string" || !/^https:\/\/eprolo\.com\/app\/product\//i.test(url) ||
        sourceUrls.has(url)) {
      errors.push(`${tag}: invalid/duplicate supplier public listing URL`);
    } else sourceUrls.add(url);
    if (!row.name_pt || typeof row.name_pt !== "string" || !row.category) {
      errors.push(`${tag}: missing product name/category`);
    }
    if (row.source !== "EPROLO_PUBLIC_LISTING") {
      errors.push(`${tag}: unsupported/unverified source`);
    }
    if (!["SHORTLIST_DRAFT", "RESEARCH_ONLY", "DEFERRED_REVIEW"].includes(row.state)) {
      errors.push(`${tag}: unrecognized prospect state`);
    }
    if (row.state === "SHORTLIST_DRAFT" &&
        (!Number.isSafeInteger(row.woo_draft_id) || row.woo_draft_id < 1 ||
         wooIds.has(row.woo_draft_id))) {
      errors.push(`${tag}: expected a unique WooCommerce draft ID`);
    }
    if (row.woo_draft_id !== null && row.state !== "SHORTLIST_DRAFT") {
      errors.push(`${tag}: draft product exists outside shortlist status`);
    }
    if (Number.isSafeInteger(row.woo_draft_id)) wooIds.add(row.woo_draft_id);
    // This file is a public prospecting dataset; no unverified financial truth.
    if (row.commercially_approved !== false ||
        row.auto_purchase_authorized !== false ||
        row.delivery_to_brazil_verified !== false ||
        row.regulatory_review_complete !== false ||
        row.images_licensed !== false ||
        row.verified_net_margin_brl !== null) {
      errors.push(`${tag}: unverified commercial authorization/claims`);
    }
    if (row.supplier_unit_cost_brl !== null ||
        row.confirmed_supplier_stock !== null ||
        row.freight_quote_brl !== null ||
        row.sales_price_brl !== null) {
      errors.push(`${tag}: unsourced price, stock or shipping claim`);
    }
    if (!row.public_listing_facts || !row.blocking_questions) {
      errors.push(`${tag}: missing source facts or verification questions`);
    }
  }
  return errors;
}
function summarizeCandidates(data) {
  const errors = validateCandidates(data);
  const prospects = Array.isArray(data?.prospects) ? data.prospects : [];
  return {
    total_candidates: prospects.length,
    private_woo_drafts: prospects.filter(p => p.state === "SHORTLIST_DRAFT").length,
    research_only: prospects.filter(p => p.state === "RESEARCH_ONLY").length,
    deferred: prospects.filter(p => p.state === "DEFERRED_REVIEW").length,
    approved_for_sale: 0,
    auto_purchase_enabled: false,
    current_profit_verified: false,
    dataset_valid: errors.length === 0,
    errors,
  };
}
module.exports = { validateCandidates, summarizeCandidates };
