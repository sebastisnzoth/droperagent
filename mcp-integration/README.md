# MCP Integration - AutoDrop AI

## Descripción

Este módulo proporciona la integración entre DeepSeek Harness y WooCommerce mediante el Protocolo de Contexto de Modelo (MCP).

## Endpoints Disponibles

### Productos
- `GET /mcp/products` - Listar productos
- `GET /mcp/products/{id}` - Obtener producto específico
- `POST /mcp/products` - Crear producto
- `PUT /mcp/products/{id}` - Actualizar producto

### Pedidos
- `GET /mcp/orders` - Listar pedidos
- `GET /mcp/orders/{id}` - Detalles del pedido
- `POST /mcp/orders/{id}/sync` - Sincronizar con DSers
- `POST /mcp/orders/{id}/tracking` - Actualizar tracking

### Inventario
- `GET /mcp/inventory` - Estado del inventario
- `POST /mcp/inventory/sync` - Sincronizar inventario

### Métricas
- `GET /mcp/metrics/sales` - Métricas de ventas
- `GET /mcp/metrics/approvals` - Pendientes de aprobación
- `GET /mcp/health` - Estado del sistema

## Uso con DeepSeek Harness

```javascript
// Ejemplo: Listar productos
const products = await mcp.getProducts({
    status: 'publish',
    per_page: 10
});

// Ejemplo: Crear orden de compra en DSers
const syncResult = await mcp.syncOrder(orderId);
if (syncResult.requires_approval) {
    // Esperar aprobación del usuario
}
```

## Seguridad

- Autenticación mediante API Key
- Rate limiting: 100 req/min
- Verificación HMAC de webhooks
- Logs de auditoría completos

## Variables de Entorno

- `WOOCOMMERCE_URL` - URL de la tienda WooCommerce
- `WC_CONSUMER_KEY` - Consumer Key de WooCommerce
- `WC_CONSUMER_SECRET` - Consumer Secret de WooCommerce
- `DSERS_API_KEY` - API Key de DSers (cuando esté disponible)

## Limitaciones Conocidas

1. **Pagos**: No se pueden procesar pagos automáticamente - requiere intervención del usuario
2. **DSers**: Algunas funciones requieren aprobación manual del propietario de la cuenta
3. **AliExpress**: Importación de productos requiere autorización explícita

## Despliegue

```bash
# Local
npm install
npm start

# Docker
docker build -t autodrop-mcp .
docker run -p 3001:3001 autodrop-mcp
```