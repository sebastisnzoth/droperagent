# WooCommerce Blueprint — preflight de seguridad (08 nov 2026)

## Scope / overlap check

The user-provided `woo-blueprint.json` is an export of intended WordPress/WooCommerce settings, **not proof of live state**. This review is independent from PR #20 (`feat/supplier-mapping-guard`), which validates store-versus-supplier SKUs. PR #18 is a separate mapping audit, and PR #19 addresses autonomous policy/skills. **Do not reimplement their modules or overwrite their branches.**

`src/woo-blueprint-audit.js` audits exported steps offline and returns findings without importing anything, installing themes or plugins, executing SQL, creating orders, paying suppliers or touching a WooCommerce server. `safeToImport` is always false: a risk report cannot authorize production import.

### Findings in the supplied export (not verified against running store)

- `woocommerce_calc_taxes=no` -> **BLOCKER** pending fiscal/tax review for the actual store business and sales model. Do **not** flip taxes on blindly: obtain tax configuration and expert review.
- `woocommerce_coming_soon=yes` -> public launch blocked by storefront mode; do not disable until all legal/operational gates pass.
- `woocommerce_feature_mcp_integration_enabled=no` -> WooCommerce MCP toggle off; separate from DSers MCP, whose WooCommerce capability must be established independently.
- `woocommerce_feature_rate_limit_checkout_enabled=no` -> assess compensating WAF anti-abuse controls.
- `woocommerce_review_rating_verification_required=no` -> assess fake review / spam controls.
- `woocommerce_feature_remote_logging_enabled=yes` -> confirm privacy/data-retention handling.
- `woocommerce_ship_to_destination=billing` -> review shipping destination behavior for fulfilment; no silent changes.
- `woocommerce_store_address` and `woocommerce_store_postcode` blank -> merchant identity and invoicing review.
- `woocommerce_email_from_name=My Blog` -> merchant branding placeholder.
- `woocommerce_feature_point_of_sale_enabled=yes` -> unused POS feature needs business decision.
- 2 `runSql` statements modifying tax rate class tables -> human review before any import. **Never execute exported SQL directly on production.**
- 3 extension installs and a theme activation requested -> verify plugin/theme licenses, compatibility, version, supply chain and backups before any execution.
- `woocommerce_enable_guest_checkout=yes` -> not inherently wrong; requires appropriate fraud and privacy measures.
- `woocommerce_currency=BRL` and `woocommerce_default_country=BR:SC` -> consistent with Brazil Santa Catarina intent, but are not proof of tax or payment readiness.
- Supplied export includes site-specific identifier/metadata fields; do not commit the raw exported JSON or log their values.

## Validation
`node --test tests/woo-blueprint-audit.test.js` followed by `npm test` and the GitHub Actions CI. A successful isolated CI run does not mean the user's live store was inspected.

## Safe next steps
1. On a specifically identified, user-authorized WooCommerce instance, inspect **read-only** tax, checkout, shipping, mail, payment gateway, stock, fraud and privacy settings.
2. Export current settings and compare the changes. Review tax obligations with a competent local professional. Keep a current backup, with verified restoration procedure.
3. Correct only mutually approved settings through authorized APIs/admin, test with zero-value sandbox checkout where available.
4. Keep supplier mapping, social integrations and payment processing isolated until every integration's permission and evidence gates are met.

## Code usage (offline only)

```js
const fs = require('node:fs');
const { auditBlueprint } = require('./src/woo-blueprint-audit');
const blueprint = JSON.parse(fs.readFileSync('/secure/local/path/woo-blueprint.json','utf8'));
const report = auditBlueprint(blueprint);
console.log(JSON.stringify(report, null, 2));
```

Do not accept arbitrary remote blueprint uploads to trigger a production import. Store no credentials in repo or report.
