# DROPERAGENT V7 — EPROLO: CVE-2026-74019, contención y camino seguro de sourcing

**Fecha de la auditoría:** 2026-11-09. **Tienda:** https://droperagent.cu.ma. **Estado:** EPROLO 2.4.2 **DESACTIVADO**, sin desinstalar. **Presupuesto:** USD 0. **Operaciones financieras:** NO autorizadas.

## 1. Hechos verificados

Consultas de OneMCP en WordPress:
- `EPROLO-Dropshipping` — plugin `eprolo-dropshipping/eprolo.php`, **versión 2.4.2**, estaba **activo**.
- `mosmcp__plugin-list-updates`: **0 actualizaciones disponibles** en el momento de la comprobación.
- No se encontró ninguna ruta REST autorizada de EPROLO usando `mosmcp__rest-list-routes` (búsqueda `eprolo`); esto **no prueba** que no existan endpoints internos ni autorización en la cuenta EPROLO.
- No se encontró ninguna tarea cron de EPROLO en `mosmcp__cron-list-events` para `hook=eprolo`; esto **no demuestra** que el plugin no pueda sincronizar pedidos al activarse.
- Cinco nuevos productos WooCommerce, #99–103, tienen `draft`, `hidden`, precio vacío, `outofstock` y `purchasable=false`. Woo #46 y #85 son los únicos productos publicados. No hay cotización de flete Brasil validada.
- EPROLO puede solicitar autorización de cuenta y, cuando esté conectado, sincronizar pedidos. Por eso **plugin instalado/activo no demuestra vínculo autorizado ni stock del proveedor**.

## 2. Vulnerabilidad confirmada por fuentes públicas

- [Patchstack CVE-2026-74019](https://patchstack.com/database/wordpress/plugin/eprolo-dropshipping/vulnerability/wordpress-eprolo-dropshipping-plugin-2-4-2-broken-access-control-vulnerability): error de control de acceso que afecta al plugin EPROLO Dropshipping **hasta 2.4.2**, CVSS v3.1 **7,1**, publicación **2026-08-20**; Patchstack indica **sin parche oficial disponible** en la consulta.
- [Registro CVE](https://cve.circl.lu/vuln/cve-2026-74019): CVE-2026-74019, vulnerabilidad clasificada **CWE-862 Missing Authorization**. El registro y el vector CVSS contienen matices sobre privilegios de acceso; no se probó explotación en DROPERAGENT.
- [EPROLO guía de instalación](https://eprolo.com/install-eprolo-app-to-woocommerce-store): conectar desde el panel con “Connect to EPROLO” y autorizar. [Listado oficial WordPress.org](https://pt.wordpress.org/plugins/eprolo-dropshipping/): con cuenta preexistente se utiliza **AUTH KEY** desde `EPROLO → My Account → WooCommerce`; exige SSL, WooCommerce y enlaces permanentes no “Plain”.
- [EPROLO WooCommerce Brasil](https://eprolo.com/br/woocommerce-dropshipping/): indica capacidad de sincronizar pedidos una vez conectado. **No habilitar esa sincronización mientras no exista validación comercial y autorización.**

## 3. Acción real de contención ejecutada

OneMCP `mosmcp__plugin-deactivate({ plugin: 'eprolo-dropshipping/eprolo.php' })` devolvió:

- Estado anterior: `active`.
- Estado posterior: **`inactive`**.
- Archivo y configuración del complemento: **preservados**; reversible con activación de plugin instalado cuando se disponga de versión segura y se hayan auditado efectos de sincronización.

**Comprobaciones después:**
- Plugin sigue instalado como 2.4.2, estado `inactive`.
- Cinco productos borrador #99–103 intactos, ocultos y no comprables.
- Productos publicados originales #46 y #85 conservan precios Woo.
- Moneda BRL, PIX Easy Integration habilitado y shipping zona 0 sin métodos; guard de checkout #41/#42 permanece sin cambios.
- WP-Cron `droper_profit_monitor_daily_v1` sigue programado, sin atrasos detectados.
- No se hizo envío de credenciales ni llamada de autenticación con EPROLO; no se crearon pedidos ni pagos.
- WordPress debug log no estaba configurado; **no declarar que la tienda carece de errores de PHP basándose en un log inexistente**.

**Restauración:** no reactivar EPROLO 2.4.2 solo para importar productos. Si hay un parche confirmado para una nueva versión, realizar respaldo de plugins/configuración, probar en sandbox, revisar permisos y callbacks, comparar inventarios, activar solamente tras prueba y permisos. La restauración de tema OneMCP no es respaldo del plugin EPROLO: son mecanismos distintos.

## 4. Vigilancia autónoma añadida al Profit Monitor existente

La extensión `wordpress/droperagent-api-connections/droperagent-profit-monitor.php` (ciclo WP-Cron) registra un agregado **solo lectura**:
- Nombre del plugin, versión, estado activo, CVE y clasificación.
- Si **activo ≤2.4.2**, `active_affected_version` y aviso.
- Si activo pero versión desconocida, `active_unknown_version` y aviso.
- Si activo en versión mayor a 2.4.2 sin una fuente que pruebe parche, `active_new_version_unreviewed` y aviso (no significa seguro).
- Si está instalado e inactivo, `inactive_mitigated` (solo para esta exposición; no implica seguridad integral).
- Si no está instalado, `not_installed`.
- Siempre `supplier_connection_verified=false` y `safe_to_sync_orders=false`.
- El panel muestra alerta actual al abrirse, independientemente de si el último informe diario es anterior.

No se altera ningún plugin ni el estado comercial desde este monitor. No envía credenciales, pedidos ni pagos.

## 5. Condiciones para retomar abastecimiento

1. Verificar **parche real** y su eficacia mediante advisory/fuente oficial, no asumir que una versión mayor es segura por sí sola.
2. Verificar versión nueva del plugin, WooCommerce y WordPress en sandbox.
3. Revisar qué información comparte con EPROLO y cómo obtiene y utiliza las claves WooCommerce REST. Nunca enviar claves por email sin flujo autorizado, nunca subirlas a GitHub.
4. Confirmar el vínculo autorizado en cuenta EPROLO, **sin copiar AUTH KEY en el chat ni guardarla en repositorio**. Las credenciales se introducen directamente por el portal autorizado.
5. Hacer consultas autorizadas de **producto y SKU exacto, stock, costo real, moneda, dimensiones, origen y cotización de envío al CEP BR** para los cinco drafts, sin importar catálogo automáticamente ni publicar.
6. Mantener auto-fulfillment y compras **apagados**. No pasar pedidos reales a EPROLO si el flujo de pagos PIX todavía no está conciliado.
7. Calcular márgenes netos y revisar restricciones legales/técnicas (incluso ANATEL cuando aplique) antes de cualquier publicación o apertura del checkout.
8. Si EPROLO no provee versión corregida o conectividad autorizada, comparar alternativas ya instaladas usando **solo consultas de lectura y pruebas**; no instalar más plugins ni duplicar sincronizadores sin necesidad.

**Estado: sourcing bloqueado por seguridad y disponibilidad de proveedor verificada. Objetivo de ganancias autónomas aún NO cumplido.**
