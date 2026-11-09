# DROPERAGENT — protección de checkout hasta validar envíos y costos

**Fecha:** 2026-11-09. **Módulo:** `wordpress/droperagent-api-connections/droperagent-checkout-gate.php`. Es una extensión del proyecto ya conectado, no un plugin adicional ni una pasarela.

## Problema confirmado en WordPress

WooCommerce tiene dos productos físicos con 12 variantes en BRL; no tiene métodos de transporte en su zona predeterminada ni una zona Brasil explícita. Las tarifas China→Brasil, peso, medidas, impuestos y la confirmación de recepción de fondos PIX **no están demostradas**. Publicar tarifa de envío gratuita o una fija sin prueba puede cobrar de menos y dejar pedidos sin posibilidad de fulfillment.

WooCommerce oficialmente indica que, si la zona del comprador no tiene métodos, el checkout debe mostrar que no existe envío disponible: https://woocommerce.com/document/setting-up-shipping-zones/ .

## Cómo actúa el guard

- **Fail-closed:** `DroperAgent_Checkout_Gate::is_approved()` retorna `false` por decisión explícita de lanzamiento; registrar cotizaciones manuales en el panel **nunca habilita ventas**. Liberar el gate exige revisión humana, evidencia financiera/sourcing/logística y un cambio de código controlado, pruebas + despliegue verificado.
- **Solo productos físicos:** analiza los objetos WooCommerce del carrito con `needs_shipping()`. Carritos exclusivamente de servicios/virtuales y carritos vacíos no reciben bloqueo.
- **Checkout clásico:** `woocommerce_check_cart_items` (aviso) y `woocommerce_after_checkout_validation` (error de validación antes del pago).
- **Cart/Checkout Blocks y Store API:** `woocommerce_store_api_cart_errors` introduce `WP_Error` de validación; WooCommerce devuelve respuesta de error. Referencia de código oficial: https://woocommerce.github.io/code-reference/files/woocommerce-src-storeapi-utilities-cartcontroller.html .
- No registra órdenes, no toca stock, no intercepta transacciones PIX ni cambia precios, zonas o comisiones. El resto de WordPress puede seguir mostrando productos, aunque no cerrar una compra física hasta autorización de lanzamiento.
- Se muestra un mensaje en portugués indicando que el envío todavía no está validado.

**Límite crucial:** la validación de carrito/checkout **no bloquea** a un administrador u otra integración que cree directamente un pedido por el endpoint `wc/v3/orders`. Se debe respetar la política de permisos de escritura/servicio, y no conectar autoorder a ninguna app no autorizada. WooCommerce admin puede registrar pedidos manuales aunque la venta comercial permanezca bloqueada.

**No equivale a un sistema completo de prevención de fraude o conciliación Pix.** No se considera `COMMERCE PASS`.

## Carga y despliegue en WordPress conectado

Actualmente `functions.php` del tema Twenty Twenty-Five incluye `droperagent-api-connections.php` **solo en admin**. El guard debe cargarse para **solicitudes públicas**, no solo dentro de `is_admin()`. Estrategia:

1. Mantener intacto el `if ( is_admin() && file_exists(...droperagent-api-connections.php) ) { require_once ...; }`.
2. Crear archivo `twentytwentyfive/droperagent-checkout-gate.php` con el contenido fuente idéntico a `wordpress/droperagent-api-connections/droperagent-checkout-gate.php` del PR fusionado.
3. Añadir solo estas líneas al final de `functions.php` del tema, sin reemplazar código anterior:

```php
// DROPERAGENT: fail-closed guard for physical WooCommerce purchases.
// Must load on public requests (not wrapped in is_admin()).
if (file_exists(get_theme_file_path('droperagent-checkout-gate.php'))) {
    require_once get_theme_file_path('droperagent-checkout-gate.php');
}
```

4. Usar el sistema **OneMCP theme draft**: backup + PHP lint + preview + test wp-admin/home/page/product/cart/checkout cuando esté disponible, y publicación solo tras CI. Ante timeout del gateway, **leer live y estado del draft** antes de decidir reintento o descartar draft duplicado.
5. Al instalar el módulo como plugin permanente en el futuro, incluir el guard en el plugin y quitar este loader del tema para evitar doble ejecución; `require_once` y class_exists previenen doble carga accidental pero mantener solo un punto de entrada.
6. Una actualización del tema padre puede sobrescribir el bootstrap; migrar a plugin propio antes de actualizar tema.

## Pruebas

`.github/workflows/wordpress-ci.yml` copia el guard al sandbox WooCommerce, valida PHP, registra y comprueba hooks de bloques/clásico, producto físico bloqueado con `WP_Error`, producto virtual y carrito nulo sin bloqueo, `is_approved=false`. Sin clientes, sin order creation ni pagos.

## Requisitos verificables para desbloquear

1. Proveedor y variante correctos para 12 SKU, con costos reales, stock, condiciones y sourcing autorizado.
2. Peso/medidas, origen de mercancía y cotización vigente de envío a Brasil por dirección/cantidad.
3. Tributos, homologaciones y política de devoluciones de cada producto según la legislación vigente.
4. Pasarela de recepción PIX validada y conciliación bancaria/reembolso trazables, sin pagos salientes automáticos.
5. Zona Brasil y método de envío respaldados en WooCommerce, con pruebas de checkout para cart clásico y bloques.
6. Revisión final de riesgos y autorización explícita de lanzamiento. El cambio de `is_approved` debe quedar en PR separado, con evidencia de todas estas pruebas.

**No se ejecuta ni simula ningún pago en este incremento.**
