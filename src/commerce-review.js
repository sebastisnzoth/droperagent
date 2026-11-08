'use strict';
// Evidence-only commerce review. No orders, payments or supplier writes.
function money(value) {
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const s = String(value).trim();
  if (!/^\d+(?:\.\d{1,2})?$/.test(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 ? n : null;
}
function supplierCost(product) {
  // Never infer supplier cost from storefront price or unsupported metadata.
  const key = (product.meta_data || []).find(x => x.key === '_droperagent_verified_landed_cost_brl');
  return key ? money(key.value) : null;
}
function assessProducts(products) {
  return products.map(p => {
    const price = money(p.price);
    const landedCost = supplierCost(p);
    const margin = price !== null && price > 0 && landedCost !== null
      ? Math.round((price - landedCost) / price * 10000) / 100 : null;
    const sales = Number.isSafeInteger(p.total_sales) && p.total_sales >= 0 ? p.total_sales : null;
    const rating = money(p.average_rating);
    const stock = p.stock_status === 'instock' || p.stock_status === 'onbackorder';
    const reviewable = p.status === 'publish' && stock && price !== null && price > 0;
    const blockers = [
      ...(!reviewable ? ['unavailable_or_unpriced'] : []),
      ...(landedCost === null ? ['supplier_landed_cost_unverified'] : []),
      ...(!Array.isArray(p.meta_data) || !p.meta_data.some(x => x.key === '_droperagent_verified_supplier_url') ? ['supplier_mapping_unverified'] : [])
    ];
    const score = reviewable ? Math.min(100,
      Math.round(30 + Math.min(sales || 0, 30) + Math.min(Number(rating || 0) * 5, 25) +
        (margin !== null ? Math.max(0,Math.min(15,margin / 4)) : 0))) : null;
    return {
      id: p.id, name: p.name, status: p.status, price: p.price,
      currency: 'BRL', totalSales: sales, averageRating: rating,
      stockStatus: p.stock_status || 'unknown', landedCost,
      estimatedGrossMarginPercent: margin, score, blockers,
      recommendation: blockers.length ? 'REVIEW_REQUIRED' : margin < 20 ? 'LOW_MARGIN' : 'CANDIDATE_REVIEW'
    };
  }).sort((a,b) => (b.score ?? -1) - (a.score ?? -1) || a.id - b.id);
}
function assessOrders(orders) {
  return orders.map(o => {
    // Paid status is not proof of supplier order: require mapping, shipping & supplier payment separately.
    const paid = Boolean(o.date_paid) && ['processing','completed'].includes(o.status);
    const actionable = paid && o.status === 'processing';
    return {
      id: o.id, status: o.status, currency: o.currency,
      total: o.total, paid, requiresSupplierReview: actionable,
      supplierOrderPlaced: 'NOT_VERIFIED', supplierPayment: 'NOT_VERIFIED',
      nextStep: actionable ? 'REVIEW_DSER_SUPPLIER_MAPPING_AND_PAYMENT' :
        o.status === 'completed' ? 'REVIEW_FULFILLMENT_EVIDENCE' : 'AWAIT_PAYMENT_OR_STATUS',
    };
  });
}
function reviewCommerce(products,orders) {
  if (!Array.isArray(products) || !Array.isArray(orders)) throw new Error('WooCommerce data required');
  const assessedProducts = assessProducts(products);
  const assessedOrders = assessOrders(orders);
  return {
    source:'woocommerce_authenticated', observedAt:new Date().toISOString(),
    readOnly:true, liveCommerceAutomation:false,
    scope:{productsScanned:products.length,ordersScanned:orders.length,pagination:'first_page_only'},
    summary:{
      publishedProducts:products.filter(p=>p.status==='publish').length,
      productsWithVerifiedLandedCost:assessedProducts.filter(p=>p.landedCost!==null).length,
      paidOrdersForSupplierReview:assessedOrders.filter(o=>o.requiresSupplierReview).length,
      supplierOrdersPlacedByDroperAgent:0,
      automaticSupplierPaymentsEnabled:false,
      paymentGatewayVerified:false,
    },
    products:assessedProducts.slice(0,30),
    orders:assessedOrders.slice(0,30),
    limitations:[
      'Only first WooCommerce API page is inspected, up to 50 products and 50 orders.',
      'No independent DSers/AliExpress access. Supplier mapping and fulfillment not verified.',
      'Product ranking uses store evidence, not market-wide supplier search.',
      'Gross margin needs explicitly verified landed supplier cost in BRL.',
      'Customer checkout and payment gateway cannot be verified from this review.',
      'Never charges customers, changes WooCommerce order status or purchases from suppliers.'
    ]
  };
}
module.exports={ money,supplierCost,assessProducts,assessOrders,reviewCommerce };
