'use strict';

/**
 * Independent, fail-closed permission policy for a future Droperagent worker.
 * Does NOT invoke any external service. Use as a mandatory gate at the executor.
 */
const ALLOWED = new Set([
  'supplier_research','market_research','competitor_analysis','calculate_landed_cost',
  'calculate_margin','read_inventory','read_tracking','draft_product',
  'draft_social_post','draft_customer_reply','publish_approved_social_post',
  'publish_approved_product','send_approved_customer_reply','change_price',
  'place_supplier_order','refund_customer','change_supplier_payment_destination',
  'send_supplier_message','approve_supplier'
]);
const HIGH_RISK = new Set([
  'place_supplier_order','refund_customer','change_supplier_payment_destination',
  'approve_supplier'
]);
const WRITES = new Set([
  'draft_product','draft_social_post','draft_customer_reply',
  'publish_approved_social_post','publish_approved_product','send_approved_customer_reply',
  'change_price','place_supplier_order','refund_customer',
  'change_supplier_payment_destination','send_supplier_message','approve_supplier'
]);
const APPROVAL_REQUIRED = new Set([
  'publish_approved_social_post','publish_approved_product','send_approved_customer_reply',
  'change_price','place_supplier_order','refund_customer',
  'change_supplier_payment_destination','send_supplier_message','approve_supplier'
]);

function authorizeOperation(op, policy = {}) {
  const deny = (reason) => ({allowed:false,reason});
  if (!op || typeof op !== 'object' || !ALLOWED.has(op.action)) return deny('UNKNOWN_ACTION');
  if (policy.killSwitch !== false) return deny('GLOBAL_KILL_SWITCH_OR_MISSING_POLICY');
  if (!Array.isArray(policy.enabledActions) || !policy.enabledActions.includes(op.action)) return deny('ACTION_NOT_ALLOWLISTED');
  if (WRITES.has(op.action) && policy.writeMode !== true) return deny('WRITES_DISABLED');
  if (HIGH_RISK.has(op.action) && policy.highRiskMode !== true) return deny('HIGH_RISK_DISABLED');
  if (APPROVAL_REQUIRED.has(op.action)) {
    // An AI-provided 'approved:true' is never enough.
    const receipt = op.approval;
    if (!receipt || typeof receipt !== 'object' || receipt.issuedBy !== 'trusted-approval-service' ||
        typeof receipt.operationId !== 'string' || receipt.operationId !== op.operationId ||
        typeof receipt.action !== 'string' || receipt.action !== op.action ||
        typeof receipt.expiresAt !== 'number' || !Number.isFinite(receipt.expiresAt) ||
        typeof policy.now !== 'number' || receipt.expiresAt <= policy.now ||
        typeof receipt.signatureVerified !== 'boolean' || receipt.signatureVerified !== true) return deny('APPROVAL_NOT_VERIFIED');
  }
  if (op.action === 'place_supplier_order' || op.action === 'refund_customer') {
    if (!Number.isSafeInteger(op.amountMinor) || op.amountMinor <= 0 ||
        !Number.isSafeInteger(policy.maxTransactionMinor) || policy.maxTransactionMinor <= 0 ||
        op.amountMinor > policy.maxTransactionMinor ||
        typeof op.currency !== 'string' || op.currency !== policy.currency) return deny('BUDGET_OR_CURRENCY_INVALID');
    if (typeof op.idempotencyKey !== 'string' || op.idempotencyKey.length < 12) return deny('IDEMPOTENCY_KEY_MISSING');
  }
  if (op.action === 'place_supplier_order') {
    if (op.paymentVerified !== true || op.supplierVerified !== true ||
        op.mappingVerified !== true || op.shippingQuoteVerified !== true ||
        op.complianceVerified !== true || op.freshInventoryVerified !== true) return deny('ORDER_EVIDENCE_INCOMPLETE');
  }
  if (op.action === 'send_approved_customer_reply') {
    if (op.customerInitiated !== true || op.withinPlatformWindow !== true ||
        op.answerGrounded !== true) return deny('MESSAGING_POLICY_NOT_MET');
  }
  if (op.action === 'publish_approved_social_post' || op.action === 'publish_approved_product') {
    if (op.licensedAssets !== true || op.claimsVerified !== true) return deny('CONTENT_NOT_VERIFIED');
  }
  // HARD STOP: no money movement, provider approval or payment-destination change until a\n  // separate authenticated, cryptographically scoped authorization service is built.\n  // A model-supplied signatureVerified:true or evidence booleans cannot authorize money.\n  if (HIGH_RISK.has(op.action)) return deny('TRUSTED_FINANCIAL_EXECUTOR_NOT_IMPLEMENTED');\n  return {allowed:true,reason:'POLICY_PASSED_NOT_EXECUTED'};
}
module.exports={authorizeOperation};
