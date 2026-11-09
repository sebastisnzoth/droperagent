'use strict';
// DROPERAGENT V7 social publishing gate. Pure, offline, fail-closed.
// This file NEVER connects to Meta, uploads media, or publishes posts.
const CHANNELS = ['instagram','facebook'];
function validateSocialPost(post, context = {}) {
  const problems = [];
  if (!post || typeof post !== 'object' || Array.isArray(post)) return ['Invalid post'];
  if (!CHANNELS.includes(post.channel)) problems.push('Unsupported channel');
  if (!['EDUCATIONAL','BRAND','PRODUCT'].includes(post.kind)) problems.push('Unsupported post kind');
  if (typeof post.text !== 'string' || post.text.length < 10 || post.text.length > 2000)
    problems.push('Invalid caption');
  if (post.kind === 'PRODUCT') {
    if (!Number.isSafeInteger(post.woo_product_id) || post.woo_product_id < 1)
      problems.push('Missing Woo product ID');
    if (context.product_status !== 'publish' || context.product_purchasable !== true ||
        context.supplier_verified !== true || context.stock_verified !== true ||
        context.landed_cost_verified !== true || context.shipping_br_verified !== true ||
        context.checkout_verified !== true || context.margin_approved !== true)
      problems.push('Commercial readiness not verified');
  }
  if (post.channel === 'instagram' && (typeof post.media_url !== 'string' ||
      !/^https:\/\/[^\s]+\.(?:jpg|jpeg)(?:\?[^\s]*)?$/i.test(post.media_url)))
    problems.push('Instagram requires approved accessible JPEG media');
  if (post.media_url && context.media_license_verified !== true)
    problems.push('Image license not verified');
  if (post.contains_price === true && post.kind !== 'PRODUCT')
    problems.push('Price in non-product post');
  if (context.account_connected !== true || context.permissions_verified !== true)
    problems.push('Meta account and permissions not verified');
  if (context.operator_publish_approval !== true)
    problems.push('Explicit publishing approval missing');
  if (context.dry_run !== false) problems.push('Dry run only');
  return problems;
}
function planSocialPost(post, context = {}) {
  const issues = validateSocialPost(post, context);
  return { status: issues.length ? 'BLOCKED' : 'READY_FOR_SERVER_SIDE_META_API',
    issues, will_publish: false, network_calls: 0 };
}
module.exports = {validateSocialPost, planSocialPost};
