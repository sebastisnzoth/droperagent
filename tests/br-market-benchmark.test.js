'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const book = require('../data/product-hunter/retail-benchmarks-br-2026-11-09.json');
const { cents, validateMarketBenchmarks, evaluateMarketBenchmarks } =
  require('../src/br-market-benchmark');
const copy = () => structuredClone(book);

test('ten real linked Brazilian retail observations are separate from supplier facts', () => {
  assert.deepEqual(validateMarketBenchmarks(book), []);
  const r = evaluateMarketBenchmarks(book);
  assert.equal(r.valid, true);
  assert.equal(r.rows.length, 5);
  assert.equal(r.rows.reduce((a, x) => a + x.sample_size, 0), 10);
  assert.equal(r.can_publish, false);
  assert.equal(r.supplier_quotes_verified, false);
  assert.equal(r.actual_profit_verified, false);
  assert.equal(r.auto_purchase_authorized, false);
  assert.equal(r.rows.every(x =>
    x.illustrative_max_total_variable_cost_brl === null &&
    x.actual_landed_supplier_cost_brl === null &&
    x.realized_net_profit_brl === null &&
    x.supplier_quote_verified === false &&
    x.can_publish === false), true);
});

test('25 percent is an explicit hypothetical scenario, NOT an authorized margin policy', () => {
  const r = evaluateMarketBenchmarks(book, { scenarioMarginPercent: '25.00' });
  assert.deepEqual(r.rows.map(x => x.sampled_retail_price_low_brl),
    ['21.90', '20.40', '35.49', '25.34', '24.90']);
  assert.deepEqual(r.rows.map(x => x.illustrative_max_total_variable_cost_brl),
    ['16.42', '15.30', '26.61', '19.00', '18.67']);
  assert.equal(book.target_margin_policy_approved, false);
  assert.equal(r.rows.every(x => x.auto_purchase_authorized === false), true);
});

test('reject unsupported amounts, dates, imitation domains and changed source truth', () => {
  assert.equal(cents('1,99'), null);
  assert.equal(cents('-1.00'), null);
  assert.equal(cents('1e5'), null);
  assert.equal(cents('19.999'), null);
  assert.equal(cents('0.01'), 1);
  const bad = copy();
  bad.retail_observations[0].observations[0].price_brl = '0.00';
  assert.ok(validateMarketBenchmarks(bad).some(x => x.includes('invalid retail')));
  bad.retail_observations[0].observations[0].price_brl = '21.90';
  bad.retail_observations[0].observations[0].url =
    'https://mercadolivre.com.br.evil.example/fake';
  assert.ok(validateMarketBenchmarks(bad).some(x => x.includes('invalid retail')));
  const wrongDate = copy();
  wrongDate.observed_on = '2026-99-99';
  assert.ok(validateMarketBenchmarks(wrongDate).includes('Invalid observation date'));
});

test('reject duplicate candidates and unsupported commercial authorization', () => {
  const bad = copy();
  bad.retail_observations[1].candidate_id = 'PH-001';
  assert.ok(validateMarketBenchmarks(bad).includes('Invalid/duplicate candidate ID'));
  const fake = copy();
  fake.commercially_ready = true;
  fake.prices_are_supplier_quotes = true;
  assert.ok(validateMarketBenchmarks(fake).some(e => e.includes('Invalid research dataset')));
  assert.equal(evaluateMarketBenchmarks(fake).valid, false);
});

test('old observations are marked outdated, never treated as verified fresh offers', () => {
  const r = evaluateMarketBenchmarks(book, {
    scenarioMarginPercent: '25.00', asOf: '2026-11-20'
  });
  assert.equal(r.sample_outdated, true);
  assert.equal(r.rows.every(x => x.sample_outdated && x.can_publish === false), true);
  assert.throws(() => evaluateMarketBenchmarks(book, {
    scenarioMarginPercent: '99.00'
  }), RangeError);
});
