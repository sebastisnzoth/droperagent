# DROPERAGENT — Autonomous Recovery Contract

## Scope and objective
Operate only in `sebastisnzoth/droperagent`. Implement and verify a real WordPress + WooCommerce dropshipping store, a standards-compliant MCP bridge for DeepSeek Harness, and trustworthy automation. This document takes precedence over earlier self-declared "complete" status reports. Do not touch UGO repositories, unrelated workspaces, production payments or external accounts.

## Starting assessment (must reverify before changes)
- `src/index.js` currently returns hardcoded data in `/control`, `/api/woo/products`, `/api/woo/orders` and `/api/task`. `GET /mcp` exposes a tool name list, not a working MCP implementation.
- `src/api/dsers.js` includes mock tracking, stock, plan limits and a fictitious order-placement return.
- `src/services/agent-manager.js` implements canned actions and an in-memory queue without durable scheduling or guaranteed recovery.
- `package.json` build uses `npx tsc` even though the listed project is JavaScript; validate all scripts and dependencies.
- `docker-compose.yml` was absent from main at audit time.
- README and STATUS claims of "production ready" and verified integrations are not backed by integration test evidence.
- The Harness session claimed WordPress was installed at a separate local path. A directory or config file alone is NOT evidence of a running installation.

## Execution rules — no conversational loops
1. Begin with a reproducible inventory: git status, branches, tracked files, runtime availability, dependencies, available MCP tools and actual installed skills. Detect the active workspace and OS. Never use `apt` or `systemctl` on macOS. Do not assume Docker exists.
2. Build a short prioritized checklist in `docs/EXECUTION-STATUS.md` with objective evidence, then immediately execute the highest-priority unblocked task. Do not ask for project goals already defined here or offer menu choices.
3. Implement one vertical slice at a time: code -> unit/integration tests -> command output -> security review -> commit -> push to feature branch -> next task. Continue within the active execution session while resources and tools permit; do not claim to work indefinitely after the session ends.
4. On a recoverable error, inspect logs, make a focused fix and retry up to three times with backoff. If stuck, record the exact error, continue with independent work, and surface only the precise blocking credential/approval when truly necessary.
5. Persist checkpoints in `docs/EXECUTION-STATUS.md`: timestamp, branch, commit, current task, results, next action and blockers. Resume from these checkpoints rather than restarting analysis.
6. Use Harness subagents only where actual executable tools are available; do not equate listing nine names with nine working agents.
7. Never claim an external integration is connected without a real authenticated request and verifiable response.
8. Work through a feature branch and PR. Merge to main only after CI and core acceptance tests pass and a safe review/approval process is satisfied.

## Critical repair sequence (P0)
- P0a: Truthful reporting. Replace misleading README, STATUS and UI badges; statuses must be VERIFIED, IMPLEMENTED_UNTESTED, MOCK, NOT_CONFIGURED, BLOCKED or FAILED. Return HTTP 503 or explicit `not_configured` for disconnected integrations instead of success/fake data.
- P0b: Security. Authenticate operational endpoints, restrict CORS origins, validate input, protect write actions, apply rate limits and audit logs. Never expose tokens, store private customer data in public Git, or make production purchases.
- P0c: Local WordPress. Provide a reproducible, tested local setup compatible with the actual OS, isolate DB, activate WooCommerce and verify with an HTTP request and WP-CLI/database checks. Do not mistake `php -S` plus a config file for WordPress installation.
- P0d: Real WooCommerce REST API. Wire `list_products`, `list_orders`, product draft creation and metrics through configured API credentials, with structured errors and mock-only tests.
- P0e: Actual MCP protocol. Implement a documented MCP SDK transport with tool discovery and calls; verify from a real compatible MCP client. Do not label a static GET response MCP.
- P0f: Persistent autonomous queue. Durable storage, leasing/locking, retries, backoff, idempotency, dead-letter handling, per-agent permissions and restart recovery. A supervisor must execute queued tasks and leave measurable logs.

## Subsequent phases
- P1: WordPress storefront, product catalog, checkout with sandbox, theme, responsive testing and legal pages.
- P1: DSers official setup, WooCommerce link, AliExpress link and authorized order/tracking events. Verify official support and account permissions. Do not invent a DSers API endpoint, API key issuance screen, supplier scores or stock.
- P1: Agent orchestrator and dashboard using actual job states and WooCommerce data. Provide read-only defaults and human approval for catalog publishing, price changes above thresholds, payments, purchases, refunds and live campaigns.
- P2: SEO, marketing drafts, analytics, supplier analysis, email automation with consent and recoverable scheduled monitoring.
- P2: CI, backup/restore rehearsal, dependency and security scans, browser E2E tests and release checklist.

## Definition of done and evidence
For each completed feature record: file/commit SHA, exact test command and exit status, verifiable output, proof of relevant service availability, and any pending authorization. No fabricated real sales, tracking, orders, provider metrics or test outcomes. Unit-test mocks must be marked MOCK. A successful `/health` only confirms server process health, NOT WordPress/DSers/WooCommerce connectivity.

## External actions and cost boundary
Free/local work is authorized. Never spend money, register third-party accounts, place or pay for supplier orders, issue refunds, send unsolicited messages, or publish a paid campaign without explicit owner authorization. When DSers/AliExpress needs interactive login, prepare everything else, report only that dependency, and continue independent tasks.

## Session completion
Do not close by saying the project is complete merely because files exist. End a session with a concise evidence-based report: VERIFIED, UNTESTED, BLOCKED, FAILED, latest branch/commit/PR, and the exact next executable task. Autonomous execution is limited to active sessions or explicitly configured schedulers; never promise background execution without a real scheduler.
