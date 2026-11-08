'use strict';

/**
 * Offline read-only preflight of a WooCommerce Blueprint export.
 * Never imports SQL, installs plugins, updates the store or reads credentials.
 * Reports settings keys, not values, to avoid leaking private configuration.
 */
const SEVERITY = Object.freeze({ BLOCKER:'BLOCKER', REVIEW:'REVIEW', INFO:'INFO' });
function auditBlueprint(blueprint) {
  if (!blueprint || typeof blueprint !== 'object' || Array.isArray(blueprint) ||
      !Array.isArray(blueprint.steps)) throw new TypeError('Invalid WooCommerce blueprint');
  const findings = [];
  const settings = new Map();
  const add = (severity,code,stepIndex,key,detail) =>
    findings.push({severity,code,stepIndex,key,detail});
  blueprint.steps.forEach((step,index) => {
    if (!step || typeof step !== 'object') {
      add(SEVERITY.BLOCKER,'INVALID_STEP',index,null,'Malformed blueprint step');return;
    }
    if (step.step === 'runSql') {
      add(SEVERITY.BLOCKER,'SQL_REQUIRES_MANUAL_REVIEW',index,null,
        'Never execute imported SQL automatically; inspect its scope and effect');
      return;
    }
    if (step.step === 'installPlugin' || step.step === 'installTheme') {
      const descriptor = step.pluginData || step.themeData;
      if (!descriptor || typeof descriptor.slug !== 'string' || !/^[a-z0-9-]+$/.test(descriptor.slug)) {
        add(SEVERITY.BLOCKER,'INVALID_PACKAGE_REFERENCE',index,null,'Invalid extension identifier');
      } else {
        add(SEVERITY.REVIEW,'EXTENSION_INSTALL',index,null,
          'Installation or activation must be approved after compatibility, license and security review');
      }
      return;
    }
    if (step.step === 'setSiteOptions') {
      if (!step.options || typeof step.options !== 'object' || Array.isArray(step.options)) {
        add(SEVERITY.BLOCKER,'INVALID_OPTIONS',index,null,'Malformed option update');return;
      }
      for (const [key,value] of Object.entries(step.options)) {
        if (!/^woocommerce_[a-z0-9_-]+$/.test(key) && key !== 'pickup_location_pickup_locations' &&
            key !== 'previewing_new_templates' && key !== 'email_color_palette') {
          add(SEVERITY.REVIEW,'UNEXPECTED_OPTION_KEY',index,key,'Check option before import');
        }
        if (settings.has(key) && JSON.stringify(settings.get(key).value) !== JSON.stringify(value)) {
          add(SEVERITY.BLOCKER,'CONFLICTING_OPTION',index,key,'Conflicting values across steps');
        }
        settings.set(key,{value,index});
      }
      return;
    }
    add(SEVERITY.BLOCKER,'UNRECOGNIZED_STEP',index,null,'Unsupported blueprint step requires manual review');
  });
  const check=(key,predicate,severity,code,detail)=>{
    const entry=settings.get(key);
    if (entry && predicate(entry.value)) add(severity,code,entry.index,key,detail);
  };
  check('woocommerce_calc_taxes',v=>v==='no',SEVERITY.BLOCKER,'TAX_CALCULATION_DISABLED',
    'Tax configuration disabled: verify jurisdiction, collection requirements and customer-price display before launch');
  check('woocommerce_coming_soon',v=>v==='yes',SEVERITY.REVIEW,'COMING_SOON',
    'Storefront is configured to remain in Coming Soon mode');
  check('woocommerce_feature_mcp_integration_enabled',v=>v==='no',SEVERITY.INFO,'WOO_MCP_DISABLED',
    'WooCommerce MCP disabled: does not establish DSers MCP compatibility');
  check('woocommerce_feature_rate_limit_checkout_enabled',v=>v==='no',SEVERITY.REVIEW,'CHECKOUT_RATE_LIMIT_DISABLED',
    'Review fraud and anti-abuse mitigations, including hosting/WAF controls');
  check('woocommerce_review_rating_verification_required',v=>v==='no',SEVERITY.REVIEW,'UNVERIFIED_REVIEWS_ALLOWED',
    'Review anti-spam and authenticity controls');
  check('woocommerce_enable_guest_checkout',v=>v==='yes',SEVERITY.INFO,'GUEST_CHECKOUT_ENABLED',
    'Guest checkout requires additional fraud and accountless order privacy checks');
  check('woocommerce_manage_stock',v=>v!=='yes',SEVERITY.REVIEW,'STOCK_MANAGEMENT_DISABLED',
    'Inventory management not enabled in the export');
  check('woocommerce_feature_remote_logging_enabled',v=>v==='yes',SEVERITY.REVIEW,'REMOTE_LOGGING_ENABLED',
    'Review personal-data minimization and remote log retention');
  check('woocommerce_ship_to_destination',v=>v==='billing',SEVERITY.REVIEW,'SHIP_TO_BILLING',
    'Verify that destination and delivery estimates match real shipping addresses');
  check('woocommerce_store_address',v=>v==='',SEVERITY.REVIEW,'MISSING_STORE_ADDRESS',
    'Required store address appears blank');
  check('woocommerce_store_postcode',v=>v==='',SEVERITY.REVIEW,'MISSING_STORE_POSTCODE',
    'Store postcode appears blank');
  check('woocommerce_email_from_name',v=>v==='My Blog',SEVERITY.REVIEW,'PLACEHOLDER_EMAIL_IDENTITY',
    'Default brand name in order emails should be reviewed');
  check('woocommerce_feature_point_of_sale_enabled',v=>v==='yes',SEVERITY.REVIEW,'POS_ENABLED',
    'Confirm Point of Sale is intentionally enabled in a dropshipping operation');
  const counts = Object.fromEntries(Object.keys(SEVERITY).map(k=>[k,findings.filter(f=>f.severity===k).length]));
  return {
    status: counts.BLOCKER ? 'BLOCKED' : counts.REVIEW ? 'MANUAL_REVIEW_REQUIRED' : 'NO_FINDINGS_NOT_APPROVED',
    safeToImport:false, // Never treat this preflight as import authorization
    counts,
    analyzedSteps:blueprint.steps.length,
    findings
  };
}
module.exports={auditBlueprint};
