'use strict';
/**
 * Minimal WooCommerce variation snapshot for supplier reconciliation.
 * Read-only: NEVER include variation metadata, customer data or write capability.
 * IMPORTANT: Woo prices/stock are store data, not supplier cost, source availability,
 * or evidence that DSers mapping is working.
 */
const MAX_VARIATIONS = 100;
const STOCK_STATES = new Set(['instock', 'outofstock', 'onbackorder']);
function safeText(x, max = 256) {
  return typeof x === 'string' && x.length <= max ? x : null;
}
function normalizeVariation(row, productId) {
  if (!row || typeof row !== 'object' || Array.isArray(row) ||
      !Number.isSafeInteger(row.id) || row.id < 1 ||
      (row.parent_id !== undefined && row.parent_id !== 0 && row.parent_id !== productId)) {
    throw new TypeError('Invalid WooCommerce variation');
  }
  const sku = safeText(row.sku, 160);
  const price = safeText(row.price, 32);
  if (sku === null || price === null || !Array.isArray(row.attributes) || row.attributes.length > 20) {
    throw new TypeError('Invalid WooCommerce variation payload');
  }
  const options = Object.create(null);
  for (const a of row.attributes) {
    if (!a || typeof a !== 'object' || Array.isArray(a) ||
        !safeText(a.name, 90) || !safeText(a.option, 140)) {
      throw new TypeError('Invalid WooCommerce variation attribute');
    }
    const key = a.name.trim();
    if (!key || ['__proto__', 'prototype', 'constructor'].includes(key.toLowerCase()) ||
        Object.prototype.hasOwnProperty.call(options, key)) {
      throw new TypeError('Duplicate or missing WooCommerce variation attribute');
    }
    options[key] = a.option;
  }
  if (row.stock_quantity !== null && row.stock_quantity !== undefined &&
      (!Number.isSafeInteger(row.stock_quantity) || row.stock_quantity < 0)) {
    throw new TypeError('Invalid WooCommerce stock');
  }
  if (row.stock_status !== undefined && !STOCK_STATES.has(row.stock_status)) {
    throw new TypeError('Unexpected WooCommerce stock status');
  }
  return {
    variationId: row.id,
    sku,
    options,
    storePrice: price,
    stockQuantity: row.stock_quantity === undefined ? null : row.stock_quantity,
    stockStatus: row.stock_status ?? 'unverified',
    purchasable: row.purchasable === true,
    enabled: row.status === 'publish' && row.purchasable === true
  };
}
function makeWooVariantSnapshot(product, variations, { page, perPage } = {}) {
  if (!product || !Number.isSafeInteger(product.id) || product.id < 1 ||
      product.type !== 'variable' ||
      !Array.isArray(variations) || variations.length > MAX_VARIATIONS ||
      !Number.isInteger(page) || page < 1 || page > 100 ||
      !Number.isInteger(perPage) || perPage < 1 || perPage > 100) {
    throw new TypeError('Invalid variable product or variation page');
  }
  const seenIds = new Set();
  const seenSkus = new Set();
  const result = variations.map(row => {
    const v = normalizeVariation(row, product.id);
    if (seenIds.has(v.variationId) || (v.sku && seenSkus.has(v.sku))) {
      throw new TypeError('Duplicate WooCommerce variation ID or SKU in page');
    }
    seenIds.add(v.variationId);
    if (v.sku) seenSkus.add(v.sku);
    return v;
  });
  return {
    productId: product.id,
    productType: product.type,
    productStatus: product.status || 'unverified',
    page,
    perPage,
    count: result.length,
    hasNextPage: result.length === perPage,
    source: 'woocommerce_authenticated',
    readOnly: true,
    currencyVerified: false,
    supplierMappingVerified: false,
    supplierStockVerified: false,
    supplierCostsVerified: false,
    purchaseAuthorized: false,
    variants: result
  };
}
module.exports = { normalizeVariation, makeWooVariantSnapshot };
