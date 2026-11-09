# DROPERAGENT — Cotizaciones por variante y margen BRL en WordPress

**Fecha:** 2026-11-09. **Implementación:** v0.5.0 del panel ya instalado `WooCommerce → DROPERAGENT APIs`, sin plugin adicional. **Objetivo:** tener los insumos necesarios para configurar envíos reales a Brasil, sin inventar costos ni habilitar pagos.

## Datos mínimos por cada una de las 12 variantes

- SKU WooCommerce y precio de venta BRL: **leídos en vivo** del catálogo.
- Costo unitario del proveedor convertido a BRL, con origen documental y fecha.
- Flete internacional/nacional **al CEP BR indicado**, BRL y método concreto; **una cotización para un CEP no equivale a tarifa nacional**.
- Impuestos de importación y tasas aduaneras, comisiones del medio de pago/conversión y otros costos en BRL.
- Nombre del proveedor, origen ISO-2, fecha de cotización real y enlace HTTPS de evidencia. No agregar secretos a URL.
- En cada cambio de SKU o precio de tienda, volver a validar la evidencia. La cotización tiene máximo **14 días** de frescura desde la fecha indicada. Después sigue registrada, pero marcada para revisión.

En la pantalla de auditoría existe el enlace **Editar cotação** por SKU. La captura es solo administrativa y no modifica los productos. Los valores monetarios aceptan decimal punto o coma, dos decimales como máximo, sin separadores de miles; importes negativos inválidos.

## Cálculos

```
costo_total = costo_proveedor + flete_CEP + impuestos_declarados + comisiones + otros
margen_bruto_estimado = precio_venta_woo - costo_total
margen_% = 100 * margen_bruto_estimado / precio_venta_woo
```

Solo **estimación manual** para una unidad a un CEP. No supone que impuestos y comisiones estén correctos, ni que el proveedor efectivamente entregue. Margen negativo aparece con signo menos; no ocultar pérdidas.

**Siempre:** `supplier_verified=false`, `shipping_verified=false`, `taxes_verified=false` y `sell_authorized=false` aunque se haya completado el formulario. La aprobación real futura requiere un proceso independiente, revisión de evidencias, requisitos fiscales y legales, ANATEL cuando corresponda y una cotización válida para el CEP y la cantidad reales en checkout. No conectar automáticamente esta tabla a Woo shipping rates.

## Seguridad y persistencia

- WooCommerce continúa como fuente de verdad de SKU y precio de tienda; se consulta mediante `wc_get_products` y `wc_get_product`.
- Se guarda únicamente un registro administrativo en `wp_options` **no autoload** bajo nombre aislado `droper_quote_brl_v1_<variation_id>`, con hash SHA-256 del SKU (no es una contraseña). Al cambiar de SKU, el registro no se aplica.
- Admin `manage_options` y nonce `admin_post_droper_api_cost_save` / `remove`. Ningún endpoint REST público. No escritura en productos, stock, órdenes, pagos o shipping WooCommerce.
- Nunca guardar API Keys/tokens en URL de cotización; el sistema rechaza enlaces no HTTPS o que contengan userinfo o ciertos nombres de parámetros sensibles. La URL solo se muestra en el administrador.
- Cotización caducada o precio alterado se identifica claramente. Los datos cargados por un administrador **no constituyen verificación independiente del proveedor**.
- Las opciones de proveedor CJ, AliExpress y Banggood existentes no se leen, modifican ni exportan.

## Evidencias del estado real anterior

- Woo #46 11 variantes, #85 una: 12 SKU no vacíos, sin duplicados entre estas variantes.
- Stock #58 = 1, #62 `OnlyAccess` con contenido de kit sin confirmar.
- Woo shipping: no hay métodos ni zona Brasil explícita; no habilitar `frete grátis` o `flat rate` sin tarifa documental.
- Pesos y dimensiones Woo faltantes. Sin medidas y sin proveedor/transportista real no existe cálculo de envío confiable.
- Easy PIX aparece activo, **sin confirmar conciliación bancaria automática**.

## Pruebas y publicación

- El workflow `.github/workflows/wordpress-ci.yml` prueba parseo centavos BRL, rechazo de valores malformados/negativos, no-autoload, SKU distinto, precio alterado, margen negativo, caducidad y eliminación de registro.
- Solo publicar tras Core + WordPress Sandbox PASS y revisión de diff y borrador OneMCP. El respaldo de tema es obligatorio; una actualización del tema padre podría sobrescribir el módulo temporalmente integrado.
- Comprobar en producción que el módulo se visualiza y las tres integraciones existentes siguen presentes.

## Qué impide terminar el checkout real

1. Datos documentados de proveedor por SKU (producto, origen, entrega a Brasil, stock).
2. Peso/medidas y costos actuales reales para Brasil, tributos y comisiones; un precio Woo no equivale a costo.
3. Zona de envío Brasil con métodos auténticos para CEP y cantidades respaldados por cotización, nunca tarifa inventada.
4. Verificación de cobertura legal/fiscal, homologación de dispositivos aplicables (ANATEL, etc.).
5. Pix con confirmación de ingreso independiente, pago al proveedor autorizado y trazabilidad; no liberar pedidos hasta conciliación.
6. E2E de checkout y fulfillment sin clientes reales ni cargos en sandbox.

DROPERAGENT no puede certificar `COMMERCE PASS` solo con esta interfaz. Lo correcto es conservar checkout no operativo para envíos hasta contar con las evidencias.

Documento principal: [Plan Maestro](DROPERAGENT-SUPREME-MASTER.md).
