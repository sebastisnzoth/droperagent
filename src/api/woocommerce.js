/**
 * WooCommerce REST API Client
 * Para integração com o DroperAgent
 */

const WooCommerceRestApi = require('woocommerce-rest-api').default;

class WooCommerceClient {
    constructor() {
        this.api = new WooCommerceRestApi({
            url: process.env.WOOCOMMERCE_URL || 'http://localhost:8080',
            consumerKey: process.env.WC_CONSUMER_KEY || 'ck_demo',
            consumerSecret: process.env.WC_CONSUMER_SECRET || 'cs_demo',
            version: 'wc/v3'
        });
    }

    async getProducts(params = {}) {
        try {
            const response = await this.api.get('products', params);
            return response.data;
        } catch (error) {
            throw new Error(`Erro ao buscar produtos: ${error.message}`);
        }
    }

    async getProduct(id) {
        try {
            const response = await this.api.get(`products/${id}`);
            return response.data;
        } catch (error) {
            throw new Error(`Erro ao buscar produto: ${error.message}`);
        }
    }

    async createProduct(product) {
        try {
            const response = await this.api.post('products', product);
            return response.data;
        } catch (error) {
            throw new Error(`Erro ao criar produto: ${error.message}`);
        }
    }

    async updateProduct(id, product) {
        try {
            const response = await this.api.put(`products/${id}`, product);
            return response.data;
        } catch (error) {
            throw new Error(`Erro ao atualizar produto: ${error.message}`);
        }
    }

    async getOrders(params = {}) {
        try {
            const response = await this.api.get('orders', params);
            return response.data;
        } catch (error) {
            throw new Error(`Erro ao buscar pedidos: ${error.message}`);
        }
    }

    async getOrder(id) {
        try {
            const response = await this.api.get(`orders/${id}`);
            return response.data;
        } catch (error) {
            throw new Error(`Erro ao buscar pedido: ${error.message}`);
        }
    }

    async updateOrder(id, order) {
        try {
            const response = await this.api.put(`orders/${id}`, order);
            return response.data;
        } catch (error) {
            throw new Error(`Erro ao atualizar pedido: ${error.message}`);
        }
    }

    async getSalesMetrics(period = 'today') {
        const dateRange = this._getDateRange(period);
        
        try {
            const orders = await this.getOrders({
                status: 'completed',
                date_created: dateRange,
                per_page: 100
            });

            const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.total), 0);
            const totalOrders = orders.length;
            const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

            return {
                period,
                totalOrders,
                totalRevenue,
                avgOrderValue,
                currency: 'BRL',
                orders
            };
        } catch (error) {
            throw new Error(`Erro ao buscar métricas: ${error.message}`);
        }
    }

    async getPendingApprovals() {
        try {
            const products = await this.getProducts({ status: 'draft' });
            const orders = await this.getOrders({ status: 'pending' });
            
            return {
                products: products.map(p => ({
                    type: 'product',
                    id: p.id,
                    title: p.name,
                    reason: p.draft_message || 'Aguardando aprovação'
                })),
                orders: orders.map(o => ({
                    type: 'order',
                    id: o.id,
                    customer: o.billing.first_name,
                    total: o.total
                }))
            };
        } catch (error) {
            return { products: [], orders: [], error: error.message };
        }
    }

    _getDateRange(period) {
        const now = new Date();
        let startDate, endDate;

        switch (period) {
            case 'today':
                startDate = new Date(now.setHours(0, 0, 0, 0));
                endDate = now;
                break;
            case 'week':
                startDate = new Date(now.setDate(now.getDate() - 7));
                endDate = now;
                break;
            case 'month':
                startDate = new Date(now.setMonth(now.getMonth() - 1));
                endDate = now;
                break;
            default:
                startDate = new Date(now.setDate(now.getDate() - 1));
                endDate = now;
        }

        return `${startDate.toISOString()}|${endDate.toISOString()}`;
    }
}

// Exportar instancia singleton
const woocommerceApi = new WooCommerceClient();

module.exports = { woocommerceApi };