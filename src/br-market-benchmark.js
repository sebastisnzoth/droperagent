'use strict';

/**
 * Read-only market benchmarking. Public Brazilian retail prices are not
 * supplier offers, independent stock checks or purchase authorization.
 * Does not read/write WooCommerce, payments or external vendor APIs.
 */
function cents(value) {
  if (typeof value !== 'string' ||
      !/^(?:0|[1-9][0-9]{0,7})(?:\.[0-9]{1,2})?$/.test(value)) return null;
  const [unit, decimal = ''] = value.split('.');
  const result = Number(unit) * 100 + Number((decimal + '00').slice(0, 2));
  return Number.isSafeInteger(result) ? result : null;
}
const money = c => (c / 100).toFixed(2);

function safeSource(link) {
  if (typeof link !== 'string' || link.length > 500) return false;
  try {
    const u = new URL(link);
    return u.protocol === 'https:' &&
      ['lista.mercadolivre.com.br', 'produto.mercadolivre.com.br'].includes(u.hostname) &&
      u.username === '' && u.password === '' && !u.search;
  } catch (_) { return false; }
}

function validateMarketBenchmarks(book) {
  const issues = [];
  if (!book || typeof book !== 'object' || Array.isArray(book) ||
      book.schema_version !== 1 || book.market !== 'BR' || book.currency !== 'BRL' ||
      book.source_type !== 'PUBLIC_BRAZIL_RETAIL_LISTINGS' ||
      book.sample_only !== true || book.commercially_ready !== false ||
      book.prices_are_supplier_quotes !== false ||
      book.comparison_confirms_supplier_price !== false ||
      book.target_margin_policy_approved !== false ||
      book.shipping_included_in_our_store !== false ||
      book.verified_competitive_demand !== false ||
      !Array.isArray(book.retail_observations) || book.retail_observations.length > 30) {
    return ['Invalid research dataset or commercial guard'];
  }
  const observedMs = /^\d{4}-\d{2}-\d{2}$/.test(book.observed_on || '')
    ? Date.parse(book.observed_on + 'T00:00:00Z') : NaN;
  if (!Number.isFinite(observedMs) ||
      new Date(observedMs).toISOString().slice(0, 10) !== book.observed_on) {
    issues.push('Invalid observation date');
  }
  const ids = new Set(), wooIds = new Set();
  for (const row of book.retail_observations) {
    if (!row || typeof row !== 'object' || !/^PH-\d{3}$/.test(row.candidate_id || '') ||
        ids.has(row.candidate_id)) {
      issues.push('Invalid/duplicate candidate ID');
      continue;
    }
    ids.add(row.candidate_id);
    if (!Number.isSafeInteger(row.woo_draft_id) || row.woo_draft_id < 1 ||
        wooIds.has(row.woo_draft_id)) issues.push(row.candidate_id + ': duplicate/invalid Woo draft');
    wooIds.add(row.woo_draft_id);
    if (!['LOW', 'PARTIAL'].includes(row.comparability) ||
        typeof row.comparison !== 'string' || row.comparison.length < 8) {
      issues.push(row.candidate_id + ': missing comparable product caveat');
    }
    if (!Array.isArray(row.observations) || row.observations.length < 2 ||
        row.observations.length > 8) {
      issues.push(row.candidate_id + ': insufficient/unbounded retail observations');
      continue;
    }
    for (const item of row.observations) {
      if (!item || typeof item.product !== 'string' || item.product.length < 5 ||
          cents(item.price_brl) === null || cents(item.price_brl) === 0 ||
          !safeSource(item.url)) issues.push(row.candidate_id + ': invalid retail observation');
    }
  }
  return issues;
}

/**
 * scenarioMarginPercent is intentionally REQUIRED for cost-headroom calculations.
 * No automatic pricing policy exists. Outputs are NOT Woo pricing recommendations.
 */
function evaluateMarketBenchmarks(book, { scenarioMarginPercent = null, asOf = null } = {}) {
  const issues = validateMarketBenchmarks(book);
  if (issues.length) return { valid: false, issues, rows: [], can_publish: false };
  let marginBasisPoints = null;
  if (scenarioMarginPercent !== null) {
    marginBasisPoints = cents(scenarioMarginPercent);
    if (marginBasisPoints === null || marginBasisPoints < 0 || marginBasisPoints > 9500) {
      throw new RangeError('Illustrative margin must be a decimal from 0.00 to 95.00');
    }
  }
  const date = asOf || book.observed_on;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      !Number.isFinite(Date.parse(date + 'T00:00:00Z'))) throw new TypeError('Invalid asOf date');
  const observedMs = Date.parse(book.observed_on + 'T00:00:00Z');
  const elapsed = Date.parse(date + 'T00:00:00Z') - observedMs;
  const outdated = elapsed < 0 || elapsed > 7 * 86400000;
  const rows = book.retail_observations.map(r => {
    const values = r.observations.map(i => cents(i.price_brl));
    const min = Math.min(...values), max = Math.max(...values);
    const maxAllIn = marginBasisPoints === null ? null :
      Math.floor(min * (10000 - marginBasisPoints) / 10000);
    return {
      candidate_id: r.candidate_id, woo_draft_id: r.woo_draft_id,
      comparable_confidence: r.comparability,
      sampled_retail_price_low_brl: money(min),
      sampled_retail_price_high_brl: money(max),
      sample_size: values.length, sample_outdated: outdated,
      illustrative_margin_percent: scenarioMarginPercent,
      illustrative_max_total_variable_cost_brl: maxAllIn === null ? null : money(maxAllIn),
      actual_landed_supplier_cost_brl: null,
      supplier_quote_verified: false, freight_brazil_verified: false,
      realized_net_profit_brl: null, can_publish: false, auto_purchase_authorized: false,
    };
  });
  return {
    valid: true, issues: [], market: 'BR', observed_on: book.observed_on,
    reference_only: true, supplier_quotes_verified: false, can_publish: false,
    actual_profit_verified: false, auto_purchase_authorized: false,
    sample_outdated: outdated, rows,
  };
}
module.exports = { cents, validateMarketBenchmarks, evaluateMarketBenchmarks };
