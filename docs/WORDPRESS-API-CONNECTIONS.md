# DROPERAGENT — Painel WordPress para APIs de fornecedores

**Estado:** módulo v0.1.0 independente da loja, no diretório `wordpress/droperagent-api-connections/`. Implementação isolada dos PRs PIX/DSers. **Nenhuma chave real é armazenada no repositório.**

## Objetivo

Adicionar menu **WooCommerce → DROPERAGENT APIs** (ou URL de admin `/wp-admin/admin.php?page=droperagent-api-connections`) para administrar as credenciais de CJdropshipping dentro de WordPress e informar quais outros fornecedores aguardam autorização.

O módulo é um plugin WordPress independente, compatível com PHP 8.1+. Em instalações que não permitem upload de plugin pelo conector, pode ser **incluído temporariamente pelo tema** sem modificar os plugins existentes; isso não é durável contra atualizações do tema e exige migração posterior ao plugin independente.

## Recursos operacionais

- Só usuários com `manage_options` podem ver o painel e enviar formulários.
- Submenu WordPress protegido; operações `admin_post` verificam nonce contra CSRF.
- **CJ API Key**: campo password, máximo 200 caracteres (conforme documentação oficial).
- Guardar: usa **Sodium Secretbox** com nonce aleatório e chave derivada dos salts do WordPress; opções `droper_api_cj_key`, `access` e `refresh` ficam criptografadas e `autoload=false`. Se Sodium não estiver disponível, **não grava**.
- Teste manual autorizado: servidor WordPress chama exclusivamente `POST https://developers.cjdropshipping.com/api2.0/v1/authentication/getAccessToken` com SSL e limite 12 s; nunca entrega chave nem token ao navegador, nem loga body remoto. Impõe 60 s entre tentativas.
- Se CJ devolver autenticação válida, os tokens são cifrados e o painel mostra última verificação e estado; não confundir teste de autenticação com permissão de pedidos ou produtos corretos.
- Remover: apaga chave, tokens, histórico de verificação e cooldown locais.
- Cartões informativos: AliExpress, Banggood, Alibaba.com, Temu Partner API e EPROLO. **Não** capturam chaves ainda porque seus fluxos e permissões específicos não foram implementados.
- **Sem ações financeiras ou comerciais**: não cria pedidos CJ, não modifica WooCommerce, não atualiza stock/preços/SKUs, não realiza Pix/split ou mensagens.

## Limite arquitetural que NÃO deve ser escondido

A configuração salva no **servidor WordPress** não sincroniza automaticamente o token `CJ_ACCESS_TOKEN` exigido pela API DROPERAGENT em **Render**. São dois ambientes isolados. Para conectá-los será preciso um fluxo de delegação servidor-servidor autenticado com rotação de credenciais e auditoria **sem expor segredos em GitHub Pages, plugins MCP ou navegador**. Não pedir ao usuário para compartilhar API Key em chat nem criar endpoint público para copiá-la.

Acesso CJ verificado no painel WordPress **não equivale** a produtos CJ conferidos, fornecedores/variantes 12/12 mapeados ou frete Brasil comprovado.

## Fonte oficial de CJ

- Obter a chave: https://developers.cjdropshipping.com/en/api/start/apikey.html
- Troca por tokens: https://developers.cjdropshipping.com/en/api/api2/api/auth.html
- Vida útil de token CJ: até 180 dias segundo documentação; verificar última autorização e validade.

## Validação

- Sintaxe PHP com `php -l`.
- `.github/workflows/wordpress-ci.yml`: ambiente descartável WordPress + MariaDB + WooCommerce, instalação do plugin, Roundtrip Sodium, `autoload=false`, revogação de opções, gate de privilégios de administrador. Nenhuma chamada externa CJ durante CI.
- Publicação em WordPress real deve usar o sistema de *theme draft* com backup e revisão caso seja necessário o carregamento via tema; nunca sobrescrever Easy Pix, PIX Ledger, DSers Mapping Guard ou os temas.
- Após publicação: verificar HTTPS, admin WooCommerce → DROPERAGENT APIs e o comportamento sem chave; as operações CJ permanecem desativadas até autorização do titular.
- Não armazenar prints de chaves no repo, issues ou conversas.

## Próximos passos

1. Publicar módulo com testes, confirmar admin UI.
2. Cadastrar uma chave CJ válida **diretamente no formulário WordPress**, não em chat.
3. Testar autorização pela UI e comprovar rede do host para CJ.
4. Implementar uma consulta de produtos CJ desde WordPress e uma ponte segura com Render (se útil), sem duplicar leitura ou criar orquestradores de compras.
5. Habilitar outros fornecedores só quando API oficial e permissões de cada programa forem comprovadas.

Documento maestro: [DROPERAGENT SUPREME V4](DROPERAGENT-SUPREME-MASTER.md).

## AliExpress Open Platform — credenciales y OAuth (v0.2.0)

AliExpress requiere una **aplicación oficial** creada en https://console.aliexpress.com/ y permisos específicos. Para sourcing, solicitar categoría **Dropshipping**; las credenciales de un app tipo seller, affiliate o Dropshipping no se pueden tratar como intercambiables. AliExpress puede revisar/aprobar la aplicación antes de permitir llamadas.

Se agregó una tarjeta privada **AliExpress Open Platform — Dropshipping** con:

- **App Key** y **App Secret**: ambos campos obligatorios cuando se reemplazan; almacenamiento independiente de CJ, cifrado Sodium Secretbox y `autoload=false` en las opciones `droper_api_ae_*`. Los valores nunca se muestran en la interfaz.
- **Autorizar conta AliExpress (OAuth)**: botón opcional iniciado manualmente por administrador, usando `https://oauth.aliexpress.com/authorize` (documentación oficial de flujo seller de AliExpress, publicada anteriormente), `response_type=code`, `state` aleatorio y callback HTTPS restringido a `wp-admin/admin-post.php?action=droper_api_ae_callback`.
- El callback acepta un solo uso, exige coincidencia de `state` ligado al administrador y caducidad 10 minutos. Si es válido, intercambia `code` directamente en el servidor contra `https://oauth.aliexpress.com/token` usando TLS; almacena únicamente access token cifrado y fecha de expiración sin publicar token. **No** emite consultas de productos, firma de peticiones de dropshipping ni pedidos.
- Si el programa Dropshipping aprobado usa solamente App Key y App Secret para consultas firmadas y no requiere OAuth, no pulsar el botón: la autorización concreta debe confirmarse en el portal oficial. **La compatibilidad de ese flujo OAuth antiguo con la modalidad Dropshipping de esta cuenta NO está verificada.**
- Revocar: borra solo opciones `droper_api_ae_*`, state y token AE; **no** toca la API Key CJ.
- El estado de la UI diferencia: `Não configurado`, `Credenciais salvas — autorização pendente` y `OAuth autorizado — API de dropshipping não verificada`. Incluso con token guardado, no acredita **ninguna operación live de productos**.

### Seguridad y límites

El servidor WordPress guarda la App Secret cifrada; no se sincroniza con Render y no existe exportación pública. El callback nunca acepta tokens provenientes de GET ni parámetros que activen autoorden. Una autorización de AliExpress puede permitir funciones diferentes según categorías y permisos; DROPERAGENT no obtiene derechos de compra automáticamente.

El uso completo requiere: inscripción en la Open Platform, aplicación Dropshipping aprobada, grupos de API autorizados, configuración del callback (si corresponde), confirmación de método de autenticación vigente, prueba **de lectura** de productos con respuesta real, y comparación de SKUs/flete Brasil. Hasta entonces: **ALIEXPRESS LIVE = NO VERIFICADO**.

### Fuentes oficiales y actualización

- Registro y credenciales: https://developer.alibaba.com/docs/doc.htm?articleId=120675&docType=1&treeId=727
- Alta de app Dropshipping: https://developer.alibaba.com/docs/doc.htm?articleId=120418&docType=1&treeId=762
- Proceso OAuth anterior (marcado bajo documentación obsoleta): https://developer.alibaba.com/docs/doc.htm?articleId=108969&docType=1&treeId=556
- Acuerdo de uso: https://terms.alicdn.com/legal-agreement/terms/suit_bu1_aliexpress/suit_bu1_aliexpress202201220006_10755.html

No usar enlaces ni códigos de autorización de ejemplos históricos. Ningún servicio pago ha sido contratado.
