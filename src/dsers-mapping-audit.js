'use strict';
/**
 * Fail-closed audit for WooCommerce -> supplier variant mappings.
 * Deliberately pure / offline: never reads credentials, calls DSers, or places orders.
 * Input requires caller-verified supplier SKU / option pairs.
 */
function nonempty(value) { return typeof value === 'string' && value.trim().length > 0; }
function key(value) { return String(value).trim().normalize('NFKC').toLocaleLowerCase('en-US'); }

function auditMapping({ storeVariants, supplierVariants, mappings } = {}) {
  if (![storeVariants, supplierVariants, mappings].every(Array.isArray)) {
    throw new TypeError('storeVariants, supplierVariants and mappings must be arrays');
  }
  const blockers = [];
  const duplicates = (items, field, name) => {
    const ids = new Set();
    for (const item of items) {
      if (!item || !nonempty(item[field])) {
        blockers.push({ code: 'MISSING_IDENTIFIER', source: name });
        continue;
      }
      const id = key(item[field]);
      if (ids.has(id)) blockers.push({ code: 'DUPLICATE_IDENTIFIER', source: name, id });
      ids.add(id);
    }
  };
  duplicates(storeVariants, 'sku', 'store');
  duplicates(supplierVariants, 'sku', 'supplier');
  const store = new Map(storeVariants.filter(x => x && nonempty(x.sku)).map(x => [key(x.sku), x]));
  const supplier = new Map(supplierVariants.filter(x => x && nonempty(x.sku)).map(x => [key(x.sku), x]));
  const byStore = new Set();
  const bySupplier = new Set();
  for (const row of mappings) {
    if (!row || !nonempty(row.storeSku) || !nonempty(row.supplierSku)) {
      blockers.push({ code: 'INVALID_MAPPING' }); continue;
    }
    const s = key(row.storeSku), p = key(row.supplierSku);
    if (byStore.has(s)) blockers.push({ code: 'DUPLICATE_STORE_MAPPING', sku: row.storeSku });
    byStore.add(s);
    if (bySupplier.has(p)) blockers.push({ code: 'SHARED_SUPPLIER_VARIANT', sku: row.supplierSku });
    bySupplier.add(p);
    const storeVariant = store.get(s), supplierVariant = supplier.get(p);
    if (!storeVariant) blockers.push({ code: 'STORE_SKU_UNKNOWN', sku: row.storeSku });
    if (!supplierVariant) blockers.push({ code: 'SUPPLIER_SKU_UNKNOWN', sku: row.supplierSku });
    if (!storeVariant || !supplierVariant) continue;
    if (supplierVariant.inStock !== true) blockers.push({ code: 'SUPPLIER_STOCK_UNVERIFIED', sku: row.supplierSku });
    // Exact label equality is sufficient for this offline checker.
    // Non-equal labels require independently verified, explicit equivalence.
    const a = storeVariant.options, b = supplierVariant.options;
    if (!a || !b || typeof a !== 'object' || typeof b !== 'object' || Array.isArray(a) || Array.isArray(b)) {
      blockers.push({ code: 'MISSING_VARIANT_OPTIONS', sku: row.storeSku });
      continue;
    }
    const serialize = obj => JSON.stringify(Object.entries(obj).map(([k,v]) => [key(k),key(v)]).sort((x,y) => x[0].localeCompare(y[0])));
    if (serialize(a) !== serialize(b) && row.equivalenceVerified !== true) {
      blockers.push({ code: 'OPTION_EQUIVALENCE_UNVERIFIED', sku: row.storeSku });
    }
  }
  for (const sku of store.keys()) {
    if (!byStore.has(sku)) blockers.push({ code: 'UNMAPPED_STORE_SKU', sku: store.get(sku).sku });
  }
  if (!store.size || !supplier.size) blockers.push({ code: 'EMPTY_CATALOG' });
  return {
    status: blockers.length ? 'BLOCKED' : 'READY_FOR_MANUAL_REVIEW',
    canPlaceSupplierOrder: false,
    mappedStoreVariants: byStore.size,
    totalStoreVariants: store.size,
    blockers
  };
}
module.exports = { auditMapping };
