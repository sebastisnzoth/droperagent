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
