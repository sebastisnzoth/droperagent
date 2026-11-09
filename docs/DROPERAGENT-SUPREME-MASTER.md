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

### Fase B — Evidencia DSers/WooCommerce [PENDIENTE]
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
- [x] Contrato de cotizaciones, tests y endpoint read-only en main (CI sandbox PASS; despliegue LIVE separado y aún por comprobar).
- [ ] DSers conectado / mapping real verificado para 12 SKU.
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
- Próximo paso P0: confirmar CI del head actual; revisar diff y fusionar solo si CI verde, sin activar worker ni tocar clientes. Después obtener evidencia DSers autorizada para 12/12 SKU, revisar cotizaciones y frete Brasil.

**Nunca borrar entradas anteriores sin justificar la corrección.** Los cambios de estado necesitan evidencia GitHub o del sistema fuente; un checklist marcado manualmente no constituye PASS.

### 2026-11-09 UTC — checkpoint posterior a PR #28
- PR #28 fusionado mediante squash (commit 76ebc412369e510db5c43a40dc6a54052dc8729b); main contiene el maestro, contrato, auditor, endpoint autenticado y pruebas.
- Core Tests CI PASS, 48 unitarias y pruebas adicionales de seguridad HTTP; WP/Woo sandbox PASS. No se realizaron operaciones monetarias ni cambios en WooCommerce.
- Siguiente P0: confirmar despliegue de Render y conducta no autenticada de la nueva ruta; después conexión DSers autorizada y evidencia 12/12. No marcar COMMERCE PASS.
