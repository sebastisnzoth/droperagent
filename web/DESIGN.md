# DroperAgent — Product & UI design context

- **Audience**: Portuguese-speaking owner/operators managing the setup of a dropshipping control plane.
- **Product promise**: transparent operational status, zero invented live figures, and a safe demonstration of a future integrated control center.
- **Visual direction**: dark maritime/navy operations shell with clear white work surfaces, cyan signal accent and small sapphire highlights. A horizontal `commerce pipeline` graphic shows WordPress → WooCommerce → MCP → agents/fulfillment; its nodes are *integration status indicators*, not evidence of connectivity.
- **Fonts**: Space Grotesk for titles and big values; DM Sans for body and labels; tabular figures.
- **Tokens**: background #f4f7fa, ink #122333, sidebar #101c2a, accent #11b9a7, blue #4676e8, muted #66798a, borders #e5ebef.
- **Layout**: fixed desktop rail, compact mobile rail, responsive grid of content cards and tables. No nested route dependencies; a single-page state navigation works on GitHub Pages refresh.
- **Safety**: Demo is clearly labeled. No live customer records, purchases, payments, or secrets. Live read-only mode activates only if an explicitly configured HTTPS public API supports secure browser sessions. Never put private WooCommerce, MCP or OpenClaw keys into the client bundle.
- **Interaction contracts**: all tabs are keyboard-focusable buttons; search and filters update visible demo tables; refresh reloads allowed public status only; dark theme toggle persists a harmless preference; empty states explain the next step. Reduced-motion preferences are respected.
