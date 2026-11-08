# DROPERAGENT — AUTONOMOUS COMMERCE OPERATING SYSTEM
Last reviewed: 2026-11-08. This is an implementation plan, not proof of live deployment.

## Confirmed constraints and source checks
1. DSers MCP (https://www.dsers.com/mcp-server): OAuth 2.1 PKCE remote HTTP; as publicly documented, **Shopify or Wix** connected store required; Basic plan has no MCP Connection, Advanced/Pro/Enterprise have respective quotas. Do **not** claim MCP WooCommerce capability unless confirmed by account/support.
2. WooCommerce REST connection already exists in repo; it must remain the canonical catalog/order system until a verified store switch is approved.
3. Instagram official API: Professional accounts; publishing and customer-initiated messaging subject to scopes, account setup, platform policies and review. References: https://www.postman.com/meta/instagram/documentation/6yqw8pt/instagram-api and https://developers.facebook.com/docs/
4. Brazil: Import duties, ICMS and applicable arrangements must be checked with Receita Federal at transaction time; regulation evolved May 2026. References: https://www.gov.br/receitafederal/pt-br/assuntos/aduana-e-comercio-exterior/manuais/remessas-postal-e-expressa/preciso-pagar-impostos-nas-compras-internacionais/quais-sao-os-impostos-devidos and https://www.gov.br/receitafederal/pt-br/assuntos/aduana-e-comercio-exterior/manuais/remessas-postal-e-expressa/novas-regras
5. Alibaba badges and Trade Assurance are risk signals, not guarantees. Protected orders must be paid through supported Alibaba.com channels with verifiable terms. https://buyer.alibaba.com/page/HowItWorks/Page.html and https://helpcenter.alibaba.com/s/buyer/knowledge?categoryId=275875291&m_station=buyer&questionId=92572963d7b2496680fabbb2038ac60asgvpc278077001
6. NIST AI RMF / Generative AI Profile: https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-generative-artificial-intelligence

## Target architecture
- Persistent task ledger / queue (transactional Postgres or compatible durable infrastructure); scheduled wake-ups with heartbeat, lease, retries, dead letter queue and deterministic idempotency.
- Supervisor: orchestration and monitoring, never holds high-risk write credentials.
- Separate workers: Market Research, China Sourcing, Fraud, Finance/Tax, Product Catalog, Order Desk, Customer Service, Social Content, Meta Integrations, Security/QA.
- Narrow tools by identity: read-only supplier research; WooCommerce draft-only writer; separate Meta publishing role; highest-risk finance executor gated by external approval.
- All tasks recorded as objective, input provenance, currency, risk score, evidence and result. Agent output is untrusted; server validates schema and business policy.
- External OAuth token storage encrypted at rest; rotate and revoke; scope minimization.
- Strict kill switch default ON until environment is explicitly verified. Worker never retries money-moving request without stable idempotency and provider reconciliation.
- Do not run 24/7 critical commerce on GitHub Pages or ephemeral filesystem. Use reliable persistent queue, DB, webhook receiver, supervisor health checks; Mac local agents may augment, but are not the only source of truth.

## Agent skills
- .agents/skills/china-sourcing-risk/SKILL.md (Codex/GPT agents)
- .claude/skills/china-sourcing-risk/SKILL.md (Claude agents)
- .agents/skills/meta-social-commerce/SKILL.md
- .claude/skills/meta-social-commerce/SKILL.md
- These are **instruction files**; they do not automatically install skills in remote clients or grant accounts/permission.

## Commerce state machine
RESEARCH -> QUOTE_PENDING -> SUPPLIER_REVIEW -> COMPLIANCE_REVIEW -> MARGIN_REVIEW -> DRAFT_READY -> LISTING_APPROVAL -> LISTED -> ORDER_PAID_VERIFIED -> SUPPLIER_ORDER_APPROVAL -> ORDER_PLACED -> TRACKED -> DELIVERED -> AFTER_SALES.
Every transition checks latest supplier SKU, FX, shipping, stock, payment, fraud flags, legal status, approved budget. On mismatch: HOLD + notify. Keep explicit distinction payment authorized / paid / settled; trust provider webhooks validated server-side.

## Marketing state machine
DISCOVER -> PRODUCT_CLAIMS_VERIFIED -> CONTENT_DRAFT -> MEDIA_RIGHTS_CHECK -> PLATFORM_REVIEW -> APPROVED -> SCHEDULED -> POSTED_VERIFIED -> MEASURED.
For DM: webhook verified -> deduped -> valid inbound customer window -> facts resolved -> grounded reply approval -> sent -> audit. Human handoff for complex/risky cases.

## Risk ledger, ordered by severity
P0: fake supplier payment instructions, compromised OAuth, duplicate supplier purchases, dangerous/counterfeit products, import/noncompliance, false payment confirmation, data leakage.
P1: supplier substitution, wrong sizes/options, fraudulent tracking, landed cost error, stock drift, advertising spend with negative contribution, platform ban, DM outside allowed messaging period.
P2: price drift, creative rights, token expiry, rate limits, failed fulfillment alerts and unreliable monitoring.

## Repo reuse audit
- sebastisnzoth/free-claude-code: model/harness adapter reference; **evaluate AGPL-3.0 and macOS/Python version compatibility before incorporation**. Do not blindly copy it.
- sebastisnzoth/MoneyPrinterTurbo: possible social video pipeline; verify commercial licenses for source media, binaries/models and resource requirements; likely not appropriate on Catalina Intel without profiling.
- sebastisnzoth/Maestro: heavy local media generation; assess GPU limitations; reuse architecture ideas, not expensive models by default.
- sebastisnzoth/Prospecto-IA-Meta and ProspectAI-Closer: code audit needed; current READMEs are generic Gemini templates, not evidence of Meta automation.
- sebastisnzoth/SocialSpyAgent-Web: third-party scraping dependencies; **not suitable as official Meta publication/DM connector**.
- sebastisnzoth/UGO-OS: secrets discipline and modular agent orchestration can inform Droperagent, not a commerce service dependency.

## Execution gates
Phase 0: unit test policy and SKU audit, mock Meta webhook, no production tokens.
Phase 1: verify WooCommerce current store + gateway; DSers OAuth/plan/store compatibility; Meta Page + Professional IG permissions. All reads.
Phase 2: supplier RFQ through approved platform, sample and pricing, drafts only.
Phase 3: one approved controlled live listing, inbound test DM and posting after explicit permission.
Phase 4: one authorized order and reconcile before any automation of purchases; measure actual margin/refunds/delivery.
Phase 5: durable queue, fault drills, 24/7 monitoring and carefully bounded automation.

### Note about sample policy code
`src/autonomy-policy.js` is a pure fail-closed policy illustrative guard. **It does not cryptographically verify approvals**: `signatureVerified` must be supplied exclusively by a separate authenticated server-side verification module, never accepted from agent/user-controlled input. It is NOT sufficient by itself to authorize real payments. Before production add signed scope binding, replay protection, durable idempotency DB, budget locking, authorization and reconciliation.
