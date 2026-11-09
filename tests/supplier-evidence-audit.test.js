'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { evaluateSupplierEvidence, moneyToCents, validEvidenceTime } = require('../src/supplier-evidence-audit');

const NOW = Date.parse('2026-11-08T21:00:00Z');
function fixture() {
  return {
    storeVariants: [{ sku: 'SHOP-38', options: { Color: 'Black' }, priceBRL: '100.00', currency: 'BRL' }],
    supplierVariants: [{ sku: 'CN-38-BLK', options: { color: 'black' }, available: true }],
    rules: [],
    quotes: [{
      storeSku: 'SHOP-38', supplierSku: 'CN-38-BLK',
      destinationCountry: 'BR', currency: 'BRL',
      sourceType: 'supplier_quote', sourceReference: 'supplier-ref-001',
      checkedAt: '2026-11-08T20:00:00Z',
      mappingReviewed: true, stockReviewed: true,
      productBRL: '35.00', shippingBRL: '15.00', taxesBRL: '12.00',
      paymentFeesBRL: '5.00', advertisingBRL: '3.00',
      returnsReserveBRL: '4.00', otherFeesBRL: '1.00'
    }],
    policy: { minimumMarginPercent: '20.00' }
  };
}
function run(input) { return evaluateSupplierEvidence(input, { now: NOW }); }

test('passes valid supplied evidence for MANUAL REVIEW only, with correct BRL arithmetic', () => {
  const result = run(fixture());
  assert.equal(result.status, 'READY_FOR_MANUAL_REVIEW');
  assert.equal(result.summary.readyForReview, 1);
  assert.equal(result.results[0].totalCostBRL, '75.00');
  assert.equal(result.results[0].estimatedProfitBRL, '25.00');
  assert.equal(result.results[0].estimatedMarginPercent, '25.00');
  assert.equal(result.supplierAccountVerified, false);
  assert.equal(result.priceVerifiedAgainstWooCommerce, false);
  assert.equal(result.safeToSubmit, false);
  assert.equal(result.paymentAuthorized, false);
  assert.equal(result.purchaseAuthorized, false);
  assert.equal(JSON.stringify(result).includes('supplier-ref-001'), false);
});

test('requires exact supplier SKU and delegates mapping to merged Mapping Guard', () => {
  const data = fixture();
  data.quotes[0].supplierSku = 'CN-OTHER';
  assert.ok(run(data).results[0].reasons.includes('SUPPLIER_SKU_MISMATCH'));
  data.quotes[0].supplierSku = 'CN-38-BLK';
  data.supplierVariants[0].options = { Color: 'Red' };
  assert.ok(run(data).results[0].reasons.includes('MAPPING_NO_SUPPLIER_MATCH'));
});

test('blocks missing, duplicate and unknown quotations', () => {
  const data = fixture();
  data.quotes = [];
  assert.ok(run(data).results[0].reasons.includes('QUOTE_MISSING'));
  data.quotes = [fixture().quotes[0], fixture().quotes[0]];
  assert.ok(run(data).globalBlockers.includes('DUPLICATE_QUOTE'));
  data.quotes = [{ ...fixture().quotes[0], storeSku: 'NOT-OUR-SKU' }];
  assert.ok(run(data).globalBlockers.includes('UNKNOWN_OR_MALFORMED_QUOTE'));
});

test('blocks expired timestamps and future-dated claims', () => {
  const data = fixture();
  data.quotes[0].checkedAt = '2026-11-05T19:00:00Z';
  assert.ok(run(data).results[0].reasons.includes('QUOTE_EXPIRED_OR_INVALID'));
  assert.equal(run(data).results[0].estimatedMarginPercent, null);
  data.quotes[0].checkedAt = '2026-11-08T21:10:00Z';
  assert.ok(run(data).results[0].reasons.includes('QUOTE_EXPIRED_OR_INVALID'));
  assert.equal(validEvidenceTime('2026-11-08T20:00:00Z', NOW), true);
  assert.equal(validEvidenceTime('2026-11-08 20:00:00', NOW), false);
});

test('blocks missing country, currency and provenance without inventing exchange rates', () => {
  const data = fixture();
  data.quotes[0].destinationCountry = 'US';
  data.quotes[0].currency = 'USD';
  data.quotes[0].sourceReference = '';
  const reasons = run(data).results[0].reasons;
  assert.ok(reasons.includes('BRAZIL_BRL_QUOTE_REQUIRED'));
  assert.ok(reasons.includes('SOURCE_PROVENANCE_MISSING'));
  assert.equal(run(data).results[0].estimatedProfitBRL, null);
  assert.equal(run(data).results[0].estimatedMarginPercent, null);
});

test('blocks missing costs and unjustified zero costs', () => {
  const data = fixture();
  delete data.quotes[0].taxesBRL;
  assert.ok(run(data).results[0].reasons.includes('REQUIRED_COSTS_MISSING'));
  data.quotes[0].taxesBRL = '0.00';
  assert.ok(run(data).results[0].reasons.includes('ZERO_COST_WITHOUT_RATIONALE'));
  data.quotes[0].zeroCostRationale = { taxesBRL: 'Tax cost confirmed zero by authorized tax review' };
  assert.equal(run(data).results[0].reasons.includes('ZERO_COST_WITHOUT_RATIONALE'), false);
});

test('enforces explicit minimum net margin policy, not a fictional default', () => {
  const data = fixture();
  data.policy.minimumMarginPercent = '30.00';
  const result = run(data);
  assert.equal(result.status, 'BLOCKED');
  assert.ok(result.results[0].reasons.includes('MARGIN_BELOW_POLICY'));
  data.policy = {};
  assert.throws(() => run(data), /minimumMarginPercent/);
});

test('blocks unreviewed stock/mapping and unknown supplier availability', () => {
  const data = fixture();
  data.quotes[0].mappingReviewed = false;
  data.quotes[0].stockReviewed = false;
  data.supplierVariants[0].available = undefined;
  const reasons = run(data).results[0].reasons;
  assert.ok(reasons.includes('HUMAN_REVIEW_UNCONFIRMED'));
  assert.ok(reasons.includes('MAPPING_SUPPLIER_AVAILABILITY_UNCONFIRMED'));
});

test('rejects suspicious amounts, malformed requests and oversized batches', () => {
  const data = fixture();
  for (const invalid of ['-1', '12.999', '1e6', 'R$ 20,00', 50]) {
    assert.equal(moneyToCents(invalid), null);
  }
  data.storeVariants[0].priceBRL = 'R$ 100,00';
  assert.ok(run(data).results[0].reasons.includes('STORE_PRICE_BRL_UNVERIFIED'));
  data.storeVariants = Array.from({ length: 101 }, (_, i) => ({ sku: String(i), options: { Color: 'black' } }));
  assert.throws(() => run(data), /bounded/);
  assert.throws(() => run(null), TypeError);
});

test('blocks duplicate store SKU even when each option is different', () => {
  const data = fixture();
  data.storeVariants.push({ ...data.storeVariants[0], options: { Color: 'Blue' } });
  const result = run(data);
  assert.ok(result.globalBlockers.includes('DUPLICATE_STORE_SKU'));
  assert.equal(result.status, 'BLOCKED');
});

test('explicit alias rules never enable purchase or payment', () => {
  const data = fixture();
  data.supplierVariants[0].options = { shade: 'dark' };
  data.rules = [{
    storeSku: 'SHOP-38',
    storeOptions: { Color: 'Black' },
    supplierOptions: { shade: 'dark' },
    approved: true
  }];
  const result = run(data);
  assert.equal(result.status, 'READY_FOR_MANUAL_REVIEW');
  assert.equal(result.safeToSubmit, false);
  assert.equal(result.purchaseAuthorized, false);
});
