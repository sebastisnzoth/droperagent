# DROPERAGENT V7 — vigilancia autónoma de borradores Product Hunter

**Fecha:** 2026-11-09. **Zona comercial:** Brasil / BRL. **Integración:** se amplía el **Profit Monitor ya instalado**, no se agrega plugin, API ni suscripción.

## Objetivo

El Profit Monitor anterior hacía la auditoría de productos **publicados**. Los nuevos candidatos #99–103 están correctamente en **borrador oculto, sin precio, sin stock y no comprables**, por lo que la revisión diaria no informaba explícitamente si un operador o sincronizador cambiaba involuntariamente esas fichas.

La nueva función `DroperAgent_Profit_Monitor::candidate_snapshot()` audita **exactamente** los cinco productos reales creados en esta tienda. Las identidades se fijaron leyendo WooCommerce LIVE por OneMCP, con coincidencia de ID **y** slug:

| Woo ID | Slug de borrador |
|---:|---|
| 99 | `escova-manual-pelos-caes-gatos-candidato` |
| 100 | `escorredor-silicone-clipe-panelas-candidato` |
| 101 | `organizadores-mala-viagem-sete-pecas-candidato` |
| 102 | `organizador-adesivo-cabos-mesa-parede-kit-seis-candidato` |
| 103 | `organizador-talheres-gaveta-polipropileno-candidato` |

**No es un catálogo universal:** esos IDs pertenecen a DROPERAGENT WordPress LIVE. En restauraciones o copias de staging con IDs distintos, el monitor debe avisar `PRODUCT_MISSING` o `PRODUCT_IDENTITY_CHANGED` y no asignar un artículo diferente como proveedor aprobado.

## Alertas diarias

- `PRODUCT_MISSING`: el ID ya no tiene un producto Woo reconocible.
- `PRODUCT_IDENTITY_CHANGED`: el ID apunta a otro slug o artículo.
- `PRODUCT_NOT_DRAFT`: se publicó o cambió a un estado distinto de borrador.
- `PRODUCT_VISIBLE`: dejó de estar oculto.
- `PRICE_SET_WITHOUT_SUPPLIER_EVIDENCE`: aparece precio aunque todavía falta cotización autenticada.
- `STOCK_MARKED_AVAILABLE`: WooCommerce marca inventario disponible.
- `PURCHASABLE_BEFORE_REVIEW`: WooCommerce lo considera comprable antes de revisión.

El informe guarda en la misma opción del monitor diario (`droper_profit_monitor_report_v1`, no-autoload) los contadores, IDs Woo y códigos de alerta, sin guardar datos personales, tokens de proveedor o claves bancarias. La pantalla `WooCommerce → DROPERAGENT Profit` muestra estado y enlace administrativo para cada producto.

Una ficha sana es **un borrador privado sin posibilidad de compra**, NO un artículo rentable, validado o autorizado comercialmente. Los seis indicadores `provider_variant_verified`, `supplier_stock_verified`, `landed_cost_verified`, `shipping_to_brazil_verified`, `photos_licensed` y `commerce_authorized` permanecen siempre `false` para los cinco candidatos.

## QA y seguridad

`.github/workflows/wordpress-ci.yml` realiza un test aislado en WordPress + MariaDB:

1. Crea un candidato temporal en borrador, oculto, sin precio, sin inventario, con slug conocido.
2. Exige `safe_private_count=1` y `commercial_ready=false`.
3. Simula en el **sandbox** una publicación accidental con precio y stock, verifica alertas sin confundirlas con aprobación.
4. Verifica identidad errónea y producto faltante.
5. Elimina el producto ficticio y ejecuta el monitor real del sandbox, exige `private_candidates.expected_count=5` y `commercial_ready=false`.

No se ejecuta venta, compra, pago ni sincronización real; el código de producción no actualiza producto, precio, stock ni pedidos.

**Publicación:** solo Core y WordPress CI completos y verdes, comparación con `main`, backup OneMCP, draft y preflight. Si OneMCP reporta timeout, leer LIVE y el borrador antes de repetir, para evitar duplicar publicaciones. Mantener intactos checkout guard #41/#42, PIX, EPROLO inactivo y cron existente.

## Proveedores

- EPROLO 2.4.2 continúa **inactivo** por CVE-2026-74019, con vigilancia de parche y alerta V7 ya publicadas; no reactivar.
- Product Sync for WooCommerce disponible en la tienda tiene, según WordPress.org, **modo gratis para una conexión y sincronización manual de productos simples**. Las variantes y la sincronización programada son funciones premium. No basar autonomía USD 0 en ellas: https://wordpress.org/plugins/products-sync-for-woocommerce/
- CJdropshipping tiene cliente API **read-only** ya incluido en el repositorio (`src/cj-readonly-client.js`) para búsqueda/variantes/stock/flete. Se necesita clave/token autorizado de CJ. Instalar la app API no crea por sí mismo una clave: https://developers.cjdropshipping.com/en/api/start/apikey.html . No generar credenciales falsas ni usarlas públicamente.
- La matriz de 20 referencias EPROLO contiene páginas públicas, no productos validados para venta. La búsqueda de proveedores seguros y costos reales sigue siendo un **bloqueo externo**.

**Resultado buscado:** impedir pérdidas o cobros por publicar accidentalmente los cinco borradores y mantener la verificación de proveedor como paso imprescindible. No prometer autonomía comercial ni ganancias no realizadas.
