# DROPERAGENT — verified status and next milestones

Updated: 2026-11-07. Branch: `fix/unified-autonomous-engine`.

## Implemented in this branch (awaiting GitHub Actions verification)
- `src/task-engine.js`: one on-disk JSON task queue, atomic replacement, retry/backoff, restart recovery for RUNNING tasks, single-process execution guard.
- `src/index.js`: one worker and API share the queue. Background polling begins with the HTTP server. POST /task requires a configured bearer token. Server binds loopback by default.
- `worker.js`: compatibility entrypoint; no independent task store and no shell command execution.
- `start-worker.sh`: foreground combined service restart loop. It needs a separate operating-system service manager for login/reboot startup.
- `tests/task-engine.test.js`: core regression tests. See CI logs for actual PASS/FAIL.

## Not yet verified or implemented
- WordPress running over HTTP with a database.
- WooCommerce activated, API keys and real product/order operations.
- A real Model Context Protocol server and MCP client integration.
- DSers and AliExpress account authorizations and order synchronization.
- Automated software-development tasks through OpenClaw/Harness.
- Production deployment, security hardening, and end-to-end commerce checkout.

This local supervisor intentionally supports only `ping` and `health-check`. No fake products, orders, supplier inventory, tracking or agent counts are returned.

## Local operation
From the cloned repository, using Node.js 22:
1. Install dependencies with `npm install`.
2. Configure a long random `DROPERAGENT_API_TOKEN` in a local `.env` (never commit it).
3. Run `npm test`.
4. Run `npm start` or `bash start-worker.sh`.
5. POST to `http://127.0.0.1:3000/task` with `Authorization: Bearer <token>`, JSON `{"type":"ping"}`.
6. Read `/tasks` with the same bearer token; results persist in `db/tasks.json` across restarts.

The local on-disk queue is single-process only and is not a distributed or SQLite transactional queue. Do not run two API/worker instances against the same store.

## Next P0
Install and verify WordPress and WooCommerce on a supported database; implement an actual MCP SDK bridge and real WooCommerce adapter; implement a supported OpenClaw task executor with explicit permissions. None of those should be marked PASS based only on this API's health result.
