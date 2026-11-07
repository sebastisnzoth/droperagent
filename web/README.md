# DroperAgent · GitHub Pages frontend

A static React 19 + TypeScript + Vite dashboard. The source lives in `web/` to preserve the existing Node.js backend and its open PRs.

## Run locally

```bash
cd web
npm ci
npm test
npm run build
npm run dev
```

## Deploy

The workflow `.github/workflows/pages-dashboard.yml` runs on frontend changes. It checks the build on a PR. After a verified merge to `main`, it deploys `web/dist` to GitHub Pages with the official Pages action. In the repository Settings → Pages, set **Build and deployment → Source: GitHub Actions** (this setting is not changed by creating a workflow).

Target: https://sebastisnzoth.github.io/droperagent/

Vite `base` is `/droperagent/`. The dashboard uses in-page navigation buttons rather than path-based routing to avoid Pages 404 errors on refresh.

## Security and availability

The UI defaults to DEMO with unmistakably illustrative records. LIVE is disabled unless the build environment explicitly supplies both `VITE_DROPERAGENT_API_URL=https://…` and `VITE_ENABLE_LIVE_READONLY=true`. This condition unlocks an HTTPS health-check view only; it does **not** authorize browsing WooCommerce customer or order data from a public static website. A production read-only API must enforce authenticated browser sessions, authorization, scoped CORS, rate limits and data minimization before real data views can be implemented.

No private tokens, WooCommerce secrets, keys for OpenClaw, MCP or suppliers belong in `VITE_*` variables: Vite embeds these into public JavaScript bundles. GitHub Pages hosts only static content and never executes WordPress, MariaDB or Node workers.

## Known limitations

- Sample products and orders are fictitious, clearly labeled.
- Agent statuses are **not connected**, never fabricated as active.
- The workflow cannot itself configure GitHub Pages repository settings. Requires GitHub Actions as the Pages publishing source.
- Build and browser verification must pass before claiming the target URL works.
