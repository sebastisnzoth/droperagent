# DROPERAGENT — secure API deployment handoff (USD 0 target)

## What is verified
The React dashboard is live on GitHub Pages. Its published build defaults to DEMO because there is no authenticated, publicly reachable DROPERAGENT API.
The GitHub CI WordPress/MariaDB/WooCommerce setup is an isolated disposable test environment. **It is not a persistent live store.** Unit tests exercise the real MCP protocol, and the WooCommerce API adapter has transport-level tests. OpenClaw is not connected to the deployed service.

## Free API (not a persistent worker)
The repository includes `render.yaml` for a **new isolated** Render Free web service named `droperagent-api`. It does not touch UGO.
The blueprint:
- serves only the Node API over Render-managed HTTPS;
- has exact CORS origin `https://sebastisnzoth.github.io`;
- requires a private `DROPERAGENT_ADMIN_PASSWORD` configured at Blueprint setup (at least 16 characters);
- sets `DROPERAGENT_DISABLE_WORKER=1` because free-service disks are ephemeral;
- does not inject WooCommerce credentials into any public bundle;
- uses Node installation without native build scripts because the unused legacy native SQLite package is still in dependencies.

**Deployment status:** repository configuration only. No Render deployment was created or verified in this work. Automatic creation was blocked by the available service connection. Do not mark LIVE/PERSISTENT as PASS.

To deploy with an authorized Render account, open:
https://dashboard.render.com/blueprint/new?repo=https://github.com/sebastisnzoth/droperagent

Before applying, verify that the service name and free plan are correct and that no existing unrelated service will be changed. Enter a strong administrator password through Render's secret field; do not commit it or place it in a URL. Do not make purchases or upgrade the plan.

After the API reports a genuine HTTPS health response, verify authenticated `POST /auth/login`, `GET /auth/me`, `GET /tasks` and `POST /auth/logout` using a trusted client before enabling the frontend. The API will continue returning `503 not_configured` for WooCommerce until actual store credentials are configured.

## Enabling the already-published GitHub Pages LIVE interface

Only **after verifying API authentication and HTTPS**, configure these *non-secret* GitHub repository Actions variables:

- `DROPERAGENT_API_URL` = exact HTTPS API origin, for example `https://droperagent-api.onrender.com` only if it actually exists
- `DROPERAGENT_LIVE_READONLY` = `true`

The GitHub Pages workflow reads these into the Vite build. Re-run the workflow or commit a frontend change to publish the new setting.

Do not put WooCommerce keys, the administrator password, CLI bearer token, customer records or OpenClaw credentials in `VITE_*` or GitHub repository Actions variables. Private backend secrets belong in Render's environment/secrets.

## WooCommerce / persistent database: blocked by missing deployment and authorization

The Docker Compose development stack in `docker-compose.yml` has persistent *named volumes* on the computer actually running Docker. The CI workflow deletes its volumes afterwards. Render's free web service cannot replace a persistent WordPress+MariaDB host; do not attempt to deploy an ephemeral store for real orders. A persistent always-on host with backups, an HTTPS URL and the WooCommerce API keys must be supplied or explicitly provisioned separately.

Once a real persistent test store exists:
1. configure `WOOCOMMERCE_URL` (HTTPS), `WC_CONSUMER_KEY` and `WC_CONSUMER_SECRET` **on the backend only**;
2. verify a draft product can be created and reread through WC REST (not through a mock);
3. verify real order listing with minimized fields; do not use real customer PII in tests;
4. verify that authenticated GitHub Pages displays those exact product/order IDs;
5. only then mark Commerce LIVE as PASS.

## OpenClaw

The real MCP protocol server is `src/mcp-server.mjs` and uses stdio. Run it on the trusted machine hosting OpenClaw; it cannot execute inside GitHub Pages. The Mac's gateway is not accessible through GitHub, and no agent task execution from that machine has been verified in this work. Do not expose the local OpenClaw gateway publicly or share UGO resources.

## Remaining limitations

The Node supervisor's single-process JSON queue is not a durable hosted distributed queue. It is disabled in the free API Blueprint. To operate autonomously with persistence, configure a separate persistent worker/database and an approved scheduler, then test restart recovery and two real task executions on that runtime.

No DSers/AliExpress API credentials or official account authorizations were available; no supplier orders, purchases, payment or tracking actions were performed.
