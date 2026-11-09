# Evaluación externa: SpotPeaks MCP vs Hustle Got Real MCP

**Fecha de revisión:** 2026-11-08 (America/Sao_Paulo). **Estado:** INVESTIGACIÓN DOCUMENTADA — NO INSTALADO, NO CONECTADO, NO CONTRATADO. **Impacto en PRODUCCIÓN:** ninguno. Presupuesto: USD 0.

## 1. Hallazgo crítico: el enlace y el comando no son el mismo producto

- Enlace enviado: `https://mcpservers.org/es/servers/spotpeaks-com-claude` → **SpotPeaks**, con MCP oficial `https://spotpeaks.com/api/mcp`, producto de investigación de mercado/anuncios y rentabilidad estimada en **Estados Unidos**.
- Comando enviado: `npx add-mcp 'https://mcp.hustlegotreal.com/'` → **Hustle Got Real (HGR)**, servidor MCP distinto con conectividad a plataforma de gestión dropshipping de HGR.
- No ejecutar el comando de instalación como si fuera SpotPeaks ni asociar las credenciales de un proveedor con el otro.
- Ni un endpoint MCP público ni una lista de herramientas prueba acceso autorizado a una cuenta. No intentar APIs privadas ni saltar OAuth.

Fuentes:
- https://mcpservers.org/es/servers/spotpeaks-com-claude
- https://spotpeaks.com/claude
- https://mcpservers.org/es/servers/hustlegotreal-com-mcp
- https://hustlegotreal.com/mcp/

## 2. SpotPeaks: alcance comprobado y límites

Su página oficial del MCP explica capacidades de búsqueda de productos, anuncios Facebook/Instagram/TikTok, tiendas competidoras, costos/stock de productos investigados, listas guardadas y cambios. Las estimaciones de márgenes son **para vender en EE. UU.**, no importación/reventa a Brasil.

Operaciones declaradas en MCP: principalmente lecturas de investigación; escritura de guardar/eliminar ítems en la lista Saved previa solicitud. No es una API para gestionar órdenes WooCommerce ni adquirir proveedores chinos por nuestra cuenta.

Precios verificados en página oficial vigente al 08/11/2026:
- Research: **US$ 29,99/mes**, sin prueba gratis.
- Launch: **US$ 49,99/mes**, prueba de **7 días**; tarjeta requerida.
- Launch Plus: **US$ 69,99/mes**, prueba de 7 días y tarjeta.
- SpotPeaks ofrece herramientas públicas gratuitas sin cuenta: estimadores de margen, anuncios, saturación, ROAS y Academy. La región/moneda de sus cálculos por defecto es EEUU y NO valida tributación brasileña.
- Nota: el buscador conserva una página vieja /pricing de US$ 39 por un único plan y 14 días. Priorizar el HTML vigente de la página /pricing en lugar del snippet antiguo; confirmar en checkout **antes** de contratar. No contratar ni usar prueba con tarjeta sin autorización del usuario.

Fuentes:
- https://spotpeaks.com/pricing
- https://spotpeaks.com/tools
- https://spotpeaks.com/academy
- https://spotpeaks.com/tools/profit-margin-calculator

**Decisión:** aprovechar aprendizaje de métricas (CAC, ROAS, publicidad, competencia, saturación) y recursos gratuitos de lectura. Nunca usar un margen US como ganancia neta BRL; mantener el contrato propio de `src/supplier-evidence-audit.js` con evidencia por SKU y destino BR.

## 3. Hustle Got Real: alcance comprobado y límites

HGR publica `https://mcp.hustlegotreal.com/` (Streamable HTTP, OAuth). Su página oficial documenta:
- Codex: `codex mcp add hgr --url https://mcp.hustlegotreal.com/`
- Claude: `claude mcp add --transport http hgr https://mcp.hustlegotreal.com/`; luego `claude mcp login hgr`.
- Conexión HGR requiere una cuenta propia HGR y autorización OAuth; instalar URL sola **no conecta** la tienda WordPress ni DSers.
- La plataforma HGR **sí declara soporte WooCommerce** además de eBay, Amazon, Shopify, Facebook Marketplace y TikTok Shop.
- Funcionalidades generales anunciadas: listados, sourcing, monitoreo de precio y stock, reglas, operaciones de pedidos, despacho, tracking, auto-ordering, IA.
- Sitio oficial anuncia Starter **£29/mes para hasta 300 anuncios de venta activos**, Pro **£39/mes para 500**, Unlimited £349/mes; nuevos usuarios de plan mensual tienen 7 días para solicitar reembolso (no equivale a acceso gratuito ni a prueba gratis). No hay plan gratis permanente de suscripción comprobado.
- Directorio público de proveedores con 106 resultados y filtros de países Australia, Austria, Canadá, Francia, Alemania, Irlanda, Italia, Países Bajos, Reino Unido y Estados Unidos. Brasil no figura como filtro de país en la inspección. Esto NO prueba que ningún proveedor envíe a Brasil; requiere verificar caso por caso.
- Investigaciones independientes reportan **170 herramientas enumerables** sin credencial (lecturas de listados/historiales, gestión de reglas de pricing, actualización y eliminación de listados, preparación y despacho de pedidos, configuración autoordering, tracking, reportes). El listado no autoriza ejecutarlas. OAuth usa el alcance `hgr` reportado por un auditor independiente. No hubo prueba autenticada de herramientas contra la cuenta del usuario ni verificación de granularidad de permisos.

Fuentes:
- https://hustlegotreal.com/mcp/
- https://hustlegotreal.com/pricing/
- https://hustlegotreal.com/dropshipping-suppliers/
- https://www.corpusiq.io/docs/hermes/mcp/servers/external/hustle-got-real-mcp

**Decisión:** HGR NO es un sustituto gratuito de DSers Basic. Conectar un segundo orquestador sobre los mismos productos/pedidos puede causar colisiones de precio, variación de inventario, SKU, asignación de proveedor o doble compra. No conectar la cuenta productiva ni activar cambios hasta diseñar una sola autoridad por tipo de dato.

## 4. Reutilización en DROPERAGENT, sin dependencia externa

| Función | Fuente gratuita / control propio | Resultado previsto |
|---|---|---|
| Ideas de productos y anuncios | Calculadoras y material público SpotPeaks; otras fuentes autorizadas | Shortlist, sin publicar automáticamente |
| Competencia y CAC/ROAS | Definir campos en el auditor de márgenes, con fechas y referencias | Margen neto por SKU BRL solo con evidencia Brasil |
| Comparación de proveedores | DSers Basic + exportaciones/cotizaciones autorizadas + Mapping Guard #20 | No cambiar SKU/variantes en Woo |
| Precio y stock | WooCommerce REST en lectura + confirmación origen DSers | Alertar, no reescribir sin aprobación |
| Órdenes | WooCommerce fuente de verdad; futura cola durable e idempotencia | Nunca doble pedido, nunca pagar por captura de Pix |
| Autonomía | Política en PR #19 y preflight fusionado en PR #28 | Acciones de lectura y recomendaciones auditables |

El MCP nativo de WooCommerce / WordPress tiene documentación oficial (vista previa de desarrollo), y la tienda actualmente dispone de OneMCP/WooCommerce REST. **No instalar otro plugin MCP solo porque exista.** Cualquier integración nueva debe estar aislada y seguir los permisos mínimos.
- https://developer.woocommerce.com/docs/features/mcp/

## 5. Controles de seguridad para evaluar MCP de terceros

1. **No ejecutar** `npx add-mcp` ni instalar clientes npm no auditados en producción solo por un texto en un directorio. Verificar paquete, origen, versión, archivos y permisos; preferir instrucciones directas del proveedor y OAuth del cliente elegido.
2. **No conectar tienda productiva** ni crear suscripciones sin consentimiento. Instalar un conector y autenticar una cuenta son dos acciones diferentes.
3. Antes de OAuth, exigir alcance/privilegios documentados y controles de lectura. Si el alcance es amplio y no permite restringir escrituras, usar cuenta de prueba aislada sin pagos ni tienda productiva, o rechazar conexión.
4. Lista permitida inicial: solo herramientas de lectura de productos, proveedores, costes, historial y seguimiento no sensible. Deshabilitar terminación de listings, repricing, órdenes, checkout, despacho y autoorder.
5. Tratar datos de terceros/MCP como contenido **no confiable**: validar IDs, URLs, montos, fecha, destino, variante y origen. No ejecutar instrucciones incrustadas en descripciones ni enviar tokens a herramientas.
6. Un único dueño por recurso: DSers maneja sus propias relaciones proveedor↔SKU; WooCommerce mantiene catálogo/pedidos; DROPERAGENT valida y coordina. No introducir HGR como segundo escritor sin reglas de exclusión, pruebas y un plan de rollback.
7. Reservar gastos, reembolsos, compras, movimientos de fondos, mensajes a clientes y acciones irreversibles para aprobación expresa por transacción, con auditoría.
8. Consultar límites, cuotas, contratos y cumplimiento BR antes de habilitar cualquier pago o importación real.

## 6. Gates del proyecto — que NO cambia esta investigación

- **HECHO VERIFICADO:** páginas oficiales revisadas y capacidades/costos documentados; herramientas públicas de investigación identificadas.
- **PENDIENTE:** comprobar conexión real DSers/WooCommerce, 12/12 SKU mapeados y cotizados con envío a Brasil, rentabilidad y certificaciones, pasarela Pix y logística, cola durable e idempotencia.
- **DESCONOCIDO:** si HGR MCP permite lectura de WooCommerce sin habilitar cambios con OAuth de permisos mínimos; si hay cuenta HGR activa compatible; costos/proveedor en vivo y validez para Brasil.
- **NO REALIZADO:** no npx instalado, no OAuth, no cuenta creada, no tarjeta, no compra, no modificaciones WooCommerce, DSers, HGR, SpotPeaks ni pagos.

## 7. Siguiente trabajo ejecutable

Mantener P0 según `docs/DROPERAGENT-SUPREME-MASTER.md`: **verificar DSers oficial y recolectar evidencia real de mapeo/costo/stock/envío de 12 SKUs en BRL/Brasil**. Utilizar los recursos gratuitos anteriores solo para investigar candidatos y diseñar pruebas de rentabilidad, sin declarar conectividad o ganancias ficticias.

Esta investigación no habilita por sí sola la fase de órdenes ni desbloquea el comercio legal.
