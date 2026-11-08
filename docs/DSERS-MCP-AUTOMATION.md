# DSers MCP + Automated Mapping — integración DROPERAGENT

Estado: diseño + auditor offline de variantes en rama de integración; **NO conectado, NO órdenes realizadas, NO proveedor contactado**.

## Compatibilidad que no se debe asumir

La página oficial de DSers MCP actualmente declara como requisito de conexión al menos una tienda **Shopify o Wix**. DSers cuenta también con integraciones tradicionales para WooCommerce, pero eso **no demuestra que DSers MCP pueda gestionar esta tienda WooCommerce**. Antes de desarrollar sincronización DSers MCP-WooCommerce, consultar soporte y verificar `list_stores` con la tienda real. Mientras tanto, mantener WooCommerce REST API y DSers como adaptadores separados. Referencia: https://www.dsers.com/mcp-server

## Primera implementación real: auditor de mapeo

`src/dsers-mapping-audit.js` es un validador local sin llamadas de red, pagos ni credenciales. `auditMapping({storeVariants,supplierVariants,mappings})` exige SKU únicos, mapeo para cada variante, SKU proveedor existente, stock comprobado y coincidencia de opciones o equivalencia marcada verificada. Devuelve `BLOCKED` o `READY_FOR_MANUAL_REVIEW`, y **siempre** `canPlaceSupplierOrder:false`. La bandera `equivalenceVerified` significa verificación humana/documental externa; no demuestra equivalencia por sí misma. Ejecutar `node --test tests/dsers-mapping-audit.test.js` o suite `npm test` antes de merge. Este código **NO** activa Automated Mapping dentro de DSers, ni da acceso al proveedor; solo impide aprobar automáticamente mapeos incompletos.


## Hallazgo principal (8 nov 2026)

DSers ofrece MCP remoto oficial en `https://ai.dsers.com/mcp` (Streamable HTTP, OAuth 2.1 + PKCE; no requiere clave estática). Documentación:
- https://www.dsers.com/mcp-server
- https://github.com/dsers/dsers-mcp-server/blob/main/docs/examples.md
- https://help.dsers.com/how-to-use-automated-mapping-in-dsers/
- https://help.dsers.com/how-to-set-up-and-send-supplier-messages-in-dsers/
- https://help.dsers.com/dsers-settings-modules-overview-and-how-to-navigate/

Configuración MCP en un **cliente compatible** (OAuth interactivo obligatorio):
```json
{
  "mcpServers": {
    "dsers": {
      "type": "http",
      "url": "https://ai.dsers.com/mcp"
    }
  }
}
```
No implementar endpoints privados, scraping del dashboard, ni inventar token/API key. Droperagent backend y/o su agente solo podrá ejecutar MCP si soporta transporte HTTP y OAuth persistente correctamente seguro; configuración JSON de ejemplo no constituye conexión.

## Flujo objetivo

1. Conectar la tienda WooCommerce por REST oficial y la cuenta DSers por sus canales soportados; comprobar `list_stores` y verificar explícitamente compatibilidad MCP de la tienda antes de cualquier operación cruzada.
2. Encontrar candidatos con `list_supplier_search_filters` -> `search_supplier_products` -> `get_supplier_product` -> `list_supplier_product_shipping_methods_and_cost` al país de destino.
3. Calcular costo total en moneda consistente: precio proveedor + flete + impuestos estimados + comisiones + reservas de devolución; exigir margen mínimo y evidencia de disponibilidad y plazo.
4. Preparar borradores con `create_pre_publish_products`, `get_pre_publish_product`; validar atributos y precios; confirmar publicación vía `get_push_shipping_recommendation` -> `publish_products_to_stores` y `get_job_status`.
5. Mapeo de variantes:
   - Configurar DSers > Settings > Automated Mapping > Mismatched Option Value Mapping. Ejemplos China Size 38 vs US Size 7 son **ilustrativos**, no garantía de equivalencia universal.
   - Verificar `get_store_product_mapping` por cada SKU y operador. Para IA, `search_ai_mapping_candidates` -> `start_ai_product_mapping` -> `get_job_status` -> revisión humana -> `apply_ai_mapping`.
   - No colocar pedidos cuando quedan variantes huérfanas, SKU del proveedor cambiado, opciones ambiguas o país incompatible.
6. Fijar en DSers > Settings > Order Settings > Leave a Message to Suppliers una nota para cada plataforma y tienda, y personalizar por producto si hace falta. Estas notas se agregan a pedidos; **no son una conversación bidireccional ni acreditan aceptación del proveedor**.
7. Pedidos: `list_orders` -> `diagnose_order_issue` / `validate_order_address`. En pruebas, nunca ejecutar `place_orders_to_suppliers` o `create_order_payment_link` sin instrucción específica y revisión de costo y destinatario. Confirmar estado final con `get_job_status`, no solo con un ID de tarea.
8. Tracking: consultar eventos y sincronización a WooCommerce por los mecanismos oficiales evitando cambios duplicados.

## Contacto propuesto a proveedores chinos (para enviar por canal autorizado después de obtener contacto real)

English:
> Hello, we operate an online dropshipping store serving Brazil. Do you support single-item fulfillment, neutral packaging without invoice/promotional inserts, and tracking? Please confirm product/variant SKU mapping, actual stock, unit cost, shipping cost and delivery estimate to Brazil, return/replacement policy, and whether you can fulfill orders through DSers (AliExpress/Alibaba/1688 or Agent). Please provide a sample quotation and your official ordering channel. We will not place orders until these details are confirmed.

简体中文:
> 您好！我们经营面向巴西客户的跨境电商店铺。请问贵司是否支持一件代发、无发票及广告资料的中性包装、物流追踪？请确认产品及规格 SKU 对应关系、实时库存、单价、发往巴西的运费和预计时效、退换货政策，以及能否通过 DSers（速卖通/阿里巴巴/1688 或代理商）处理订单。请提供样品报价和官方下单渠道。确认所有信息后我们才会下单。

Mensaje automático breve para DSers (sujeto a aceptación previa):
> Dropshipping order: please ship in neutral packaging, without supplier invoices, prices, QR codes or promotional inserts. Use the exact ordered SKU/variant and provide valid tracking. Contact us before substituting unavailable items.

## Seguridad y aceptación

- Producción: solo lectura hasta conexión OAuth y pruebas en cuenta identificada.
- Prohibir pagos o compras automáticas durante E2E inicial.
- Definir idempotencia por ID pedido WooCommerce + tienda + proveedor; detectar duplicados.
- Log sin datos personales ni credenciales; respetar permisos OAuth y disponibilidad por plan DSers.
- Auditoría de precios, inventario, flete por destino, SKU; 2 productos x 2 variantes para prueba.
- Acciones críticas requieren aprobación explícita de objetivos y montos.
- Criterio PASS: store y supplier conectados; dos SKU de prueba correctamente mapeados y verificados; flujo de pedido de simulación/revisión sin pagos ni compra real; tracking de prueba cuando la plataforma lo permita. No declarar E2E comercial real antes de una compra autorizada y efectivamente comprobada.

## Bloqueo actual

No hay acceso autorizado a una cuenta DSers dentro de este agente de ChatGPT: no se pueden listar productos privados, enviar mensajes reales a proveedores ni hacer pedidos hasta completar OAuth en un cliente MCP compatible.
