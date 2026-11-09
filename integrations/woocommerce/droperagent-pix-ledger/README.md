# DroperAgent PIX — Accounting & Commission Ledger v0.1.0

**Development only. This repo change does NOT install or activate anything in production.**

## Live WordPress verification (2026-11-08)
https://droperagent.cu.ma/ has the free Integração Fácil PIX | Easy PIX Integration v1.0.4 installed **and active**, confirmed via connected MCP read-only plugin list. Free Easy PIX: static QR / copia e cola and manual receipt confirmation. It does not issue verified bank webhook confirmations or outgoing Pix transfers. Other WooCommerce gateways already exist; do not replace them.

## Behavior
Separate optional WordPress plugin (does not fork the third-party Easy PIX plugin).
WooCommerce admin → DroperAgent PIX → enter the order ID and manually confirmed, complete real costs: supplier price, outbound supplier freight, payment and FX fees, taxes/import, and other costs. All five are required; unknown costs must NOT be entered as zero.

Computes: estimated margin = WooCommerce order total - all explicitly supplied costs.

- All amounts are BRL integer cents, not floats.
- Negative margins are reported.
- The WooCommerce order total is read dynamically using WC CRUD (HPOS-compatible order meta).
- Records an optional bank-statement reference that **the operator claims**; NO bank verification.
- Does not initiate supplier payout, split, automatic revenue withdrawal, order payment confirmation, gateway changes, Woo order status changes, DSers orders, webhooks or any bank requests.
- Operator can read/write ledger with WooCommerce manage_woocommerce capability and nonce; no customer-facing endpoints.
- Multi-supplier orders require aggregated real costs; per-recipient split is not implemented.
- A positive margin is NOT proof of bank settlement or tax-compliant net profit.

## Staging test / install later
1. Back up database and plugins; test in WordPress sandbox first.
2. ZIP the folder droperagent-pix-ledger (not the entire repository).
3. Upload via WordPress admin → Plugins → Add New → Upload Plugin; activate only after QA.
4. Open WooCommerce → DroperAgent PIX. Try a safe test order ID. Confirm no order status change.
5. Disable this standalone plugin to roll back functionality; stored WC metadata remains for audit.

## Different supplier payment paths
- **Brazil supplier accepting Pix:** require a compliant bank/PSP with verified outgoing Pix API, approved KYC (CPF/CNPJ according to PSP), signed webhooks, beneficiary validation, idempotency, durable audit, human payout authorization, sandbox proofs, and transparent fees.
- **China / AliExpress through DSers:** supplier order is placed via DSers and independently paid on AliExpress by merchant using an accepted method. A Pix split to Brazilian Pix keys is not automatically a cross-border AliExpress supplier payment.
- **Owner commission:** stays in the receiver's account if the merchant receives all proceeds; withdrawal is separate from calculating it. Never claim this plugin holds or sends money.

## Test contract
Run both PHP syntax checks and:
php tests/droperagent-pix-calculator.test.php

This isolated branch does not edit existing payment plugins, live WooCommerce, PRs #13 #18 #19 #26 #31, Render, DSers, bank credentials or production. Treat this as a prototype until WooCommerce sandbox E2E + security review.
