'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { auditMapping } = require('../src/dsers-mapping-audit');

const input = () => ({
  storeVariants: [
    { sku: 'WC-BLACK-M', options: { color: 'Black', size: 'M' } },
    { sku: 'WC-BLACK-L', options: { color: 'Black', size: 'L' } }
  ],
  supplierVariants: [
    { sku: 'CN-001', inStock: true, options: { size: 'M', color: 'Black' } },
    { sku: 'CN-002', inStock: true, options: { size: 'L', color: 'Black' } }
  ],
  mappings: [
    { storeSku: 'WC-BLACK-M', supplierSku: 'CN-001' },
    { storeSku: 'WC-BLACK-L', supplierSku: 'CN-002' }
  ]
});

test('complete exact mapping is reviewable, never auto-orderable', () => {
  const r = auditMapping(input());
  assert.equal(r.status, 'READY_FOR_MANUAL_REVIEW');
  assert.equal(r.canPlaceSupplierOrder, false);
  assert.deepEqual(r.blockers, []);
});
test('missing mapping blocks', () => {
  const i = input(); i.mappings.pop();
  assert.equal(auditMapping(i).blockers.some(x => x.code === 'UNMAPPED_STORE_SKU'), true);
});
test('unverified Chinese size equivalent blocks', () => {
  const i = input(); i.supplierVariants[0].options.size = 'China 40';
  assert.equal(auditMapping(i).blockers.some(x => x.code === 'OPTION_EQUIVALENCE_UNVERIFIED'), true);
  i.mappings[0].equivalenceVerified = true;
  assert.equal(auditMapping(i).status, 'READY_FOR_MANUAL_REVIEW');
});
test('out-of-stock and unknown supplier SKU block', () => {
  const i = input(); i.supplierVariants[0].inStock = false;
  assert.equal(auditMapping(i).status, 'BLOCKED');
  i.mappings[0].supplierSku = 'unknown';
  assert.equal(auditMapping(i).blockers.some(x => x.code === 'SUPPLIER_SKU_UNKNOWN'), true);
});
test('duplicate supplier variant and duplicate store mapping block', () => {
  const i = input(); i.mappings.push({ storeSku: 'WC-BLACK-M', supplierSku: 'CN-002' });
  const r = auditMapping(i);
  assert.equal(r.status, 'BLOCKED');
  assert(r.blockers.some(x => x.code === 'DUPLICATE_STORE_MAPPING'));
  assert(r.blockers.some(x => x.code === 'SHARED_SUPPLIER_VARIANT'));
});
test('missing stock proof and malformed data fail closed', () => {
  const i = input(); delete i.supplierVariants[1].inStock;
  assert.equal(auditMapping(i).status, 'BLOCKED');
  assert.throws(() => auditMapping(), TypeError);
});
test('duplicate catalog SKU and invalid options fail closed', () => {
  const i = input(); i.storeVariants[1].sku = 'WC-BLACK-M';
  i.supplierVariants[0].options = null;
  const r = auditMapping(i);
  assert(r.blockers.some(x => x.code === 'DUPLICATE_IDENTIFIER'));
  assert(r.blockers.some(x => x.code === 'MISSING_VARIANT_OPTIONS'));
});
