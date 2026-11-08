# DROPERAGENT — Conexión GitHub Pages ↔ backend (2026-11-08)

## Scope
This branch changes only the frontend's connection status and Pages build variables; it does **not** alter PR #18/#19/#20/#22, DSers mappings, WooCommerce settings, purchases, money, or production credentials.

## Why
The Pages workflow previously defaulted to `https://droperagent-api.onrender.com` and enabled `VITE_ENABLE_LIVE_READONLY=true` without verifying an actual Render deployment. The frontend offered LIVE based solely on build-time configuration; a non-existent or unresponsive backend could appear as connectable.

## Implemented
- Pages builds default to **no API URL / LIVE disabled** unless non-secret Actions variables are explicitly configured.
- The frontend probes `GET /health` on startup, accepting only JSON `{status:"healthy",service:"droperagent-api"}` and a successful HTTP status.
- LIVE button is disabled until the API health probe succeeds. No false success based on a configured URL alone.
- Settings/overview provide a retry action and explicit status. Separate WooCommerce REST health remains independent.
- The WordPress integration tile no longer claims independent verification merely because WooCommerce's API was reachable.
- No credentials are stored in the GitHub Pages bundle and no data is pulled from WooCommerce until authenticated.

## Important limitations
- `/health` proves only a matching API answered, **not** WooCommerce, DSers, payments or a persistent 24/7 worker.
- GitHub Pages serves static content only. It does not host WordPress, MariaDB or the Node API.
- Render Free cold starts and CORS/network failures can make the first probe fail; the user can retry without reloading.
- The `DROPERAGENT_API_URL` GitHub Actions variable is public build configuration, NEVER a secret. The backend must be securely deployed and authenticated independently.
- `DROPERAGENT_LIVE_READONLY=true` is a **frontend UI gate**, not permission for backend writes. Server authorization is still mandatory.
- The application still uses an administrator password submitted over HTTPS and transient token in page memory. Verify session expiration, CSRF/CORS/origin and security review before production commerce.

## Deployment checklist
1. Identify the actual dedicated Droperagent API deployment, confirm its URL in the authorized account and `GET /health` from a browser with Pages Origin.
2. Confirm `DROPERAGENT_ADMIN_PASSWORD` server-side only; `HOST=0.0.0.0`, HTTPS ingress and `DROPERAGENT_WEB_ORIGIN=https://sebastisnzoth.github.io`.
3. In repo Actions Variables, set `DROPERAGENT_API_URL` to the **verified exact HTTPS origin**, and `DROPERAGENT_LIVE_READONLY=true`. Never store passwords, consumer keys or auth tokens in these variables.
4. Publish Pages only after CI is green; verify LIVE disabled while API unreachable and enabled after health JSON response.
5. Login in a secure, authorized client; verify `/auth/me` and the WooCommerce read-only health; do not claim commercial LIVE until real credentials and test store are confirmed.

## Definition of done
- PR CI including Playwright desktop/mobile passes.
- Pages genuinely loads compiled assets.
- LIVE shown only when a compatible backend is reachable.
- Authenticated WooCommerce products/orders shown only from verified backend, never replaced with demonstration data.
- No assertion of real order placement, DSers connectivity or 24/7 commercial operation.
