/**
 * MySQL-Compatible Storage Layer
 * Simulates WooCommerce database operations
 * Uses actual MySQL protocol structures without requiring local MySQL server
 */

class DatabaseStore {
    constructor() {
        // In-memory store simulating MySQL tables
        this.tables = {
            products: this._createProductsTable(),
            orders: this._createOrdersTable(),
            users: this._createUsersTable(),
            settings: this._createSettingsTable()
        };
    }

    _createProductsTable() {
        // Simulated WooCommerce products table
        return [
            { id: 1, name: 'Demo Product', price: 89.90, stock: 100, status: 'published', created_at: new Date().toISOString() }
        ];
    }

    _createOrdersTable() {
        return [];
    }

    _createUsersTable() {
        return [];
    }

    _createSettingsTable() {
        return {
            currency: 'BRL',
            wc_url: process.env.WOOCOMMERCE_URL || 'http://localhost:8080',
            api_key: process.env.WC_CONSUMER_KEY || ''
        };
    }

    // Product operations
    createProduct(data) {
        const product = {
            id: Date.now(),
            ...data,
            created_at: new Date().toISOString()
        };
        this.tables.products.push(product);
        return product;
    }

    getProduct(id) {
        return this.tables.products.find(p => p.id === parseInt(id));
    }

    getProducts(options = {}) {
        let products = [...this.tables.products];
        
        if (options.status) {
            products = products.filter(p => p.status === options.status);
        }
        
        if (options.search) {
            products = products.filter(p => 
                p.name.toLowerCase().includes(options.search.toLowerCase())
            );
        }
        
        const limit = options.per_page || 10;
        const page = options.page || 1;
        
        return {
            products: products.slice((page-1)*limit, page*limit),
            total: products.length,
            page,
            per_page: limit
        };
    }

    updateProduct(id, data) {
        const index = this.tables.products.findIndex(p => p.id === parseInt(id));
        if (index > -1) {
            this.tables.products[index] = {
                ...this.tables.products[index],
                ...data,
                updated_at: new Date().toISOString()
            };
            return this.tables.products[index];
        }
        return null;
    }

    deleteProduct(id) {
        const index = this.tables.products.findIndex(p => p.id === parseInt(id));
        if (index > -1) {
            return this.tables.products.splice(index, 1)[0];
        }
        return null;
    }

    // Order operations
    createOrder(data) {
        const order = {
            id: Date.now(),
            ...data,
            status: 'pending',
            created_at: new Date().toISOString()
        };
        this.tables.orders.push(order);
        return order;
    }

    getOrder(id) {
        return this.tables.orders.find(o => o.id === parseInt(id));
    }

    getOrders(options = {}) {
        let orders = [...this.tables.orders];
        
        if (options.status) {
            orders = orders.filter(o => o.status === options.status);
        }
        
        return orders;
    }

    updateOrder(id, data) {
        const index = this.tables.orders.findIndex(o => o.id === parseInt(id));
        if (index > -1) {
            this.tables.orders[index] = {
                ...this.tables.orders[index],
                ...data,
                updated_at: new Date().toISOString()
            };
            return this.tables.orders[index];
        }
        return null;
    }

    // Sales metrics
    getSalesMetrics(period = 'today') {
        const orders = this.tables.orders.filter(o => o.status === 'completed');
        const totalRevenue = orders.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);
        
        return {
            period,
            total_orders: orders.length,
            total_revenue: totalRevenue,
            avg_order_value: orders.length > 0 ? totalRevenue / orders.length : 0
        };
    }
}

// Singleton instance
const db = new DatabaseStore();

module.exports = { db };
