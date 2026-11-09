# Fase B / puente de lectura de variantes WooCommerce hacia auditoría DSers

**Fecha:** 2026-11-08 (America/Sao_Paulo). **Fuente del catálogo:** WooCommerce REST v3, conexión configurada en Render. **DSers autenticado:** NO VERIFICADO.

## Qué resuelve

El Mapping Guard ya fusionado y el Supplier Evidence Preflight necesitan una representación confiable de variantes de tienda. Antes podían recibir valores `storeVariants` provistos por el llamador, que no demostraban corresponder con WooCommerce. Este incremento incorpora una lectura **directa de WooCommerce en el backend** para poder recuperar SKUs y opciones actualizadas, sin crear pedidos ni cambiar el mapeo de DSers.

Endpoint: `GET /api/woo/products/:id/variations?page=1&per_page=30`, protegido con la sesión administrativa existente. Se implementa con la API oficial WooCommerce:
`GET /wp-json/wc/v3/products/<product_id>/variations`.

- Admite únicamente productos `type=variable`; si es simple, HTTP 409.
- Valida que `:id` sea entero positivo y `page` esté entre 1 y 100, `per_page` entre 1 y 100. Valores fuera de límites devuelven 400 sin solicitar al proveedor.
- Lee el padre por la API oficial, luego su colección de variaciones; no hay escrituras Woo.
- El resultado está reducido a `variationId, sku, options, storePrice, stockQuantity, stockStatus, purchasable, enabled`; **no emite metadata, descripción HTML, imagen ni datos de clientes**.
- Valida parent ID (si Woo lo entrega), duplicados por página, tipos y valores. Una respuesta upstream malformada falla con 502 y mensaje genérico.
- Paginación: `hasNextPage` es una señal conservadora cuando el resultado llena la página, no prueba total de variantes; continuar hasta una página con menos de `per_page` antes de declarar cobertura total. Para catálogo extenso, diseñar límites/recuperación adicionales.
- Campo `storePrice` es precio **de venta configurado en Woo**, NO costo proveedor; `currencyVerified: false` porque este endpoint no lee la configuración monetaria.
- `stockQuantity` es el stock **registrado en Woo**, NO inventario proveedor real; `null` significa desconocido, nunca inventar cero.
- `supplierMappingVerified, supplierStockVerified, supplierCostsVerified, purchaseAuthorized` son siempre `false`. Ningún `READY_FOR_MANUAL_REVIEW` puede aprobar compras.

## Objetivos de inspección actuales

- Producto variable Woo **#46**: aparadores 060/068, 11 variaciones observadas vía OneMCP; requiere revisión del producto real vs opción de solo accesorios `OnlyAccess` (variación #62) y bajo stock registrado en #58.
- Producto variable Woo **#85**: auriculares TWS X15, una variación (#87), con costo y homologación Brasil sin validar.
- 12/12 variantes observadas en Woo **no equivalen a 12/12 mapeadas en DSers**.
- Fuente independiente de observación en WordPress MCP: `onemcp__list-variations`, product IDs 46/85; revisar fuente de manera fresca en cada continuación.
- No escribir SKU, atributo, precio, inventario ni galería en Woo.

## Prueba del endpoint después del despliegue

1. Runner externo sin sesión: GET de `/api/woo/products/46/variations` debe devolver 401 y `Cache-Control: no-store`. No proporciona SKU públicos ni datos de terceros.
2. En ambiente CI isolated, test con clave falsa y Woo simulado comprueba acceso admin, forma redaccionada y que el adaptador solo ejecuta GET. El CI nunca tiene datos de clientes ni credenciales DSers.
3. Para probar LIVE con sesión real requiere inicio de sesión autorizado, sin publicar la contraseña/token en chat, issue o CI. No confundir HTTP 401 público PASS con verificación de payload LIVE.
4. Una vez que se obtenga evidencia oficial DSers, construir comparador que compruebe 100% igualdad de IDs/SKU/opciones entre snapshot Woo y export de DSers. El comparator no puede alterar el Mapping Guard existente ni ejecutar compra.

## Seguridad y límites explícitos

- No habilitar Worker comercial ni integrar autoorder/repricing.
- No presumir que DSers tenga webhooks configurados o que el conector Woo tenga acceso a la cuenta del proveedor.
- No persistir cotizaciones recibidas desde el navegador en logs y jamás enviar claves de Woo a GitHub Pages.
- Próxima etapa: evidencias DSers autorizadas (store conectado, SKU proveedor, costo, flete BR, stock, fecha y origen) y validación de mercado/regulación antes de operar.

## Fuentes

- WooCommerce API oficial de variantes: https://developer.woocommerce.com/docs/apis/rest-api/v3/product-variations/
- Contrato de márgenes propio: docs/DSERS-SUPPLIER-EVIDENCE-CONTRACT.md
- Documento obligatorio para “seguir”: docs/DROPERAGENT-SUPREME-MASTER.md
