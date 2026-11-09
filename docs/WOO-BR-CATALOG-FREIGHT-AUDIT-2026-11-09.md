# DROPERAGENT — Auditoría de catálogo WooCommerce y frete Brasil

**Fecha de lectura:** 2026-11-09 (zona del titular America/Sao_Paulo). **Origen:** OneMCP WooCommerce en `droperagent.cu.ma`. **Modo:** lectura, sin cambios comerciales. **Fase:** antes de establecer tarifas y proveedores.

## Inventario WooCommerce: 12 variantes (12 SKU únicos observados)

| Producto | Variación | SKU | Opción | Precio Woo (BRL) | Stock Woo | Riesgo |
| --- | ---: | --- | --- | ---: | ---: | --- |
| Aparador #46 | 48 | `14:173#060-GoldDragon_26080030` | 060-GoldDragon | R$16,24 | 92 | Costo y flete no verificados |
| Aparador #46 | 50 | `14:175#060-BronzeBuddha_26156385` | 060-BronzeBuddha | R$16,24 | 25 | Costo y flete no verificados |
| Aparador #46 | 52 | `14:193#060-BronzeDragon_29807187` | 060-BronzeDragon | R$16,24 | 66 | Costo y flete no verificados |
| Aparador #46 | 54 | `14:366#068-Dragon_29461881` | 068-Dragon | R$43,43 | 17 | Costo y flete no verificados |
| Aparador #46 | 56 | `14:496#068-BeardMan_26163785` | 068-BeardMan | R$43,43 | 33 | Costo y flete no verificados |
| Aparador #46 | 58 | `14:1052#068-Knight_29809084` | 068-Knight | R$43,98 | **1** | Stock Woo crítico; NO prueba proveedor |
| Aparador #46 | 60 | `14:350850#060-BlackBuddha_22526815` | 060-BlackBuddha | R$15,69 | 57 | Costo y flete no verificados |
| Aparador #46 | 62 | `14:350852#OnlyAccess_20273939` | OnlyAccess | **R$6,44** | 234 | Probablemente *solo accesorios*; no anunciar como máquina sin prueba |
| Aparador #46 | 64 | `14:350853#060-BlackDragon_23353231` | 060-BlackDragon | R$15,69 | 187 | Costo y flete no verificados |
| Aparador #46 | 66 | `14:10#060-GoldBuddha_24054083` | 060-GoldBuddha | R$16,24 | 73 | Costo y flete no verificados |
| Aparador #46 | 68 | `14:29#060-NoAccessories_24565835` | 060-NoAccessories | R$13,10 | 61 | Modelo *sin accesorios*; comprobar contenido exacto |
| Auriculares #85 | 87 | `14:193_20576577` | black | R$19,21 | 847 | Certificación ANATEL y costo/flete BR no verificados |

**Observaciones comprobadas:** 11 variantes del aparador + 1 del auricular; SKUs no vacíos y sin duplicados en la muestra. Ambos productos principales `status=publish`, `type=variable`, moneda de venta BRL. Stock total anunciado en los padres #46=846 y #85=847 coincide con los números guardados en Woo, **no con existencias del proveedor**. Los datos de precio son venta minorista configurada, **no** costos de compra, conversión USD→BRL ni márgenes.

**Dimensiones:** ambos productos físicos (#46 y #85) tienen campos de peso, largo, ancho y altura vacíos. Las variantes deben aportar dimensiones propias o heredar datos válidos: cualquier tarifa basada en peso/volumen sin esas medidas resulta indeterminada.

## Diagnóstico de configuración comercial

| Revisión | Observación comprobada | Clasificación |
| --- | --- | --- |
| Moneda | BRL (R$) | Configurada |
| Inventario de tienda | 12 variantes con stock numérico Woo | No verificado contra proveedor |
| Checkout PIX | Easy PIX Integration figura habilitado | Confirmación bancaria automática no probada |
| WooCommerce shipping | `shipping.enabled=true` | Habilitado a nivel de tienda |
| Zonas | Solo zona `id=0` (resto de localidades) | **No hay zona Brasil explícita** |
| Métodos disponibles | 0 en la única zona | **Sin cotización de flete al checkout** |
| Cálculo de tributos Woo | Primera lectura: `tax.enabled=false`; dos lecturas finales: `tax.enabled=true` | **Lecturas divergentes; no se alteró la configuración en este incremento, revisar historial y fiscalidad** |
| Certificaciones | No hay documentos técnicos adjuntos en esta lectura | No verificado |

**Nota de seguimiento de impuestos:** al terminar el despliegue de la auditoría, OneMCP reportó `tax.enabled=true` en dos consultas consecutivas. Al comienzo del turno reportó `tax.enabled=false`. No se observó ni se ejecutó escritura de ajustes fiscales en la implementación de solo lectura; no asumir causa ni fijar el flag sin información fiscal verificada.

**Efecto esperado:** WooCommerce, al no tener un método de envío para la región del comprador, indica que el envío no está disponible en el carrito/checkout de productos físicos. No hay una tarifa real que pudiera agregarse sin inventarla.

**Referencia oficial WooCommerce:** https://woocommerce.com/document/setting-up-shipping-zones/

## Camino seguro para solucionar envíos a Brasil

1. **Establecer origen del envío verdadero** por SKU: China directo, inventario brasileño del operador o almacén tercero; no asumir que un transportista Brasil doméstico cubra China→Brasil.
2. **Obtener peso y dimensiones** por variante/producto desde ficha técnica fiable o medición de proveedor. No usar 0 como reemplazo ni copiar medidas de otro modelo.
3. **Recuperar flete cotizado** al menos hacia destinos representativos de Brasil (CEP y cantidad), con método, fecha y moneda. Convertir USD a BRL con fuente/fecha, considerar tributos de importación, pagos y comisión, política de devoluciones y restricciones.
4. **Revisar precio de venta vs costo total** con el auditor de evidencia del repo: costo producto + flete internacional + tributos + fee gateway + cambio FX + margen objetivo. Sin evidencia, ninguno de los 12 queda aprobado.
5. **Configurar zona Brasil** en `WooCommerce → Configurações → Entrega → Áreas de entrega` y método real (tarifa fija **solo si está respaldada**, o integración oficial del carrier/proveedor). No crear método gratis ni tasa `R$ 0` porque hoy no existe cotización. Para cubrir todo Brasil, verificar CEP/rangos/estados y orden de zonas.
6. **Prueba aislada antes de activar checkout**: productos/variantes, CEP Florianópolis y otros estados, cantidades 1 y 2, moneda/impuestos, checkout sin cobro, imposibilidad de pedidos duplicados y conciliación PIX.
7. **Fiscalidad Brasil y ANATEL:** antes de vender aparatos inalámbricos, verificar requisitos de homologación y declaración del producto; consulta fiscal profesional según modelo de importación. WooCommerce con impuestos desactivados no acredita cumplimiento.

**Sitio:** https://droperagent.cu.ma/wp-admin/admin.php?page=wc-settings&tab=shipping

## Cambios incorporados al administrador

Se agrega al plugin ya existente `wordpress/droperagent-api-connections/droperagent-api-connections.php` un módulo **solo lectura** para que el responsable vea los SKU en WordPress, revise límites de inventario, dimensiones y métodos de envío. No se instala un nuevo plugin, no se modifica el tema visual, no se publica ni cambia inventario/precios, no se registran clientes, no se crean pedidos ni se envían Pix. Prueba WordPress sandbox valida lectura, flag de stock 1, `OnlyAccess`, dimensiones faltantes, bloqueo por cotización ausente e inexistencia de escrituras.

El módulo no sustituye una tarifa; **el envío a Brasil sigue pendiente de costos verificables**. Ante incertidumbre, la tienda debe mostrar disponibilidad de flete no confirmada y evitar el cobro con tasa ficticia.

**Continuación:** comprobar CI, crear PR, publicar solo tras verificaciones y backup, actualizar plan maestro con SHA, WordPress LIVE y límites. Mantener esta auditoría separada de otras tareas.
