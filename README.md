# DroperAgent — experimental dropshipping automation

**Status: in development. Not production ready.**

DroperAgent aims to integrate WordPress, WooCommerce, DSers, AliExpress, and OpenClaw/Harness agents. Current verified capabilities and unverified gaps are documented in [docs/EXECUTION-STATUS.md](docs/EXECUTION-STATUS.md).

## Implemented on the recovery branch

- One local Node.js supervisor and on-disk queue with restart recovery, limited retries and simple allowed tasks.
- HTTP endpoints for local supervisor: `/health`, `/tasks`, `/task`, `/control`.
- WooCommerce REST API adapter for authenticated product listings, single-product reads, draft-only product creation, and order listings (requires connection to an actual running WooCommerce instance).
- Unit tests for task recovery and WooCommerce API adapter. See GitHub Actions status for results.

## Not implemented or connected yet

- Authentic Model Context Protocol (MCP) tool server.
- Live WordPress installation on your Mac, production WooCommerce or checkout.
- DSers and AliExpress account authorization and real order fulfillment.
- Genuine nine-agent autonomous operations or OpenClaw remote development executor.
- Public production hosting and payments.

## Local usage

Requires Node.js 18+ and installed npm dependencies.

```sh
npm install
cp .env.example .env
npm test
npm start
```

Configure a long random local `DROPERAGENT_API_TOKEN` in `.env`; do not commit that file.

To enable WooCommerce reads and draft product creation, configure `WOOCOMMERCE_URL`, `WC_CONSUMER_KEY` and `WC_CONSUMER_SECRET` for a trusted test WooCommerce store. HTTPS is required unless the store URL is on loopback.

Write example (only when connected and authenticated):

```sh
curl -X POST http://127.0.0.1:3000/api/woo/products/drafts \
 -H "Authorization: Bearer YOUR_LOCAL_TOKEN" \
 -H "Content-Type: application/json" \
 -d '{"name":"Test product","regularPrice":"19.90"}'
```

Do not use real customer data, supplier payments or production API keys while testing.

## Workflows

- [Core tests](.github/workflows/core-tests.yml): syntax, task persistence/retry and WooCommerce adapter unit tests.
- WordPress/MariaDB integration is developed separately in PR #3.

This project is **not** a hosted website merely by being present on GitHub. It requires WordPress-compatible runtime hosting and verified dependencies.
