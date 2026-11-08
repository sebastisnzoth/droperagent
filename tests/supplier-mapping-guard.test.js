'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { evaluateMapping } = require('../src/supplier-mapping-guard');

const store = [{ sku: 'SHOP-38', options: { Size: 'China Size 38', Color: 'Black' } }];
const supplier = [{ sku: 'CN-US7-BLK', options: { size: 'US Size 7', color: 'black' }, available: true }];
const rule = { storeSku: 'SHOP-38', storeOptions: store[0].options, supplierOptions: supplier[0].options, approved: true };

test('never infers international size conversions', () => {
  const result = evaluateMapping({ storeVariants: store, supplierVariants: supplier });
  assert.equal(result.allMapped, false);
  assert.equal(result.results[0].reason, 'NO_SUPPLIER_MATCH');
  assert.equal(result.safeToSubmit, false);
});

test('approved explicit supplier option rules map only for review', () => {
  const result = evaluateMapping({ storeVariants: store, supplierVariants: supplier, rules: [rule] });
  assert.equal(result.allMapped, true);
  assert.equal(result.results[0].supplierSku, 'CN-US7-BLK');
  assert.equal(result.results[0].mode, 'EXPLICIT_RULE');
  assert.equal(result.safeToSubmit, false);
});

test('reject unapproved or stale rules', () => {
  assert.equal(evaluateMapping({ storeVariants: store, supplierVariants: supplier, rules: [{ ...rule, approved: false }] }).results[0].reason, 'UNAPPROVED_RULE');
  assert.equal(evaluateMapping({ storeVariants: store, supplierVariants: supplier, rules: [{ ...rule, storeOptions: { Size: '39' } }] }).results[0].reason, 'STALE_RULE');
});

test('reject supplier duplicate variant and unknown availability', () => {
  assert.equal(evaluateMapping({ storeVariants: store, supplierVariants: [supplier[0], { ...supplier[0], sku: 'DIFFERENT' }], rules: [rule] }).results[0].reason, 'DUPLICATE_SUPPLIER_VARIANT');
  assert.equal(evaluateMapping({ storeVariants: store, supplierVariants: [{ ...supplier[0], available: undefined }], rules: [rule] }).results[0].reason, 'SUPPLIER_AVAILABILITY_UNCONFIRMED');
});

test('exact normalized option names work without rules', () => {
  const result = evaluateMapping({ storeVariants: store, supplierVariants: [{ sku: 'MATCH', options: { size: 'china size 38', COLOR: ' BLACK ' }, available: true }] });
  assert.equal(result.results[0].mode, 'EXACT');
  assert.equal(result.results[0].supplierSku, 'MATCH');
});

test('duplicate store options and missing SKU fail closed', () => {
  const result = evaluateMapping({ storeVariants: [...store, { ...store[0], sku: 'OTHER' }, { options: { Size: '38' } }], supplierVariants: supplier, rules: [rule] });
  assert.equal(result.results[1].reason, 'DUPLICATE_STORE_VARIANT');
  assert.equal(result.results[2].reason, 'MISSING_STORE_SKU');
});
