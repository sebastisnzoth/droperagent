# DROPERAGENT — bloqueo adicional para pagos de pedidos existentes

**Fecha:** 2026-11-09. **Archivo canónico:** `wordpress/droperagent-api-connections/droperagent-checkout-gate.php`.

## Riesgo comprobado

El guard introducido en el PR #41 bloquea carritos físicos a través de validación clásica de checkout y Store API del carrito, pero WooCommerce también permite **pagar pedidos ya creados** mediante:

- Checkout legado: `/checkout/order-pay/{ORDER_ID}`, procesado mediante `WC_Form_Handler::pay_action()`. El hook `woocommerce_before_pay_action` se ejecuta antes de escoger pasarela y `process_payment()`.
- Checkout Blocks / Store API: `POST /wc/store/v1/checkout/{ORDER_ID}`, documentado para procesar pagos de pedidos existentes. El hook `woocommerce_store_api_checkout_order_processed` ocurre **antes** de procesar la pasarela.

Fuentes WooCommerce oficiales:
- https://woocommerce.github.io/code-reference/files/woocommerce-includes-class-wc-form-handler.html
- https://developer.woocommerce.com/docs/apis/store-api/resources-endpoints/checkout-order
- https://developer.woocommerce.com/docs/block-development/cart-and-checkout-blocks/faq
- https://woocommerce.github.io/code-reference/files/woocommerce-src-storeapi-routes-v1-checkoutorder.html

Estos caminos pueden existir sin el carrito de compras original, de modo que un bloqueo solamente basado en `WC()->cart` es insuficiente.

## Solución implementada

Añade al guard *existente* (sin nuevo plugin ni nueva API):

1. `order_requires_delivery($order)`: revisa las líneas de pedido y el estado `needs_shipping()` de los productos; producto eliminado/desconocido se considera inseguro y se bloquea por precaución.
2. `woocommerce_available_payment_gateways`: devuelve un arreglo vacío cuando el carrito físico está bloqueado o se visita el pago de un pedido existente que requiere envío. No altera carritos solo virtuales.
3. `woocommerce_before_pay_action`: si el pedido requiere envío, interrumpe el pago legado con HTTP 403 y mensaje explícito. No crea/actualiza pedidos ni toca sus importes.
4. `woocommerce_store_api_checkout_order_processed`: antes de procesar pago Store API, rechaza físicamente con `RouteException` (403) si está disponible; reserva fallback que termina HTTP 403 si la clase de excepción no existe.
5. La liberación sigue siendo `DroperAgent_Checkout_Gate::is_approved()=false`; **ningún registro de cotización puede activarla**.

No se modifica Easy PIX, precio, stock, cantidades, órdenes ni shipping. No se invocan pagos reales en CI o producción.

## Pruebas

Ampliar `.github/workflows/wordpress-ci.yml` para comprobar: hooks instalados, producto de ensayo físico/virtual, `WC_Order` con línea física bloqueado, `WC_Order` virtual no bloqueado, gateways retirados del carrito físico, Store API rechazada con excepción y sin modificaciones de pedidos reales.

**Límite:** el filtro no impide por sí mismo la creación directa de pedidos mediante API administrativa `wc/v3/orders` o llamadas explícitas de integraciones con acceso de escritura. Conservar permisos restringidos, worker de compras apagado y conciliación bancaria manual; no afirmar comercio listo sin evidencia y autorización de venta.

**Deploy:** solo con Core + WordPress sandbox en verde, diff revisado, OneMCP theme draft, `theme-draft-check`, backup y verificación de archivo LIVE idéntico a GitHub `main`. No hacer un segundo publish si el gateway devuelve timeout antes de comprobar status.

**Pendiente externo:** flete real, origen/stock/costos por SKU, impuestos y cumplimiento, pasarela PIX conciliada y autorización expresa de lanzamiento.
