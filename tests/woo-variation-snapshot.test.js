'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { makeWooVariantSnapshot, normalizeVariation } = require('../src/woo-variation-snapshot');
const product = { id: 46, type: 'variable', status: 'publish' };
const variant = {
  id: 62, parent_id: 46, sku: '14:350852#OnlyAccess_20273939',
  price: '6.44', regular_price: '6.44',
  stock_quantity: 234, stock_status: 'instock',
  status: 'publish', purchasable: true,
  attributes: [{ id: 0, name: 'Color', option: 'OnlyAccess' }],
  meta_data: [{ key: '_secret_meta', value: 'DO_NOT_LEAK' }],
  description: 'DO_NOT_LEAK', image: { src: 'https://untrusted.example/DO_NOT_LEAK' }
};
test('creates a redacted snapshot of actual Woo variation shape without supplier assertions', () => {
  const snap = makeWooVariantSnapshot(product, [variant], { page: 1, perPage: 30 });
  assert.equal(snap.productId, 46);
  assert.equal(snap.count, 1);
  assert.equal(snap.source, 'woocommerce_authenticated');
  assert.equal(snap.readOnly, true);
  assert.equal(snap.currencyVerified, false);
  assert.equal(snap.supplierMappingVerified, false);
  assert.equal(snap.supplierStockVerified, false);
  assert.equal(snap.supplierCostsVerified, false);
  assert.equal(snap.purchaseAuthorized, false);
  assert.equal(snap.variants[0].sku, variant.sku);
  assert.equal(snap.variants[0].options.Color, 'OnlyAccess');
  assert.equal(snap.variants[0].storePrice, '6.44');
  assert.equal(snap.variants[0].stockQuantity, 234);
  assert.equal(JSON.stringify(snap).includes('DO_NOT_LEAK'), false);
  assert.equal(JSON.stringify(snap).includes('regular_price'), false);
});
test('keeps null stock as unknown rather than zero', () => {
  const row = normalizeVariation({ ...variant, stock_quantity: null, stock_status:'onbackorder' }, 46);
  assert.equal(row.stockQuantity, null);
  assert.equal(row.stockStatus, 'onbackorder');
});
test('rejects foreign parent, malformed ID and impossible stock', () => {
  assert.throws(() => normalizeVariation({ ...variant, parent_id: 85 }, 46), /Invalid/);
  assert.throws(() => normalizeVariation({ ...variant, id: '62' }, 46), /Invalid/);
  assert.throws(() => normalizeVariation({ ...variant, stock_quantity: -1 }, 46), /stock/);
});
test('rejects duplicate IDs, duplicate SKUs and malformed variations', () => {
  assert.throws(() => makeWooVariantSnapshot(product, [variant, {...variant, id: 63}], {page:1,perPage:30}), /Duplicate/);
  assert.throws(() => makeWooVariantSnapshot(product, [variant, variant], {page:1,perPage:30}), /Duplicate/);
  assert.throws(() => makeWooVariantSnapshot(product, [{...variant, attributes:[{name:'Color',option:'A'}, {name:'Color',option:'B'}]}], {page:1,perPage:30}), /attribute/);
  assert.throws(() => makeWooVariantSnapshot(product, {}, {page:1,perPage:30}), /Invalid/);
});
test('requires variable parent and bounded page', () => {
  assert.throws(() => makeWooVariantSnapshot({...product,type:'simple'}, [variant], {page:1,perPage:30}), /Invalid/);
  assert.throws(() => makeWooVariantSnapshot(product, [variant], {page:1,perPage:101}), /Invalid/);
  assert.throws(() => makeWooVariantSnapshot(product, [variant], {page:0,perPage:30}), /Invalid/);
  assert.equal(makeWooVariantSnapshot(product, [variant], {page:1,perPage:1}).hasNextPage,true);
});
