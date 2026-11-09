# DROPERAGENT — proveedores directos sin DSers: evaluación y primer adaptador CJ

**Fecha:** 2026-11-09. **Estado:** primer adaptador READ-ONLY implementado en PR aislado; acceso LIVE a CJ no verificado y no hay credenciales en GitHub. **Presupuesto fijo:** USD 0. **País de destino:** Brasil.

Este documento complementa el [Plan Maestro V4](DROPERAGENT-SUPREME-MASTER.md); no lo sustituye.

## Decisión de arquitectura

Usar **WooCommerce como única fuente de verdad de tienda**, y permitir *distintos proveedores de fulfillment* detrás de conectores propios.

```text
WordPress WooCommerce (pedidos, SKUs y precios de venta)
             |
API DROPERAGENT (auth, pruebas, límites y audit trail)
             |
Supplier Adapter Interface (lectura de SKUs, costes, stock y flete)
       |          |         |          |
      CJ       AliExpress  Banggood  Alibaba/EPROLO
       |
       +-- producto y variantes -> revisión humana
       +-- stock y flete BR -> cotización USD con vigencia
       +-- Mapping Guard (#20) + Supplier Evidence (#28)
       +-- SOLO PROPUESTAS, nunca compra/pago automático
```

Ningún conector nuevo modifica las variantes originales #46/#85 de WooCommerce ni comparte autoridad de escritura con otro proveedor. La vinculación CJ SKU ↔ Woo SKU se crea únicamente con evidencia validada. **No confundir coincidencia de texto con equivalencia de hardware o contenido de caja.**

## Evaluación confirmada en fuentes oficiales

| Plataforma | Acceso legítimo | Productos/stock/flete/órdenes | Decisión |
| --- | --- | --- | --- |
| CJdropshipping API 2.0 | Cuenta CJ, activar app API, crear API Key y obtener access token server-side | Catálogo, variantes, stock, flete, órdenes, tracking y sandbox | **P0: adaptar consultas de lectura ahora**. Órdenes/pagos excluidos |
| CJ MCP | Servidor local open source o remoto con MCP Token en URL | 16 tools, **incluye create_order, merge_orders, disputas** | Opcional, **NO conectar a agente autónomo sin bloqueo de escrituras** |
| AliExpress Open Platform | Cuenta de desarrollador, app, revisión y permisos; programa Dropshipping específico | AE-Dropshipper documenta producto, flete, compra y tracking, pero documentación histórica lleva etiqueta **deprecated (已废弃)** | P1: solicitar acceso y confirmar APIs vigentes antes de codificar |
| AliExpress Affiliate API | App/afiliado y tracking de enlace aprobados | Investigación y comisión de afiliados; **NO compra proveedor para un pedido WooCommerce** | Útil para marketing, no fulfillment |
| Temu Partner Open API | Seller Center / ISV, app con autorización de vendedor Temu | Listados, pedidos **del vendedor en Temu** | **NO** es una API pública de comprador para adquirir unidades de Temu y enviarlas al cliente Woo |
| Banggood Dropship API | Solicitar programa dropship y credenciales | Stock, precio, catálogo, creación de órdenes y tracking; sitio dice API gratuita para dropshippers | P1: segundo proveedor directo si cuenta aceptada y flete Brasil verificado |
| Alibaba.com Open Platform | Registro desarrollador, app y permisos autorizados | API de dropshipping y sourcing B2B, precio/flete/orden, según permisos | P2: contactar proveedores/solicitar acceso. Validar MOQ y envío unitario Brasil |
| EPROLO WooCommerce | Cuenta EPROLO y plugin WooCommerce | Importar productos, sincronizar órdenes/fulfillment, pago al proveedor | Alternativa sin desarrollo de API propia, no garantizar API pública |
| 1688 | Ecosistema chino / API autorizada según programa | Sourcing mayorista, a menudo con agentes logísticos | Investigar con agente y permisos; no prometer API pública automática para comprador internacional |

### Fuentes oficiales consultadas

- CJ API 2.0: https://developers.cjdropshipping.com/en/api/api2/
- CJ cómo obtener clave: https://developers.cjdropshipping.com/en/api/start/apikey.html
- CJ token: https://developers.cjdropshipping.com/en/api/api2/api/auth.html
- CJ producto: https://developers.cjdropshipping.com/en/api/api2/api/product.html
- CJ flete: https://developers.cjdropshipping.com/en/api/api2/api/logistic.html
- CJ cuotas: https://developers.cjdropshipping.com/en/api/api2/standard/points.html
- CJ sandbox: https://developers.cjdropshipping.com/en/api/start/sandbox.html
- CJ MCP: https://developers.cjdropshipping.com/en/api/api2/mcp.html
- AliExpress AE-Dropshipper: https://developer.alibaba.com/docs/api.htm?apiId=60452
- AliExpress Dropshipping (versión antigua marcada obsoleta): https://developer.alibaba.com/docs/doc.htm?articleId=60452&docType=2&treeId=762
- Temu ISV: https://partner.temu.com/
- Temu autorización: https://partner.temu.com/documentation?menu_code=38e79b35d2cb463d85619c1c786dd303
- Banggood: https://www.banggood.com/index.php?com=account&t=dropshipGuidance
- Alibaba.com: https://openapi.alibaba.com/doc/doc.htm
- EPROLO: https://eprolo.com/br/woocommerce-dropshipping/

## CJ gratis: límites auténticos (2026)

- API oficial indica acceso gratuito, pero requiere cuenta habilitada y tiene cuotas.
- Desde junio/julio de 2026: **50.000 puntos base/día** que se reponen a lo largo del día, no llamadas ilimitadas. GET /product/listV2: 50 puntos; get variant, stock, freight: 10 puntos cada uno.
- **Free 1 request/second** por usuario y limites de IP. Nuestro cliente aplica throttle en memoria como primera barrera; para instancias múltiples haría falta un limitador centralizado.
- **30 días sin operaciones en CJ** pueden suspender acceso a la API; debe reactivarse en el panel. No pagar ni realizar pedidos artificiales para evitar la suspensión.
- Precios de variantes y cotizaciones de flete CJ documentados en **USD**; el usuario vende en BRL. **Nunca convertir automáticamente sin cotización FX, impuestos y costos con procedencia comprobable**.
- El freightCalculate es una estimación, NO prueba logística ni tributos brasileños.
- CJ documenta `isSandbox=1` para órdenes ficticias sin deducir fondos, **no habilitado en este incremento**. La ejecución comercial necesita permisos/controles financieros adicionales.

## Implementación actual: conector CJ de lectura

`src/cj-readonly-client.js` — host fijo `https://developers.cjdropshipping.com/api2.0/v1/`, transportes permitidos:

- GET `product/listV2`
- GET `product/variant/query`
- GET `product/stock/queryByVid`
- POST `logistic/freightCalculate` (**solo cálculo**, no crea recursos de compra ni orden)

Rutas propias, **protegidas por Bearer de sesión administrador**:
- `GET /api/sourcing/cj/status`: configuración local de token sin comprobar sesión proveedor real.
- `GET /api/sourcing/cj/search?keyword=wireless%20earbuds&page=1&size=10`: catálogo acotado.
- `GET /api/sourcing/cj/variants?pid=<CJ_PRODUCT_ID>`: variantes CJ, no sustituye Woo SKU.
- `GET /api/sourcing/cj/stock?vid=<CJ_VARIANT_ID>`: inventario CJ, a revisar.
- `POST /api/sourcing/cj/freight-quote` JSON `{"vid":"<CJ_VARIANT_ID>","quantity":1,"origin":"CN"}`: destino BR fijado en backend.

**Configuración futura:** crear en panel CJ una API Key; intercambiar por Access Token de forma privada usando API oficial; guardar únicamente `CJ_ACCESS_TOKEN` en entorno seguro del servidor Render, nunca en GitHub ni en `VITE_*`. No publicar ni pegar credenciales en chat. Generar tokens no está automatizado en este PR para evitar guardarlos en memoria efímera de Render por accidente.

Si `CJ_ACCESS_TOKEN` está ausente:
- Status autenticado retorna configured:false.
- Las otras rutas CJ responden 503 sin hacer solicitudes externas.
- No hay ninguna activación automática de conexión al desplegar código.

Respuesta de consulta devuelve solo campos seleccionados; no metadatos ni identificadores de clientes. `supplierMappingVerified:false` y `purchaseAuthorized:false`; flete en USD requiere cambio FX y revisión de impuestos.

### Pruebas

- `tests/cj-readonly-client.test.js`: URLs allowlist, tokens solo en header, GET, selección sin datos secretos, cotización destino BR y USD, límites, rate, respuesta inválida y fallo de proveedor.
- `tests/cj-readonly-http.test.mjs`: auth, CORS, token ficticio, GET-only y bloqueo de acciones no autorizadas.
- `.github/workflows/core-tests.yml`: sintaxis y las suites. No poner tokens reales en CI.

**No declarar CJ LIVE PASS sin una cuenta autorizada y prueba real de lectura**; código y CI no sustituyen acceso a CJ.

## Onboarding mínimamente necesario para pasar de SIMULADO a LIVE

1. En cuenta CJ, activar app API y crear API Key en https://www.cjdropshipping.com/my.html#/authorize/API . No pegar la clave en GitHub ni en esta conversación.
2. Intercambiar key por Access Token mediante el endpoint HTTPS oficial y guardar token exclusivamente en secretos Render. Mantener programa CJ Free y verificar límites actuales antes de activar.
3. Reiniciar/desplegar Render sin cambiar el worker deshabilitado.
4. Login admin propio, leer status y buscar dos productos: `wireless earbuds` y `hair trimmer`. No importar ni publicar.
5. Revisar correspondencia física y documental entre producto CJ y las 12 variantes Woo; **OnlyAccess** se trata como accesorio, no máquina hasta prueba.
6. Calcular frete BR usando variante CJ verdadera y origen de inventario; registrar precio USD, fecha, método, tasa FX, impuestos y comisiones con evidencia para `Supplier Evidence`.
7. Comparar proveedores; nunca actualizar Woo stock ni cobrar en base a una consulta aislada; certificar ANATEL para los Bluetooth/otros equipos aplicables y revisar legitimidad comercial de importación.

## Qué está prohibido en la etapa actual

- Cualquier herramienta CJ `create_order`, `payBalance`, `merge_orders`, `create_dispute`, `add_to_cart`, envío de mensajes o publicación de listados.
- Raspar sesiones de Temu/AliExpress para simular permisos API. No usar datos de sellers Temu como acceso buyer.
- Dar por probado un proveedor por coincidencia de nombre/modelo, asignar SKU automáticamente o alterar el precio original.
- Configurar pagos salientes a proveedores, split Pix, cobro sin conciliación bancaria o despliegues sin CI.
- Tratar token embebido en la URL de CJ MCP como enlace público: es secreto, evitar exponerlo en registros, navegador, issue o chat.

## Próximo gate

1. Fusionar este PR **solo después de CI PASS**.
2. Si no hay token CJ, dejar routes no configuradas, sin llamadas proveedor.
3. Solicitar acceso CJ (cuenta gratuita) para comprobar producto/flete real a Brasil; opcional solicitar AliExpress Dropshipping app y Banggood Dropship API.
4. Completar rentabilidad 12/12 y shipping/checkout legal antes de operaciones reales.

Protocolo “seguir”: volver al [Plan Maestro](DROPERAGENT-SUPREME-MASTER.md), revisar PRs y evidencia, actualizar bitácora; nunca declarar E2E comercial real solo con tests.
