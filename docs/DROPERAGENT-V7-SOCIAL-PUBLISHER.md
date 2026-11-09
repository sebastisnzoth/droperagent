# DROPERAGENT V7.1 — Instagram & Facebook publishing

**Implementation stage:** Offline content gate and tests only. **NOT connected to Meta**, no live publishing, no credentials, no paid ads, no modification to WooCommerce or PIX.

## Goal
Produce Portuguese-Brazilian content plans for Facebook Page and Instagram Professional account, then—after verified permissions, access tokens and explicit operator approval—publish using a server-side worker and official Meta APIs. Avoid spam, fabricated claims, and posting products #99–103 while they remain hidden and commercially unverified.

## Two independent controls
1. **Product/financial gate:** Woo product must be published/purchasable with verified supplier/stock/landed price/shipping Brazil/margin and checkout.
2. **Channel gate:** Meta profile authorized; required permissions and licensed media confirmed; content approved for posting; dry-run disabled.

Current implementation `src/social-publisher-gate.js` only evaluates conditions; it never does HTTP requests or posts. A result READY_FOR_SERVER_SIDE_META_API is **not evidence of a post or operational integration**.

## Official API requirements
- Instagram: Professional (Business/Creator), an appropriate supported Instagram API login setup; account ID, token and content-publishing permission. The Facebook Login flow also requires a linked Facebook Page. Publish using media container and media_publish endpoints after confirming the currently supported Graph API version.
- Facebook: a managed Page, Page access token, pages_manage_posts and dependent read/list permissions, with correct Page tasks.
- Never collect credentials in GitHub or browser code. Tokens only in private server-side environment, redact logs, validate expiry and scope.
- Verify Meta account and app permission status prior to activation, including app review if applicable.

## Content policy
- Before commercial launch: educational/brand ideas for **manual review** only, no product availability or purchase links, no invented discounts, testimonials, suppliers, delivery or profit claims.
- After commercial readiness: publish only validated offers and licensed images, with link to live Woo product, disclosure when relevant, limited cadence and idempotency.
- Add queue, approval log, retries, deduplication, per-channel scheduling, publication ID and insights once credentials and account authorization are available.
- Use only organic publishing; no paid campaign or new expense without separate permission.

## Verification gates
`node --test tests/social-publisher-gate.test.js`. Confirm GitHub Core and WordPress Sandbox jobs, peer review; no production changes or merge until successful.
