# DROPERAGENT V7 — Autonomous Profit Monitor (primera implementación real)

**Fecha:** 2026-11-09. **Presupuesto:** USD 0. **Estado comercial:** bloqueado hasta verificación de proveedor, logística, cumplimiento y conciliación PIX.

## Función

La función diaria `DroperAgent_Profit_Monitor` utiliza el WP-Cron y las lecturas de WooCommerce ya existentes. **No es un motor de ganancias realizado ni genera ventas:** identifica condiciones que causarían pérdida o impedirían vender, para preparar la automatización segura posterior.

**Ruta de código canónico:** `wordpress/droperagent-api-connections/droperagent-profit-monitor.php`.

**Pantalla administrativa:** `WooCommerce → DROPERAGENT Profit` (`/wp-admin/admin.php?page=droperagent-profit-monitor`), visible solo a `manage_options`. Enlaces al panel WooCommerce → DROPERAGENT APIs para cargar cotizaciones auténticas.

**Ciclo autónomo:** WP-Cron `droper_profit_monitor_daily_v1`, aproximadamente una vez por día. `init` programa el evento solo si falta. WP-Cron es disparado por tráfico, no un servicio 24/7 ni ejecución exacta a una hora. El diagnóstico puede ejecutarse también por botón administrativo protegido por nonce. Estado guardado como agregado numérico no-autoload `droper_profit_monitor_report_v1` en `wp_options`.

## Qué revisa

- Hasta **30 productos publicados y 240 SKU** por ejecución; los resultados parciales se marcan como `truncated`, nunca se confunden con catálogo completo.
- Productos simples y variables, SKU ausentes o repetidos en la muestra.
- Stock WooCommerce ≤ 1, productos sin seguimiento de stock; no equivale a inventario real del proveedor.
- Peso o dimensiones faltantes **solo para productos físicos**.
- Cotizaciones de costos BRL guardadas en el módulo existente `droper_quote_brl_v1_<variation_id>`: ausencia, hash de SKU incorrecto, importes inválidos, precio cambiado, antigüedad mayor de **14 días**, margen estimado negativo/cero.
- Cantidad de métodos de envío habilitados en WooCommerce (no demuestra cobertura Brasil, costo real ni entrega autorizada).
- Moneda WooCommerce y si está habilitado el cálculo fiscal; `tax_calculation_enabled` no certifica obligaciones fiscales.

## Seguridad

El sistema solo consulta productos y opciones existentes. Escribe **exclusivamente** su propio resumen agregado de estado y el evento WP-Cron. No lee datos bancarios o de clientes, no guarda links a proveedores en el reporte, no muestra credenciales.

Invariantes forzadas en el reporte:

- `provider_stock_verified=false`.
- `shipping_costs_verified=false`.
- `bank_settlement_verified=false`.
- `realized_profit_verified=false`.
- `commerce_authorized=false`.
- `read_only=true`.

Una cotización declarada, aunque sea reciente y muestre margen positivo, **no prueba la fuente, el flete, el impuesto ni el dinero recibido**. El módulo no habilita el checkout guard existente ni modifica Pix, tarifas, productos, stock, precios, órdenes o pedidos.

## Activación y continuidad en el WordPress conectado

El sitio actual carga archivos PHP personalizados desde el tema padre Twenty Twenty-Five y no hay acceso garantizado a un instalador independiente de plugins mediante OneMCP. Para mantener el mismo sistema integrado:

1. CI Core + WordPress Sandbox deben quedar PASS en PR.
2. Copiar el archivo canónico de GitHub al borrador OneMCP como `twentytwentyfive/droperagent-profit-monitor.php`.
3. Agregar **solo** el loader público y de cron al final de `functions.php`:
   ```php
   // DROPERAGENT V7: read-only autonomous WooCommerce profit risk monitor.
   if ( file_exists( get_theme_file_path( 'droperagent-profit-monitor.php' ) ) ) {
       require_once get_theme_file_path( 'droperagent-profit-monitor.php' );
   }
   ```
4. Mantener los loaders previos `droperagent-api-connections.php` y `droperagent-checkout-gate.php` intactos.
5. Validar `theme-draft-check` con HTTP 200 wp-admin, home y páginas disponibles, comparar archivos LIVE con GitHub. Publicar con backup. Si OneMCP responde timeout, verificar LIVE y draft antes de volver a publicar.
6. Confirmar que WP-Cron sigue habilitado y `loopback_ok` mediante `mosmcp__cron-test` (prueba inicial del 2026-11-09: `can_run=true`, `disabled_by_config=false`, `loopback_ok=true`, `overdue_count=0`). Hacer el primer diagnóstico manual en el panel si es necesario; no fingir ejecuciones de cron que aún no han ocurrido.

**Riesgo operativo heredado:** si se actualiza el tema padre, los archivos PHP y el loader pueden perderse; migrar a un plugin propio independiente sin doble carga cuando la capacidad de instalación en el hosting esté autorizada.

## Validación automatizada

Workflow WooCommerce Sandbox prueba PHP lint, registro del cron sin duplicación, producto/variante ficticios, cotización manual con margen negativo, caducidad, cambio de precio y hash SKU, agregación de alertas, no-autoload, que no se filtre la URL de cotización y que el scan no altere inventario. CI no crea órdenes ni pagos reales.

## Siguiente fase — de diagnóstico a ganancias efectivas

- Validar al menos 3 productos con costos, stock, proveedor, flete Brasil, impuestos y homologación real; aprobarlos por SKU, no por todo el catálogo.
- Confirmar una fuente legítima de prueba de pago PIX y reconciliación bancaria.
- Integrar seguimiento de ingresos/costos verificables y devoluciones, sin asumir que `processing` o un QR PIX signifiquen efectivo recibido.
- Generar fichas SEO y contenido orgánico de productos ya verificados, con permisos de uso de imágenes.
- Agregar reglas de precio solo con autorización previa y bandas de margen; flujo de compras y pagos salientes seguirán inactivos.
- Para automatización financiera futura, exigir autorización expresa, límites transaccionales, idempotencia, trazabilidad y kill switch.

**El objetivo del monitor es optimizar decisiones y evitar pérdidas, no garantizar ganancias ni simularlas.**
