# OpenClaw / Harness — local MCP stdio integration

DroperAgent exposes a real MCP server using the official Model Context Protocol TypeScript SDK v2. It is a **local stdio child process**, not the HTTP `/health` endpoint.

## Install
On the machine running OpenClaw/Harness, clone this branch, run `npm install` with a compatible Node.js runtime, and reference the absolute path to `src/mcp-server.mjs`.

Run directly for debugging:

```sh
node src/mcp-server.mjs
```

Stdio MCP has no web UI: it waits for MCP JSON-RPC on stdin. All diagnostic logging goes to stderr; stdout belongs to the protocol.

## Example MCP host configuration
Adapt the exact keys to your OpenClaw version after checking its installed MCP support and documented configuration schema.

```json
{
  "mcpServers": {
    "droperagent": {
      "command": "/absolute/path/to/node",
      "args": ["/absolute/path/to/droperagent/src/mcp-server.mjs"],
      "env": {
        "WOOCOMMERCE_URL": "https://YOUR-WORDPRESS-STORE",
        "WC_CONSUMER_KEY": "YOUR_KEY",
        "WC_CONSUMER_SECRET": "YOUR_SECRET",
        "DROPERAGENT_MCP_ALLOW_DRAFTS": "0"
      }
    }
  }
}
```

**Do not commit any real credentials.** Prefer host-managed secrets over storing them in a configuration file. The configuration above is a generic MCP host example, not a verified OpenClaw-specific configuration. A local user must connect their host through a supported mechanism.

## Tools
- `store_status`: reports whether credentials are configured, not whether a live store exists.
- `list_products`: reads real WooCommerce products.
- `get_product`: reads one WooCommerce product.
- `list_orders`: reads actual WooCommerce orders. Treat customer information as sensitive.
- `create_product_draft`: creates a product only in DRAFT state; disabled until the owner explicitly sets `DROPERAGENT_MCP_ALLOW_DRAFTS=1`.

No external DSers APIs, purchases, payments, refunds, publication or marketing actions are available.

## Testing
```sh
npm install
node --test tests/mcp.test.mjs
```

This test launches an MCP server subprocess, performs a genuine SDK client handshake, lists tools and verifies safe refusal of disconnected operations. It does not prove WooCommerce live connectivity; that requires authentic test store credentials.
