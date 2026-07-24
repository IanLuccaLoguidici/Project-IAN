import { Injectable } from '@nestjs/common';
import { Registry, collectDefaultMetrics, Counter, Histogram } from 'prom-client';

@Injectable()
export class MetricsService {
  private readonly registry: Registry;
  private readonly httpRequestsTotal: Counter<string>;
  private readonly httpRequestDurationSeconds: Histogram<string>;
  private readonly httpErrorsTotal: Counter<string>;

  // Legacy cache metrics (preserved for compatibility)
  private cacheHits = 0;
  private cacheMisses = 0;

  constructor() {
    this.registry = new Registry();

    // Collect Node.js process / default system metrics
    collectDefaultMetrics({ register: this.registry });

    // 1. Total Requests Counter
    this.httpRequestsTotal = new Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests processed',
      labelNames: ['method', 'route', 'status_code'],
      registers: [this.registry],
    });

    // 2. Latency Histogram
    this.httpRequestDurationSeconds = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'HTTP request duration in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
      registers: [this.registry],
    });

    // 3. Error Rate Counter
    this.httpErrorsTotal = new Counter({
      name: 'http_errors_total',
      help: 'Total number of HTTP requests resulting in an error (status >= 400)',
      labelNames: ['method', 'route', 'status_code'],
      registers: [this.registry],
    });
  }

  /**
   * Record metrics for a completed HTTP request
   */
  recordRequest(method: string, route: string, statusCode: number, durationSeconds: number): void {
    const statusStr = statusCode.toString();
    const labels = { method, route, status_code: statusStr };

    this.httpRequestsTotal.inc(labels);
    this.httpRequestDurationSeconds.observe(labels, durationSeconds);

    if (statusCode >= 400) {
      this.httpErrorsTotal.inc(labels);
    }
  }

  /**
   * Returns Prometheus formatted metrics text
   */
  async getPrometheusMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  /**
   * Returns default content type for Prometheus exporter
   */
  getPrometheusContentType(): string {
    return this.registry.contentType;
  }

  // Legacy Cache Metrics Methods
  incrementHit(): void {
    this.cacheHits++;
  }

  incrementMiss(): void {
    this.cacheMisses++;
  }

  getMetrics() {
    const totalRequests = this.cacheHits + this.cacheMisses;
    const hitRatio = totalRequests === 0 ? 0 : this.cacheHits / totalRequests;

    return {
      cacheHits: this.cacheHits,
      cacheMisses: this.cacheMisses,
      hitRatio: Number(hitRatio.toFixed(2)),
      totalRequests,
    };
  }
}
