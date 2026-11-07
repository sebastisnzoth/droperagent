/**
 * Simple In-Memory Database Store
 * MySQL-compatible interface for testing
 */

class Storage {
    constructor() {
        this.products = [];
        this.orders = [];
        this.tasks = [];
        this.settings = { currency: 'BRL' };
        this._seedProducts();
    }

    _seedProducts() {
        this.products.push({
            id: 1,
            name: 'Demo Product',
            price: 89.90,
            stock: 100,
            status: 'published',
            created_at: new Date().toISOString()
        });
    }

    prepare(query) {
        return new QueryBuilder(this, query);
    }
}

class QueryBuilder {
    constructor(store, query) {
        this.store = store;
        this.query = query.toLowerCase();
        
        if (query.includes('create table')) {
            this.store.init();
            return { run: () => 0, get: () => null, all: () => [] };
        }
    }

    run(...args) {
        return 0;
    }

    get(...args) {
        if (this.query.includes('select count')) {
            const match = args[0]?.match(/FROM (\w+)/);
            if (match) {
                const table = match[1];
                return { count: this.store[table]?.length || 0 };
            }
        }
        if (this.query.includes('select * from tasks')) {
            return { count: this.store.tasks.length };
        }
        return null;
    }

    all(...args) {
        if (this.query.includes('select * from tasks')) {
            return this.store.tasks.map((t, i) => ({ id: i, ...t }));
        }
        return [];
    }
}

module.exports = { Storage };
