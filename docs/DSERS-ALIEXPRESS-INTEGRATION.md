# DSers + AliExpress China — integration reality check (2026-11-08)

## Actual deployment

- Store: https://droperagent.infinityfreeapp.com/ — WordPress + WooCommerce, manual outbound product bridge to Render verified accepting 1 product. No DSers connection verified.
- Backend: https://droperagent-api.onrender.com — authenticated API; read-only ephemeral product snapshot via signed outbound POST.
- Dashboard: https://sebastisnzoth.github.io/droperagent/ — display integration status as NOT_CONNECTED until verified.
- **Do not** modify UGO, fabricate successful DSers/AliExpress authorization, or store account passwords, buyer identifiers or paid supplier API credentials in GitHub.
- **No automated orders, supplier payments, product publication or stock/pricing writes until validated explicitly.**

## Official DSers path (free merchant account)

1. Register/login at https://www.dsers.com/ and choose Basic (free, no credit card per DSers docs).
2. **Store connection**: DSers > WooCommerce > add https://droperagent.infinityfreeapp.com (no trailing `?i=1`). DSers requires three checks: website/domain verification, REST authorization, webhook connection.
3. **Likely blocker: InfinityFree Free.** Their mandatory JavaScript/cookie browser check blocks third-party REST/webhook clients. Our signed PHP **outbound** bridge works but does not make DSers **inbound** REST/webhooks accessible. Do not attempt firewall/challenge circumvention.
4. **Supplier connection may be prepared separately**: DSers > Settings > Application Management > Supplier > AliExpress > Add Accounts > Login/Authorize with the user's own AliExpress account. Basic supports one AliExpress account.
5. After a hosting migration to a compatible HTTPS host with accessible `/wp-json/`, WooCommerce REST API and webhooks, retry DSers Website / Authorization / Connection steps. Confirm store is `Connected` and supplier `Authorized` within DSers before importing test products.
6. Import one AliExpress test product into DSers **Import List**, review source, variants, shipping to Brazil, pricing and supplier reputation; initially push as **draft** only if supported. Then verify new WooCommerce product via outbound bridge and operator dashboard.
7. Test full customer order -> DSers order mapping -> supplier placement and payment -> tracking **only in an explicitly authorized test workflow**. DSers does not eliminate manual supplier payment/review.
8. Partner/developer API is **a separate DSers app approval program**. The standard merchant WooCommerce integration requires no custom app or private DSers API tokens. Do not promise a direct public DSers REST API integration.

## Critical persistence caveat

Render Free product cache is **memory-only** for 15 minutes and lost on restart. It is not sufficient for durable catalog/order mappings. Preserve order history and supplier mappings in the original WooCommerce/DSers systems until an approved persistent datastore is added.

## Official sources

- DSers WooCommerce guide (30 July 2026): https://help.dsers.com/woocommerce-connection-guide-website-verification-authorization-webhook-setup/
- DSers AliExpress link guide: https://help.dsers.com/edit-account-link-dsers-to-aliexpress/
- DSers supplier limits (Basic): https://help.dsers.com/connect-multiple-supplier-platforms-supported-apps-and-setup-guide/
- DSers developer API partner program: https://help.dsers.com/partner-account-registration-for-third-party-app-integrations-2/
- InfinityFree API restrictions: https://forum.infinityfree.com/t/why-isnt-api-access-working-on-my-website/115198/1
- Specific DSers / InfinityFree issue (Sept 2026): https://forum.infinityfree.com/t/dsers-cannot-access-my-woocommerce-website/120458

## Go/no-go gates

| Gate | Status |
| --- | --- |
| WordPress WooCommerce running | User-confirmed |
| WordPress outbound -> Render signed product sync | PASS (1 product user-confirmed) |
| DSers merchant account exists | UNKNOWN |
| AliExpress account authorized within DSers | UNKNOWN |
| DSers website/REST/webhook authorization | BLOCKED/UNVERIFIED on InfinityFree |
| DSers product import -> Woo draft | NOT_TESTED |
| AliExpress supplier order and tracking | NOT_TESTED |
| Fully automated dropshipping | NOT_ENABLED |
