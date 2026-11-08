'use strict';

/**
 * Supplier Mapping Guard: a deterministic, read-only preflight for WooCommerce
 * product variants vs supplier variants. Never places or pays for orders.
 * Explicit alias rules are product-specific; size conversions are NEVER inferred.
 */
function value(value) {
  if (typeof value !== 'string') return '';
  return value.normalize('NFKC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('en');
}

function tuple(options) {
  if (!options || typeof options !== 'object' || Array.isArray(options)) return null;
  const pairs = Object.entries(options);
  if (!pairs.length || pairs.some(([key, val]) => !value(key) || !value(val))) return null;
  const keys = pairs.map(([key]) => value(key));
  if (new Set(keys).size !== keys.length) return null;
  return pairs.map(([key, val]) => [value(key), value(val)])
    .sort(([a], [b]) => a.localeCompare(b));
}

function keyFor(options) {
  const pairs = tuple(options);
  return pairs ? JSON.stringify(pairs) : null;
}

function evaluateMapping({ storeVariants, supplierVariants, rules = [] } = {}) {
  if (!Array.isArray(storeVariants) || !Array.isArray(supplierVariants) || !Array.isArray(rules)) {
    throw new TypeError('Expected storeVariants, supplierVariants and rules arrays');
  }

  const supplierIndex = new Map();
  const duplicateSuppliers = new Set();
  for (const variant of supplierVariants) {
    const key = keyFor(variant?.options);
    if (!key || typeof variant?.sku !== 'string' || !variant.sku.trim()) continue;
    if (supplierIndex.has(key)) duplicateSuppliers.add(key);
    supplierIndex.set(key, variant);
  }

  const seenStore = new Set();
  const matchedSupplierSkus = new Set();
  const results = storeVariants.map(store => {
    const blocked = reason => ({ storeSku: store?.sku ?? null, status: 'BLOCKED', reason, supplierSku: null });
    if (typeof store?.sku !== 'string' || !store.sku.trim()) return blocked('MISSING_STORE_SKU');
    const storeKey = keyFor(store.options);
    if (!storeKey) return blocked('INVALID_STORE_OPTIONS');
    if (seenStore.has(storeKey)) return blocked('DUPLICATE_STORE_VARIANT');
    seenStore.add(storeKey);

    const applicable = rules.filter(rule => rule?.storeSku === store.sku);
    if (applicable.length > 1) return blocked('AMBIGUOUS_RULE');
    let supplierKey = storeKey;
    let mode = 'EXACT';
    if (applicable.length) {
      const rule = applicable[0];
      if (rule.approved !== true) return blocked('UNAPPROVED_RULE');
      if (keyFor(rule.storeOptions) !== storeKey) return blocked('STALE_RULE');
      supplierKey = keyFor(rule.supplierOptions);
      if (!supplierKey) return blocked('INVALID_RULE');
      mode = 'EXPLICIT_RULE';
    }

    if (duplicateSuppliers.has(supplierKey)) return blocked('DUPLICATE_SUPPLIER_VARIANT');
    const supplier = supplierIndex.get(supplierKey);
    if (!supplier) return blocked('NO_SUPPLIER_MATCH');
    if (supplier.available !== true) return blocked('SUPPLIER_AVAILABILITY_UNCONFIRMED');
    if (matchedSupplierSkus.has(supplier.sku)) return blocked('SUPPLIER_SKU_COLLISION');
    matchedSupplierSkus.add(supplier.sku);
    return { storeSku: store.sku, supplierSku: supplier.sku, status: 'READY_FOR_REVIEW', mode };
  });
  return {
    safeToSubmit: false,
    allMapped: results.length > 0 && results.every(result => result.status === 'READY_FOR_REVIEW'),
    results,
    summary: { ready: results.filter(r => r.status === 'READY_FOR_REVIEW').length, blocked: results.filter(r => r.status === 'BLOCKED').length }
  };
}

module.exports = { evaluateMapping };
