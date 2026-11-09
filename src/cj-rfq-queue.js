'use strict';
// Offline CJ sourcing request queue validator. NO HTTP, no purchase or payment.
function validateCjRfqs(q) {
  if (!q || q.schema_version !== 1 || q.region !== 'BR' ||
      q.supplier !== 'CJdropshipping' ||
      !Array.isArray(q.requests) || q.requests.length !== 5)
    return ['Wrong sourcing packet'];
  const issues=[],p=q.safety_policy||{};
  if (p.zero_spend!==true || p.commercial_ready!==false ||
      p.submitted!==false || p.manual_operator_approval_required!==true ||
      p.supplier_account_verified!==false || p.cj_api_credentials_verified!==false ||
      p.auto_purchase_enabled!==false || p.checkout_release_enabled!==false)
    issues.push('Sourcing not fail-closed');
  const refs = new Set(), ids = new Set(), sources = new Set();
  for (const r of q.requests) {
    if (!r || !/^CJ-RFQ-PH-\d{3}$/.test(r.request_id||'') ||
        r.request_id !== 'CJ-RFQ-'+r.candidate_id || refs.has(r.request_id))
      issues.push('Bad or duplicate request');
    refs.add(r?.request_id);
    if (!Number.isSafeInteger(r?.woo_draft_id) || ids.has(r.woo_draft_id))
      issues.push('Duplicate/bad Woo draft');
    ids.add(r?.woo_draft_id);
    if (!r.public_reference_url?.startsWith('https://eprolo.com/app/product/') ||
        sources.has(r.public_reference_url))
      issues.push('Bad source link');
    sources.add(r?.public_reference_url);
    if (r.request_status !== 'PREPARED_NOT_SUBMITTED' ||
        r.external_request_id !== null || r.account_owner_approval_to_submit !== false ||
        r.fulfillment_approved !== false || r.source_mapping_verified !== false ||
        r.image_license_verified !== false || r.proposed_sku !== null ||
        r.cj_product_id !== null || r.cj_variant_id !== null ||
        r.confirmed_stock !== null || r.product_cost !== null ||
        r.freight_quote !== null || r.tax_quote !== null)
      issues.push('Unsupported supplier approval/financial claim');
  }
  const c=q.quote_context||{};
  if (!Array.isArray(c.quantities) || c.quantities.join(',') !== '1,2' ||
      !Array.isArray(c.test_postal_codes) || c.test_postal_codes.length !== 2 ||
      c.test_postal_codes.some(x=>!/^\d{5}-\d{3}$/.test(x.cep) || x.country!=='BR') ||
      c.do_not_submit_orders!==true || c.payment_required_for_quote!==false)
    issues.push('Unsafe or incomplete quote context');
  return issues;
}
module.exports={validateCjRfqs};
