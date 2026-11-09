# DROPERAGENT V7 — Product Hunter: 20 candidatos públicos y 5 fichas privadas Woo

**Corte:** 2026-11-09. **Mercado objetivo:** Brasil, moneda tienda BRL. **Tipo de trabajo:** investigación y preparación de catálogo; no lanzamiento comercial ni compras.

## Evidencia de mercado y alcance

La información de la categoría «Casa e jardim» de Nuvemshop, octubre 2026, fue **6,83% del GMV de su muestra de tiendas brasileñas** (fuente: https://www.nuvemshop.com.br/radar-ecommerce-d2c/2026/outubro). Esto indica actividad agregada de la categoría, **NO** demuestra demanda, precios, tráfico, tasa de conversión o rentabilidad de alguno de los artículos específicos de esta tabla.

La búsqueda identificó 20 páginas públicas concretas de EPROLO; **no fue posible consultar precios de compra para la cuenta de DROPERAGENT, stock de variantes ni cotizaciones Brasil**. Las páginas tienen elementos dependientes de inicio de sesión, incluyendo `{{totalForeignInventory}}`, `{{item.cuntry}}` y el calculador de fletes. Estas plantillas **no son números reales**. EPROLO-Dropshipping está activo en WordPress, pero el acceso autorizado de proveedor y sincronización **no se demostraron**.

**No se consideró ninguna ficha aprobada para venta. No se importó inventario, no se publicaron promociones, no se fijaron precios ni tarifas.**

## Trabajo realizado en WooCommerce LIVE, exclusivamente borradores

Se crearon cinco productos como **`status=draft` + `catalog_visibility=hidden` + `stock_status=outofstock` + precio vacío + `purchasable=false`**, con nombres/descripciones preliminares en portugués y advertencia de datos sin verificar. No se usaron fotos cuyo derecho de publicación no estuviera comprobado.

| Woo ID | Candidato | Página pública del proveedor | Datos de la ficha | Pendientes |
| ---: | --- | --- | --- | --- |
| 99 | Escova Manual para Remoção de Pelos de Cães e Gatos | https://eprolo.com/app/product/pet-cleaning-and-hair-removal-comb-cat-comb-to-remove-floating-hair-pet-comb-brush-disposable-wipes-for-long-hair-and-short-hair | Material ABS/silicone; caja de 7×4,5×19,5 cm, peso embalado 150 g; **sin toallitas** | Precio, peso verificado por SKU, variante, fotos, envío, impuestos |
| 100 | Escorredor de Silicone com Clipe para Panelas | https://eprolo.com/app/product/Silicone-Kitchen-Strainer-Clip-Pan-Drain-Rack-Bowl-Funnel-Rice-Pasta-Vegetable-Washing-Colander-Draining-Excess-Liquid-Univers | Silicona, embalaje 23,5×6,5×7,5 cm y 210 g anunciados | Material apto/compatibilidad, proveedor, flete Brasil, costo |
| 101 | Conjunto de Organizadores de Mala para Viagem – 7 Peças | https://eprolo.com/app/product/7pcs-travel-packing-cubes-luggage-organizer-set-with-shoe-bag-for-clothes-storage | Conjunto de siete piezas, tejido Oxford y paneles de malla | Composición exacta, fotos y medidas de cada tamaño, peso, flete |
| 102 | Organizador Adesivo de Cabos para Mesa e Parede – Kit 6 | https://eprolo.com/app/product/data-cable-organizer-desktop-and-wall-stickers-without-punching-fixed-storage-cables | PVC; listados paquetes de seis unidades | Variantes, calidad de adhesivo, tamaño, costos y logística |
| 103 | Organizador de Talheres para Gaveta em Polipropileno | https://eprolo.com/app/product/multi-layer-kitchen-drawer-organizer-tray-spoon-knife-fork-cutlery-separation-storage-box-cutlery-organizer-kitchen-accessories | PP, aprox. 39,8×11,4×5,8 cm, unos 380 g publicados | Confirmación medidas, proveedor, precio/flete, posibles requisitos |

**Verificación posterior OneMCP:** cinco borradores creados, todos ocultos, sin precio, marcados `outofstock` y no comprables; exactamente dos productos originales #46 y #85 permanecieron publicados sin modificación. Moneda tienda BRL. Woo shipping zonas: solo `id=0` sin métodos. Easy PIX habilitado; confirmación bancaria real **no comprobada**. Guard de checkout #41/#42 debe permanecer activo.

## Otros 15 candidatos — sin crear publicaciones

El archivo fuente de datos [../data/product-hunter/candidates-br-2026-11-09.json](../data/product-hunter/candidates-br-2026-11-09.json) incluye **20 URLs públicas distintas**, clasificación, nota de la ficha y dudas de verificación; los restantes 15 son:

| ID | Candidato | Estado |
| --- | --- | --- |
| PH-006 | Luva de Silicone para Escovação de Pets | Alternativa de producto ya evaluado |
| PH-007 | Luva de Tecido para Remoção de Pelos | Alternativa de producto ya evaluado |
| PH-008 | Kit de Higiene e Escovas — 3 Peças | Revisar puntas metálicas y contenido |
| PH-009 | Tapete Antiderrapante para Tigela | Revisar composición y contenido |
| PH-010 | Tigela Dobrável de Viagem para Pets | Revisar materiales y paquete |
| PH-011 | Organizadores de Mala Compressíveis | Compite con PH-003 |
| PH-012 | Organizadores de Viagem — Kit 8 Peças | Compite con PH-003 |
| PH-013 | Fixadores de Cabos para Automóvel — Kit 8 | Compatibilidad/temperatura sin verificar |
| PH-014 | Organizador Magnético de Cabos | Variedad y magnetos sin confirmar |
| PH-015 | Rolo de Panos de Limpeza de Microfibra | **Inconsistencia**: título 20 hojas, paquete dice 1 paño |
| PH-016 | Gancho Adesivo Giratório com Seis Ganchos | Capacidad de carga desconocida |
| PH-017 | Suporte Adesivo de Guarda-Chuva | Adhesión y carga no verificadas |
| PH-018 | Gaveta Suspensa para Mesa de Escritório | Peso/carga/fijación desconocidos |
| PH-019 | Organizador de Mesa com Gavetas de Madeira | **En espera** por volumen/peso/fragilidad |
| PH-020 | Disco de Microfibra para Remover Maquiagem | Revisar higiene y devoluciones |

La lista representa **20 ideas de SKU respaldadas por páginas de catálogo**, no 20 productos con demanda individual demostrada. No hay cálculo de margen verificable ni aprobación comercial.

## Herramienta técnica de protección

- `src/product-hunter-readiness.js`: verifica esquema y unicidad, origen HTTPS de EPROLO, ids de cinco borradores, ausencia de precios/stock/márgenes supuestos, bloquea estados falsos de aprobación de producto o auto-compra, y devuelve resumen sin ninguna garantía de ganancia.
- `tests/product-hunter-readiness.test.js`: prueba catálogo de 20 fuentes, los cinco ids Woo, URLs falsas/duplicadas, ids Woo duplicados, aprobación ficticia, ganancia inventada y desactivación accidental de bloqueos.
- `.github/workflows/core-tests.yml`: valida sintaxis de nuevo módulo y el flujo existente `node --test tests/*.test.js` ejecuta estos tests.
- Datos estructurados con 20 prospects y referencias exactas en `data/product-hunter/candidates-br-2026-11-09.json`. Fuente de verdad para investigación, **no** API de pedidos ni sincronización de proveedores.

## Próximo gate para convertir uno de estos borradores en producto vendible

1. Entrar a la cuenta autorizada de EPROLO, confirmar que ese artículo está disponible y mapear variante a un SKU **real**; no inventar ID interno del proveedor.
2. Obtener precio y moneda actual, descuentos y condiciones; guardar fecha y evidencia.
3. Obtener el origen, dimensiones con embalaje, flete real a al menos un CEP brasileño y plazos factibles; registrar impuestos y restricciones aplicables.
4. Consultar derecho de uso de las imágenes/fotos y preparar las variantes reales; no copiar imágenes privadas sin licencia.
5. Calcular precio de venta y margen BRL, considerando devoluciones y comisiones de pago.
6. Revisar el cumplimiento legal aplicable, incluida documentación fiscal y consumo en Brasil.
7. Testear checkout/PIX sin dinero real, reembolsos y entrega antes de pedir autorización expresa para publicación y lanzamiento.

**La publicación comercial, el checkout físico, el autofulfillment y las operaciones de pago continúan bloqueados.** Se mantienen los sistemas WordPress OneMCP + V7 Profit Monitor y PR #41/#42; sin gasto USD ni cambios a UGO.

## Continuación autónoma realista

El V7 Profit Monitor ya tiene cron diario verificado para auditar el catálogo WooCommerce y las cotizaciones guardadas. Esta matriz proporciona **entradas concretas** al módulo Product Hunter, pero **no ejecuta nueva investigación externa cada día** sin una fuente autorizada, credenciales válidas y proceso programado explícito. Evitar afirmar que la investigación de mercado o la captación de clientes están completamente automatizadas.

La siguiente fase debe dar prioridad a la fuente autorizada de EPROLO y al flete Brasil. Si no se logra verificar un proveedor, trabajar solo en borradores, SEO y medición, sin publicar productos engañosos ni habilitar cobros.
