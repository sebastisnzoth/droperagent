# WooCommerce Bridge 0.2.1 — InfinityFree clock alignment

The outbound WordPress bridge may receive `HTTP 401 invalid_timestamp` when the hosting provider's PHP clock is skewed relative to Render, or if PHP formats the millisecond timestamp inconsistently. This is not a WooCommerce API credential error.

The backend now exposes `serverTimeMs` as a numeric millisecond epoch in the existing public HTTPS `/health` response. The **0.2.1** WordPress plugin checks that the response is HTTPS, HTTP 200, `service=droperagent-api`, `status=healthy`, and that `serverTimeMs` is in a plausible range. It uses `sprintf('%.0f', ...)` to avoid scientific notation. It then signs the unchanged product snapshot with the installation-specific secret using HMAC-SHA256; the backend still enforces its five-minute timestamp window, random nonce and replay protection. The health time source does not carry credentials or customer data.

**To activate:** deploy latest `main` to Render, verify `/health` includes `serverTimeMs`, install DroperAgent Bridge 0.2.1 over 0.2.0 in WordPress (keeping plugin settings and secret), and retry the manual product sync from Tools → DroperAgent Sync. The existing Render private `DROPERAGENT_BRIDGE_SECRET` does **not** need to be regenerated. If the response then reports `invalid_signature`, recheck that this secret matches the currently displayed WordPress plugin secret; never paste it into GitHub or this chat.

No orders or mutations; only an expiring in-memory product snapshot (maximum 50 items).
