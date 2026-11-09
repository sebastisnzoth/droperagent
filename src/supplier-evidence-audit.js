'use strict';
/**
 * Supplier Evidence Preflight — explicitly caller-supplied, offline evidence.
 * Complements the merged Mapping Guard, never overrides it.
 * NO DSers API connection, WooCommerce write, pricing update, purchase or payment.
 */
const { evaluateMapping } = require('./supplier-mapping-guard');

const COST_FIELDS = Object.freeze([
  'productBRL', 'shippingBRL', 'taxesBRL', 'paymentFeesBRL',
  'advertisingBRL', 'returnsReserveBRL', 'otherFeesBRL'
]);
const SOURCE_TYPES = new Set(['dsers_export', 'supplier_quote', 'marketplace_page', 'manual_review']);
const MAX_QUOTE_AGE_MS = 72 * 60 * 60 * 1000;
const MAX_FUTURE_SKEW_MS = 5 * 60 * 1000;

function plainRecord(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

function moneyToCents(value) {
  if (typeof value !== 'string' || !/^(?:0|[1-9][0-9]{0,8})(?:\.[0-9]{1,2})?$/.test(value)) return null;
  const [units, fraction = ''] = value.split('.');
  const cents = Number(units) * 100 + Number((fraction + '00').slice(0, 2));
  return Number.isSafeInteger(cents) ? cents : null;
}

function centsToBRL(cents) {
  return (cents / 100).toFixed(2);
}

function uniqueText(value, max = 160) {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= max;
}

function validEvidenceTime(timestamp, nowMs) {
  if (typeof timestamp !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(timestamp)) return false;
  const time = Date.parse(timestamp);
  return Number.isFinite(time) && time <= nowMs + MAX_FUTURE_SKEW_MS &&
    nowMs - time <= MAX_QUOTE_AGE_MS;
}

function evaluateSupplierEvidence(input = {}, { now = Date.now() } = {}) {
  if (!plainRecord(input) || !Number.isFinite(now)) throw new TypeError('Invalid evidence request');
  const { storeVariants, supplierVariants, rules = [], quotes, policy } = input;
  if (!Array.isArray(storeVariants) || !Array.isArray(supplierVariants) ||
      !Array.isArray(rules) || !Array.isArray(quotes) || !plainRecord(policy) ||
      storeVariants.length === 0 || storeVariants.length > 100 ||
      supplierVariants.length === 0 || supplierVariants.length > 100 ||
      rules.length > 100 || quotes.length > 100) {
    throw new TypeError('Expected bounded mapping and quotation arrays with policy');
  }
  const minimumMarginBasisPoints = moneyToCents(policy.minimumMarginPercent);
  if (minimumMarginBasisPoints === null || minimumMarginBasisPoints > 10000) {
    throw new TypeError('Policy must provide minimumMarginPercent from 0.00 to 100.00');
  }

  // The merged Mapping Guard remains the sole authority for option/SKU matching.
  const mapping = evaluateMapping({ storeVariants, supplierVariants, rules });
  const quoteBySku = new Map();
  const duplicateQuotes = new Set();
  const storeIds = new Set();
  const duplicateStoreIds = new Set();
  for (const entry of storeVariants) {
    if (!uniqueText(entry?.sku)) continue;
    if (storeIds.has(entry.sku)) duplicateStoreIds.add(entry.sku);
    storeIds.add(entry.sku);
  }
  for (const quote of quotes) {
    if (!plainRecord(quote) || !uniqueText(quote.storeSku)) continue;
    if (quoteBySku.has(quote.storeSku)) duplicateQuotes.add(quote.storeSku);
    quoteBySku.set(quote.storeSku, quote);
  }

  const unknownQuotes = quotes.some(quote =>
    !plainRecord(quote) || !uniqueText(quote.storeSku) || !storeIds.has(quote.storeSku)
  );
  const globalBlockers = [];
  if (unknownQuotes) globalBlockers.push('UNKNOWN_OR_MALFORMED_QUOTE');
  if (duplicateQuotes.size) globalBlockers.push('DUPLICATE_QUOTE');
  if (duplicateStoreIds.size) globalBlockers.push('DUPLICATE_STORE_SKU');
  const results = storeVariants.map((store, index) => {
    const mapped = mapping.results[index];
    const reasons = [];
    if (!mapped || mapped.status !== 'READY_FOR_REVIEW') reasons.push('MAPPING_' + (mapped?.reason || 'UNVERIFIED'));
    if (!uniqueText(store?.sku)) reasons.push('MISSING_STORE_SKU');
    if (duplicateStoreIds.has(store?.sku)) reasons.push('DUPLICATE_STORE_SKU');
    const priceCents = moneyToCents(store?.priceBRL);
    if (priceCents === null || priceCents <= 0 || store.currency !== 'BRL') {
      reasons.push('STORE_PRICE_BRL_UNVERIFIED');
    }
    const quote = quoteBySku.get(store?.sku);
    let totalCost = null;
    let profit = null;
    let margin = null;
    if (!quote) {
      reasons.push('QUOTE_MISSING');
    } else {
      if (duplicateQuotes.has(store?.sku)) reasons.push('DUPLICATE_QUOTE');
      if (!uniqueText(quote.supplierSku) || quote.supplierSku !== mapped?.supplierSku) {
        reasons.push('SUPPLIER_SKU_MISMATCH');
      }
      if (quote.currency !== 'BRL' || quote.destinationCountry !== 'BR') {
        reasons.push('BRAZIL_BRL_QUOTE_REQUIRED');
      }
      if (!SOURCE_TYPES.has(quote.sourceType) || !uniqueText(quote.sourceReference, 180)) {
        reasons.push('SOURCE_PROVENANCE_MISSING');
      }
      if (!validEvidenceTime(quote.checkedAt, now)) reasons.push('QUOTE_EXPIRED_OR_INVALID');
      if (quote.mappingReviewed !== true || quote.stockReviewed !== true) {
        reasons.push('HUMAN_REVIEW_UNCONFIRMED');
      }
      const amounts = COST_FIELDS.map(name => moneyToCents(quote[name]));
      if (amounts.some(cents => cents === null)) {
        reasons.push('REQUIRED_COSTS_MISSING');
      } else {
        for (let i = 0; i < COST_FIELDS.length; i++) {
          if (amounts[i] === 0) {
            const text = plainRecord(quote.zeroCostRationale) && quote.zeroCostRationale[COST_FIELDS[i]];
            if (!uniqueText(text, 200) || text.trim().length < 8) {
              reasons.push('ZERO_COST_WITHOUT_RATIONALE');
              break;
            }
          }
        }
        // Do not label a stale, foreign-currency, mismatched or unreviewed quote as BRL margin.
        // A low margin is still displayed so the reviewer can see why the quote was blocked.
        if (reasons.length === 0 && priceCents !== null && priceCents > 0) {
          totalCost = amounts.reduce((sum, value) => sum + value, 0);
          profit = priceCents - totalCost;
          const basisPoints = Math.floor((profit / priceCents) * 10000);
          margin = (basisPoints / 100).toFixed(2);
          if (basisPoints < minimumMarginBasisPoints) reasons.push('MARGIN_BELOW_POLICY');
        }
      }
    }
    const status = reasons.length ? 'BLOCKED' : 'READY_FOR_MANUAL_REVIEW';
    return {
      storeSku: uniqueText(store?.sku) ? store.sku : null,
      supplierSku: mapped?.supplierSku || null,
      status, reasons: [...new Set(reasons)],
      salePriceBRL: priceCents === null ? null : centsToBRL(priceCents),
      totalCostBRL: totalCost === null ? null : centsToBRL(totalCost),
      estimatedProfitBRL: profit === null ? null : centsToBRL(profit),
      estimatedMarginPercent: margin,
      evidenceType: quote && SOURCE_TYPES.has(quote.sourceType) ? quote.sourceType : null
    };
  });

  const ready = results.filter(row => row.status === 'READY_FOR_MANUAL_REVIEW').length;
  return {
    status: globalBlockers.length || ready !== results.length ? 'BLOCKED' : 'READY_FOR_MANUAL_REVIEW',
    source: 'caller_supplied_unverified',
    readOnly: true,
    supplierAccountVerified: false,
    priceVerifiedAgainstWooCommerce: false,
    mappedBy: 'supplier-mapping-guard',
    purchaseAuthorized: false,
    paymentAuthorized: false,
    safeToSubmit: false,
    marginPolicyPercent: centsToBRL(minimumMarginBasisPoints),
    quoteAgeLimitHours: 72,
    globalBlockers,
    summary: { total: results.length, readyForReview: ready, blocked: results.length - ready },
    results
  };
}

module.exports = { evaluateSupplierEvidence, moneyToCents, validEvidenceTime };
