import { CacheManager } from '../services/cache/CacheManager';

interface PerformanceMetric {
    name: string;
    startTime: number;
    endTime?: number;
    duration?: number;
    metadata?: Record<string, any>;
}

class PerformanceMonitor {
    private static metrics: Map<string, PerformanceMetric> = new Map();
    private static readonly MAX_METRICS = 100;

    /**
     * Start timing a performance metric
     */
    static startTiming(name: string, metadata?: Record<string, any>): void {
        const metric: PerformanceMetric = {
            name,
            startTime: Date.now(),
            metadata,
        };

        this.metrics.set(name, metric);

        // Clean up old metrics if we have too many
        if (this.metrics.size > this.MAX_METRICS) {
            const oldestKey = this.metrics.keys().next().value;
            if (oldestKey) {
                this.metrics.delete(oldestKey);
            }
        }
    }

    /**
     * End timing a performance metric
     */
    static endTiming(name: string): number | null {
        const metric = this.metrics.get(name);
        if (!metric) {
            console.warn(`Performance metric '${name}' not found`);
            return null;
        }

        const endTime = Date.now();
        const duration = endTime - metric.startTime;

        metric.endTime = endTime;
        metric.duration = duration;

        // Log slow operations
        if (duration > 1000) {
            console.warn(`Slow operation detected: ${name} took ${duration}ms`);
        }

        return duration;
    }

    /**
     * Get performance metrics
     */
    static getMetrics(): PerformanceMetric[] {
        return Array.from(this.metrics.values()).filter(m => m.duration !== undefined);
    }

    /**
     * Clear all metrics
     */
    static clearMetrics(): void {
        this.metrics.clear();
    }

    /**
     * Monitor cache performance
     */
    static async monitorCachePerformance(): Promise<void> {
        try {
            this.startTiming('cache_stats');
            const stats = await CacheManager.getStats();
            this.endTiming('cache_stats');

            console.log('Cache Performance:', {
                totalItems: stats.totalItems,
                totalSize: `${(stats.totalSize / 1024 / 1024).toFixed(2)}MB`,
                oldestItem: stats.oldestItem,
                newestItem: stats.newestItem,
            });
        } catch (error) {
            console.error('Cache performance monitoring error:', error);
        }
    }

    /**
     * Monitor memory usage (React Native specific)
     */
    static monitorMemoryUsage(): void {
        if (__DEV__) {
            // Only monitor in development
            const memoryInfo = (global as any).performance?.memory;
            if (memoryInfo) {
                console.log('Memory Usage:', {
                    used: `${(memoryInfo.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
                    total: `${(memoryInfo.totalJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
                    limit: `${(memoryInfo.jsHeapSizeLimit / 1024 / 1024).toFixed(2)}MB`,
                });
            }
        }
    }

    /**
     * Time an async operation
     */
    static async timeAsync<T>(name: string, operation: () => Promise<T>): Promise<T> {
        this.startTiming(name);
        try {
            const result = await operation();
            this.endTiming(name);
            return result;
        } catch (error) {
            this.endTiming(name);
            throw error;
        }
    }

    /**
     * Time a synchronous operation
     */
    static timeSync<T>(name: string, operation: () => T): T {
        this.startTiming(name);
        try {
            const result = operation();
            this.endTiming(name);
            return result;
        } catch (error) {
            this.endTiming(name);
            throw error;
        }
    }
}

export default PerformanceMonitor;