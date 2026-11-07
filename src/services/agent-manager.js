/**
 * Gerenciador de Agentes e Tarefas
 */

class AgentManager {
    constructor(name, description) {
        this.name = name;
        this.description = description;
        this.status = 'idle';
        this.activeTasks = [];
        this.logs = [];
    }

    getStatus() {
        return {
            name: this.name,
            description: this.description,
            status: this.status,
            activeTasks: this.activeTasks.length,
            logs: this.logs.slice(-10)
        };
    }

    getActiveTasks() {
        return this.activeTasks;
    }

    async execute(action, data) {
        this.status = 'working';
        this.activeTasks.push({ action, data, timestamp: new Date().toISOString() });
        
        const logEntry = {
            action,
            status: 'started',
            timestamp: new Date().toISOString()
        };
        this.logs.push(logEntry);

        try {
            let result;
            
            switch (this.name) {
                case 'store-architect':
                    result = this._handleStoreAction(action, data);
                    break;
                case 'product-researcher':
                    result = this._handleProductResearch(action, data);
                    break;
                case 'dsers-operator':
                    result = this._handleDsersAction(action, data);
                    break;
                case 'pricing-engine':
                    result = this._handlePricingAction(action, data);
                    break;
                default:
                    result = { message: 'Action completed', action, data };
            }

            this.activeTasks = this.activeTasks.filter(t => t.action !== action);
            this.status = 'idle';
            
            this.logs.push({
                action,
                status: 'completed',
                timestamp: new Date().toISOString(),
                result
            });

            return result;
        } catch (error) {
            this.logs.push({
                action,
                status: 'error',
                timestamp: new Date().toISOString(),
                error: error.message
            });
            throw error;
        }
    }

    _handleStoreAction(action, data) {
        switch (action) {
            case 'create-product':
                return { id: data.sku, status: 'created', ...data };
            case 'update-settings':
                return { updated: true, settings: data };
            default:
                return { message: 'Store action completed', action, data };
        }
    }

    _handleProductResearch(action, data) {
        switch (action) {
            case 'find-products':
                return { products: [], count: 0 };
            case 'analyze-product':
                return { score: 85, margin: '35%', recommended: true };
            default:
                return { message: 'Research completed', action };
        }
    }

    _handleDsersAction(action, data) {
        switch (action) {
            case 'sync-order':
                return { synced: true, orderId: data.orderId };
            case 'get-tracking':
                return { tracking: 'AG123456789BR', estimated: '2024-01-15' };
            default:
                return { message: 'DSers action completed', action };
        }
    }

    _handlePricingAction(action, data) {
        switch (action) {
            case 'calculate':
                return {
                    price: data.cost * 1.35,
                    cost: data.cost,
                    margin: '35%',
                    breakdown: {
                        productCost: data.cost,
                        shipping: data.shipping || 0,
                        fee: (data.cost * 1.35) * 0.05,
                        tax: (data.cost * 1.35) * 0.08
                    }
                };
            default:
                return { message: 'Pricing calculated', action };
        }
    }
}

class TaskQueue {
    constructor() {
        this.queue = [];
        this.processing = [];
    }

    add(task) {
        this.queue.push({
            ...task,
            id: Date.now(),
            status: 'pending',
            createdAt: new Date().toISOString()
        });
        return this.queue.length - 1;
    }

    process() {
        if (this.queue.length === 0) return [];
        
        const task = this.queue.shift();
        task.status = 'processing';
        this.processing.push(task);
        return task;
    }

    complete(taskId, result) {
        const index = this.processing.findIndex(t => t.id === taskId);
        if (index > -1) {
            this.processing.splice(index, 1);
        }
    }

    getQueue() {
        return {
            pending: this.queue.length,
            processing: this.processing.length,
            queue: this.queue
        };
    }
}

function createAgent(name, description) {
    return new AgentManager(name, description);
}

function createTaskQueue() {
    return new TaskQueue();
}

module.exports = { createAgent, createTaskQueue, AgentManager, TaskQueue };