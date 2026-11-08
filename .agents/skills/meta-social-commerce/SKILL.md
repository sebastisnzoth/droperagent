---
name: meta-social-commerce
description: Draft and publish consent-based Instagram/Facebook commerce content and answer inbound customer messages through official Meta APIs.
---
# Meta Social Commerce — Droperagent

## Capability and scope
Target **owned/authorized business assets only**: Facebook Page and Instagram Professional account. Prefer official Meta Graph API, Instagram API and webhook subscriptions. Do not use password-based browser bots, unofficial scrapers or purchased accounts. Support Portuguese (pt-BR) first, other languages as requested.

## Publishing runbook
1. Verify business asset IDs, granted scopes, token validity and account eligibility.
2. Read WooCommerce listing from verified store; confirm SKU, BRL selling price, claimed discount, available inventory, shipping range, legal/product compliance and usage rights for media.
3. Generate tailored captions, accessibility descriptions, hashtags and media from appropriately licensed assets.
4. Store immutable post proposal (hash, product IDs, media license, claims evidence, destination URL, channel list, operation ID).
5. Follow platform-specific supported formats, current limits, account permissions and Meta app review status. Use human-approved scope and trusted approval receipt for each publishing operation.
6. Queue, retry with exponential backoff, idempotency key; store returned post ID and audit outcome. Do not count queued or API-accepted events as published until observed.

## Messaging runbook
1. Verify webhook challenge and signature server-side before parsing; deduplicate event IDs. Store only required personal data with retention limit.
2. Respond ONLY to messages started by customers and within current platform messaging rules; do not send unsolicited promotional DMs or run bulk outreach.
3. Ground responses in verified store data. Never invent order status; require authenticated account/order proof before revealing customer order details.
4. Escalate: demands for refunds, legal threats, chargebacks, fraud concerns, medical/technical safety, repeated complaints or missing evidence.
5. Log answer and source IDs, respect opt-outs, platform quotas, spam safeguards and customer handoff to human.
6. Keep Instagram/Facebook credentials in encrypted server-side secrets only, never GitHub/LLM context/browser.

## API validation
Instagram Login often uses instagram_business_basic, instagram_business_content_publish, instagram_business_manage_messages and instagram_business_manage_comments. Facebook Login integration may require a linked Page and different scopes. Obtain actual permissions via official Meta App Review/Business Verification requirements; validate at deployment.

## Tests
- Fake webhook or replay never triggers answer.
- DMs after expiry are blocked.
- Customer asks about wrong order: no data leaked.
- Wrong price or unlicensed image: no publish.
- Meta 429, token expiry, duplicate callback: retry safely, no duplicate post/message.
