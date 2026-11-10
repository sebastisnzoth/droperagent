# Instruções de Uso - DroperAgent

## 🚀 Primeiros Passos

### 1. Preparação do Ambiente

```bash
# Clone o repositório
git clone https://github.com/sebastisnzoth/droperagent.git
cd droperagent

# Instale as dependências
npm install
```

### 2. Configuração de Credenciais

```bash
# Copie o arquivo de exemplo
cp .env.example .env

# Edite o arquivo .env com suas credenciais
nano .env
```

### 3. Configuração WooCommerce

Vá em **WooCommerce > Configurações > Advanced > REST API** e:
1. Clique em "Adicionar chave"
2. Defina:
   - Descrição: "DroperAgent MCP"
   - Usuário: Seu usuário WordPress
   - Permissões: **Somente leitura** para pesquisa, auditoria e diagnóstico. Criar chave separada de escrita somente quando houver caso de uso autorizado, testes e escopo mínimo.
3. Copie a Consumer Key e Consumer Secret

### 4. Configuração DSers

**Atenção:** o acesso de API DSers não está confirmado para esta conta. Não suponha que todas as contas tenham uma chave API pública ou endpoint de pedidos autorizado. Siga somente a documentação oficial e os escopos realmente concedidos. Não configure chaves fictícias nem libere pedidos ou pagamentos. Consulte `docs/DSERS-SUPPLIER-EVIDENCE-CONTRACT.md`.

## 📡 API Endpoints

### Endpoints Disponíveis

| Endpoint | Método | Descrição | Exemplo |
|----------|--------|-------------|---------|
| `/` | GET | Informações da API | `curl localhost:3000` |
| `/health` | GET | Verificação de saúde | `curl localhost:3000/health` |
| `/control` | GET | Painel de controle | `curl -H "X-API-Key: YOUR_KEY" localhost:3000/control` |
| `/api/woo/products` | GET | Lista produtos | `curl localhost:3000/api/woo/products` |
| `/api/woo/orders` | GET | Lista pedidos | `curl localhost:3000/api/woo/orders?status=pending` |
| `/api/dsers/sync` | POST | Sincronizar pedido | `curl -X POST -d '{"orderId": 123}' localhost:3000/api/dsers/sync` |
| `/api/dsers/providers` | GET | Fornecedores | `curl localhost:3000/api/dsers/providers` |
| `/api/task` | POST | Executar tarefa | `curl -X POST -d '{"agent":"marketing-ai","action":"seo-analysis"}' localhost:3000/api/task` |

## 🤖 Uso dos Agentes

### Exemplo: Consulta de Produtos

```bash
# Listar produtos em estoque
curl "http://localhost:3000/api/woo/products?stock_status=in_stock&per_page=10"
```

### Exemplo: Sincronização de Pedidos

```bash
# Sincronizar pedido específico com DSers
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"orderId": 12345, "requiresApproval": true}' \
  http://localhost:3000/api/dsers/sync
```

### Exemplo: Execução de Tarefa de Agente

```bash
# Pedir ao Product Researcher que analise um produto
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"agent":"product-researcher","action":"analyze","data":{"productId": 123}}' \
  http://localhost:3000/api/task
```

## ⚠️ Fluxo de Trabalho DSers

O DSers possui limitações que requerem aprovação manual:

### Pedidos que Requerem Aprovação
1. **Colocação de Pedido**: Alguns provedores exigem aprovação
2. **Pagamento ao Fornecedor**: Deve ser feito manualmente pelo dono da conta
3. **Importação de Produtos**: Requer autorização da conta AliExpress

### Resposta de Aprovação

```json
{
  "status": "pending_approval",
  "orderId": 12345,
  "reason": "O pedido requer aprovação manual do proprietário da conta DSers",
  "action": "place_order",
  "required": true,
  "estimatedCost": 89.90
}
```

## 🔧 Comandos do Sistema

### Iniciar em Desenvolvimento

```bash
npm run dev
```

### Iniciar em Produção

```bash
npm start
```

### Testes

```bash
npm test
```

### Lint

```bash
npm run lint
```

## 📊 Métricas e Monitoramento

### Painel de Controle

Acesse: `http://localhost:3000/control`

Mostra:
- Vendas (hoje, semana, mês)
- Receita total
- Pedidos pendentes
- Produtos ativos
- Status dos agentes

### Logs

Logs são gravados automaticamente em:
- `./logs/app.log` (arquivo local)
- Console (quando NODE_ENV=development)

## 🛡️ Segurança

### Chave de API

Para endpoints protegidos, inclua a header:

```
X-API-Key: sua_chave_api
```

### Rate Limiting

- 100 requisições por minuto por IP
- 1000 requisições por hora por API Key

### Headers de Segurança

A API responde com:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Content-Security-Policy: default-src 'self'`

## 🚨 Troubleshooting

### Erro de Conexão com WooCommerce

```
Erro: Unable to connect to WooCommerce
```

Verifique:
1. URL está correta em `.env`
2. Consumer Key e Secret válidos
3. WordPress/WooCommerce rodando

### Erro de Autenticação DSers

```
Erro: DSers API key inválida
```

Verifique:
1. API Key é válida
2. Conta DSers está ativa
3. Permissões corretas

### Produtos não sincronizando

Verifique logs:
```bash
tail -f logs/app.log
```

## 📞 Suporte

Para problemas técnicos:
1. Verifique os logs
2. Consulte o CHANGELOG.md
3. Abra uma issue em: https://github.com/sebastisnzoth/droperagent/issues

## 📜 Licença

MIT - veja o arquivo LICENSE para mais detalhes.