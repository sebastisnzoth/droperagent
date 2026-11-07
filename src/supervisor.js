/**
 * Simple Task Supervisor - In Memory
 */

class Supervisor {
    constructor() {
        this.running = false;
        this.tasks = [];
        this.taskId = 0;
    }

    init() {
        this.tasks = [];
        console.log('Supervisor: Initialized');
    }

    createTask(type, data = {}, priority = 1) {
        this.taskId++;
        const task = {
            id: `task_${Date.now()}_${this.taskId}`,
            type,
            data,
            priority,
            status: 'PENDING',
            createdAt: new Date().toISOString(),
            retryCount: 0
        };
        this.tasks.push(task);
        return task.id;
    }

    getTask(id) {
        return this.tasks.find(t => t.id === id);
    }

    executeTask(id, executor) {
        const task = this.getTask(id);
        if (!task) return { success: false, error: 'Task not found' };

        task.status = 'RUNNING';
        task.startedAt = new Date().toISOString();

        try {
            const result = executor(task.data);
            task.status = 'VERIFIED';
            task.completedAt = new Date().toISOString();
            task.result = result;
            return { success: true, result, taskId: id };
        } catch (error) {
            task.status = 'FAILED';
            task.error = error.message;
            task.retryCount++;
            if (task.retryCount < 3) {
                task.status = 'PENDING';
            }
            return { success: false, error: error.message, taskId: id };
        }
    }

    getQueue() {
        return {
            pending: this.tasks.filter(t => t.status === 'PENDING').length,
            running: this.tasks.filter(t => t.status === 'RUNNING').length,
            verified: this.tasks.filter(t => t.status === 'VERIFIED').length,
            failed: this.tasks.filter(t => t.status === 'FAILED').length
        };
    }

    start() {
        this.running = true;
        console.log('Supervisor started');
    }

    stop() {
        this.running = false;
        console.log('Supervisor stopped');
    }

    getStatus() {
        return {
            running: this.running,
            totalTasks: this.tasks.length,
            queue: this.getQueue()
        };
    }
}

module.exports = { Supervisor };
