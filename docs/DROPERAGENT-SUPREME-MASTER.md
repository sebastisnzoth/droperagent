# DROPERAGENT SUPREME V4 — PLAN MAESTRO Y BITÁCORA DE CONTINUIDAD

**Documento de referencia obligatorio** para retomar la ejecución cuando el usuario escriba **“seguir”** en el proyecto DROPERAGENT.
Fecha de apertura: 2026-11-08. Idioma operativo: español; tienda al público: pt-BR. Presupuesto inicial: **USD 0**, sin contratación de servicios pagos ni gastos no autorizados.

> Este documento es un registro verificable de trabajo. No es un proceso en segundo plano ni habilita al asistente a seguir actuando fuera de una conversación. Antes de cada continuación se debe abrir la versión actual en GitHub, contrastarla con el código, los PR y los sistemas conectados, y actualizarla con evidencia de lo realmente ejecutado.

## 0. Misión y definición de terminado

Construir DROPERAGENT como una operación de dropshipping segura y trazable, usando WooCommerce como tienda, DSers Basic por sus canales oficialmente soportados y una capa propia de auditoría de proveedor, costo, SKU, rentabilidad, pedidos y logística.

**No declarar FINISHED, COMMERCE PASS o E2E PASS** hasta cumplir simultáneamente:
1. WooCommerce, panel y API accesibles y autenticados, con pruebas reales de inicio/cierre de sesión y protección de datos.
2. Cuenta DSers y tienda exacta verificadas desde un canal autorizado; identificación de proveedores, país y capacidades reales. No inferir conexión DSers a partir de datos importados en Woo.
3. Todas las variantes publicadas cubiertas por correspondencias comprobadas, stock verificable y costos/flete a Brasil recientes; controles de duplicados y equivalencias aprobadas.
4. Pricing en BRL por SKU, con costos documentados (producto, flete, tributos, tasas, publicidad, devoluciones y cambio, cuando aplique), sin márgenes inventados.
5. Infraestructura con almacenamiento transaccional durable, idempotencia, colas/reintentos seguros, estados terminales y registro auditable; ningún pedido repetido.
6. Proceso completo en sandbox o simulación fiel: pedido → verificación → sourcing → preparación de compra → tracking → incidencia y recuperación; PASS demostrado.
7. Verificación comercial, fiscal, importación/reventa, certificaciones (incluida ANATEL si aplica), frete y políticas de consumidor para Brasil.
8. Prueba financiera y logística real **solo después de autorización expresa**, con fondos verificados, proveedor correcto y evidencia del resultado.
9. CI verde, revisión de seguridad y respaldo/restauración probados antes de cambios productivos importantes.

La exigencia “sin restricciones” significa **independencia técnica y máxima automatización dentro de los permisos y límites legítimos**. No eludir autenticación, licencias, bloqueos de proveedores, controles financieros ni normas legales.

## 1. Sistemas y fuentes de verdad

- Repo: https://github.com/sebastisnzoth/droperagent — main es la base de producción. Cada implementación requiere rama/PR con propietario y alcance claros.
- Panel: https://sebastisnzoth.github.io/droperagent/ — GitHub Pages.
- API: https://droperagent-api.onrender.com — Render Free, su disco NO es almacenamiento transaccional durable.
- Tienda: https://droperagent.cu.ma/ — WordPress + WooCommerce.
- DSers: cuenta privada no accesible desde este agente; DSers MCP oficial requiere plan habilitado y condiciones de tienda compatibles, **no** sustituye DSers Basic.
- Fuentes oficiales consultadas: https://github.com/dsers/dsers-agent-skills ; https://github.com/dsers/dsers-mcp-server ; https://help.dsers.com/ ; https://woocommerce.github.io/woocommerce-rest-api-docs/ .
- Mantener habilitación de worker comercial en cero hasta persistencia y controles financieros: DROPERAGENT_DISABLE_WORKER=1.
- Nunca colocar claves, cookies, contraseñas, ID personales, datos de comprador, direcciones, tokens OAuth o detalles financieros sensibles en git, issues, logs o informes.

## 2. Bitácora de estado: HECHO VERIFICADO / PENDIENTE / DESCONOCIDO

### HECHO VERIFICADO — al 2026-11-08
- Repositorio main auditado, API existente con endpoints autenticados y WooCommerce REST client de lectura.
- PR #20 fusionado: src/supplier-mapping-guard.js, endpoint POST /api/automation/mapping-preflight, fail-closed, nunca autoorden.
- PR #22 fusionado: auditoría de configuración comercial sin escrituras en la tienda.
- PR #23 fusionado: gating de conexión LIVE del frontend.
- WooCommerce consultado por OneMCP: productos variables #46 (11 variantes) y #85 (1 variante), 12 variantes con SKU en tienda, **no significa SKU comprobados en DSers**.
- WooCommerce: moneda BRL, zona de envío por defecto sin métodos; pasarelas dLocal Go, Rede Pix y WP28 Pix configuradas, **sin prueba de liquidación**.
- Bridge WordPress activo (plugin DroperAgent Bridge 0.2.1) y API con protecciones, pero no equivale a cola durable ni DSers vivo.
- Documentación DSers oficial publicada en repositorios GitHub: skill de análisis sin conexión, MCP alojado mediante OAuth con requisitos comerciales.

### HECHO VERIFICADO — incremento V4 (2026-11-09 UTC)
- Rama implementada: feat/supreme-v4-supplier-evidence (PR #28 fusionado en main).
- Alcance exclusivo: este plan maestro; contrato de datos de cotizaciones; auditor puro de evidencia de costos/flete/rentabilidad reutilizando Mapping Guard #20; pruebas; endpoint autenticado de solo lectura si pasa CI.
- Estado de entrega: **PR #28 FUSIONADO**: https://github.com/sebastisnzoth/droperagent/pull/28 ; commit main 76ebc412369e510db5c43a40dc6a54052dc8729b (squash). Último head PR c34ca451229394212b32ad6dd14c1669b64bc805. CI último: Core Tests PASS (48 unitarias + HTTP/MCP) https://github.com/sebastisnzoth/droperagent/actions/runs/42548981050 ; WordPress/WooCommerce Sandbox PASS https://github.com/sebastisnzoth/droperagent/actions/runs/42548981052 . Este CI acredita código/sandbox, **no** conexión LIVE de DSers ni pago real.
- No tocar productos WooCommerce, pagos, inventario, credenciales ni fuentes DSers.

### PENDIENTE / BLOQUEADO
- Acceso DSers oficial a cuenta y pruebas de vinculación real con WooCommerce.
- Costo/proveedor/stock/entrega a Brasil y evidencia 12/12.
- Importaciones, régimen de reventa, tratamiento tributario, homologaciones y políticas aplicables: revisión profesional y plataformas oficiales.
- Configuración de métodos de envío; checkout no probado con pago confirmado.
- Persistencia durable de órdenes/idem-potencia y observabilidad antes de activar worker 24/7.
- Flujo de prueba integral; pago al proveedor y liquidación al titular con autorizaciones y comprobación de fondos.

### DESCONOCIDO; nunca presentar como aprobado
- Si DSers está vinculado actualmente a la tienda, si sincroniza inventario/precios, qué proveedor corresponde a cada SKU y costos por variante.
- Estado real de aceptación de Pix, cobro/settlement y split.
- Rentabilidad, tiempos de entrega y cumplimiento regulatorio de cada producto.
- Vigencia de planes/cuotas de servicios gratuitos; verificar antes de usarlos.

## 3. Registro de propiedad de trabajo / no superposición

- PR #13 ABIERTO: documentación de conexión DSers, WooCommerce/InfinityFree. No editar sus archivos ni afirmar conexión.
- PR #18 ABIERTO (draft): auditor de mapping DSers y variantes. No reimplementar su lógica ni forzar merge. Evidencia de WooCommerce añadida al PR.
- PR #19 ABIERTO (draft): política de autonomía + skills de sourcing/Meta. No crear otro motor de permisos ni agente paralelo en este incremento.
- PR #20 FUSIONADO: Mapping Guard y endpoint de preflight; **reutilizar**.
- PR #22 FUSIONADO: Woo blueprint; reutilizar.
- PR #23 FUSIONADO: frontend LIVE; no cambiar sus flags sin verificación.
- Incremento SUPREME V4: auditoría complementaria de cotizaciones y márgenes, sin acceso DSers ni side effects.
- Si PRs cambian entre sesiones, consultar GitHub nuevamente y corregir esta tabla.

## 4. Fases ejecutables, criterios de aceptación y secuencia

### Fase A — Control de proyecto y documentación [HECHO VERIFICADO PARA ESTE INCREMENTO]
A1. Crear este plan maestro y contrato de evidencia; vincularlo desde README.
A2. Crear rama y PR independientes; ejecutar pruebas locales y CI.
A3. Actualizar tabla de avances y próximo paso luego de cada ejecución.
**PASS:** PR verificable con documentos y suite, sin intersecciones no justificadas.

### Fase B — Evidencia DSers/WooCommerce [BLOQUEADA: faltan acceso autorizado y datos de proveedor]
B1. Confirmar conexión real tienda/canal desde DSers y proveedor autorizado; sin copiar tokens.
B2. Obtener datos no secretos por exportación oficial o comprobantes revisados; fuente/fecha/país/moneda por SKU.
B3. Alimentar guard #20 y auditor de costos; bloquear variantes sin evidencia.
**PASS:** 12/12 con evidencia reciente y estado de Mapping confirmado; si no hay acceso, se informa NO VERIFICADO.

### Fase C — Rentabilidad y catálogo [PENDIENTE]
C1. Definir umbral de margen aprobado por el usuario y tratamiento de tributos/cambio.
C2. Calcular ganancia por SKU; marcar accesorios “OnlyAccess” con claridad, evitar promoción engañosa.
C3. Revisión de certificados, descripciones, fotos, peso y dimensiones.
**PASS:** costos completos, margen validado y ningún costo obligatorio en cero por omisión.

### Fase D — Infraestructura durable [PENDIENTE]
D1. Evaluar persistencia que cumpla cuotas gratis (Cloudflare D1 / alternativa), identidad, permisos y continuidad.
D2. Cola idempotente, locks, claves de deduplicación, auditoría, replay controlado, DLQ, kill switch.
D3. Webhooks oficiales autenticados con secret/firma y fallbacks; alertas sin depender del disco de Render Free.
**PASS:** reinicio/reintento/duplicado/desconexión sin pedido o cobro doble.

### Fase E — Flujo E2E simulado [PENDIENTE]
E1. Pedido sandbox no cobrable, proveedores de prueba, incidentes de stock, envío, devoluciones.
E2. Estado de pedidos, tracking, atención y resolución supervisados.
E3. Gate de seguridad y logs anonimizados; CI/E2E.
**PASS:** simulación íntegra y reversible sin dinero ni cliente real.

### Fase F — Legal, cobro, fulfillment real [BLOQUEADO]
F1. Validación comercial/fiscal de Brasil, envío legítimo, consumidor y homologación si aplica.
F2. Gateway y liquidación reales confirmados; no confiar en plugin habilitado como pago verificado.
F3. Solo con confirmación expresa de operación y monto: piloto real auditado.
**PASS:** venta, compra, entrega, ganancia y resolución documentadas.

## 5. Política de dinero, producción y seguridad

- Sin compras, pagos, split, reembolsos, envíos de mensajes o publicación de nuevos productos sin aprobación humana específica para recursos y montos.
- Nunca modificar SKUs/atributos de variantes existentes para mejorar apariencia ni activar autorepricing/autoorden.
- Pruebas deben usar fixtures ficticios; no consultar cuentas privadas sin conector autorizado, no scraping de sesión.
- Accesos por mínimos permisos, secrets server-side, límites de entrada, validación de firma, serialización segura, sanitización de errores.
- Pago Pix manual: comprobante/captura no prueba liquidación. No marcar pedido pagado ni pagar proveedor hasta reconciliación real.
- Deploy siempre con base actual, CI verde, diff revisado, rollback disponible y evidencia post-deploy.

## 6. PROTOCOLO “SEGUIR”: obligatorio en cada nuevo turno

1. Leer **la versión actual de este archivo en GitHub** antes de trabajar; no confiar solamente en la conversación.
2. Revisar README, main/head SHA, PR abiertos y checks, endpoints vivos de solo lectura, documentación relevante y archivos propietarios.
3. Identificar una única tarea P0 abierta con evidencia suficiente y comprobar que otro PR/agente no la está desarrollando.
4. Escribir pruebas/validaciones que fallen ante SKU equivocado, datos vencidos, gastos omitidos, duplicados y autorización ausente.
5. Implementar en rama aislada; ejecutar pruebas relevantes y seguridad; no simular PASS.
6. Crear/actualizar PR, adjuntar evidencias reales y **editar este archivo**: hechos, pendientes, bloqueos, SHA, PR y próximo trabajo.
7. Informar al usuario HECHO VERIFICADO, PENDIENTE/BLOQUEADO, DESCONOCIDO, enlaces y próxima tarea concreta. No prometer ejecución asíncrona.
8. Si una operación remota tiene timeout, LEER el recurso antes de reintentar; nunca reintentar ciegamente operaciones con efecto financiero.

## 7. Checklist compacto de aceptación

- [x] Existe infraestructura de código del Mapping Guard en main.
- [x] Se documentó la existencia y limitaciones del DSers MCP oficial.
- [x] Plan maestro en main accesible y vinculado desde README (PR #28 fusionado).
- [x] Contrato de cotizaciones y endpoint read-only en main; CI y Render deploy LIVE verificados, con prueba HTTP externa de POST sin sesión = 401 y cabecera no-store.
- [ ] DSers conectado / mapping real verificado para 12 SKU (no existe sesión DSers autenticada en este chat ni datos oficiales de su cuenta).
- [ ] Stock, costos, flete y margen confirmados SKU por SKU.
- [ ] Revisión de riesgo legal/logístico completada.
- [ ] Cola durable e idempotencia probadas.
- [ ] Piloto E2E íntegro con sandbox sin gastos.
- [ ] Prueba real con pago y proveedor autorizados.
- [ ] COMMERCE PASS basado en evidencia integral.

## 8. Registro de sesiones

### 2026-11-08 — inicio de ejecución V4
- Se auditaron main, README, src/index.js, src/woocommerce-client.js, mapping guard, tests y flujos de CI.
- Se confirmó #20, #22, #23 fusionados; #13, #18, #19 abiertos; no duplicar.
- Se eligió complementar el guard con evaluación de cotización por SKU / BRL / Brasil y bloqueo por evidencia incompleta.
- Implementado src/supplier-evidence-audit.js, endpoint administrativo de preflight (sin llamadas DSers ni escrituras), docs/DSERS-SUPPLIER-EVIDENCE-CONTRACT.md, tests unitarios/HTTP y CI en PR #28.
- Resultado inicial de CI: Core y WordPress Sandbox PASS (runs enlazados arriba). Endurecimiento posterior: no publicar margen si cotización stale/moneda incorrecta/mapping sin revisar, con pruebas añadidas. Revalidar CI del head vigente.
- Próximo paso P0: verificar en DSers (sesión oficial) vinculación real de droperagent.cu.ma — Website, Authorization y Connection/webhook —; obtener cotizaciones/proveedores y envío Brasil para 12 SKU; ejecutar preflight con evidencias reales. Sin comprar ni pagar.

**Nunca borrar entradas anteriores sin justificar la corrección.** Los cambios de estado necesitan evidencia GitHub o del sistema fuente; un checklist marcado manualmente no constituye PASS.

### 2026-11-09 UTC — checkpoint posterior a PR #28
- PR #28 fusionado mediante squash (commit 76ebc412369e510db5c43a40dc6a54052dc8729b); main contiene el maestro, contrato, auditor, endpoint autenticado y pruebas.
- Core Tests CI PASS, 48 unitarias y pruebas adicionales de seguridad HTTP; WP/Woo sandbox PASS. No se realizaron operaciones monetarias ni cambios en WooCommerce.
- Render verificado desde cuenta conectada: servicio srv-dbnui3rrjlhs739tv880, deploy dep-dboim3vavr4c73bgil30, estado LIVE, commit 76bdb5bd1a41ed82780f2fbccd14d246524bd3d1, completado 2026-11-09T02:08:52Z. No prueba HTTP autenticado ni datos DSers. Consulta web pública /health desde esta sesión fue inaccesible; mantener estado HTTP EXTERNO DESCONOCIDO.
- Siguiente P0: DSers conexión oficial y evidencia de costos/flete/variantes 12/12. No marcar COMMERCE PASS.

### 2026-11-09 UTC — control HTTP de producción y PR #29

- PR #29 fusionado a main con squash commit 4183e3e2db208acbacbebf2cae7df0853977a189; modifica únicamente scripts/live-public-smoke.mjs agregando protección del nuevo endpoint.
- GitHub Actions external LIVE smoke 10/10 PASS: https://github.com/sebastisnzoth/droperagent/actions/runs/42549562426 . Runner externo comprobó /health status 200 e identidad, WooCommerce health conectado, CORS, 401 de rutas protegidas y **POST /api/automation/supplier-evidence-preflight sin sesión = 401**, además de GitHub Pages y bundles.
- Core Tests PASS: https://github.com/sebastisnzoth/droperagent/actions/runs/42549562437 ; WordPress + WooCommerce Sandbox PASS: https://github.com/sebastisnzoth/droperagent/actions/runs/42549562388 .
- DSers y proveedores: aún SIN ACCESO LIVE; el PRE-FLIGHT no prueba precios ni stock reales. Pagos y compras continúan deshabilitados desde DROPERAGENT.
- Próxima tarea verificable cuando se diga “seguir”: leer esta bitácora; consultar GitHub main y PRs vigentes, comprobar despliegue actual y buscar vía autorización oficial DSers el estado Website/Authorization/Connection, mapeos y cotizaciones reales. Si no hay conexión DSers, no inventar datos ni confundir Basic con MCP.
- Nota de infraestructura: el plan Cloudflare D1 Free tiene límites diarios de filas leídas/escritas que desde 2026-09-01 causan errores al superarse; diseñar cola durable dentro de cuotas y sin comprometer operaciones financieras. Fuente https://developers.cloudflare.com/changelog/post/2026-09-01-d1-free-tier-limit-enforcement/ .

### 2026-11-09 UTC — infraestructura Cloudflare: descubrimiento solo lectura

- Cuenta Cloudflare vinculada a este chat: whoami OK; GET /accounts OK (una cuenta estándar). No se revelaron claves ni se crearon recursos.
- Lectura de D1 GET /accounts/{account_id}/d1/database: HTTP **401**, sin permiso/credencial de producto suficiente. Lectura de Workers GET /accounts/{account_id}/workers/scripts: HTTP **403**. **NO** afirmar que no existen bases ni workers: simplemente no se pudieron listar.
- **Bloqueo adicional Fase D:** para diseñar/deployar D1 o Workers debe habilitarse una conexión con permisos mínimos explícitos y confirmar cuotas gratuitas de la cuenta. No pedir tokens en el chat; usar OAuth/permiso del conector.
- Mientras tanto Render worker debe permanecer deshabilitado. La primera prioridad comercial sigue siendo la conexión DSers autorizada y su evidencia 12/12.

### 2026-11-08 — evaluación externa MCP SpotPeaks / HGR

- Hallazgo: la página suministrada `mcpservers.org/es/servers/spotpeaks-com-claude` corresponde a SpotPeaks, pero el comando `npx add-mcp 'https://mcp.hustlegotreal.com/'` corresponde a **Hustle Got Real**; dos proveedores distintos, con datos, credenciales y endpoints diferentes.
- Investigación detallada, precios, roles, fuentes oficiales, riesgos de 170 herramientas HGR y reutilización sin costo documentados en [docs/MCP-SPOTPEAKS-HGR-EVALUACION.md](MCP-SPOTPEAKS-HGR-EVALUACION.md).
- SpotPeaks: MCP de investigación principalmente de mercado **EE. UU.**, catálogo de pago; herramientas gratuitas públicas útiles, pero sus costos NO prueban margen Brasil.
- HGR: proveedor declara WooCommerce y AliExpress, operaciones de stock, precios/pedidos, y un MCP OAuth. Planes de suscripción pagados desde £29/mes. No es DSers MCP ni una conexión gratuita a la cuenta DSers. Un estudio independiente enumera ~170 tools, incluyendo cambios comerciales: **no conectar a producción sin permisos mínimos verificables**.
- Decisión ingeniería (presupuesto USD 0): **NO INSTALAR, NO CONTRATAR, NO HACER LOGIN OAUTH, NO CAMBIAR DSers/Woo**. Reutilizar procesos de research, márgenes, CAC/ROAS y monitoreo como patrones de nuestro auditor.
- No altera la prioridad P0: validación DSers real 12/12 SKU, cotizaciones Brasil, flete, margen documentado y viabilidad comercial. Si se investiga HGR, usar únicamente documentación pública y entorno aislado.

### 2026-11-08 (seguimiento V4) — puente read-only WooCommerce SKU/variantes

- Tras leer main y PRs abiertos: #13 documentación DSers, #18 auditoría de mapeo (draft), #19 autonomía (draft), #26 pagos (docs), #1 contrato (docs) siguen abiertos; #20 Mapping Guard, #28 auditor de costos, #29 smoke y #30 investigación MCP fusionados. **No solapar** con #18/#19.
- Conector DSers no disponible desde el chat: búsqueda de complementos DSers sin resultado, WordPress MCP no ofrece habilidad DSers/webhook de conexión; estado DSers LIVE sigue **NO VERIFICADO**.
- Verificación por OneMCP: WooCommerce #46 = 11 variantes y #85 = 1 variante. #62 SKU con `OnlyAccess` podría referir solo a accesorios; #58 registra una unidad de stock Woo, no proveedor. El repo y el código no tienen costos China/flete Brasil verificables.
- Rama de incremento: `feat/woo-live-variation-snapshot`; nuevo adaptador **GET** WooCommerce REST `/products/:id/variations`, endpoint protegido `GET /api/woo/products/:id/variations`, redacción y validación; tests unitarios y HTTP; sin operaciones DSers ni escrituras Woo. Alcance y límites: [docs/WOO-LIVE-VARIATIONS-READINESS.md](WOO-LIVE-VARIATIONS-READINESS.md).
- Estado final: **PR #31 FUSIONADO** commit 88c8850fc08029b87636441e83d4793467c08537, tests unitarios/HTTP y WP Sandbox PASS. API Render deploy LIVE del commit #31 comprobado (solo prueba despliegue); auth LIVE sin sesión en PR #32, 11/11 PASS. No declarar LIVE API ni Woo authenticated read PASS sin evidencia.
- Próximo paso P0 tras CI: comprobar despliegue Render y 401 público del endpoint; luego **único bloqueo principal**: acceso DSers vía canal oficial y correspondencias/costos/flete BR por 12 SKU.

### 2026-11-09 UTC — seguimiento concluido: lectura real de variantes Woo

- Baseline: `main` actualizado. PR #31 **fusionado** https://github.com/sebastisnzoth/droperagent/pull/31; squash commit `88c8850fc08029b87636441e83d4793467c08537`. Rutas incorporadas en `src/index.js` y `src/woocommerce-client.js`.
- Resultado verificado: **53 tests unitarios PASS** + HTTP auth/redaction; Core CI https://github.com/sebastisnzoth/droperagent/actions/runs/42552531847 ; WordPress/WooCommerce Sandbox CI https://github.com/sebastisnzoth/droperagent/actions/runs/42552531857 . Producto WooCommerce live OneMCP #46 con 11 variantes y #85 con 1 (12 SKU de tienda; **no** 12 asignaciones DSers).
- Deploy Render `srv-dbnui3rrjlhs739tv880` reportó **LIVE** el commit `88c8850fc08029b87636441e83d4793467c08537` a las 2026-11-09T02:46:02Z, según la cuenta conectada. Falta verificación HTTP autenticada de payload live (requeriría login admin seguro).
- PR #32 **fusionado** https://github.com/sebastisnzoth/droperagent/pull/32; squash commit `36c9a7d6c4c51020bfa02a85d906291c6271860c`. Añadió un único GET no autenticado a `scripts/live-public-smoke.mjs`. Runner externo https://github.com/sebastisnzoth/droperagent/actions/runs/42552787873 confirmó **11/11 PASS**, incluyendo GET /api/woo/products/46/variations => 401 y no-store, WooCommerce bridge, Pages y CORS. Core CI https://github.com/sebastisnzoth/droperagent/actions/runs/42552787780 PASS; WP Sandbox CI https://github.com/sebastisnzoth/droperagent/actions/runs/42552787854 PASS.
- Seguridad: endpoint protegido por login, retorna atributos/ID/SKU/precio/stock de tienda de forma redaccionada, sin escribir inventario y con `supplierMappingVerified=false`, `supplierStockVerified=false`, `supplierCostsVerified=false`, `currencyVerified=false`; no tiene acceso a DSers. No se cambiaron proveedores, pagos, precios ni productos.
- PR activos de otros propietarios al inicio: #1, #13, #18, #19, #26. **No modificar** archivos que tienen bajo su responsabilidad sin revisar diff.
- **SIGUIENTE P0 al decir “seguir”:** leer este archivo y los PR actualizados; comprobar si existe conector DSers autorizado nuevo. Si sigue ausente, avanzar con comparador read-only de snapshot Woo autenticado y evidencias DSers oficiales sin duplicar #18/#20. Necesita exportación/cuenta DSers real para declarar 12/12 MATCH. También investigar una operación de checkout/frete legal y certificaciones Brasil antes de recibir pagos. Mantener compras y pagos automáticos desactivados.
- No se ha demostrado flujo DSers LIVE, costo Brasil, Pix conciliado, persistencia durable ni COMMERCE PASS.

### 2026-11-09 UTC — investigación y primer adaptador directo sin DSers (PR en preparación)

- Solicitud: obtener APIs oficiales AliExpress, Temu, CJ, Banggood, Alibaba y opciones sin DSers, USD 0.
- Investigación oficial y riesgos en [docs/DIRECT-SUPPLIERS-WITHOUT-DSERS.md](DIRECT-SUPPLIERS-WITHOUT-DSERS.md). **CJ API 2.0** tiene catálogo, variantes, inventario, flete BR, sandbox de órdenes, puntos diarios gratuitos; **CJ MCP** también existe pero expone herramientas comerciales de escritura. **AliExpress** conserva documentación AE-Dropshipper bajo etiqueta deprecated, confirmar APIs vigentes y permisos de app antes de desarrollar; **Temu Partner API** es para tiendas/ISV de vendedores, no API buyer abierta para comprar desde WooCommerce; **Banggood** anuncia dropship API gratuita, requiere cuenta; **Alibaba.com** APIs autorizadas de sourcing/dropshipping; **EPROLO** ofrece integración WooCommerce.
- Implementación aislada: `feat/cj-direct-readonly-source`. Cliente CJ con host fijo, acceso token por env `CJ_ACCESS_TOKEN`, endpoints *solo* producto, variantes, stock y freightCalculate BR; ruta propia protegida por login y respuesta mínima. No hace ninguna compra ni activa worker. Flete y variantes CJ en USD: conversión BRL y taxes/fiscalidad **NO VERIFICADAS**.
- Estado final: **PR #34 FUSIONADO en main**, commit ecc562ab29db6fea58245fae5a21d019d78b19d4. Core CI PASS con 60 unitarias y HTTP, WordPress Sandbox PASS; Render confirmó este commit LIVE. **PR #35 FUSIONADO**, commit 29ff8ef4176beef25b035d714a553b95d3d15602, smoke externo 13/13 PASS. Esto NO es una llamada autenticada a CJ ni prueba de proveedor real. GitHub/Render no tocaron Woo ni DSers.
- Owner: nuevo módulo CJ en archivos `src/cj-readonly-client.js`, rutas `/api/sourcing/cj/*`, tests y documentos; **no** modificar el Matching Guard (#20), auditor del PR #18, permisos de PR #19 ni pagos de PR #33.
- Siguiente P0: CI unitario + HTTP + WordPress sandbox; corregir fallos, fusionar si PASS. Luego verificar 401 externa y CJ 503 sin configuración, obtener API key/token CJ por canal seguro para autenticar lecturas. No habilitar transacciones ni prometer costos reales BR.

### 2026-11-09 UTC — alternativa directa CJ sin DSers: implementación y validación

- Research y onboarding: [docs/DIRECT-SUPPLIERS-WITHOUT-DSERS.md](DIRECT-SUPPLIERS-WITHOUT-DSERS.md), basada en documentación oficial CJ/AliExpress/Temu/Banggood/Alibaba/EPROLO. AliExpress AE-Dropshipper API documental está marcada deprecated; **no usar endpoint legacy antes de aprobación y confirmación oficial**. Temu Partner API es para vendedores de Temu, **no** API abierta buyer para colocar pedidos de compras en Temu.
- PR #34 [fusionado](https://github.com/sebastisnzoth/droperagent/pull/34): commit `ecc562ab29db6fea58245fae5a21d019d78b19d4`. API `/api/sourcing/cj/*` con auth admin y cuatro operaciones explícitas *read-only*: productos, variantes, stock CJ y flete BR. CJ token backend `CJ_ACCESS_TOKEN` **NO CONFIGURADO POR ESTA EJECUCIÓN**; sin token responde 503 a consultas. Sin pedidos, transferencias ni cambios Woo. No ejecuta llamadas a CJ sin autorización. Cotizaciones y precios siguen en USD.
- Core Tests CI [run 42557179934](https://github.com/sebastisnzoth/droperagent/actions/runs/42557179934) **PASS, 60 unitarias + HTTP**; WordPress/Woo Sandbox [run 42557179933](https://github.com/sebastisnzoth/droperagent/actions/runs/42557179933) **PASS**.
- Render service `srv-dbnui3rrjlhs739tv880` deploy `dep-dbojvg68bjmc73bai3bg` **LIVE** sobre commit #34 completado 2026-11-09T03:37:08Z (antes de integrar smoke).
- PR #35 [fusionado](https://github.com/sebastisnzoth/droperagent/pull/35): commit `29ff8ef4176beef25b035d714a553b95d3d15602`. External LIVE Smoke [run 42557415551](https://github.com/sebastisnzoth/droperagent/actions/runs/42557415551): **13/13 PASS**, incluyendo 401 + no-store en GET `/api/sourcing/cj/status` y POST `/api/sourcing/cj/freight-quote` sin sesión; conexión Woo y Pages intactas. Core [42557415682](https://github.com/sebastisnzoth/droperagent/actions/runs/42557415682) PASS y WP [42557415863](https://github.com/sebastisnzoth/droperagent/actions/runs/42557415863) PASS.
- **PENDIENTE REAL:** crear/autorizar cuenta CJ, habilitar API App, generar API Key, intercambiar token por canal privado, guardar CJ_ACCESS_TOKEN en secretos Render (nunca en chat). Leer catálogo CJ y frete Brasil con la clave autorizada; validar los 12 SKU de Woo con equivalencia física y costos/FX/impuestos documentados. Obtener aprobación vigente para AliExpress Dropshipping API o usar Banggood si se desea proveedor alternativo. **COMMERCE PASS NO VERIFICADO**.
- Mantener worker de compras deshabilitado y bloqueo de pagos. CJ MCP oficial incluye herramientas de escritura; **no** habilitarlo con acceso productivo sin aislamiento de permisos.

**PROTOCOLO “SEGUIR” actualizado**: siguiente P0 es conectar **cuenta CJ oficial en modo consulta** y validar proveedor/flete BR de SKUs realmente equivalentes, sin DSers, conservando el mapeo y los checkout actuales. No confundir la API implementada con autorización/cotización obtenida.

### 2026-11-09 — Panel administrativo WordPress para APIs de proveedores (módulo 0.1.0)

- Solicitud del usuario: administrar APIs **dentro de wp-admin**, sin depender de terminal/Render para introducir la primera clave de CJ.
- Sitio auditado vía WordPress MCP: PHP 8.3.36, Sodium y OpenSSL presentes, WooCommerce y DroperAgent Bridge activos; **no se sobrescriben esos plugins ni el módulo PIX**.
- Implementación aislada: `wordpress/droperagent-api-connections/droperagent-api-connections.php`. Muestra **WooCommerce → DROPERAGENT APIs** solo a administradores, formulario CJ Key cifrada Sodium, test autorizado con POST solo a CJ authentication/getAccessToken (no orden/pago), nonce, cooldown, redacción y revocación. Otros proveedores se muestran como **pendientes**, no falsamente conectados.
- Documento técnico: [docs/WORDPRESS-API-CONNECTIONS.md](WORDPRESS-API-CONNECTIONS.md). PR nueva rama `feat/wp-api-connections-admin`; CI: WordPress/MariaDB/Woo sandbox instala el plugin, valida autoload=false, cifrado, gate de rol. **Todavía no declarar PASS hasta verificar workflow.**
- Conector WordPress.com no controla el sitio self-hosted `droperagent.cu.ma`; plugin ZIP no se puede instalar automáticamente con ese conector. Alternativa de despliegue: carga admin usando theme draft de OneMCP, con backup; requiere migración a plugin para resistir updates del tema padre.
- **LÍMITE P0:** guardar API Key CJ en WP **NO configura CJ_ACCESS_TOKEN en Render**. Antes de declarar CJ plenamente conectado hay que construir transferencia segura de servidor a servidor o autenticar Render por su propio secreto. Clave y tokens no deben salir al frontend ni a issues/repos/chats. No modificar SKUs, precios, proveedores, pagos ni activar worker.
- Próxima tarea: CI del plugin, publicar panel si seguro y verificar que wp-admin lo carga. Después, con clave CJ introducida por el titular, comprobar test real en WordPress, sin operaciones monetarias.

### 2026-11-09 UTC — panel de APIs WordPress publicado, fase B

- PR #36 **FUSIONADO**: https://github.com/sebastisnzoth/droperagent/pull/36; commit squash `aec1411aecc2376d3d6169a9d6cd7f23341f9759`. Incluye plugin independiente `wordpress/droperagent-api-connections/droperagent-api-connections.php`, documentación, protección del admin y CI.
- GitHub Actions Core PASS: https://github.com/sebastisnzoth/droperagent/actions/runs/42558898777 . WordPress + WooCommerce Sandbox PASS: https://github.com/sebastisnzoth/droperagent/actions/runs/42558898771 ; log de prueba incluye PHP syntax PASS, plugin activated en sandbox, cifrado Sodium roundtrip, autoload=false, borrado/revocación y bloqueo a no administradores. **Sin conexión a CJ real.**
- **PUBLICADO en WordPress real** `droperagent.cu.ma` mediante OneMCP theme draft: archivos `twentytwentyfive/droperagent-api-connections.php` y loader admin-only en `functions.php`. El primer intento de publish devolvió timeout del gateway, pero la lectura posterior confirmó draft vacío, archivos LIVE, loader activo; backup automático `20261109-035658-k8kw2b`. Preflight theme-draft-check PASS (wp-admin, home, post, page HTTP 200; sin errores fatales). **Ruta prevista:** `https://droperagent.cu.ma/wp-admin/admin.php?page=droperagent-api-connections` (requiere login administrador).
- UI: bajo **WooCommerce → DROPERAGENT APIs**, CJ API Key cifrada en WP DB con Sodium+salts+nonce/option no-autoload; botón guardar/test/limpiar, acceso manage_options y nonce, throttling de verificación 60 s, única llamada externa autorizada POST `authentication/getAccessToken` a CJ. Tarjetas AliExpress/Banggood/Alibaba/Temu/EPROLO solo informativas (NO integración real). **Ninguna API Key fue ingresada ni testeada**; no hay prueba de proveedor CJ real.
- Aviso técnico crítico: el módulo ahora se carga por **tema padre Twenty Twenty-Five**, por falta de instalación de plugins ZIP mediante los conectores disponibles a este WordPress self-hosted. Una actualización del tema podría sobrescribir estos archivos: **migrar a plugin propio instalado** antes de actualizar tema, verificando que no se cargue dos veces. El código fuente canónico está en GitHub.
- **El token CJ guardado en WordPress no configura automáticamente `CJ_ACCESS_TOKEN` del backend Render.** No construir endpoint público que exponga tokens. Render sigue con su propia puerta protegida, sin cuenta CJ autorizada. No activar orden, stock ni pagos.
- Estado P0 actualizado: la UI de administración WP está desplegada, pero **CJ LIVE E2E = NO VERIFICADO**. Siguiente acción: titular ingresa API Key **directamente en wp-admin** y prueba la conexión (sin enviar por chat); después verificar catálogo y flete Brasil por SKU, estudiar relay seguro con Render; no declarar 12/12 hasta evidencias.

### 2026-11-09 — siguiente API: AliExpress Open Platform en WooCommerce admin (v0.2.0)

- Solicitud: tras configurar CJ en panel WordPress, añadir AliExpress como proveedor independiente. **No leer ni revelar la clave CJ existente.**
- Se consultaron documentos oficiales de AliExpress; la app de tipo **Dropshipping** exige App Key/App Secret y autorización/permiso por categoría con posible aprobación previa. El OAuth `oauth.aliexpress.com` se encuentra en un capítulo oficial **antiguo/obsoleto**; es un flujo disponible para categorías que lo acepten, NO prueba de compatibilidad con todos los programas Dropshipping.
- Rama `feat/wp-aliexpress-oauth-credentials`: mismo plugin canónico `wordpress/droperagent-api-connections/droperagent-api-connections.php`, versión v0.2.0; guarda App Key/Secret cifrados en opciones distintas de CJ, nonce y `manage_options`, botón OAuth admin/manual con state aleatorio de 10min y callback HTTPS de un uso, intercambio server-side; revocación solo AE, nunca CJ. No realiza compras ni llamadas a API de productos. **El botón OAuth no evita aprobación AliExpress.**
- Documentación `docs/WORDPRESS-API-CONNECTIONS.md` actualizada con pasos de Open Platform, app Dropshipping, callback y advertencias. WordPress sandbox añade tests para cifrado, `autoload=false`, callback HTTPS, independencia CJ/AE y revocación.
- Estado antes de validación: **EN PR / CI NO VERIFICADO**, no aplicar en WordPress real hasta PASS y respaldo. En producción actual CJ no se modifica; no verificado si el usuario ya introdujo su clave.
- Protocolo para próxima continuación: verificar PR y CI, publicar mediante OneMCP draft con backup sin sobrescribir `functions.php`, confirmar carga del panel y mostrar la URL. Después el titular gestiona la aprobación en `console.aliexpress.com` e introduce credenciales en el formulario privado. Solo tras una respuesta real de API read-only se puede afirmar ALIEXPRESS LIVE conectado.

### 2026-11-09 UTC — AliExpress Open Platform agregado a WooCommerce API Connections (V0.2.0)

- PR #37 **FUSIONADO**: https://github.com/sebastisnzoth/droperagent/pull/37 ; commit squash `01eec9f4879e9655850e4593058b83cfa586b4cd`. Modificó únicamente plugin canónico de API Connections, workflow WordPress sandbox y documentos, sin alterar JS de compras, Woo SKUs, CJ, DSers ni Pix.
- AliExpress Open Platform investigado con documentación oficial; solicitar app categoría Dropshipping en https://console.aliexpress.com/ , App Key+App Secret y permisos aprobados. OAuth documentado oficialmente en una sección antigua/obsoleta, compatibilidad con la app Dropshipping de esta cuenta **AÚN NO VERIFICADA**.
- Plugin v0.2.0: credenciales AE cifradas Sodium y opciones no-autoload separadas de CJ. Opciones de guardar, iniciar OAuth de manera manual (state CSRF de 10 minutos y un uso, callback HTTPS, intercambio servidor-servidor sin exponer token) y revocar solo AE. Estado distingue credenciales almacenadas de permisos comerciales confirmados. No hay endpoints de adquisición, checkout, modificación de productos ni publicación automática.
- Primer CI WordPress detectó falla de callback HTTPS durante WP-CLI; **corregido antes de publicar**. CI final Core PASS https://github.com/sebastisnzoth/droperagent/actions/runs/42561940437 ; WordPress + WooCommerce Sandbox PASS https://github.com/sebastisnzoth/droperagent/actions/runs/42561940413 . Log: sintaxis PHP PASS, plugin activado y prueba `DROPERAGENT Connections CJ+AliExpress encryption, isolation, callback and roles PASS`. No se utilizaron credenciales reales.
- PUBLICACIÓN WP REAL: OneMCP theme draft actualizó exclusivamente `twentytwentyfive/droperagent-api-connections.php` y conserva loader previo `functions.php`. Preflight y postpublish wp-admin/home/post/page HTTP200 sin fatal; lectura LIVE confirmó Version 0.2.0, tarjeta `AliExpress Open Platform — Dropshipping` y CJ presente. No cambios pendientes. Backup automático `20261109-042940-3m3tuz`. Acceso administrador: https://droperagent.cu.ma/wp-admin/admin.php?page=droperagent-api-connections .
- **PENDIENTE REAL:** usuario debe crear/autorizar aplicación oficial AliExpress Dropshipping y cargar App Key/App Secret **en wp-admin, jamás en chat**. El botón OAuth se usa únicamente si el tipo de app exige y admite ese flujo; el propio portal decide aprobación. Sin respuesta real de API de sourcing, `ALIEXPRESS LIVE = NO VERIFICADO`. Los secretos WP no se exportan a Render.
- **PERSISTENCIA:** el panel se ejecuta mediante archivo del tema padre Twenty Twenty-Five. Debe migrarse a plugin independiente antes de actualizar tema y asegurarse de no cargar dos veces. Repo mantiene código canónico. No prometer que las customizaciones sobrevivan a actualizaciones de tema.
- Próxima orden “seguir”: leer este documento y verificar estado desde sistemas autorizados sin extraer secretos, probar con una app AE aprobada la disponibilidad real de APIs de solo lectura y flete Brasil; no automatizar órdenes o pagos, no modificar CJ o Woo variantes. En paralelo, si AliExpress está pendiente de aprobación, avanzar integración de Banggood siguiendo API oficial sin replicar credenciales ni controles de pagos.

### 2026-11-09 — Banggood: siguiente proveedor en WordPress (v0.3.0)

- Usuario pidió “seguir en otro” luego de AliExpress; siguiente API priorizada según Master: **Banggood**, conservando CJ y AE.
- Banggood oficial verificó programa Dropshipping sin membresía y API de socio gratuita; Open Platform indica registro, solicitud de socio y expedición de **App ID y App Secret**. Documentos oficiales: https://api.banggood.com/index.php?com=account&t=login y https://www.banggood.com/index.php?com=dropshipcenter&t=Login . **NO** asumir API comercial habilitada por registrarse; pendiente aprobación y permisos.
- Rama aislada \`feat/wp-banggood-credentials\`, plugin canónico v0.3.0: nueva tarjeta Banggood en WooCommerce → DROPERAGENT APIs, dos credenciales cifradas Sodium, nonce, no-autoload, operaciones guardar/revocar con admin \`manage_options\` + nonce. Ninguna llamada Banggood ni funcionalidades de compra. CJ y AE preservados con namespaces propios.
- CI WordPress sandbox suma pruebas de cifrado, redacción, revocación y aislamiento; no hay credenciales reales en el repositorio. Documentación [WORDPRESS-API-CONNECTIONS.md](WORDPRESS-API-CONNECTIONS.md) actualizada.
- Estado final: **PR #38 FUSIONADO**, commit `e6f1b588748952f2f9744f5896a868d5ffb086c1`; Core y WordPress Sandbox PASS. WP real v0.3.0 publicado y verificado (archivo LIVE y 3 tarjetas CJ/AE/Banggood); backup `20261109-045658-u3pye6`. No se han realizado llamadas a la API Banggood ni operaciones monetarias.
- Próximo gate: permisos Banggood y App ID/Secret desde la cuenta privada. Integrar pruebas **solo lectura** tras confirmar documentación de endpoint de Dropship, dominio/IP y país Brasil. No reusar API de afiliados ni crear órdenes.

### 2026-11-09 UTC — Banggood API Connections v0.3.0 desplegado

- PR #38 **FUSIONADO**: https://github.com/sebastisnzoth/droperagent/pull/38 ; squash SHA `e6f1b588748952f2f9744f5896a868d5ffb086c1`. Archivos: plugin API Connections, workflow WordPress sandbox y dos documentos. Sin cambios Pix, pedidos, productos, SKU, datos CJ/AE o DSers.
- Core CI PASS: https://github.com/sebastisnzoth/droperagent/actions/runs/42564319700 . WordPress/WooCommerce Sandbox PASS: https://github.com/sebastisnzoth/droperagent/actions/runs/42564319798 . Log: `DROPERAGENT Connections CJ+AliExpress+Banggood encryption, isolation, callback and roles PASS`; PHP syntax OK. Sin claves reales ni llamadas Banggood.
- PUBLICADO en `droperagent.cu.ma` mediante OneMCP theme draft; actualizado solo `twentytwentyfive/droperagent-api-connections.php`, loader intacto. Preflight wp-admin/home/post/page HTTP200. El publish devolvió timeout miniOrange; **no se reintentó a ciegas**. Lectura posterior: draft vacío, archivo LIVE v0.3.0, tarjetas Banggood línea 422, CJ línea 371, AliExpress línea 389. Backup `20261109-045658-u3pye6`.
- Panel: https://droperagent.cu.ma/wp-admin/admin.php?page=droperagent-api-connections . Banggood App ID/Secret cifrados en opciones no-autoload distintas, admin+nonce, guardar/revocar. Sin test remoto hasta validar especificación oficial y autorización. **BANGGOOD API LIVE = NO VERIFICADO**; no se comprobó App ID/Secret ni aprobación. Se conservaron secciones CJ/AE sin leer secretos.
- Alta Banggood: https://www.banggood.com/index.php?com=dropshipcenter&t=Login y https://api.banggood.com/index.php?com=account&t=login . Open Platform describe registro, aprobación socio y App ID/Secret; API gratuita para dropshippers según sitio, sujeta a permisos. Confirmar entrega Brasil, costos, impuestos y stock por SKU.
- Riesgo: módulo cargado mediante tema padre Twenty Twenty-Five; migrar a plugin independiente antes de actualizar tema sin doble carga. Secretos WP no se transfieren a Render.
- Próximo P0 al decir “seguir”: leer MASTER desde main; verificar si Banggood autorizó la cuenta y entregó esquema oficial de API dropship. Solo después implementar endpoint de lectura y prueba de flete Brasil. Si sigue bloqueado, continuar siguiente opción (Alibaba.com/EPROLO). Sin compras, pagos o modificación de WooCommerce.

### 2026-11-09 UTC — Banggood: cuenta de comprador vs aprobación API

- Hallazgo oficial (https://api.banggood.com/index.php?article_id=3&com=document): cuenta de cliente por sí sola NO genera App ID/App Secret. Flujo documentado: cuenta Banggood → solicitud de socio Dropshipping (con nota 'Banggood Open Platform') → aprobación → login `https://api.banggood.com/` → Manager Center / Dropship → verificación de dominio → emisión de App ID/App Secret.
- Guía oficial del portal fechada 2016-09-30 indica que **solo niveles VIP/Advanced/VVIP** podían usar la API y que se deshabilita tras tres meses sin pedidos; vigencia 2026 NO CONFIRMADA. El hecho de que Banggood anuncie API sin cuota fija no demuestra disponibilidad para cuentas nuevas. No promover compras artificiales, upgrade pago ni consumo no autorizado para desbloquear.
- URL de administración de aplicación documentada por herramientas externas: https://api.banggood.com/index.php?com=account&t=appInfo&type=dropship . Sin sesión redirige a login; no se conoce el estado interno de la cuenta.
- Página oficial de alta de socio: https://www.banggood.com/index.php?com=account&t=joinDropship . En solicitud indicar Shop URL `https://droperagent.cu.ma/` y nota `Banggood Open Platform`.
- Revisión limitada de los correos Banggood visibles en Gmail conectado, últimos 30 días: bienvenida/verificación de cuenta, sin correo de aprobación de Dropshipping/Open Platform detectado. Eso no prueba que la solicitud nunca se haya realizado ni que otro email no tenga la respuesta.
- Contacto oficial para confirmar permisos sin gastos: `openplatform@banggood.com`. Preguntar si el programa continúa admitiendo nivel inicial/CPF, si debe aprobarse la tienda y cómo generar el archivo de verificación del dominio. NO solicitar ni compartir clave/password en el chat.
- Estado actual: **BANGGOOD API NO AUTORIZADA/NO VERIFICADA**. Panel WordPress v0.3.0 se mantiene listo para credenciales, sin operación de compra ni pago. Próximo paso: autorización Dropship y dominio, o seguir con otra API oficial si el nivel VIP está bloqueado.

### 2026-11-09 — Banggood Open Platform login: no permite ingresar

- El titular informa que no puede iniciar sesión en `https://api.banggood.com/index.php?com=account&t=login`; **no existe prueba de que Banggood haya concedido acceso a Open Platform**. No confundir cuenta común, solicitud Dropshipping y autorización de API.
- Comprobación pública de `https://api.banggood.com/` confirmó que existe formulario `Login with your banggood account` con usuario, contraseña, código de verificación de imagen y `Enter to Manager Center`; no se efectuó autenticación ni se obtuvieron credenciales. El enlace profundo al login se comporta mediante redirección/carga del portal, no se verificó sesión.
- Recorrido alternativo: iniciar sesión en `https://www.banggood.com/login.html?from_api=1`, comprobar Dropship Dashboard `https://www.banggood.com/index.php?com=dropshipcenter&t=dashboard`, luego iniciar sesión desde `https://api.banggood.com/` y completar captcha. Si login social no establece contraseña reutilizable, usar recuperación oficial. Probar navegador privado/cookies normales sin extensiones que bloqueen captcha.
- Guía oficial API publicada en 2016: cuenta Banggood → solicitud y aprobación partner Dropship → verificar dominio → App ID/Secret; cita niveles VIP/Advanced/VVIP (vigencia 2026 **no verificada**). Fuentes: https://api.banggood.com/index.php?article_id=3&com=document ; https://api.banggood.com/ .
- Si cuenta Banggood normal funciona pero Open Platform no, pedir diagnóstico y aprobación manual escribiendo a `openplatform@banggood.com`. No sugerir pagos, upgrades, solicitudes repetidas o compartir contraseñas en el chat.
- Estado P0: **BANGGOOD LIVE BLOQUEADO POR ACCESO/APROBACIÓN**; panel WooCommerce v0.3.0 ya está preparado para App ID/Secret, sin probar API, compras o pagos. Próxima continuación: interpretar mensaje exacto o captura de error del login y seguir con aprobación oficial; si bloqueo persiste, priorizar Alibaba.com/EPROLO u otro proveedor sin superposición.

### 2026-11-09 — Auditoría SKU y frete Brasil sobre API WordPress existente (PR en curso)

- Nuevo objetivo del titular: abandonar trabajos sobre APIs externas pendientes y **trabajar solo en la integración WordPress/WooCommerce + OneMCP existente**: verificar 12 SKU, precios, stock, shipping Brasil y preparar futura conexión de proveedores autorizados sin solapar PR.
- Verificación directa con OneMCP: producto variable #46 tiene **11 variantes Woo** (precios R$6,44–43,98, stock registrado por variante), #85 tiene **1 variante** (R$19,21, stock Woo 847). No hay SKU vacío o duplicado entre estos 12. El padre #46 informa stock total 846, la suma observada de sus variaciones. #58 `068-Knight` registra 1; #62 `OnlyAccess` registra 234 con precio R$6,44 y podría ser solo accesorios; #68 `NoAccessories` requiere confirmar contenido. Datos no prueban proveedor ni costo.
- Ambos productos están publicados con campos de peso y 3 dimensiones vacíos; WooCommerce configurado en BRL, shipping enabled pero zona default id=0 **sin métodos**, no hay zona Brasil explícita. Easy PIX aparece enabled y WooCommerce tax.enabled=false; no se ha verificado homologación técnica ni fiscalidad. Plugins activos de CEP/simulador no constituyen proveedor de tarifas; no activar shipping gratis/tarifa inventada.
- Contrato y tabla SKU/stock/precios: [docs/WOO-BR-CATALOG-FREIGHT-AUDIT-2026-11-09.md](WOO-BR-CATALOG-FREIGHT-AUDIT-2026-11-09.md). Documentación oficial WooShipping Zones: https://woocommerce.com/document/setting-up-shipping-zones/
- Incremento aislado `feat/wp-commerce-readiness-audit`: módulo de diagnóstico admin **solo lectura** en archivo canónico ya instalado `wordpress/droperagent-api-connections/droperagent-api-connections.php` (v0.4.0), con WooCommerce `wc_get_products`, variaciones, auditoría de tamaños/stock, métodos shipping Brasil y enlaces al ajuste nativo. Sin escritura de WooCommerce, sin clave de proveedor, sin modificación de cobros, precios, SKUs, inventario o permisos. CI sandbox valida un producto variable descartable y ausencia de escrituras.
- Estado inicial: **EN PR / PENDIENTE CI Y PUBLICACIÓN**; no afirmar frete Brasil operativo. Siguiente gate: CI Core + WordPress Sandbox PASS, revisión diff y publicación OneMCP mediante theme draft, backup y verificación LIVE; luego conseguir peso/medidas, origen real y cotización válida antes de agregar cualquier método de envío comercial.

### 2026-11-09 — cierre verificable del PR #39: auditoría Woo 12 SKU y bloqueo de flete Brasil

- PR #39 **FUSIONADO**: https://github.com/sebastisnzoth/droperagent/pull/39, squash commit `2194370ba414647fef09dfd5f330e1771b6ea59c`. Core PASS https://github.com/sebastisnzoth/droperagent/actions/runs/42570579770 y WordPress/Woo Sandbox PASS https://github.com/sebastisnzoth/droperagent/actions/runs/42570579779. Log confirma `DROPERAGENT catalog + Brazil shipping readiness read-only audit PASS`, PHP sintaxis y auditoría de low stock/accesorios/medidas sin escribir stock.
- PUBLICADO en WordPress real `droperagent.cu.ma`: versión 0.4.0 del archivo `twentytwentyfive/droperagent-api-connections.php`, mismo plugin/panel, sin instalar nuevos plugins ni modificar el loader, Pix, precios, pedidos, stock o checkout. Preflight theme check wp-admin/home/post/page HTTP200 sin errores. Publish dio timeout miniOrange, pero lectura posterior verificó que el archivo LIVE coincidía **exactamente** con GitHub main y que la tarjeta `Auditoria WooCommerce — SKU, preço, estoque e frete Brasil` estaba activa. Respaldo automático `20261109-060409-uf3fgo`. El borrador pendiente era idéntico al LIVE y se descartó sin afectar el sitio; estado de draft final 0.
- Confirmación posterior: OneMCP #46=11 variantes SKU únicos, stock Woo total=846; #85=1 variante SKU único, stock Woo=847; stock crítico variante #58=1; contenido a verificar en variantes #62 OnlyAccess y #68 NoAccessories. Todas son cifras de tienda, **no proveedor**. Moneda BRL.
- SHIPPING P0 **AÚN BLOQUEADO**: `shipping.enabled=true`, zona default id=0 con **0 métodos** y sin zona BR explícita. Peso/dimensiones faltantes en los productos originales. No se pudo declarar frete a Brasil funcional porque no hay tarifas reales, origen de envío ni costo importación verificado. No se creó `frete grátis` ni tarifa ficticia. Ruta nativa: `https://droperagent.cu.ma/wp-admin/admin.php?page=wc-settings&tab=shipping`. Próximos requisitos: origen real, pesos y medidas por SKU, proveedor/frete cotizado BRL, impuestos/FX y pruebas de checkout sandbox antes de activar un método.
- TAX: OneMCP entregó inicialmente `tax.enabled=false` y luego **dos lecturas consecutivas `tax.enabled=true`** durante este mismo turno. Origen de la diferencia desconocido; el PR solo lee `wc_tax_enabled()` y no modifica opciones. El panel mostrará siempre el estado actual. No tocar impuestos sin validación profesional.
- La UI ahora presenta resumen de WooCommerce y tabla de variantes en administrador, con alertas de inventario bajo, contenido accesorios y falta de peso/dimensiones; `checkout_ready=false`, `supplier_costs_verified=false`, `crossborder_freight_verified=false`, aunque WooCommerce pueda tener métodos. Solo lectura, sin automatizar pagos, compras o asignación de proveedores.
- **Prioridad actual por pedido del titular:** seguir exclusivamente el flujo WooCommerce + OneMCP existente para resolver tarifas Brasil con evidencia real, rentabilidad SKU 12/12 y preparación de proveedores que él autorice. No reanudar investigaciones sobre otras APIs pendientes como condición de este flujo.

### 2026-11-09 — Cuaderno de costos BRL por SKU en panel existente (v0.5.0)

- Pedido: trabajar de forma autónoma hasta resolver la operativa WooCommerce/OneMCP. Estado confirmado: 12 variantes de tienda sin evidencia de proveedor o flete, zona shipping default sin método, pesos/medidas ausentes, PIX estático habilitado sin confirmación de fondos demostrada. Mantener COMMERCE NO READY hasta evidencia, no inventar tarifas ni comprar.
- Incremento aislado `feat/wp-sku-cost-evidence-ledger`: mismo archivo canónico `wordpress/droperagent-api-connections/droperagent-api-connections.php`, administrador WooCommerce → DROPERAGENT APIs v0.5.0. Tabla SKU/precio BRL y formulario manual por variante para registrar proveedor, producto, frete BR para **un CEP**, impuestos, comisiones, extras, origen, fecha y enlace fuente HTTPS. Calcula costo total y margen bruto estimado; muestra margen negativo, vencimiento de 14 días y variación de precio/SKU. No autoload, opciones propias (`droper_quote_brl_v1_<id>`), nonce y `manage_options`, sin escritura Woo comercial.
- Contrato y advertencias en [docs/BRL-SKU-COST-EVIDENCE-LEDGER.md](BRL-SKU-COST-EVIDENCE-LEDGER.md). Las evidencias provistas por usuario siguen `supplier_verified=false`, `shipping_verified=false`, `taxes_verified=false`, `sell_authorized=false`; jamás habilitan tarifas, compras o pagos automáticamente.
- CI Woo Sandbox extendida para comprobar parseo centavos, importes negativos, precio cambiado, SKU hash, caducidad, margen en pérdida y no autoload, sin API externa. No editar PRs de DSers, autonomía o Pix pendientes.
- Estado final: **PR #40 FUSIONADO** y WordPress 0.5.0 LIVE verificado; Core y WP Sandbox PASS. Backup `20261109-161801-nldyln`. La captura de cotizaciones no habilita compras.

### 2026-11-09 — Guard de checkout WooCommerce físico sin tarifas verificadas (PR en curso)

- Revisión oficial WooCommerce 11.2.2: `woocommerce_store_api_cart_errors` soporta validaciones en Store API/Checkout Blocks, y `woocommerce_check_cart_items` + `woocommerce_after_checkout_validation` cubren clásico. No confundir con protección del endpoint administrativo `wc/v3/orders`. Referencia: https://woocommerce.github.io/code-reference/files/woocommerce-src-storeapi-utilities-cartcontroller.html .
- Motivo: WooCommerce físico sin ningún método de shipping y sin proveedor ni costo acreditados, pero Easy PIX aparece habilitado. Un método de envío agregado accidentalmente no debe habilitar pedidos de importación sin margen y cumplimiento verificados.
- Incremento aislado `feat/wp-checkout-verification-gate`: archivo auxiliar `wordpress/droperagent-api-connections/droperagent-checkout-gate.php`; integración **sin nuevo plugin**, cargada públicamente desde un loader mínimo nuevo de `functions.php` cuando el código pase CI. `is_approved()` fijo false por defecto, bloquea checkout si carrito contiene producto físico, no si virtual/empty; mensaje de envío pendiente en portugués. No modifica gateway Pix ni productos/stock/pedidos; no permite introducir valores de shipping ficticios.
- Documentación [docs/WOOCOMMERCE-CHECKOUT-SAFETY-GATE.md](WOOCOMMERCE-CHECKOUT-SAFETY-GATE.md) y pruebas WordPress sandbox con carrito físico y virtual, `WP_Error` y hooks. Operativa live de checkout con dinero real **NO VERIFICADA**; no se ejecutan pagos.
- Estado final: **PR #41 FUSIONADO**, tests Core y WordPress Sandbox PASS; módulo checkout guard activo en archivo `droperagent-checkout-gate.php` cargado públicamente por `functions.php`. Preflight y respaldo `20261109-162530-yh5tll`. Release fijo `false` hasta verificación comercial externa.
- Requisito para liberar ventas: proveedores y SKU 12/12, costos, impuestos, flete real Brasil, métodos Woo/CEP, pagos entrantes conciliados y conformidad legal (incl. ANATEL si aplica). Hasta entonces COMMERCE PASS NO.

### 2026-11-09 UTC — cierre de seguridad P0: evidencia SKU y bloqueo de checkout

- **PR #40 MERGED**: https://github.com/sebastisnzoth/droperagent/pull/40, commit `b7652afa996af85c8900bf39c4067cbd36855a21`. Core CI https://github.com/sebastisnzoth/droperagent/actions/runs/42652904989 **PASS** y WordPress Sandbox https://github.com/sebastisnzoth/droperagent/actions/runs/42652904965 **PASS**; test explícito de parseo BRL, margen negativo, vencimiento, cambio SKU/price, no-autoload y eliminación. WordPress real v0.5.0 publicado. miniOrange reportó timeout, pero comparación LIVE/GitHub exacta, archivo con formulario de cotización y borrador vacío; backup `20261109-161801-nldyln`.
- **PR #41 MERGED**: https://github.com/sebastisnzoth/droperagent/pull/41, commit `fd27547a24e17ec01cede55346cbf6a15d2a0c7b`. Core CI https://github.com/sebastisnzoth/droperagent/actions/runs/42654066198 **PASS** y WordPress Sandbox https://github.com/sebastisnzoth/droperagent/actions/runs/42654066058 **PASS**; PHP validado y el test certifica módulo `DroperAgent_Checkout_Gate` para clásico y Woo Blocks, bloqueo de carrito físico mediante `WP_Error`, carrito virtual no bloqueado. Sin transacciones, sin pedidos de prueba reales.
- Publicación WP de guard: archivo nuevo `twentytwentyfive/droperagent-checkout-gate.php` y loader público añadido al final de `functions.php`, **sin alterar loader admin del panel v0.5**. Preflight draft check wp-admin/home/post/page HTTP200 sin error fatal; miniOrange devolvió timeout a publish, pero lectura posterior confirmó archivo LIVE idéntico al código de `main`, loader LIVE presente, draft 0 y backup automático `20261109-162530-yh5tll`. Guard `is_approved()=false` hasta evidencia comercial verificable. Ninguna tarifa ni orden/pago se configuró.
- Verificación final OneMCP: BRL y `tax.enabled=true`, shipping enabled con zona 0 sin métodos (0), PIX Easy Integration activo, DroperAgent Bridge 0.2.1 activo y DroperAgent PIX Ledger 0.1.0 activo. No se alteraron producto, stock, gateway o envío. WordPress debug log no configurado; no afirmar ausencia de errores mediante logs. Preflight administracion, home y contenido HTTP200 sí verificado.
- **Limitación de guard:** interviene validación de carrito/checkout clásico y Store API, no detiene creación administrativa de pedidos por REST `wc/v3/orders`, no reemplaza conciliación PIX o autorizaciones de proveedores. Conexiones de escritura en WooCommerce deben mantener permisos mínimos. No se afirma E2E real porque no se ejecutó un pago ni cotización auténtica.
- **Bloqueos que no se pueden sustituir con código:** SKU proveedor verificados 12/12, precio/costo BRL por unidad, fuente/fecha, método/envío a CEP Brasil, pesos/medidas, impuestos/importación, ANATEL si aplica y confirmación bancaria de PIX. No inventar tarifas ni pagos; checkout físico seguirá suspendido deliberadamente. Revisión humana de documentación y autorización explícita antes de liberar guard.
- Próxima tarea verificable cuando haya evidencia: completar 12 filas en WooCommerce → DROPERAGENT APIs, comprobar márgenes reales y cotización por dirección/cantidad, configurar zona/método BR sobre flete documentado, tests de compra sin dinero, aprobar PR independiente para checkout, nunca liberar el guard por cotización meramente declarada.

### 2026-11-09 — P0: pagos de pedidos existentes sin pasar por carrito (fix PR en progreso)

- Por la orden V5 del usuario se recuperó el Master desde `main`, se examinaron PR abiertos #1 #13 #18 #19 #26 #33 sin superponerse y se consultó WooCommerce LIVE: BRL, impuestos habilitados, envío habilitado pero zona default sin métodos; Easy PIX activo. Panel OneMCP/Bridge y guard actual publicados; no se asumió autenticación de proveedores.
- Riesgo P0 observado en documentación oficial WooCommerce: pedidos ya creados se pueden pagar vía `WC_Form_Handler::pay_action` (/checkout/order-pay/{id}) o Store API `POST /wc/store/v1/checkout/{id}`. El guard del PR #41 solo clasificaba el carrito; un pedido existente puede no depender del carrito actual.
- Rama `fix/wp-existing-order-payment-guard` extiende el módulo **ya instalado** `wordpress/droperagent-api-connections/droperagent-checkout-gate.php`: revisa líneas de pedidos físicos/virtuales (bloquea productos desconocidos), deshabilita pasarelas en carrito físico/order-pay, intercepta `woocommerce_before_pay_action` antes de pago legado y `woocommerce_store_api_checkout_order_processed` antes de pago en Store API (403). No modifica plugin PIX ni órdenes, no cobra ni publica nuevas tarifas.
- CI WordPress sandbox extendida con pedidos ficticios físicos y virtuales; **Core + Woo Sandbox PASS**. **PR #42 FUSIONADO y FIX PUBLICADO**, ver checkpoint siguiente. Guía [docs/WOO-EXISTING-ORDER-PAYMENT-GATE.md](WOO-EXISTING-ORDER-PAYMENT-GATE.md).
- Fuente oficial: https://developer.woocommerce.com/docs/apis/store-api/resources-endpoints/checkout-order y https://woocommerce.github.io/code-reference/files/woocommerce-includes-class-wc-form-handler.html .
- Render API no pudo auditarse con el conector: informó que debe seleccionarse un workspace y exige confirmación explícita del usuario; no elegirlo automáticamente. Las URLs públicas también dieron error en el navegador de búsqueda externo, por lo que no se puede declarar una prueba de salud E2E a partir de ello. WordPress sí se consultó mediante OneMCP autenticado.
- Se mantienen bloqueos externos: proveedor/costos y stock 12/12, pesos, flete cotizado por CEP, fiscalidad/homologación, confirmación bancaria PIX y autorización de venta. `COMMERCE PASS` sigue NO VERIFICADO.

### 2026-11-09 UTC — P0 PR #42 fusionado y desplegado: pagos de pedidos existentes bloqueados

- PR #42 **FUSIONADO**: https://github.com/sebastisnzoth/droperagent/pull/42; squash SHA `4544d20b979456b939037564e53ce6a874e3b72a`. Rama `fix/wp-existing-order-payment-guard`. Modificó guard PHP existente, test WordPress Sandbox y documentación, sin modificar plugins de pago, productos, stock, tarifas o pedidos.
- CI Core **PASS** https://github.com/sebastisnzoth/droperagent/actions/runs/42657810804 y WordPress + Woo Sandbox **PASS** https://github.com/sebastisnzoth/droperagent/actions/runs/42657810839; log de job WordPress muestra PHP lint PASS y `DROPERAGENT pay-for-order and Store API existing-order payment guards PASS`. Testeados pedidos ficticios WC_Order físicos/virtuales, ocultación de pasarelas para carrito físico y excepción Store API antes de pago. **No hubo pagos reales**.
- OneMCP publicando WordPress: se actualizó exclusivamente `twentytwentyfive/droperagent-checkout-gate.php`; `functions.php` loader anterior conservado, sin cambios de checkout visual. Preflight `theme-draft-check` con wp-admin/home/post/page HTTP 200, sin warnings/fatales. El comando publish devolvió timeout miniOrange pero la lectura posterior confirmó fuente LIVE exactamente igual al GitHub `main`, hooks `woocommerce_before_pay_action` presentes, loader LIVE activo, draft 0 y backup `20261109-164720-0zxccq`. No se repitió publish a ciegas.
- Protección que ahora cubre: carrito clásico + Store API carrito, checkout clásico y Checkout Blocks; pago de pedido pendiente clásico `/checkout/order-pay/{id}` por `woocommerce_before_pay_action` y listado de pasarelas; pago Store API existente `POST /wc/store/v1/checkout/{id}` con `woocommerce_store_api_checkout_order_processed` antes de procesar pago. Productos virtuales no afectados. Productos eliminados de líneas de pedido se consideran inseguros.
- **Límites remanentes importantes**: creación de pedido vía REST administrativo wc/v3/orders u otras integraciones con credenciales de escritura no queda bloqueada; controlar permisos, worker de compra apagado y revisión humana. No se ejecutó transacción E2E real, por lo que no afirmar que no existen otras rutas personalizadas de pago de terceros. La instalación actual depende de archivos de tema padre Twenty Twenty-Five y puede perderse si se actualiza; migración a plugin independiente requiere capacidad de instalar plugin WP en host, no disponible en el flujo OneMCP theme-only actual.
- **Estado tras V5**: arquitectura de seguridad de checkout fortalecida, pero `COMMERCE PASS = NO VERIFICADO` por proveedor y stock 12/12 sin prueba real, costos BRL/margen sin evidencia, sin peso/dimensiones, shipping BR sin tarifa/cobertura real, cumplimiento impuestos/ANATEL y conciliación PIX no validada. Para lanzar, obtener documentación real y autorización explícita; no inventar datos ni desactivar el guard.
- Frontend Pages y API Render no pudieron verificarse desde el navegador de búsqueda externo de esta ejecución; Render plugin requiere seleccionar workspace con confirmación del usuario antes de consultar servicios, no se seleccionó ninguno automáticamente. WordPress pudo verificarse mediante OneMCP directo. Estas verificaciones se registran como **DESCONOCIDO**, no error ni PASS.
